/* pages-other.mjs: hubs, plans, tools, company pages, city pages, articles, legal, and the 404.
   Sample data for a fictional business. */
import { readFileSync } from 'node:fs';
import { hero, sec, checklist, steps, prices, reviewCard, reviewsSection, faqList, faqSection, faqLd, club, bookCall,
  areasStrip, split, linkCards, serviceLd, crumbLd, heroPreload, callBtn, bookBtn, bookHref, ic, tag } from './components.mjs';
import { GROUPS, CITIES, REVIEWS, STATS, PHONE, TEL, SMS, SITE } from './site-data.mjs';

const block = (name) => readFileSync(new URL(`../pinwheel-blocks/${name}`, import.meta.url), 'utf8');
const hp = (key, fpPhone) => heroPreload(key, fpPhone);

/* A Netlify form with a thank-you state (js/pinwheel.js posts it and shows the thank-you) */
function netlifyForm(name, inner, thanks, submitLabel, o = {}) {
  return `<form class="pw-form${o.cls ? ' ' + o.cls : ''}" name="${name}" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/${o.page || name + '.html'}?sent=1" data-pw-form novalidate${o.label ? ` aria-labelledby="${o.label}"` : ''}>
          <input type="hidden" name="form-name" value="${name}">
          <p class="pw-hp" hidden><label>Leave this empty: <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
          ${inner}
          <p class="form-error" data-error role="alert" hidden>${o.error || 'Please fill in the highlighted fields.'}</p>
          <p class="form-error" data-fail role="alert" hidden>That did not go through. Please call ${PHONE} and we will set it up on the phone.</p>
          <button class="btn btn-primary btn-lg btn-block" type="submit">${ic('i-send')}${submitLabel}</button>
          <p class="fine">Sample site. Your request goes to the site's form inbox, not to a real company.</p>
        </form>
        <div class="pw-thanks" tabindex="-1" hidden>
          <span class="pw-thanks-icon">${ic('i-check')}</span>
          ${thanks}
        </div>`;
}
const field = (id, label, type = 'text', extra = '') => `<div class="field"><label for="${id}">${label}</label><input class="input" id="${id}" name="${id.replace(/^[a-z]+-/, '')}" type="${type}" ${extra}></div>`;

const crumbs = (...t) => [['Home', 'index.html'], ...t];

/* ---------- Services hub ---------- */
const GROUP_PHOTOS = { cooling: 'svc-cooling', heating: 'svc-heating', plumbing: 'svc-plumbing', air: 'svc-air' };
const GROUP_TEXT = {
  cooling: 'AC repair, new systems, tune-ups, ducts, and thermostats for valley summers.',
  heating: 'Furnace repair and replacement, heat pumps, and ductless systems for cold mornings.',
  plumbing: 'Water heaters, drains and sewer lines, leaks, and whole-home repiping.',
  air: 'Better filters, whole-home purifiers, duct cleaning, and humidity control.',
};
export const services = (ph) => ({
  file: 'services.html', title: 'Heating, Cooling & Plumbing Services in Tracy, CA | Pinwheel',
  desc: 'Every Pinwheel service in one place: AC repair and installation, furnace repair, heat pumps, water heaters, drains, leak repair, and indoor air quality in Tracy, CA. Sample site.',
  ogTitle: 'Heating, Cooling & Plumbing Services in Tracy, CA', preload: hp(ph('services-hero')),
  jsonld: [crumbLd('services.html', crumbs(['Services']))],
  body: (R) => [
    hero(R, { photo: ph('services-hero'), crumbs: crumbs(['Services']), pill: 'Heating, air, and plumbing in Tracy, CA',
      title: 'Our <span class="accent">Services</span> in Tracy, CA.', lead: 'One local team handles your heating, cooling, plumbing, and indoor air. The same trained techs and the same upfront pricing come with every job, big or small.' }),
    sec({ id: 'groups', cls: 'bg-white', eyebrow: 'What we do', h2: 'Pick What <span class="accent">You Need.</span>',
      lead: 'Each group links to its own page with signs to watch for, what we do on the visit, and starting prices.',
      inner: `<div class="pw-groups">${GROUPS.map((g) => `<article class="pcard pw-group" id="${g.key}">
          <div class="pcard-photo"><img data-photo="${ph(GROUP_PHOTOS[g.key])}" data-crop="4:3" data-widths="480,720,960" sizes="(min-width: 1000px) 560px, (min-width: 700px) 46vw, 92vw" alt=""></div>
          <span class="pcard-badge" aria-hidden="true">${ic(g.icon)}</span>
          <div class="pcard-body">
            <h3><a href="${R}${g.overview}">${g.name}</a></h3>
            <p>${GROUP_TEXT[g.key]}</p>
            <ul class="pw-group-links">${g.pages.map((s) => `<li><a href="${R}${s.file}">${s.name}${ic('i-arrow-right')}</a></li>`).join('')}</ul>
          </div>
        </article>`).join('\n')}</div>` }),
    sec({ id: 'emergency-band', cls: 'pw-emerg-band on-dark', inner: `<div class="pw-emerg-inner" data-reveal>
        <span class="pw-emerg-icon" aria-hidden="true">${ic('i-zap')}</span>
        <div><h2 id="emergency-band-title">24/7 Emergency <span class="accent">Service.</span></h2><p>Burst pipe, no heat, or a sewer backup at night? A real person answers the emergency line around the clock and talks you through what to shut off while a tech heads over.</p></div>
        <div class="btn-row"><a class="btn btn-primary btn-lg" href="${TEL}">${ic('i-phone')}Call ${PHONE}</a><a class="btn btn-glass btn-lg" href="${R}emergency.html">What counts as an emergency</a></div>
      </div>` }),
    club(R), bookCall(R), areasStrip(R),
  ].join('\n\n'),
});

/* ---------- Cooling overview ---------- */
export const cooling = (ph) => ({
  file: 'cooling.html', title: 'Cooling & AC Services in Tracy, CA | Pinwheel',
  desc: 'AC repair, new AC systems, tune-ups, duct sealing, and smart thermostats for Tracy-area homes, plus a free repair-or-replace helper. Sample site.',
  ogTitle: 'Cooling & AC Services in Tracy, CA', preload: hp(ph('cooling-hero')),
  jsonld: [serviceLd({ name: 'Cooling service', type: 'AC repair, AC installation, tune-ups, duct sealing, thermostats', desc: 'Cooling services for Tracy-area homes. Sample data.', file: 'cooling.html' }),
    faqLd(COOL_FAQ), crumbLd('cooling.html', crumbs(['Services', 'services.html'], ['Cooling']))],
  body: (R) => [
    hero(R, { photo: ph('cooling-hero'), crumbs: crumbs(['Services', 'services.html'], ['Cooling']), pill: 'Cooling services in Tracy, CA', service: 'AC repair',
      title: '<span class="accent">Cooling</span> in Tracy, CA.', lead: 'We repair ACs and install new systems and heat pumps for homes in Tracy and the valley. On a 105-degree day, most homes see a tech the same day, and the common parts are already on the van.' }),
    sec({ id: 'cool-pages', cls: 'bg-white', eyebrow: 'Cooling services', h2: 'Repair It or <span class="accent">Replace It.</span>',
      lead: 'Start here. Each page explains the signs, what we do on the visit, and starting prices.',
      inner: linkCards(R, [
        { href: 'ac-repair.html', icon: 'i-wrench', bubble: 'cool', title: 'AC Repair', text: 'Warm air, ice on the lines, strange noises, or no power. Most repairs get done in one visit.' },
        { href: 'ac-installation.html', icon: 'i-snowflake', bubble: 'cool', title: 'AC Installation & Replacement', text: 'New systems sized with a real load calculation, installed in a day, with rebates handled.' },
        { href: 'heat-pumps.html', icon: 'i-heatpump', bubble: '', title: 'Heat Pumps', text: 'One quiet system that cools in July and heats in January.' },
        { href: 'air-quality.html', icon: 'i-wind', bubble: 'navy', title: 'Indoor Air Quality', text: 'Filters, purifiers, and duct cleaning for smoke season.' },
      ]) }),
    sec({ id: 'more', inner: split({ photo: ph('thermostat'), id: 'more-title', eyebrow: 'Built for valley heat', h2: 'The Small Jobs That Keep <span class="accent">Bills Down.</span>',
      lead: 'Afternoons top 100 degrees, and the wind off the Altamont packs dust and dry grass into outdoor coils. A clogged coil makes your system run longer and work harder.',
      paras: ['That is why so many summer calls end with a coil cleaning and a new capacitor, not a whole new system. We also do spring tune-ups, seal and insulate attic ducts, and set up smart thermostats with schedules that trim the afternoon peak.'],
      after: `<div class="btn-row"><a class="btn btn-primary" href="${bookHref(R, 'Tune-up')}">${ic('i-calendar')}Book a spring tune-up</a></div>` }) }),
    `  <section class="section bg-white" id="repair-or-replace-section" aria-labelledby="helper-title">
    <div class="container">
      ${block('helper.html').replace(/href="book\.html/g, `href="${R}book.html`)}
    </div>
  </section>`,
    faqSection(R, COOL_FAQ, { h2: 'Cooling <span class="accent">Questions.</span>', prefix: 'cool' }),
    club(R), bookCall(R, 'AC repair'), areasStrip(R),
  ].join('\n\n'),
});
const COOL_FAQ = [['How often should my AC be serviced?', 'We recommend once a year, in spring, before the first heat wave. Valley dust and pollen clog coils fast, and a clean coil keeps your bills down.'], ['What size AC do I need?', 'It depends on more than square feet. Windows, insulation, the attic, and the sun all matter. We run a real load calculation instead of guessing, because an oversized unit short cycles and never dries the air.'], ['Is a heat pump worth it here?', 'Yes. Our winters are mild, which is exactly where heat pumps shine. Many valley homes save on both summer and winter bills.'], ['Why is one room always hotter?', 'Usually leaky attic ducts, a weak blower, or no zoning. A duct test tells us which one you have.']];

/* ---------- Plumbing overview ---------- */
const PLUMB_FAQ = [['Do you charge more for evenings and weekends?', 'Evenings and weekends carry a small after-hours fee, which we tell you before anyone drives over. Comfort Club members never pay it.'], ['How do I know if I need a repipe?', 'Rusty water, low pressure in several rooms, and repeated pinhole leaks are the usual signs, especially in homes built before 1980 with galvanized pipe. A camera and pressure test confirm it.'], ['Will you patch the drywall?', 'Yes. Our plumbers cut the smallest opening they can, and the patch and texture are part of the quote.'], ['Do you install water softeners?', 'Yes. Valley water is hard on pipes and appliances, and we install and service softeners and whole-home filters.']];
export const plumbing = (ph) => ({
  file: 'plumbing.html', title: 'Plumbing Services in Tracy, CA | Pinwheel',
  desc: 'Water heaters, drain cleaning, leak repair, repiping, fixtures, softeners, and gas lines for Tracy-area homes. Upfront prices and clean techs. Sample site.',
  ogTitle: 'Plumbing Services in Tracy, CA', preload: hp(ph('plumbing-hero')),
  jsonld: [serviceLd({ name: 'Plumbing service', type: 'Water heaters, drains, leak repair, repiping, fixtures, gas lines', desc: 'Plumbing services for Tracy-area homes. Sample data.', file: 'plumbing.html' }),
    faqLd(PLUMB_FAQ), crumbLd('plumbing.html', crumbs(['Services', 'services.html'], ['Plumbing']))],
  body: (R) => [
    hero(R, { photo: ph('plumbing-hero'), crumbs: crumbs(['Services', 'services.html'], ['Plumbing']), pill: 'Plumbing services in Tracy, CA', service: 'Plumbing repair',
      title: '<span class="accent">Plumbing</span> in Tracy, CA.', lead: 'We handle water heaters, drains, leaks, and repiping for homes in Tracy and the valley. Our techs work clean, the prices are clear, and most jobs are done in one visit.' }),
    sec({ id: 'plumb-pages', cls: 'bg-white', eyebrow: 'Plumbing services', h2: 'Start With the Problem <span class="accent">You Have.</span>',
      lead: 'Each page explains the signs, what we do on the visit, and starting prices.',
      inner: linkCards(R, [
        { href: 'water-heaters.html', icon: 'i-waterheater', bubble: 'navy', title: 'Water Heaters', text: 'Tank and tankless repair, flushes, and same-day replacement.' },
        { href: 'drains.html', icon: 'i-drain', bubble: 'navy', title: 'Drains & Sewer', text: 'Slow drains, main line clogs, camera inspections, and sewer repair.' },
        { href: 'leak-repair.html', icon: 'i-pipes', bubble: 'navy', title: 'Leak Repair & Repiping', text: 'Hidden leaks found with listening gear, and whole homes repiped.' },
        { href: 'emergency.html', icon: 'i-zap', bubble: '', title: '24/7 Emergency Service', text: 'Burst pipe or sewer backup? The emergency line answers around the clock.' },
      ]) }),
    sec({ id: 'other', eyebrow: 'Also on the van', h2: 'The Everyday Fixes <span class="accent">We Handle Too.</span>',
      inner: `<ul class="pw-mini">
        <li data-reveal>${ic('i-droplet')}<span><strong>Faucets, toilets, and disposals</strong>We repair or replace running toilets, dripping faucets, and garbage disposals in one visit.</span></li>
        <li data-reveal>${ic('i-filter')}<span><strong>Water softeners and filtration</strong>Valley water is hard on pipes and appliances. We install and service softeners and whole-home filters.</span></li>
        <li data-reveal>${ic('i-flame')}<span><strong>Gas lines</strong>We run new gas lines for ranges, dryers, fire pits, and generators, and we test and permit every one.</span></li>
        <li data-reveal>${ic('i-home')}<span><strong>Hose bibs and shutoff valves</strong>We replace stuck shutoffs and leaky outdoor faucets before they fail at the worst time.</span></li>
      </ul>` }),
    sec({ id: 'shutoff', cls: 'bg-white', inner: `<aside class="callout pw-shutoff" data-reveal>
        <div>
          <h2 id="shutoff-title">If Water Is Spraying, <span class="accent">Do This First.</span></h2>
          <ol class="pw-ol"><li>Find your main shutoff. It is usually near the front hose bib or in the garage.</li><li>Turn it clockwise until it stops.</li><li>Call us. Our emergency line answers 24/7.</li></ol>
        </div>
        <a class="btn btn-primary btn-lg" href="${TEL}">${ic('i-phone')}Call ${PHONE}</a>
      </aside>` }),
    faqSection(R, PLUMB_FAQ, { h2: 'Plumbing <span class="accent">Questions.</span>', prefix: 'plumb' }),
    club(R), bookCall(R, 'Plumbing repair'), areasStrip(R),
  ].join('\n\n'),
});

/* ---------- Emergency ---------- */
const EMERG_FAQ = [['Do you really answer at night?', 'Yes. The emergency line rings to a real person on our team 24 hours a day, every day of the year.'], ['How much does an after-hours visit cost?', 'After-hours visits carry a $99 fee on top of the repair, and we tell you the total before anyone drives over. Comfort Club members never pay it. ' + '<span class="tag">Illustrative</span>'], ['What if it can wait until morning?', 'We will tell you honestly. If it is safe to wait, we book you the first slot in the morning and save you the after-hours fee.']];
export const emergency = (ph) => ({
  file: 'emergency.html', title: '24/7 Emergency Plumbing, Heating & AC in Tracy, CA | Pinwheel',
  desc: 'Burst pipe, no heat, gas smell, or sewer backup? Pinwheel answers 24/7 in Tracy and nearby cities. What counts as an emergency and what to do while you wait. Sample site.',
  ogTitle: '24/7 Emergency Service in Tracy, CA', preload: hp(ph('emergency-hero')), bodyClass: 'pw-emergency',
  jsonld: [serviceLd({ name: '24/7 emergency service', type: 'Emergency plumbing, heating, and cooling repair', desc: 'Emergency service around the clock. Sample data.', file: 'emergency.html' }), faqLd(EMERG_FAQ), crumbLd('emergency.html', crumbs(['Services', 'services.html'], ['24/7 Emergency']))],
  body: (R) => [
    hero(R, { photo: ph('emergency-hero'), crumbs: crumbs(['Services', 'services.html'], ['24/7 Emergency']), pill: 'Open 24/7 in Tracy, CA', title: '24/7 <span class="accent">Emergency Service</span> in Tracy, CA.',
      lead: 'A real person answers our emergency line day and night. We talk you through what to shut off, then send the nearest tech.',
      ctas: `<a class="btn btn-primary btn-lg" href="${TEL}">${ic('i-phone')}Call ${PHONE} now</a>` }),
    sec({ id: 'counts', cls: 'bg-white', eyebrow: 'What counts as an emergency', h2: 'Call Right Away <span class="accent">for These.</span>',
      lead: 'If you are not sure, call anyway. We would rather tell you it can wait than have you guess.',
      inner: checklist(['Water spraying or pouring from a pipe, fitting, or water heater', 'A sewer backup into a tub, shower, or floor drain', 'No heat when it is below 40 degrees outside, especially with babies, seniors, or anyone sick at home', 'No AC during a heat wave with someone vulnerable at home', 'A burning or electrical smell from your furnace or AC', 'Your carbon monoxide alarm is going off', 'Water leaking through a ceiling or into a light fixture', 'No water at all in the house']) }),
    sec({ id: 'wait', eyebrow: 'While you wait', h2: 'What to Do <span class="accent">Before We Get There.</span>',
      lead: 'These steps keep a bad night from getting worse. We will walk you through them on the phone too.',
      inner: `<div class="pw-wait">
        <article class="pw-wait-card" data-reveal><span class="pw-wait-icon">${ic('i-droplet')}</span><h3>Water leak or burst pipe</h3><p>Shut off the water at the main valve. It is usually near the front hose bib or in the garage. Turn it clockwise until it stops. Then open a faucet on the lowest floor to drain the pressure.</p></article>
        <article class="pw-wait-card" data-reveal><span class="pw-wait-icon">${ic('i-waterheater')}</span><h3>Leaking water heater</h3><p>Turn off the cold water valve on top of the heater. For a gas heater, turn the gas knob to off or pilot. For an electric heater, switch off its breaker.</p></article>
        <article class="pw-wait-card" data-reveal><span class="pw-wait-icon">${ic('i-flame')}</span><h3>Burning smell from the furnace or AC</h3><p>Turn the system off at the thermostat, then switch off its breaker in the panel. Do not turn it back on until a tech checks it.</p></article>
        <article class="pw-wait-card" data-reveal><span class="pw-wait-icon">${ic('i-info')}</span><h3>Gas smell or a CO alarm</h3><p>Leave the house right away with everyone and your pets. Do not flip switches. From outside, call 911 and the gas company, then call us.</p></article>
        <article class="pw-wait-card" data-reveal><span class="pw-wait-icon">${ic('i-drain')}</span><h3>Sewer backup</h3><p>Stop using water anywhere in the house, including toilets, showers, the dishwasher, and the washer, until we clear the line.</p></article>
        <article class="pw-wait-card" data-reveal><span class="pw-wait-icon">${ic('i-thermometer')}</span><h3>No heat or no AC</h3><p>Check that the thermostat is set right and has fresh batteries, and that the breaker has not tripped. Then call us, and close blinds or add blankets while you wait.</p></article>
      </div>` }),
    sec({ id: 'shutoff-photo', cls: 'bg-white', inner: split({ photo: ph('emergency-2'), id: 'shutoff-photo-title', reverse: true, eyebrow: 'Know your valves', h2: 'Find Your Shutoff <span class="accent">Today.</span>',
      lead: 'The best time to find your main water shutoff is before you need it.', paras: ['Walk out to the front of the house and look near the hose bib, or check the garage wall where the water line comes in. If the valve is stuck or rusted, we can replace it during any visit so it works when it counts.'] }) }),
    `  <section class="section pw-bigcall on-dark" aria-labelledby="bigcall-title">
    <div class="container center" data-reveal>
      <p class="eyebrow">Emergency line, open 24/7</p>
      <h2 id="bigcall-title">Call Us <span class="accent">Right Now.</span></h2>
      <a class="btn btn-primary btn-xl pw-bigcall-btn" href="${TEL}">${ic('i-phone')}${PHONE}</a>
      <p class="lead">A real person on our team answers, day or night.</p>
    </div>
  </section>`,
    reviewsSection(R, REVIEWS.filter((r) => r.tag === 'emergency').concat(REVIEWS.filter((r) => r.tag === 'drains').slice(1, 2))),
    faqSection(R, EMERG_FAQ, { h2: 'Emergency <span class="accent">Questions.</span>', cls: 'bg-white', prefix: 'emerg' }),
    club(R), areasStrip(R),
  ].join('\n\n'),
});

/* ---------- Comfort Club ---------- */
const CLUB_FAQ = [['Can I cancel anytime?', 'Yes. There is no contract and no cancellation fee. Text or call and we will cancel it that day.'], ['What if something breaks between tune-ups?', 'You get the first open slot, no overtime fees, and 15% off the repair.'], ['Does the plan move with the house?', 'Yes. It can move to the new owners, which is a nice selling point.'], ['What does a tune-up include?', 'The spring visit cleans the outdoor coil, checks refrigerant and electrical parts, and clears the drain line. The fall visit checks the burners, igniter, flame sensor, heat exchanger, and carbon monoxide.']];
export const comfortClub = (ph) => ({
  file: 'comfort-club.html', title: 'Comfort Club Maintenance Plan in Tracy, CA | Pinwheel',
  desc: 'Two tune-ups a year, priority scheduling, 15% off repairs, and no overtime fees for $15 a month. Pinwheel Comfort Club for Tracy-area homes. Sample site.',
  ogTitle: 'Comfort Club Maintenance Plan in Tracy, CA', preload: hp(ph('comfort-club-hero')),
  jsonld: [{ '@type': 'Offer', name: 'Comfort Club maintenance plan', price: '15', priceCurrency: 'USD', description: 'Sample pricing for a concept business.', url: SITE + 'comfort-club.html' }, faqLd(CLUB_FAQ), crumbLd('comfort-club.html', crumbs(['Comfort Club']))],
  body: (R) => [
    hero(R, { photo: ph('comfort-club-hero'), crumbs: crumbs(['Comfort Club']), pill: 'Maintenance plan in Tracy, CA', title: 'The <span class="accent">Comfort Club</span> in Tracy, CA.',
      lead: 'For $15 a month, we tune up your AC every spring and your heating every fall, put you first in line when something breaks, and take 15% off every repair.',
      ctas: `<a class="btn btn-primary btn-lg" href="#join">${ic('i-check')}Join the Comfort Club</a>${callBtn('btn btn-glass btn-lg')}` }),
    sec({ id: 'included', cls: 'bg-white', eyebrow: 'What you get', h2: 'Everything in <span class="accent">One Plan.</span>', lead: `One plan, one price, for one heating and cooling system. ${tag()}`,
      inner: `<div class="pw-plan-grid">
        <ul class="pw-perks">
          <li data-reveal><span class="pw-perk-icon">${ic('i-snowflake')}</span><span><strong>AC tune-up every spring</strong>We clean the outdoor coil, check refrigerant and electrical parts, and clear the drain line before the first heat wave.</span></li>
          <li data-reveal><span class="pw-perk-icon">${ic('i-flame')}</span><span><strong>Heating tune-up every fall</strong>We check the burners, igniter, flame sensor, and heat exchanger, and test for carbon monoxide.</span></li>
          <li data-reveal><span class="pw-perk-icon">${ic('i-clock')}</span><span><strong>Priority scheduling</strong>When something breaks, members get the first open slot, even in a heat wave.</span></li>
          <li data-reveal><span class="pw-perk-icon">${ic('i-percent')}</span><span><strong>15% off every repair</strong>Heating, cooling, and plumbing repairs all count.</span></li>
          <li data-reveal><span class="pw-perk-icon">${ic('i-tag')}</span><span><strong>No overtime fees</strong>Evenings, Sundays, and holidays cost the same as a Tuesday morning.</span></li>
        </ul>
        <div class="pw-plan-card" data-reveal>
          <p class="eyebrow">Comfort Club</p>
          <p class="pw-plan-price"><span>$15</span><small>a month</small></p>
          <p class="fine">${tag()} Sample price. Billed monthly, cancel anytime.</p>
          <ul class="pw-plan-list"><li>${ic('i-check')}2 tune-ups a year</li><li>${ic('i-check')}Priority scheduling</li><li>${ic('i-check')}15% off repairs</li><li>${ic('i-check')}No overtime fees</li></ul>
          <a class="btn btn-primary btn-lg btn-block" href="#join">Join now</a>
        </div>
      </div>` }),
    sec({ id: 'pays', eyebrow: 'Does it pay for itself?', h2: 'One Repair Visit <span class="accent">Usually Covers It.</span>',
      lead: `Here is a typical year for a member. ${tag()}`,
      inner: `<div class="pw-math" data-reveal>
        <div><p class="pw-math-label">Two tune-ups without the plan</p><p class="pw-math-amt">$198</p></div>
        <div><p class="pw-math-label">15% off one $450 repair</p><p class="pw-math-amt">$68</p></div>
        <div><p class="pw-math-label">One after-hours fee avoided</p><p class="pw-math-amt">$99</p></div>
        <div class="pw-math-total"><p class="pw-math-label">Value in a typical year</p><p class="pw-math-amt">$365</p><p class="fine">The plan costs $180 a year. Sample numbers for a concept site.</p></div>
      </div>` }),
    sec({ id: 'join', cls: 'bg-white', eyebrow: 'Join in a minute', h2: 'Sign Up for the <span class="accent">Comfort Club.</span>',
      lead: 'Tell us where to reach you, and we will text you to schedule your first tune-up within a week.',
      inner: `<div class="pw-form-grid">
        <div class="pw-form-card">
        ${netlifyForm('comfort-club', `<div class="field-row">${field('cc-name', 'Your name', 'text', 'autocomplete="name" required')}${field('cc-phone', 'Mobile number', 'tel', 'autocomplete="tel" inputmode="tel" required')}</div>
          ${field('cc-email', 'Email', 'email', 'autocomplete="email" required')}
          ${field('cc-address', 'Home address', 'text', 'autocomplete="street-address" required')}
          <fieldset class="q"><legend>What Do You Have at Home?</legend><div class="chips-grid">
            <label class="chip"><input type="radio" name="system" value="AC and furnace" required><span>AC and furnace</span></label>
            <label class="chip"><input type="radio" name="system" value="Heat pump"><span>Heat pump</span></label>
            <label class="chip"><input type="radio" name="system" value="Not sure"><span>Not sure</span></label>
          </div></fieldset>`, '<h3>You Are in the Comfort Club.</h3><p>Thanks for joining. We will text you within one business day to set up your first tune-up.</p><p class="fine">Sample site: no card was charged and nothing was booked.</p>', 'Join the Comfort Club')}
        </div>
        <ul class="pw-side-list">
          <li>${ic('i-check')}Cancel anytime, with no fee.</li>
          <li>${ic('i-check')}We schedule your first tune-up within a week.</li>
          <li>${ic('i-check')}Member pricing starts the day you join.</li>
          <li>${ic('i-phone')}Rather talk it over? Call ${PHONE}.</li>
        </ul>
      </div>` }),
    faqSection(R, CLUB_FAQ, { h2: 'Comfort Club <span class="accent">Questions.</span>', prefix: 'club' }),
    bookCall(R, 'Tune-up'), areasStrip(R),
  ].join('\n\n'),
});

/* ---------- Financing ---------- */
const FIN_FAQ = [['Will checking my options hurt my credit?', 'Checking your options uses a soft credit check, which does not affect your score. The lender explains everything before you accept.'], ['Can I pay it off early?', 'Yes. The example plans have no prepayment penalty.'], ['What can I finance?', 'You can finance new heating and cooling systems, heat pumps, water heaters, repipes, and larger repairs.'], ['Who is the lender?', 'This is a sample site, so no real lender is named. On a real site, we list the lending partner and their terms here.']];
export const financing = (ph) => ({
  file: 'financing.html', title: 'Financing for AC, Furnace & Plumbing in Tracy, CA | Pinwheel',
  desc: 'Spread the cost of a new AC, furnace, heat pump, or water heater into monthly payments. Try the payment estimator and see how to apply on the visit. Sample site.',
  ogTitle: 'Financing in Tracy, CA', preload: hp(ph('couple')),
  jsonld: [faqLd(FIN_FAQ), crumbLd('financing.html', crumbs(['About', 'about.html'], ['Financing']))],
  body: (R) => [
    hero(R, { photo: ph('couple'), crumbs: crumbs(['About', 'about.html'], ['Financing']), pill: 'Monthly payments in Tracy, CA', title: '<span class="accent">Financing</span> in Tracy, CA.',
      lead: 'You should not have to wait for a perfect month to replace a system. You can spread the cost into monthly payments and apply right on the visit.',
      ctas: `<a class="btn btn-primary btn-lg" href="#calculator">${ic('i-calculator')}Estimate my payment</a>${callBtn('btn btn-glass btn-lg')}` }),
    block('finance-calc.html'),
    sec({ id: 'who', eyebrow: 'Who it is for', h2: 'It Helps When the Timing <span class="accent">Is Not Great.</span>',
      inner: `<ul class="pw-mini">
        <li data-reveal>${ic('i-snowflake')}<span><strong>A system that quit in July</strong>Your AC is done and you need cool air this week, not after you save up.</span></li>
        <li data-reveal>${ic('i-heatpump')}<span><strong>An upgrade that pays you back</strong>A heat pump or high-efficiency system lowers your bills, and the payment can be close to what you save.</span></li>
        <li data-reveal>${ic('i-pipes')}<span><strong>Bigger plumbing jobs</strong>Repipes, sewer lines, and tankless water heaters can be spread out too.</span></li>
        <li data-reveal>${ic('i-home')}<span><strong>Homeowners keeping cash on hand</strong>Some folks would rather keep savings for emergencies and pay monthly.</span></li>
      </ul>` }),
    sec({ id: 'apply', cls: 'bg-white', eyebrow: 'How to apply', h2: 'You Apply Right <span class="accent">on the Visit.</span>',
      lead: 'There is nothing to do ahead of time. Your tech or comfort advisor walks you through it at the kitchen table.',
      inner: steps([['We quote the job', 'You get a written price with a few options. Each one shows the monthly payment next to it.'], ['You check your options', 'The application takes about 2 minutes on a tablet and uses a soft credit check, so your score is not affected.'], ['You pick a plan', 'Choose the term and payment that fit your budget. You see every term in writing before you sign.'], ['We install', 'Most systems go in within a day or two of approval.']]) }),
    faqSection(R, FIN_FAQ, { h2: 'Financing <span class="accent">Questions.</span>', prefix: 'fin' }),
    bookCall(R, 'New system quote'), areasStrip(R),
  ].join('\n\n'),
});

/* ---------- Specials ---------- */
const COUPONS = [
  ['$89', 'Fall Furnace Safety Check', 'We do a 21-point check with a carbon monoxide test before the first cold morning.', 'This offer runs through December 31, one per home.', 'Furnace tune-up'],
  ['$50 off', 'Any Repair', 'It works on heating, cooling, or plumbing repairs. Mention this offer when you book.', 'It applies to repairs over $250 and cannot be combined with other offers.', 'Repair'],
  ['Up to $2,000', 'Off a New System', 'You get utility rebates plus a Pinwheel rebate on qualifying heat pumps and high-efficiency systems.', 'It applies to qualifying equipment, and we file the rebate paperwork for you.', 'New system quote'],
  ['Free', 'Second Opinion on Big Repairs', 'Quoted more than $1,000 by someone else? We will check the diagnosis at no charge.', 'Bring the written quote. There is no obligation.', 'Second opinion'],
  ['$79', 'AC or Furnace Tune-Up', 'We clean, test, and adjust one system so it runs efficiently all season, with a written report.', 'One system per coupon. Comfort Club members get two tune-ups a year included.', 'Tune-up'],
  ['$99', 'Water Heater Flush', 'We drain the sediment, check the anode and relief valve, and test the burner or elements.', 'Tank water heaters up to 75 gallons. One per home.', 'Water heater flush'],
];
export const specials = (ph) => ({
  file: 'specials.html', title: 'Specials & Coupons on Heating, AC & Plumbing in Tracy, CA | Pinwheel',
  desc: 'Current Pinwheel specials: $50 off any repair, a $79 tune-up, a $99 water heater flush, up to $2,000 off a new system, and more in Tracy, CA. Sample offers.',
  ogTitle: 'Specials in Tracy, CA', preload: hp(ph('specials-hero')),
  jsonld: [crumbLd('specials.html', crumbs(['Specials']))],
  body: (R) => [
    hero(R, { photo: ph('specials-hero'), crumbs: crumbs(['Specials']), pill: 'Current offers in Tracy, CA', title: '<span class="accent">Specials</span> in Tracy, CA.',
      lead: 'These are our current offers for homeowners in Tracy and the valley. Book online with the offer, or mention it on the phone, and we apply it to your bill.' }),
    sec({ id: 'coupons', cls: 'bg-white', eyebrow: 'Current offers', h2: 'Save on Your <span class="accent">Next Visit.</span>', lead: `Print one, show it on your phone, or just mention it. ${tag('Sample offers')}`,
      inner: `<div class="pw-coupons">${COUPONS.map(([amt, t, d, terms, svc]) => `<article class="pw-coupon" data-reveal>
          <p class="pw-coupon-amt">${amt}</p>
          <h3>${t}</h3>
          <p>${d}</p>
          <p class="fine">${terms}</p>
          <a class="btn btn-primary" href="${bookHref(R, svc)}">${ic('i-calendar')}Book with this offer</a>
        </article>`).join('\n')}</div>
      <p class="fine pw-prices-foot">These are sample offers for a concept site. A real site lists the real terms here.</p>` }),
    sec({ id: 'how', eyebrow: 'How it works', h2: 'Using an Offer <span class="accent">Is Easy.</span>',
      inner: steps([['Pick an offer', 'Choose the one that fits what you need. You can use one offer per visit.'], ['Book or call', 'Book online with the offer, or mention it when you call.'], ['We apply it', 'Your tech takes it off the written price before any work starts.']]) }),
    club(R), bookCall(R), areasStrip(R),
  ].join('\n\n'),
});

/* ---------- Instant Estimate ---------- */
const EST_FAQ = [['How accurate is this estimate?', 'It shows the range most Tracy-area homes fall into. Your exact price depends on your ducts, electrical panel, and where the equipment goes, and we confirm it in writing on a free visit.'], ['What is included in the price?', 'Equipment, installation, permits, haul-away of the old system, and a 10-year parts warranty on most systems.'], ['Should I repair instead?', 'Systems under 10 years old can often be repaired. Our <a href="cooling.html#repair-or-replace">repair-or-replace helper</a> and our guide, <a href="resources/ac-repair-or-replace.html">Repair or Replace? 6 Signs Your AC Is Done</a>, help you decide.']];
export const estimate = (ph) => ({
  file: 'instant-estimate.html', title: 'Instant Estimate: New AC or Furnace Cost in Tracy, CA | Pinwheel',
  desc: 'Answer 3 quick questions and see a price range for a new AC, furnace, or heat pump in Tracy, CA. No email or phone number needed. Sample pricing.',
  ogTitle: 'Instant Estimate in Tracy, CA', preload: hp(ph('estimate-hero')),
  jsonld: [faqLd(EST_FAQ), crumbLd('instant-estimate.html', crumbs(['Instant Estimate']))],
  body: (R) => [
    hero(R, { photo: ph('estimate-hero'), crumbs: crumbs(['Instant Estimate']), pill: 'New system pricing in Tracy, CA', title: '<span class="accent">Instant Estimate</span> for Tracy, CA.',
      lead: 'Answer 3 quick questions and see a real price range for a new AC, furnace, or heat pump in seconds. We will not ask for your email or phone number.',
      ctas: `<a class="btn btn-primary btn-lg" href="#estimate">${ic('i-calculator')}Start my estimate</a>${callBtn('btn btn-glass btn-lg')}` }),
    block('estimator.html').replace('href="#book" data-book data-service="New system quote"', `href="${bookHref(R, 'New system quote')}"`).replace(/<h2 id="estimate-title">What Will a New System Cost\?<\/h2>/, '<h2 id="estimate-title">What Will a New System <span class="accent">Cost?</span></h2>'),
    sec({ id: 'factors', cls: 'bg-white', eyebrow: 'What changes the price', h2: 'Why Two Homes Get <span class="accent">Different Prices.</span>',
      inner: `<ul class="pw-mini">
        <li data-reveal>${ic('i-home')}<span><strong>Size and layout</strong>Bigger homes and two-story homes need more capacity, and sometimes a second system or zoning.</span></li>
        <li data-reveal>${ic('i-wind')}<span><strong>Your ducts</strong>Leaky or undersized ducts may need sealing or a few new runs so a new system can do its job.</span></li>
        <li data-reveal>${ic('i-zap')}<span><strong>Electrical and gas</strong>Some homes need a new breaker, a disconnect, or a gas line upgrade.</span></li>
        <li data-reveal>${ic('i-sparkle')}<span><strong>Efficiency level</strong>Higher-efficiency systems cost more up front, cost less to run, and often qualify for bigger rebates.</span></li>
      </ul>` }),
    sec({ id: 'next', eyebrow: 'Next steps', h2: 'Ready for an <span class="accent">Exact Price?</span>',
      inner: linkCards(R, [
        { href: 'book.html?service=New+system+quote', icon: 'i-calendar', title: 'Book a free in-home quote', text: 'We measure your home and give you options in writing, with no pressure.' },
        { href: 'financing.html', icon: 'i-dollar', bubble: 'navy', title: 'See monthly payments', text: 'Spread the cost of a new system into monthly payments.' },
        { href: 'specials.html', icon: 'i-tag', bubble: 'cool', title: 'Check current specials', text: 'Up to $2,000 off qualifying new systems with rebates.' },
      ]) }),
    faqSection(R, EST_FAQ, { h2: 'Estimate <span class="accent">Questions.</span>', cls: 'bg-white', prefix: 'est' }),
    bookCall(R, 'New system quote'), areasStrip(R),
  ].join('\n\n'),
});

/* ---------- Book Online ---------- */
const SVC_CHOICES = ['AC repair', 'Heating repair', 'Heat pump', 'Plumbing repair', 'Water heater', 'Drain cleaning', 'Leak repair', 'Air quality check', 'Tune-up', 'New system quote', 'Something else'];
export const book = (ph) => ({
  file: 'book.html', title: 'Book Online | Heating, AC & Plumbing in Tracy, CA | Pinwheel',
  desc: 'Book a Pinwheel visit online in about a minute. Pick a service, a day, and a 3-hour arrival window. Tracy, CA and nearby cities. Sample site.',
  ogTitle: 'Book Online in Tracy, CA', preload: hp(ph('book-hero')),
  jsonld: [crumbLd('book.html', crumbs(['Book Online']))],
  body: (R) => [
    hero(R, { photo: ph('book-hero'), crumbs: crumbs(['Book Online']), pill: 'Book a visit in Tracy, CA', title: '<span class="accent">Book Online</span> in Tracy, CA.', cls: 'pw-phero-short',
      lead: 'Pick a service, a day, and a 3-hour arrival window. A real person confirms your visit by text, usually within minutes.',
      ctas: `<a class="btn btn-primary btn-lg" href="#book-form">${ic('i-calendar')}Start booking</a>${callBtn('btn btn-glass btn-lg')}` }),
    sec({ id: 'book-form', cls: 'bg-white', eyebrow: 'Book a visit', h2: 'Pick a Time That <span class="accent">Works for You.</span>',
      inner: `<div class="pw-form-grid">
        <div class="pw-form-card">
        ${netlifyForm('book', `<fieldset class="q"><legend><span class="q-num" aria-hidden="true">1</span>What Do You Need?</legend><div class="chips-grid">${SVC_CHOICES.map((s, i) => `<label class="chip"><input type="radio" name="service" value="${s}"${i === 0 ? ' required' : ''}><span>${s}</span></label>`).join('')}</div></fieldset>
          <fieldset class="q"><legend><span class="q-num" aria-hidden="true">2</span>Pick a Day and an Arrival Window</legend>
            <div class="field"><label for="bk-day">Day</label><input class="input" id="bk-day" name="day" type="date" required data-min-today></div>
            <div class="chips-grid four">${[['Morning', '8 to 11am'], ['Midday', '11am to 2pm'], ['Afternoon', '2 to 5pm'], ['Evening', '5 to 7pm']].map(([a, b], i) => `<label class="chip"><input type="radio" name="window" value="${a}, ${b}"${i === 0 ? ' required' : ''}><span><strong>${a}</strong> ${b}</span></label>`).join('')}</div>
          </fieldset>
          <fieldset class="q"><legend><span class="q-num" aria-hidden="true">3</span>Where Should We Come?</legend>
            <div class="field-row">${field('bk-name', 'Your name', 'text', 'autocomplete="name" required')}${field('bk-phone', 'Mobile number', 'tel', 'autocomplete="tel" inputmode="tel" required')}</div>
            ${field('bk-address', 'Home address', 'text', 'autocomplete="street-address" required')}
            <div class="field"><label for="bk-notes">Anything we should know? (optional)</label><textarea class="textarea" id="bk-notes" name="notes" rows="3"></textarea></div>
          </fieldset>`, '<h3>You Are on the Schedule.</h3><p>Thanks. We will text you within a few minutes to confirm your arrival window and your tech\'s name.</p><p class="fine">Sample site: this request goes to the site\'s form inbox, and no real visit is booked.</p>', 'Book my visit')}
        </div>
        <aside class="pw-side-card">
          <h3>What Happens Next</h3>
          <ol class="pw-ol"><li>We text you to confirm the window, usually within minutes.</li><li>The morning of, we text you the tech's name and photo.</li><li>We text again when the tech is on the way.</li></ol>
          <p>Need someone today? Call ${PHONE}. For a burst pipe or no heat, use the <a href="${R}emergency.html">24/7 emergency line</a>.</p>
          <a class="btn btn-secondary btn-block" href="${TEL}">${ic('i-phone')}Call ${PHONE}</a>
        </aside>
      </div>` }),
    areasStrip(R),
  ].join('\n\n'),
});

/* ---------- Reviews ---------- */
export const reviews = (ph) => ({
  file: 'reviews.html', title: 'Customer Reviews | Heating, AC & Plumbing in Tracy, CA | Pinwheel',
  desc: `Read reviews from Tracy-area homeowners about Pinwheel's AC, heating, and plumbing work. ${STATS.rating} stars from ${STATS.count} Google reviews. Illustrative reviews.`,
  ogTitle: 'Reviews from Tracy, CA Homeowners', preload: hp(ph('reviews-hero')),
  jsonld: [crumbLd('reviews.html', crumbs(['About', 'about.html'], ['Reviews']))],
  body: (R) => [
    hero(R, { photo: ph('reviews-hero'), crumbs: crumbs(['About', 'about.html'], ['Reviews']), pill: 'Reviews from Tracy, CA', title: '<span class="accent">Reviews</span> from Tracy, CA.',
      lead: `Here is what homeowners across Tracy and the valley say about our work. We have ${STATS.rating} stars from ${STATS.count} Google reviews.`,
      ctas: `<a class="btn btn-primary btn-lg" href="${R}book.html">${ic('i-calendar')}Book online</a><a class="btn btn-glass btn-lg" href="${R}review.html">${ic('i-star')}Write a review</a>` }),
    `  <section class="section bg-white" id="all-reviews" aria-labelledby="all-reviews-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Reviews</p>
        <h2 id="all-reviews-title">Neighbors Say It Better <span class="accent">Than We Can.</span></h2>
        <p class="rating-line"><svg class="g-mark" role="img" aria-label="Google"><use href="#g-logo"/></svg>${STATS.rating} stars from ${STATS.count} Google reviews ${tag('Illustrative reviews')}</p>
      </div>
      <div class="pw-filter" role="group" aria-label="Show reviews for" data-review-filter>
        <button class="pw-filter-btn" type="button" aria-pressed="true" data-filter="all">All <span>${REVIEWS.length}</span></button>
        <button class="pw-filter-btn" type="button" aria-pressed="false" data-filter="ac">${ic('i-snowflake')}AC <span>${REVIEWS.filter((r) => r.group === 'ac').length}</span></button>
        <button class="pw-filter-btn" type="button" aria-pressed="false" data-filter="heating">${ic('i-flame')}Heating <span>${REVIEWS.filter((r) => r.group === 'heating').length}</span></button>
        <button class="pw-filter-btn" type="button" aria-pressed="false" data-filter="plumbing">${ic('i-droplet')}Plumbing <span>${REVIEWS.filter((r) => r.group === 'plumbing').length}</span></button>
      </div>
      <p class="visually-hidden" aria-live="polite" data-filter-status></p>
      <ul class="pw-reviews pw-reviews-all" data-review-list>
        ${REVIEWS.map(reviewCard).join('\n        ')}
      </ul>
      <p class="pw-more"><a class="btn btn-secondary" href="${R}review.html">${ic('i-star')}Write a review</a></p>
    </div>
  </section>`,
    bookCall(R), areasStrip(R),
  ].join('\n\n'),
});

/* ---------- About ---------- */
export const about = (ph) => ({
  file: 'about.html', title: 'About Pinwheel | Family-Owned Heating, AC & Plumbing in Tracy, CA',
  desc: 'Meet Luis and Carmen Ortega and the Pinwheel team. Family owned in Tracy since 2010, with 14 trained techs, upfront pricing, and four promises. Sample site.',
  ogTitle: 'About Pinwheel in Tracy, CA', preload: hp(ph('about-team')),
  jsonld: [crumbLd('about.html', crumbs(['About']))],
  body: (R) => [
    hero(R, { photo: ph('about-team'), crumbs: crumbs(['About']), pill: 'Family owned in Tracy since 2010', title: '<span class="accent">About Us</span> in Tracy, CA.',
      lead: 'Luis\'s dad started Pinwheel in 2010 with one van, one phone, and a simple idea: treat every home like it belongs to family. Today Luis and Carmen Ortega run it the same way.' }),
    `  <section class="section bg-white" id="owner" aria-labelledby="owner-title">
    <div class="container">
      <div class="split pw-split pw-owner">
        <figure class="photo owner-figure"><img data-photo="pw-owner" data-crop="4:5" data-widths="400,640,900" sizes="(min-width: 900px) 440px, 92vw" alt=""><figcaption><strong>Luis Ortega</strong>Owner and master tech</figcaption></figure>
        <div>
          <p class="eyebrow">Meet the owner</p>
          <h2 id="owner-title">A Price First, Then <span class="accent">the Work.</span></h2>
          <p class="lead">My dad started Pinwheel in 2010 with one van and his name on the side. I grew up riding along on his calls, and I learned early that people remember how you treat them more than what you fixed.</p>
          <p>He started it because too many neighbors were hearing the price after the work instead of before it. He wanted a company where the price comes first, the tech shows up when he said he would, and the owner's cell number is on the side of the van. Carmen and I took over the day-to-day a few years ago, and we have kept every one of those rules.</p>
          <p>Back then, Dad wrote four promises on a whiteboard in our garage. We still read them at every Monday meeting. We are bigger now, with 14 trained techs and 12 cities across two counties, but the whiteboard has not changed.</p>
          <p>If something isn't right, text me at ${PHONE}. I read every message.</p>
          <p class="fine">Names and photos are illustrative.</p>
        </div>
      </div>
    </div>
  </section>`,
    sec({ id: 'name', inner: split({ photo: ph('about-street'), id: 'name-title', reverse: true, eyebrow: 'Why "Pinwheel"?', h2: 'Named for the Street <span class="accent">Luis Grew Up On.</span>',
      lead: 'Every summer on the Tracy street where Luis grew up, kids stuck paper pinwheels in the front lawns, and they spun all evening in the Delta breeze. When his dad needed a name for the company in 2010, that was the picture in his head.',
      paras: ['A pinwheel is moving air, and moving air is our whole job. Two warm blades stand for heating and two cool blades for cooling, and they all turn around one steady center. That center is the promise we make to every family we work for.'] }) }),
    sec({ id: 'how', cls: 'bg-white', eyebrow: 'How we work', h2: 'Our Four <span class="accent">Promises.</span>',
      lead: 'These are the promises on the whiteboard. Every tech learns them on day one.',
      inner: steps([['We show up on time', 'We give you a real 3-hour arrival window and text you when we are on the way.'], ['We give the price first', 'You approve the full price in writing before we pick up a tool.'], ['We clean up', 'We put drop cloths down, wipe every surface, and take the mess with us.'], ['We make it right', 'If you are not happy with the work, we come back and fix it.']]) }),
    sec({ id: 'team', eyebrow: 'Our team', h2: 'The People Who <span class="accent">Show Up.</span>', lead: `Every tech is background-checked, drug-tested, and trained every month. ${tag('Illustrative names')}`,
      inner: `<div class="pw-team">
        <figure class="pw-team-photo" data-reveal><img data-photo="tech-ray" data-crop="4:3" data-widths="480,720,960" sizes="(min-width: 900px) 520px, 92vw" alt=""><figcaption><strong>Ray</strong>Install lead, 22 years with tools in hand</figcaption></figure>
        <ul class="pw-people">
          ${[['Luis', 'Owner and master tech, on the trucks since he was a kid'], ['Carmen', 'Co-owner, runs the office'], ['Marcus', 'Lead HVAC tech, 12 years'], ['Andre', 'Plumbing lead, 15 years'], ['Jess', 'Service tech, 5 years'], ['Diego', 'Service tech, 7 years'], ['Tanya', 'Dispatch, the voice on the phone'], ['+7', 'And seven more techs and installers']].map(([n, r], i) => `<li data-reveal><span class="avatar" style="--h:${(i * 47) % 360}" aria-hidden="true">${n.startsWith('+') ? n : n[0]}</span><span><strong>${n.startsWith('+') ? 'And seven more' : n}</strong>${n.startsWith('+') ? 'Techs, installers, and our dispatch team' : r}</span></li>`).join('\n          ')}
        </ul>
      </div>` }),
    `  <section class="section bg-white" id="van" aria-labelledby="van-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">The van</p>
        <h2 id="van-title">Look for the Orange <span class="accent">Stripe.</span></h2>
        <p class="lead">Every Pinwheel van is white with an orange stripe and our number on the side. Each one carries the parts we use most, so most repairs get done in one visit.</p>
      </div>
      <div class="split pw-split pw-van-split">
        <div class="photo"><img data-photo="${ph('about-van')}" data-crop="4:3" data-widths="480,720,960,1200" sizes="(min-width: 900px) 560px, 92vw" alt=""></div>
        <ul class="pw-check">${['Capacitors, contactors, and fan motors for summer AC calls', 'Igniters, flame sensors, and filters for winter heating calls', 'Common water heater parts, valves, and fittings', 'Drop cloths, shoe covers, and a shop vacuum for cleanup'].map((t) => `<li data-reveal>${ic('i-check-circle')}<span>${t}</span></li>`).join('')}</ul>
      </div>
      <!-- partial:van -->
<!-- /partial:van -->
    </div>
  </section>`,
    sec({ id: 'licensed', eyebrow: 'Licensed and insured', h2: 'The Paperwork, <span class="accent">Handled.</span>', lead: 'We carry the licenses and insurance you would expect from a company you let into your home.',
      inner: checklist(["We're a licensed California contractor.", "We're bonded and carry general liability coverage.", 'Every employee is covered by workers\' comp.', 'Each winter we do one free furnace repair for a neighbor in need.']) }),
    sec({ id: 'more-links', cls: 'bg-white', eyebrow: 'Good to know', h2: 'Questions Before You <span class="accent">Call?</span>',
      inner: linkCards(R, [
        { href: 'faq.html', icon: 'i-info', bubble: 'navy', title: 'FAQ', text: 'Straight answers on cooling, heating, plumbing, and pricing.' },
        { href: 'financing.html', icon: 'i-dollar', title: 'Financing', text: 'Monthly payments on new systems and bigger repairs.' },
        { href: 'reviews.html', icon: 'i-star', bubble: 'cool', title: 'Reviews', text: 'What Tracy-area homeowners say about our work.' },
      ]) }),
    bookCall(R), areasStrip(R),
  ].join('\n\n'),
});

/* ---------- FAQ ---------- */
const FAQ_GROUPS = [
  ['Cooling', 'cooling', [['How fast can you fix my AC?', 'Most homes in Tracy, Mountain House, Lathrop, and Manteca get a same-day visit, and most repairs are done in one visit because the common parts are on the van.'], ['How often should my AC be serviced?', 'Once a year, in spring, before the first heat wave. Valley dust and pollen clog coils fast.'], ['Should I repair or replace my AC?', 'Under 10 years old, a repair usually wins. Past 15 years, or when a repair costs more than a third of a new system, replacing often saves money. Read <a href="resources/ac-repair-or-replace.html">Repair or Replace? 6 Signs Your AC Is Done</a>.'], ['Why is my upstairs so much hotter?', 'Heat rises, and many two-story homes run both floors off one system. Duct balancing, zoning, or a small ductless unit usually fixes it.']]],
  ['Heating', 'heating', [['Why does my furnace keep shutting off?', 'Usually a dirty filter, a clogged flame sensor, or an overheating heat exchanger. The first two are quick fixes. The third is a safety issue, so call the same day.'], ['Is a heat pump a good idea in Tracy?', 'Yes. Our winters are mild, which is exactly where heat pumps work best, and most homes qualify for rebates.'], ['How often should a furnace be serviced?', 'Once a year, in the fall. A tune-up catches cracked heat exchangers and failing igniters before a cold December morning.']]],
  ['Plumbing', 'plumbing', [['How long does a water heater last here?', 'Eight to twelve years for a tank, and longer for tankless with a yearly flush. Valley water is hard, so flushing matters.'], ['Why is my water heater making noise?', 'Usually sediment at the bottom of the tank. Read <a href="resources/water-heater-noise.html">Why Is My Water Heater Making That Noise?</a> for what each sound means.'], ['How do I know if I have a slab leak?', 'Warm spots on the floor, the sound of running water, and a water bill that jumped are the usual signs. A leak detection visit confirms it.'], ['Can you clear a sewer line without digging?', 'Usually, yes. Most clogs clear with a cable or hydro jetting, and many damaged lines can be lined or replaced through small openings.']]],
  ['Pricing', 'pricing', [['How much is a diagnostic visit?', 'Our diagnostic visit is $79, and we waive it when you go ahead with the repair. <span class="tag">Illustrative</span>'], ['Do you give the price before the work?', 'Yes. You approve the full price in writing before we pick up a tool. You will not get any hourly surprises.'], ['Do you charge more at night or on weekends?', 'Evenings and Sundays carry an after-hours fee, and we tell you the amount before anyone drives over. Comfort Club members never pay it.'], ['Do you offer financing?', 'Yes. New systems and bigger repairs can be spread into monthly payments. See the <a href="financing.html">financing page</a>.']]],
];
export const faq = (ph) => ({
  file: 'faq.html', title: 'FAQ | Heating, AC & Plumbing Questions in Tracy, CA | Pinwheel',
  desc: 'Answers to common questions about AC repair, furnaces, heat pumps, water heaters, drains, leaks, and pricing for Tracy-area homes. Sample site.',
  ogTitle: 'Heating, AC & Plumbing FAQ for Tracy, CA', preload: hp(ph('faq-hero')),
  jsonld: [faqLd(FAQ_GROUPS.flatMap((g) => g[2])), crumbLd('faq.html', crumbs(['About', 'about.html'], ['FAQ']))],
  body: (R) => [
    hero(R, { photo: ph('faq-hero'), crumbs: crumbs(['About', 'about.html'], ['FAQ']), pill: 'Straight answers in Tracy, CA', title: '<span class="accent">Questions</span> from Tracy, CA.',
      lead: 'These are the questions we hear most on the phone. If yours is not here, call or text us and a real person will answer it.' }),
    `  <section class="section bg-white" id="faq-all" aria-labelledby="faq-all-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">FAQ</p>
        <h2 id="faq-all-title">Answers by <span class="accent">Topic.</span></h2>
        <nav class="pw-jump" aria-label="FAQ topics"><ul>${FAQ_GROUPS.map(([n, id]) => `<li><a href="#${id}">${n}</a></li>`).join('')}</ul></nav>
      </div>
      ${FAQ_GROUPS.map(([n, id, items]) => `<div class="pw-faq-group" id="${id}">
        <h3 class="pw-faq-title">${n}</h3>
        ${faqList(items, 'faq-' + id)}
      </div>`).join('\n      ')}
    </div>
  </section>`,
    club(R), bookCall(R), areasStrip(R),
  ].join('\n\n'),
});

/* ---------- Resources and the two articles ---------- */
const ARTICLES = [
  { file: 'resources/ac-repair-or-replace.html', title: 'Repair or Replace? 6 Signs Your AC Is Done', h1: '<span class="accent">Repair or Replace?</span> 6 Signs Your AC Is Done', crumb: 'Repair or Replace?', icon: 'i-snowflake', bubble: 'cool', photo: 'article-ac-hero', read: '6 min read', date: '2026-10-14',
    blurb: 'Age, repair costs, refrigerant, comfort, bills, and noise: the six signs we look for before we recommend a new system.' },
  { file: 'resources/water-heater-noise.html', title: 'Why Is My Water Heater Making That Noise?', h1: 'Why Is My Water Heater Making <span class="accent">That Noise?</span>', crumb: 'Water Heater Noise', icon: 'i-waterheater', bubble: 'navy', photo: 'article-wh-hero', read: '5 min read', date: '2026-09-30',
    blurb: 'Popping, rumbling, ticking, hissing, and screeching: what each sound means and which ones need a call today.' },
];
export const resources = (ph) => ({
  file: 'resources.html', title: 'Homeowner Resources | Heating, AC & Plumbing Guides | Pinwheel, Tracy, CA',
  desc: 'Plain guides for Tracy-area homeowners: when to repair or replace an AC, and what water heater noises mean. Sample site.',
  ogTitle: 'Homeowner Resources from Pinwheel in Tracy, CA', preload: hp(ph('resources-hero')),
  jsonld: [crumbLd('resources.html', crumbs(['About', 'about.html'], ['Resources']))],
  body: (R) => [
    hero(R, { photo: ph('resources-hero'), crumbs: crumbs(['About', 'about.html'], ['Resources']), pill: 'Homeowner guides from Tracy, CA', title: 'Homeowner <span class="accent">Resources</span> for Tracy, CA.',
      lead: 'We wrote these guides the way we would explain things at your kitchen table. No jargon and no sales pitch.', ctas: false }),
    sec({ id: 'articles', cls: 'bg-white', eyebrow: 'Guides', h2: 'Read Before <span class="accent">You Call.</span>',
      inner: `<ul class="pw-articles">${ARTICLES.map((a) => `<li data-reveal><a class="pw-article-card" href="${R}${a.file}"><span class="icon-bubble ${a.bubble}">${ic(a.icon)}</span><span class="pw-article-meta">${a.read}</span><strong>${a.title}</strong><span>${a.blurb}</span><span class="pw-text-link">Read the guide${ic('i-arrow-right')}</span></a></li>`).join('')}</ul>` }),
    sec({ id: 'tools', eyebrow: 'Free tools', h2: 'Quick Answers <span class="accent">in a Minute.</span>',
      inner: linkCards(R, [
        { href: 'instant-estimate.html', icon: 'i-calculator', title: 'Instant Estimate', text: 'See a price range for a new system in seconds.' },
        { href: 'cooling.html#repair-or-replace', icon: 'i-refresh', bubble: 'cool', title: 'Repair-or-Replace Helper', text: 'Answer four questions and get our honest take.' },
        { href: 'faq.html', icon: 'i-info', bubble: 'navy', title: 'FAQ', text: 'Answers on cooling, heating, plumbing, and pricing.' },
      ]) }),
    bookCall(R), areasStrip(R),
  ].join('\n\n'),
});

const ARTICLE_BODY = {
  'resources/ac-repair-or-replace.html': `<p class="lead">Nobody wants to buy a new AC. It is a big check, and it usually comes up in July when you are hot and tired. Here are the six signs we look at before we ever recommend a new system, so you can make the call with a clear head.</p>
        <h2>1. It Is More Than 15 Years Old</h2>
        <p>Most central ACs in the valley last 12 to 17 years. Our summers are long and hot, and the dust off the Altamont wears outdoor coils down faster than the brochures say. Past 15 years, parts get harder to find and efficiency has dropped a lot from where it started.</p>
        <p>Age alone is not a reason to replace a system that still runs well. But if your AC is past 15 and something major fails, a repair is usually money you will not get back.</p>
        <h2>2. The Repair Costs More Than a Third of a New System</h2>
        <p>This is the rule of thumb we use at the kitchen table. If a repair costs more than about a third of a new system, and the system is past 10 years old, replacing it usually saves money over the next few years. A $300 capacitor on a 9-year-old AC is a repair. A $3,000 compressor on a 16-year-old AC usually is not.</p>
        <h2>3. It Still Uses R-22 Refrigerant</h2>
        <p>Systems installed before about 2010 often run on R-22, which is no longer made. What is left is expensive, so a leak on one of these systems can turn a small repair into a big one. Look at the label on the outdoor unit. If it says R-22, it is time to start planning, even if it runs fine today.</p>
        <h2>4. Some Rooms Never Get Comfortable</h2>
        <p>If the upstairs is always 6 to 8 degrees warmer, or one bedroom never cools down, the problem might be the ducts, not the AC. We check the ducts first. But when an older system is also the wrong size for the house, a new, properly sized system with sealed ducts can fix comfort problems a repair never will.</p>
        <h2>5. Your Bills Keep Climbing</h2>
        <p>An aging AC slowly loses efficiency. If your summer bills go up every year while your habits stay the same, the system is working harder to do the same job. A new high-efficiency system or a heat pump often costs much less to run, and some of the savings can cover a monthly payment.</p>
        <h2>6. It Is Loud, Leaky, or Always Running</h2>
        <p>Grinding, banging, constant short cycling, ice on the lines, or water around the indoor unit are all signs of wear. Any one of them can be a simple repair. Two or three at once on an older system usually means the end is near.</p>
        <h2>What We Recommend</h2>
        <p>Under 10 years old, repair it. Between 10 and 15, it depends on the repair cost and how the system has been running. Past 15, or with R-22, start planning a replacement and get a written quote before it fails in a heat wave.</p>
        <p>Not sure where yours falls? Try our <a href="../cooling.html#repair-or-replace">repair-or-replace helper</a>, see a price range with the <a href="../instant-estimate.html">instant estimate</a>, or <a href="../book.html?service=New+system+quote">book a free visit</a> and we will tell you honestly what we would do if it were our house.</p>`,
  'resources/water-heater-noise.html': `<p class="lead">Water heaters are supposed to be quiet. When yours starts popping, rumbling, or hissing, it is trying to tell you something. Most of these sounds are easy to fix, and a few mean you should call today. Here is what each one usually means.</p>
        <h2>Popping or Rumbling</h2>
        <p>This is the sound we hear about most, and it is almost always sediment. Valley water is hard, so minerals settle at the bottom of the tank. Water gets trapped under that layer, heats up, and bubbles through it with a pop. It is a lot like a pot of oatmeal on the stove.</p>
        <p>A flush clears most of the sediment and quiets the tank. If the tank has never been flushed and it is past 8 years old, the sediment may be too hard to flush, and the noise is a sign the tank is wearing out.</p>
        <h2>Ticking or Tapping</h2>
        <p>Ticking is usually harmless. Pipes expand and contract as hot water moves through them, and the heat trap fittings on top of the tank can tick as they open and close. If the ticking bothers you, we can swap the fittings or add pipe clamps.</p>
        <h2>Hissing or Sizzling</h2>
        <p>On a gas heater, hissing often means water is dripping onto the burner. That can come from condensation, which is normal on a cold morning, or from a leak in the tank, which is not. On an electric heater, sizzling can mean sediment is building up around a heating element.</p>
        <p>Look around the base of the tank. If you see water, turn off the cold water valve on top and call us.</p>
        <h2>Screeching or Whistling</h2>
        <p>A high-pitched screech usually comes from a valve that is partly closed, often the cold water inlet or the temperature and pressure relief valve. Make sure the inlet valve is fully open. If the relief valve is whistling or dripping, that is a safety device doing its job, and it needs a look the same day.</p>
        <h2>Banging When a Faucet Shuts Off</h2>
        <p>A loud bang when you close a faucet or the washer finishes is called water hammer. It is not the water heater itself, but it can loosen fittings over time. A water hammer arrestor or an expansion tank usually fixes it.</p>
        <h2>When to Call Right Away</h2>
        <ul class="pw-ul"><li>Water pooling around the tank</li><li>The relief valve is spraying or dripping</li><li>You smell gas near the heater</li><li>Loud popping along with rusty water</li></ul>
        <p>For a gas smell, leave the house first and call the gas company from outside. For the rest, see our <a href="../emergency.html">emergency steps</a> or call us.</p>
        <h2>What We Recommend</h2>
        <p>Flush your tank once a year. It is the easiest way to quiet the noise and add years of life. Our <a href="../specials.html">water heater flush special</a> covers it, and if your heater is past its prime, our <a href="../water-heaters.html">water heater page</a> explains your options.</p>`,
};
export const articles = (ph) => ARTICLES.map((a) => ({
  file: a.file, title: `${a.title} | Pinwheel, Tracy, CA`, desc: a.blurb + ' A guide for Tracy-area homeowners. Sample site.',
  ogTitle: a.title, preload: hp(ph(a.photo)),
  jsonld: [{ '@type': 'Article', headline: a.title, datePublished: a.date, author: { '@type': 'Organization', name: 'Pinwheel Heating, Air & Plumbing' }, mainEntityOfPage: SITE + a.file },
    crumbLd(a.file, crumbs(['Resources', 'resources.html'], [a.crumb]))],
  body: (R) => [
    hero(R, { photo: ph(a.photo), crumbs: crumbs(['Resources', 'resources.html'], [a.crumb]), pill: 'A guide for homeowners in Tracy, CA', title: a.h1,
      lead: a.blurb, ctas: false, cls: 'pw-phero-short', after: `<p class="pw-byline">By the Pinwheel team · ${a.read}</p>` }),
    `  <section class="section bg-white" aria-label="Article">
    <div class="container pw-article-wrap">
      <article class="pw-article">
        ${ARTICLE_BODY[a.file]}
      </article>
      <aside class="pw-side-card pw-article-side">
        <h3>Want a Second Opinion?</h3>
        <p>We will look at your system and tell you honestly what we would do if it were our own house.</p>
        <a class="btn btn-primary btn-block" href="${R}book.html">${ic('i-calendar')}Book online</a>
        <a class="btn btn-secondary btn-block" href="${TEL}">${ic('i-phone')}Call ${PHONE}</a>
      </aside>
    </div>
  </section>`,
    bookCall(R), areasStrip(R),
  ].join('\n\n'),
}));

/* ---------- Contact ---------- */
export const contact = (ph) => ({
  file: 'contact.html', title: 'Contact Pinwheel | Heating, AC & Plumbing in Tracy, CA',
  desc: 'Call or text (209) 555-0142, book online, or visit our Tracy shop. A real person answers 7am to 7pm, and the emergency line is open 24/7. Sample site.',
  ogTitle: 'Contact Pinwheel in Tracy, CA', preload: hp(ph('tech-door')),
  jsonld: [crumbLd('contact.html', crumbs(['Contact']))],
  body: (R) => [
    hero(R, { photo: ph('tech-door'), crumbs: crumbs(['Contact']), pill: 'Two locations, one number', title: '<span class="accent">Contact Us</span> in Tracy, CA.',
      lead: 'A real person answers 7am to 7pm. After hours, the emergency line picks up. We have two locations and cover 12 cities, all with one phone number.' }),
    `  <section class="section bg-white" id="ways" aria-labelledby="ways-title">
    <div class="container service-layout">
      <div class="service-main">
        <div class="section-head">
          <p class="eyebrow">Get in touch</p>
          <h2 id="ways-title">Pick the Way That's <span class="accent">Easiest.</span></h2>
        </div>
        <ul class="contact-ways pw-ways">
          <li data-reveal><span class="icon-bubble">${ic('i-phone')}</span><span><strong><a href="${TEL}">Call ${PHONE}</a></strong>A real person answers 7am to 7pm, Monday to Saturday, and the emergency line is open 24/7.</span></li>
          <li data-reveal><span class="icon-bubble cool">${ic('i-message')}</span><span><strong><a href="${SMS}">Text the same number</a></strong>Send a photo of the problem and we will text back a window.</span></li>
          <li data-reveal><span class="icon-bubble navy">${ic('i-calendar')}</span><span><strong><a href="${R}book.html">Book online</a></strong>Pick a day and a 3-hour window in about a minute.</span></li>
          <li data-reveal><span class="icon-bubble">${ic('i-send')}</span><span><strong>Email</strong>hello@pinwheel-example.com ${tag('Sample address')}</span></li>
        </ul>
        ${split({ photo: ph('contact-2'), id: 'dispatch-title', eyebrow: 'Dispatch', h2: 'The Voice on <span class="accent">the Phone.</span>', lead: 'Tanya and our dispatch team answer every call from our Tracy shop. They know the techs, the neighborhoods, and the schedule.', paras: ['If you call during a busy summer afternoon, you still get a person, not a menu. They can usually give you an arrival window before you hang up.'] })}
      </div>
      <aside class="service-side">
        <div class="side-card">
          <h2 id="side-title">Not Urgent? <span class="accent">Send a Note.</span></h2>
          <p>Tell us what is going on and we will text you back during business hours.</p>
          ${netlifyForm('contact', `${field('sf-name', 'Your name', 'text', 'autocomplete="name" required')}
            ${field('sf-phone', 'Mobile number', 'tel', 'autocomplete="tel" inputmode="tel" required')}
            ${field('sf-address', 'Home address', 'text', 'autocomplete="street-address" required')}
            <div class="field"><label for="sf-help">How can we help?</label><textarea class="textarea" id="sf-help" name="help" rows="3" required></textarea></div>`,
            '<h3>Got It. Thanks.</h3><p>We will text you back during business hours, usually the same day.</p><p class="fine">Sample site: this went to the site form inbox, not to a real company.</p>',
            'Send request', { cls: 'side-form', label: 'side-title', error: 'Add your name, number, address, and a few words about the problem.' })}
        </div>
      </aside>
    </div>
  </section>`,
    sec({ id: 'locations', eyebrow: 'Locations', h2: 'Two Shops, <span class="accent">One Number.</span>', lead: `Vans roll out of both locations every morning, so most of the valley gets a same-day visit. ${tag('Sample addresses')}`,
      inner: `<div class="pw-locs">
        <article class="pw-loc" data-reveal><h3>Tracy Shop</h3><p class="location">Tracy, CA 95376</p><p class="hours"><strong>Mon to Sat</strong> 7am to 7pm<br><strong>Sunday</strong> Emergency calls only</p><p>This is where you will find our parts counter, a showroom with heat pumps and water heaters on display, and the dispatch desk.</p></article>
        <article class="pw-loc" data-reveal><h3>Manteca Yard</h3><p class="location">Manteca, CA 95336</p><p class="hours"><strong>Mon to Fri</strong> 7am to 5pm<br>This yard is for our vans, so we can't take walk-ins.</p><p>This yard covers Manteca, Lathrop, French Camp, Stockton, Lodi, Ripon, and Escalon.</p></article>
      </div>` }),
    areasStrip(R),
  ].join('\n\n'),
});

/* ---------- Credits, Privacy, 404 ---------- */
export const credits = (ph) => ({
  file: 'credits.html', title: 'Photo Credits | Pinwheel Heating, Air & Plumbing, Tracy, CA',
  desc: 'Photo, video, type, and code credits for the Pinwheel Heating, Air & Plumbing concept site. Sample site.',
  ogTitle: 'Photo Credits | Pinwheel', preload: hp(ph('credits-hero')),
  body: (R) => [
    hero(R, { photo: ph('credits-hero'), crumbs: crumbs(['Credits']), pill: 'Thanks to these photographers', title: 'Photo <span class="accent">Credits</span> and Thanks.', cls: 'pw-phero-short', ctas: false,
      lead: 'Every person on this site is real photography, free for commercial use under the Unsplash and Pexels licenses. No AI-generated people. Thank you to these photographers.' }),
    `  <section class="section bg-white" aria-labelledby="photos-title">
    <div class="container">
      <h2 id="photos-title" class="h3 credits-h">Photography</h2>
    <!-- credits -->
    <!-- /credits -->
      ${block('credits-rest.html')}
  <section class="section-tight" aria-labelledby="concept-title">
    <div class="container">
      <div class="callout">
        <div>
          <h2 id="concept-title">About This Concept</h2>
          <p>Pinwheel Heating, Air &amp; Plumbing is a fictional business. The reviews, names, numbers, prices, and address are sample data. Concept by Ben Young Web Design.</p>
        </div>
      </div>
    </div>
  </section>`,
  ].join('\n\n'),
});

export const privacy = (ph) => ({
  file: 'privacy.html', title: 'Privacy Policy | Pinwheel Heating, Air & Plumbing, Tracy, CA',
  desc: 'How the Pinwheel Heating, Air & Plumbing sample site handles the information you send through its forms. Sample site.',
  ogTitle: 'Privacy Policy | Pinwheel', preload: hp(ph('privacy-hero')),
  body: (R) => [
    hero(R, { photo: ph('privacy-hero'), crumbs: crumbs(['Privacy']), pill: 'Your information stays yours', title: '<span class="accent">Privacy</span> Policy.', cls: 'pw-phero-short', ctas: false,
      lead: 'This page explains what we collect when you use this site and what we do with it. The short version: very little, and we never sell it.' }),
    `  <section class="section bg-white" aria-label="Privacy policy">
    <div class="container pw-article-wrap">
      <article class="pw-article">
        <p class="fine">Last updated November 2026. Pinwheel Heating, Air &amp; Plumbing is a fictional business, and this is a sample policy for a concept site.</p>
        <h2>What We Collect</h2>
        <p>When you book online, join the Comfort Club, or send us a note, we collect what you type into the form: your name, phone number, address, and any details about the problem. We use it only to schedule and do the work you asked for.</p>
        <h2>How Forms Are Handled</h2>
        <p>On this sample site, forms are received by our website host's form service. On a real site, they would go straight to the office and the owner's phone. We do not add you to a mailing list unless you ask.</p>
        <h2>Cookies and Tracking</h2>
        <p>This site does not use advertising cookies or third-party trackers. Your browser may remember small settings, like whether you closed the chat helper.</p>
        <h2>Who We Share It With</h2>
        <p>We never sell your information. We only share it with the people who need it to help you, like the tech assigned to your visit, or a lender if you choose to apply for financing on the visit.</p>
        <h2>Your Choices</h2>
        <p>You can ask us to see, correct, or delete your information at any time. Call or text ${PHONE}, and we will take care of it within a few days.</p>
        <h2>Questions</h2>
        <p>If anything here is unclear, call us at ${PHONE}. A real person will answer.</p>
      </article>
    </div>
  </section>`,
  ].join('\n\n'),
});

export const notFound = (ph) => ({
  file: '404.html', title: 'Page Not Found | Pinwheel Heating, Air & Plumbing, Tracy, CA',
  desc: 'This page took a wrong turn. Head back home or book a visit online. Sample site.',
  ogTitle: 'Page Not Found | Pinwheel', preload: hp(ph('notfound-hero')),
  body: (R) => [
    hero(R, { photo: ph('notfound-hero'), pill: 'Error 404', title: 'This Page Took a <span class="accent">Wrong Turn.</span>',
      lead: 'The page you were looking for has moved or never existed. Let us get you back on the right road.',
      ctas: `<a class="btn btn-primary btn-lg" href="${R}index.html">${ic('i-home')}Back to home</a><a class="btn btn-glass btn-lg" href="${R}book.html">${ic('i-calendar')}Book online</a>` }),
    sec({ id: 'popular', cls: 'bg-white', eyebrow: 'Popular pages', h2: 'Maybe You Were <span class="accent">Looking for These.</span>',
      inner: linkCards(R, [
        { href: 'services.html', icon: 'i-wrench', title: 'All services', text: 'Cooling, heating, plumbing, and indoor air quality.' },
        { href: 'emergency.html', icon: 'i-zap', bubble: 'navy', title: '24/7 Emergency', text: 'A real person answers day and night.' },
        { href: 'specials.html', icon: 'i-tag', bubble: 'cool', title: 'Specials', text: 'Current offers on repairs, tune-ups, and new systems.' },
        { href: 'contact.html', icon: 'i-phone', title: 'Contact', text: 'Call, text, or visit our Tracy shop.' },
      ]) }),
  ].join('\n\n'),
});
