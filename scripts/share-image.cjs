#!/usr/bin/env node
/* Link preview picture for any site: its homepage on a laptop and a phone, 1200x630 JPG under 300 KB.

   The method (the same for every site, picked automatically, no per-site setup needed):
   - Both shots run with "reduce motion" on plus every animation and transition switched off, after a scroll through
     the whole page, so every scroll-in, fade, and count-up is in its final state, every lazy image is loaded, and
     every font is ready. The sticky bottom call bar, chat bubbles, cookie or consent notices, "Demo" tags, and any
     other fixed element are hidden. The site header stays on top of the phone so the brand shows.
   - Laptop: the top of the homepage at 1440x900, filling the laptop screen edge to edge.
   - Phone: 390x844 at 3x, exactly the phone screen's shape in the mockup (no letterboxing, no stretching), scrolled
     mid-page like someone reading. Every section headline is tried as the top of the frame (24px of room above its
     eyebrow label, under the header). A spot passes only when:
       1. no horizontal band of 30px or more anywhere in the frame is one flat color (the end of a section, an empty
          gap, footer whitespace), and
       2. the bottom edge of the screen cuts through a photo or card, so content runs past the bottom.
     Passing spots are ranked: services, gallery, work, before-and-after, or booking sections first, then the most
     photos on screen, then a photo (not just a card) at the bottom edge, then a section that runs past the bottom.
     If no headline passes, frames that start in the middle of a card grid are tried. A frame with a gap never ships.
   - The picture: the laptop with the phone over its right side, centered with even margins, on a soft gradient in
     the site's darkest brand color (the footer's background, or pass --bg / "bg"). No words added.
   - Auto check on the finished JPG: the phone screen and the laptop screen must have no flat band of 30px or more,
     and both devices must sit fully inside the picture with margin. If it fails, the next best phone spot is used
     and the picture is rebuilt, until one passes. Shots are saved to qa/share/<id>/ for checking.

   Usage (from the repo root):
     node scripts/share-image.cjs --site pinwheel        one site from scripts/share-image.json (see its _readme)
     node scripts/share-image.cjs --site all             every site in the config
     node scripts/share-image.cjs --site all --sheet     also makes qa/share/contact-sheet.jpg, labeled by site
   For each site it serves the repo locally, makes images/og-share-YYYY-MM-DD.jpg (adds -v2, -v3 when that name is
   taken, so phones never show an old cached picture), and points the site's pages at it (og:image, og:image:width,
   og:image:height, og:image:alt, twitter:image, twitter:image:alt). Client sites ("client": true) only get the
   picture, in qa/share/, for Ben to see first. Prospect previews ("preview": slug) are built first
   (node scripts/build-preview.mjs prospects/SLUG.json); the picture is kept in prospects/share/SLUG/ and every
   rebuild uses it. Samples with a finishing script ("keep": folder) also get a copy there.

   One-off use without the config:
     node scripts/share-image.cjs --url URL --out FILE.jpg [--bg "#172E18"]
     node scripts/share-image.cjs --tags-only --image-url https://.../FILE.jpg --name "Business Name" --html *.html

   Needs Node 18+, Playwright, and Python 3 with Pillow and numpy (scripts/flat-bands.py does the gap checks). */
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
const LAPTOP = { width: 1440, height: 900 };
const BAND = 30;          // px in the finished 1200x630 picture: a flat band this tall (or taller) fails it
// The same 30px in each shot's own pixels. The phone screen in the picture is 175x378 for 390x844, the laptop screen
// 732x458 for 1440x900, so 30px there is 67px of phone page and 59px of laptop page. The bottom 15% of the phone
// (where a section ends and leaves a gap) is held to 30px of phone page.
const PHONE_BAND = 67, PHONE_BOTTOM_BAND = 30, LAPTOP_BAND = 59;
const LEAD = 24;          // px of room between the header and the top of the eyebrow label
const MIN_MARGIN = 24;    // px: both devices sit at least this far inside the picture
const KIND = /servic|svc|gallery|work|project|before|after|book|schedul|photo/i;
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


/* ---------- gap checks (scripts/flat-bands.py) ---------- */
function flatBands(jobs) {
  const f = path.join(os.tmpdir(), `flat-bands-${process.pid}-${Date.now()}.json`);
  fs.writeFileSync(f, JSON.stringify(jobs));
  try { return JSON.parse(execFileSync('python3', [path.join(__dirname, 'flat-bands.py'), f]).toString()); }
  finally { fs.unlinkSync(f); }
}
const bandText = (bands, scale = 1) => bands.map(([s, n, c]) => `${Math.round(n / scale)}px of ${c} at ${Math.round(s / scale)}px`).join(', ');

/* ---------- page prep: final states, everything loaded, overlays hidden ---------- */
const FREEZE = `
  *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important;
    transition-duration: 0s !important; transition-delay: 0s !important; caret-color: transparent !important; }
  html { scroll-behavior: auto !important; }
  .tpl-reveal, [data-reveal], .rv, .reveal, .is-revealing { opacity: 1 !important; translate: none !important; scale: none !important; }`;

async function prepare(page, url, hide) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.addStyleTag({ content: FREEZE + `\n${hide.join(',\n')} { display: none !important; }` });
  await page.evaluate(() => { for (const i of document.images) { i.loading = 'eager'; i.decoding = 'sync'; } });
  // scroll through the whole page so every lazy image loads and every scroll-in and count-up runs to the end
  await page.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.6)) { scrollTo(0, y); await wait(70); }
    scrollTo(0, document.documentElement.scrollHeight); await wait(300);
  });
  await page.waitForFunction(() => [...document.images].every(i => i.complete), null, { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(2500);  // count-ups and late scripts settle
  // small "Demo" tags anywhere on the page
  await page.evaluate(() => { for (const e of document.querySelectorAll('span, small, em, b, i, p, div')) if (!e.children.length && /^\s*demo\s*$/i.test(e.textContent)) e.style.setProperty('display', 'none', 'important'); });
}

/* Find the site header (fixed or sticky at the top; a static one is pinned), mark it, and hide every other fixed
   element (call bars, chat bubbles, notices, back-to-top buttons). Run after scrolling, when scroll-only bars show. */
async function overlays(page) {
  return page.evaluate(() => {
    const all = [...document.body.querySelectorAll('*')];
    let hd = document.querySelector('[data-share-header]');
    if (!hd) {
      const pinned = all.filter(e => /fixed|sticky/.test(getComputedStyle(e).position)).filter(e => {
        const r = e.getBoundingClientRect(); return r.width >= innerWidth - 4 && r.height > 30 && r.height < 170 && r.top < innerHeight / 3;
      }).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      hd = pinned.find(e => e.querySelector('a, img, svg')) || null;
      if (!hd) {   // a header that scrolls away: pin it to the top so the brand shows
        hd = document.querySelector('.site-header, header');
        if (hd) Object.assign(hd.style, { position: 'fixed', top: '0', left: '0', right: '0', zIndex: '9999' });
      }
      if (hd) hd.setAttribute('data-share-header', '');
    }
    if (hd) {   // a header that hides on the way down is shown
      hd.style.setProperty('transform', 'none', 'important'); hd.style.setProperty('translate', 'none', 'important');
      if (hd.getBoundingClientRect().top < -1) hd.style.setProperty('top', '0', 'important');
    }
    for (const e of all) {
      if (hd && (hd.contains(e) || e.contains(hd))) continue;
      if (getComputedStyle(e).position === 'fixed') e.style.setProperty('display', 'none', 'important');
    }
    const r = hd ? hd.getBoundingClientRect() : null;
    return { header: r ? Math.max(0, Math.round(r.bottom)) : 0 };
  });
}

/* Every place the phone frame could start: each section headline (with its eyebrow), then the middle of card grids. */
async function spots(page) {
  return page.evaluate(({ KIND }) => {
    const kind = new RegExp(KIND, 'i');
    const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05; };
    const abs = e => e.getBoundingClientRect().top + scrollY;
    const out = [], seen = new Set();
    const pageH = document.documentElement.scrollHeight;
    for (const h of document.querySelectorAll('h2')) {
      if (!vis(h) || h.closest('footer, .site-footer, [data-share-header]') || abs(h) < innerHeight * 0.8) continue;
      let top = h.getBoundingClientRect().top, p = h.previousElementSibling;
      for (let k = 0; k < 3 && p; k++, p = p.previousElementSibling) {
        const r = p.getBoundingClientRect();
        if (!vis(p) || r.height > 90 || top - r.bottom > 40) break;
        top = r.top;
      }
      // eyebrow outside the headline's wrapper (a heading group that holds only the h2)
      if (top === h.getBoundingClientRect().top && h.parentElement && h.parentElement.firstElementChild === h) {
        const q = h.parentElement.previousElementSibling;
        if (q && vis(q)) { const r = q.getBoundingClientRect(); if (r.height <= 90 && top - r.bottom <= 40) top = r.top; }
      }
      const sec = h.closest('section, [id]') || h.parentElement;
      const label = (sec.id || sec.className || '') + ' ' + h.textContent;
      const y = Math.round(top + scrollY);
      if (seen.has(y)) continue; seen.add(y);
      out.push({ y, kind: 'headline', name: (sec.id ? '#' + sec.id + ' ' : '') + '"' + h.textContent.trim().replace(/\s+/g, ' ').slice(0, 48) + '"',
        match: kind.test(label), sectionBottom: Math.round(sec.getBoundingClientRect().bottom + scrollY) });
    }
    // card grid fallback: start the frame just above a card that has another card above it
    for (const img of document.querySelectorAll('img')) {
      const card = img.closest('article, li, a, [class*=card], [class*=tile]');
      if (!card || !vis(card) || card.closest('footer, .site-footer') || abs(card) < innerHeight) continue;
      const r = card.getBoundingClientRect();
      if (r.width < 120 || r.width > innerWidth - 10 || r.height < 120) continue;
      const prev = card.previousElementSibling;
      if (!prev || !vis(prev) || prev.getBoundingClientRect().bottom > r.top + 2) continue;
      const y = Math.round(abs(card) - 14);
      if (seen.has(y)) continue; seen.add(y);
      const sec = card.closest('section, [id]') || card.parentElement;
      out.push({ y, kind: 'grid', name: (sec.id ? '#' + sec.id : 'grid') + ' card', match: kind.test((sec.id || '') + sec.className), sectionBottom: Math.round(sec.getBoundingClientRect().bottom + scrollY) });
    }
    return out.filter(s => s.y < pageH - innerHeight);
  }, { KIND: KIND.source });
}

/* What the bottom edge of the screen cuts through, and how many photos are on screen. */
async function frameFacts(page) {
  return page.evaluate(() => {
    const Y = innerHeight;
    const isPhoto = e => /^(IMG|VIDEO|PICTURE|CANVAS)$/.test(e.tagName) || (getComputedStyle(e).backgroundImage.includes('url(') && e.getBoundingClientRect().width < innerWidth - 8);
    const isCard = e => {
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (r.width < 110 || r.width > innerWidth - 8 || r.height < 60) return false;
      const bg = cs.backgroundColor, pbg = e.parentElement ? getComputedStyle(e.parentElement).backgroundColor : '';
      return cs.boxShadow !== 'none' || parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0 || (bg !== 'rgba(0, 0, 0, 0)' && bg !== pbg);
    };
    let photo = false, card = false;
    for (const x of [24, 80, 140, 195, 250, 310, 366]) {
      for (const e of document.elementsFromPoint(x, Y - 3)) {
        if (e.closest('[data-share-header]')) continue;
        const r = e.getBoundingClientRect();
        if (r.bottom < Y + 6 || r.top > Y - 12) continue;          // must start on screen and run past the bottom edge
        if (isPhoto(e)) photo = true; else if (isCard(e)) card = true;
      }
    }
    const photos = [...document.querySelectorAll('img, video, picture')].filter(e => {
      const r = e.getBoundingClientRect(); return r.width > 100 && Math.min(r.bottom, Y) - Math.max(r.top, 0) > 60 && !e.closest('[data-share-header]');
    }).length;
    const hidden = [...document.querySelectorAll('[data-reveal], .tpl-reveal, .rv, .reveal, .is-revealing')].filter(e => {
      const r = e.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= Y || !r.height) return false;
      const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && parseFloat(cs.opacity) < 0.99;
    }).length;
    return { photo, card, photos, hidden };
  });
}

/* Phone: try every spot, keep the ones with no gap and content cut at the bottom, best first. */
async function phoneShots(browser, url, hide, qaDir) {
  const ctx = await browser.newContext({ viewport: { width: PHONE.width, height: PHONE.height }, deviceScaleFactor: PHONE.scale,
    isMobile: true, hasTouch: true, userAgent: IPHONE_UA, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await prepare(page, url, hide);
  await page.evaluate(() => scrollTo(0, Math.round(document.documentElement.scrollHeight / 2)));
  await page.waitForTimeout(300);
  let { header } = await overlays(page);
  const all = await spots(page);
  const tried = [], tmp = path.join(os.tmpdir(), `share-phone-${process.pid}.png`);
  for (const s of all) {
    let y = Math.max(0, s.y - header - LEAD);
    // land with a small upward scroll, like a visitor, so a header that hides on the way down slides back in
    await page.evaluate(y => scrollTo(0, y + 14), y); await page.waitForTimeout(60);
    await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(160);
    ({ header } = await overlays(page));
    const fix = Math.max(0, s.y - header - LEAD);   // the header can change size after scrolling
    if (Math.abs(fix - y) > 1) { y = fix; await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(160); ({ header } = await overlays(page)); }
    const facts = await frameFacts(page);
    const png = await page.screenshot({ type: 'png' });
    fs.writeFileSync(tmp, png);
    const S = PHONE.scale, bottomZone = Math.round(PHONE.height * 0.15) * S;
    const [res, low] = flatBands([{ path: tmp, minRows: PHONE_BAND * S, tol: 10 },
      { path: tmp, box: [0, PHONE.height * S - bottomZone, PHONE.width * S, bottomZone], minRows: PHONE_BOTTOM_BAND * S, tol: 10 }]);
    const why = [];
    if (res.bands.length) why.push('flat band: ' + bandText(res.bands, S));
    if (low.bands.length) why.push('flat band in the bottom 15%: ' + bandText(low.bands, S));
    if (!facts.photo && !facts.card) why.push('bottom edge does not cut through a photo or card');
    if (facts.hidden) why.push(`${facts.hidden} element(s) not fully shown`);
    const score = (s.match ? 4 : 0) + Math.min(facts.photos, 3) + (facts.photo ? 1 : 0) + (s.sectionBottom > y + PHONE.height ? 1 : 0);
    tried.push({ ...s, scrollY: y, header, facts, score, ok: !why.length, why, png });
  }
  fs.unlinkSync(tmp);
  await ctx.close();
  // headlines first; frames that start mid-grid only when no headline passes
  const rank = t => (t.kind === 'headline' ? 100 : 0) + t.score;
  const passing = tried.filter(t => t.ok).sort((a, b) => rank(b) - rank(a) || a.y - b.y);
  if (qaDir) {
    fs.mkdirSync(qaDir, { recursive: true });
    for (const f of fs.readdirSync(qaDir)) if (/^phone/.test(f)) fs.unlinkSync(path.join(qaDir, f));
    tried.forEach((t, i) => fs.writeFileSync(path.join(qaDir, `phone-spot-${String(i + 1).padStart(2, '0')}.png`), t.png));
    fs.writeFileSync(path.join(qaDir, 'phone-spots.txt'), tried.map((t, i) => `${i + 1}. ${t.ok ? 'PASS' : 'fail'} score ${t.score}  ${t.kind} ${t.name}  y=${t.scrollY}${t.why.length ? '  ' + t.why.join('; ') : ''}`).join('\n') + '\n');
  }
  return { passing, tried };
}

/* Laptop: the top of the homepage at 1440x900, with the same gap check. */
async function laptopShot(browser, url, hide) {
  const ctx = await browser.newContext({ viewport: LAPTOP, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await prepare(page, url, hide);
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400);
  await overlays(page);
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
  const png = await page.screenshot({ type: 'png' });
  const bg = await page.evaluate(() => {
    const el = document.querySelector('footer, .site-footer');
    const c = el ? getComputedStyle(el).backgroundColor : 'rgb(20, 22, 24)';
    return c === 'rgba(0, 0, 0, 0)' ? 'rgb(20, 22, 24)' : c;
  });
  await ctx.close();
  const tmp = path.join(os.tmpdir(), `share-laptop-${process.pid}.png`);
  fs.writeFileSync(tmp, png);
  const [res] = flatBands([{ path: tmp, minRows: LAPTOP_BAND, tol: 10 }]);
  fs.unlinkSync(tmp);
  if (res.bands.length) throw new Error('laptop shot has a flat band: ' + bandText(res.bands));
  return { png, bg };
}

/* The picture: laptop + phone, centered with even margins. Returns where the two screens landed, for the final check. */
async function compose(browser, desktop, phonePng, bg, tmp) {
  const uri = b => 'data:image/png;base64,' + b.toString('base64');
  // Laptop lid 780px wide; phone 25% of the 848px group, over the laptop's right side (same proportions as
  // .mock-duo on benyoungwebdesign.com). The phone screen is the page alone, 390:844, filled exactly.
  const html = `<!doctype html><html><head><style>
    * { box-sizing: border-box; margin: 0; }
    html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
    body {
      --bg: ${bg};
      background:
        radial-gradient(60% 75% at 50% 42%, color-mix(in srgb, var(--bg), #fff 13%) 0%, transparent 70%),
        linear-gradient(160deg, color-mix(in srgb, var(--bg), #fff 7%) 0%, var(--bg) 48%, color-mix(in srgb, var(--bg), #000 32%) 100%);
    }
    .duo { position: absolute; left: 0; top: 0; width: 848px; }
    .laptop { width: 780px; padding: 2.8% 2.8% 0; border-radius: 16px 16px 5px 5px;
      background: linear-gradient(180deg, #2b302e, #121514);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.1), 0 34px 60px -26px rgba(0,0,0,.75); }
    .laptop img { display: block; width: 100%; aspect-ratio: ${LAPTOP.width} / ${LAPTOP.height}; object-fit: fill; border-radius: 5px 5px 0 0; }
    .base { width: 856px; height: 13px; margin-left: -38px; border-radius: 0 0 12px 12px;
      background: linear-gradient(180deg, #d9dcdb, #b9bdbc 45%, #8e9391); box-shadow: 0 26px 40px -18px rgba(0,0,0,.8); }
    .phone { position: absolute; right: 0; bottom: -6%; width: 25%; padding: 2.2%; border-radius: 16% / 7.4%;
      background: #0B0E0D; box-shadow: inset 0 0 0 1px #3B403E, 0 22px 38px -16px rgba(0,0,0,.7); }
    .phone__screen { overflow: hidden; aspect-ratio: ${PHONE.width} / ${PHONE.height}; border-radius: 14% / 6.6%; background: #fff; }
    .phone img { display: block; width: 100%; height: 100%; object-fit: fill; }
  </style></head><body><div class="duo"><div class="laptop"><img src="${uri(desktop)}"></div><div class="base"></div><div class="phone"><div class="phone__screen"><img src="${uri(phonePng)}"></div></div></div></body></html>`;
  const cctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const cpage = await cctx.newPage();
  await cpage.setContent(html, { waitUntil: 'load' });
  await cpage.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
  // center the whole group: even margins left and right, top and bottom
  const geo = await cpage.evaluate(({ W, H }) => {
    const rs = ['.laptop', '.base', '.phone'].map(s => document.querySelector(s).getBoundingClientRect());
    const box = { left: Math.min(...rs.map(r => r.left)), right: Math.max(...rs.map(r => r.right)), top: Math.min(...rs.map(r => r.top)), bottom: Math.max(...rs.map(r => r.bottom)) };
    const duo = document.querySelector('.duo');
    const dx = Math.round((W - (box.right - box.left)) / 2 - box.left), dy = Math.round((H - (box.bottom - box.top)) / 2 - box.top);
    duo.style.left = dx + 'px'; duo.style.top = dy + 'px';
    const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
    const all = ['.laptop', '.base', '.phone'].map(s => document.querySelector(s).getBoundingClientRect());
    const b = { left: Math.min(...all.map(r => r.left)), right: Math.max(...all.map(r => r.right)), top: Math.min(...all.map(r => r.top)), bottom: Math.max(...all.map(r => r.bottom)) };
    return { laptopScreen: r('.laptop img'), phoneScreen: r('.phone__screen'), margins: { left: b.left, right: W - b.right, top: b.top, bottom: H - b.bottom } };
  }, { W, H });
  await cpage.screenshot({ path: tmp });
  await cctx.close();
  return geo;
}

function toJpg(png, out) {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  const py = `
import sys, os
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB').resize((${W}, ${H}), Image.LANCZOS)
for q in range(90, 59, -2):
    im.save(sys.argv[2], 'JPEG', quality=q, optimize=True, progressive=True, subsampling=0 if q >= 84 else 2)
    if os.path.getsize(sys.argv[2]) <= ${MAX_BYTES}: break
print(q, os.path.getsize(sys.argv[2]))`;
  return execFileSync('python3', ['-c', py, png, out]).toString().trim().split(' ').map(Number);
}

/* Auto check on the finished JPG: no flat band in either screen, both devices inside the picture with margin. */
function finalCheck(out, geo) {
  const why = [];
  const m = geo.margins;
  if (Object.values(m).some(v => v < MIN_MARGIN)) why.push('a device touches or crosses the edge: ' + JSON.stringify(Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Math.round(v)]))));
  // phone screen: the rounded corners are skipped row by row, so a gap at the very top or bottom is still caught
  const [px, py, pw, ph] = geo.phoneScreen, [lx, ly, lw, lh] = geo.laptopScreen;
  const [phone, laptop] = flatBands([
    { path: out, box: [px + 1, py + 1, pw - 2, ph - 2], radius: [pw * 0.14, ph * 0.066], minRows: BAND, tol: 12 },
    { path: out, box: [lx + 1, ly + 1, lw - 2, lh - 2], radius: [6, 6], minRows: BAND, tol: 12 },
  ]);
  if (phone.bands.length) why.push('phone screen has a flat band: ' + bandText(phone.bands));
  if (laptop.bands.length) why.push('laptop screen has a flat band: ' + bandText(laptop.bands));
  return why;
}

async function makePicture({ url, out, bg: bgArg, hide = [], qaDir }) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    const { png: desktop, bg: footerBg } = await laptopShot(browser, url, hide);
    const bg = bgArg || footerBg;
    const { passing, tried } = await phoneShots(browser, url, hide, qaDir);
    if (!passing.length) throw new Error('no phone spot passes the gap check. Tried:\n' + tried.map(t => `  ${t.name}: ${t.why.join('; ')}`).join('\n'));
    const tmp = path.join(os.tmpdir(), 'share-image-' + process.pid + '.png');
    for (const [i, spot] of passing.entries()) {
      const geo = await compose(browser, desktop, spot.png, bg, tmp);
      const [q, bytes] = toJpg(tmp, out);
      fs.unlinkSync(tmp);
      const why = finalCheck(out, geo);
      if (why.length) { console.log(`  spot ${i + 1} (${spot.name}) failed the final check: ${why.join('; ')}. Trying the next one.`); continue; }
      if (qaDir) { fs.writeFileSync(path.join(qaDir, 'phone.png'), spot.png); fs.writeFileSync(path.join(qaDir, 'laptop.png'), desktop); }
      const mg = geo.margins;
      console.log(`${path.relative(ROOT, path.resolve(out))}: ${W}x${H}, ${Math.round(bytes / 1024)} KB (JPG quality ${q}), background ${bg}, margins left ${Math.round(mg.left)}, right ${Math.round(mg.right)}, top ${Math.round(mg.top)}, bottom ${Math.round(mg.bottom)}`);
      console.log(`  phone: ${spot.name} (${spot.kind}), ${spot.facts.photos} photo(s) on screen, bottom edge cuts a ${spot.facts.photo ? 'photo' : 'card'}; ${passing.length} of ${tried.length} spots passed`);
      return { spot: spot.name };
    }
    fs.rmSync(out, { force: true });
    throw new Error('every passing phone spot failed the final check');
  } finally { await browser.close(); }
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
  await makePicture({ url, out, hide: [...(cfg.hide || []), ...(site.hide || [])], bg: site.bg, qaDir });
  const done = { site, out };
  if (site.client) { console.log(`  client site: picture only, nothing changed. Ben sees ${path.relative(ROOT, out)} first.`); return done; }
  if (shareDir) { fs.mkdirSync(siteImages, { recursive: true }); fs.copyFileSync(out, path.join(siteImages, file)); }
  if (site.keep) { fs.mkdirSync(path.join(ROOT, site.keep), { recursive: true }); fs.copyFileSync(out, path.join(ROOT, site.keep, file)); }
  const imageUrl = site.live.replace(/\/?$/, '/') + (site.imageDir ? site.imageDir.replace(/\/?$/, '/') : '') + file;
  setTags(expandHtml(site.dir, site.html || ['index.html']), imageUrl, site.name);
  return done;
}

/* Contact sheet of the new pictures, labeled by site: qa/share/contact-sheet.jpg */
function contactSheet(done) {
  const sheet = path.join(ROOT, 'qa', 'share', 'contact-sheet.jpg');
  const py = `
import sys, json
from PIL import Image, ImageDraw, ImageFont
items = json.loads(sys.argv[1]); cols = 2; tw, th, lab, pad = 900, 473, 44, 24
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw + (cols + 1) * pad, rows * (th + lab) + (rows + 1) * pad), (245, 245, 242))
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception: font = ImageFont.load_default()
d = ImageDraw.Draw(sheet)
for i, (label, f) in enumerate(items):
    x = pad + (i % cols) * (tw + pad); y = pad + (i // cols) * (th + lab + pad)
    d.text((x, y + 8), label, fill=(20, 24, 30), font=font)
    sheet.paste(Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS), (x, y + lab))
sheet.save(sys.argv[2], 'JPEG', quality=86)`;
  execFileSync('python3', ['-c', py, JSON.stringify(done.map(d => [`${d.site.name}  (${path.basename(d.out)})${d.site.client ? '  CLIENT: waiting for Ben' : ''}`, d.out])), sheet]);
  console.log(`\nContact sheet: ${path.relative(ROOT, sheet)}`);
}

if (require.main === module) (async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.site) {
    const cfg = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
    const sites = args.site === 'all' ? cfg.sites : cfg.sites.filter(s => String(args.site).split(',').includes(s.id));
    if (!sites.length) throw new Error(`No site "${args.site}" in scripts/share-image.json. Sites: ${cfg.sites.map(s => s.id).join(', ')}`);
    const srv = await serve();
    const done = [], failed = [];
    try {
      for (const s of sites) {
        try { done.push(await runSite(s, cfg, srv)); }
        catch (e) { failed.push(s.id); console.error(`  ${s.name}: FAILED. ${e.message || e}`); }
      }
    } finally { srv.close(); }
    if (args.sheet && done.length) contactSheet(done);
    if (failed.length) { console.error(`\nFailed: ${failed.join(', ')}`); process.exit(1); }
    return;
  }
  if (!args['tags-only'] && (!args.url || !args.out)) {
    console.error('Usage: node share-image.cjs --site ID|all   or   --url URL --out FILE.jpg [--bg #hex] [--image-url URL --name "Business" --html page.html ...]');
    process.exit(1);
  }
  if (!args['tags-only']) {
    const cfg = fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, 'utf8')) : {};
    await makePicture({ url: args.url, out: args.out, bg: args.bg, hide: cfg.hide || [] });
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
