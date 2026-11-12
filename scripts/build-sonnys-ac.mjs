#!/usr/bin/env node
/* Builds the Sonny's Air Conditioning preview (contractor site) into sonnys-air-conditioning/.
   Six pages share one header, footer, and inline logo. Headlines go through title-case.mjs.
   Run from the repo root: node scripts/build-sonnys-ac.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { titleCaseHtml } from './title-case.mjs';

const DIR = 'sonnys-air-conditioning';
const BASE = 'https://byw-home-comfort.netlify.app/sonnys-air-conditioning/';
const API = 'https://sonnys-plans.byw-video.workers.dev';
const OG = readOg();
const PHONE = '(559) 392-0743';
const TEL = 'tel:+15593920743';
const NAME = "Sonny's Air Conditioning";
const LICENSE = `<p class="license-line"><span>CSLB #1129931</span><span>C-20 HVAC</span><i class="lb" aria-hidden="true"></i><span>Bonded</span><span>Workers' comp</span></p>`;

function readOg() {
  try { const m = readFileSync(`${DIR}/index.html`, 'utf8').match(/property="og:image" content="([^"]+)"/); return m ? m[1] : ''; } catch { return ''; }
}

// ---------- logo (George's design.com logo, outline removed for the dark background) ----------
const logoSvg = readFileSync(`${DIR}/images/logo-on-dark.svg`, 'utf8');
const logoBody = logoSvg.slice(logoSvg.indexOf('>') + 1, logoSvg.lastIndexOf('</svg>'));
const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><g id="sac-logo">${logoBody}</g></defs></svg>`;
const MARK = (cls = 'brand-mark') => `<svg class="${cls}" viewBox="400 -4 506 341" aria-hidden="true"><use href="#sac-logo"/></svg>`;
const WORD = `<svg class="brand-word" viewBox="48 422 1184 74" aria-hidden="true"><use href="#sac-logo"/></svg>`;
const FULL = `<svg class="footer-logo" viewBox="0 0 1280 580.8" role="img" aria-label="${NAME}: Transparent, Honest, Predictable"><use href="#sac-logo"/></svg>`;

// ---------- icons ----------
const I = {
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h3.3l1.9 4.7-2.4 1.5a11.5 11.5 0 0 0 6.5 6.5l1.5-2.4 4.7 1.9v3.3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2Z"/></svg>',
  upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  plans: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 6h20l8 8v28H10z"/><path d="M30 6v8h8M16 22h16M16 28h16M16 34h10"/></svg>',
};

const btnPlans = (cls = '') => `<a class="btn btn-primary ${cls}" href="send-your-plans.html">${I.upload}Send Your Plans</a>`;
const btnCall = (cls = 'btn-ghost') => `<a class="btn ${cls}" href="${TEL}">${I.phone}Call ${PHONE}</a>`;

const NAV = [
  ['index.html', 'Home'], ['services.html', 'Services'], ['projects.html', 'Projects'],
  ['about.html', 'About'], ['education.html', 'Education'], ['send-your-plans.html', 'Send Your Plans'],
];

function header(page) {
  const links = NAV.filter(([h]) => h !== 'send-your-plans.html').map(([h, t]) => `<a href="${h}"${h === page ? ' aria-current="page"' : ''}>${t}</a>`).join('');
  const mlinks = NAV.map(([h, t]) => `<li><a href="${h}"${h === page ? ' aria-current="page"' : ''}>${t}</a></li>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="index.html" aria-label="${NAME}, home">${MARK()}${WORD}</a>
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
    <p class="fine menu-fine">Hours: 6 am to 6 pm. Based in Clovis, CA.</p>
  </div>
</dialog>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        ${FULL}
        <p>HVAC for general contractors, builders, and developers. New construction, housing tracts, and installs. Based in Clovis, CA.</p>
        ${LICENSE}
      </div>
      <div>
        <p class="footer-title">Pages</p>
        <ul class="footer-links">${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul>
      </div>
      <div>
        <p class="footer-title">Contact</p>
        <a class="footer-phone" href="${TEL}">${PHONE}</a>
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
  telephone: '+1-559-392-0743', slogan: 'Transparent. Honest. Predictable.',
  address: { '@type': 'PostalAddress', addressLocality: 'Clovis', addressRegion: 'CA', addressCountry: 'US' },
  areaServed: ['Merced', 'Madera', 'Fresno', 'Clovis', 'Visalia', 'Hanford', 'Tulare'].map((c) => ({ '@type': 'City', name: c + ', CA' })),
  description: 'HVAC contractor for general contractors, builders, and developers: residential new construction, housing tracts, and installs and changeouts. CSLB #1129931 (C-20).',
});

function page({ file, title, desc, body, scripts = '' }) {
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
<script>document.documentElement.classList.add('js')</script>
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
  if (!OG) html = html.replace(/<meta (property|name)="(og|twitter):image(:alt|:width|:height)?" content="[^"]*">\n/g, '');
  writeFileSync(`${DIR}/${file}`, html);
  console.log('built', file, (html.length / 1024).toFixed(1) + ' KB');
}

const srcset = (n, ws = [640, 1024, 1600]) => ws.map((w) => `images/photos/${n}-${w}.webp ${w}w`).join(', ');
const img = (n, alt, { ws, sizes = '100vw', pos = '', eager = false, w = 1600, h = 1067 } = {}) =>
  `<img src="images/photos/${n}-${(ws || [640, 1024, 1600]).slice(-1)[0]}.webp" srcset="${srcset(n, ws)}" sizes="${sizes}" width="${w}" height="${h}" alt="${alt}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}${pos ? ` style="${pos}"` : ''}>`;

function hero({ photo, alt, pos, eyebrow, h1, lead, ctas = true, cls = '', ws }) {
  return `<section class="hero ${cls}" aria-labelledby="hero-title">
  <div class="hero-photo">${img(photo, alt, { ws, eager: true, pos, w: 2400, h: 1600 })}</div>
  <div class="wrap hero-wrap">
    <div class="hero-card">
      <p class="eyebrow">${eyebrow}</p>
      <h1 id="hero-title">${h1}</h1>
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

const cta = (h = 'Got a Project Coming Up?', lead = 'Send the plans or give George a call. Hours are 6 am to 6 pm.') => `<section class="section cta" aria-labelledby="cta-title">
  <div class="wrap cta-inner">
    <div class="rv"><p class="eyebrow">Get Going</p><h2 id="cta-title">${h}</h2><p class="lead">${lead}</p></div>
    <div class="cta-side rv" style="--d:120ms" data-hide-bar>${btnPlans()}${btnCall()}<p class="fine">Based in Clovis, CA. Working from Merced to Tulare, and out toward the coast.</p></div>
  </div>
</section>`;

const CITIES = ['Merced', 'Chowchilla', 'Madera', 'Fresno', 'Clovis', 'Sanger', 'Kerman', 'Selma', 'Reedley', 'Kingsburg', 'Dinuba', 'Hanford', 'Lemoore', 'Visalia', 'Tulare'];
const COAST = ['Los Banos', 'Firebaugh', 'Coalinga', 'Paso Robles'];

// ================= HOME =================
page({
  file: 'index.html',
  title: `${NAME} | HVAC for New Construction and Housing Tracts`,
  desc: `${NAME}: HVAC for general contractors, builders, and developers. New construction, housing tracts, and installs from Merced to Tulare. Based in Clovis. CSLB #1129931. Call ${PHONE}.`,
  body: `
${hero({
    photo: 'tract-aerial', ws: [640, 1024, 1600, 2400], alt: 'Aerial view of a new housing tract under construction, with framed homes and fresh roof sheathing along a curving street',
    pos: '--pos:38% 50%;--pos-d:50% 50%', eyebrow: 'C-20 HVAC Contractor · Clovis, CA',
    h1: 'Send Us the Plans.<br> We’ll Handle<br> the HVAC.',
    lead: 'The HVAC sub for general contractors, builders, and developers. New homes, housing tracts, and installs from Merced to Tulare. 20+ years in air conditioning. A crew of 12.',
  })}

<section class="section tight" aria-label="At a glance">
  <div class="wrap">
    <ul class="facts facts-wrap">
      <li class="rv"><b>20+</b><span>Years in air conditioning</span></li>
      <li class="rv" style="--d:100ms"><b>12</b><span>On the crew</span></li>
      <li class="rv" style="--d:200ms"><b>2 hrs</b><span>Service radius from Clovis: Merced to Tulare, and out toward the coast</span></li>
    </ul>
  </div>
</section>

<section class="section" id="services" aria-labelledby="svc-title">
  <div class="wrap">
    <div class="split-head">
      <div class="rv"><p class="eyebrow">What We Do</p><h2 id="svc-title">Built for Builders.</h2></div>
      <p class="lead rv" style="--d:100ms">Residential new construction, housing tracts, and installs. Send the plan set and we take it from there.</p>
    </div>
    <div class="svc-grid">
      <a class="svc rv" href="services.html#new-construction">${img('framing-two-story', 'Two-story home in wood framing with scaffolding on a new construction site', { sizes: '(min-width: 760px) 33vw, 100vw', pos: '--pos:40% 50%' })}
        <div class="svc-body"><span class="svc-num">01</span><h3>Residential New Construction</h3><p>Full HVAC for new homes, working from your plan set.</p><span class="more">Learn more ${I.arrow}</span></div></a>
      <a class="svc rv" style="--d:100ms" href="services.html#housing-tracts">${img('tract-site', 'New tract homes going up beyond a graded dirt lot with a dump truck', { sizes: '(min-width: 760px) 33vw, 100vw', pos: '--pos:62% 50%' })}
        <div class="svc-body"><span class="svc-num">02</span><h3>Housing Tracts</h3><p>The same plans, lot after lot. A crew of 12.</p><span class="more">Learn more ${I.arrow}</span></div></a>
      <a class="svc rv" style="--d:200ms" href="services.html#installs">${img('condenser-lineset', 'Technician connecting a refrigerant hose to the service valve on an outdoor AC condenser', { sizes: '(min-width: 760px) 33vw, 100vw', pos: '--pos:55% 50%' })}
        <div class="svc-body"><span class="svc-num">03</span><h3>Installs and Changeouts</h3><p>New equipment in, old equipment out, for builders and contractors.</p><span class="more">Learn more ${I.arrow}</span></div></a>
    </div>
  </div>
</section>

<section class="section section-alt" id="how-it-works" aria-labelledby="steps-title">
  <div class="wrap">
    <div class="section-head rv"><p class="eyebrow">How It Works</p><h2 id="steps-title">Three Steps to Get Going.</h2></div>
    <ol class="steps">
      <li class="rv"><h3>Give Us a Call.</h3><p>Tell George about the job: where it is, how many homes, and when you need us. <a href="${TEL}" class="nowrap">${PHONE}</a>, 6 am to 6 pm.</p></li>
      <li class="rv" style="--d:100ms"><h3>Send Us Your Plans.</h3><p>Upload the PDF plan set, even if it runs hundreds of megabytes. <a href="send-your-plans.html">It comes straight to us.</a></p></li>
      <li class="rv" style="--d:200ms"><h3>We’ll Get You Going.</h3><p>We go through the plans and get back to you with next steps.</p></li>
    </ol>
  </div>
</section>

<section class="band" aria-labelledby="band-title">
  ${img('crew-framing', 'Construction worker in a hard hat walking the top plate of a framed wall against a blue sky', { pos: '--pos:62% 40%' })}
  <div class="wrap">
    <div class="band-copy rv">
      <p class="eyebrow">Who We Are</p>
      <h2 id="band-title">20+ Years in Air Conditioning.</h2>
      <p class="lead">George has spent more than 20 years in the trade and has run his own company for about two years. Today a crew of 12 works out of Clovis.</p>
      <a class="btn btn-ghost" href="about.html">About Sonny’s ${I.arrow}</a>
    </div>
  </div>
</section>

<section class="section" id="area" aria-labelledby="area-title">
  <div class="wrap area-grid">
    <div class="rv">
      <p class="eyebrow">Service Area</p>
      <h2 id="area-title">Merced to Tulare,<br class="br-desk"> and Out Toward the Coast.</h2>
      <p class="lead" style="margin-top:22px">Based in Clovis. We take work within about two hours. Not sure if your site is in range? Call and ask.</p>
    </div>
    <div class="rv" style="--d:120ms">
      <ul class="cities">${CITIES.map((c) => `<li${c === 'Clovis' ? ' class="hq"' : ''}>${c}</li>`).join('')}</ul>
      <p class="cities-sub">Toward the coast</p>
      <ul class="cities">${COAST.map((c) => `<li>${c}</li>`).join('')}</ul>
    </div>
  </div>
</section>

${cta()}
`,
});

// ================= SERVICES =================
const detail = (id, photo, alt, pos, eyebrow, h2, p, items) => `<article class="svc-detail" id="${id}">
  <figure class="rv">${img(photo, alt, { sizes: '(min-width: 900px) 50vw, 100vw', pos })}</figure>
  <div class="rv" style="--d:100ms">
    <p class="eyebrow">${eyebrow}</p>
    <h2>${h2}</h2>
    <p class="lead">${p}</p>
    <ul>${items.map((x) => `<li>${x}</li>`).join('')}</ul>
  </div>
</article>`;

page({
  file: 'services.html',
  title: `Services | ${NAME}`,
  desc: `Residential new construction HVAC, housing tracts, and installs and changeouts for builders and general contractors. ${NAME}, Clovis, CA. ${PHONE}.`,
  body: `
${hero({
    cls: 'page-hero', photo: 'framing-sky', alt: 'Wood framing of a new building against a clear blue sky, with scaffolding along the top floor',
    pos: '--pos:30% 50%;--pos-d:50% 45%', eyebrow: 'Services', h1: 'New Construction,<br> Tracts, and Changeouts.',
    lead: 'Three kinds of work, all for builders, general contractors, and developers. One call and one plan set gets it started.',
  })}
<section class="section" aria-label="Services">
  <div class="wrap">
    ${detail('new-construction', 'framing-two-story', 'Two-story home in wood framing with scaffolding on a new construction site', '--pos:40% 50%', '01 · New Construction', 'Residential New Construction.',
    'Heating and air for new homes, from rough-in to startup. Send the plan set and we’ll talk scope and timing.',
    ['Single-family homes and custom builds', 'Rough-in, equipment set, and startup', 'Working from your PDF plan set'])}
    ${detail('housing-tracts', 'tract-site', 'New tract homes going up beyond a graded dirt lot with a dump truck', '--pos:62% 50%', '02 · Housing Tracts', 'Housing Tracts.',
    'Tract work means the same plans, lot after lot. Send the plan sets and the lot count, and we’ll talk timing.',
    ['Multiple lots on the same plan sets', 'Phased work as lots are ready', 'A crew of 12'])}
    ${detail('installs', 'condenser-lineset', 'Technician connecting a refrigerant hose to the service valve on an outdoor AC condenser', '--pos:55% 50%', '03 · Installs and Changeouts', 'Installs and Changeouts.',
    'New systems and equipment swaps for builders and contractors, from single homes to whole phases.',
    ['New system installs', 'Equipment changeouts', 'Licensed C-20, bonded, with workers’ comp'])}
  </div>
</section>
${cta('Have Plans Ready?', 'Upload the plan set and George will take a look. Prefer to talk first? Call 6 am to 6 pm.')}
`,
});

// ================= PROJECTS =================
const blueprint = `<svg viewBox="0 0 240 150" aria-hidden="true"><path d="M20 140h200M40 140V70l80-48 80 48v70M40 70h160"/><path d="M60 140V96h36v44M140 92h36v28h-36z"/><path d="M70 60h100M70 60v-8h100v8M92 52V36M150 52V40" stroke-dasharray="4 4"/><path d="M200 120h20v20h-20zM204 124h12v12h-12z"/></svg>`;
const proj = (tag, h3, p, d) => `<article class="proj rv" style="--d:${d}ms">
  <div class="proj-ph"><span class="proj-tag">Placeholder</span>${blueprint}</div>
  <div class="proj-body"><h3>${h3}</h3><p>${p}</p></div>
</article>`;

page({
  file: 'projects.html',
  title: `Projects | ${NAME}`,
  desc: `Project photos from ${NAME} are on the way. New construction, housing tracts, and installs from Merced to Tulare.`,
  body: `
${plainHero({ eyebrow: 'Projects', h1: 'Projects.', lead: 'New construction, housing tracts, and installs from Merced to Tulare. George’s own project photos are on the way.' })}
<section class="section tight" aria-label="Project placeholders">
  <div class="wrap">
    <p class="notice">${I.info}<span><b>These are placeholders.</b> Each card will show one of George’s real jobs: photos, the city, and the scope of work. Nothing here is a real project yet.</span></p>
    <div class="proj-grid">
      ${proj('', 'New Construction Project', 'Photo, city, and scope go here.', 0)}
      ${proj('', 'Housing Tract Project', 'Photo, city, and number of lots go here.', 80)}
      ${proj('', 'Changeout Project', 'Photo, city, and equipment go here.', 160)}
      ${proj('', 'New Construction Project', 'Photo, city, and scope go here.', 0)}
      ${proj('', 'Housing Tract Project', 'Photo, city, and number of lots go here.', 80)}
      ${proj('', 'Install Project', 'Photo, city, and equipment go here.', 160)}
    </div>
  </div>
</section>
${cta('Your Project Could Be Next.', 'Send the plans or call George, 6 am to 6 pm.')}
`,
});

// ================= ABOUT =================
const OWNER_ART = `<svg viewBox="0 0 240 300" role="img" aria-label="Illustration standing in for a photo of George"><path class="op-d" d="M26 300c2-58 40-90 94-90s92 32 94 90z"/><path class="op-l" d="M104 196h32v26l-16 14-16-14z"/><circle class="op-l" cx="120" cy="146" r="42"/><path class="op-d" d="M78 136c-2-30 18-48 44-48 26 0 44 16 42 46-6-14-22-22-42-22-20 0-36 8-44 24z"/><g class="op-eyes"><ellipse class="op-d" cx="105" cy="148" rx="4.5" ry="5.5"/><ellipse class="op-d" cx="135" cy="148" rx="4.5" ry="5.5"/></g><path class="op-ds" d="M107 166q13 11 26 0"/><g class="op-arm"><path class="op-ds op-sleeve" d="M184 236c10-20 18-38 22-62"/><circle class="op-l" cx="208" cy="160" r="15"/></g></svg>`;

page({
  file: 'about.html',
  title: `About | ${NAME}`,
  desc: `${NAME} is a Clovis HVAC contractor with 20+ years in air conditioning and a crew of 12. CSLB #1129931, C-20, bonded, workers' comp.`,
  body: `
${hero({
    cls: 'page-hero', photo: 'framing-dusk', alt: 'A house frame under construction in silhouette against an orange sky at dusk',
    pos: '--pos:50% 50%;--pos-d:50% 60%', eyebrow: 'About', h1: 'A Clovis HVAC Contractor<br> for Builders.',
    lead: 'Sonny’s Air Conditioning does HVAC for general contractors, builders, and developers across the Central Valley.', ctas: false,
  })}
<section class="section" aria-labelledby="owner-title">
  <div class="wrap about-grid">
    <figure class="owner-ph rv" style="margin:0"><span class="owner-tag">Your photo here</span>${OWNER_ART}</figure>
    <div class="rv" style="--d:120ms">
      <p class="eyebrow">Meet the owner</p>
      <h2 id="owner-title">George, Owner.</h2>
      <p class="lead" style="margin-top:22px">George has worked in air conditioning for more than 20 years. About two years ago he started his own company, Sonny’s Air Conditioning. Today he runs a crew of 12 out of Clovis.</p>
      <ul class="timeline">
        <li><b>20+ years</b><span>In air conditioning</span></li>
        <li><b>About 2</b><span>Years running his own company</span></li>
        <li><b>12</b><span>On the crew</span></li>
        <li><b>C-20</b><span>HVAC license, CSLB #1129931. Bonded, with workers’ comp.</span></li>
      </ul>
    </div>
  </div>
</section>
<section class="section section-alt" aria-labelledby="values-title">
  <div class="wrap">
    <div class="section-head rv" style="max-width:56rem">
      <p class="eyebrow">On the Logo</p>
      <h2 id="values-title">Transparent. Honest. Predictable.</h2>
      <p class="lead">Three words George put right on his logo.</p>
    </div>
  </div>
</section>
${cta()}
`,
});

// ================= EDUCATION =================
page({
  file: 'education.html',
  title: `HVAC Tips for Homeowners | ${NAME}`,
  desc: 'Plain answers for homeowners: the thermostat-at-65 myth, how AC removes heat, why your AC is not blowing cold, and why a heater smells when it first turns on.',
  body: `
${plainHero({ eyebrow: 'Education', h1: 'Small Fixes You Can<br> Do Yourself.', lead: 'Short, plain answers to the questions homeowners ask most. Try these first. Most take five minutes and no tools.' })}
<section class="section tight" aria-label="Articles">
  <div class="wrap edu-layout">
    <nav class="toc" aria-label="On this page">
      <p>On this page</p>
      <ol>
        <li><a href="#thermostat">The 65 degree myth</a></li>
        <li><a href="#removes-heat">AC removes heat</a></li>
        <li><a href="#not-cold">AC not blowing cold</a></li>
        <li><a href="#heater-smell">Heater smell</a></li>
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
        <p class="kicker">Check airflow before charge. Most “it needs more refrigerant&rdquo; calls turn out to be an airflow problem.</p>
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

      <div class="edu-end rv">
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
  desc: `Upload your plan set to ${NAME}. Large PDF plan sets welcome, up to 2 GB per file. New construction, housing tracts, installs and changeouts.`,
  scripts: '<script src="js/plans.js" defer></script>',
  body: `
${plainHero({ eyebrow: 'Send Your Plans', h1: 'Send Us Your Plans.', lead: 'Tell us about the job and upload the PDF plan set. Big files are fine: up to 2 GB each, 20 files at a time.' })}
<section class="section tight" aria-label="Plan upload form">
  <div class="wrap form-layout">
    <div>
      <form class="plans-form" data-hide-bar data-plans-form data-api="${API}" novalidate>
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
      <div class="done-card" data-done tabindex="-1" role="status">
        <div class="ok">${I.check}</div>
        <h2>Got It. Thank You.</h2>
        <p class="lead" data-done-count>George has your details.</p>
        <p>He’ll go through the plans and get back to you. Need to add something? Call <a href="${TEL}">${PHONE}</a>, 6 am to 6 pm.</p>
      </div>
    </div>
    <aside class="form-aside" aria-label="Contact and next steps">
      <ul class="aside-list">
        <li><b>Rather talk first?</b><a class="big" href="${TEL}">${PHONE}</a></li>
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
