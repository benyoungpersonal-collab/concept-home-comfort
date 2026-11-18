#!/usr/bin/env node
/* Link preview picture for any site: its homepage on a laptop and a phone, 1200x630 JPG under 300 KB.

   What it makes (the same layout for every site):
   - Laptop: the first screen of the homepage at 1440x900 (top of the page, after the motion has settled).
   - Phone: the page at 390x844 (3x), scrolled to the section set in scripts/share-image.json (for most sites the
     Services headline plus the first two photo cards), after the scroll animations have finished. Only the page
     itself: no clock, battery, status bar, or address bar. The sticky bottom bar (Call / Book / Text), chat
     bubbles, "Demo" tags, and cookie notices are hidden; the solid site header with the logo stays on top.
     The run fails if the section does not fit, so a phone never shows cut-off cards.
   - The phone overlaps the laptop's front right corner, in the same thin iPhone-style frame as benyoungwebdesign.com
     (.mini-laptop and .mini-phone--overlap there), on a soft gradient in the site's darkest brand color (by default
     the footer's background, or pass --bg). No words added. Both devices sit well inside the picture.

   Usage (from the repo root):
     node scripts/share-image.cjs --site pinwheel        one site from scripts/share-image.json (see its _readme)
     node scripts/share-image.cjs --site all             every site in the config
   For each site it serves the repo locally, makes images/og-share-YYYY-MM-DD.jpg (adds -v2, -v3 when that name is
   taken, so phones never show an old cached picture), and points the site's pages at it (og:image, og:image:width,
   og:image:height, og:image:alt, twitter:image, twitter:image:alt). Client sites ("client": true) only get the
   picture, in qa/share/, for Ben to see first. Prospect previews ("preview": slug) are built first
   (node scripts/build-preview.mjs prospects/SLUG.json); the picture is kept in prospects/share/SLUG/ and every
   rebuild uses it.

   One-off use without the config (phone shows the top of the page unless you pass --phone-top/--phone-bottom):
     node scripts/share-image.cjs --url URL --out FILE.jpg [--bg "#172E18"] [--phone-top "#services h2" --phone-bottom "#services .card:nth-of-type(2)"]
     node scripts/share-image.cjs --tags-only --image-url https://.../FILE.jpg --name "Business Name" --html *.html

   Needs Node 18+, Playwright, and Python 3 with Pillow for the JPG step. */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CONFIG = path.join(__dirname, 'share-image.json');
const W = 1200, H = 630, MAX_BYTES = 300 * 1024;
const PHONE = { width: 390, height: 844, scale: 3 };
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const parseArgs = (a) => {
  const o = { html: [] };
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (k === '--html') { while (a[i + 1] && !a[i + 1].startsWith('--')) o.html.push(a[++i]); }
    else if (k.startsWith('--')) o[k.slice(2)] = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true;
  }
  return o;
};

/* ---------- local server of the repo root (so a site is shot exactly as it is in the repo) ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon', '.txt': 'text/plain' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      let f = path.join(ROOT, p);
      if (!f.startsWith(ROOT)) { rsp.writeHead(403); return rsp.end(); }
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      else if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
      if (!fs.existsSync(f)) { rsp.writeHead(404); return rsp.end('not found'); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

async function settle(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  // wait for the site's "hero first" ready flag if it has one, then let the entrance motion and video fade finish
  await page.waitForFunction(() => !document.documentElement.classList.contains('js') || document.documentElement.classList.contains('page-ready') || performance.now() > 6000, null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(3200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

/* Wait until every finite animation and transition on the page has finished (looping ones, like a mascot bob, are ignored). */
async function motionDone(page, maxMs = 8000) {
  await page.waitForTimeout(900);
  await page.waitForFunction(() => document.getAnimations().every(a => {
    const end = a.effect && a.effect.getComputedTiming().endTime;
    return a.playState !== 'running' || !Number.isFinite(end);
  }), null, { timeout: maxMs, polling: 100 }).catch(() => {});
  await page.waitForTimeout(250);
}

/* Phone shot: scroll so phone.top sits just under the site header and phone.bottom fits in full. */
async function phoneShot(browser, url, phone, hide) {
  const ctx = await browser.newContext({ viewport: { width: PHONE.width, height: PHONE.height }, deviceScaleFactor: PHONE.scale, isMobile: true, hasTouch: true, userAgent: IPHONE_UA });
  const page = await ctx.newPage();
  await settle(page, url);
  await page.addStyleTag({ content: `${hide.join(',\n')} { display: none !important; } html { scroll-behavior: auto !important; }` });
  // small "Demo" / "Sample" tags anywhere on the page
  await page.evaluate(() => { for (const e of document.querySelectorAll('span, small, em, b, i, p, div')) if (!e.children.length && /^\s*demo\s*$/i.test(e.textContent)) e.style.setProperty('display', 'none', 'important'); });
  let report = { mode: 'top of page' };
  if (phone && phone.top && phone.bottom) {
    const tops = [].concat(phone.top), align = phone.align || 'center', gap = phone.gap ?? 20;
    const measure = () => page.evaluate(({ tops, bottom, header }) => {
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
      const topEls = tops.flatMap(s => [...document.querySelectorAll(s)]).filter(vis);
      const bot = document.querySelector(bottom);
      const hd = document.querySelector(header || '.site-header') || document.querySelector('header');
      const hr = hd ? hd.getBoundingClientRect() : { bottom: 0 };
      const hpos = hd ? getComputedStyle(hd).position : 'static';
      const first = topEls.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
      const sec = first && first.closest('section');
      return {
        sectionTop: sec ? sec.getBoundingClientRect().top + scrollY : null,
        top: topEls.length ? Math.min(...topEls.map(e => e.getBoundingClientRect().top)) + scrollY : null,
        bottom: bot && vis(bot) ? bot.getBoundingClientRect().bottom + scrollY : null,
        headerH: hd && /sticky|fixed/.test(hpos) ? Math.max(0, hr.bottom) : 0, scrollY,
      };
    }, { tops, bottom: phone.bottom, header: phone.header });
    const place = async () => {
      const m = await measure();
      if (m.top == null) throw new Error(`phone.top not found: ${tops.join(', ')}`);
      if (m.bottom == null) throw new Error(`phone.bottom not found: ${phone.bottom}`);
      const room = PHONE.height - m.headerH;
      const free = room - (m.bottom - m.top) - gap * 2;
      // center: split the spare room above and below, but never show the section above this one
      const above = m.sectionTop == null ? gap : Math.max(gap, m.top - m.sectionTop);
      const lead = align === 'bottom' ? gap + free : align === 'top' ? gap : Math.min(gap + Math.max(0, free) / 2, above);
      // land with a small upward scroll, like a visitor would, so a header that hides on the way down slides back in
      const y = Math.max(0, Math.round(m.top - m.headerH - lead));
      await page.evaluate(y => window.scrollTo(0, y + 14), y); await page.waitForTimeout(120);
      await page.evaluate(y => window.scrollTo(0, y), y); await page.waitForTimeout(120);
      return m;
    };
    await place(); await motionDone(page);       // first pass: brings the section in and lets it reveal
    await place(); await motionDone(page);       // second pass: header size after scrolling, revealed positions
    // Nothing below the last chosen card shows (the next row of cards would be cut off at the screen's edge)
    if (phone.hideBelow !== false) await page.evaluate((bottom) => {
      const bot = document.querySelector(bottom), limit = bot.getBoundingClientRect().bottom;
      for (const e of document.body.querySelectorAll('*')) {
        if (e.contains(bot) || bot.contains(e)) continue;
        if (e.getBoundingClientRect().top >= limit - 0.5) e.style.setProperty('visibility', 'hidden', 'important');
      }
    }, phone.bottom);
    const m = await measure();
    const topIn = m.top - m.scrollY, botIn = m.bottom - m.scrollY;
    if (topIn < m.headerH - 1) throw new Error(`phone shot: the top of the section is under the header (${Math.round(topIn)} < ${Math.round(m.headerH)})`);
    if (botIn > PHONE.height + 1) throw new Error(`phone shot: ${phone.bottom} is cut off by ${Math.round(botIn - PHONE.height)}px. Pick a shorter range in scripts/share-image.json.`);
    // everything that animates in and is on screen must be fully shown
    const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal], .tpl-reveal, .rv, .reveal, .is-revealing')].filter(e => {
      const r = e.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight || !r.height) return false;
      const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && parseFloat(cs.opacity) < 0.99;
    }).map(e => e.className).slice(0, 5));
    if (hidden.length) throw new Error('phone shot: not fully shown yet: ' + hidden.join(' | '));
    report = { mode: 'section', header: Math.round(m.headerH), top: Math.round(topIn), bottom: Math.round(botIn), spare: Math.round(PHONE.height - botIn) };
  }
  const png = await page.screenshot({ type: 'png' });
  await ctx.close();
  return { png, report };
}

async function makePicture({ url, out, bg: bgArg, phone, hide = [], phoneOut }) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  // Laptop: 1440 wide, first screen
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const dpage = await dctx.newPage();
  await settle(dpage, url);
  const desktop = await dpage.screenshot({ type: 'png' });
  const bg = bgArg || await dpage.evaluate(() => {
    const el = document.querySelector('footer, .site-footer');
    const c = el ? getComputedStyle(el).backgroundColor : 'rgb(20, 22, 24)';
    return c === 'rgba(0, 0, 0, 0)' ? 'rgb(20, 22, 24)' : c;
  });
  await dctx.close();
  // Phone: 390x844 at 3x, the chosen section, page only
  const { png: phonePng, report } = await phoneShot(browser, url, phone, hide);
  if (phoneOut) { fs.mkdirSync(path.dirname(phoneOut), { recursive: true }); fs.writeFileSync(phoneOut, phonePng); }

  const uri = b => 'data:image/png;base64,' + b.toString('base64');
  // Laptop lid 780px wide; phone 25% of the 848px device box, over the front right corner (same proportions as
  // .mock-duo on benyoungwebdesign.com). The whole group is about 900 x 525, centered with 50+ px of margin.
  // The phone screen is the page alone (no status bar), 390:844 like an iPhone screen.
  const html = `<!doctype html><html><head><style>
    * { box-sizing: border-box; margin: 0; }
    html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
    body {
      --bg: ${bg};
      background:
        radial-gradient(60% 75% at 50% 42%, color-mix(in srgb, var(--bg), #fff 13%) 0%, transparent 70%),
        linear-gradient(160deg, color-mix(in srgb, var(--bg), #fff 7%) 0%, var(--bg) 48%, color-mix(in srgb, var(--bg), #000 32%) 100%);
      display: grid; place-items: center;
    }
    .duo { position: relative; width: 848px; translate: 22px -14px; }
    .laptop { width: 780px; padding: 2.8% 2.8% 0; border-radius: 16px 16px 5px 5px;
      background: linear-gradient(180deg, #2b302e, #121514);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.1), 0 34px 60px -26px rgba(0,0,0,.75); }
    .laptop img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; object-position: top; border-radius: 5px 5px 0 0; }
    .laptop::after { content: ""; display: block; height: 13px; margin: 0 -9.8%; border-radius: 0 0 12px 12px;
      background: linear-gradient(180deg, #d9dcdb, #b9bdbc 45%, #8e9391); box-shadow: 0 26px 40px -18px rgba(0,0,0,.8); }
    .phone { position: absolute; right: 0; bottom: -6%; width: 25%; padding: 2.2%; border-radius: 16% / 7.4%;
      background: #0B0E0D; box-shadow: inset 0 0 0 1px #3B403E, 0 22px 38px -16px rgba(0,0,0,.7); }
    .phone__screen { overflow: hidden; aspect-ratio: ${PHONE.width} / ${PHONE.height}; border-radius: 14% / 6.6%; background: #fff; }
    .phone img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; }
  </style></head><body><div class="duo"><div class="laptop"><img src="${uri(desktop)}"></div><div class="phone"><div class="phone__screen"><img src="${uri(phonePng)}"></div></div></div></body></html>`;
  const cctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const cpage = await cctx.newPage();
  await cpage.setContent(html, { waitUntil: 'load' });
  await cpage.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
  // safety check: both devices fully inside the picture with margin
  const box = await cpage.evaluate(() => {
    const r = [document.querySelector('.laptop'), document.querySelector('.phone')].map(e => e.getBoundingClientRect());
    const base = document.querySelector('.laptop').getBoundingClientRect();
    const baseL = base.left - base.width * .098 * (1 / 1.056) , baseR = base.right + base.width * .098 * (1 / 1.056);
    return { left: Math.min(r[0].left, baseL), right: Math.max(r[1].right, baseR), top: Math.min(r[0].top, r[1].top), bottom: Math.max(r[0].bottom + 13, r[1].bottom) };
  });
  const margins = { left: box.left, right: W - box.right, top: box.top, bottom: H - box.bottom };
  if (Object.values(margins).some(m => m < 40)) throw new Error('Devices too close to the edge: ' + JSON.stringify(margins));
  const tmp = path.join(os.tmpdir(), 'share-image-' + process.pid + '.png');
  await cpage.screenshot({ path: tmp });
  await browser.close();

  // 2400x1260 render -> 1200x630 JPG, quality stepped down until it is under 300 KB
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const py = `
import sys, os
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB').resize((${W}, ${H}), Image.LANCZOS)
for q in range(90, 59, -2):
    im.save(sys.argv[2], 'JPEG', quality=q, optimize=True, progressive=True, subsampling=0 if q >= 84 else 2)
    if os.path.getsize(sys.argv[2]) <= ${MAX_BYTES}: break
print(q, os.path.getsize(sys.argv[2]))`;
  const res = execFileSync('python3', ['-c', py, tmp, out]).toString().trim().split(' ');
  fs.unlinkSync(tmp);
  console.log(`${path.relative(ROOT, path.resolve(out))}: ${W}x${H}, ${Math.round(+res[1] / 1024)} KB (JPG quality ${res[0]}), background ${bg}, margins ${Object.entries(margins).map(([k, v]) => k + ' ' + Math.round(v)).join(', ')}`);
  console.log(`  phone: ${report.mode}${report.mode === 'section' ? `, header ${report.header}px, section top at ${report.top}px, last card ends at ${report.bottom}px of ${PHONE.height} (${report.spare}px spare)` : ''}`);
}

/* ---------- config sites ---------- */
const today = () => new Date().toISOString().slice(0, 10);
function freeName(dirs) {
  const base = 'og-share-' + today();
  for (let v = 1; ; v++) {
    const name = base + (v === 1 ? '' : '-v' + v) + '.jpg';
    if (!dirs.some(d => fs.existsSync(path.join(d, name)))) return name;
  }
}
function expandHtml(dir, patterns) {
  const files = [];
  for (const p of patterns) {
    const full = path.join(ROOT, dir, p);
    if (!p.includes('*')) { if (fs.existsSync(full)) files.push(full); continue; }
    const d = path.dirname(full), re = new RegExp('^' + path.basename(full).replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
    if (fs.existsSync(d)) for (const f of fs.readdirSync(d).sort()) if (re.test(f)) files.push(path.join(d, f));
  }
  return files;
}
async function runSite(site, cfg, srv) {
  const url = `http://127.0.0.1:${srv.address().port}${site.path}`;
  if (!fs.existsSync(path.join(ROOT, site.dir, 'index.html'))) {
    throw new Error(site.preview ? `${site.dir} is not built. Run: node scripts/build-preview.mjs prospects/${site.preview}.json` : `${site.dir}/index.html not found`);
  }
  const siteImages = path.join(ROOT, site.dir, site.imageDir || 'images');
  const shareDir = site.preview ? path.join(ROOT, 'prospects', 'share', site.preview) : null;
  const qaDir = path.join(ROOT, 'qa', 'share', site.id);
  const outDir = site.client ? qaDir : (shareDir || siteImages);
  const file = freeName([siteImages, outDir]);
  const out = path.join(outDir, file);
  console.log(`\n${site.name} (${site.id})`);
  await makePicture({ url, out, phone: site.phone, hide: [...(cfg.hide || []), ...(site.hide || [])], bg: site.bg, phoneOut: path.join(qaDir, 'phone.png') });
  if (site.client) { console.log(`  client site: picture only, nothing changed. Ben sees ${path.relative(ROOT, out)} first.`); return; }
  if (shareDir) { fs.mkdirSync(siteImages, { recursive: true }); fs.copyFileSync(out, path.join(siteImages, file)); }
  const imageUrl = site.live.replace(/\/?$/, '/') + (site.imageDir ? site.imageDir.replace(/\/?$/, '/') : '') + file;
  setTags(expandHtml(site.dir, site.html || ['index.html']), imageUrl, site.name);
}

if (require.main === module) (async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.site) {
    const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
    const sites = args.site === 'all' ? cfg.sites : cfg.sites.filter(s => String(args.site).split(',').includes(s.id));
    if (!sites.length) throw new Error(`No site "${args.site}" in scripts/share-image.json. Sites: ${cfg.sites.map(s => s.id).join(', ')}`);
    const srv = await serve();
    try { for (const s of sites) await runSite(s, cfg, srv); } finally { srv.close(); }
    return;
  }
  if (!args['tags-only'] && (!args.url || !args.out)) {
    console.error('Usage: node share-image.cjs --site ID|all   or   --url URL --out FILE.jpg [--bg #hex] [--phone-top SEL --phone-bottom SEL] [--image-url URL --name "Business" --html page.html ...]');
    process.exit(1);
  }
  if (!args['tags-only']) {
    const cfg = fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, 'utf8')) : {};
    const phone = args['phone-top'] && args['phone-bottom'] ? { top: String(args['phone-top']).split('|'), bottom: args['phone-bottom'], align: args['phone-align'] } : null;
    await makePicture({ url: args.url, out: args.out, bg: args.bg, phone, hide: cfg.hide || [] });
  }
  if (args.html.length) {
    if (!args['image-url'] || !args.name) throw new Error('--html needs --image-url and --name');
    setTags(args.html, args['image-url'], args.name);
  }
})().catch(e => { console.error(e.message || e); process.exit(1); });

// Point pages at the picture: og:image, og:image:width, og:image:height, og:image:alt, twitter:image, twitter:image:alt
function shareTags(t, imageUrl, name) {
  const esc = s => s.replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/"/g, '&quot;');
  const alt = esc(name) + ' homepage on a laptop and a phone.';
  if (!/<meta property="og:image" /.test(t)) return null;
  const set = (re, tag, after) => {
    if (re.test(t)) t = t.replace(re, tag);
    else t = t.replace(after, m => m + '\n' + tag);
  };
  const ogRe = /<meta property="og:image" content="[^"]*">/;
  set(ogRe, `<meta property="og:image" content="${imageUrl}">`, /$^/);
  set(/<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="1200">', ogRe);
  set(/<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="630">', /<meta property="og:image:width" content="[^"]*">/);
  set(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${alt}">`, /<meta property="og:image:height" content="[^"]*">/);
  set(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${imageUrl}">`, /<meta property="og:image:alt" content="[^"]*">/);
  set(/<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${alt}">`, /<meta name="twitter:image" content="[^"]*">/);
  return t;
}
function setTags(files, imageUrl, name) {
  for (const f of files) {
    const t = shareTags(fs.readFileSync(f, 'utf8'), imageUrl, name);
    const rel = path.relative(ROOT, path.resolve(f));
    if (t == null) { console.log(`  ${rel}: no og:image tag, skipped`); continue; }
    fs.writeFileSync(f, t);
    console.log(`  ${rel}: share tags point at ${imageUrl}`);
  }
}

module.exports = { shareTags };
