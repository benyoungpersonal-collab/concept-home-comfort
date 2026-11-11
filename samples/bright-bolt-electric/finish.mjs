#!/usr/bin/env node
/*
  Finishing pass for the Bright Bolt Electric sample site. Run after the main build:

      python3 samples/bright-bolt-electric/photos.py                       (only when photos.json changes)
      node scripts/build-preview.mjs samples/bright-bolt-electric/site.json
      node samples/bright-bolt-electric/finish.mjs

  The main build makes the page from site.json with the template defaults (photo-first hero, friendly fonts, zigzag
  bolt edges, trust tiles, photo service cards, picture-book motion, quick quote, FAQ, map). This pass turns it into
  the live sample at https://byw-home-comfort.netlify.app/bright-bolt-electric/ :
  - Copies previews/bright-bolt-electric/ to bright-bolt-electric/ (the folder Netlify serves)
  - Colors: electric yellow fills with navy text, navy bands, and a small bright-blue spark accent for labels and links
  - Bolt the mascot (bolt.mjs, bolt.css, bolt.js) in 4 spots: hero, services, quick quote, footer
  - 6 reviews tagged "Illustrative", whole-number rating shown as "5", no Google links
  - Electrician copy (services heading, visit steps), a real electrician photo in How a visit works (no plumbing video)
  - Link-preview title, canonical, og and schema URLs on the live address, footer says it is a sample site
  - PHOTO-LIST.md for this site
  Every replacement must match the expected number of times, or the script stops.
*/
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { boltSvg } from './bolt.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const BUILT = join(ROOT, 'previews', 'bright-bolt-electric');
const OUT = join(ROOT, 'bright-bolt-electric');
const URL = 'https://byw-home-comfort.netlify.app/bright-bolt-electric/';
const PHOTOS = JSON.parse(readFileSync(join(HERE, 'photos.json'), 'utf8'));
const SITE = JSON.parse(readFileSync(join(HERE, 'site.json'), 'utf8'));
if (!existsSync(join(BUILT, 'index.html'))) { console.error('finish: run node scripts/build-preview.mjs samples/bright-bolt-electric/site.json first'); process.exit(1); }

let html = readFileSync(join(BUILT, 'index.html'), 'utf8');
const fail = (m) => { console.error(`finish: ${m}`); process.exit(1); };
const rep = (a, b, n = 1) => {
  const count = html.split(a).length - 1;
  if (count !== n) fail(`expected ${n} match(es), found ${count}: ${a.slice(0, 100)}`);
  html = html.split(a).join(b);
};

/* ---------- Files: start from the built page, add Bolt and the sample's own photos ---------- */
rmSync(OUT, { recursive: true, force: true });
cpSync(BUILT, OUT, { recursive: true });
for (const f of ['_headers', 'robots.txt', 'styles.html']) rmSync(join(OUT, f), { force: true }); // Netlify's netlify.toml covers noindex for the whole site
rmSync(join(OUT, 'video'), { recursive: true, force: true });
for (const f of readdirSync(join(OUT, 'images'))) if (f.startsWith('visit-poster')) rmSync(join(OUT, 'images', f));
mkdirSync(join(OUT, 'images', 'bb'), { recursive: true });
for (const [, w, h] of PHOTOS.visit.out) copyFileSync(join(HERE, 'photos', `visit-${w}x${h}.webp`), join(OUT, 'images', 'bb', `visit-${w}x${h}.webp`));
copyFileSync(join(HERE, 'bolt.css'), join(OUT, 'css', 'bolt.css'));
/* Lighter hero files (the phone hero is the page's largest paint) */
execFileSync('python3', [join(HERE, 'hero-quality.py'), join(HERE, 'photos', 'hero-src.jpg'), join(OUT, 'images', 'hero'), SITE.heroPhoto.box || '']);
copyFileSync(join(HERE, 'bolt.js'), join(OUT, 'js', 'bolt.js'));

/* ---------- Head: title, canonical, schema, Bolt's files ---------- */
const TITLE = 'Bright Bolt Electric | Electrician in Tracy, CA: Panels, EV Chargers &amp; Lighting';
rep('<title>Bright Bolt Electric | Electrician in Tracy, CA</title>', `<title>${TITLE}</title>`);
rep('<meta property="og:title" content="Bright Bolt Electric | Electrician in Tracy, CA">', `<meta property="og:title" content="${TITLE}">`);
rep(`<meta property="og:url" content="${URL}">`, `<link rel="canonical" href="${URL}">\n<meta property="og:url" content="${URL}">`);
const cities = SITE.serviceAreas;
const schema = [{
  '@context': 'https://schema.org', '@type': 'Electrician', '@id': `${URL}#business`,
  name: SITE.name, url: URL, image: `${URL}images/og.jpg`, logo: `${URL}images/header-mark.svg`,
  description: 'Sample site by Ben Young Web Design. A made-up electrician: panel upgrades, EV charger installs, lighting, repairs, rewiring, and backup power.',
  telephone: '+1-209-555-0187',
  address: { '@type': 'PostalAddress', addressLocality: 'Tracy', addressRegion: 'CA', addressCountry: 'US' },
  areaServed: cities.map((c) => ({ '@type': 'City', name: `${c}, CA` })),
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '07:00', closes: '19:00' }],
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Electrical services', itemListElement: SITE.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name } })) },
}, {
  '@context': 'https://schema.org', '@type': 'FAQPage', '@id': `${URL}#faq`, url: URL,
  mainEntity: SITE.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
}];
const ld = schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n');

/* Colors: the build gives fills in electric yellow with navy text. This keeps headline accents navy on a yellow
   highlight (11.7:1), puts small labels and links in a deep spark blue (5.6:1 or more on every light background),
   and makes icon squares and badges yellow with navy icons. */
const css = `<style>
:root{--c-spark:#3FA9FF;--c-spark-ink:#0B5BD3;--c-brand-strong:#0B5BD3;--c-brand-deep:#0A50BC;--c-brand-hover:#0A50BC}
.accent{color:var(--c-navy);background:linear-gradient(180deg,transparent 56%,var(--c-brand) 56%,var(--c-brand) 92%,transparent 92%) no-repeat 0 0/100% 100%;padding:0 .06em}
.tpl-hero .hero-h .accent{background:linear-gradient(180deg,transparent 58%,var(--c-brand) 58%,var(--c-brand) 90%,transparent 90%) no-repeat 0 0/100% 100%;padding:0 .06em}
.on-dark .accent{color:var(--c-brand);background:none;padding:0}
.on-dark .eyebrow{color:var(--c-brand)}
.eyebrow::before{background:var(--c-spark)}
.tpl-tile-icon{background:var(--c-brand)}.tpl-tile-icon .icon{color:var(--c-navy);stroke:var(--c-navy)}
.pcard-badge{background:var(--c-brand);color:var(--c-navy)}.pcard-badge .icon{color:var(--c-navy)}
.tpl-guarantee .icon,.hero-note .icon{color:var(--c-spark-ink)}
.estimator.on-dark .est-result a:not(.btn){color:var(--c-spark-ink)}
.est-result .icon-bubble{background:var(--c-brand);color:var(--c-navy)}
.review-top .tag{margin-left:auto}
.tpl-pill,h1.tpl-pill{color:var(--c-navy)}
@media (min-width:900px){.est-grid>div:first-child{grid-column:1;grid-row:1}.est-grid>.tpl-quote-side{grid-column:2;grid-row:1}}
.rating-bar .tag{margin-left:8px;padding:1px 8px}
.footer-brand .bb-mark{width:40px;height:40px;border-radius:10px;flex:none}
@media (min-width:1000px){.pcards{grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}}
</style>`;
rep('<link rel="stylesheet" href="css/alive.css">', `<link rel="stylesheet" href="css/alive.css">\n<link rel="stylesheet" href="css/bolt.css">\n${css}`);
rep('</head>', `${ld}\n</head>`);
rep('<script src="js/reveal.js" defer></script>', '<script src="js/reveal.js" defer></script>\n<script src="js/bolt.js" defer></script>');

/* Electrical icons for the service cards */
const icons = {
  'i-bb-panel': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7.5h2M13 7.5h2M9 11.5h2M13 11.5h2M9 15.5h2M13 15.5h2"/>',
  'i-bb-ev': '<path d="M8 3v4M13 3v4"/><path d="M6 7h9v3.5a4.5 4.5 0 0 1-9 0Z"/><path d="M10.5 15v2.5a2.5 2.5 0 0 0 5 0v-2a2.5 2.5 0 0 1 5 0V18"/>',
  'i-bb-bulb': '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/>',
  'i-bb-plug': '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M9.5 8v3M14.5 8v3M10 16.5a2 2 0 0 1 4 0V18h-4Z"/>',
};
rep('  <symbol id="i-leaf"', Object.entries(icons).map(([id, d]) => `  <symbol id="${id}" viewBox="0 0 24 24">${d}</symbol>\n`).join('') + '  <symbol id="i-leaf"');

/* ---------- Bolt in 4 spots ---------- */
const spot = (cls, pose, extra = '') => `<div class="bolt ${cls}" data-bolt${extra} aria-hidden="true"><div class="bolt-move"><div class="bolt-bob"><div class="bolt-hop">${boltSvg(pose)}</div></div></div></div>`;
/* Hero: peeks in beside the hero card and waves */
rep('<use href="#i-check-circle"/></svg>A real person answers 7am to 7pm, Monday to Saturday</p>\n', `<use href="#i-check-circle"/></svg>A real person answers 7am to 7pm, Monday to Saturday</p>\n        ${spot('at-hero', { right: 'wave' }, ' data-bolt-load')}\n`);
/* Services: slides in from the side and points at the cards */
rep('id="services" aria-labelledby="services-title">\n    <div class="container">\n', `id="services" aria-labelledby="services-title">\n    <div class="container">\n      ${spot('at-services from-right', { left: 'point', right: 'rest' })}\n`);
/* Quick quote: thumbs up next to the form, with a speech bubble */
rep('<p class="tpl-talk">Prefer to talk?<a class="tpl-call-line" href="tel:+12095550187">Call (209) 555-0187</a></p>\n          </div>\n        </div>\n      </div>\n',
  `<p class="tpl-talk">Prefer to talk?<a class="tpl-call-line" href="tel:+12095550187">Call (209) 555-0187</a></p>\n          </div>\n        </div>\n      </div>\n      <div class="bolt-row" aria-hidden="true"><p class="bolt-bubble">We'll text you back!</p>${spot('at-quote from-below', { right: 'thumb' })}</div>\n`);
/* Footer: waves goodbye */
rep('      <p><a class="footer-text-link" href="#reviews" target="_blank" rel="noopener">Read our Google reviews</a></p>\n\n    </div>\n',
  `      <p><a class="footer-text-link" href="#reviews">Read the reviews</a></p>\n    </div>\n    <div class="bolt-row footer-bolt" aria-hidden="true"><p class="bolt-bubble">Thanks for stopping by!</p>${spot('at-footer from-right', { right: 'wave' })}</div>\n`);

/* ---------- Reviews: illustrative, whole-number rating ---------- */
rep('<a class="rating-bar-score" href="#reviews" target="_blank" rel="noopener">', '<a class="rating-bar-score" href="#reviews">');
rep('aria-label="Rated 5.0 out of 5"', 'aria-label="Rated 5 out of 5"', 2);
rep('<b>5.0</b>', '<b>5</b>');
rep('<span class="rb-g">Google </span>reviews</span>\n    </a>', '<span class="rb-g">Google </span>reviews</span>\n    </a>\n    <span class="tag on-dark">Illustrative</span>');
html = html.replace(/5\.0 stars from 48 Google reviews\. <a class="text-link" href="#reviews" target="_blank" rel="noopener">Read them all on Google<svg class="icon" aria-hidden="true"><use href="#i-arrow-right"\/><\/svg><\/a>/,
  '5 stars from 48 Google reviews <span class="tag">Illustrative reviews</span>');
if (/5\.0 stars/.test(html)) fail('rating line still shows 5.0');
rep('<svg class="g-mark" role="img" aria-label="Google review"><use href="#g-logo"/></svg>', '<span class="tag">Illustrative</span>', 6);
rep('aria-label="Customer reviews, scroll sideways for more"', 'aria-label="Illustrative customer reviews, scroll sideways for more"');

/* ---------- Copy ---------- */
rep('One Call for <span class="accent">Heating and Cooling.</span>', 'One Call for <span class="accent">Every Electrical Job.</span>');
rep('Your tech finds the problem and shows you the price. You decide.', 'Your electrician finds the problem and shows you the price. You decide.');
rep('Three Steps. <span class="accent">No Surprises.</span>', 'We Find It. We Price It. <span class="accent">We Fix It.</span>');

/* How a visit works: a real electrician on the job instead of the template's plumbing clip */
const v = PHOTOS.visit;
html = html.replace(/<div class="visit-media" data-video="video\/visit">[\s\S]*?<\/picture>\n      <\/div>/,
  `<div class="visit-media">\n        <img src="images/bb/visit-960x540.webp" srcset="images/bb/visit-640x360.webp 640w, images/bb/visit-960x540.webp 960w, images/bb/visit-1280x720.webp 1280w" sizes="(min-width: 900px) 600px, 92vw" width="1280" height="720" alt="${v.alt}" loading="lazy" decoding="async" style="background-color:#3b4250">\n      </div>`);
if (/data-video|visit-poster/.test(html)) fail('the plumbing video is still on the page');

/* ---------- Sample-site honesty lines ---------- */
rep('This is a preview. On the live site, this goes straight to the owner\'s phone.', 'This is a sample site. On a real site, this goes straight to the owner\'s phone.');
rep('This is a preview. On the live site, requests go straight to the owner\'s phone.', 'This is a sample site. On a real site, requests go straight to the owner\'s phone.');
rep('Preview form. On the live site, this goes straight to your phone.', 'Sample form. On a real site, this goes straight to the owner\'s phone.');
rep('<p>Homepage preview by Ben Young Web Design. Some photos are placeholders until we add yours.</p>',
  '<p>Sample site by Ben Young Web Design. Bright Bolt Electric is a made-up business: the name, phone number, reviews, and ratings are sample data.</p>');
rep('<span class="logo-initial" aria-hidden="true">B</span>\n        <span class="logo-text"><span class="logo-name">Bright Bolt</span></span>',
  '<img class="bb-mark" src="images/header-mark.svg" alt="" width="40" height="40">\n        <span class="logo-text"><span class="logo-name">Bright Bolt</span><span class="logo-tag">Electric</span></span>');
rep('<p>Fully insured.</p>', '<p>Licensed and insured.</p>');

/* ---------- Link preview picture: the homepage on a laptop and a phone (CLAUDE.md, "Link preview picture") ----------
   Made from the live page with scripts/share-image.cjs into share/og-share-DATE.jpg (newest date wins); this copies it
   in and points og:image, its size and alt, and twitter:image at it. Remake it whenever the hero changes. */
{
  const shares = existsSync(join(HERE, 'share')) ? readdirSync(join(HERE, 'share')).filter((f) => /^og-share-.*\.jpg$/.test(f)).sort() : [];
  if (!shares.length) console.warn('finish: no link preview picture in samples/bright-bolt-electric/share/, so og:image stays og.jpg');
  else {
    const pic = shares[shares.length - 1], imgUrl = `${URL}images/${pic}`, alt = 'Bright Bolt Electric homepage on a laptop and a phone.';
    copyFileSync(join(HERE, 'share', pic), join(OUT, 'images', pic));
    rmSync(join(OUT, 'images', 'og.jpg'), { force: true }); // the template's hero crop is not used once the picture is in
    rep(`<meta property="og:image" content="${URL}images/og.jpg">`, `<meta property="og:image" content="${imgUrl}">`);
    html = html.replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${alt}">`);
    rep('<meta name="twitter:card" content="summary_large_image">', `<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${imgUrl}">\n<meta name="twitter:image:alt" content="${alt}">`);
  }
}

/* ---------- Checks ---------- */
if (/claude/i.test(html)) fail('mentions Claude');
if (/—/.test(html)) fail('has an em dash');
if (/pinwheel/i.test(html)) fail('mentions Pinwheel');
if (/\bpreview\b/i.test(html.replace(/<link rel="preload"[^>]*>/g, '').replace(/css\/preview(-late)?\.css/g, ''))) fail('still says "preview" somewhere');
if (/target="_blank"[^>]*href="#|href="#[^"]*" target="_blank"/.test(html)) fail('an in-page link opens a new tab');
if ((html.match(/data-bolt[ >]/g) || []).length !== 4) fail('expected Bolt in 4 spots');
const bubbles = [...html.matchAll(/<p class="bolt-bubble">([^<]+)<\/p>/g)].map((m) => m[1]);
if (bubbles.length > 2 || bubbles.some((b) => b.split(/\s+/).length > 5)) fail('speech bubbles: 1 or 2, 5 words or fewer');
if (/tel:(?!\+12095550187)/.test(html) || /sms:(?!\+12095550187)/.test(html)) fail('a call or text link has the wrong number');
writeFileSync(join(OUT, 'index.html'), html);

/* ---------- PHOTO-LIST.md ---------- */
const row = (spot, k, now, source, license, prompt) => `| ${spot} | ${now} | ${source} | ${license} | ${prompt} |`;
const un = (k) => `Unsplash, photo by ${PHOTOS[k].by === 'unknown' ? 'an Unsplash contributor' : PHOTOS[k].by}: ${PHOTOS[k].page}`;
const NOPEOPLE = 'No people, no hands, no logos, no brand names, no labels with readable text.';
const rows = [
  row('Hero banner', 'hero', PHOTOS.hero.alt, un('hero'), 'Unsplash License (free, commercial use)', 'People photo: real stock or the client\'s own only, never AI. AI may only change a shirt color. Best: their own electrician in a solid navy, black, or light-blue work shirt at a real job in a Tracy-area home, wide 2:1, no other company\'s logos. Note: the SUV\'s taillight carries a tiny maker badge; a client photo would remove it.'),
  row('Service card: Panel upgrades', 'panel', PHOTOS.panel.alt, un('panel'), 'Unsplash License (free, commercial use)', `Realistic photo of a newly installed 200-amp residential breaker panel in a clean California garage, door open, neat labeled breakers, copper and white wiring tidy, soft daylight, eye level, 4:3. ${NOPEOPLE}`),
  row('Service card: EV charger installs', 'ev', PHOTOS.ev.alt, `${un('ev')} (${PHOTOS.ev.edit})`, 'Unsplash License (free, commercial use)', `Realistic photo of a matte gray Level 2 EV wall charger mounted in a clean, bright two-car garage of a California home, cable neatly coiled on its holder, a white electric car parked beside it, soft daylight, 4:3. ${NOPEOPLE}`),
  row('Service card: Lighting', 'lighting', PHOTOS.lighting.alt, un('lighting'), 'Unsplash License (free, commercial use)', `Realistic photo of a bright living room in a California tract home at dusk with warm recessed ceiling lights on and a modern ceiling fixture, outdoor porch light visible through the window, 4:3. ${NOPEOPLE}`),
  row('Service card: Repairs and troubleshooting', 'repairs', PHOTOS.repairs.alt, un('repairs'), 'Unsplash License (free, commercial use)', 'People photo (hands): real stock or the client\'s own only. Better: an electrician in a solid navy shirt testing a home outlet with a voltage tester in a bright kitchen, no logos.'),
  row('Service card: Rewiring', 'rewiring', PHOTOS.rewiring.alt, un('rewiring'), 'Unsplash License (free, commercial use)', `Realistic photo of new yellow and white Romex cable neatly stapled along open wood studs to blue outlet boxes in a home remodel, clean subfloor, daylight, eye level, 4:3. ${NOPEOPLE}`),
  row('Service card: Generators and backup power', 'backup', PHOTOS.backup.alt, un('backup'), 'Unsplash License (free, commercial use)', `Realistic photo of a gray home standby generator on a concrete pad beside a stucco California home, with a manual transfer switch box on the wall, green shrubs, late afternoon light, 4:3. ${NOPEOPLE}`),
  row('How a visit works', 'visit', PHOTOS.visit.alt, un('visit'), 'Unsplash License (free, commercial use)', 'People photo: real stock or the client\'s own only. Better: their electrician in a solid navy or black work shirt explaining a quote to a homeowner at the panel, 16:9, no logos.'),
  '| Link preview picture (images/og-share-DATE.jpg) | The homepage on a laptop and a phone | Screenshots of this site (scripts/share-image.cjs) | Owned | Not needed: no people, made from the live homepage. Remake it whenever the hero changes. |',
  '| Request a visit: family photo | Mom kissing a baby while dad and their daughter laugh on a green couch | Pexels (from the Pinwheel set, see credits.html) | Pexels License (free, commercial use) | Real stock only (people). A family relaxing at home in a bright living room. |',
  '| Bolt the mascot (hero, services, quick quote, footer) | Inline SVG drawn for this site (samples/bright-bolt-electric/bolt.mjs) | Ben Young Web Design | Owned | Original drawing. Not AI. |',
  '| Header mark, favicon, map pin | images/header-mark.svg, drawn for this site | Ben Young Web Design | Owned | Original drawing. |',
];
const md = `# Photo list: Bright Bolt Electric (sample site)

Every photo spot on https://byw-home-comfort.netlify.app/bright-bolt-electric/, what is there now, where it came from, and a ready-to-paste AI prompt for a better version.
Rules: people photos are real stock or the client's own, never AI (AI may only change a shirt color). Photos without people (panels, EV chargers, lighting) can be stock or AI-made.
Sources and crops: samples/bright-bolt-electric/photos.json. Rebuild: see samples/bright-bolt-electric/README.md.

| Spot | Now | Source | License | AI prompt for a better version |
|---|---|---|---|---|
${rows.join('\n')}
`;
writeFileSync(join(OUT, 'PHOTO-LIST.md'), md);
console.log(`finish: wrote bright-bolt-electric/ (${URL})`);
