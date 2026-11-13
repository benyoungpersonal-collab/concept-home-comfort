#!/usr/bin/env node
/* Builds the Sonny's Air Conditioning preview (contractor site) into sonnys-air-conditioning/.
   Six pages share one header, footer, and inline logo. Headlines go through title-case.mjs.
   Run from the repo root: node scripts/build-sonnys-ac.mjs */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { titleCaseHtml } from './title-case.mjs';

const DIR = 'sonnys-air-conditioning';
const BASE = 'https://byw-home-comfort.netlify.app/sonnys-air-conditioning/';
const API = 'https://sonnys-plans.byw-video.workers.dev';
// Link preview picture (scripts/share-image.cjs). Make a new dated one whenever the hero changes.
const OG = BASE + 'images/og-share-2026-11-13.jpg';
const PHONE = '(559) 392-0743';
const TEL = 'tel:+15593920743';
const EMAIL = 'gwayne@sonnysair.com';
const NAME = "Sonny's Air Conditioning";
const LICENSE = `<p class="license-line"><span>CSLB #1129931</span><span>C-20 HVAC</span><i class="lb" aria-hidden="true"></i><span>Bonded</span><span>Workers' comp</span></p>`;

// ---------- logo (George's design.com logo, outline removed for the dark background) ----------
const logoSvg = readFileSync(`${DIR}/images/logo-on-dark.svg`, 'utf8');
const logoBody = logoSvg.slice(logoSvg.indexOf('>') + 1, logoSvg.lastIndexOf('</svg>'));
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><g id="sac-logo">${logoBody}</g></defs></svg>`;
const MARK = (cls = 'brand-mark') => `<svg class="${cls}" viewBox="400 -4 506 341" aria-hidden="true"><use href="#sac-logo"/></svg>`;
const WORD = `<svg class="brand-word" viewBox="48 422 1184 74" aria-hidden="true"><use href="#sac-logo"/></svg>`;
const FULL = `<svg class="footer-logo" viewBox="0 0 1280 580.8" role="img" aria-label="${NAME}: Transparent, Honest, Predictable"><use href="#sac-logo"/></svg>`;

/* Header mark for the one-time logo intro: George's own mark paths, unchanged, split into
   the three rings, the back ring, and the wind lines so each can animate. When the intro
   ends nothing is moved or faded, so it is the original artwork (see qa: logo compare). */
function animatedMark() {
  const gs = [...logoBody.matchAll(/<g transform="(matrix\([^"]+\))"/g)].map((m) => m[1]);
  const paths = [...logoBody.matchAll(/<path[^>]*>/g)].slice(0, 3).map((m) => m[0]);
  const outer = gs[1], inner = gs.slice(2, 5);
  const d2 = paths[2].match(/ d="([^"]+)"/)[1];
  const rings = d2.trim().split(/(?=M )/).filter((s) => s.trim());
  if (rings.length !== 3) throw new Error('Logo rings: expected 3 subpaths, got ' + rings.length);
  const ringPath = (i) => paths[2].replace(/ d="[^"]+"/, ` d="${rings[i].trim()}"`);
  return `<svg class="brand-mark lg" viewBox="400 -4 506 341" aria-hidden="true"><g transform="${outer}">` +
    `<g transform="${inner[0]}"><g class="lg-r3 lg-back">${paths[0]}</g></g>` +
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
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  plans: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 6h20l8 8v28H10z"/><path d="M30 6v8h8M16 22h16M16 28h16M16 34h10"/></svg>',
};

const btnPlans = (cls = '') => `<a class="btn btn-primary ${cls}" href="send-your-plans.html">${I.upload}Send Your Plans</a>`;
const btnCall = (cls = 'btn-ghost') => `<a class="btn ${cls}" href="${TEL}">${I.phone}Call ${PHONE}</a>`;

const NAV = [
  ['index.html', 'Home'], ['services.html', 'Services'], ['projects.html', 'Projects'],
  ['about.html', 'About'], ['hvac-tips.html', 'HVAC Tips'], ['send-your-plans.html', 'Send Your Plans'],
];

function header(page) {
  const links = NAV.filter(([h]) => h !== 'send-your-plans.html').map(([h, t]) => `<a href="${h}"${h === page ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const mlinks = NAV.map(([h, t]) => `<li><a href="${h}"${h === page ? ' aria-current="page"' : ''}>${t}</a></li>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="${NAME}, home">${MARK_ANIM}${WORD}</a>
    <nav class="nav" aria-label="Main">${links}</nav>
    <div class="header-cta"><a class="header-phone" href="${TEL}">${PHONE}</a>${btnPlans()}</div>
    <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu" data-menu-open>${I.menu}</button>
  </div>
</header>
<dialog class="menu" id="menu" aria-label="Menu" data-menu>
  <div class="wrap">
    <div class="menu-top"><a class="brand" href="index.html" aria-label="${NAME}, home">${MARK()}${WORD}</a><button class="menu-btn" type="button" aria-label="Close menu" data-menu-close>${I.close}</button></div>
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
        <p>HVAC for general contractors, builders, and developers. New construction, housing tracts, commercial, and installs. Based in Clovis, CA.</p>
        ${LICENSE}
      </div>
      <div>
        <p class="footer-title">Pages</p>
        <ul class="footer-links">${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul>
      </div>
      <div>
        <p class="footer-title">Contact</p>
        <a class="footer-phone" href="${TEL}">${PHONE}</a>
        <p><a class="footer-mail" href="mailto:${EMAIL}">${EMAIL}</a></p>
        <p>Hours: 6 am to 6 pm</p>
        <p>Merced to Tulare, and out toward the coast. Within about 2 hours of Clovis.</p>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="concept-pill"><b aria-hidden="true">BY</b>Homepage preview for ${NAME} by Ben Young Web Design.</p>
      <p>Sample photos stand in until we add photos of George's own work.</p>
    </div>
  </div>
</footer>
<nav class="call-bar" aria-label="Quick contact">
  <a class="btn btn-ghost" href="${TEL}">${I.phone}Call</a>
  <a class="btn btn-primary" href="send-your-plans.html">${I.upload}Send Plans</a>
</nav>`;
}

const LD = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'HVACBusiness', '@id': BASE + '#business', name: NAME, url: BASE,
  telephone: '+1-559-392-0743', email: EMAIL, slogan: 'Transparent. Honest. Predictable.',
  address: { '@type': 'PostalAddress', addressLocality: 'Clovis', addressRegion: 'CA', addressCountry: 'US' },
  areaServed: ['Merced', 'Madera', 'Fresno', 'Clovis', 'Visalia', 'Hanford', 'Tulare'].map((c) => ({ '@type': 'City', name: c + ', CA' })),
  description: 'HVAC contractor for general contractors, builders, and developers: residential new construction, housing tracts and multi-family, commercial new construction, and installs and changeouts. CSLB #1129931 (C-20).',
});

const faqLd = (items) => JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } })),
});

function page({ file, title, desc, body, scripts = '', head = '' }) {
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
<link rel="preload" href="fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/sac.css">
<script>(function(d){d.classList.add('js');try{if(!sessionStorage.getItem('sac-logo')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('logo-intro');sessionStorage.setItem('sac-logo','1')}}catch(e){}})(document.documentElement)</script>
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
${file === 'index.html' ? `<link rel="preload" as="image" imagesrcset="${srcset('tract-aerial', [640, 1024, 1600, 2400])}" imagesizes="100vw" fetchpriority="high">\n<script type="application/ld+json">${LD}</script>` : ''}
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
  // Title case every headline (h1, h2, h3)
  html = html.replace(/(<h([123])\b[^>]*>)([\s\S]*?)(<\/h\2>)/g, (m, a, n, b, c) => a + titleCaseHtml(b) + c);
  if (/—/.test(html)) throw new Error(`Em dash found in ${file}`);
  if (/crew of 12|On the crew/i.test(html)) throw new Error(`Crew of 12 found in ${file}`);
  writeFileSync(`${DIR}/${file}`, html);
  console.log('built', file, (html.length / 1024).toFixed(1) + ' KB');
}

const srcset = (n, ws = [640, 1024, 1600]) => ws.map((w) => `images/photos/${n}-${w}.webp ${w}w`).join(', ');
const img = (n, alt, { ws, sizes = '100vw', pos = '', eager = false, w = 1600, h = 1067 } = {}) =>
  `<img src="images/photos/${n}-${(ws || [640, 1024, 1600]).slice(-1)[0]}.webp" srcset="${srcset(n, ws)}" sizes="${sizes}" width="${w}" height="${h}" alt="${alt}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}${pos ? ` style="${pos}"` : ''}>`;

function hero({ photo, alt, pos, eyebrow, h1, sub = '', lead, ctas = true, cls = '', ws }) {
  return `<section class="hero ${cls}" aria-labelledby="hero-title">
  <div class="hero-photo">${img(photo, alt, { ws, eager: true, pos, w: 2400, h: 1600 })}</div>
  <div class="wrap hero-wrap">
    <div class="hero-card">
      <p class="eyebrow">${eyebrow}</p>
      <h1 id="hero-title">${h1}</h1>
      ${sub}
      <p class="lead">${lead}</p>
      ${ctas ? `<div class="btn-row" data-hide-bar>${btnPlans()}${btnCall()}</div>` : ''}
      ${ctas ? LICENSE.replace('license-line', 'license-line fine') : ''}
    </div>
  </div>
</section>`;
}

function plainHero({ eyebrow, h1, lead }) {
  return `<section class="hero page-hero no-photo" aria-labelledby="hero-title">
  <div class="wrap hero-wrap"><div class="hero-card">
    <p class="eyebrow">${eyebrow}</p>
    <h1 id="hero-title">${h1}</h1>
    <p class="lead">${lead}</p>
  </div></div>
</section>`;
}

const CTA_LINE = 'You can send your plans or give us a call. Hours are 6 am to 6 pm.';
const cta = (h = 'Got a Project Coming Up?') => `<section class="section cta" aria-labelledby="cta-title">
  <div class="wrap cta-inner">
    <div class="rv"><p class="eyebrow">Let’s Get You Going</p><h2 id="cta-title">${h}</h2><p class="lead">${CTA_LINE}</p></div>
    <div class="cta-side rv" style="--d:120ms" data-hide-bar>${btnPlans()}${btnCall()}<p class="fine">Based in Clovis, CA. Working from Merced to Tulare, and out toward the coast.</p></div>
  </div>
</section>`;

const faqList = (items, open = 0) => `<div class="faq">${items.map(([q, a], i) => `<details class="faq-item card rv" style="--d:${Math.min(i, 4) * 60}ms"${i < open ? ' open' : ''}>
  <summary><span>${q}</span><i aria-hidden="true">${I.plus}</i></summary>
  <div class="faq-a"><p>${a}</p></div>
</details>`).join('')}</div>`;

// ---------- service area map (drawn from real coordinates) ----------
const CITIES = ['Merced', 'Chowchilla', 'Madera', 'Fresno', 'Clovis', 'Sanger', 'Kerman', 'Selma', 'Reedley', 'Kingsburg', 'Dinuba', 'Hanford', 'Lemoore', 'Visalia', 'Tulare'];
const COAST = ['Los Banos', 'Firebaugh', 'Coalinga', 'Paso Robles'];
const GEO = {
  Merced: [37.302, -120.483], Chowchilla: [37.123, -120.260], Madera: [36.961, -120.061], Fresno: [36.738, -119.787],
  Clovis: [36.825, -119.703], Sanger: [36.708, -119.556], Kerman: [36.723, -120.060], Selma: [36.571, -119.612],
  Reedley: [36.596, -119.450], Kingsburg: [36.514, -119.554], Dinuba: [36.543, -119.387], Hanford: [36.327, -119.646],
  Lemoore: [36.301, -119.783], Visalia: [36.330, -119.292], Tulare: [36.208, -119.347],
  'Los Banos': [37.058, -120.850], Firebaugh: [36.859, -120.456], Coalinga: [36.140, -120.360], 'Paso Robles': [35.627, -120.691],
};
const COASTLINE = [[37.02, -122.2], [36.974, -122.03], [36.97, -121.9], [36.93, -121.86], [36.80, -121.79], [36.69, -121.81], [36.60, -121.89], [36.64, -121.94],
  [36.55, -121.93], [36.52, -121.95], [36.31, -121.90], [36.13, -121.65], [36.02, -121.55], [35.86, -121.46], [35.78, -121.33], [35.67, -121.28],
  [35.64, -121.19], [35.56, -121.10], [35.44, -120.90], [35.37, -120.86], [35.27, -120.88], [35.18, -120.73], [35.14, -120.64], [35.10, -120.63], [34.90, -120.67]];
const HWY99 = ['Merced', 'Chowchilla', 'Madera', 'Fresno', 'Selma', 'Kingsburg', 'Tulare'];

function areaMap() {
  const lat0 = 37.62, lon0 = -122.1, k = 210, kx = k * Math.cos(36.3 * Math.PI / 180);
  const W = Math.round((122.1 - 118.62) * kx), H = Math.round((37.62 - 34.98) * k);
  const P = ([la, lo]) => [((lo - lon0) * kx).toFixed(1), ((lat0 - la) * k).toFixed(1)];
  const coast = COASTLINE.map(P);
  const ocean = `M-20,${coast[0][1]} L${coast.map((c) => c.join(',')).join(' L')} L-20,${H + 20} Z`;
  const [cx, cy] = P(GEO.Clovis);
  const r = (1.6 * k).toFixed(0);
  const hwy = HWY99.map((c) => P(GEO[c]).join(',')).join(' ');
  const labels = { Merced: 'r', Madera: 'l', Fresno: 'b', Clovis: 'hq', Visalia: 'r', Tulare: 'r', Hanford: 'b', 'Los Banos': 'l', Coalinga: 'l', 'Paso Robles': 'r', Reedley: 'r' };
  const dots = Object.entries(GEO).map(([n, g]) => {
    const [x, y] = P(g);
    const side = labels[n];
    const label = !side ? '' : side === 'hq'
      ? `<text class="m-hq" x="${+x + 14}" y="${+y - 10}">Clovis</text><text class="m-hq-sub" x="${+x + 14}" y="${+y + 8}">Home base</text>`
      : side === 'b' ? `<text x="${x}" y="${+y + 24}" text-anchor="middle">${n}</text>`
      : `<text x="${side === 'r' ? +x + 11 : +x - 11}" y="${+y + 6}" text-anchor="${side === 'r' ? 'start' : 'end'}">${n}</text>`;
    return n === 'Clovis' ? '' : `<circle class="m-dot" cx="${x}" cy="${y}" r="4.5"/>${label}`;
  }).join('');
  const clovisLabel = `<text class="m-hq" x="${+cx + 17}" y="${+cy - 6}">Clovis</text><text class="m-hq-sub" x="${+cx + 17}" y="${+cy + 14}">Home base</text>`;
  return `<svg class="area-svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="map-title map-desc">
  <title id="map-title">Service area map</title>
  <desc id="map-desc">Map of the Central Valley and the coast. Clovis is home base. The service area runs from Merced to Tulare along Highway 99 and out toward the coast as far as Paso Robles, within about two hours of Clovis.</desc>
  <defs>
    <radialGradient id="m-reach" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#0097D7" stop-opacity=".30"/><stop offset="75%" stop-color="#0097D7" stop-opacity=".12"/><stop offset="100%" stop-color="#0097D7" stop-opacity=".04"/></radialGradient>
    <pattern id="m-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgb(141 219 231 / .06)" stroke-width="1"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#142334"/>
  <rect width="${W}" height="${H}" fill="url(#m-grid)"/>
  <path class="m-ocean" d="${ocean}"/>
  <polyline class="m-coast" points="${coast.map((c) => c.join(',')).join(' ')}"/>
  <text class="m-water" x="18" y="${P([35.45, -122.0])[1]}">Pacific</text>
  <text class="m-water" x="18" y="${(+P([35.45, -122.0])[1] + 22).toFixed(0)}">Ocean</text>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#m-reach)"/>
  <circle class="m-ring" cx="${cx}" cy="${cy}" r="${r}"/>
  <text class="m-ring-label" x="${(+cx - r * 0.62).toFixed(0)}" y="${(+cy + r * 0.86).toFixed(0)}">About 2 hours from Clovis</text>
  <polyline class="m-hwy" points="${hwy}"/>
  <g class="m-cities">${dots}</g>
  <circle class="m-hq-ring" cx="${cx}" cy="${cy}" r="11"/>
  <circle class="m-hq-dot" cx="${cx}" cy="${cy}" r="6"/>
  ${clovisLabel}
</svg>`;
}

// ================= HOME =================
const HOME_FAQ = [
  ['Who do you work with?', 'General contractors, builders, and developers. We do HVAC for residential new construction, housing tracts and multi-family, commercial new construction, and installs and changeouts.'],
  ['How do I send you plans?', `Upload them on our <a href="send-your-plans.html">Send Your Plans</a> page. Big plan sets are fine, up to 2 GB per file and 20 files at a time, and they come straight to us. Or call <a href="${TEL}" class="nowrap">${PHONE}</a>.`],
  ['What areas do you cover?', 'We’re based in Clovis and work from Merced to Tulare, and out toward the coast, within about two hours of Clovis.'],
  ['Do you do changeouts?', 'Yes. Installs and changeouts: new equipment in, old equipment out.'],
];

const svcCard = (href, photo, alt, pos, num, h3, p, d) => `<a class="svc card" href="${href}">
  <span class="svc-media rv-side">${img(photo, alt, { sizes: '(min-width: 1080px) 25vw, (min-width: 640px) 50vw, 100vw', pos })}</span>
  <span class="svc-body rv" style="--d:${d}ms"><span class="svc-num">${num}</span><h3>${h3}</h3><p>${p}</p><span class="more">Learn more ${I.arrow}</span></span>
</a>`;

page({
  file: 'index.html',
  title: `${NAME} | HVAC for New Construction and Housing Tracts`,
  desc: `${NAME}: HVAC for general contractors, builders, and developers. New construction, housing tracts, commercial, and installs from Merced to Tulare. Based in Clovis. CSLB #1129931. Call ${PHONE}.`,
  head: `<script type="application/ld+json">${faqLd(HOME_FAQ)}</script>`,
  body: `
${hero({
    photo: 'tract-aerial', ws: [640, 1024, 1600, 2400], alt: 'Aerial view of a new housing tract under construction, with framed homes and fresh roof sheathing along a curving street',
    pos: '--pos:38% 50%;--pos-d:50% 50%', eyebrow: 'C-20 HVAC Contractor · Clovis, CA',
    h1: '<span>Transparent.</span> <span>Honest.</span> <span>Predictable.</span>',
    sub: '<p class="hero-sub">Want to Give Us a Shot? <a href="send-your-plans.html">Drop Your Plans Here.</a></p>',
    lead: 'The HVAC sub for general contractors, builders, and developers. New homes, housing tracts, and installs from Merced to Tulare. 20+ years in air conditioning.',
  })}

<section class="section tight stats-sec" aria-label="At a glance">
  <div class="wrap">
    <ul class="facts">
      <li class="card rv"><b><span data-count="20">20</span>+</b><span>Years of air conditioning experience.</span></li>
      <li class="card rv" style="--d:90ms"><b><span data-count="6">6</span> to <span data-count="6">6</span></b><span>Hours, 6 am to 6 pm.</span></li>
      <li class="card rv" style="--d:180ms"><b><span data-count="2">2</span> hrs</b><span>Service radius from Clovis: Merced to Tulare, and out toward the coast.</span></li>
    </ul>
  </div>
</section>

<section class="section svc-sec" id="services" aria-labelledby="svc-title">
  <div class="wrap">
    <div class="split-head">
      <div class="rv"><p class="eyebrow">What We Do</p><h2 id="svc-title">Built for Builders.</h2></div>
      <p class="lead rv" style="--d:100ms">Residential and commercial new construction, housing tracts, and installs. Send the plan set and we take it from there.</p>
    </div>
    <div class="svc-grid">
      ${svcCard('services.html#new-construction', 'framing-two-story', 'Two-story home in wood framing with scaffolding on a new construction site', '--pos:40% 50%', '01', 'Residential New Construction', 'Full HVAC systems for new homes, from your plan set.', 0)}
      ${svcCard('services.html#housing-tracts', 'townhomes', 'Row of new two-story townhomes with dumpsters out front on a construction site', '--pos:40% 50%', '02', 'Housing Tracts and Multi-Family', 'The same plans, lot after lot.', 80)}
      ${svcCard('services.html#commercial', 'commercial-steel', 'Steel frame of a large commercial building going up, with cranes and lifts', '--pos:50% 50%', '03', 'Commercial New Construction', 'HVAC for commercial new construction.', 160)}
      ${svcCard('services.html#installs', 'condenser-lineset', 'Technician connecting a refrigerant hose to the service valve on an outdoor AC condenser', '--pos:55% 50%', '04', 'Installs and Changeouts', 'New equipment in, old equipment out.', 240)}
    </div>
  </div>
</section>

<section class="section section-alt" id="how-it-works" aria-labelledby="steps-title">
  <div class="wrap">
    <div class="section-head rv"><p class="eyebrow">How It Works</p><h2 id="steps-title">Three Steps to Get Going.</h2></div>
    <ol class="steps">
      <li class="card rv"><h3>Give Us a Call.</h3><p>Tell George about the job: where it is, how many homes, and when you need us. <a href="${TEL}" class="nowrap">${PHONE}</a>, 6 am to 6 pm.</p></li>
      <li class="card rv" style="--d:100ms"><h3>Send Us Your Plans.</h3><p>Upload the PDF plan set, even if it runs hundreds of megabytes. <a href="send-your-plans.html">It comes straight to us.</a></p></li>
      <li class="card rv" style="--d:200ms"><h3>We’ll Get You Going.</h3><p>We go through the plans and get back to you with next steps.</p></li>
    </ol>
  </div>
</section>

<section class="band" aria-labelledby="band-title">
  ${img('crew-framing', 'Construction worker in a hard hat walking the top plate of a framed wall against a blue sky', { pos: '--pos:62% 40%' })}
  <div class="wrap">
    <div class="band-copy rv">
      <p class="eyebrow">Who We Are</p>
      <h2 id="band-title">20+ Years in Air Conditioning.</h2>
      <p class="lead">George has spent more than 20 years in the trade and has run his own company, based in Clovis, for about two years.</p>
      <a class="btn btn-ghost" href="about.html">About Sonny’s ${I.arrow}</a>
    </div>
  </div>
</section>

<section class="section area-sec" id="area" aria-labelledby="area-title">
  <div class="wrap area-grid">
    <div>
      <div class="rv">
        <p class="eyebrow">Service Area</p>
        <h2 id="area-title">Merced to Tulare,<br class="br-desk"> and Out Toward the Coast.</h2>
        <p class="lead" style="margin-top:22px">Based in Clovis. We take work within about two hours. Not sure if your site is in range? Call and ask.</p>
      </div>
      <div class="rv" style="--d:100ms">
        <ul class="cities">${CITIES.map((c) => `<li${c === 'Clovis' ? ' class="hq"' : ''}>${c}</li>`).join('')}</ul>
        <p class="cities-sub">Toward the coast</p>
        <ul class="cities">${COAST.map((c) => `<li>${c}</li>`).join('')}</ul>
      </div>
    </div>
    <figure class="area-map card rv-side">${areaMap()}<figcaption>Clovis is home base. Map is approximate.</figcaption></figure>
  </div>
</section>

<section class="section faq-sec" id="faq" aria-labelledby="faq-title">
  <div class="wrap faq-grid">
    <div class="rv">
      <p class="eyebrow">FAQ</p>
      <h2 id="faq-title">Questions From Builders.</h2>
      <p class="lead" style="margin-top:22px">Quick answers. Anything else, call George.</p>
      <a class="text-link" href="hvac-tips.html">See all HVAC tips ${I.arrow}</a>
    </div>
    ${faqList(HOME_FAQ, 1)}
  </div>
</section>

${cta()}
`,
});

// ================= SERVICES =================
const detail = (id, photo, alt, pos, eyebrow, h2, p, items = []) => `<article class="svc-detail" id="${id}">
  <figure class="card rv-side">${img(photo, alt, { sizes: '(min-width: 900px) 50vw, 100vw', pos })}</figure>
  <div class="rv">
    <p class="eyebrow">${eyebrow}</p>
    <h2>${h2}</h2>
    <p class="lead">${p}</p>
    ${items.length ? `<ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
  </div>
</article>`;

page({
  file: 'services.html',
  title: `Services | ${NAME}`,
  desc: `Residential and commercial new construction HVAC, housing tracts and multi-family, and installs and changeouts for builders and general contractors. ${NAME}, Clovis, CA. ${PHONE}.`,
  body: `
${hero({
    cls: 'page-hero', photo: 'framing-sky', alt: 'Wood framing of a new building against a clear blue sky, with scaffolding along the top floor',
    pos: '--pos:30% 50%;--pos-d:50% 45%', eyebrow: 'Services', h1: 'Full HVAC for<br> New Construction.',
    lead: 'Homes, housing tracts, multi-family, and commercial new construction, plus installs and changeouts. All for builders, general contractors, and developers.',
  })}
<section class="section" aria-label="Services">
  <div class="wrap">
    ${detail('new-construction', 'framing-two-story', 'Two-story home in wood framing with scaffolding on a new construction site', '--pos:40% 50%', '01 · New Construction', 'Residential New Construction.',
    'Full HVAC systems for new homes, from your plan set.', ['Ductwork', 'Condensers', 'Air handlers', 'Furnaces', 'Heat pumps'])}
    ${detail('housing-tracts', 'townhomes', 'Row of new two-story townhomes with dumpsters out front on a construction site', '--pos:40% 50%', '02 · Tracts and Multi-Family', 'Housing Tracts and Multi-Family.',
    'The same plans, lot after lot.')}
    ${detail('commercial', 'commercial-steel', 'Steel frame of a large commercial building going up, with cranes and lifts', '--pos:50% 50%', '03 · Commercial', 'Commercial New Construction.',
    'HVAC for commercial new construction.')}
    ${detail('installs', 'condenser-lineset', 'Technician connecting a refrigerant hose to the service valve on an outdoor AC condenser', '--pos:55% 50%', '04 · Installs and Changeouts', 'Installs and Changeouts.',
    'New equipment in, old equipment out.')}
    ${detail('your-team', 'blueprints', 'Hands working over a set of construction plans with an architect’s scale ruler and a rolled plan sheet', '--pos:50% 40%', '05 · Working With Your Team', 'Working With Your Team.',
    'Reading blueprints and plan sets, and coordinating with builders, electricians, and project managers.')}
  </div>
</section>
${cta('Have Plans Ready?')}
`,
});

// ================= PROJECTS =================
const proj = (photo, alt, pos, h3, d) => `<article class="proj card rv" style="--d:${d}ms">
  <div class="proj-media rv-side"><span class="proj-tag">Sample photo</span>${img(photo, alt, { sizes: '(min-width: 1080px) 33vw, (min-width: 700px) 50vw, 100vw', pos })}</div>
  <div class="proj-body"><h3>${h3}</h3><p>Sample photo. George’s own project photos will replace it.</p></div>
</article>`;

page({
  file: 'projects.html',
  title: `Projects | ${NAME}`,
  desc: `Project photos from ${NAME} are on the way. New construction, housing tracts, multi-family, commercial, and installs from Merced to Tulare.`,
  body: `
${plainHero({ eyebrow: 'Projects', h1: 'Projects.', lead: 'New construction, housing tracts, multi-family, commercial, and changeouts from Merced to Tulare. George’s own project photos are on the way.' })}
<section class="section tight" aria-label="Sample project photos">
  <div class="wrap">
    <p class="notice card">${I.info}<span><b>These are sample photos,</b> not George’s jobs. Each card will show one of his real projects, with the city and the scope of work, as soon as his photos come in.</span></p>
    <div class="proj-grid">
      ${proj('frame-fence', 'New home in wood framing behind a construction fence', '--pos:50% 55%', 'New Construction', 0)}
      ${proj('tract-aerial-2', 'Aerial view of a housing tract under construction, with framed homes along a cul-de-sac', '--pos:50% 50%', 'Housing Tract', 80)}
      ${proj('townhomes', 'Row of new two-story townhomes with dumpsters out front', '--pos:40% 50%', 'Multi-Family', 160)}
      ${proj('commercial-site', 'Large commercial steel frame going up behind a fenced, freshly graded site', '--pos:50% 50%', 'Commercial New Construction', 0)}
      ${proj('framing-scaffold', 'Two-story wood framing with scaffolding against a blue sky', '--pos:50% 50%', 'New Construction', 80)}
      ${proj('tech-gauge', 'Technician in a blue shirt working on an outdoor AC unit with a gauge', '--pos:50% 40%', 'Changeout', 160)}
    </div>
  </div>
</section>
${cta('Your Project Could Be Next.')}
`,
});

// ================= ABOUT =================
const OWNER_ART = `<svg viewBox="0 0 240 300" role="img" aria-label="Illustration of a man standing in for a photo of George"><path class="op-d" d="M26 300c2-58 40-90 94-90s92 32 94 90z"/><path class="op-l" d="M104 196h32v26l-16 14-16-14z"/><circle class="op-l" cx="120" cy="146" r="42"/><path class="op-d" d="M78 136c-2-30 18-48 44-48 26 0 44 16 42 46-6-14-22-22-42-22-20 0-36 8-44 24z"/><g class="op-eyes"><ellipse class="op-d" cx="105" cy="148" rx="4.5" ry="5.5"/><ellipse class="op-d" cx="135" cy="148" rx="4.5" ry="5.5"/></g><path class="op-ds" d="M107 166q13 11 26 0"/><g class="op-arm"><path class="op-ds op-sleeve" d="M184 236c10-20 18-38 22-62"/><circle class="op-l" cx="208" cy="160" r="15"/></g></svg>`;

page({
  file: 'about.html',
  title: `About | ${NAME}`,
  desc: `${NAME} is a Clovis HVAC contractor with 20+ years in air conditioning. CSLB #1129931, C-20, bonded, workers' comp.`,
  body: `
${hero({
    cls: 'page-hero hero-light', photo: 'framing-interior', ws: [640, 1024, 1600, 2400], alt: 'Bright, sunlit interior of a new home in wood framing, with open walls and ceiling joists',
    pos: '--pos:40% 50%;--pos-d:50% 50%', eyebrow: 'About', h1: 'A Clovis HVAC Contractor<br> for Builders.',
    lead: 'Sonny’s Air Conditioning does HVAC for general contractors, builders, and developers across the Central Valley.', ctas: false,
  })}
<section class="section" aria-labelledby="owner-title">
  <div class="wrap about-grid">
    <figure class="owner-ph card rv-side" style="margin:0"><span class="owner-tag">Your photo here</span>${OWNER_ART}</figure>
    <div class="rv">
      <p class="eyebrow">Meet the owner</p>
      <h2 id="owner-title">George, Owner.</h2>
      <p class="lead" style="margin-top:22px">George has worked in air conditioning for more than 20 years. About two years ago he started his own company, Sonny’s Air Conditioning, based in Clovis.</p>
      <ul class="timeline">
        <li><b>20+ years</b><span>In air conditioning</span></li>
        <li><b>About 2</b><span>Years running his own company</span></li>
        <li><b>C-20</b><span>HVAC license, CSLB #1129931. Bonded, with workers’ comp.</span></li>
      </ul>
      <p class="contact-line"><a href="${TEL}">${I.phone}${PHONE}</a><a href="mailto:${EMAIL}">${I.mail}${EMAIL}</a></p>
    </div>
  </div>
</section>
<section class="section section-alt words-sec" aria-labelledby="words-title">
  <div class="wrap">
    <h2 id="words-title" class="sr-only">In George’s Words</h2>
    <p class="eyebrow rv">In George’s words</p>
    <blockquote class="big-quote rv"><p>Specializing in doing the right thing, ALWAYS. Also Air Conditioning.</p></blockquote>
    <div class="quote-grid">
      <blockquote class="quote card rv" style="--d:0ms"><p>The same strength that can break things can also build them, but power without discipline is weakness.</p></blockquote>
      <blockquote class="quote card rv" style="--d:90ms"><p>God gave me power, not permission to misuse it.</p></blockquote>
      <blockquote class="quote card rv" style="--d:180ms"><p>I train the dog. I don’t change him.</p></blockquote>
    </div>
    <blockquote class="verse rv"><p>By the grace of God I am what I am.</p><cite>1 Corinthians 15:10</cite></blockquote>
  </div>
</section>
${cta()}
`,
});

// ================= HVAC TIPS =================
const TIPS_FAQ = [
  ['What should I set my thermostat to?', 'Set it to the temperature you actually want and leave it there. Setting it lower doesn’t cool the house any faster. It just runs longer.'],
  ['Is it normal for the outdoor unit to blow hot air?', 'Yes. That’s the heat your AC pulled out of the house. It means the system is doing its job.'],
  ['How do I know if my filter is clogged?', 'Pull it out and hold it up to a light. If you can’t see light through it, replace it.'],
  ['My AC froze up. What do I do?', 'Turn the cooling off and run just the fan until the ice melts, which can take a few hours. Then change the filter and make sure the vents are open before you turn cooling back on.'],
  ['Can I clean my outdoor unit myself?', 'Yes. Shut the power off at the disconnect, then rinse the fins gently with a garden hose. No pressure washer. Keep weeds and stored things a couple of feet back.'],
  ['Should I just add refrigerant?', 'No. Check airflow first: the filter, the vents, and the coils. Refrigerant doesn’t get used up, so if it’s low there’s a leak, and that’s a job for a licensed tech.'],
  ['Is a burning smell normal when the heat first comes on?', 'Usually, yes. It’s dust burning off and should fade within the first few hours. If you smell gas, get everyone out and call the gas company or 911 from outside.'],
  ['Do you work on new construction?', `Yes. That’s most of what we do, for builders, general contractors, and developers. <a href="send-your-plans.html">Send your plans</a> or call <a href="${TEL}" class="nowrap">${PHONE}</a>.`],
];

if (existsSync(`${DIR}/education.html`)) unlinkSync(`${DIR}/education.html`);
page({
  file: 'hvac-tips.html',
  title: `HVAC Tips for Homeowners | ${NAME}`,
  desc: 'Plain HVAC tips for homeowners: the thermostat-at-65 myth, how AC removes heat, why your AC is not blowing cold, why a heater smells when it first turns on, and common questions.',
  head: `<script type="application/ld+json">${faqLd(TIPS_FAQ)}</script>`,
  body: `
${plainHero({ eyebrow: 'HVAC Tips', h1: 'Small Fixes You Can<br> Do Yourself.', lead: 'Short, plain answers to the questions homeowners ask most. Try these first. Most take five minutes and no tools.' })}
<section class="section tight tips-sec" aria-label="Tips">
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
        <p class="kicker">Your AC cools at one speed. Turning the thermostat way down doesn’t make the air come out any colder.</p>
        <p>The thermostat is a switch, not a gas pedal. Whether you set it to 74 or 65, the system blows the same air at the same rate. A lower number just keeps it running longer, past the temperature you actually wanted, and you pay for every extra minute.</p>
        <p>Set it where you want the house to end up and leave it there. On the hottest afternoons it can take a while to catch up. That’s normal.</p>
      </article>

      <article class="article rv" id="removes-heat">
        <p class="eyebrow">How It Works</p>
        <h2>AC Doesn’t Make Cold. It Removes Heat.</h2>
        <p class="kicker">An air conditioner moves heat from inside your house to the outside. Cold is just what’s left behind.</p>
        <p>Refrigerant picks up heat at the indoor coil, carries it through the copper lines, and lets it go at the outdoor unit. That’s why the air blowing off the outdoor unit feels hot.</p>
        <p>It also explains a few things you can do yourself:</p>
        <ul class="checks">
          <li><b>Keep the outdoor unit clear.</b><p>It has to dump heat. Keep weeds, leaves, and stored stuff a couple of feet back from it.</p></li>
          <li><b>Keep air moving inside.</b><p>The indoor coil can only pick up heat from air that gets to it. A clean filter and open vents matter.</p></li>
        </ul>
      </article>

      <article class="article rv" id="not-cold">
        <p class="eyebrow">Troubleshooting</p>
        <h2>Why Isn’t My AC Blowing Cold?</h2>
        <p class="kicker">Check airflow before charge. Most “it needs more refrigerant” calls turn out to be an airflow problem.</p>
        <p>Go through these in order:</p>
        <ul class="checks">
          <li><b>Clogged filter.</b><p>Pull the filter and hold it up to a light. If you can’t see through it, replace it. A clogged filter starves the system of air, and it’s the most common cause by far.</p></li>
          <li><b>Frozen indoor coil.</b><p>Ice on the indoor coil or on the larger copper line means the coil froze, usually from low airflow. Turn the cooling off and run just the fan until it thaws, which can take a few hours. Then change the filter and make sure vents are open before you try again.</p></li>
          <li><b>Dirty outdoor coil.</b><p>If the fins on the outdoor unit are caked with dirt, cottonwood, or grass clippings, it can’t get rid of heat. Shut the power off at the disconnect, then rinse the fins gently with a garden hose. No pressure washer.</p></li>
          <li><b>Low refrigerant.</b><p>This is the last thing to check, not the first. Refrigerant doesn’t get used up, so if it’s low, there’s a leak. That’s a job for a licensed tech who can find and fix the leak, not just top it off.</p></li>
        </ul>
        <div class="callout"><p><b>Why airflow comes first:</b> a dirty filter or frozen coil can make the system look low on refrigerant. Adding refrigerant to a system with an airflow problem overcharges it and causes new problems.</p></div>
      </article>

      <article class="article rv" id="heater-smell">
        <p class="eyebrow">Heating</p>
        <h2>Why Does the Heater Smell When It First Turns On?</h2>
        <p class="kicker">That dusty, slightly burnt smell the first time you run the heat each fall is usually just dust burning off.</p>
        <p>Over the summer, dust settles on the burners, the heat exchanger, or the electric heat strips. The first time they heat up, it burns off. The smell should fade within the first few hours of running. Opening a window and changing the filter helps.</p>
        <div class="callout warn"><p><b>When it’s not dust:</b> if the smell doesn’t fade, or it smells like burning plastic or hot wiring, turn the system off and call a pro. If you smell gas (like rotten eggs), don’t touch any switches. Get everyone out and call the gas company or 911 from outside.</p></div>
      </article>

      <section class="article tips-faq" id="faq" aria-labelledby="tfaq-title">
        <p class="eyebrow rv">FAQ</p>
        <h2 id="tfaq-title" class="rv">Common Questions.</h2>
        ${faqList(TIPS_FAQ, 1)}
      </section>

      <div class="edu-end card rv">
        <p class="eyebrow">For Builders and Contractors</p>
        <h2>Got a Bigger Project?</h2>
        <p class="lead">New construction, housing tracts, or a batch of changeouts? That’s what we do every day.</p>
        <a class="btn btn-primary" href="send-your-plans.html">${I.upload}Send Your Plans</a>
      </div>
    </div>
  </div>
</section>
`,
});

// ================= SEND YOUR PLANS =================
const field = (name, label, { type = 'text', req = true, auto = '', ph = '', mode = '' } = {}) => `<div class="field">
  <label for="f-${name}">${label}${req ? '' : ' <span class="opt">(optional)</span>'}</label>
  <input id="f-${name}" name="${name}" type="${type}"${auto ? ` autocomplete="${auto}"` : ''}${ph ? ` placeholder="${ph}"` : ''}${mode ? ` inputmode="${mode}"` : ''}${req ? ' required aria-required="true"' : ''}>
  <p class="err">Please add your ${label.toLowerCase()}.</p>
</div>`;

page({
  file: 'send-your-plans.html',
  title: `Send Your Plans | ${NAME}`,
  desc: `Upload your plan set to ${NAME}. Large PDF plan sets welcome, up to 2 GB per file. New construction, housing tracts, commercial, installs and changeouts.`,
  scripts: '<script src="js/plans.js" defer></script>',
  body: `
${plainHero({ eyebrow: 'Send Your Plans', h1: 'Send Us Your Plans.', lead: 'Tell us about the job and upload the PDF plan set. Big files are fine: up to 2 GB each, 20 files at a time.' })}
<section class="section tight" aria-label="Plan upload form">
  <div class="wrap form-layout">
    <div class="rv">
      <form class="plans-form card" data-hide-bar data-plans-form data-api="${API}" novalidate>
        <div class="form-row two">
          ${field('name', 'Name', { auto: 'name' })}
          ${field('mobile', 'Mobile number', { type: 'tel', auto: 'tel', mode: 'tel', ph: '(559) 555-0123' })}
        </div>
        <div class="form-row two">
          ${field('company', 'Company name', { auto: 'organization' })}
          ${field('address', 'Business address', { req: false, auto: 'street-address' })}
        </div>
        ${field('location', 'Project location', { ph: 'City, subdivision, or address' })}
        <fieldset class="field">
          <legend>Project type</legend>
          <div class="types">
            ${['New construction', 'Housing tract', 'Install or changeout', 'Other'].map((t) => `<label><input type="radio" name="type" value="${t}" required><span>${t}</span></label>`).join('')}
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
            <p>Up to 2 GB per file, 20 files at a time</p>
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
          <button class="btn btn-primary" type="submit">${I.upload}Send Your Plans</button>
          <p class="fine">No plans yet? Send the details anyway and we’ll call you.</p>
        </div>
        <p class="demo-note">${I.info}<span>Preview: while this site is a preview, submissions go to Ben Young Web Design for testing, not to Sonny’s.</span></p>
      </form>
      <div class="done-card card" data-done tabindex="-1" role="status">
        <div class="ok">${I.check}</div>
        <h2>Got It. Thank You.</h2>
        <p class="lead" data-done-count>George has your details.</p>
        <p>He’ll go through the plans and get back to you. Need to add something? Call <a href="${TEL}">${PHONE}</a>, 6 am to 6 pm.</p>
      </div>
    </div>
    <aside class="form-aside card rv" style="--d:120ms" aria-label="Contact and next steps">
      <ul class="aside-list">
        <li><b>Rather talk first?</b><a class="big" href="${TEL}">${PHONE}</a></li>
        <li><b>Email</b><a href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li><b>Hours</b><span>6 am to 6 pm</span></li>
        <li><b>What happens next</b><span>George goes through the plans and calls you with next steps.</span></li>
        <li><b>Where we work</b><span>Merced to Tulare, and out toward the coast. Based in Clovis.</span></li>
        <li>${LICENSE}</li>
      </ul>
    </aside>
  </div>
</section>
`,
});
