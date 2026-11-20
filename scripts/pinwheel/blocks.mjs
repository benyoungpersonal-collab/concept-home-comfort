/* blocks.mjs: the TEMPLATE-PLAYBOOK parts for Pinwheel (homepage sections, the quote block every page ends with,
   the repair-or-replace tap-through, projects, owner, reviews band, service area with county lists, side form).
   Words come from the playbook's HVAC wording bank. Spanish lives in js/i18n/pw-es.js (keyed by the English HTML). */
import { PHONE, TEL, SMS, CITIES, REVIEWS, STATS } from './site-data.mjs';
import { ic, tag, faqList } from './components.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/* ---------- Hero: full photo, words over it, two buttons, trust strip ---------- */
export function homeHero(R, o) {
  return `  <section class="hero pw-hhero" aria-labelledby="hero-title">
    <picture class="pw-hhero-photo">
      <source data-photo="${o.photoPhone || o.photo}" data-crop="4:5" data-widths="480,760,960,1200"${o.fpPhone ? ` data-fp="${o.fpPhone}"` : ''} media="(max-width: 599px)" sizes="100vw">
      <img data-photo="${o.photo}" data-crop="orig" data-widths="1024,1600,2400" data-eager sizes="100vw" alt="${esc(o.alt)}">
    </picture>
    <div class="container pw-hhero-wrap">
      <div class="pw-hhero-copy">
        <p class="hero-pill pw-pill">${ic('i-map-pin')}Heating, Air &amp; Plumbing in Tracy, CA</p>
        <h1 class="pw-hhero-h" id="hero-title">Fixed Right.<br> On Time.<br> Price <span class="accent">Up Front.</span></h1>
        <p class="lead">Heating, air conditioning, and plumbing repair, tune-ups, and new systems in Tracy and nearby. Licensed techs, a price before any work, and real people who answer the phone.</p>
        <div class="btn-row pw-hhero-btns" data-hide-bar>
          <a class="btn btn-primary btn-lg" href="#quote" data-quote-link>${ic('i-send')}Get My Free Quote</a>
          <a class="btn btn-glass btn-lg" href="${TEL}">${ic('i-phone')}Call ${PHONE}</a>
        </div>
      </div>
      ${trustStrip(R)}
    </div>
  </section>`;
}

export function trustStrip(R) {
  return `<ul class="pw-trust" aria-label="Why homeowners trust us">
        <li>${ic('i-clock')}<span>16+ Years in HVAC</span></li>
        <li>${ic('i-license')}<span>CSLB C-20 Licensed</span></li>
        <li><a class="pw-trust-rating" href="${R}reviews.html">${ic('i-star-fill')}<span>${STATS.rating} on Google</span><span class="tag">Illustrative</span></a></li>
        <li>${ic('i-tag')}<span>Price Before Any Work</span></li>
      </ul>`;
}

/* ---------- Services: 4 HVAC cards, 1 plumbing card, 3 add-ons ---------- */
const SVC = [
  { label: 'Fast repairs', title: 'AC Repair', href: 'ac-repair.html', photo: 'pinwheel-hero', icon: 'i-snowflake',
    text: 'Blowing warm air or won\'t turn on? We find the problem and fix it, often the same day.',
    checks: ['All makes and models', 'Price before work', 'Same-day when we can'] },
  { label: 'Stay warm', title: 'Heating and Furnace Repair', href: 'heating.html', photo: 'pinwheel-heating', icon: 'i-flame',
    text: 'Furnace won\'t light, or the house won\'t warm up? We get the heat back on safely.',
    checks: ['Gas and electric', 'Carbon monoxide check', 'Same-day when we can'] },
  { label: 'New systems', title: 'AC, Furnace, and Heat Pump Installs', href: 'ac-installation.html', photo: 'heat-pump', icon: 'i-heatpump',
    text: 'Old system on its last legs? We size it to your home and walk you through rebates and financing.',
    checks: ['Sized to your home', 'Rebate and financing help', 'Permits handled'] },
  { label: 'Fewer breakdowns', title: 'Tune-Ups and Maintenance Plans', href: 'comfort-club.html', photo: 'pinwheel-air-quality', icon: 'i-wrench',
    text: 'A yearly check catches small problems before they turn into a no-AC day in July.',
    checks: ['Filter, coils, and refrigerant', 'Priority booking', 'Lower power bills'] },
  { label: 'Plumbing too', title: 'Plumbing Repair', href: 'plumbing.html', photo: 'pinwheel-drains', icon: 'i-droplet',
    text: 'Leaks, clogs, or no hot water? The same trained techs and the same price-first visit.',
    checks: ['Water heaters', 'Drains and sewer lines', 'Leaks and repiping'] },
];
const ADDONS = [
  { title: 'Ductless Mini-Splits', text: 'Heating and cooling for one room, a garage, or an addition.', href: 'heat-pumps.html', icon: 'i-heatpump' },
  { title: 'Duct Repair and Sealing', text: 'Stop paying to cool your attic.', href: 'cooling.html', icon: 'i-wind' },
  { title: 'Thermostats and Air Quality', text: 'Smart thermostats, filters, and air purifiers.', href: 'air-quality.html', icon: 'i-thermometer' },
];
export function servicesBlock(R) {
  const card = (s) => `<li class="pw-scard">
          <div class="pw-scard-photo"><img data-photo="${s.photo}" data-crop="3:2" data-widths="360,540,720" sizes="(min-width: 1200px) 230px, (min-width: 700px) 30vw, 80vw" alt=""></div>
          <div class="pw-scard-body">
            <p class="pw-label">${ic(s.icon)}${s.label}</p>
            <h3><a href="${R}${s.href}">${s.title}</a></h3>
            <p>${s.text}</p>
            <ul class="pw-checks">${s.checks.map((c) => `<li>${ic('i-check')}${c}</li>`).join('')}</ul>
          </div>
        </li>`;
  return `  <section class="section pw-services bg-white" id="services" aria-labelledby="services-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">What we do</p>
        <h2 id="services-title">Heat or AC Out? <span class="accent">We'll Fix It.</span></h2>
        <p class="lead">Repairs, tune-ups, and new systems for every major brand. Plumbing too.</p>
      </div>
      <ul class="pw-scards pw-swipe" data-swipe aria-label="Our services">
        ${SVC.map(card).join('\n        ')}
      </ul>
      <ul class="pw-addons">
        ${ADDONS.map((a) => `<li><a href="${R}${a.href}"><span class="pw-addon-icon">${ic(a.icon)}</span><span><strong>${a.title}</strong><span>${a.text}</span></span></a></li>`).join('\n        ')}
      </ul>
      <p class="pw-center"><a class="btn btn-secondary" href="${R}services.html">See All Services${ic('i-arrow-right')}</a></p>
    </div>
  </section>`;
}

/* ---------- Signature explainer: Repair or Replace? (tap-through, two slides, SVG cutaways) ---------- */
function systemArt(after) {
  const navy = '#14213D', unit = after ? '#E9EEF3' : '#B9AFA5', rust = '#A8562C', duct = after ? '#C9D2DB' : '#B7B0A8';
  const mark = (n, x, y) => `<g class="pw-mark" transform="translate(${x} ${y})"><circle r="17"/><text y="6" text-anchor="middle">0${n}</text></g>`;
  const leak = after ? '' : `<g class="pw-leak" fill="#D9D4CE"><circle cx="300" cy="186" r="9"/><circle cx="312" cy="176" r="7"/><circle cx="292" cy="173" r="6"/><circle cx="318" cy="190" r="5"/></g>`;
  const tape = after ? `<g fill="#EE5600"><rect x="296" y="193" width="9" height="22"/><rect x="398" y="193" width="9" height="22"/><rect x="228" y="214" width="22" height="8"/><rect x="348" y="214" width="22" height="8"/></g>` : '';
  const air = after ? `<g fill="none" stroke="#3FA9E6" stroke-width="3" stroke-linecap="round"><path d="M226 262c0 10 8 14 0 24"/><path d="M240 262c0 10 8 14 0 24"/><path d="M346 262c0 10 8 14 0 24"/><path d="M360 262c0 10 8 14 0 24"/></g>`
    : `<g fill="none" stroke="#C7BFB7" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"><path d="M232 262c0 10 6 14 0 22"/><path d="M352 262c0 10 6 14 0 22"/></g>`;
  const crack = after ? '' : `<path d="M486 372l8 10-7 9 9 11-6 8" fill="none" stroke="${rust}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  const rustSpots = after ? '' : `<g fill="${rust}" opacity=".8"><circle cx="704" cy="402" r="4"/><circle cx="752" cy="440" r="5"/><circle cx="726" cy="458" r="3"/><rect x="690" y="452" width="16" height="5" rx="2"/></g>`;
  const fins = after ? '#C3CCD6' : '#9C9187';
  return `<svg class="pw-x-art" viewBox="0 0 800 520" role="img" aria-label="${after ? 'A new, clean system with sealed ducts' : 'A worn system 15 or more years old'}">
          <rect x="0" y="0" width="800" height="520" fill="${after ? '#F3F7FA' : '#F6F3EF'}"/>
          <path d="M110 252 400 92 690 252Z" fill="${navy}"/>
          <path d="M150 252 400 116 650 252Z" fill="#FFFFFF"/>
          <rect x="140" y="252" width="520" height="220" fill="#FFFFFF" stroke="${navy}" stroke-width="4"/>
          <line x1="140" y1="252" x2="660" y2="252" stroke="${navy}" stroke-width="4"/>
          <line x1="430" y1="252" x2="430" y2="472" stroke="${navy}" stroke-width="3"/>
          <rect x="0" y="472" width="800" height="48" fill="${after ? '#DCE6EE' : '#E5DED6'}"/>
          <path d="M470 252 470 206 300 206 300 214 190 214" fill="none" stroke="${duct}" stroke-width="22" stroke-linejoin="round"/>
          <path d="M470 206 420 206 420 214" fill="none" stroke="${duct}" stroke-width="22"/>
          <rect x="222" y="214" width="34" height="46" fill="${duct}"/><rect x="342" y="214" width="34" height="46" fill="${duct}"/>
          <rect x="216" y="252" width="46" height="8" fill="${navy}"/><rect x="336" y="252" width="46" height="8" fill="${navy}"/>
          ${leak}${tape}${air}
          <rect x="452" y="282" width="94" height="22" fill="${unit}" stroke="${navy}" stroke-width="3"/>
          <rect x="448" y="304" width="102" height="164" rx="4" fill="${unit}" stroke="${navy}" stroke-width="3"/>
          <rect x="464" y="322" width="70" height="34" rx="3" fill="#FFFFFF" stroke="${navy}" stroke-width="2"/>
          <text x="499" y="345" text-anchor="middle" class="pw-x-afue">${after ? 'AFUE 96%' : 'AFUE 56%'}</text>
          <rect x="468" y="366" width="62" height="56" rx="3" fill="${after ? '#FFFFFF' : '#E7DFD7'}" stroke="${navy}" stroke-width="2"/>
          <path d="M486 412c-6-10 4-14 2-22 8 6 10 12 8 22M504 412c-4-8 4-10 2-18 7 5 8 10 6 18" fill="${after ? '#3FA9E6' : '#E58A3C'}"/>
          ${crack}
          <path d="M546 300 C 600 300 600 300 640 300 L 690 300 690 400" fill="none" stroke="${after ? '#B87333' : '#8C6A4A'}" stroke-width="5"/>
          <rect x="680" y="380" width="96" height="92" rx="6" fill="${unit}" stroke="${navy}" stroke-width="3"/>
          <g stroke="${fins}" stroke-width="2">${Array.from({ length: 9 }, (_, i) => `<line x1="${690 + i * 10}" y1="392" x2="${690 + i * 10}" y2="462"/>`).join('')}</g>
          <circle cx="728" cy="426" r="24" fill="${after ? '#FFFFFF' : '#D9D1C8'}" stroke="${navy}" stroke-width="3"/>
          <path d="M728 426 714 414M728 426 742 438M728 426 742 412M728 426 714 440" stroke="${navy}" stroke-width="3" stroke-linecap="round"/>
          ${rustSpots}
          <rect x="190" y="330" width="40" height="52" rx="6" fill="#FFFFFF" stroke="${navy}" stroke-width="3"/>
          <text x="210" y="362" text-anchor="middle" class="pw-x-temp">${after ? '72°' : '81°'}</text>
          ${mark(1, 728, 362)}${mark(2, 584, 334)}${mark(3, after ? 262 : 300, 152)}${mark(4, 440, 396)}
        </svg>`;
}
export function explainer(R) {
  const before = [
    ['Worn parts', 'more breakdowns on the hottest and coldest days.'],
    ['Old efficiency', 'an older furnace can be as low as 56% efficient.'],
    ['Leaky ducts', 'up to 30% of your air never reaches your rooms.'],
    ['Heat exchanger cracks', 'a carbon monoxide risk.'],
  ];
  const after = [
    ['We test the whole system', 'outdoor unit, furnace, ducts, and safety.'],
    ['Two prices, side by side', 'you see the repair price and the replace price.'],
    ['90% efficient or better', 'new systems waste far less of what you pay for.'],
    ['You choose', 'nothing starts until you say yes.'],
  ];
  const list = (items) => `<ol class="pw-x-list">${items.map(([b, t], i) => `<li><span class="pw-x-n" aria-hidden="true">0${i + 1}</span><span><strong>${b}:</strong> ${t}</span></li>`).join('')}</ol>`;
  return `  <section class="section pw-explain" id="system-check" aria-labelledby="explain-title" data-x>
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">System check</p>
        <h2 id="explain-title">Repair or Replace? <span class="accent">Here's What We Check.</span></h2>
      </div>
      <div class="pw-x-tabs" role="tablist" aria-label="Before and after">
        <button type="button" role="tab" id="x-tab-1" aria-controls="x-slide-1" aria-selected="true">Before</button>
        <button type="button" role="tab" id="x-tab-2" aria-controls="x-slide-2" aria-selected="false" tabindex="-1">After</button>
      </div>
      <div class="pw-x-track" data-x-track>
        <div class="pw-x-slide" id="x-slide-1" role="tabpanel" aria-labelledby="x-tab-1">
          <div class="pw-x-media">${systemArt(false)}</div>
          <div class="pw-x-copy">
            <h3>A System 15+ Years Old</h3>
            ${list(before)}
            <p class="pw-x-note">Older systems tend to quit when you need them most, and they cost more to run every month.</p>
            <button class="btn btn-secondary pw-x-next" type="button" data-x-go="2">Swipe to See the After${ic('i-arrow-right')}</button>
          </div>
        </div>
        <div class="pw-x-slide" id="x-slide-2" role="tabpanel" aria-labelledby="x-tab-2">
          <div class="pw-x-media">${systemArt(true)}</div>
          <div class="pw-x-copy">
            <h3>What We Do</h3>
            ${list(after)}
            <div class="pw-x-ctas">
              <a class="btn btn-primary" href="#quote" data-quote-link data-pick-service="Repair or replace check">${ic('i-calendar')}Book a System Check</a>
              <a class="pw-text-link" href="${R}faq.html#repair-or-replace">More questions about repair or replace${ic('i-arrow-right')}</a>
            </div>
          </div>
        </div>
      </div>
      <p class="pw-x-src">Sources: U.S. Department of Energy; ENERGY STAR.</p>
    </div>
  </section>`;
}

/* ---------- Projects: one featured before/after slider, then 4 swipe cards ---------- */
export const PROJECTS = [
  { key: 'ac', title: 'AC Installs', photos: ['pw-pj-ac-1', 'pw-ac-install', 'pw-pj-ac-2', 'pw-pj-ac-3', 'pw-article-ac'] },
  { key: 'furnace', title: 'Furnaces', photos: ['pinwheel-heating', 'pw-heating', 'pw-heating-2', 'pw-svc-heating'] },
  { key: 'heatpump', title: 'Heat Pumps and Mini-Splits', photos: ['pw-pj-hp-1', 'heat-pump', 'pw-pj-hp-2', 'pw-svc-cooling', 'pw-heat-pumps'] },
  { key: 'ducts', title: 'Ductwork', photos: ['pw-pj-ducts-1', 'pinwheel-air-quality', 'pw-pj-ducts-2', 'pw-svc-air'] },
];
export function baSlider(before, after, alt) {
  return `<div class="pw-ba" data-ba style="--pos:50%">
          <img class="pw-ba-img" data-photo="${after}" data-crop="3:2" data-widths="480,720,960,1200,1600" sizes="(min-width: 1000px) 760px, 92vw" alt="${esc(alt[1])}">
          <div class="pw-ba-before"><img class="pw-ba-img" data-photo="${before}" data-crop="3:2" data-widths="480,720,960,1200,1600" sizes="(min-width: 1000px) 760px, 92vw" alt="${esc(alt[0])}"></div>
          <span class="pw-ba-label is-before">Before</span><span class="pw-ba-label is-after">After</span>
          <span class="pw-ba-handle" aria-hidden="true"><span class="pw-ba-knob">${ic('i-chevron-left')}${ic('i-chevron-right')}</span></span>
          <input class="pw-ba-range" type="range" min="0" max="100" value="50" aria-label="Drag to compare before and after">
        </div>`;
}
export function projectCard(p, big) {
  return `<li class="pw-pcard" data-pgal>
          <div class="pw-pgal" data-pgal-track tabindex="0" aria-label="${esc(p.title)} photos">
            ${p.photos.map((k) => `<button class="pw-pgal-item" type="button" data-zoom aria-label="See this photo bigger"><img data-photo="${k}" data-crop="${big ? '4:3' : '1:1'}" data-widths="${big ? '480,720,960' : '320,480,640'}" sizes="${big ? '(min-width: 900px) 45vw, 92vw' : '(min-width: 1000px) 290px, 46vw'}" alt=""></button>`).join('')}
          </div>
          <div class="pw-pcard-cap"><h3>${p.title}</h3><span class="pw-pcount" aria-live="polite"><span data-pgal-n>1</span>/${p.photos.length}</span></div>
          <div class="pw-pdots" aria-hidden="true">${p.photos.map((_, i) => `<span${i ? '' : ' class="is-on"'}></span>`).join('')}</div>
        </li>`;
}
export function projectsBlock(R) {
  return `  <section class="section pw-projects bg-white" id="projects" aria-labelledby="projects-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Before and after</p>
        <h2 id="projects-title">Our Work, <span class="accent">Old to New.</span></h2>
        <p class="lead">Drag the slider to compare a worn-out unit with a new one. Swipe each card for more. ${tag('Illustrative photos')}</p>
      </div>
      <div class="pw-ba-wrap">${baSlider('pw-ba-before', 'pw-ba-after', ['Old, grimy outdoor AC unit on a stained wall', 'New, clean outdoor AC unit on a painted brick wall'])}</div>
      <ul class="pw-pcards">
        ${PROJECTS.map((p) => projectCard(p)).join('\n        ')}
      </ul>
      <p class="pw-center"><a class="btn btn-secondary" href="${R}projects.html">See All Projects${ic('i-arrow-right')}</a></p>
    </div>
  </section>`;
}

/* ---------- The quote block: every page ends with it ---------- */
export const QUOTE_SERVICES = ['No cooling', 'No heat', 'Strange noise', 'Tune-up', 'New system', 'Repair or replace check', 'Plumbing problem'];
export function quoteBlock(R, o = {}) {
  const cities = CITIES.map((c) => c.name);
  const picked = o.service || '';
  return `  <section class="section pw-quote" id="quote" aria-labelledby="quote-title"${o.city ? ` data-city="${esc(o.city)}"` : ''}>
    <div class="container">
      <p class="pw-ribbon">${ic('i-tag')}<span><strong>$89 Fall Furnace Safety Check</strong>, through Dec 31.</span> ${tag()} <a href="${R}specials.html">See all specials</a></p>
      <div class="section-head">
        <p class="eyebrow">Free quote</p>
        <h2 id="quote-title">Tell Us What's Going On. <span class="accent">We'll Text You Back.</span></h2>
      </div>
      <div class="pw-quote-grid">
        <div class="pw-quote-card">
          <div class="pw-qtabs" role="tablist" aria-label="How do you want to start?">
            <button type="button" role="tab" id="qtab-visit" aria-controls="qpanel-visit" aria-selected="true">${ic('i-calendar')}Request a Visit</button>
            <button type="button" role="tab" id="qtab-price" aria-controls="qpanel-price" aria-selected="false" tabindex="-1">${ic('i-calculator')}See a Price Range</button>
          </div>
          <div class="pw-qpanel" id="qpanel-visit" role="tabpanel" aria-labelledby="qtab-visit">
            <form class="pw-form pw-qform" name="quote" method="POST" data-netlify="true" netlify-honeypot="bot-field" enctype="multipart/form-data" action="/${o.page || 'index.html'}?sent=1" data-pw-form novalidate>
              <input type="hidden" name="form-name" value="quote">
              <input type="hidden" name="page" value="${esc(o.page || '')}">
              <p class="pw-hp" hidden><label>Leave this empty: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
              <div class="field-row">
                <div class="field"><label for="q-name">Your name</label><input class="input" id="q-name" name="name" type="text" autocomplete="name" required></div>
                <div class="field"><label for="q-phone">Mobile number</label><input class="input" id="q-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></div>
              </div>
              <div class="field"><label for="q-city">City</label><select class="select input" id="q-city" name="city" required data-quote-city>
                <option value="">Pick your city</option>
                ${cities.map((c) => `<option${o.city === c ? ' selected' : ''}>${c}</option>`).join('')}
                <option value="Somewhere else">Somewhere else nearby</option>
              </select></div>
              <fieldset class="q"><legend>What's Going On?</legend><div class="chips-grid">
                ${QUOTE_SERVICES.map((s, i) => `<label class="chip"><input type="radio" name="service" value="${s}"${i === 0 ? ' required' : ''}${s === picked ? ' checked' : ''}><span>${s}</span></label>`).join('')}
              </div></fieldset>
              <div class="field pw-file"><label for="q-photos">Photos of the problem <span class="pw-opt">(optional)</span></label>
                <input class="input" id="q-photos" name="photos" type="file" accept="image/*" multiple data-max-files="4">
                <p class="pw-file-help">Up to 4 photos, like the unit's label or the leak.</p></div>
              <div class="field"><label for="q-notes">Anything else we should know? <span class="pw-opt">(optional)</span></label><textarea class="textarea" id="q-notes" name="notes" rows="2"></textarea></div>
              <p class="form-error" data-error role="alert" hidden>Please fill in your name, number, city, and what's going on.</p>
              <p class="form-error" data-fail role="alert" hidden>That did not go through. Please call ${PHONE} and we will set it up on the phone.</p>
              <button class="btn btn-primary btn-lg btn-block" type="submit">${ic('i-send')}Get My Free Quote</button>
            </form>
            <div class="pw-thanks" tabindex="-1" hidden>
              <span class="pw-thanks-icon">${ic('i-check')}</span>
              <h3>Got It. Thanks.</h3>
              <p>We will text you a time window within the hour during business hours.</p>
            </div>
          </div>
          <div class="pw-qpanel" id="qpanel-price" role="tabpanel" aria-labelledby="qtab-price" hidden>
            <form class="pw-est" data-pw-est novalidate>
              <fieldset class="q"><legend>What Do You Need?</legend><div class="chips-grid">
                ${[['ac', 'New AC'], ['furnace', 'New furnace'], ['combo', 'AC and furnace'], ['heatpump', 'Heat pump']].map(([v, t]) => `<label class="chip"><input type="radio" name="sys" value="${v}"><span>${t}</span></label>`).join('')}
              </div></fieldset>
              <fieldset class="q"><legend>How Big Is Your Home?</legend><div class="chips-grid">
                ${[['s', 'Under 1,500 sq ft'], ['m', '1,500 to 2,500 sq ft'], ['l', '2,500 to 3,500 sq ft'], ['xl', 'Over 3,500 sq ft']].map(([v, t]) => `<label class="chip"><input type="radio" name="size" value="${v}"><span>${t}</span></label>`).join('')}
              </div></fieldset>
              <fieldset class="q"><legend>How Old Is Your System?</legend><div class="chips-grid">
                ${[['young', 'Under 10 years'], ['mid', '10 to 15 years'], ['old', 'Over 15 years'], ['unsure', 'Not sure']].map(([v, t]) => `<label class="chip"><input type="radio" name="age" value="${v}"><span>${t}</span></label>`).join('')}
              </div></fieldset>
              <p class="form-error" data-est-error role="alert" hidden>Pick one answer for each question.</p>
              <button class="btn btn-primary btn-lg btn-block" type="submit">${ic('i-calculator')}See My Price Range</button>
              <div class="pw-est-out" data-est-out hidden aria-live="polite">
                <p class="pw-est-range"><span data-est-low></span> <span class="pw-est-to">to</span> <span data-est-high></span></p>
                <p class="pw-est-for" data-est-for></p>
                <p class="fine">${tag()} A typical range for a Tracy-area home, installed. Your exact price comes after we see your home.</p>
                <a class="btn btn-secondary btn-block" href="#quote" data-quote-link data-pick-service="New system" data-to-visit>${ic('i-calendar')}Book a Free In-Home Quote</a>
              </div>
            </form>
          </div>
        </div>
        <aside class="pw-next" aria-labelledby="next-title">
          <h3 id="next-title">What Happens Next</h3>
          <ol>
            <li><span class="pw-next-n" aria-hidden="true">1</span><span>We text you a time window.</span></li>
            <li><span class="pw-next-n" aria-hidden="true">2</span><span>We text when we're on the way, and a licensed tech gives you the price first.</span></li>
            <li><span class="pw-next-n" aria-hidden="true">3</span><span>Nothing starts until you say yes.</span></li>
          </ol>
          <p class="pw-next-call">Rather talk now? <a href="${TEL}">Call ${PHONE}</a> or <a href="${SMS}">text us</a>.</p>
        </aside>
      </div>
    </div>
  </section>`;
}

/* ---------- Meet the Owner: photo, 2 to 3 lines, 4 promise cards ---------- */
export const PROMISES = [
  ['i-tag', 'Price Before Any Work', 'You see the price and say yes before we pick up a tool.'],
  ['i-message', 'We Text When We\'re On the Way', 'No waiting around all day.'],
  ['i-sparkle', 'Clean Work', 'Shoe covers on, mess cleaned up.'],
  ['i-shield-check', 'Licensed and Insured', 'CSLB C-20 licensed, bonded, and insured.'],
];
export function ownerBlock(R) {
  return `  <section class="section pw-owner-home" id="owner" aria-labelledby="owner-title">
    <div class="container">
      <div class="pw-owner-top">
        <figure class="owner-figure pw-owner-fig">
          <div class="arch"><img data-photo="pw-owner" data-crop="4:5" data-widths="400,640,900" sizes="(min-width: 900px) 360px, 70vw" alt="Luis Ortega, owner of Pinwheel, in a gray work shirt in the shop"></div>
          <figcaption><strong>Luis Ortega</strong><span>Owner and master tech</span></figcaption>
        </figure>
        <div>
          <p class="eyebrow">Meet the owner</p>
          <h2 id="owner-title">Local Owners Who Still <span class="accent">Answer the Phone.</span></h2>
          <p class="lead">Luis's dad started Pinwheel in 2010 with one van. Luis grew up riding along, and today he and Carmen run it with 14 trained techs.</p>
          <blockquote class="pull-quote"><p>If something isn't right, text me. I read every message.</p><cite>Luis Ortega, owner</cite></blockquote>
          <p class="pw-owner-more"><a class="pw-text-link" href="${R}about.html">Meet the whole team${ic('i-arrow-right')}</a></p>
        </div>
      </div>
      <ul class="pw-promises pw-swipe" data-swipe aria-label="Our promises" tabindex="0">
        ${PROMISES.map(([i, t, d]) => `<li><span class="pw-promise-icon">${ic(i)}</span><h3>${t}</h3><p>${d}</p></li>`).join('\n        ')}
      </ul>
    </div>
  </section>`;
}

/* ---------- Reviews: the dark band, swiping and auto-scrolling ---------- */
export function reviewsBand(R) {
  const list = [0, 3, 6, 9, 12, 15, 18, 21].map((i) => REVIEWS[i]).filter(Boolean);
  return `  <section class="section reviews on-dark pw-reviews-band" id="reviews" aria-labelledby="reviews-title" data-carousel>
    <div class="container">
      <div class="section-head split">
        <div>
          <p class="eyebrow">Reviews</p>
          <h2 id="reviews-title">Neighbors Say It Better <span class="accent">Than We Can.</span></h2>
          <p class="rating-line"><svg class="g-mark" role="img" aria-label="Google"><use href="#g-logo"/></svg>${STATS.rating} stars from ${STATS.count} Google reviews <span class="tag">Illustrative reviews</span></p>
        </div>
        <div class="carousel-controls">
          <button class="round-btn" type="button" data-prev aria-label="Previous reviews">${ic('i-chevron-left')}</button>
          <button class="round-btn" type="button" data-next aria-label="More reviews">${ic('i-chevron-right')}</button>
        </div>
      </div>
    </div>
    <div class="review-track" data-track tabindex="0" role="region" aria-label="Customer reviews">
      <ul class="review-list">
        ${list.map((r) => `<li class="review-card">
          <div class="review-top"><span class="avatar" style="--h:${r.h}" aria-hidden="true">${r.n[0]}</span><div><p class="review-name">${r.n}</p><p class="review-meta">${r.city} · ${r.when}</p></div><svg class="g-mark" role="img" aria-label="Google review"><use href="#g-logo"/></svg></div>
          <span class="stars5" role="img" aria-label="5 out of 5 stars"></span>
          <p class="review-text">${r.text}</p>
        </li>`).join('\n        ')}
      </ul>
    </div>
    <div class="container">
      <p class="pw-center pw-reviews-more"><a class="pw-text-link" href="${R}reviews.html">Read All Reviews${ic('i-arrow-right')}</a></p>
    </div>
  </section>`;
}

/* ---------- Service area: the map, a dropdown per county, and Check My Area ---------- */
export function areasBlock(R) {
  const counties = ['San Joaquin', 'Alameda'];
  const list = (county) => CITIES.filter((c) => c.county === county).map((c) =>
    `<li><button type="button" class="pw-city" data-city-pick="${c.name}" aria-pressed="false">${ic('i-map-pin')}${c.name}</button></li>`).join('');
  return `  <section class="section pw-areas" id="areas" aria-labelledby="areas-title">
    <div class="container pw-areas-grid">
      <div class="map-card">
        <!-- partial:area-map -->
        <!-- /partial:area-map -->
      </div>
      <div>
        <p class="eyebrow">Service area</p>
        <h2 id="areas-title">Close By, So We <span class="accent">Get There Fast.</span></h2>
        <p class="lead">Our vans start each day in Tracy and Manteca, so most of the 12 cities we cover see a tech the same day.</p>
        <div class="pw-counties">
          ${counties.map((c, i) => `<details class="pw-county"${i === 0 ? ' open' : ''}>
            <summary><span><strong>${c} County</strong><span>${CITIES.filter((x) => x.county === c).length} cities</span></span>${ic('i-chevron-down')}</summary>
            <ul class="pw-city-list">${list(c)}</ul>
          </details>`).join('\n          ')}
        </div>
        <p class="pw-areas-note">Just outside these cities? Call us.</p>
        <div class="pw-areas-actions">
          <a class="btn btn-primary" href="#quote" data-check-area>${ic('i-map-pin')}Check My Area</a>
          <p class="pw-area-picked" data-area-picked aria-live="polite" hidden>Checking <strong data-area-name></strong></p>
        </div>
        <p class="pw-areas-all"><a class="pw-text-link" href="${R}service-areas.html">See every service area${ic('i-arrow-right')}</a></p>
      </div>
    </div>
  </section>`;
}

/* ---------- Homepage FAQ: 5 questions and a link to the rest ---------- */
export const HOME_FAQ = [
  ['Should I repair or replace my system?', 'If it\'s over 15 years old or needs a big repair, we show you both prices side by side so you can decide.'],
  ['How long does an AC or furnace last?', 'Most AC units and heat pumps last about 15 to 20 years. Furnaces last about 15 to 30, depending on care.'],
  ['How much does a new system cost?', 'Use our price range tool for a quick number. Your exact price comes after we see your home.'],
  ['Do you charge to come out?', 'Our service call is $79, and we waive it when you go ahead with the repair. You see that price before we head over.'],
  ['How soon can you get here?', 'Most homes in Tracy, Mountain House, Lathrop, and Manteca get a same-day visit. We text you a time window and text again when we\'re on the way.'],
];
export function homeFaq(R) {
  return `  <section class="section faq pw-home-faq bg-white" id="faq" aria-labelledby="faq-title">
    <div class="container faq-grid">
      <div class="faq-head">
        <p class="eyebrow">Questions</p>
        <h2 id="faq-title">Questions We Hear <span class="accent">Every Week.</span></h2>
        <p><a class="btn btn-secondary" href="${R}faq.html">See All Questions${ic('i-arrow-right')}</a></p>
      </div>
      ${faqList(HOME_FAQ, 'hfq')}
    </div>
  </section>`;
}

/* ---------- Service pages: what we fix (sub-services) next to a short contact form ---------- */
export function subServices(R, o) {
  return `  <section class="section bg-white pw-subs" id="what-we-do" aria-labelledby="subs-title">
    <div class="container pw-subs-grid">
      <div>
        <p class="eyebrow">What we do</p>
        <h2 id="subs-title">${o.h2}</h2>
        ${o.lead ? `<p class="lead">${o.lead}</p>` : ''}
        <ul class="pw-sublist">${o.items.map(([t, d]) => `<li data-reveal>${ic('i-check-circle')}<span><strong>${t}</strong>${d}</span></li>`).join('')}</ul>
      </div>
      <aside class="pw-sideform" aria-labelledby="side-title">
        <h3 id="side-title">Ask a Quick Question</h3>
        <p>Tell us what's going on and we'll text you back.</p>
        <form class="pw-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/contact.html?sent=1" data-pw-form novalidate>
          <input type="hidden" name="form-name" value="contact">
          <input type="hidden" name="page" value="${esc(o.page || '')}">
          <p class="pw-hp" hidden><label>Leave this empty: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
          <div class="field"><label for="sf-name">Your name</label><input class="input" id="sf-name" name="name" type="text" autocomplete="name" required></div>
          <div class="field"><label for="sf-phone">Mobile number</label><input class="input" id="sf-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required></div>
          <div class="field"><label for="sf-address">Home address</label><input class="input" id="sf-address" name="address" type="text" autocomplete="street-address" required></div>
          <div class="field"><label for="sf-help">How can we help?</label><textarea class="textarea" id="sf-help" name="help" rows="3" required></textarea></div>
          <p class="form-error" data-error role="alert" hidden>Add your name, number, address, and a few words about the problem.</p>
          <p class="form-error" data-fail role="alert" hidden>That did not go through. Please call ${PHONE} and we will help on the phone.</p>
          <button class="btn btn-primary btn-lg btn-block" type="submit">${ic('i-send')}Send</button>
        </form>
        <div class="pw-thanks" tabindex="-1" hidden>
          <span class="pw-thanks-icon">${ic('i-check')}</span>
          <h3>Got It. Thanks.</h3>
          <p>We will text you back during business hours, usually the same day.</p>
        </div>
      </aside>
    </div>
  </section>`;
}
