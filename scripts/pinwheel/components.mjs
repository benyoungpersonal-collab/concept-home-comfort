/* components.mjs: the building blocks every Pinwheel inner page is made of (scripts/build-pinwheel.mjs).
   Output is plain HTML with sync markers (<!-- partial:NAME -->) and data-photo images; `node scripts/sync.mjs`
   fills the shared header, footer, and bar, and builds every photo's srcset from scripts/photos.json. */
import { SITE, NAME, PHONE, TEL, SMS, CITIES, REVIEWS, STATS } from './site-data.mjs';

export const ic = (id, cls = 'icon') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const attr = (s) => String(s).replace(/&(?![a-z]+;|#\d+;)/g, '&amp;').replace(/"/g, '&quot;');
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

export const bookHref = (R, service) => `${R}book.html${service ? `?service=${encodeURIComponent(service).replace(/%20/g, '+')}` : ''}`;
export const callBtn = (cls = 'btn btn-primary btn-lg') => `<a class="${cls}" href="${TEL}">${ic('i-phone')}Call ${PHONE}</a>`;
export const bookBtn = (R, service, cls = 'btn btn-glass btn-lg', label = 'Book online') => `<a class="${cls}" href="${bookHref(R, service)}">${ic('i-calendar')}${label}</a>`;
export const tag = (t = 'Illustrative') => `<span class="tag">${t}</span>`;

/* The full page: head (title, description, share tags), shared partials, main, scripts */
/* Keep the phone number on one line wherever it appears in running text (never inside a tag or attribute). */
const keepPhone = (html) => html.replace(/>([^<]*)/g, (m, t) => '>' + t.replace(/\(209\) 555-0142/g, '<span class="nowrap">(209) 555-0142</span>'));

/* Title case for H3 card and step headings (FAQ questions in the dropdowns stay as plain questions). */
const SMALL = new Set('a an and as at but by for in nor of on or the to via vs with from into'.split(' '));
const cap = (w) => w.replace(/^([("'“‘]*)([a-z])/, (m, a, b) => a + b.toUpperCase());
export const titleCase = (t) => t.split(/(\s+)/).map((w, i, all) => {
  if (/^\s+$/.test(w)) return w;
  const first = i === 0, last = i === all.length - 1;
  return w.split('-').map((part, j) => (!first || j) && !last && SMALL.has(part.toLowerCase()) && j !== 0 ? part : ((!first && !last && SMALL.has(part.toLowerCase()) && j === 0) ? part : cap(part))).join('-');
}).join('');
const titleH3 = (html) => html.replace(/<h3(?![^>]*acc-heading)([^>]*)>([^<]+)<\/h3>/g, (m, a, t) => `<h3${a}>${titleCase(t)}</h3>`);

export function shell(p) {
  const depth = p.file.split('/').length - 1;
  const R = p.file === '404.html' ? '/' : '../'.repeat(depth);
  const url = SITE + (p.file === 'index.html' ? '' : p.file);
  const og = 'https://byw-home-comfort.netlify.app/images/og-share-2026-11-18-v2.jpg';
  const ogAlt = 'Pinwheel Heating, Air &amp; Plumbing homepage on a laptop and a phone.';
  const ld = p.jsonld ? `<script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': p.jsonld }, null, 2)}\n</script>\n` : '';
  const pre = (p.preload || []).join('\n');
  return `<!doctype html>
<html lang="en" class="no-js fs-bold site-pw pw-ov${p.htmlClass ? ' ' + p.htmlClass : ''}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.title}</title>
<meta name="description" content="${attr(p.desc)}">
<!-- partial:head -->
<!-- /partial:head -->
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${ogAlt}">
<meta name="twitter:image" content="${og}">
<meta name="twitter:image:alt" content="${ogAlt}">
${pre}
<meta property="og:title" content="${attr(p.ogTitle || p.title)}">
<meta property="og:description" content="${attr(p.desc)}">
<meta property="og:url" content="${url}">
<link rel="canonical" href="${url}">
${ld}</head>
<body class="has-sticky-bar${p.bodyClass ? ' ' + p.bodyClass : ''}">
<!-- partial:sprite -->
<!-- /partial:sprite -->
<!-- partial:header -->
<!-- /partial:header -->
<main id="main">
${keepPhone(titleH3(p.body(R)))}
</main>
<!-- partial:footer -->
<!-- /partial:footer -->
<!-- partial:stickybar -->
<!-- /partial:stickybar -->
<!-- partial:chat -->
<!-- /partial:chat -->
<script src="${R}js/site.js?v=20261111" defer></script>
<script src="${R}js/reveal.js?v=20261111" defer></script>
</body>
</html>
`;
}

/* Hero preload tags (one per crop), so the hero photo starts loading right away */
export const heroPreload = (key, fpPhone) => [
  `<link rel="preload" as="image" data-photo="${key}" data-crop="4:5" data-widths="480,720,960"${fpPhone ? ` data-fp="${fpPhone}"` : ''} imagesizes="100vw" media="(max-width: 599px)" fetchpriority="high">`,
  `<link rel="preload" as="image" data-photo="${key}" data-crop="orig" data-widths="1024,1600,2400" imagesizes="100vw" media="(min-width: 600px)" fetchpriority="high">`,
];

/* Inner-page hero: the homepage's overlay style, shorter. Photo, light black layer, soft fade behind the words,
   frosted pill with the orange pin, the H1, one paragraph, and Call plus Book. */
export function hero(R, h) {
  const crumbs = h.crumbs ? `<nav class="pw-crumbs" aria-label="Breadcrumb"><ol>${h.crumbs.map(([t, href], i) =>
    href ? `<li><a href="${R}${href}">${t}</a></li>` : `<li aria-current="page">${t}</li>`).join('')}</ol></nav>` : '';
  const ctas = h.ctas === false ? '' : `<div class="btn-row" data-hide-bar>${h.ctas || callBtn() + bookBtn(R, h.service)}</div>`;
  return `  <section class="hero pw-phero${h.cls ? ' ' + h.cls : ''}" aria-labelledby="page-title">
    <picture class="pw-phero-photo">
      <source data-photo="${h.photo}" data-crop="4:5" data-widths="480,720,960"${h.fpPhone ? ` data-fp="${h.fpPhone}"` : ''} media="(max-width: 599px)" sizes="100vw">
      <img data-photo="${h.photo}" data-crop="orig" data-widths="1024,1600,2400" data-eager sizes="100vw" alt="">
    </picture>
    <div class="container pw-phero-wrap">
      <div class="pw-phero-copy">
        ${crumbs}
        <p class="hero-pill pw-pill">${ic('i-map-pin')}${h.pill}</p>
        <h1 class="pw-phero-h" id="page-title">${h.title}</h1>
        <p class="lead">${h.lead}</p>
        ${ctas}${h.after || ''}
      </div>
    </div>
  </section>`;
}

/* A plain section with a heading block */
let secN = 0;
export function sec(o) {
  const id = o.id || `s${++secN}`;
  const head = o.h2 ? `<div class="section-head${o.center ? ' center' : ''}">
        ${o.eyebrow ? `<p class="eyebrow">${o.eyebrow}</p>` : ''}
        <h2 id="${id}-title">${o.h2}</h2>
        ${o.lead ? `<p class="lead">${o.lead}</p>` : ''}
      </div>` : '';
  return `  <section class="section${o.cls ? ' ' + o.cls : ''}" id="${id}"${o.h2 ? ` aria-labelledby="${id}-title"` : ''}>
    <div class="container${o.wrap ? ' ' + o.wrap : ''}">
      ${head}
      ${o.inner || ''}
    </div>
  </section>`;
}

export const checklist = (items) => `<ul class="pw-check">${items.map((t) => `<li data-reveal>${ic('i-check-circle')}<span>${t}</span></li>`).join('')}</ul>`;

export const steps = (items) => `<ol class="pw-steps">${items.map(([t, d], i) =>
  `<li data-reveal><span class="pw-step-n" aria-hidden="true">${i + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>`;

/* Upfront pricing: "starting at" sample prices */
export const prices = (items, foot) => `<ul class="pw-prices">${items.map(([name, amt, note]) =>
  `<li data-reveal><p class="pw-price-name">${name}</p><p class="pw-price-amt"><small>Starting at</small>${amt}</p>${note ? `<p class="pw-price-note">${note}</p>` : ''}</li>`).join('')}</ul>
      <p class="fine pw-prices-foot">${tag()} ${foot || 'Sample prices for a concept site. Your tech confirms the exact price in writing before any work starts.'}</p>`;

export function reviewCard(r) {
  return `<li class="review-card" data-group="${r.group}">
          <div class="review-top"><span class="avatar" style="--h:${r.h}" aria-hidden="true">${r.n[0]}</span><div><p class="review-name">${r.n}</p><p class="review-meta">${r.city} · ${r.when}</p></div><svg class="g-mark" role="img" aria-label="Google review"><use href="#g-logo"/></svg></div>
          <span class="stars5" role="img" aria-label="5 out of 5 stars"></span>
          <p class="review-text">${r.text}</p>
        </li>`;
}
export const reviewsFor = (tagName) => REVIEWS.filter((r) => r.tag === tagName).slice(0, 3);
export function reviewsSection(R, list, o = {}) {
  return sec({ id: o.id || 'reviews', cls: o.cls || 'tpl-bg-tint', eyebrow: 'Reviews', h2: o.h2 || 'What Neighbors <span class="accent">Tell Us.</span>',
    lead: `${STATS.rating} stars from ${STATS.count} Google reviews. ${tag('Illustrative reviews')}`,
    inner: `<ul class="pw-reviews">${list.map(reviewCard).join('\n        ')}</ul>
      <p class="pw-more"><a class="btn btn-secondary" href="${R}reviews.html">Read all reviews${ic('i-arrow-right')}</a></p>` });
}

/* FAQ dropdowns (the site's accordion) plus the matching FAQPage data */
let faqN = 0;
export function faqList(items, prefix) {
  const p = prefix || `fq${++faqN}`;
  return `<div class="accordion" data-accordion>
${items.map(([q, a], i) => `        <div class="acc-item">
          <h3 class="acc-heading"><button class="acc-trigger" type="button" id="${p}-${i + 1}-btn" aria-expanded="true" aria-controls="${p}-${i + 1}">${q}<span class="acc-icon" aria-hidden="true"></span></button></h3>
          <div class="acc-panel" id="${p}-${i + 1}" role="region" aria-labelledby="${p}-${i + 1}-btn"><div class="acc-inner"><div><p>${a}</p></div></div></div>
        </div>`).join('\n')}
      </div>`;
}
export const faqLd = (items) => ({ '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } })) });
export function faqSection(R, items, o = {}) {
  return `  <section class="section${o.cls ? ' ' + o.cls : ''}" id="${o.id || 'faq'}" aria-labelledby="${o.id || 'faq'}-title">
    <div class="container faq-grid">
      <div class="faq-head">
        <p class="eyebrow">FAQ</p>
        <h2 id="${o.id || 'faq'}-title">${o.h2 || 'Common <span class="accent">Questions.</span>'}</h2>
        <p>Still wondering about something? <a href="${R}faq.html">See every question</a> or call ${PHONE}.</p>
      </div>
      ${faqList(items, o.prefix)}
    </div>
  </section>`;
}

/* Comfort Club callout */
export const club = (R) => `  <section class="section pw-club-wrap" aria-label="Comfort Club">
    <div class="container">
      <aside class="pw-club" data-reveal>
        <span class="pw-club-icon" aria-hidden="true">${ic('i-shield-check')}</span>
        <div class="pw-club-copy">
          <p class="eyebrow">Comfort Club</p>
          <h2>Two Tune-Ups a Year and <span class="accent">15% Off Repairs.</span></h2>
          <p>Members get an AC tune-up every spring, a heating tune-up every fall, priority scheduling, and no overtime fees, for $15 a month. ${tag()}</p>
        </div>
        <a class="btn btn-primary btn-lg" href="${R}comfort-club.html">See the Comfort Club${ic('i-arrow-right')}</a>
      </aside>
    </div>
  </section>`;

/* Book Online plus Call */
export const bookCall = (R, service, h2) => `  <section class="section pw-bookcall on-dark" aria-labelledby="bookcall-title">
    <div class="container pw-bookcall-grid">
      <div>
        <p class="eyebrow">Get on the schedule</p>
        <h2 id="bookcall-title">${h2 || 'Book Online or <span class="accent">Give Us a Call.</span>'}</h2>
        <p class="lead">A real person answers from 7am to 7pm, Monday to Saturday, and the emergency line is open 24/7. We text you a 3-hour arrival window and the tech's name before we head over.</p>
      </div>
      <div class="pw-bookcall-cards">
        <a class="pw-bc-card" href="${bookHref(R, service)}" data-reveal><span class="pw-bc-icon">${ic('i-calendar')}</span><span><strong>Book online</strong><span>Pick a day and a 3-hour window in about a minute.</span></span>${ic('i-arrow-right')}</a>
        <a class="pw-bc-card" href="${TEL}" data-reveal><span class="pw-bc-icon">${ic('i-phone')}</span><span><strong>Call ${PHONE}</strong><span>Talk to a real person right now.</span></span>${ic('i-arrow-right')}</a>
        <a class="pw-bc-card" href="${SMS}" data-reveal><span class="pw-bc-icon">${ic('i-message')}</span><span><strong>Text the same number</strong><span>Send a photo of the problem and we text back.</span></span>${ic('i-arrow-right')}</a>
      </div>
    </div>
  </section>`;

/* Service areas strip: every city, with links where a city has its own page */
export const areasStrip = (R, current) => `  <section class="section pw-areas-strip" aria-labelledby="strip-title">
    <div class="container">
      <div class="pw-strip-head">
        <h2 id="strip-title">We Serve 12 Cities Around <span class="accent">Tracy.</span></h2>
        <a class="pw-text-link" href="${R}service-areas.html">See every service area${ic('i-arrow-right')}</a>
      </div>
      <ul class="area-chips">${CITIES.map((c) => {
        const href = c.file ? `${R}${c.file}` : `${R}service-areas.html#${c.slug}`;
        return `<li><a${c.slug === 'tracy' ? ' class="is-hq"' : ''} href="${href}"${current && c.file === current ? ' aria-current="page"' : ''}>${ic('i-map-pin')}${c.name}</a></li>`;
      }).join('')}</ul>
    </div>
  </section>`;

/* Photo next to words */
export function split(o) {
  if (!o.photo) return `<div class="pw-split-text">
          ${o.eyebrow ? `<p class="eyebrow">${o.eyebrow}</p>` : ''}
          <h2 id="${o.id}">${o.h2}</h2>
          ${o.lead ? `<p class="lead">${o.lead}</p>` : ''}
          ${(o.paras || []).map((t) => `<p>${t}</p>`).join('\n          ')}
          ${o.after || ''}
      </div>`;
  return `<div class="split${o.reverse ? ' reverse' : ''} pw-split">
        <div class="photo"><img data-photo="${o.photo}" data-crop="${o.crop || '4:3'}" data-widths="480,720,960,1200" sizes="(min-width: 900px) 560px, 92vw" alt=""></div>
        <div>
          ${o.eyebrow ? `<p class="eyebrow">${o.eyebrow}</p>` : ''}
          <h2 id="${o.id}">${o.h2}</h2>
          ${o.lead ? `<p class="lead">${o.lead}</p>` : ''}
          ${(o.paras || []).map((t) => `<p>${t}</p>`).join('\n          ')}
          ${o.after || ''}
        </div>
      </div>`;
}

/* Cards that link to other pages (no photos) */
export const linkCards = (R, items) => `<ul class="pw-links">${items.map((c) =>
  `<li data-reveal><a class="pw-link-card" href="${R}${c.href}"><span class="icon-bubble${c.bubble ? ' ' + c.bubble : ''}">${ic(c.icon)}</span><span><strong>${c.title}</strong><span>${c.text}</span></span>${ic('i-arrow-right')}</a></li>`).join('')}</ul>`;

export const serviceLd = (o) => ({
  '@type': 'Service', name: o.name, serviceType: o.type || o.name, description: o.desc,
  provider: { '@type': 'HVACBusiness', '@id': SITE + '#business', name: NAME, telephone: '+1-209-555-0142',
    address: { '@type': 'PostalAddress', streetAddress: 'Street address placeholder', addressLocality: 'Tracy', addressRegion: 'CA', postalCode: '95376', addressCountry: 'US' } },
  areaServed: CITIES.map((c) => `${c.name}, CA`), url: SITE + o.file,
});
export const crumbLd = (file, trail) => ({ '@type': 'BreadcrumbList', itemListElement: trail.map(([t, href], i) => ({ '@type': 'ListItem', position: i + 1, name: plain(t), item: SITE + (href || file) })) });
