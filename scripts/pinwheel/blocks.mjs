/* blocks.mjs: the TEMPLATE-PLAYBOOK parts for Pinwheel (homepage sections, the quote block every page ends with,
   the repair-or-replace tap-through, projects, owner, reviews band, service area with county lists, side form).
   Words come from the playbook's HVAC wording bank. Spanish lives in js/i18n/pw-es.js (keyed by the English HTML). */
import { PHONE, TEL, SMS, CITIES, REVIEWS, STATS } from './site-data.mjs';
import { ic, tag, faqList } from './components.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/* ---------- Hero: the Nov 18 comfort hero (mom and son, one even black layer, faces uncovered), with today's buttons
   and the trust strip under the words. Desktop: wide crop, faces on the right. Phones: tall crop, faces at the top. ---------- */
export function homeHero(R) {
  return `  <section class="hero pw-ohero" aria-labelledby="hero-title">
    <picture class="pw-ohero-photo">
      <source data-photo="pinwheel-family-tall" data-crop="orig" data-widths="480,640,840" media="(max-width: 599px)" sizes="100vw">
      <img data-photo="pinwheel-family" data-crop="orig" data-widths="768,1024,1600,2400" data-eager sizes="100vw">
    </picture>
    <div class="container pw-ohero-wrap">
      <div class="hero-copy pw-ohero-copy">
        <h1 class="hero-pill pw-pill">${ic('i-map-pin')}Heating, Air &amp; Plumbing in Tracy, CA</h1>
        <p class="h1 hero-h" id="hero-title">Keep Your Family<br> <span class="accent">Comfortable</span><br class="pw-m-br"> All&nbsp;Year.</p>
        <p class="lead">AC out, heater down, or no hot water? We fix it the same day, with honest, upfront pricing. Serving Tracy, Mountain House, Manteca, Lathrop, Stockton, Livermore, and 6 more cities.</p>
        <div class="hero-ctas pw-ohero-btns" data-hide-bar>
          <a class="btn btn-primary btn-lg" href="#quote" data-quote-link>${ic('i-send')}Get My Free Quote</a>
          <a class="btn btn-glass btn-lg" href="${TEL}">${ic('i-phone')}Call ${PHONE}</a>
        </div>
        ${trustStrip(R)}
      </div>
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
      <p class="pw-center"><a class="btn btn-navy" href="${R}services.html">See All Services${ic('i-arrow-right')}</a></p>
    </div>
  </section>`;
}

/* ---------- Repair or Replace: "specialized service" layout. Copy on the left (word for word from Ben), a photo card on the
   right with a before/after pair from the same garage (stacked on phones). The BEFORE/AFTER pill, the 01 / 02 counter,
   the dots, and the round prev/next arrows sit on the photo. The before photo has 4 small numbered markers on the
   matching spots; marker spots are set in X_MARKS as % of the photo (left, top). ---------- */
export const X_MARKS = [[47, 21.5], [66, 15], [38, 63], [53, 70.5]];
export function explainer(R) {
  const checks = ['Full system test, inside and out', 'Repair and replace prices side by side', 'Carbon monoxide check on every furnace', 'Rebate and financing help on new systems', 'Nothing starts until you say yes'];
  const before = [
    ['Leaky ducts', 'up to 30% of your air never reaches your rooms'],
    ['Rusty vent pipe', 'exhaust can leak into the garage'],
    ['Clogged filter', 'the system works harder and costs more to run'],
    ['Sooty burners', 'a sign it isn\'t burning clean, and a carbon monoxide risk'],
  ];
  const afterChecks = ['Duct seams sealed with mastic', 'New PVC venting, no rust', 'Clean filter, easy to reach', 'Carbon monoxide test passed'];
  const n2 = (i) => String(i + 1).padStart(2, '0');
  return `  <section class="section pw-explain" id="system-check" aria-labelledby="explain-title" data-x>
    <div class="container pw-x-grid">
      <div class="pw-x-left">
        <p class="eyebrow">Specialized service</p>
        <h2 id="explain-title">Repair or Replace? We'll Show You <span class="accent">Both Prices.</span></h2>
        <p class="lead">A furnace or AC over 15 years old can look fine and still cost you every month. Before you pay for a big repair, we test the whole system and show you what it needs.</p>
        <div class="pw-x-callout"><p><strong>Best for systems 15 years or older</strong>, or any time a repair quote feels high. You see the repair price and the replace price side by side, in writing.</p></div>
        <ul class="pw-x-checks">${checks.map((c) => `<li>${ic('i-check')}<span>${c}</span></li>`).join('')}</ul>
        <div class="pw-x-ctas">
          <a class="btn btn-primary" href="#quote" data-quote-link data-pick-service="System check">${ic('i-calendar')}Book a System Check</a>
          <a class="pw-text-link" href="${R}faq.html#repair-or-replace">More Questions About Repair or Replace${ic('i-arrow-right')}</a>
        </div>
      </div>
      <div class="pw-x-card">
        <div class="pw-x-frame">
          <div class="pw-x-track" data-x-track tabindex="0" role="region" aria-label="Before and after photos" aria-roledescription="carousel">
            <figure class="pw-x-slide" aria-label="Before, 1 of 2">
              <div class="pw-x-pic">
                <img data-photo="pw-explainer-furnace-before" data-crop="4:5" data-widths="480,720,1024" sizes="(min-width: 1000px) 560px, 92vw" alt="">
                ${X_MARKS.map(([l, t], i) => `<span class="pw-x-mark" style="left:${l}%;top:${t}%" aria-hidden="true">${n2(i)}</span>`).join('')}
              </div>
              <figcaption class="pw-x-cap">
                <p class="pw-x-cap-label">Inside a 20-year-old system</p>
                <ol class="pw-x-list">${before.map(([b, t], i) => `<li><span class="pw-x-n" aria-hidden="true">${n2(i)}</span><span><strong>${b}:</strong> ${t}</span></li>`).join('')}</ol>
                <p class="pw-x-line">An older furnace can be as low as 56% efficient. New ones run 90% or better.</p>
                <button class="pw-x-go" type="button" data-x-go="2">Swipe to See the After ${ic('i-arrow-right')}</button>
              </figcaption>
            </figure>
            <figure class="pw-x-slide" aria-label="After, 2 of 2">
              <div class="pw-x-pic"><img data-photo="pw-explainer-furnace-after" data-crop="4:5" data-widths="480,720,1024" sizes="(min-width: 1000px) 560px, 92vw" alt=""></div>
              <figcaption class="pw-x-cap">
                <p class="pw-x-cap-label">After · Same garage, new system</p>
                <p class="pw-x-line">Sealed ducts, clean venting, and a furnace that runs 90% efficient or better.</p>
                <ul class="pw-x-after">${afterChecks.map((c) => `<li>${ic('i-check')}<span>${c}</span></li>`).join('')}</ul>
              </figcaption>
            </figure>
          </div>
          <div class="pw-x-top" aria-hidden="true">
            <div class="pw-x-status"><span class="pw-x-pill" data-x-pill>Before</span><span class="pw-x-count"><span data-x-n>01</span> / 02</span></div>
            <div class="pw-x-dots"><span class="is-on"></span><span></span></div>
          </div>
          <div class="pw-x-arrows">
            <button class="pw-arrow" type="button" data-x-prev aria-label="Previous photo">${ic('i-chevron-left')}</button>
            <button class="pw-arrow" type="button" data-x-next aria-label="Next photo">${ic('i-chevron-right')}</button>
          </div>
        </div>
        <p class="pw-x-strip">${ic('i-shield-check')}<span>You see both prices before we touch anything.</span></p>
      </div>
      <p class="pw-x-src">Sources: U.S. Department of Energy; ENERGY STAR. AI-made sample photos.</p>
    </div>
  </section>`;
}

/* ---------- Projects: one featured before/after slider, then 4 swipe cards ---------- */
export const PROJECTS = [
  { key: 'ac', title: 'AC Installs', photos: ['pw-pj-ac-side-yard', 'pw-pj-ac-pair', 'pw-pj-ac-1', 'pw-article-ac'] },
  { key: 'furnace', title: 'Furnaces', photos: ['pw-pj-furnace-attic', 'pw-pj-furnace-closet', 'pw-pj-furnace-garage'] },
  { key: 'heatpump', title: 'Heat Pumps and Mini-Splits', photos: ['pw-pj-hp-1', 'pw-pj-hp-2', 'pw-svc-cooling', 'pw-heat-pumps'] },
  { key: 'ducts', title: 'Ductwork', photos: ['pw-pj-ducts-attic', 'pw-pj-ducts-plenum', 'pw-pj-ducts-register'] },
];
export const BA_PAIR = ['pw-projects-ac-before', 'pw-projects-ac-after'];
export function baSlider(before, after, alt) {
  return `<div class="pw-ba" data-ba style="--pos:50%">
          <img class="pw-ba-img" data-photo="${after}" data-crop="3:2" data-widths="480,720,960,1200,1600" sizes="(min-width: 1000px) 760px, 92vw" alt="${esc(alt[1] || '')}">
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
          <div class="pw-pgal-arrows"><button class="pw-arrow" type="button" data-pgal-prev aria-label="Previous ${esc(p.title)} photo">${ic('i-chevron-left')}</button><button class="pw-arrow" type="button" data-pgal-next aria-label="Next ${esc(p.title)} photo">${ic('i-chevron-right')}</button></div>
          <div class="pw-pcard-cap"><h3>${p.title}</h3><span class="pw-pcount" aria-live="polite"><span data-pgal-n>1</span>/${p.photos.length}</span></div>
          <div class="pw-pdots" aria-hidden="true">${p.photos.map((_, i) => `<span${i ? '' : ' class="is-on"'}></span>`).join('')}</div>
        </li>`;
}
export function projectsBlock(R) {
  return `  <section class="section pw-projects bg-white" id="projects" aria-labelledby="projects-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Projects</p>
        <h2 id="projects-title">Our Work, <span class="accent">Old to New.</span></h2>
        <p class="lead">Same wall, same house: a 20-year-old AC next to the new one that replaced it. Swipe each card for more. ${tag('AI-made sample photos')}</p>
      </div>
      <div class="pw-ba-wrap">${baSlider(BA_PAIR[0], BA_PAIR[1], ['', ''])}</div>
      <ul class="pw-pcards">
        ${PROJECTS.map((p) => projectCard(p)).join('\n        ')}
      </ul>
      <p class="pw-center"><a class="btn btn-navy" href="${R}projects.html">See All Projects${ic('i-arrow-right')}</a></p>
    </div>
  </section>`;
}

/* ---------- The quote block: every page ends with it ---------- */
export const QUOTE_SERVICES = ['No cooling', 'No heat', 'Strange noise', 'Tune-up', 'New system', 'System check', 'Plumbing problem'];
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
              <div class="field"><label for="q-city">City</label><input class="input" id="q-city" name="city" type="text" autocomplete="address-level2" required data-quote-city${o.city ? ` value="${esc(o.city)}"` : ''}></div>
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
                <a class="btn btn-navy btn-block" href="#quote" data-quote-link data-pick-service="New system" data-to-visit>${ic('i-calendar')}Book a Free In-Home Quote</a>
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
/* The owner story, word for word from Ben. Used on the homepage and the About page. */
export const OWNER_STORY = 'Hi, I\'m Luis Ortega. I started Pinwheel in 2010 with one van. Today my wife, Carmen, runs the office, and our 14 techs cover Tracy and the towns around it. I still look over every new install before we call it done.';
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
          <div class="arch"><img data-photo="pw-owner" data-crop="4:5" data-widths="400,640,900" sizes="(min-width: 900px) 360px, 70vw" alt=""></div>
          <figcaption><strong>Luis Ortega</strong><span>Owner</span></figcaption>
        </figure>
        <div>
          <p class="eyebrow">Meet the owner</p>
          <h2 id="owner-title">Family Owned in Tracy <span class="accent">Since 2010.</span></h2>
          <p class="lead">${OWNER_STORY}</p>
          <p class="pw-owner-tag">${tag('Illustrative owner story')}</p>
          <p class="pw-owner-more"><a class="pw-text-link" href="${R}about.html">More About Us${ic('i-arrow-right')}</a></p>
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
  // Plain chips; only home base (Tracy) is highlighted, with a small home icon
  const list = (county) => CITIES.filter((c) => c.county === county).map((c) => c.name === 'Tracy'
    ? `<li class="pw-area-chip is-home">${ic('i-home')}${c.name} <span class="visually-hidden">(home base)</span></li>`
    : `<li class="pw-area-chip">${c.name}</li>`).join('');
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
          ${counties.map((c) => `<details class="pw-county">
            <summary><span><strong>${c} County</strong><span>${CITIES.filter((x) => x.county === c).length} cities</span></span>${ic('i-chevron-down')}</summary>
            <ul class="pw-city-list">${list(c)}</ul>
          </details>`).join('\n          ')}
        </div>
        <p class="pw-areas-note">Just outside these cities? Call us.</p>
        <p class="pw-areas-all"><a class="pw-text-link" href="${R}service-areas.html">See Every Service Area${ic('i-arrow-right')}</a></p>
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
        <h2 id="faq-title">You've Got Questions. <span class="accent">We've Got Answers.</span></h2>
        <p><a class="btn btn-navy" href="${R}faq.html">See All Questions${ic('i-arrow-right')}</a></p>
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
