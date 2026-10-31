#!/usr/bin/env node
/*
  build-preview.mjs: builds a homepage preview for one prospect from one data file.

      node scripts/build-preview.mjs prospects/NAME.json      -> writes previews/NAME/

  What it does:
  1. Reads the data file (prospects/README.md lists every field).
  2. Fills template/homepage.html. A section whose data is missing is left out entirely:
     no placeholder text, no empty boxes.
  3. Copies only the files the page needs (CSS, JS, fonts, the photos it uses, the video,
     the link-preview image, the logo if there is one) into previews/NAME/.
  4. Writes _headers (noindex) and robots.txt for Cloudflare Pages.
  5. Refuses to finish if anything is unfilled or mentions Claude.

  No dependencies. Node 18+.
*/
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname, basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = process.argv[2];
if (!dataPath) { console.error('Usage: node scripts/build-preview.mjs prospects/NAME.json'); process.exit(1); }
const raw = JSON.parse(readFileSync(dataPath, 'utf8'));
const slug = String(raw.slug || basename(dataPath, '.json')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const OUT = join(ROOT, 'previews', slug);

/* ---------- 1. Data: required fields, then everything derived ---------- */
const str = (v) => (v === undefined || v === null ? '' : String(v).trim());
const required = ['name', 'phone', 'city'];
const missing = required.filter((k) => !str(raw[k]));
if (missing.length) { console.error(`Missing required field(s) in ${dataPath}: ${missing.join(', ')}`); process.exit(1); }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const listWords = (arr) => arr.length <= 1 ? arr.join('') : arr.length === 2 ? `${arr[0]} and ${arr[1]}` : `${arr.slice(0, -1).join(', ')}, and ${arr[arr.length - 1]}`;
const hueOf = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

const name = str(raw.name);
const city = str(raw.city);
const digits = str(raw.phone).replace(/\D/g, '');
if (digits.length < 10) { console.error('phone needs 10 digits, got: ' + raw.phone); process.exit(1); }
const tel = '+' + (digits.length === 10 ? '1' + digits : digits);
const phonePretty = digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : str(raw.phone);
const rating = str(raw.googleRating) === '' ? null : Number(raw.googleRating);
if (rating !== null && !(rating >= 1 && rating <= 5)) { console.error('googleRating must be between 1 and 5'); process.exit(1); }
const reviewCount = str(raw.reviewCount) === '' ? null : Number(raw.reviewCount);
const ratingIs5 = rating !== null && rating >= 5;
const googleReviewsUrl = str(raw.googleReviewsUrl);
const writeReviewUrl = str(raw.writeReviewUrl);
const hasRating = rating !== null && googleReviewsUrl !== '';
if (rating !== null && !googleReviewsUrl) console.warn('note: googleRating is set but googleReviewsUrl is missing, so the rating is hidden.');
const year = new Date().getFullYear();

const areas = (Array.isArray(raw.serviceAreas) ? raw.serviceAreas : []).map(str).filter(Boolean);
const areaChips = areas.map((a) => ({ name: a, hq: a.toLowerCase() === city.toLowerCase() }));
const areaSummary = areas.length === 0 ? city : areas.length <= 4 ? listWords(areas) : `${areas.slice(0, 3).join(', ')}, and ${areas.length - 3} more cities`;

const icons = [['heat', 'i-flame'], ['furnace', 'i-flame'], ['cool', 'i-snowflake'], ['air cond', 'i-snowflake'], ['a/c', 'i-snowflake'], ['ac ', 'i-snowflake'], ['plumb', 'i-droplet'], ['water heater', 'i-waterheater'], ['drain', 'i-drain'], ['air quality', 'i-wind'], ['duct', 'i-wind'], ['electric', 'i-zap'], ['maint', 'i-wrench'], ['tune', 'i-wrench'], ['solar', 'i-sun'], ['insul', 'i-home']];
const iconFor = (n) => { const l = (n + ' ').toLowerCase(); for (const [k, v] of icons) if (l.includes(k)) return v; return 'i-sparkle'; };
const toneFor = (n) => /cool|a\/c|\bac\b|air cond|quality|duct/i.test(n) ? 'cool' : /plumb|water|drain|sewer/i.test(n) ? 'navy' : '';
const services = (Array.isArray(raw.services) ? raw.services : []).map((s) => typeof s === 'string' ? { name: s } : s).filter((s) => s && str(s.name)).map((s) => ({
  name: str(s.name), nameLower: str(s.name).toLowerCase(), blurb: str(s.blurb), icon: iconFor(s.name), tone: toneFor(s.name),
  anchor: 'svc-' + str(s.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  sub: (Array.isArray(s.sub) ? s.sub : []).map(str).filter(Boolean),
}));
const serviceSummary = services.length ? listWords(services.slice(0, 3).map((s) => s.nameLower)) : 'home comfort';

const reviews = (Array.isArray(raw.reviews) ? raw.reviews : []).filter((r) => r && str(r.quote)).map((r) => {
  const n = str(r.name) || 'Google reviewer';
  return { name: n, quote: str(r.quote), initial: n.charAt(0).toUpperCase(), hue: hueOf(n), meta: [str(r.city), str(r.when)].filter(Boolean).join(' · ') };
});
const specials = (Array.isArray(raw.specials) ? raw.specials : []).filter((s) => s && str(s.amount) && str(s.title)).map((s) => ({ amount: str(s.amount), title: str(s.title), text: str(s.text), fine: str(s.fine) }));
const faqs = (Array.isArray(raw.faqs) ? raw.faqs : []).filter((f) => f && str(f.q) && str(f.a)).map((f, i) => ({ q: str(f.q), a: str(f.a), n: i + 1 }));
const locations = (Array.isArray(raw.locations) ? raw.locations : []).filter((l) => l && str(l.name)).map((l) => ({ name: str(l.name), address: str(l.address), cityLine: str(l.cityLine) }));

const logo = str(raw.logo);
const logoExt = logo ? extname(logo).toLowerCase() : '';
if (logo && !['.svg', '.png', '.jpg', '.jpeg', '.webp'].includes(logoExt)) { console.error('logo must be an .svg, .png, .jpg, or .webp file'); process.exit(1); }
const logoSrc = logo ? `images/logo${logoExt}` : '';
const brand = str(raw.colors && raw.colors.brand);
const navy = str(raw.colors && raw.colors.navy);
const hex = /^#[0-9a-fA-F]{6}$/;
for (const [k, v] of [['colors.brand', brand], ['colors.navy', navy]]) if (v && !hex.test(v)) { console.error(`${k} must look like #RRGGBB, got ${v}`); process.exit(1); }
/* Brand colors: the site uses the brand color for buttons and headings, plus darker steps for text and hover.
   A custom color is darkened step by step until white text on it (and it on white) reads at 4.5:1, so any brand color passes contrast. */
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrastWhite = (rgb) => 1.05 / (lum(rgb) + 0.05);
const darken = (rgb, f) => rgb.map((v) => v * (1 - f));
const darkenUntil = (hexColor, ratio) => { let rgb = toRgb(hexColor); let n = 0; while (contrastWhite(rgb) < ratio && n++ < 40) rgb = darken(rgb, 0.04); return toHex(rgb); };
const mix = (hexColor, f) => toHex(toRgb(hexColor).map((v) => v + (255 - v) * f));
let brandCss = '';
if (brand) {
  const strong = darkenUntil(brand, 4.5), deep = darkenUntil(brand, 5.5), hover = darkenUntil(brand, 6);
  brandCss += `--c-brand:${brand};--c-brand-strong:${strong};--c-brand-deep:${deep};--c-brand-hover:${hover};--c-brand-tint:${mix(brand, 0.86)};--c-brand-light:${mix(brand, 0.55)};`;
}
if (navy) { const n = darkenUntil(navy, 7); brandCss += `--c-navy:${n};--c-navy-2:${n};--c-on-dark-soft:#E3E9F2;`; }
if (brandCss) brandCss = `:root{${brandCss}}`;
const years = str(raw.yearsInBusiness) === '' ? null : Number(raw.yearsInBusiness);
const license = str(raw.license);
const insured = raw.insured !== false;
const upfront = raw.upfrontPricing !== false;
const guarantee = raw.guarantee !== false;
const hours = str(raw.hours);
const email = str(raw.email);
const shortName = str(raw.shortName) || name;
const tagline = str(raw.tagline);
const initial = shortName.charAt(0).toUpperCase();
const previewUrl = (str(raw.previewUrl) || `https://byw-${slug}.pages.dev/`).replace(/\/?$/, '/');
const titleTag = `${name} | ${city} HVAC${ratingIs5 ? ' | 5-Star Service' : ''}`;
const lead = str(raw.lead) || `Same-day service and upfront pricing for homes in ${areaSummary}. If it heats, cools, or runs water, we fix it fast.`;
const brandColor = brand || '#E4572E';
const faviconHref = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${brandColor}"/><text x="32" y="44" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="36" fill="#fff">${esc(initial)}</text></svg>`)}`;

const data = {
  name, nameDot: /[.!?]$/.test(name) ? name : name + '.', shortName, tagline, initial, city, year, tel, phonePretty, previewUrl, titleTag, lead,
  metaDescription: str(raw.description) || `${name}: ${serviceSummary} for homeowners in ${areaSummary}. Call ${phonePretty}.`,
  eyebrow: str(raw.eyebrow) || `${cap(serviceSummary)} for homeowners in ${city} and nearby`,
  headline: str(raw.headline) ? esc(raw.headline) : 'A comfortable home, <span class="accent">without the runaround.</span>',
  themeColor: navy ? darkenUntil(navy, 7) : '#14213D', brandCss, faviconHref,
  hasRating, ratingText: rating !== null ? rating.toFixed(1) : '', reviewCount, starsLabel: rating !== null ? `Rated ${rating.toFixed(1)} out of 5` : '', googleReviewsUrl, writeReviewUrl,
  areas, areaChips, areaSummary, hasAreas: areas.length > 0,
  services, hasServices: services.length > 0, serviceSummary,
  reviews, hasReviews: reviews.length > 0,
  specials, hasSpecials: specials.length > 0,
  faqs, hasFaqs: faqs.length > 0,
  locations, hasLocations: locations.length > 0, oneLocation: locations.length === 1,
  hasLogo: !!logo, logoSrc,
  license, hasLicense: !!license, yearsInBusiness: years, hasYears: years !== null && years > 0, sinceYear: years ? year - years : '',
  insured, upfront, guarantee, hasTrust: !!license || insured || (years !== null && years > 0) || upfront || guarantee,
  hours, hasHours: !!hours, email, hasEmail: !!email,
};

/* ---------- 2. Tiny template engine: {{a.b}} escaped, {{{raw}}}, {{#if}} {{else}} {{/if}}, {{#each}} {{this}} {{/each}}, {{> partial}} ---------- */
function get(ctx, path) {
  if (path === 'this') return ctx.this !== undefined ? ctx.this : ctx;
  let cur = ctx;
  for (const key of path.split('.')) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur === 'object' && key in cur) cur = cur[key];
    else if (cur.__parent) return get(cur.__parent, path);
    else return undefined;
  }
  return cur;
}
const truthy = (v) => Array.isArray(v) ? v.length > 0 : !!v;
function vars(s, ctx) {
  return s.replace(/\{\{\{([\w.@]+)\}\}\}/g, (m, p) => { const v = get(ctx, p); return v === undefined || v === null ? '' : String(v); })
          .replace(/\{\{([\w.@]+)\}\}/g, (m, p) => { const v = get(ctx, p); return v === undefined || v === null ? '' : esc(v); });
}
function splitElse(body) {
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    if (body.startsWith('{{#', i)) depth++;
    else if (body.startsWith('{{/', i)) depth--;
    else if (depth === 0 && body.startsWith('{{else}}', i)) return [body.slice(0, i), body.slice(i + 8)];
  }
  return [body, ''];
}
function expand(tpl, ctx) {
  let out = '', pos = 0;
  while (pos < tpl.length) {
    const open = tpl.indexOf('{{#', pos);
    if (open === -1) { out += vars(tpl.slice(pos), ctx); break; }
    out += vars(tpl.slice(pos, open), ctx);
    const head = tpl.slice(open).match(/^\{\{#(if|each) ([\w.@]+)\}\}/);
    if (!head) throw new Error('Bad block near: ' + tpl.slice(open, open + 40));
    let depth = 1, i = open + head[0].length, close = -1;
    while (i < tpl.length) {
      if (tpl.startsWith('{{#', i)) depth++;
      else if (tpl.startsWith('{{/', i)) { depth--; if (depth === 0) { close = i; break; } }
      i++;
    }
    if (close === -1) throw new Error('Unclosed block ' + head[0]);
    const closeEnd = tpl.indexOf('}}', close) + 2;
    const [yes, no] = splitElse(tpl.slice(open + head[0].length, close));
    const val = get(ctx, head[2]);
    if (head[1] === 'if') out += expand(truthy(val) ? yes : no, ctx);
    else if (Array.isArray(val) && val.length) out += val.map((item, idx) => expand(yes, { ...(item && typeof item === 'object' ? item : {}), this: item, __parent: ctx, '@index': idx })).join('');
    else out += expand(no, ctx);
    pos = closeEnd;
  }
  return out;
}

/* ---------- 3. Render ---------- */
const partials = Object.fromEntries(readdirSync(join(ROOT, 'partials')).filter((f) => f.endsWith('.html')).map((f) => [f.replace(/\.html$/, ''), readFileSync(join(ROOT, 'partials', f), 'utf8').trim()]));
const tpl = readFileSync(join(ROOT, 'template', 'homepage.html'), 'utf8').replace(/\{\{> ([\w-]+)\}\}/g, (m, p) => { if (!(p in partials)) throw new Error('Missing partial ' + p); return partials[p]; });
let html = expand(tpl, data).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
const unfilled = html.match(/\{\{[^}]*\}\}/g);
if (unfilled) { console.error('Unfilled template tags: ' + [...new Set(unfilled)].join(' ')); process.exit(1); }
if (/claude/i.test(html)) { console.error('The page mentions Claude. Remove that from the data file.'); process.exit(1); }
if (/\u2014/.test(html)) { console.error('The page contains an em dash. Replace it in the data file.'); process.exit(1); }

/* ---------- 4. Copy only what the page uses ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const copy = (from, to = from) => { mkdirSync(dirname(join(OUT, to)), { recursive: true }); copyFileSync(join(ROOT, from), join(OUT, to)); return 1; };
let copied = 0;
const refs = new Set([...html.matchAll(/\b(?:src|href|poster|imagesrcset|srcset)="([^"]+)"/g)].flatMap((m) => m[1].startsWith('data:') ? [] : m[1].split(',').map((p) => p.trim().split(/\s+/)[0].split('?')[0])));
for (const ref of refs) {
  if (!ref || /^(https?:|tel:|sms:|mailto:|#|data:)/.test(ref) || ref.endsWith('.html') || ref.startsWith('images/logo')) continue;
  if (!existsSync(join(ROOT, ref))) { console.error('Referenced file is missing: ' + ref); process.exit(1); }
  copied += copy(ref);
}
for (const f of readdirSync(join(ROOT, 'fonts'))) copied += copy(`fonts/${f}`);
for (const v of [...html.matchAll(/data-video="([^"]+)"/g)].map((m) => m[1])) for (const ext of ['mp4', 'webm']) if (existsSync(join(ROOT, `${v}.${ext}`))) copied += copy(`${v}.${ext}`);
copied += copy('images/og-family-1200x630.jpg', 'images/og.jpg');
if (logo) {
  const from = resolve(dirname(dataPath), logo);
  if (!existsSync(from)) { console.error('Logo not found: ' + from); process.exit(1); }
  mkdirSync(join(OUT, 'images'), { recursive: true }); copyFileSync(from, join(OUT, logoSrc)); copied++;
}
writeFileSync(join(OUT, 'index.html'), html);
writeFileSync(join(OUT, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n/images/*\n  Cache-Control: public, max-age=604800\n');
writeFileSync(join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

const hidden = Object.entries({ rating: data.hasRating, 'service areas': data.hasAreas, services: data.hasServices, reviews: data.hasReviews, specials: data.hasSpecials, FAQ: data.hasFaqs, locations: data.hasLocations, logo: data.hasLogo, license: data.hasLicense, 'years in business': data.hasYears, hours: data.hasHours, email: data.hasEmail }).filter(([, v]) => !v).map(([k]) => k);
console.log(`Built previews/${slug}/ (${copied} files copied).`);
console.log(`Title: ${titleTag}`);
if (hidden.length) console.log(`Left out because the data file has no value: ${hidden.join(', ')}.`);
console.log(`Preview URL it expects: ${previewUrl}  (Cloudflare project name: byw-${slug})`);
