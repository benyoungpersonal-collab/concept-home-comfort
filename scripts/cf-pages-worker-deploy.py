#!/usr/bin/env python3
# Deploys a built preview folder to Cloudflare Pages as ONE _worker.js file (Pages advanced mode) that serves every
# file of the site from memory. Use it in a Claude Code cloud session, where the proxy injects the API token into every
# api.cloudflare.com request and so breaks the normal asset-upload step (wrangler pages deploy -> 8000013).
#   python3 -I scripts/cf-pages-worker-deploy.py previews/<slug> byw-<slug>
# Creates the Pages project (production branch main) if needed. The token is never printed.
import sys, os, json, base64, mimetypes, requests
d, project = sys.argv[1], sys.argv[2]
API = 'https://api.cloudflare.com/client/v4'
H = {'Authorization': 'Bearer ' + (os.environ.get('CLOUDFLARE_API_TOKEN') or 'proxy-injected')}
acct = os.environ.get('CLOUDFLARE_ACCOUNT_ID') or requests.get(f'{API}/accounts', headers=H, timeout=60).json()['result'][0]['id']
if requests.get(f'{API}/accounts/{acct}/pages/projects/{project}', headers=H, timeout=60).status_code == 404:
    r = requests.post(f'{API}/accounts/{acct}/pages/projects', headers=H, json={'name': project, 'production_branch': 'main'}, timeout=60)
    print('created project', project, r.json().get('success'))
mimetypes.add_type('image/webp', '.webp'); mimetypes.add_type('font/woff2', '.woff2'); mimetypes.add_type('video/webm', '.webm')
files = {}
for root, _, fs in os.walk(d):
    for f in fs:
        if f.startswith('_'): continue
        p = os.path.join(root, f); rel = '/' + os.path.relpath(p, d).replace(os.sep, '/')
        ct = mimetypes.guess_type(f)[0] or 'application/octet-stream'
        if ct.startswith('text/') or ct in ('application/javascript', 'image/svg+xml', 'application/json'): ct += '; charset=utf-8'
        files[rel] = [ct, base64.b64encode(open(p, 'rb').read()).decode()]
worker = """const F = %s;
const cache = new Map();
const bytes = (b) => { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
export default { async fetch(req) {
  const url = new URL(req.url); let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  if (p === '/index.html' && url.pathname !== '/' && !url.pathname.endsWith('/')) return Response.redirect(new URL('/', url), 308);
  const f = F[p];
  const h = { 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
  if (!f) return new Response('Not found', { status: 404, headers: { ...h, 'Content-Type': 'text/plain' } });
  if (!cache.has(p)) cache.set(p, bytes(f[1]));
  const body = cache.get(p);
  h['Content-Type'] = f[0];
  h['Cache-Control'] = p.endsWith('.html') ? 'public, max-age=0, must-revalidate' : 'public, max-age=86400';
  const range = req.headers.get('Range');
  if (range && /^bytes=/.test(range)) {
    let [s, e] = range.slice(6).split('-'); s = s === '' ? body.length - +e : +s; e = (e === '' || s === body.length - +e && range.slice(6).startsWith('-')) ? body.length - 1 : Math.min(+e, body.length - 1);
    return new Response(body.slice(s, e + 1), { status: 206, headers: { ...h, 'Content-Range': `bytes ${s}-${e}/${body.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': String(e - s + 1) } });
  }
  return new Response(req.method === 'HEAD' ? null : body, { headers: { ...h, 'Accept-Ranges': 'bytes' } });
} };
""" % json.dumps(files)
print('worker size', round(len(worker) / 1e6, 2), 'MB,', len(files), 'files')
form = [('manifest', (None, '{}')), ('branch', (None, 'main')), ('_worker.js', ('_worker.js', worker.encode(), 'application/javascript'))]
r = requests.post(f'{API}/accounts/{acct}/pages/projects/{project}/deployments', headers=H, files=form, timeout=600)
j = r.json()
if not j.get('success'): print('FAILED', r.status_code, j.get('errors')); sys.exit(1)
res = j['result']; print('deployed', res['id'], res['url'])
