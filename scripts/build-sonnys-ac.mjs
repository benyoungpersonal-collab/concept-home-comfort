#!/usr/bin/env node
/* Builds the Sonny's Air Conditioning preview (contractor site) into sonnys-air-conditioning/.
   Six pages share one header, footer, and inline logo. Headlines go through title-case.mjs.
   The service area map comes from scripts/sonnys-ac-map.py (U.S. Census Bureau TIGER/Line data).
   Run from the repo root: node scripts/build-sonnys-ac.mjs */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { titleCaseHtml } from './title-case.mjs';

const DIR = 'sonnys-air-conditioning';
const BASE = 'https://byw-home-comfort.netlify.app/sonnys-air-conditioning/';
const API = 'https://sonnys-plans.byw-video.workers.dev';
// Link preview picture (scripts/share-image.cjs). Make a new dated one whenever the hero changes.
const OG = BASE + 'images/og-share-2026-11-13-r5.jpg';
const PHONE = '(559) 392-0743';
const TEL = 'tel:+15593920743';
const EMAIL = 'gwayne@sonnysair.com';
const NAME = "Sonny's Air Conditioning";
const UPLOAD = 'upload-your-plans.html';
const LICENSE = `<div class="license-wrap"><ul class="license-line" aria-label="License"><li>CSLB #1129931</li><li>C-20 HVAC</li><li>Bonded</li><li>Workers’ comp</li></ul></div>`;

// ---------- logo (George's design.com logo, outline removed for the dark background) ----------
const logoSvg = readFileSync(`${DIR}/images/logo-on-dark.svg`, 'utf8');
const logoBody = logoSvg.slice(logoSvg.indexOf('>') + 1, logoSvg.lastIndexOf('</svg>'));
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><g id="sac-logo">${logoBody}</g></defs></svg>`;
const MARK = (cls = 'brand-mark') => `<svg class="${cls}" viewBox="400 -4 506 341" aria-hidden="true"><use href="#sac-logo"/></svg>`;
const WORD = `<svg class="brand-word" viewBox="48 422 1184 74" aria-hidden="true"><use href="#sac-logo"/></svg>`;
const FULL = `<svg class="footer-logo" viewBox="0 0 1280 580.8" role="img" aria-label="${NAME}: Transparent, Honest, Predictable"><use href="#sac-logo"/></svg>`;

/* Header mark for the logo intro: George's own mark paths, unchanged, split into the three rings,
   the back ring, and the wind lines so each can animate. At the end nothing is moved or faded,
   so the last frame is his original artwork. */
function animatedMark() {
  const gs = [...logoBody.matchAll(/<g transform="(matrix\([^"]+\))"/g)].map((m) => m[1]);
  const paths = [...logoBody.matchAll(/<path[^>]*>/g)].slice(0, 3).map((m) => m[0]);
  const outer = gs[1], inner = gs.slice(2, 5);
  const d2 = paths[2].match(/ d="([^"]+)"/)[1];
  const rings = d2.trim().split(/(?=M )/).filter((s) => s.trim());
  if (rings.length !== 3) throw new Error('Logo rings: expected 3 subpaths, got ' + rings.length);
  const ringPath = (i) => paths[2].replace(/ d="[^"]+"/, ` d="${rings[i].trim()}"`);
  return `<svg class="brand-mark lg" viewBox="400 -4 506 341" aria-hidden="true"><g transform="${outer}">` +
    `<g transform="${inner[0]}"><g class="lg-r3">${paths[0]}</g></g>` +
    `<g transform="${inner[1]}"><g class="lg-wind">${paths[1]}</g></g>` +
    `<g transform="${inner[2]}"><g class="lg-r1">${ringPath(0)}</g><g class="lg-r2">${ringPath(1)}</g><g class="lg-r3">${ringPath(2)}</g></g>` +
    `</g></svg>`;
}
const MARK_ANIM = animatedMark();

// ---------- icons ----------
const I = {
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h3.3l1.9 4.7-2.4 1.5a11.5 11.5 0 0 0 6.5 6.5l1.5-2.4 4.7 1.9v3.3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  chev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  plans: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 6h20l8 8v28H10z"/><path d="M30 6v8h8M16 22h16M16 28h16M16 34h10"/></svg>',
};

const btnPlans = (cls = '') => `<a class="btn btn-primary ${cls}" href="${UPLOAD}">${I.upload}Upload Your Plans</a>`;
const btnCall = (cls = 'btn-ghost') => `<a class="btn ${cls}" href="${TEL}">${I.phone}Call ${PHONE}</a>`;

// George's own list from the Nov 11 call, construction first. Same 8, same order, everywhere they show.
const SERVICES = [
  ['new-construction', 'Residential New Construction'],
  ['housing-tracts', 'Housing Tracts'],
  ['multi-family', 'Multi-Family'],
  ['commercial', 'Commercial New Construction'],
  ['tenant-improvements', 'Tenant Improvements (TI)'],
  ['kitchens', 'Commercial Kitchens and Restaurants'],
  ['spiral-duct', 'Exposed Spiral Ductwork'],
  ['installs', 'Installs and Changeouts'],
];
// Must match PROJECT_TYPES in workers/sonnys-plans/src/index.js.
const PROJECT_TYPES = ['Residential new construction', 'Housing tract', 'Multi-family', 'Commercial new construction',
  'Tenant improvement (TI)', 'Restaurant kitchen or hood', 'Exposed spiral ductwork', 'Install or changeout', 'Other'];
const NAV = [['index.html', 'Home'], ['services.html', 'Services'], ['projects.html', 'Projects'], ['about.html', 'About'], ['hvac-tips.html', 'HVAC Tips']];

function header(page) {
  const cur = (h) => (h === page ? ' aria-current="page"' : '');
  const links = NAV.map(([h, t]) => h === 'services.html'
    ? `<div class="nav-dd${page === h ? ' is-current' : ''}"><button type="button" aria-expanded="false" aria-controls="dd-services">Services${I.chev}</button>
      <ul class="nav-dd-menu" id="dd-services">${SERVICES.map(([id, t2]) => `<li><a href="services.html#${id}">${t2}</a></li>`).join('')}<li class="all"><a href="services.html">All Services</a></li></ul></div>`
    : `<a href="${h}"${cur(h)}>${t}</a>`).join('');
  const mlinks = NAV.map(([h, t]) => h === 'services.html'
    ? `<li><details><summary>Services${I.chev}</summary><ul class="menu-sub">${SERVICES.map(([id, t2]) => `<li><a href="services.html#${id}">${t2}</a></li>`).join('')}<li><a href="services.html"${cur(h)}>All Services</a></li></ul></details></li>`
    : `<li><a href="${h}"${cur(h)}>${t}</a></li>`).join('') + `<li><a href="${UPLOAD}"${cur(UPLOAD)}>Upload Your Plans</a></li>`;
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="./" aria-label="${NAME}, home">${MARK_ANIM}${WORD}</a>
    <nav class="nav" aria-label="Main">${links}</nav>
    <div class="header-cta"><a class="header-phone" href="${TEL}">${PHONE}</a>${btnPlans()}</div>
    <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu" data-menu-open>${I.menu}</button>
  </div>
</header>
<dialog class="menu" id="menu" aria-label="Menu" data-menu>
  <div class="wrap">
    <div class="menu-top"><a class="brand" href="./" aria-label="${NAME}, home">${MARK()}${WORD}</a><button class="menu-btn" type="button" aria-label="Close menu" data-menu-close>${I.close}</button></div>
    <ul class="menu-links">${mlinks}</ul>
    <div class="btn-row">${btnPlans()}${btnCall()}</div>
    <p class="fine menu-fine">Hours: 6 am to 6 pm. Based in Clovis, CA.<br><a href="mailto:${EMAIL}">${EMAIL}</a></p>
  </div>
</dialog>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        ${FULL}
        <p>HVAC for general contractors, builders, and developers. Based in Clovis, CA.</p>
        ${LICENSE}
      </div>
      <div>
        <p class="footer-title">Pages</p>
        <ul class="footer-links">${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}<li><a href="${UPLOAD}">Upload Your Plans</a></li></ul>
      </div>
      <div class="footer-contact">
        <p class="footer-title">Contact</p>
        <p><a class="footer-phone" href="${TEL}">${PHONE}</a></p>
        <p><a href="mailto:${EMAIL}">${EMAIL}</a></p>
        <p>Hours: 6 am to 6 pm</p>
        <p>Merced to Tulare, and out toward the coast.</p>
      </div>
    </div>
    <p class="footer-verse"><q>By the grace of God I am what I am.</q> <cite>1 Corinthians 15:10</cite></p>
    <div class="footer-bottom">
      <p class="concept-pill"><b aria-hidden="true">BY</b>Website preview for ${NAME} by Ben Young Web Design.</p>
      <p>Sample photos stand in until we add photos of our own work.</p>
    </div>
  </div>
</footer>
<nav class="call-bar" aria-label="Quick contact">
  <a class="btn btn-ghost" href="${TEL}">${I.phone}Call</a>
  <a class="btn btn-primary" href="${UPLOAD}">${I.upload}Upload Plans</a>
</nav>`;
}

const LD = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'HVACBusiness', '@id': BASE + '#business', name: NAME, url: BASE,
  telephone: '+1-559-392-0743', email: EMAIL, slogan: 'Transparent. Honest. Predictable.',
  address: { '@type': 'PostalAddress', addressLocality: 'Clovis', addressRegion: 'CA', addressCountry: 'US' },
  areaServed: ['Merced', 'Madera', 'Fresno', 'Clovis', 'Visalia', 'Hanford', 'Tulare'].map((c) => ({ '@type': 'City', name: c + ', CA' })),
  description: 'HVAC contractor for general contractors, builders, and developers: residential new construction, housing tracts, multi-family, commercial new construction, tenant improvements (TI), commercial kitchens and restaurants (Type I hoods, stainless backsplashes), exposed spiral ductwork, and installs and changeouts. CSLB #1129931 (C-20).',
});
const faqLd = (items) => JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })),
});

function page({ file, title, desc, body, scripts = '', head = '', preload = '' }) {
  const url = BASE + (file === 'index.html' ? '' : file);
  let html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0A121C">
<meta name="color-scheme" content="dark">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="images/logo-mark.svg" type="image/svg+xml">
<link rel="preload" href="fonts/saira-semi-condensed-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/lato-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/lato-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/sac.css">
<script>(function(d){d.classList.add('js','lg-wait');setTimeout(function(){d.classList.remove('lg-wait');if(!window.__sac)d.classList.remove('js')},4000)})(document.documentElement)</script>
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${NAME}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${OG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${NAME} homepage on a laptop and a phone.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${OG}">
<meta name="twitter:image:alt" content="${NAME} homepage on a laptop and a phone.">
${preload}
${head}
</head>
<body>
${SPRITE}
${header(file)}
<main id="main">
${body}
</main>
${footer()}
<script src="js/site.js" defer></script>
${scripts}
</body>
</html>
`;
  html = html.replace(/(<h([123])\b[^>]*>)([\s\S]*?)(<\/h\2>)/g, (m, a, n, b, c) => a + titleCaseHtml(b) + c);
  for (const [bad, why] of [[/—/, 'em dash'], [/crew of 12|On the crew/i, 'crew of 12'], [/Send Your Plans/, '"Send Your Plans"'],
    [/Homepage preview/, 'Homepage preview'], [/Sonny Wayne|Pinwheel|Ridgeline|lorem/i, 'banned name'], [/555-/, 'fake phone']]) {
    if (bad.test(html)) throw new Error(`${why} found in ${file}`);
  }
  writeFileSync(`${DIR}/${file}`, html);
  console.log('built', file, (html.length / 1024).toFixed(1) + ' KB');
}

const srcset = (n, ws = [640, 1024, 1600]) => ws.map((w) => `images/photos/${n}-${w}.webp ${w}w`).join(', ');
const img = (n, alt, { ws, sizes = '100vw', pos = '', eager = false, w = 1600, h = 1067 } = {}) =>
  `<img src="images/photos/${n}-${(ws || [640, 1024, 1600]).slice(-1)[0]}.webp" srcset="${srcset(n, ws)}" sizes="${sizes}" width="${w}" height="${h}" alt="${alt}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}${pos ? ` style="${pos}"` : ''}>`;
const heroPreload = (n, ws) => `<link rel="preload" as="image" imagesrcset="${srcset(n, ws)}" imagesizes="100vw" fetchpriority="high">`;

function hero({ photo, alt, pos, eyebrow, h1, lead, ctas = true, cls = '', ws }) {
  return `<section class="hero ${cls}" aria-labelledby="hero-title">
  <div class="hero-photo">${img(photo, alt, { ws, eager: true, pos, w: 2400, h: 1600 })}</div>
  <div class="wrap hero-wrap">
    <div class="hero-card">
      <p class="eyebrow pill">${eyebrow}</p>
      <h1 id="hero-title">${h1}</h1>
      <p class="lead">${lead}</p>
      ${ctas ? `<div class="btn-row" data-hide-bar>${btnPlans()}${btnCall()}</div>${LICENSE}` : ''}
    </div>
  </div>
</section>`;
}

function plainHero({ eyebrow, h1, lead, cls = '' }) {
  return `<section class="hero page-hero no-photo ${cls}" aria-labelledby="hero-title">
  <div class="wrap hero-wrap"><div class="hero-card">
    <p class="eyebrow">${eyebrow}</p>
    <h1 id="hero-title">${h1}</h1>
    <p class="lead">${lead}</p>
  </div></div>
</section>`;
}

const cta = (h = 'Got a Project Coming Up?') => `<section class="section cta" aria-labelledby="cta-title">
  <div class="wrap cta-inner">
    <div class="rv"><p class="eyebrow">Let’s Get You Going</p><h2 id="cta-title">${h}</h2><p class="lead">You can send your plans or give us a call. Hours are 6 am to 6 pm.</p></div>
    <div class="cta-side rv" style="--d:120ms" data-hide-bar>${btnPlans()}${btnCall()}<p class="fine">Or email us at <a href="mailto:${EMAIL}">${EMAIL}</a>.</p></div>
  </div>
</section>`;

const faqList = (items, open = 0) => `<div class="faq">${items.map(([q, a], i) => `<details class="faq-item card rv" style="--d:${Math.min(i, 4) * 60}ms"${i < open ? ' open' : ''}>
  <summary><span>${q}</span><i aria-hidden="true">${I.plus}</i></summary>
  <div class="faq-a"><p>${a}</p></div>
</details>`).join('')}</div>`;

const CITIES = ['Merced', 'Chowchilla', 'Madera', 'Fresno', 'Clovis', 'Sanger', 'Kerman', 'Selma', 'Reedley', 'Kingsburg', 'Dinuba', 'Hanford', 'Lemoore', 'Visalia', 'Tulare'];
const COAST = ['Los Banos', 'Firebaugh', 'Coalinga', 'Paso Robles'];
/* Service area map: a light SVG of shapes (scripts/sonnys-ac-map.py, U.S. Census Bureau TIGER/Line data) with HTML labels on top,
   so names and shields use the site's font and stay readable on phones. */
const MAPD = JSON.parse(readFileSync('scripts/sonnys-ac-map.json', 'utf8'));
const at = (o) => `left:${o.x}%;top:${o.y}%`;
const MAP = `<a class="svc-map" href="${MAPD.gmaps.replace(/&/g, '&amp;')}" target="_blank" rel="noopener">
  <img src="images/service-area-map.svg?v=5" width="${MAPD.w}" height="${MAPD.h}" alt="Map of the San Joaquin Valley and the Central Coast from U.S. Census Bureau TIGER/Line data. Clovis is home base. The service area runs from Merced to Tulare along Highway 99 and west toward the coast as far as Paso Robles, about two hours from Clovis. Opens Google Maps." loading="lazy" decoding="async">
  <span class="map-layer" aria-hidden="true">
    ${MAPD.counties.map((c) => `<span class="m-county" style="${at(c)}">${c.name}</span>`).join('')}
    <span class="m-ocean" style="${at(MAPD.ocean)}">Pacific<br>Ocean</span>
    ${MAPD.context.map((c) => `<span class="m-ctx" style="${at(c)}">${c.name}</span>`).join('')}
    ${MAPD.shields.map((h) => `<span class="m-shield is-${h.net.toLowerCase()}" style="${at(h)}">${h.ref}</span>`).join('')}
    ${MAPD.pins.map((c) => `<span class="m-pin${c.minor ? ' minor' : ''}" data-side="${c.side}" style="${at(c)}"><b>${c.name}</b></span>`).join('')}
    <span class="m-ring" style="${at(MAPD.ring)}">About 2 hours from Clovis</span>
    <span class="m-hq" style="${at(MAPD.hq)}"><i>${MARK()}</i><b>Clovis<small>Home base</small></b></span>
  </span>
</a>`;

// ================= HOME =================
const HOME_FAQ = [
  ['Who do you work with?', 'General contractors, builders, and developers. New homes, tracts, multi-family, commercial, TI, restaurant kitchens and hoods, and changeouts.'],
  ['How do I send you plans?', `Upload them on the <a href="${UPLOAD}">plans page</a>. Any size, up to 20 files at a time. Or call <a href="${TEL}" class="nowrap">${PHONE}</a> and we’ll figure it out.`],
  ['What areas do you cover?', 'Anywhere about two hours from Clovis: up to Merced, down to Tulare, and west toward the coast.'],
  ['Do you do changeouts?', 'Yes. We pull the old equipment and set the new.'],
];

const svcCard = (href, photo, alt, pos, num, h3, p, d) => `<a class="svc card rv" style="--d:${d}ms" href="${href}">
  <span class="svc-media">${img(photo, alt, { sizes: '(min-width: 1080px) 25vw, (min-width: 640px) 50vw, 100vw', pos })}</span>
  <span class="svc-body"><span class="svc-num">${num}</span><h3>${h3}</h3><p>${p}</p><span class="more">Details ${I.arrow}</span></span>
</a>`;

page({
  file: 'index.html',
  title: `${NAME} | HVAC for New Construction, Tracts, Commercial, and TI`,
  desc: `${NAME}: HVAC for general contractors, builders, and developers. New homes, housing tracts, multi-family, commercial, TI, restaurant kitchens and hoods, and changeouts from Merced to Tulare. Based in Clovis. CSLB #1129931. Call ${PHONE}.`,
  preload: `<link rel="preload" as="image" media="(max-width: 599px)" imagesrcset="${srcset('hero-duct-boot-phone')}" imagesizes="100vw" fetchpriority="high">\n<link rel="preload" as="image" media="(min-width: 600px)" imagesrcset="${srcset('hero-duct-boot', [1024, 1600, 2400])}" imagesizes="100vw" fetchpriority="high">`,
  head: `<script type="application/ld+json">${LD}</script>\n<script type="application/ld+json">${faqLd(HOME_FAQ)}</script>`,
  body: `
<section class="hero hero-full" aria-labelledby="hero-title">
  <div class="hero-photo"><picture><source media="(max-width: 599px)" srcset="${srcset('hero-duct-boot-phone')}" sizes="100vw">${img('hero-duct-boot', 'Flex duct running into a sheet-metal boot between ceiling joists during an HVAC rough-in', { ws: [1024, 1600, 2400], eager: true, pos: '--pos:50% 50%;--pos-d:62% 50%', w: 2400, h: 1500 })}</picture></div>
  <div class="wrap hero-wrap">
    <div class="hero-copy">
      <p class="eyebrow pill">C-20 HVAC Contractor · Clovis, CA</p>
      <h1 id="hero-title"><span>Transparent.</span> <span>Honest.</span> <span>Predictable.</span></h1>
      <p class="hero-quote">Specializing in doing the right thing, ALWAYS.<br class="br-desk"> Also Air Conditioning.</p>
      <p class="lead">The HVAC sub for general contractors, builders, and developers. New homes, housing tracts, commercial, and TI work from Merced to Tulare. 20+ years in air conditioning.</p>
      <div class="btn-row" data-hide-bar>${btnPlans()}${btnCall()}</div>
      ${LICENSE}
    </div>
  </div>
</section>

<section class="stat-strip" aria-label="At a glance">
  <ul class="wrap facts-strip">
    <li><b><span data-count="20">20</span>+</b> <span>Years in AC</span></li>
    <li><b>C-20</b> <span>Licensed</span></li>
    <li><b>Merced</b> <span>to <b>Tulare</b></span></li>
  </ul>
</section>

<section class="section svc-sec" id="services" aria-labelledby="svc-title">
  <div class="wrap">
    <div class="split-head">
      <div class="rv"><p class="eyebrow">What We Do</p><h2 id="svc-title">Built for Builders.</h2></div>
      <p class="lead rv" style="--d:100ms">New homes, tracts, multi-family, commercial, TI, and restaurant kitchens.</p>
    </div>
    <div class="svc-grid">
      ${svcCard('services.html#new-construction', 'framing-two-story', 'Two-story home in wood framing with scaffolding on a new construction site', '--pos:40% 50%', '01', 'Residential New Construction', 'Full systems for new homes, built from your plan set.', 0)}
      ${svcCard('services.html#housing-tracts', 'townhomes', 'Row of new two-story townhomes with dumpsters out front on a construction site', '--pos:40% 50%', '02', 'Housing Tracts', 'Same plans, lot after lot.', 80)}
      ${svcCard('services.html#commercial', 'commercial-steel', 'Steel frame of a large commercial building going up, with cranes and lifts', '--pos:50% 50%', '04', 'Commercial New Construction', 'New commercial buildings, from your plan set.', 160)}
      ${svcCard('services.html#kitchens', 'kitchen-fryers', 'Stainless steel fryers under a commercial kitchen hood with a stainless backsplash', '--pos:50% 40%', '06', 'Commercial Kitchens and Restaurants', 'Type I hoods, stainless backsplashes, and restaurant AC.', 240)}
    </div>
    <a class="text-link rv" href="services.html">See All Services ${I.arrow}</a>
  </div>
</section>

<section class="section section-alt" id="how-it-works" aria-labelledby="steps-title">
  <div class="wrap">
    <div class="section-head rv"><p class="eyebrow">How It Works</p><h2 id="steps-title">How a Job Gets Started.</h2></div>
    <ol class="steps">
      <li class="card rv"><span class="num" aria-hidden="true">01</span><h3>Send Us Your Plans.</h3><p><a href="${UPLOAD}">Upload the plan set</a>, any size. Rather talk first? Call <a href="${TEL}" class="nowrap">${PHONE}</a>.</p></li>
      <li class="card rv" style="--d:100ms"><span class="num" aria-hidden="true">02</span><h3>We Go Over Them.</h3><p>We go over the plans, call you with any questions, and send a quote.</p></li>
      <li class="card rv" style="--d:200ms"><span class="num" aria-hidden="true">03</span><h3>We’ll Get You Going.</h3><p>Once you’re good with the quote, we get to work.</p></li>
    </ol>
  </div>
</section>

<section class="band" aria-labelledby="band-title">
  ${img('crew-framing', 'Construction worker in a hard hat walking the top plate of a framed wall against a blue sky', { pos: '--pos:62% 40%' })}
  <div class="wrap">
    <div class="band-copy rv">
      <p class="eyebrow">Who We Are</p>
      <h2 id="band-title">20+ Years in the Trade.</h2>
      <p class="lead">Sonny’s is led by George, who has more than 20 years in air conditioning. He started the company about two years ago in Clovis, and our crew takes jobs from Merced to Tulare, and out toward the coast.</p>
      <a class="btn btn-ghost" href="about.html">About Sonny’s ${I.arrow}</a>
    </div>
  </div>
</section>

<section class="section area-sec" id="area" aria-labelledby="area-title">
  <div class="wrap area-grid">
    <div>
      <p class="eyebrow rv">Service Area</p>
      <figure class="area-map card rv-side">${MAP}<figcaption><span>Map data: <a href="https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html" rel="noopener">U.S. Census Bureau TIGER/Line</a>. Tap the map to open Google Maps.</span><span>Map is approximate.</span></figcaption></figure>
    </div>
    <div class="area-text rv">
      <h2 id="area-title">Merced to Tulare, and Out Toward the Coast.</h2>
      <p class="lead">We’re based in Clovis and take jobs about two hours out. Not sure your site is in range? Call and ask.</p>
      <ul class="cities">${CITIES.map((c) => `<li${c === 'Clovis' ? ' class="hq"' : ''}>${c}</li>`).join('')}</ul>
      <p class="cities-sub">Toward the coast</p>
      <ul class="cities">${COAST.map((c) => `<li>${c}</li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="section faq-sec" id="faq" aria-labelledby="faq-title">
  <div class="wrap faq-grid">
    <div class="rv">
      <p class="eyebrow">FAQ</p>
      <h2 id="faq-title">Questions From Builders.</h2>
      <p class="lead" style="margin-top:20px">Don’t see your question? Just give us a call.</p>
      <a class="text-link" href="hvac-tips.html">More Answers and HVAC Tips ${I.arrow}</a>
    </div>
    ${faqList(HOME_FAQ, 1)}
  </div>
</section>

${cta()}
`,
});

// ================= SERVICES =================
const detail = (id, photo, alt, pos, eyebrow, h2, p, items) => `<article class="svc-detail" id="${id}">
  <figure class="card rv-side">${img(photo, alt, { sizes: '(min-width: 900px) 50vw, 100vw', pos })}</figure>
  <div class="rv">
    <p class="eyebrow">${eyebrow}</p>
    <h2>${h2}</h2>
    ${p ? `<p class="lead">${p}</p>` : ''}
    ${items.length ? `<ul class="svc-list">${items.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
  </div>
</article>`;

page({
  file: 'services.html',
  title: `Services | ${NAME}`,
  desc: `HVAC for builders and general contractors: residential new construction, housing tracts, multi-family, commercial new construction, tenant improvements (TI), commercial kitchens and restaurants, exposed spiral ductwork, and installs and changeouts. ${NAME}, Clovis, CA. ${PHONE}.`,
  preload: heroPreload('framing-sky', [640, 1024, 1600]),
  body: `
${hero({
    photo: 'framing-sky', alt: 'Wood framing of a new building against a clear blue sky, with scaffolding along the top floor',
    pos: '--pos:30% 50%;--pos-d:50% 45%', eyebrow: 'Services', h1: 'Full HVAC for<br> New Construction.',
    lead: 'Homes, tracts, multi-family, commercial, TI, and restaurant kitchens, plus changeouts. For builders, GCs, and developers.',
  })}
<section class="section" aria-label="Services">
  <div class="wrap">
    ${detail('new-construction', 'roof-framing', 'Roof trusses and wood framing on a new house against a blue sky', '--pos:50% 40%', '01 · New Construction', 'Residential New Construction.',
    'Full HVAC systems for new homes, from your plan set.', ['Ductwork', 'Condensers', 'Air handlers', 'Furnaces', 'Heat pumps'])}
    ${detail('housing-tracts', 'tract-site', 'New tract homes going up beyond a graded dirt lot with a dump truck', '--pos:62% 50%', '02 · Housing Tracts', 'Housing Tracts.',
    'For builders putting up a whole tract.', ['Repeat plans, lot after lot', 'Coordinated with the builder and the other trades'])}
    ${detail('multi-family', 'multifamily-frame', 'Multi-story residential building in concrete and steel stud framing against a blue sky', '--pos:50% 55%', '03 · Multi-Family', 'Multi-Family.',
    'For builders putting up a multi-family building.', ['Ductwork and equipment for every unit'])}
    ${detail('commercial', 'commercial-site', 'Large commercial steel frame going up behind a fenced, freshly graded site', '--pos:50% 50%', '04 · Commercial', 'Commercial New Construction.',
    'Heating, ventilation, and air conditioning for new commercial buildings, from your plan set.', ['Heating', 'Ventilation', 'Air conditioning', 'Ductwork', 'Exposed spiral ductwork', 'Coordinated with your GC and electricians'])}
    ${detail('tenant-improvements', 'ti-ceiling', 'Exposed spiral ductwork and round diffusers under a dark open ceiling in a commercial space', '--pos:40% 50%', '05 · Tenant Improvements', 'Tenant Improvements (TI).',
    'HVAC for build-outs and remodels of commercial spaces, from your plans.', ['Ductwork', 'Equipment', 'Exposed spiral ductwork', 'Coordinated with your GC'])}
    ${detail('kitchens', 'kitchen-line', 'Restaurant cook line under a stainless steel exhaust hood, with a stainless backsplash', '--pos:50% 40%', '06 · Kitchens and Restaurants', 'Commercial Kitchens and Restaurants.',
    '', ['Type I kitchen hoods', 'Stainless backsplashes', 'Restaurant air conditioning', 'Coordinated with your GC'])}
    ${detail('spiral-duct', 'spiral-duct', 'Large runs of exposed spiral ductwork with elbows, below a glass roof', '--pos:40% 50%', '07 · Spiral Duct', 'Exposed Spiral Ductwork.',
    'Spiral duct run exposed, for commercial spaces, restaurants, and TI work.', [])}
    ${detail('installs', 'condenser-pad', 'Brand-new outdoor AC condenser on a fresh concrete pad beside a newly built home', '--pos:62% 60%', '08 · Installs and Changeouts', 'Installs and Changeouts.',
    'New equipment in, old equipment out.', ['Condensers', 'Furnaces', 'Air handlers', 'Heat pumps'])}
  </div>
</section>
<section class="section section-alt crew-band" id="your-team" aria-labelledby="crew-title">
  <div class="wrap crew-grid">
    <div class="rv">
      <p class="eyebrow">Your Crew and Ours</p>
      <h2 id="crew-title">How We Work With Your Crew.</h2>
      <p class="lead">We work off your plans and right alongside your crew.</p>
    </div>
    <ul class="crew-list rv" style="--d:100ms">${[
      ['We Start With Your Plans.', 'We read your blueprints and plan sets first, so the HVAC is laid out for the build.'],
      ['We Stay on Your Schedule.', 'We coordinate with your builder and project manager on timing.'],
      ['We Work With Your Trades.', 'We work right alongside your electricians and the other trades on site.'],
    ].map(([t, x]) => `<li>${I.check}<div><h3>${t}</h3><p>${x}</p></div></li>`).join('')}</ul>
  </div>
</section>
${cta('Have Plans Ready?')}
`,
});

// ================= PROJECTS =================
const proj = (photo, alt, pos, h3, d) => `<figure class="proj card rv" style="--d:${d}ms">
  <div class="proj-media"><span class="proj-tag">Sample photo</span>${img(photo, alt, { sizes: '(min-width: 1080px) 33vw, (min-width: 700px) 50vw, 100vw', pos })}</div>
  <figcaption><h3>${h3}</h3></figcaption>
</figure>`;

page({
  file: 'projects.html',
  title: `Projects | ${NAME}`,
  desc: `Projects from ${NAME}: new homes, tracts, multi-family, commercial, TI, restaurant kitchens, and changeouts from Merced to Tulare.`,
  body: `
${plainHero({ eyebrow: 'Projects', h1: 'Projects.', lead: 'New homes, tracts, multi-family, commercial, TI, restaurant kitchens, and changeouts from Merced to Tulare.' })}
<section class="section tight" aria-label="Sample project photos">
  <div class="wrap">
    <p class="notice">${I.info}<span>Sample photos for now. Photos of our own jobs go here soon.</span></p>
    <div class="proj-grid">
      ${proj('frame-fence', 'New home in wood framing behind a construction fence', '--pos:50% 55%', 'New Home Build', 0)}
      ${proj('tract-homes', 'New two-story tract homes beside a pile of graded dirt', '--pos:45% 50%', 'Housing Tract', 80)}
      ${proj('multifamily-build', 'Multi-story apartment building in wood framing and sheathing, with a tower crane', '--pos:40% 50%', 'Multi-Family Build', 160)}
      ${proj('rooftop-towers', 'Commercial rooftop with three cooling towers, red piping, and a crane', '--pos:50% 50%', 'Commercial Rooftop', 0)}
      ${proj('sheathed-framing', 'New multi-story wood framing with OSB sheathing against a blue sky', '--pos:50% 60%', 'Framing and Sheathing', 80)}
      ${proj('new-units', 'Row of new outdoor heat pump units on a lawn beside a new building', '--pos:50% 55%', 'Equipment Changeout', 160)}
      ${proj('kitchen-hood', 'Stainless steel exhaust hood over a commercial kitchen line, with ladles and strainers hanging below', '--pos:30% 30%', 'Restaurant Kitchen Hood', 0)}
      ${proj('spiral-ceiling', 'Exposed spiral ductwork with a round diffuser branching across a dark commercial ceiling', '--pos:60% 50%', 'Tenant Improvement', 80)}
    </div>
  </div>
</section>
${cta('Got a Job for Us?')}
`,
});

// ================= ABOUT =================
const SILHOUETTE = `<svg viewBox="0 0 240 300" role="img" aria-label="Placeholder silhouette where George’s photo will go"><defs><linearGradient id="op-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8DDBE7"/><stop offset="1" stop-color="#19A9E6"/></linearGradient></defs><circle cx="120" cy="118" r="50" fill="url(#op-g)"/><path d="M16 300c4-70 48-108 104-108s100 38 104 108z" fill="url(#op-g)"/></svg>`;

page({
  file: 'about.html',
  title: `About | ${NAME}`,
  desc: `${NAME} is George’s HVAC company in Clovis. 20+ years in air conditioning. CSLB #1129931, C-20, bonded, workers' comp.`,
  preload: heroPreload('framing-interior', [640, 1024, 1600, 2400]),
  body: `
${hero({
    cls: 'hero-light about-hero', photo: 'framing-interior', ws: [640, 1024, 1600, 2400], alt: 'Bright, sunlit interior of a new home in wood framing, with open walls and ceiling joists',
    pos: '--pos:40% 50%;--pos-d:50% 50%', eyebrow: 'About', h1: 'A Clovis HVAC Contractor<br> for Builders.',
    lead: 'Sonny’s does HVAC for general contractors, builders, and developers across the Central Valley.', ctas: false,
  })}
<section class="section" aria-labelledby="owner-title">
  <div class="wrap about-grid">
    <figure class="owner-ph card rv-side"><span class="owner-tag">Your photo here</span>${SILHOUETTE}</figure>
    <div class="rv">
      <p class="eyebrow">Meet the owner</p>
      <h2 id="owner-title">Meet George.</h2>
      <p class="lead" style="margin-top:20px">George has been in air conditioning for more than 20 years. About two years ago he started Sonny’s in Clovis, and he takes jobs from Merced to Tulare, and out toward the coast.</p>
      <ul class="timeline">
        <li><b>20+ years</b><span>In air conditioning.</span></li>
        <li><b>2</b><span>Years running his own company.</span></li>
        <li><b>C-20</b><span>State HVAC license, CSLB #1129931. Bonded, with workers’ comp.</span></li>
      </ul>
      <p class="contact-line"><a href="${TEL}">${I.phone}${PHONE}</a><a href="mailto:${EMAIL}">${I.mail}${EMAIL}</a></p>
    </div>
  </div>
</section>
<section class="section section-alt" aria-label="A word from George">
  <div class="wrap">
    <blockquote class="george-quote card rv"><p>The same strength that can break things can also build them, but power without discipline is weakness. God gave me power, not permission to misuse it.</p><cite>George</cite></blockquote>
  </div>
</section>
${cta()}
`,
});

// ================= HVAC TIPS =================
const TIPS_FAQ = [
  ['How often should I change my filter?', 'Check it once a month. Most need changing every one to three months, and more often with pets or in dusty weather.'],
  ['Why is one room hotter than the rest?', 'Make sure the vent in that room is open and nothing is blocking the return grille. Closing vents in other rooms won’t push more air there, and it makes the system work harder.'],
  ['Is water dripping near the indoor unit normal?', 'No. Your AC pulls water out of the air, and it should drain away. A drip usually means a clogged drain line or a full drain pan. If it keeps dripping, shut the system off and call a pro.'],
  ['Why does my AC keep turning on and off?', 'That’s called short cycling. Start with a clean filter and a clear outdoor unit. If it keeps doing it, have a tech take a look.'],
  ['My thermostat screen is blank. What should I check?', 'Change the batteries if it takes them. Then check the breaker for the heating and air system.'],
  ['Do you work on new construction?', `Yes, that’s most of our work. <a href="${UPLOAD}">Upload your plans</a> or call <a href="${TEL}" class="nowrap">${PHONE}</a>.`],
];

const tipPhoto = (n, alt, pos = '') => `<figure class="tip-photo card">${img(n, alt, { sizes: '(min-width: 1000px) 704px, 100vw', pos })}</figure>`;

if (existsSync(`${DIR}/education.html`)) unlinkSync(`${DIR}/education.html`);
if (existsSync(`${DIR}/send-your-plans.html`)) unlinkSync(`${DIR}/send-your-plans.html`);
page({
  file: 'hvac-tips.html',
  title: `HVAC Tips for Homeowners | ${NAME}`,
  desc: 'Plain HVAC tips for homeowners: the thermostat-at-65 myth, how AC removes heat, why your AC is not blowing cold, why a heater smells when it first turns on, and common questions.',
  head: `<script type="application/ld+json">${faqLd(TIPS_FAQ)}</script>`,
  body: `
${plainHero({ cls: 'tips-hero', eyebrow: 'HVAC Tips', h1: 'Small Fixes You Can<br> Do Yourself.', lead: 'Short, easy answers to the questions homeowners ask most. Try these first. Most take a few minutes.' })}
<section class="section tips-sec" aria-label="Tips">
  <div class="wrap edu-layout">
    <nav class="toc" aria-label="On this page">
      <p>On this page</p>
      <ol>
        <li><a href="#thermostat">The 65 degree myth</a></li>
        <li><a href="#removes-heat">AC removes heat</a></li>
        <li><a href="#not-cold">AC not blowing cold</a></li>
        <li><a href="#heater-smell">Heater smell</a></li>
        <li><a href="#faq">Common questions</a></li>
      </ol>
    </nav>
    <div>
      <article class="article rv" id="thermostat">
        <p class="eyebrow">Myth</p>
        <h2>Setting It to 65 Won’t Cool the House Faster.</h2>
        ${tipPhoto('thermostat-dial', 'A finger turning the dial on a black wall thermostat set to 63', '--pos:45% 45%')}
        <p class="kicker">Most AC systems run at one speed. Turning the thermostat way down doesn’t make the air come out any colder.</p>
        <p>The thermostat is a switch, not a gas pedal. Set it to 74 or 65 and the system blows the same air at the same rate. The lower number just keeps it running longer, past where you wanted it, and you pay for every extra minute.</p>
        <p>Set it where you want the house to end up and leave it there. On the hottest afternoons it can take a while to catch up. That’s normal.</p>
      </article>

      <article class="article rv" id="removes-heat">
        <p class="eyebrow">Myth</p>
        <h2>AC Doesn’t Make Cold. It Removes Heat.</h2>
        ${tipPhoto('condenser-rain', 'Outdoor AC condenser in a green backyard, with rain falling', '--pos:60% 50%')}
        <p class="kicker">An air conditioner moves heat from inside your house to the outside. Cold is what’s left behind.</p>
        <p>Refrigerant picks up heat at the indoor coil, carries it through the copper lines, and lets it go at the outdoor unit. That’s why the air coming off the outdoor unit feels hot. Two things follow from that:</p>
        <ul class="checks">
          <li><b>Keep the outdoor unit clear.</b><p>It has to dump heat. Keep weeds, leaves, and stored stuff a couple of feet back.</p></li>
          <li><b>Keep air moving inside.</b><p>The indoor coil can only pick up heat from air that reaches it. A clean filter and open vents matter.</p></li>
        </ul>
      </article>

      <article class="article rv" id="not-cold">
        <p class="eyebrow">Troubleshooting</p>
        <h2>Why Isn’t My AC Blowing Cold?</h2>
        ${tipPhoto('dusty-filter', 'Close-up of a clogged, dusty pleated air filter')}
        <p class="kicker">Before you call, check the airflow. Most “my AC isn’t cooling” calls turn out to be an airflow problem, not a refrigerant one.</p>
        <p>Go through these in order:</p>
        <ul class="checks">
          <li><b>Clogged filter.</b><p>Pull the filter and hold it up to a light. If you can’t see through it, replace it. It’s the most common cause by far.</p></li>
          <li><b>Frozen indoor coil.</b><p>Ice on the indoor coil or the bigger copper line means the coil froze, usually from low airflow. Turn the cooling off and run just the fan until it thaws, which can take a few hours. Then change the filter and open the vents before you try again.</p></li>
          <li><b>Dirty outdoor coil.</b><p>If the fins on the outdoor unit are caked with dirt, cottonwood, or grass clippings, it can’t get rid of heat. Shut the power off at the disconnect and rinse the fins gently with a garden hose. No pressure washer.</p></li>
          <li><b>Low refrigerant.</b><p>Check this last, not first. Refrigerant doesn’t get used up, so if it’s low, there’s a leak. That’s a job for a licensed tech who can find and fix it, not just top it off.</p></li>
        </ul>
        <div class="callout"><p><b>Why airflow comes first:</b> a dirty filter or a frozen coil can make the system look low on refrigerant. Adding refrigerant to a system with an airflow problem overcharges it and causes new trouble.</p></div>
      </article>

      <article class="article rv" id="heater-smell">
        <p class="eyebrow">Heating</p>
        <h2>Why Does the Heater Smell When It First Turns On?</h2>
        ${tipPhoto('wall-register', 'Metal heating register low on a wall inside a home, beside a door', '--pos:45% 60%')}
        <p class="kicker">That dusty, slightly burnt smell the first time you run the heat each fall is usually dust burning off.</p>
        <p>Over the summer, dust settles on the burners, the heat exchanger, or the electric heat strips. The first time they heat up, it burns off. The smell should fade within the first few hours. Opening a window and changing the filter helps.</p>
        <div class="callout warn"><p><b>When it’s not dust:</b> if the smell doesn’t fade, or it smells like burning plastic or hot wiring, turn the system off and call a pro. If you smell gas (like rotten eggs), don’t touch any switches. Get everyone out and call the gas company or 911 from outside.</p></div>
      </article>

      <section class="article tips-faq" id="faq" aria-labelledby="tfaq-title">
        <p class="eyebrow rv">FAQ</p>
        <h2 id="tfaq-title" class="rv">Common Questions.</h2>
        ${faqList(TIPS_FAQ, 1)}
      </section>

      <div class="edu-end card rv">
        <p class="eyebrow">For Builders and Contractors</p>
        <h2>Got a Big Project? We Can Handle It.</h2>
        <p class="lead">New homes, housing tracts, commercial and TI work, restaurant kitchens, or a batch of changeouts.</p>
        ${btnPlans()}
      </div>
    </div>
  </div>
</section>
`,
});

// ================= UPLOAD YOUR PLANS =================
const field = (name, label, { type = 'text', req = true, auto = '', ph = '', mode = '' } = {}) => `<div class="field">
  <label for="f-${name}">${label}${req ? '' : ' <span class="opt">(optional)</span>'}</label>
  <input id="f-${name}" name="${name}" type="${type}"${auto ? ` autocomplete="${auto}"` : ''}${ph ? ` placeholder="${ph}"` : ''}${mode ? ` inputmode="${mode}"` : ''}${req ? ' required aria-required="true"' : ''}>
  <p class="err">Please add your ${label.toLowerCase()}.</p>
</div>`;

page({
  file: UPLOAD,
  title: `Upload Your Plans | ${NAME}`,
  desc: `Upload your plan set to ${NAME}. PDF plan sets of any size. New homes, housing tracts, multi-family, commercial, TI, restaurant kitchens and hoods, exposed spiral ductwork, installs and changeouts.`,
  scripts: '<script src="js/plans.js" defer></script>',
  body: `
${plainHero({ eyebrow: 'Plan Upload', h1: 'Upload Your Plans.', lead: 'Tell us about the job and upload the PDF plan set. Any size, up to 20 files at a time.' })}
<section class="section tight" aria-label="Plan upload form">
  <div class="wrap form-layout">
    <div class="rv">
      <form class="plans-form card" data-hide-bar data-plans-form data-api="${API}" novalidate>
        <div class="form-row two">
          ${field('name', 'Name', { auto: 'name' })}
          ${field('mobile', 'Mobile number', { type: 'tel', auto: 'tel', mode: 'tel' })}
        </div>
        <div class="form-row two">
          ${field('company', 'Company name', { auto: 'organization' })}
          ${field('address', 'Business address', { req: false, auto: 'street-address' })}
        </div>
        ${field('location', 'Project location', { ph: 'City, subdivision, or address' })}
        <fieldset class="field">
          <legend>Project type</legend>
          <div class="types">
            ${PROJECT_TYPES.map((t) => `<label><input type="radio" name="type" value="${t}" required><span>${t}</span></label>`).join('')}
          </div>
          <p class="err">Please pick a project type.</p>
        </fieldset>
        <div class="field">
          <label for="f-notes">Notes <span class="opt">(optional)</span></label>
          <textarea id="f-notes" name="notes" placeholder="Number of homes or lots, timeline, equipment, anything we should know"></textarea>
        </div>
        <div class="field">
          <span class="sr-only" id="plans-label">Plan files</span>
          <div class="drop" data-drop>
            ${I.plans}
            <b>Drop PDF plan sets here</b>
            <p>Any size. Up to 20 files at a time.</p>
            <span class="btn btn-ghost">Choose files</span>
            <input type="file" accept="application/pdf,.pdf" multiple aria-labelledby="plans-label">
          </div>
          <ul class="files" data-files aria-live="polite"></ul>
        </div>
        <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <div class="progress" data-progress role="status" aria-live="polite">
          <div class="progress-top"><span data-progress-label>Uploading your plans</span><span data-progress-num></span></div>
          <div class="progress-bar"><span></span></div>
          <p class="fine" data-progress-note></p>
        </div>
        <p class="form-error" data-form-error role="alert"></p>
        <div class="submit-row">
          <button class="btn btn-primary" type="submit">${I.upload}Upload Your Plans</button>
          <p class="fine">No plans yet? Send the details anyway and we’ll call you.</p>
        </div>
        <p class="demo-note">${I.info}<span>Preview: while this site is a preview, submissions go to Ben Young Web Design for testing, not to Sonny’s.</span></p>
      </form>
      <div class="done-card card" data-done tabindex="-1" role="status">
        <div class="ok">${I.check}</div>
        <h2>Got It. Thank You.</h2>
        <p class="lead" data-done-count>Your plan set is in, and our team has your details.</p>
        <p><span data-done-next>We’ll go through the plans and call you.</span> Need to add something? Call <a href="${TEL}">${PHONE}</a>, 6 am to 6 pm.</p>
      </div>
    </div>
    <aside class="form-aside card rv" style="--d:120ms" aria-label="Contact and next steps">
      <ul class="aside-list">
        <li><b>Rather talk first?</b><a class="big" href="${TEL}">${PHONE}</a></li>
        <li><b>Email</b><a href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li><b>Hours</b><span>6 am to 6 pm</span></li>
        <li><b>What happens next</b><span>We review the plans, call with any questions, and send a quote.</span></li>
        <li><b>Where we work</b><span>About two hours from Clovis: Merced to Tulare, and out toward the coast.</span></li>
        <li>${LICENSE}</li>
      </ul>
    </aside>
  </div>
</section>
`,
});
