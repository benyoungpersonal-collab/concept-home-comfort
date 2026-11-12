#!/usr/bin/env node
/*
  Finishing pass for the Sonny's Mechanical homepage preview. Run after the main build:

      python3 samples/sonnys-mechanical/photos.py                        (only when photos.json changes)
      node scripts/build-preview.mjs samples/sonnys-mechanical/site.json
      node samples/sonnys-mechanical/finish.mjs

  The main build makes the page from site.json with the current template (Pinwheel's layout: photo-first hero with a
  slim card on desktop, trust tiles, photo service cards, picture-book motion, quick quote, FAQ, map). This pass turns
  it into the preview Netlify serves at https://byw-home-comfort.netlify.app/sonnys-mechanical/ :
  - Copies previews/sonnys-mechanical/ to sonnys-mechanical/ (the folder Netlify serves)
  - Hero: three deliberate headline lines, a slimmer desktop card so the tech's face stays in view (sonny.css)
  - How a visit works: a real HVAC photo instead of the template's plumbing video, and steps in his own terms
    (nothing he hasn't said: no arrival-window texts, no photo reports)
  - Reviews: his one real review (BBB, word for word, trimmed with "...") plus 2 cards tagged "Illustrative"
  - Proof: bonded and workers' comp instead of "insured" (CSLB shows a bond and workers' comp, not liability cover)
  - Meet George (the owner) instead of Meet the family; copy that only his records support
  - Canonical, schema, the link preview picture, the footer preview line, PHOTO-LIST.md
  Every replacement must match the expected number of times, or the script stops.
*/
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const BUILT = join(ROOT, 'previews', 'sonnys-mechanical');
const OUT = join(ROOT, 'sonnys-mechanical');
const URL = 'https://byw-home-comfort.netlify.app/sonnys-mechanical/';
const SITE = JSON.parse(readFileSync(join(HERE, 'site.json'), 'utf8'));
const PHOTOS = JSON.parse(readFileSync(join(HERE, 'photos.json'), 'utf8'));
if (!existsSync(join(BUILT, 'index.html'))) { console.error('finish: run node scripts/build-preview.mjs samples/sonnys-mechanical/site.json first'); process.exit(1); }

let html = readFileSync(join(BUILT, 'index.html'), 'utf8');
const fail = (m) => { console.error(`finish: ${m}`); process.exit(1); };
const rep = (a, b, n = 1) => {
  const count = html.split(a).length - 1;
  if (count !== n) fail(`expected ${n} match(es), found ${count}: ${a.slice(0, 100)}`);
  html = html.split(a).join(b);
};
const repRe = (re, b) => { if (!re.test(html)) fail(`no match: ${re}`); html = html.replace(re, b); };

/* ---------- Files ---------- */
rmSync(OUT, { recursive: true, force: true });
cpSync(BUILT, OUT, { recursive: true });
for (const f of ['_headers', 'robots.txt', 'styles.html']) rmSync(join(OUT, f), { force: true }); // netlify.toml sends noindex for the whole site; the page keeps its own noindex meta
rmSync(join(OUT, 'video'), { recursive: true, force: true });
for (const f of readdirSync(join(OUT, 'images'))) if (f.startsWith('visit-poster')) rmSync(join(OUT, 'images', f));
mkdirSync(join(OUT, 'images', 'sm'), { recursive: true });
for (const k of ['visit', 'request']) for (const [name] of PHOTOS[k].out) copyFileSync(join(HERE, 'photos', name), join(OUT, 'images', 'sm', name));
copyFileSync(join(HERE, 'sonny.css'), join(OUT, 'css', 'sonny.css'));

/* ---------- Head: canonical, schema, this preview's CSS ---------- */
rep(`<meta property="og:url" content="${URL}">`, `<link rel="canonical" href="${URL}">\n<meta property="og:url" content="${URL}">`);
rep('<link rel="stylesheet" href="css/alive.css">', '<link rel="stylesheet" href="css/alive.css">\n<link rel="stylesheet" href="css/sonny.css">');
const schema = [{
  '@context': 'https://schema.org', '@type': 'HVACBusiness', '@id': `${URL}#business`,
  name: SITE.name, url: URL, image: `${URL}images/og.jpg`, telephone: '+1-559-392-0743', email: SITE.email,
  description: 'Heating and air conditioning repair, replacement, and new construction HVAC from Auberry, CA. CSLB #1162052 (C-20).',
  address: { '@type': 'PostalAddress', addressLocality: 'Auberry', addressRegion: 'CA', postalCode: '93602', addressCountry: 'US' },
  areaServed: SITE.serviceAreas.map((c) => ({ '@type': 'City', name: `${c}, CA` })),
  founder: { '@type': 'Person', name: 'George Wayne' },
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Heating and air conditioning', itemListElement: SITE.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name } })) },
}, {
  '@context': 'https://schema.org', '@type': 'FAQPage', '@id': `${URL}#faq`, url: URL,
  mainEntity: SITE.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
}];
rep('</head>', `${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n')}\n</head>`);

/* ---------- Hero: three deliberate lines on every screen ---------- */
rep('<p class="h1 hero-h" id="hero-title">Furnace Out? AC Down?<br> <span class="accent">Get an Honest Fix.</span></p>',
  '<p class="h1 hero-h" id="hero-title">Furnace Out?<br> AC Down?<br> <span class="accent">Get an Honest Fix.</span></p>');

/* ---------- How a visit works: a real HVAC photo, steps in his terms ---------- */
repRe(/<div class="visit-media" data-video="video\/visit">\s*<picture>[\s\S]*?<\/picture>\s*<\/div>/,
  `<div class="visit-media">
        <img src="images/sm/visit-960x540.webp" srcset="images/sm/visit-640x360.webp 640w, images/sm/visit-960x540.webp 960w, images/sm/visit-1280x720.webp 1280w" sizes="(min-width: 900px) 600px, 92vw" width="1280" height="720" alt="${PHOTOS.visit.alt}" loading="lazy" decoding="async" style="background-color:#6b6f72">
      </div>`);
rep('<li><strong>Book in a minute</strong><span>Call, text, or send the form below. We text you an arrival window.</span></li>',
  '<li><strong>Call or text George</strong><span>Tell him what the system is doing at <a class="nowrap" href="tel:+15593920743">(559) 392-0743</a>, or send the form below.</span></li>');
rep('<li><strong>See the price first</strong><span>Your tech finds the problem and shows you the price. You decide.</span></li>',
  '<li><strong>Get a straight answer</strong><span>What\'s wrong, what it takes to fix, and what it costs, before the work starts. You decide.</span></li>');
rep('<li><strong>Fixed and cleaned up</strong><span>When we\'re done, photos of the finished work go straight to your phone.</span></li>',
  '<li><strong>Fixed the right way</strong><span>"Specializing in doing the right thing, ALWAYS." That\'s George\'s promise, straight off his card.</span></li>');

/* ---------- Request a visit: a foothill home at dusk instead of the template's family photo ---------- */
repRe(/<img sizes="\(min-width: 900px\) 480px, 92vw" src="images\/photos\/family-baby-720x960\.webp"[^>]*>/,
  `<img sizes="(min-width: 900px) 480px, 92vw" src="images/sm/request-720x960.webp" srcset="images/sm/request-480x640.webp 480w, images/sm/request-720x960.webp 720w, images/sm/request-960x1280.webp 960w" width="960" height="1280" alt="${PHOTOS.request.alt}" loading="lazy" decoding="async" style="object-position:50% 55%;background-color:#1d2a3a">`);
for (const f of readdirSync(join(OUT, 'images', 'photos'))) if (f.startsWith('family-baby')) rmSync(join(OUT, 'images', 'photos', f));

/* ---------- Reviews: one real review (BBB) plus 2 illustrative cards ---------- */
const card = (initial, hue, name, meta, tag, quote) => `<li class="review-card">
          <div class="review-top"><span class="avatar" style="--h:${hue}" aria-hidden="true">${initial}</span><div><p class="review-name">${name}</p><p class="review-meta">${meta}</p></div><span class="tag${tag === 'Illustrative' ? '' : ' tag-real'}">${tag}</span></div>
          <span class="stars5" role="img" aria-label="5 out of 5 stars"></span>
          <p class="review-text">${quote}</p>
        </li>`;
repRe(/<section class="section reviews tpl-sample-reviews tpl-bg-tint" id="reviews" aria-labelledby="reviews-title">[\s\S]*?<\/section>/,
  `<section class="section reviews tpl-sample-reviews tpl-bg-tint" id="reviews" aria-labelledby="reviews-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Reviews</p>
        <h2 id="reviews-title">Neighbors Say It Better <span class="accent">Than We Can.</span></h2>
        <p class="lead">His first review is real, word for word. The two marked Illustrative show how more will look as his Google reviews come in.</p>
      </div>
      <ul class="tpl-sample-list">
        ${card('D', 192, 'Delores R.', 'BBB review, January 2026', 'Real review', 'My experience with Sonny\'s Air Conditioning has been nothing short of ideal. ... I feel incredibly lucky to have randomly chosen this company ... you truly saved my life!')}
        ${card('M', 214, 'Mark T.', 'Auberry', 'Illustrative', 'Our furnace quit on a cold night. George told us what failed and what it would cost before he touched anything.')}
        ${card('R', 236, 'Rachel P.', 'Clovis', 'Illustrative', 'AC ran all afternoon and blew warm. He found the problem, fixed it, and explained it in plain English.')}
      </ul>
      <p class="tpl-sample-note">Sonny's Mechanical is a new name, so the reviews start here. Your site will make it easy for customers to leave one on Google.</p>
    </div>
  </section>`);

/* ---------- Proof: what CSLB shows ---------- */
rep('<h2 id="proof-title">Licensed, Insured, and <span class="accent">Close By.</span></h2>', '<h2 id="proof-title">Licensed, Bonded, and <span class="accent">Close By.</span></h2>');
rep('<p class="lead">Sonny\'s Mechanical is local, licensed, and easy to reach. Here is what you can count on before you call.</p>',
  '<p class="lead">All of this is on public record. Look up license #1162052 at cslb.ca.gov and you\'ll see the same thing.</p>');
rep('<span><strong>Licensed</strong><p>CSLB #1162052</p></span></li>',
  `<span><strong>Licensed</strong><p>CSLB #1162052, C-20 heating, ventilating, and air conditioning. Active.</p></span></li>
        <li class="feature"><span class="icon-bubble"><svg class="icon" aria-hidden="true"><use href="#i-shield"/></svg></span><span><strong>Bonded</strong><p>A $25,000 contractor's bond with American Contractors Indemnity Company.</p></span></li>
        <li class="feature"><span class="icon-bubble"><svg class="icon" aria-hidden="true"><use href="#i-users"/></svg></span><span><strong>Workers' comp</strong><p>Coverage on file with CSLB, so an injury on your property isn't your problem.</p></span></li>`);
rep('<li class="feature"><span class="icon-bubble"><svg class="icon" aria-hidden="true"><use href="#i-home-heart"/>', `<li class="feature"><span class="icon-bubble"><svg class="icon" aria-hidden="true"><use href="#i-check-circle"/></svg></span><span><strong>BBB Accredited</strong><p>An A rating with the Better Business Bureau and no complaints on file.</p></span></li>
        <li class="feature"><span class="icon-bubble"><svg class="icon" aria-hidden="true"><use href="#i-home-heart"/>`);
rep('<span><strong>Owner run</strong><p>Owned and run by George Wayne, right here in Auberry.', '<span><strong>Owner run</strong><p>George Wayne is the license qualifier and runs the company from Auberry.');
rep('Based in Auberry, serving 3 cities across Fresno County. <a href="#areas">See the map</a>', 'Based in Auberry, working from the foothills down to Clovis and Fresno. <a href="#areas">See the map</a>');

/* ---------- Meet George ---------- */
rep('Meet the family', 'Meet George', 3);
rep('<h2 id="team-title">The People Behind <span class="accent">Sonny\'s Mechanical.</span></h2>', '<h2 id="team-title">The Name on <span class="accent">the License.</span></h2>');

/* ---------- Quick quote, FAQ, service areas: only what he has said ---------- */
rep('<p class="lead">Pick the service, tell us what\'s going on, and we\'ll text you back. No email, no sales call.</p>', '<p class="lead">Pick the service, tell us what\'s going on, and get a text back from Sonny\'s Mechanical.</p>');
rep('Straight Answers to <span class="accent">Common Questions.</span>', 'Questions Foothill <span class="accent">Homeowners Ask.</span>');
rep('<h2 id="request-title">Tell Us What\'s Going On. <span class="accent">', '<h2 id="request-title">Tell Us What\'s Going On.<br> <span class="accent">');
rep('<p><strong>Still wondering about something?</strong> A real person can answer it in a minute.</p>', '<p><strong>Still wondering about something?</strong> Call or text and ask George.</p>');
rep('<h2 id="areas-title">Close By, So We <span class="accent">Get There Fast.</span></h2>', '<h2 id="areas-title">From Auberry <span class="accent">Down to Fresno.</span></h2>');
rep('<p class="lead">Based in Auberry and serving 3 cities across Fresno County, so a tech is never far away.</p>', '<p class="lead">Based in Auberry, up in the Sierra foothills, and working in homes and buildings from there down to Clovis and Fresno.</p>');

/* ---------- Footer: the preview line ---------- */
rep('<p class="concept-pill on-dark"><b aria-hidden="true">BY</b>Ben Young Web Design</p>\n    <p>Homepage preview by Ben Young Web Design. Some photos are placeholders until we add yours.</p>',
  '<p class="concept-pill on-dark"><b aria-hidden="true">BY</b>Homepage preview for Sonny\'s Mechanical by Ben Young Web Design.</p>\n    <p>Sample photos stand in until we add photos of George\'s own work.</p>');

/* ---------- Link preview picture (newest share/og-share-*.jpg) ---------- */
const shares = existsSync(join(HERE, 'share')) ? readdirSync(join(HERE, 'share')).filter((f) => /^og-share-.*\.jpg$/.test(f)).sort() : [];
if (!shares.length) console.warn('finish: no link preview picture in samples/sonnys-mechanical/share/ yet, so og:image stays og.jpg');
else {
  const pic = shares[shares.length - 1], imgUrl = `${URL}images/${pic}`, alt = "Sonny's Mechanical homepage on a laptop and a phone.";
  copyFileSync(join(HERE, 'share', pic), join(OUT, 'images', pic));
  rep(`<meta property="og:image" content="${URL}images/og.jpg">`, `<meta property="og:image" content="${imgUrl}">`);
  repRe(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${alt}">`);
  rep('<meta name="twitter:card" content="summary_large_image">', `<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="${imgUrl}">\n<meta name="twitter:image:alt" content="${alt}">`);
}

/* ---------- Phones: the Call, Request, Text bar stays out of the way wherever a section has its own call to action ---------- */
rep('<div class="pcards">', '<div class="pcards" data-hide-bar>');
rep('<a class="btn btn-primary" href="#request"><svg class="icon" aria-hidden="true"><use href="#i-calendar"/></svg>Book a visit</a>', '<a class="btn btn-primary" href="#request" data-hide-bar><svg class="icon" aria-hidden="true"><use href="#i-calendar"/></svg>Book a visit</a>');
rep('<div class="card call-card">', '<div class="card call-card" data-hide-bar>');
rep('<section class="section estimator on-dark edge-top edge-bottom" id="estimate"', '<section class="section estimator on-dark edge-top edge-bottom" id="estimate" data-hide-bar');
rep('<div class="request-card">', '<div class="request-card" data-hide-bar>');
rep('<div class="footer-contact">', '<div class="footer-contact" data-hide-bar>');
/* Favicon letter in navy, like the header square */
rep('fill%3D%22%23fff%22%3ES%3C', 'fill%3D%22%230D1B22%22%3ES%3C');

/* ---------- Leftover check ---------- */
for (const bad of [/Pinwheel/i, /Bright Bolt/i, /Ridgeline/i, /Oak &amp; Tule|Oak & Tule/i, /\bTracy\b/, /Concept site/i, /555-/, /placeholder/i, /lorem/i, /\{\{/, /—/, /Sample<\/span>/, /Meet the family/, /[Ii]nsured/, /Sonny Wayne/, /Call Sonny/, /\bSonny (told|is|runs|answers)\b/, /ask Sonny/, /Sonny\'s promise/, /Meet Sonny/]) {
  const m = html.match(bad); if (m) fail(`leftover on the page: ${bad} near "${html.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\s+/g, ' ')}"`);
}
writeFileSync(join(OUT, 'index.html'), html);

/* ---------- Shared CSS and JS: no other site's name in the code ----------
   The template shares css/ and js/ with Pinwheel, so their comments and Pinwheel's scripted chat helper (not on this
   page) mention it. This copy drops every comment and swaps the chat helper for an empty function. */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n{3,}/g, '\n\n');
for (const f of readdirSync(join(OUT, 'css'))) if (f.endsWith('.css')) writeFileSync(join(OUT, 'css', f), stripComments(readFileSync(join(OUT, 'css', f), 'utf8')).replace(/^\.pcard-photo\.is-placeholder \{[^}]*\}\n/m, '')); // that card style is unused here
for (const f of readdirSync(join(OUT, 'js'))) {
  if (!f.endsWith('.js')) continue;
  let js = readFileSync(join(OUT, 'js', f), 'utf8');
  if (f === 'site.js') {
    const a = js.indexOf('  function initChat() {'), b = js.indexOf('  function initNextOpening() {');
    if (a < 0 || b < a) fail('site.js: could not find the chat helper');
    js = js.slice(0, a) + '  function initChat() {}\n\n' + js.slice(b);
  }
  writeFileSync(join(OUT, 'js', f), stripComments(js).replace(/^\s*\/\/ .*$/gm, ''));
}
const CODE_BAD = /pinwheel|bright bolt|ridgeline|oak (&|&amp;) tule|tracy|concept site|555-|lorem|placeholder/i;
for (const dir of ['css', 'js']) for (const f of readdirSync(join(OUT, dir))) {
  const s = readFileSync(join(OUT, dir, f), 'utf8'); const m = s.match(CODE_BAD);
  if (m) fail(`leftover in ${dir}/${f}: "${s.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\s+/g, ' ')}"`);
}

/* ---------- PHOTO-LIST.md ---------- */
const rows = [
  ['Hero (images/hero/*, og.jpg)', 'hero'], ['Service card: Heating repair', 'heating'], ['Service card: AC repair', 'acrepair'],
  ['Service card: New systems', 'newsystem'], ['Service card: New builds and commercial', 'newbuild'], ['How a visit works (images/sm/visit-*)', 'visit'],
  ['Request a visit (images/sm/request-*)', 'request'],
].map(([spot, k]) => { const p = PHOTOS[k]; return [spot, p.alt, p.site === 'AI (Canva)' ? `AI-made in Canva, no people (${p.page})` : `${p.site}, photo by ${p.by}: ${p.page}`, p.site === 'AI (Canva)' ? 'Owned' : `${p.site} License (free for commercial use)`, p.edit]; });
rows.push(['Link preview picture (images/og-share-DATE.jpg)', 'The homepage on a laptop and a phone', 'Screenshots of this page (scripts/share-image.cjs)', 'Owned', 'None']);
const md = `# Sonny's Mechanical: photo list\n\nEvery photo on https://byw-home-comfort.netlify.app/sonnys-mechanical/ . The one photo with a person (How a visit works) is real stock, unedited. The others have no people and are AI-made in Canva. Swap in George's own job photos as soon as he sends them.\n\n| Spot | What is there | Source | License | Edits |\n|---|---|---|---|---|\n${rows.map((r) => `| ${r.join(' | ')} |`).join('\n')}\n`;
writeFileSync(join(OUT, 'PHOTO-LIST.md'), md);
/* The template build also writes prospects/photo-lists/sonnys-mechanical.md; this preview keeps its own list above */
rmSync(join(ROOT, 'prospects', 'photo-lists', 'sonnys-mechanical.md'), { force: true });
try { if (!readdirSync(join(ROOT, 'prospects', 'photo-lists')).length) rmSync(join(ROOT, 'prospects', 'photo-lists'), { recursive: true }); } catch {}
console.log(`finish: wrote sonnys-mechanical/ (${URL})`);
