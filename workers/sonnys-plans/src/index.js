// Sonny's Air Conditioning: "Upload Your Plans" upload Worker (preview).
//
// Flow:
//   1. POST /api/start     The form sends its fields and the list of files (name, size).
//                          The Worker saves the form in R2, starts one multipart upload per file,
//                          and returns presigned part URLs so the browser uploads straight to R2.
//   2. Browser PUTs each part to R2 (bucket CORS allows only the preview site).
//   3. POST /api/complete  The Worker finishes each multipart upload, checks the files,
//                          and emails the details plus private download links through Resend.
//   4. GET /d/<key>        Signed download link. Valid for 90 days (the bucket deletes files after 90 days).
//
// Secrets (set in the Cloudflare dashboard, never in this repo):
//   R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, RESEND_API_KEY, LINK_SECRET

import { AwsClient } from 'aws4fetch';

const MB = 1024 * 1024;
const MAX_FILES = 20;
const MAX_FILE_BYTES = 10 * 1024 * MB;
const PART_URL_TTL = 12 * 60 * 60;          // presigned part URLs: 12 hours
const LINK_TTL_DAYS = 90;                   // download links: matches the bucket's 90-day delete rule
const PROJECT_TYPES = ['New construction', 'Housing tract', 'Install or changeout', 'Other'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const cors = allowed.includes(origin)
      ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
      : { Vary: 'Origin' };

    try {
      if (url.pathname.startsWith('/d/') && (request.method === 'GET' || request.method === 'HEAD')) {
        return await download(request, env, url);
      }
      if (url.pathname.startsWith('/api/')) {
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
        if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
        if (!allowed.includes(origin)) return json({ error: 'Not allowed from this site' }, 403, cors);
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') return json({ error: 'Bad request' }, 400, cors);
        if (url.pathname === '/api/start') return await start(body, env, cors);
        if (url.pathname === '/api/complete') return await complete(body, env, cors, url);
        if (url.pathname === '/api/abort') return await abort(body, env, cors);
      }
      return new Response("Sonny's Air Conditioning plan uploads.", { status: 404, headers: { 'Content-Type': 'text/plain' } });
    } catch (err) {
      console.error(err && err.stack || err);
      return json({ error: 'Something went wrong on our end. Please call (559) 392-0743.' }, 500, cors);
    }
  },
};

// ---------- API ----------

async function start(body, env, cors) {
  // Honeypot: bots fill the hidden "website" field. Pretend it worked.
  if (clean(body.website, 200)) return json({ id: 'ok', token: 'ok', files: [], bot: true }, 200, cors);

  const form = {
    name: clean(body.name, 120),
    mobile: clean(body.mobile, 40),
    company: clean(body.company, 160),
    address: clean(body.address, 240),
    location: clean(body.location, 240),
    type: clean(body.type, 40),
    notes: clean(body.notes, 4000, true),
  };
  const missing = [];
  if (!form.name) missing.push('your name');
  if (!form.mobile || form.mobile.replace(/\D/g, '').length < 10) missing.push('a mobile number');
  if (!form.company) missing.push('your company name');
  if (!form.location) missing.push('the project location');
  if (!PROJECT_TYPES.includes(form.type)) missing.push('the project type');
  if (missing.length) return json({ error: 'Please add ' + missing.join(', ') + '.' }, 400, cors);

  const list = Array.isArray(body.files) ? body.files : [];
  if (list.length > MAX_FILES) return json({ error: `Up to ${MAX_FILES} files at a time, please.` }, 400, cors);
  for (const f of list) {
    const size = Number(f && f.size);
    const name = String(f && f.name || '');
    if (!/\.pdf$/i.test(name)) return json({ error: `"${name.slice(0, 80)}" is not a PDF.` }, 400, cors);
    if (!Number.isFinite(size) || size <= 0) return json({ error: `"${name.slice(0, 80)}" looks empty.` }, 400, cors);
    if (size > MAX_FILE_BYTES) return json({ error: `"${name.slice(0, 80)}" is over 10 GB. Please call us for very large sets.` }, 400, cors);
  }

  const id = submissionId();
  const s3 = s3Client(env);
  const files = [];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const name = String(list[i].name).slice(0, 200);
    const size = Number(list[i].size);
    const key = `plans/${id}/${String(i + 1).padStart(2, '0')}-${safeName(name)}`;
    const uploadId = await createMultipart(s3, env, key, name);
    const partSize = pickPartSize(size);
    const count = Math.ceil(size / partSize);
    const urls = [];
    for (let n = 1; n <= count; n++) urls.push(await presignPart(s3, env, key, uploadId, n));
    files.push({ key, name, size, uploadId });
    out.push({ key, uploadId, partSize, urls });
  }

  const record = { id, created: new Date().toISOString(), status: 'uploading', form, files };
  await env.PLANS.put(`submissions/${id}.json`, JSON.stringify(record, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });
  return json({ id, token: await hmac(env, 'c:' + id), files: out }, 200, cors);
}

async function complete(body, env, cors, url) {
  if (body.token === 'ok' && body.id === 'ok') return json({ ok: true }, 200, cors); // honeypot path
  const id = String(body.id || '');
  if (!/^[0-9]{8}-[0-9]{4}-[a-f0-9]{8}$/.test(id) || !(await safeEqual(body.token, await hmac(env, 'c:' + id)))) {
    return json({ error: 'This upload has expired. Please try again.' }, 403, cors);
  }
  const obj = await env.PLANS.get(`submissions/${id}.json`);
  if (!obj) return json({ error: 'This upload has expired. Please try again.' }, 404, cors);
  const record = await obj.json();
  if (record.status === 'sent') return json({ ok: true }, 200, cors);

  const s3 = s3Client(env);
  const parts = Array.isArray(body.files) ? body.files : [];
  for (let i = 0; i < record.files.length; i++) {
    const f = record.files[i];
    const p = parts[i] && Array.isArray(parts[i].parts) ? parts[i].parts : null;
    if (!p || !p.length) return json({ error: `"${f.name}" did not finish uploading.` }, 400, cors);
    const partList = p.map((x) => ({ n: Number(x.n), etag: String(x.etag || '').replace(/[^A-Za-z0-9"\-]/g, '') }))
      .sort((a, b) => a.n - b.n);
    await completeMultipart(s3, env, f.key, f.uploadId, partList);
    const head = await env.PLANS.head(f.key);
    if (!head || head.size !== f.size) return json({ error: `"${f.name}" did not upload completely. Please try again.` }, 400, cors);
  }

  const base = env.PUBLIC_URL || url.origin;
  const exp = Math.floor(Date.now() / 1000) + LINK_TTL_DAYS * 86400;
  for (const f of record.files) {
    f.link = `${base}/d/${f.key.split('/').map(encodeURIComponent).join('/')}?e=${exp}&s=${await hmac(env, `d:${f.key}:${exp}`)}`;
  }

  const sent = await sendEmail(env, record, exp);
  record.status = sent.ok ? 'sent' : 'email-failed';
  record.completed = new Date().toISOString();
  record.email = sent.ok ? { id: sent.id } : { error: sent.error };
  await env.PLANS.put(`submissions/${id}.json`, JSON.stringify(record, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });
  if (!sent.ok) {
    return json({ error: 'Your files are uploaded, but our notice did not go out. Please call (559) 392-0743 so we see them.' }, 502, cors);
  }
  return json({ ok: true }, 200, cors);
}

async function abort(body, env, cors) {
  const id = String(body.id || '');
  if (!/^[0-9]{8}-[0-9]{4}-[a-f0-9]{8}$/.test(id) || !(await safeEqual(body.token, await hmac(env, 'c:' + id)))) {
    return json({ ok: true }, 200, cors);
  }
  const obj = await env.PLANS.get(`submissions/${id}.json`);
  if (!obj) return json({ ok: true }, 200, cors);
  const record = await obj.json();
  if (record.status === 'sent') return json({ ok: true }, 200, cors);
  const s3 = s3Client(env);
  for (const f of record.files) {
    await s3.fetch(objectUrl(env, f.key) + `?uploadId=${encodeURIComponent(f.uploadId)}`, { method: 'DELETE' }).catch(() => {});
  }
  await env.PLANS.delete(`submissions/${id}.json`);
  return json({ ok: true }, 200, cors);
}

async function download(request, env, url) {
  const key = url.pathname.slice(3).split('/').map(decodeURIComponent).join('/');
  const exp = Number(url.searchParams.get('e'));
  const sig = url.searchParams.get('s') || '';
  if (!key.startsWith('plans/') || !Number.isFinite(exp) || exp < Date.now() / 1000 ||
      !(await safeEqual(sig, await hmac(env, `d:${key}:${exp}`)))) {
    return new Response('This link is not valid or has expired.', { status: 403, headers: { 'Content-Type': 'text/plain' } });
  }
  const obj = request.method === 'HEAD'
    ? await env.PLANS.head(key)
    : await env.PLANS.get(key, { range: request.headers, onlyIf: request.headers });
  if (!obj) return new Response('This file is no longer stored.', { status: 404, headers: { 'Content-Type': 'text/plain' } });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('Content-Type', 'application/pdf');
  headers.set('ETag', obj.httpEtag);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  let name = key.split('/').pop();
  try { if (obj.customMetadata && obj.customMetadata.filename) name = decodeURIComponent(obj.customMetadata.filename); } catch (e) {}
  headers.set('Content-Disposition', `attachment; filename="${name.replace(/[^\x20-\x7e]|"/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`);

  if (request.method === 'HEAD') { headers.set('Content-Length', String(obj.size)); return new Response(null, { headers }); }
  if (!('body' in obj) || !obj.body) return new Response(null, { status: 304, headers });
  let status = 200;
  if (obj.range && request.headers.get('Range')) {
    const r = obj.range;
    const startAt = 'offset' in r ? r.offset : ('suffix' in r ? obj.size - r.suffix : 0);
    const len = 'length' in r && r.length !== undefined ? r.length : obj.size - startAt;
    headers.set('Content-Range', `bytes ${startAt}-${startAt + len - 1}/${obj.size}`);
    headers.set('Content-Length', String(len));
    status = 206;
  } else {
    headers.set('Content-Length', String(obj.size));
  }
  return new Response(obj.body, { status, headers });
}

// ---------- R2 (S3 API) ----------

function s3Client(env) {
  return new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  });
}

function objectUrl(env, key) {
  return `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com/${env.BUCKET_NAME}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

async function createMultipart(s3, env, key, originalName) {
  const res = await s3.fetch(objectUrl(env, key) + '?uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf', 'x-amz-meta-filename': encodeURIComponent(originalName) },
  });
  const text = await res.text();
  const m = text.match(/<UploadId>([^<]+)<\/UploadId>/);
  if (!res.ok || !m) throw new Error(`CreateMultipartUpload failed ${res.status}: ${text.slice(0, 300)}`);
  return m[1];
}

async function presignPart(s3, env, key, uploadId, n) {
  const u = `${objectUrl(env, key)}?partNumber=${n}&uploadId=${encodeURIComponent(uploadId)}&X-Amz-Expires=${PART_URL_TTL}`;
  const signed = await s3.sign(u, { method: 'PUT', aws: { signQuery: true } });
  return signed.url;
}

async function completeMultipart(s3, env, key, uploadId, parts) {
  const xml = '<CompleteMultipartUpload>' +
    parts.map((p) => `<Part><PartNumber>${p.n}</PartNumber><ETag>${p.etag}</ETag></Part>`).join('') +
    '</CompleteMultipartUpload>';
  const res = await s3.fetch(`${objectUrl(env, key)}?uploadId=${encodeURIComponent(uploadId)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/xml' }, body: xml,
  });
  const text = await res.text();
  if (!res.ok || /<Error>/.test(text)) {
    // Already completed (retry after a dropped response) is fine if the object is there.
    if (await env.PLANS.head(key)) return;
    throw new Error(`CompleteMultipartUpload failed ${res.status}: ${text.slice(0, 300)}`);
  }
}

function pickPartSize(size) {
  // R2 wants every part but the last to be the same size, at least 5 MiB, and at most 10,000 parts.
  let part = 16 * MB;
  while (Math.ceil(size / part) > 400) part *= 2;
  return part;
}

// ---------- Email ----------

async function sendEmail(env, r, exp) {
  const f = r.form;
  const until = new Date(exp * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
  const rows = [
    ['Name', f.name], ['Mobile', f.mobile], ['Company', f.company], ['Business address', f.address || 'Not given'],
    ['Project location', f.location], ['Project type', f.type], ['Notes', f.notes || 'None'],
  ];
  const fileRows = r.files.length
    ? r.files.map((x) => `<tr><td style="padding:10px 0;border-top:1px solid #e3e7ec"><a href="${esc(x.link)}" style="color:#0077B6;font-weight:700;text-decoration:none">${esc(x.name)}</a><br><span style="color:#5b6672;font-size:13px">${fmtSize(x.size)}</span></td></tr>`).join('')
    : '<tr><td style="padding:10px 0;color:#5b6672">No files attached. Call them for the plans.</td></tr>';
  const telDigits = f.mobile.replace(/[^\d+]/g, '');

  const html = `<!doctype html><html><body style="margin:0;background:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#111a22">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0B1320;padding:20px 24px;color:#ffffff"><div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#8DDBE7">Sonny's Air Conditioning</div>
<div style="font-size:22px;font-weight:700;margin-top:6px">New Plans From ${esc(f.company)}</div></td></tr>
<tr><td style="padding:20px 24px">
<p style="margin:0 0 16px;font-size:15px;line-height:1.5">${esc(f.name)} sent ${r.files.length === 1 ? 'a plan set' : r.files.length ? r.files.length + ' files' : 'a project'} for <b>${esc(f.location)}</b>. <a href="tel:${esc(telDigits)}" style="color:#0077B6;font-weight:700">Call ${esc(f.mobile)}</a></p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.45">
${rows.map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;color:#5b6672;vertical-align:top;white-space:nowrap;border-top:1px solid #e3e7ec">${k}</td><td style="padding:8px 0;border-top:1px solid #e3e7ec;white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}
</table>
<h2 style="font-size:16px;margin:24px 0 4px">Plan Files</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${fileRows}</table>
<p style="margin:16px 0 0;font-size:12px;color:#5b6672;line-height:1.5">Private links. They work until ${until}. Files are deleted after that, so save anything you need to keep.</p>
</td></tr>
<tr><td style="padding:14px 24px;background:#f7f9fb;font-size:12px;color:#5b6672">Preview test: sent to Ben, not to George. Submission ${esc(r.id)}.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `New plans from ${f.company}`, '',
    ...rows.map(([k, v]) => `${k}: ${v}`), '',
    'Plan files:',
    ...(r.files.length ? r.files.map((x) => `- ${x.name} (${fmtSize(x.size)})\n  ${x.link}`) : ['- None attached']), '',
    `Private links. They work until ${until}.`,
    `Preview test: sent to Ben, not to George. Submission ${r.id}.`,
  ].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: [env.TO_EMAIL],
      subject: `New Plans: ${f.company}, ${f.type}, ${f.location}`.slice(0, 200),
      html, text,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { console.error('Resend error', res.status, JSON.stringify(data)); return { ok: false, error: `${res.status} ${data.message || ''}`.trim() }; }
  return { ok: true, id: data.id };
}

// ---------- helpers ----------

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function clean(v, max, multiline) {
  if (typeof v !== 'string') return '';
  let s = v.replace(/\r\n?/g, '\n');
  s = multiline ? s.replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
  return s.trim().slice(0, max);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function safeName(name) {
  const base = name.replace(/\.pdf$/i, '').normalize('NFKD').replace(/[^\w.\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 100);
  return (base || 'plans') + '.pdf';
}

function fmtSize(b) {
  return b >= 1024 * MB ? (b / 1024 / MB).toFixed(2) + ' GB' : b >= MB ? (b / MB).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
}

function submissionId() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const rand = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}-${rand}`;
}

async function hmac(env, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.LINK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
