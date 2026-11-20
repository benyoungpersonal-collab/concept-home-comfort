#!/usr/bin/env node
/*
  build-pinwheel.mjs: writes every Pinwheel inner page, the shared header and footer partials, and sitemap.xml from
  the data in scripts/pinwheel/. The homepage (index.html), review.html, and sample-report.html are not written here.

      node scripts/build-pinwheel.mjs && node scripts/sync.mjs && python3 scripts/build-images.py

  Photos are named by slot (see SITE-PLAN.md). PHOTO maps each slot to a key in scripts/photos.json.
*/
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shell, ic } from './pinwheel/components.mjs';
import { SERVICE_PAGES, servicePage } from './pinwheel/pages-services.mjs';
import * as O from './pinwheel/pages-other.mjs';
import { cityPages, areasHub } from './pinwheel/pages-areas.mjs';
import { home, projectsPage } from './pinwheel/pages-home.mjs';
import { GROUPS, CITIES, ABOUT_MENU, PHONE, TEL, SMS, SITE } from './pinwheel/site-data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const photos = JSON.parse(readFileSync(join(ROOT, 'scripts/photos.json'), 'utf8'));

/* Photo slot -> photos.json key. Slots without a registered photo yet fall back to a stand-in photo (and are listed). */
const PHOTO = {
  'services-hero': 'pw-services', 'svc-cooling': 'pw-svc-cooling', 'svc-heating': 'pw-svc-heating', 'svc-plumbing': 'pw-svc-plumbing', 'svc-air': 'pw-svc-air',
  'cooling-hero': 'pw-pj-ac-side-yard', 'ac-repair-hero': 'pw-ac-repair', 'ac-install-hero': 'pw-ac-install',
  'heating-hero': 'pw-heating', 'heating-2': 'pw-heating-2', 'heat-pumps-hero': 'pw-heat-pumps', 'plumbing-hero': 'pinwheel-water-heater',
  'water-heaters-hero': 'pw-water-heaters', 'drains-hero': 'pw-drains', 'leak-hero': 'pw-leak', 'repipe-2': 'pw-repipe',
  'air-quality-hero': 'pw-air-quality', 'emergency-hero': 'pw-emergency', 'emergency-2': 'pw-emergency-2', 'comfort-club-hero': 'pw-comfort-club',
  'specials-hero': 'pw-specials', 'estimate-hero': 'pw-estimate', 'book-hero': 'pw-book', 'reviews-hero': 'pw-reviews', 'about-van': 'pw-about-van', 'about-team': 'suburb',
  'areas-hero': 'pw-areas', 'manteca-hero': 'pw-manteca', 'lathrop-hero': 'pw-lathrop', 'stockton-hero': 'pw-stockton', 'livermore-hero': 'pw-livermore',
  'faq-hero': 'pw-faq', 'resources-hero': 'pw-resources', 'article-ac-hero': 'pw-article-ac', 'article-wh-hero': 'pw-article-wh',
  'privacy-hero': 'pw-privacy', 'notfound-hero': 'pw-notfound', 'credits-hero': 'pw-credits', 'contact-2': 'pw-contact-2',
  // existing photos that move to (or stay on) one inner page
  thermostat: 'thermostat', couple: 'couple', turbines: 'turbines', 'tech-door': 'tech-door', 'stucco-home': 'stucco-home', suburb: 'suburb', 'about-street': 'pw-about-street',
};
const missing = new Set();
const ph = (slot) => { const k = PHOTO[slot] || slot; if (photos[k]) return k; missing.add(slot); return 'stucco-home'; };

const pages = [
  home(ph), projectsPage(ph),
  ...SERVICE_PAGES.map((o) => servicePage(o, ph)),
  O.services(ph), O.cooling(ph), O.plumbing(ph), O.emergency(ph), O.comfortClub(ph), O.financing(ph), O.specials(ph), O.estimate(ph), O.book(ph),
  O.reviews(ph), O.about(ph), O.faq(ph), O.resources(ph), ...O.articles(ph), O.contact(ph), O.credits(ph), O.privacy(ph), O.notFound(ph),
  areasHub(ph), ...cityPages(ph),
];
for (const p of pages) {
  const out = join(ROOT, p.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, shell(p));
}

/* ---------- Header partial: desktop mega menu and dropdowns, phone menu with collapsible groups ---------- */
const chev = ic('i-chevron-down');
const nl = (file, label, cls = '') => `<a class="${cls}" href="{{root}}${file}" data-nav="${file}">${label}</a>`;
const mega = GROUPS.map((g) => `            <div class="pw-mega-col">
              <p class="pw-mega-title"><span class="icon-bubble${g.bubble ? ' ' + g.bubble : ''}">${ic(g.icon)}</span>${g.name}</p>
              <ul>${g.pages.map((s) => `<li>${nl(s.file, `<strong>${s.name}</strong><span>${s.blurb}</span>`, 'pw-mega-link')}</li>`).join('')}</ul>
            </div>`).join('\n');
const cityLinks = (cls) => CITIES.map((c) => c.file
  ? `<li>${nl(c.file, c.name, cls)}</li>`
  : `<li><a class="${cls}" href="{{root}}service-areas.html#${c.slug}">${c.name}</a></li>`).join('');
const mmLink = (file, label) => `<li><a href="{{root}}${file}" data-nav="${file}">${label} ${ic('i-chevron-right')}</a></li>`;
const header = `<a class="skip-link" href="#main">Skip to content</a>
<div class="header-sentinel" data-header-sentinel aria-hidden="true"></div>
<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="logo" href="{{root}}index.html">
      <svg class="logo-mark" aria-hidden="true"><use href="#logo-mark"/></svg>
      <span class="logo-text"><span class="logo-name">Pinwheel</span> <span class="logo-tag">Heating <span aria-hidden="true">·</span> Air <span aria-hidden="true">·</span> Plumbing</span></span>
    </a>
    <nav class="nav" aria-label="Main">
      <ul class="nav-list">
        <li>
          <button class="nav-link" type="button" aria-expanded="false" aria-controls="panel-services" data-panel-toggle>Services ${chev}</button>
          <div class="nav-panel pw-mega" id="panel-services" hidden>
            <div class="pw-mega-grid">
${mega}
            </div>
            <div class="pw-mega-foot">
              ${nl('emergency.html', `<span class="pw-mega-em-icon">${ic('i-zap')}</span><span><strong>24/7 Emergency Service</strong><span>A real person answers day and night.</span></span>`, 'pw-mega-emergency')}
              ${nl('services.html', `See all services ${ic('i-arrow-right')}`, 'pw-mega-all')}
            </div>
          </div>
        </li>
        <li>${nl('comfort-club.html', 'Comfort Club', 'nav-link')}</li>
        <li>${nl('specials.html', 'Specials', 'nav-link')}</li>
        <li>
          <button class="nav-link" type="button" aria-expanded="false" aria-controls="panel-areas" data-panel-toggle>Service Areas ${chev}</button>
          <div class="nav-panel pw-areas-panel" id="panel-areas" hidden>
            <ul class="pw-areas-list">${cityLinks('pw-area-link')}</ul>
            <p class="panel-foot">${nl('service-areas.html', 'See the map and every service area')}</p>
          </div>
        </li>
        <li>
          <button class="nav-link" type="button" aria-expanded="false" aria-controls="panel-about" data-panel-toggle>About ${chev}</button>
          <div class="nav-panel narrow" id="panel-about" hidden>
            <div class="panel-grid">
${ABOUT_MENU.map((m) => `              <a class="panel-link" href="{{root}}${m.file}" data-nav="${m.file}">
                <span class="icon-bubble">${ic(m.icon)}</span>
                <span><strong>${m.name}</strong><span>${m.blurb}</span></span>
              </a>`).join('\n')}
            </div>
          </div>
        </li>
        <li>${nl('contact.html', 'Contact', 'nav-link')}</li>
      </ul>
    </nav>
    <div class="header-actions">
      <div class="pw-lang" role="group" aria-label="Language / Idioma" translate="no">
        <button type="button" data-lang="en" aria-pressed="true" lang="en">EN</button><span class="pw-lang-sep" aria-hidden="true">/</span><button type="button" data-lang="es" aria-pressed="false" lang="es">ES</button>
      </div>
      <a class="header-phone" href="${TEL}" aria-label="Call or text us ${PHONE}">
        <span class="icon-wrap">${ic('i-phone')}</span>
        <span class="header-phone-text" aria-hidden="true"><small>Call or text us</small><span>${PHONE}</span></span>
      </a>
      <a class="btn btn-primary btn-sm header-book" href="#quote" data-quote-link data-home="{{root}}index.html#quote">Free Quote</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu" data-menu-open>${ic('i-menu')}</button>
    </div>
  </div>
</header>
<dialog class="mobile-menu" id="mobile-menu" aria-label="Menu">
  <div class="mm-head">
    <a class="logo" href="{{root}}index.html">
      <svg class="logo-mark" aria-hidden="true"><use href="#logo-mark"/></svg>
      <span class="logo-text"><span class="logo-name">Pinwheel</span> <span class="logo-tag">Heating <span aria-hidden="true">·</span> Air <span aria-hidden="true">·</span> Plumbing</span></span>
    </a>
    <button class="mm-close" type="button" aria-label="Close menu" data-menu-close>${ic('i-close')}</button>
  </div>
  <nav class="mm-body" aria-label="Mobile">
    <div class="mm-group">
      <p class="mm-group-title">Services</p>
${GROUPS.map((g) => `      <details class="mm-acc">
        <summary><span class="icon-bubble${g.bubble ? ' ' + g.bubble : ''}">${ic(g.icon)}</span>${g.name}${chev}</summary>
        <ul class="mm-links">${g.pages.map((s) => mmLink(s.file, s.name)).join('')}</ul>
      </details>`).join('\n')}
      <ul class="mm-links">${mmLink('emergency.html', '24/7 Emergency Service')}${mmLink('services.html', 'All services')}</ul>
    </div>
    <div class="mm-group">
      <ul class="mm-links mm-top">${mmLink('instant-estimate.html', 'Instant Estimate')}${mmLink('comfort-club.html', 'Comfort Club')}${mmLink('specials.html', 'Specials')}</ul>
      <details class="mm-acc">
        <summary><span class="icon-bubble cool">${ic('i-map-pin')}</span>Service Areas${chev}</summary>
        <ul class="mm-links">${mmLink('service-areas.html', 'All service areas')}${CITIES.map((c) => c.file ? mmLink(c.file, c.name) : `<li><a href="{{root}}service-areas.html#${c.slug}">${c.name} ${ic('i-chevron-right')}</a></li>`).join('')}</ul>
      </details>
      <details class="mm-acc">
        <summary><span class="icon-bubble navy">${ic('i-home-heart')}</span>About${chev}</summary>
        <ul class="mm-links">${ABOUT_MENU.map((m) => mmLink(m.file, m.name)).join('')}</ul>
      </details>
      <ul class="mm-links mm-top">${mmLink('contact.html', 'Contact')}</ul>
    </div>
    <div class="mm-cta">
      <a class="btn btn-primary btn-lg" href="${TEL}">${ic('i-phone')}Call ${PHONE}</a>
      <a class="btn btn-navy btn-lg" href="#quote" data-quote-link data-home="{{root}}index.html#quote" data-menu-close>${ic('i-send')}Get My Free Quote</a>
    </div>
    <p class="mm-hours">We answer Monday to Saturday, 7am to 7pm, and the emergency line is open 24/7.</p>
  </nav>
</dialog>
`;
writeFileSync(join(ROOT, 'partials/header.html'), header);

/* ---------- Footer partial: every page, grouped; link groups two across on phones ---------- */
const fl = (file, label) => `<li><a href="{{root}}${file}">${label}</a></li>`;
const footCols = [
  ['Cooling &amp; Heating', [['ac-repair.html', 'AC Repair'], ['ac-installation.html', 'AC Installation'], ['cooling.html', 'Cooling Overview'], ['heating.html', 'Furnace Repair'], ['heat-pumps.html', 'Heat Pumps'], ['air-quality.html', 'Indoor Air Quality']]],
  ['Plumbing', [['plumbing.html', 'Plumbing Overview'], ['water-heaters.html', 'Water Heaters'], ['drains.html', 'Drains &amp; Sewer'], ['leak-repair.html', 'Leak Repair &amp; Repiping'], ['emergency.html', '24/7 Emergency'], ['services.html', 'All Services']]],
  ['Plans &amp; Tools', [['instant-estimate.html', 'Instant Estimate'], ['comfort-club.html', 'Comfort Club'], ['specials.html', 'Specials'], ['financing.html', 'Financing'], ['book.html', 'Book Online']]],
  ['Company', [['about.html', 'About Us'], ['projects.html', 'Projects'], ['reviews.html', 'Reviews'], ['review.html', 'Write a Review'], ['faq.html', 'FAQ'], ['contact.html', 'Contact']]],
  ['Service Areas', [['service-areas.html', 'All Service Areas'], ...CITIES.filter((c) => c.file).map((c) => [c.file, c.name])]],
  ['Guides &amp; Info', [['resources.html', 'Resources'], ['resources/ac-repair-or-replace.html', 'Repair or Replace Your AC?'], ['resources/water-heater-noise.html', 'Water Heater Noises'], ['privacy.html', 'Privacy'], ['credits.html', 'Photo Credits'], ['sample-report.html', 'Sample Monthly Report']]],
];
const footer = `<footer class="site-footer on-dark pw-footer">
  <div class="container pw-foot-grid">
    <div class="footer-brand">
      <a class="logo light" href="{{root}}index.html">
        <svg class="logo-mark" aria-hidden="true"><use href="#logo-mark-light"/></svg>
        <span class="logo-text"><span class="logo-name">Pinwheel</span> <span class="logo-tag">Heating <span aria-hidden="true">·</span> Air <span aria-hidden="true">·</span> Plumbing</span></span>
      </a>
      <p>We're a family-owned heating, air, and plumbing company serving San Joaquin and Alameda counties since 2010.</p>
      <p class="pw-foot-license">${ic('i-shield-check')}<span>We're a licensed California contractor, bonded and insured.</span></p>
      <a class="big" href="${TEL}">${ic('i-phone')}${PHONE}</a>
      <p><a class="footer-text-link" href="${SMS}">You can text us at the same number</a></p>
      <dl class="hours">
        <dt>Mon to Sat</dt><dd>7am to 7pm</dd>
        <dt>Sunday</dt><dd>Emergency calls</dd>
        <dt>24/7</dt><dd>Emergency line</dd>
      </dl>
      <p class="pw-foot-addr"><strong>Tracy shop</strong> Tracy, CA 95376<br><strong>Manteca yard</strong> Manteca, CA 95336</p>
    </div>
    <div class="pw-foot-links">
${footCols.map(([t, links]) => `      <nav aria-label="${t.replace('&amp;', 'and')}">
        <details class="pw-foot-col" data-foot-col>
          <summary class="footer-title">${t}<svg class="icon" aria-hidden="true"><use href="#i-chevron-down"/></svg></summary>
          <ul class="footer-links">${links.map(([f, l]) => fl(f, l)).join('')}</ul>
        </details>
      </nav>`).join('\n')}
    </div>
  </div>
  <div class="container footer-bottom">
    <p class="concept-pill on-dark"><b aria-hidden="true">BY</b>Concept site by Ben Young Web Design. Sample data.</p>
    <p>Pinwheel Heating, Air &amp; Plumbing is a fictional business. Reviews, names, numbers, and prices on this site are illustrative. © 2026</p>
  </div>
</footer>
`;
writeFileSync(join(ROOT, 'partials/footer.html'), footer);

/* ---------- sitemap.xml ---------- */
const today = new Date().toISOString().slice(0, 10);
const files = [...pages.map((p) => p.file).filter((f) => f !== '404.html'), 'review.html', 'sample-report.html'];
const pri = (f) => f === 'index.html' ? '1.0' : /^(services|ac-|heating|heat-pumps|plumbing|water-heaters|drains|leak-repair|air-quality|cooling|emergency)/.test(f) ? '0.9' : f.startsWith('service-areas') ? '0.8' : '0.6';
writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files.map((f) => `  <url><loc>${SITE}${f === 'index.html' ? '' : f}</loc><lastmod>${today}</lastmod><priority>${pri(f)}</priority></url>`).join('\n')}
</urlset>
`);

console.log(`Wrote ${pages.length} pages, the header and footer partials, and sitemap.xml (${files.length} URLs).`);
if (missing.size) console.log(`Photo slots still on a stand-in photo: ${[...missing].join(', ')}`);
export { PHOTO };
