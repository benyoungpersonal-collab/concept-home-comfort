#!/usr/bin/env node
/* Link preview picture for any site: its homepage on a laptop and a phone, 1200x630 JPG under 300 KB.

   What it makes (the same layout for every site):
   - The first screen of the homepage on a laptop (screenshot at 1440x900) with the phone version (390 wide, under a status bar)
     overlapping the laptop's front right corner (with a status bar in the page's top color), in the same thin iPhone-style frame as benyoungwebdesign.com
     (.mini-laptop and .mini-phone--overlap there).
   - No words added. A soft gradient in the site's darkest brand color behind it (by default the footer's
     background color, or pass --bg). Both devices sit well inside the picture, so nothing is cut off when an app
     crops the preview.
   - Screenshots are taken from the very top of the page after it has loaded and the motion has settled.

   Usage (from the repo root):
     node scripts/share-image.cjs --url https://byw-home-comfort.netlify.app/ --out images/og-share-2026-11-11.jpg
     node scripts/share-image.cjs --url URL --out FILE.jpg --bg "#172E18"
   Then point the pages at it (rewrites og:image, og:image:width, og:image:height, og:image:alt, twitter:image), in
   the same run or on its own with --tags-only:
     node scripts/share-image.cjs --url URL --out FILE.jpg --image-url https://.../FILE.jpg --name "Business Name" \
       --html index.html about.html ...
     node scripts/share-image.cjs --tags-only --image-url https://.../FILE.jpg --name "Business Name" --html *.html
   Give each new picture a new file name with the date, so phones don't keep showing the old cached one.

   Needs Node 18+ and Playwright (npm i -D playwright, then npx playwright install chromium) and Python 3 with
   Pillow (pip install pillow) for the JPG step. */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const args = (() => {
  const a = process.argv.slice(2), o = { html: [] };
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (k === '--html') { while (a[i + 1] && !a[i + 1].startsWith('--')) o.html.push(a[++i]); }
    else if (k.startsWith('--')) o[k.slice(2)] = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true;
  }
  return o;
})();
if (!args['tags-only'] && (!args.url || !args.out)) {
  console.error('Usage: node share-image.cjs --url URL --out FILE.jpg [--bg #hex] [--image-url URL --name "Business" --html page.html ...]');
  process.exit(1);
}
const W = 1200, H = 630, MAX_BYTES = 300 * 1024;

async function settle(page) {
  await page.goto(args.url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  // wait for the site's "hero first" ready flag if it has one, then let the entrance motion and video fade finish
  await page.waitForFunction(() => !document.documentElement.classList.contains('js') || document.documentElement.classList.contains('page-ready') || performance.now() > 6000, null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(3200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

(async () => {
  if (!args['tags-only']) await makePicture();
  if (args.html.length) setTags();
})().catch(e => { console.error(e.message || e); process.exit(1); });

async function makePicture() {
  const browser = await chromium.launch();
  // Desktop: 1440 wide, first screen
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const dpage = await dctx.newPage();
  await settle(dpage);
  const desktop = await dpage.screenshot({ type: 'png' });
  const bg = args.bg || await dpage.evaluate(() => {
    const el = document.querySelector('footer, .site-footer');
    const c = el ? getComputedStyle(el).backgroundColor : 'rgb(20, 22, 24)';
    return c === 'rgba(0, 0, 0, 0)' ? 'rgb(20, 22, 24)' : c;
  });
  await dctx.close();
  // Phone: 390 wide, first screen, as an iPhone
  const pctx = await browser.newContext({
    viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  });
  const ppage = await pctx.newPage();
  await settle(ppage);
  const phone = await ppage.screenshot({ type: 'png' });
  await pctx.close();

  const uri = b => 'data:image/png;base64,' + b.toString('base64');
  // Laptop lid 780px wide; phone 25% of the 848px device box, over the front right corner (same proportions as
  // .mock-duo on benyoungwebdesign.com). The whole group is about 900 x 525, centered with 50+ px of margin.
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
    .phone::before { content: ""; position: absolute; z-index: 2; top: 3.3%; left: 50%; width: 27%; height: 2.6%;
      translate: -50% 0; border-radius: 999px; background: #0B0E0D; }
    .phone__screen { display: flex; flex-direction: column; overflow: hidden; aspect-ratio: 390 / 844; border-radius: 14% / 6.6%; background: var(--top, #111); }
    .phone__bar { flex: none; height: 5.57%; background: var(--top, #111); }
    .phone img { display: block; width: 100%; flex: 1; min-height: 0; object-fit: cover; object-position: top; }
  </style></head><body><div class="duo"><div class="laptop"><img src="${uri(desktop)}"></div><div class="phone"><div class="phone__screen"><div class="phone__bar"></div><img src="${uri(phone)}"></div></div></div></body></html>`;
  const cctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const cpage = await cctx.newPage();
  await cpage.setContent(html, { waitUntil: 'load' });
  // The phone's status bar takes the color of the very top of the page, like Safari does
  await cpage.evaluate(async () => {
    const img = document.querySelector('.phone img'); await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = 8;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, img.naturalWidth, 8, 0, 0, img.naturalWidth, 8);
    const d = x.getImageData(0, 0, c.width, 8).data; let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    document.querySelector('.phone__screen').style.setProperty('--top', `rgb(${r / n | 0}, ${g / n | 0}, ${b / n | 0})`);
  });
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
  fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true });
  const py = `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB').resize((${W}, ${H}), Image.LANCZOS)
for q in range(90, 59, -2):
    im.save(sys.argv[2], 'JPEG', quality=q, optimize=True, progressive=True, subsampling=0 if q >= 84 else 2)
    import os
    if os.path.getsize(sys.argv[2]) <= ${MAX_BYTES}: break
print(q, os.path.getsize(sys.argv[2]))`;
  const out = execFileSync('python3', ['-c', py, tmp, args.out]).toString().trim().split(' ');
  fs.unlinkSync(tmp);
  console.log(`${args.out}: ${W}x${H}, ${Math.round(+out[1] / 1024)} KB (JPG quality ${out[0]}), background ${bg}, margins ${Object.entries(margins).map(([k, v]) => k + ' ' + Math.round(v)).join(', ')}`);

}

// Point pages at the picture: og:image, og:image:width, og:image:height, og:image:alt, twitter:image, twitter:image:alt
function setTags() {
  {
    if (!args['image-url'] || !args.name) throw new Error('--html needs --image-url and --name');
    const esc = s => s.replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/"/g, '&quot;');
    const alt = esc(args.name) + ' homepage on a laptop and a phone.';
    for (const f of args.html) {
      let t = fs.readFileSync(f, 'utf8');
      if (!/<meta property="og:image" /.test(t)) { console.log(`  ${f}: no og:image tag, skipped`); continue; }
      const set = (re, tag, after) => {
        if (re.test(t)) t = t.replace(re, tag);
        else t = t.replace(after, m => m + '\n' + tag);
      };
      const ogRe = /<meta property="og:image" content="[^"]*">/;
      set(ogRe, `<meta property="og:image" content="${args['image-url']}">`, /$^/);
      set(/<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="1200">', ogRe);
      set(/<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="630">', /<meta property="og:image:width" content="[^"]*">/);
      set(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${alt}">`, /<meta property="og:image:height" content="[^"]*">/);
      set(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${args['image-url']}">`, /<meta property="og:image:alt" content="[^"]*">/);
      set(/<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${alt}">`, /<meta name="twitter:image" content="[^"]*">/);
      fs.writeFileSync(f, t);
      console.log(`  ${f}: share tags point at ${args['image-url']}`);
    }
  }
}
