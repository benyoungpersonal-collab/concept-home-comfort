#!/usr/bin/env node
/*
  Finishing pass for the R&A Plumbing Heating & Air preview. Run after the main build:

      node scripts/build-preview.mjs prospects/ra-plumbing-heating-air.json
      node prospects/finish/ra-plumbing-heating-air.mjs

  The main build makes the page from the data file with the template defaults (photo-first hero, name beside the
  mark, trust tiles, section order, animations, link preview from the hero photo). This pass adds what only R&A has:
  - Bold van-wrap blue (#0078DE) for the pill, accent words, main buttons and links; #43A8DE on navy
  - No Google listing: the top strip and the reviews heading read "5-star reviews" (no count, no Google mark or link)
  - Ryan's own photos on the plumbing and heating cards and the maintenance plans
  - $99 tune-up callout with a button that opens the quick quote with Tune-ups picked
  - Home Comfort Maintenance Plans section (Essential, Comfort, Premium) right after the services
  - Service areas: map card (3 counties, logo pin on Riverside), then 3 county dropdowns, all closed
  - Footer email and socials
  Every replacement must match exactly once, or the script stops.
*/
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { balanceSections } from '../../scripts/section-backgrounds.mjs';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'previews', 'ra-plumbing-heating-air');
const PHOTOS = join(ROOT, 'prospects', 'photos', 'ra-plumbing-heating-air');
const file = join(OUT, 'index.html');
let html = readFileSync(file, 'utf8');

const fail = (m) => { console.error(`finish: ${m}`); process.exit(1); };
const rep = (a, b, n = 1) => {
  const count = html.split(a).length - 1;
  if (count !== n) fail(`expected ${n} match(es), found ${count}: ${a.slice(0, 90)}`);
  html = html.split(a).join(b);
};
const rx = (re, b, n = 1) => {
  const m = html.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) || [];
  if (m.length !== n) fail(`expected ${n} match(es), found ${m.length}: ${re}`);
  html = html.replace(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'), b);
};

const PHONE = '(951) 992-6216', TEL = 'tel:+19519926216', SMS = 'sms:+19519926216';
const smsBody = (t) => `${SMS}?&amp;body=${encodeURIComponent(t)}`;
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
const WIDE = [[480, 320], [768, 512], [1024, 683], [1536, 1024]];
const srcset = (name, sizes) => sizes.map(([w, h]) => `images/ra/${name}-${w}x${h}.webp ${w}w`).join(', ');

/* ---------- Photos ---------- */
mkdirSync(join(OUT, 'images', 'ra'), { recursive: true });
for (const f of readdirSync(PHOTOS)) copyFileSync(join(PHOTOS, f), join(OUT, 'images', 'ra', f));

/* ---------- Head ---------- */
const desc = 'R&amp;A Plumbing Heating &amp; Air: plumbing, heating, and A/C repairs, installs, and maintenance plans for homes and businesses in Riverside. 24/7 emergency service. Call (951) 992-6216.';
rep('content="R&amp;A Plumbing Heating &amp; Air: plumbing, heating &amp; a/c, and water heaters for homeowners in Riverside. Call (951) 992-6216."', `content="${desc}"`, 2);
const css = `
<style>
.footer-brand .tpl-logo-chip { padding: 0; background: none; border-radius: 10px; overflow: hidden; }
.footer-brand .tpl-logo-chip .logo-img { height: 96px; }
/* Accent on dark bands: the lighter logo blue */
.on-dark { --c-brand-light: #43A8DE; }
.on-dark .accent { color: #43A8DE; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 14' preserveAspectRatio='none'%3E%3Cpath d='M3 10.5C40 4 78 3.5 112 6.5S170 11 197 4.5' fill='none' stroke='%2343A8DE' stroke-width='4' stroke-linecap='round' vector-effect='non-scaling-stroke' opacity='.45'/%3E%3C/svg%3E"); }
.on-dark .eyebrow { color: #43A8DE; }
body .on-dark .accent { color: #43A8DE !important; }
/* Rating spots: "5-star reviews" */
.rating-bar-score .rating-bar-count { font-weight: 600; }
.rating-badge .count { font-weight: 600; }
@media (max-width: 599px) { .stars5.small.tpl-rated { width: calc(70px * var(--stars, 1)); } }
/* Services: the heating photo card spans the top of the right column; water heaters and plans sit side by side */
.tpl-bento-rest > .tile.ra-wide { grid-column: 1 / -1; min-height: 260px; }
.tpl-bento-rest > .tile:last-child:nth-child(odd) { grid-column: auto; }
@media (min-width: 900px) { .tpl-bento-rest { grid-auto-rows: auto; } .tpl-bento-rest > .tile.ra-wide { min-height: 230px; } }
@media (min-width: 1200px) { .tpl-bento-rest { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.tpl-callout { background: #E9F4FA; border-color: rgb(36 147 207 / .3); }
.tpl-callout .icon-bubble { color: var(--c-brand); }
/* Maintenance plans: 3 equal cards, none lifted. Essential silver/white, Comfort blue, Premium navy and gold (his flyer). */
.ra-plans { background: #EEF6FB; }
.ra-plans-head { display: grid; gap: var(--sp-4, 24px); align-items: center; margin-bottom: var(--sp-5, 32px); }
.ra-plans-head .section-head { margin-bottom: 0; }
.ra-plans-photo { margin: 0; border-radius: var(--r-card, 20px); overflow: hidden; box-shadow: var(--shadow-3); aspect-ratio: 16 / 9; background: #b8c8b0; }
.ra-plans-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
@media (min-width: 900px) { .ra-plans-head { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sp-6, 48px); } }
.ra-plan-list { display: grid; gap: 16px; list-style: none; margin: 0; padding: 0; }
@media (min-width: 960px) { .ra-plan-list { grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: stretch; } }
.ra-plan { position: relative; display: flex; flex-direction: column; gap: 14px; padding: 26px 22px 22px; border-radius: var(--r-card, 20px); border: 1px solid transparent; }
.ra-plan h3 { margin: 0; font-size: var(--fs-xl, 1.5rem); }
.ra-plan-price { margin: 0; display: flex; align-items: baseline; gap: 6px; }
.ra-plan-price b { font-family: var(--ff-display); font-size: 2.5rem; line-height: 1; letter-spacing: -.02em; }
.ra-plan-price span { font-weight: 600; }
.ra-plan-tag { margin: 0; font-weight: 600; }
.ra-plan-group { margin: 4px 0 0; font-size: var(--fs-xs, .78rem); font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.ra-plan ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.ra-plan li { display: flex; gap: 8px; align-items: flex-start; line-height: 1.4; }
.ra-plan li .icon { flex: none; width: 18px; height: 18px; margin-top: 2px; stroke: currentColor; }
/* Buttons: same place at the bottom of every card; 18.7px bold counts as large text (3:1) */
.ra-plan .btn { margin-top: auto; align-self: stretch; justify-content: center; font-size: 1.17rem; font-weight: 800; }
.ra-plan .btn, .ra-plan .btn:hover { color: #fff; --btn-fg: #fff; }
/* Essential: white card, thin border, navy text, blue checks, blue button */
.ra-plan--essential { background: #fff; border-color: #CFDCE6; color: var(--c-navy); box-shadow: 0 2px 4px rgb(20 33 61 / .06), 0 12px 24px rgb(20 33 61 / .08); }
.ra-plan--essential h3, .ra-plan--essential .ra-plan-price, .ra-plan--essential .ra-plan-tag, .ra-plan--essential li { color: var(--c-navy); }
.ra-plan--essential .ra-plan-group { color: #1B6A97; }
.ra-plan--essential li .icon { color: #2493CF; }
.ra-plan--essential .btn { --btn-bg: #2493CF; --btn-bd: #2493CF; background: #2493CF; border-color: #2493CF; }
.ra-plan--essential .btn:hover { background: #2187BE; border-color: #2187BE; }
/* Comfort: his blue, one shade deeper so white body text passes 4.5:1; navy button */
.ra-plan--comfort { background: #1D7DB2; color: #fff; box-shadow: 0 2px 4px rgb(20 33 61 / .08), 0 12px 24px rgb(20 33 61 / .1); }
.ra-plan--comfort h3, .ra-plan--comfort .ra-plan-price, .ra-plan--comfort .ra-plan-tag, .ra-plan--comfort li, .ra-plan--comfort .ra-plan-group { color: #fff; }
.ra-plan--comfort .btn { --btn-bg: var(--c-navy); --btn-bd: var(--c-navy); background: var(--c-navy); border-color: var(--c-navy); }
.ra-plan--comfort .btn:hover { background: #0E1830; border-color: #0E1830; }
/* Premium: deep navy, gold rim, gold name, price and checks; gold button with near-black text */
.ra-plan--premium { background: #14213D; border-color: #E8B04A; color: #E3E9F2; box-shadow: inset 0 0 0 1px #E8B04A, 0 2px 4px rgb(20 33 61 / .08), 0 12px 24px rgb(20 33 61 / .1); }
.ra-plan--premium h3, .ra-plan--premium .ra-plan-price, .ra-plan--premium .ra-plan-group, .ra-plan--premium li .icon { color: #E8B04A; }
.ra-plan--premium .ra-plan-tag, .ra-plan--premium li { color: #fff; }
.ra-plan--premium .btn, .ra-plan--premium .btn:hover { --btn-bg: #E8B04A; --btn-bd: #E8B04A; --btn-fg: #1A1408; background: #E8B04A; border-color: #E8B04A; color: #1A1408; }
.ra-plan { min-width: 0; }
@media (max-width: 359px) { .ra-plan { padding: 22px 16px 18px; } .ra-plan .btn { padding-inline: 12px; } .ra-plan .btn .icon { display: none; } }
/* Service areas: map card, then 3 county dropdowns (all closed) */
.ra-areas { display: grid; gap: 10px; margin-top: var(--sp-3, 18px); }
.ra-area { border: 1px solid #DCE6EE; border-radius: 16px; background: #fff; padding: 0 16px; }
.ra-area summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 8px; min-height: 52px; padding: 10px 0; font-family: var(--ff-display); font-weight: 800; font-size: var(--fs-md, 1.1rem); color: var(--c-navy); }
.ra-area summary::-webkit-details-marker { display: none; }
.ra-area summary:focus-visible { outline: 3px solid var(--c-focus, #2493CF); outline-offset: 4px; border-radius: 8px; }
.ra-area summary .ra-hq-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px 2px 6px; border-radius: 999px; background: #E9F4FA; color: #1B6A97; font-family: var(--ff-body, inherit); font-size: 12px; font-weight: 700; }
.ra-area summary .ra-hq-tag .icon { width: 14px; height: 14px; }
.ra-area .ra-sum { flex: 1 1 auto; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
.ra-area .ra-sum-meta { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
.ra-area summary small { font-family: var(--ff-body, inherit); font-weight: 600; font-size: var(--fs-sm, .9rem); color: var(--c-muted, #5b6474); }
.ra-area summary > .icon { margin-left: auto; flex: none; width: 20px; height: 20px; transition: transform .2s ease; }
.ra-area[open] summary > .icon { transform: rotate(180deg); }
.ra-area .area-chips { margin: 0 0 16px; }
.ra-areas-note { margin-top: var(--sp-3, 18px); }
.svc-region { font-size: 10px; letter-spacing: .12em; color: #5E6B7D; }
@media (min-width: 900px) { .svc-region { font-size: 12px; } }
/* Footer socials */
.ra-socials { display: flex; gap: 10px; margin-top: 14px; padding: 0; list-style: none; }
.ra-socials a { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: rgb(255 255 255 / .1); color: #fff; }
.ra-socials a:hover { background: var(--c-brand); color: #fff; }
.ra-socials svg { width: 20px; height: 20px; fill: currentColor; }
.footer-contact a[href^="mailto:"] { white-space: nowrap; overflow-wrap: normal; word-break: normal; }
</style>
</head>`;
rep('</head>', css);

/* Social icons (simple glyphs, no brand colors) */
rep('</svg>\n<a class="skip-link"', `  <symbol id="s-instagram" viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.2.8-.4.4-.6.7-.8 1.2-.2.4-.3 1-.4 2.1 0 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.2.4.4.7.6 1.2.8.4.2 1 .3 2.1.4 1.2 0 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.2-.8.4-.4.6-.7.8-1.2.2-.4.3-1 .4-2.1 0-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.2-.4-.4-.7-.6-1.2-.8-.4-.2-1-.3-2.1-.4-1.2 0-1.6-.1-4.7-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 8a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Zm5.1-9.4a1.1 1.1 0 1 1 0 2.3 1.1 1.1 0 0 1 0-2.3Z"/></symbol>
  <symbol id="s-facebook" viewBox="0 0 24 24"><path d="M13.5 21.5v-8h2.7l.4-3.2h-3.1V8.3c0-.9.3-1.5 1.6-1.5h1.7V4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.3H7.6v3.2h2.8v8h3.1Z"/></symbol>
  <symbol id="s-tiktok" viewBox="0 0 24 24"><path d="M16.6 3c.3 2.2 1.6 3.6 3.8 3.8v2.6c-1.3.1-2.6-.3-3.8-1v5.9c0 3.4-2.6 5.7-5.6 5.7-3.2 0-5.6-2.5-5.4-5.7.2-3 2.8-5.2 6-4.9v2.7c-1.6-.3-3.1.7-3.2 2.2-.1 1.4 1 2.6 2.5 2.6 1.4 0 2.5-1 2.5-2.7V3h3.2Z"/></symbol>
</svg>
<a class="skip-link"`);

/* ---------- Rating bar, hero badge: "5-star reviews", no Google ---------- */
rep('<aside class="rating-bar" aria-label="Google rating">', '<aside class="rating-bar" aria-label="Customer reviews">');
rx(/<a class="rating-bar-score" href="#reviews" target="_blank" rel="noopener">\s*<svg class="g-mark" aria-hidden="true"><use href="#g-logo"\/><\/svg>\s*(<span class="stars5 small tpl-rated" style="--stars:1.000" role="img" aria-label=")Rated 5.0 out of 5("><\/span>)\s*<b>5.0<\/b>\s*<span class="rating-bar-count">[^\n]*?reviews<\/span>\s*<\/a>/s,
  '<a class="rating-bar-score" href="#reviews">\n      $1Five stars$2\n      <span class="rating-bar-count">5-star reviews</span>\n    </a>');

/* ---------- Header and menus: Plans link ---------- */
rep('<li><a class="nav-link" href="#services">Services</a></li>', '<li><a class="nav-link" href="#services">Services</a></li>\n        <li><a class="nav-link" href="#plans">Plans</a></li>');
rep(`<li><a href="#services">Services ${icon('i-chevron-right')}</a></li>`, `<li><a href="#services">Services ${icon('i-chevron-right')}</a></li>\n        <li><a href="#plans">Maintenance plans ${icon('i-chevron-right')}</a></li>`);
rep('<li><a href="#services">Services</a></li>\n        <li><a href="#how-it-works">', '<li><a href="#services">Services</a></li>\n        <li><a href="#plans">Maintenance plans</a></li>\n        <li><a href="#how-it-works">');

/* ---------- Reviews ---------- */
rx(/<p class="rating-line"><svg class="g-mark"[^>]*><use href="#g-logo"\/><\/svg><span class="stars5 small tpl-rated" style="--stars:1.000" role="img" aria-label="Rated 5.0 out of 5"><\/span>[^\n]*?<\/p>/,
  '<p class="rating-line"><span class="stars5 small tpl-rated" style="--stars:1.000" role="img" aria-label="Five stars"></span>5-star reviews</p>');
rep('<svg class="g-mark" role="img" aria-label="Google review"><use href="#g-logo"/></svg>', '', 3);

/* ---------- Services ---------- */
rx(/<img sizes="\(min-width: 900px\) 600px, 92vw" src="images\/photos\/pipes-[^"]*" srcset="[^"]*" width="1200" height="900" alt="[^"]*" loading="lazy" decoding="async" style="[^"]*">/,
  `<img sizes="(min-width: 900px) 600px, 92vw" src="images/ra/kitchen-sink-720x720.webp" srcset="${srcset('kitchen-sink', [[480, 480], [720, 720], [1024, 1024]])}" width="1024" height="1024" alt="Kitchen sink with the cabinet open and plumbing tools laid out on the counter" loading="lazy" decoding="async" style="object-position:50% 50%;background-color:#c9c4bb">`);
rx(/\s*<span class="tile-kicker warm-k">[^\n]*?<\/span>/, '');
rx(/<a class="tile tone-main" href="#request" id="svc-heating-a-c">[\s\S]*?<\/a>/,
  `<a class="tile photo-tile tone-main ra-wide" href="#request" id="svc-heating-a-c">
            <img sizes="(min-width: 900px) 540px, 92vw" src="images/ra/furnace-install-720x720.webp" srcset="${srcset('furnace-install', [[480, 480], [720, 720], [1086, 1086]])}" width="1086" height="1086" alt="New furnace installed in an attic with fresh ductwork" loading="lazy" decoding="async" style="object-position:50% 45%;background-color:#9b8f80">
            <span class="tile-arrow" aria-hidden="true">${icon('i-arrow-right')}</span>
            <span class="tpl-photo-text">
              <h3>Heating &amp; A/C</h3>
              <p>Repair, installation, and tune-ups.</p>
              <p class="tile-sub">A/C repair · Furnace repair · New systems</p>
            </span>
          </a>`);
rep('<a class="tile tone-second" href="#request" id="svc-maintenance-plans">', '<a class="tile tone-second" href="#plans" id="svc-maintenance-plans">');
rx(/(<p class="tile-sub">Essential · Comfort · Premium<\/p>\s*<\/a>\s*<\/div>\s*<\/div>)\s*<\/div>\s*<\/section>/,
  `$1
      <div class="tpl-callout">
        <span class="icon-bubble">${icon('i-wrench')}</span>
        <p><strong>$99 whole-system tune-up</strong><span>A/C and heating tune-up special.</span></p>
        <a class="btn btn-primary tpl-callout-btn" href="#estimate" data-pick-service="Tune-ups">${icon('i-calendar')}Book your tune-up</a>
      </div>
    </div>
  </section>
${plansSection().split('$').join('$$')}`);

function plansSection() {
  const li = (t) => `<li>${icon('i-check')}<span>${t}</span></li>`;
  const plan = (o) => `
        <li class="ra-plan ra-plan--${o.name.toLowerCase()}" data-reveal>
          <h3>${o.name}</h3>
          <p class="ra-plan-price"><b>${o.price}</b><span>/year</span></p>
          <p class="ra-plan-tag">${o.tag}</p>
          ${o.groups.map(([g, items]) => `<p class="ra-plan-group">${g}</p>
          <ul>
            ${items.map(li).join('\n            ')}
          </ul>`).join('\n          ')}
          <a class="btn" href="${smsBody(`Hi Ryan, I'd like to hear about the ${o.name.replace('&amp;', '&')} maintenance plan.`)}">${icon('i-message')}Text about ${o.name}</a>
        </li>`;
  return `
  <section class="section ra-plans tpl-bg-tint" id="plans" aria-labelledby="plans-title">
    <div class="container">
      <div class="ra-plans-head">
        <div class="section-head">
          <p class="eyebrow">Maintenance plans</p>
          <h2 id="plans-title">Home Comfort <span class="accent">Maintenance Plans.</span></h2>
          <p class="lead">Protect your home. Improve efficiency. Enjoy peace of mind.</p>
        </div>
        <figure class="ra-plans-photo" data-reveal>
          <img sizes="(min-width: 900px) 560px, 92vw" src="images/ra/ac-units-960x540.webp" srcset="${srcset('ac-units', [[480, 270], [720, 405], [960, 540], [1280, 720]])}" width="1280" height="720" alt="Two outdoor A/C units beside a home with the mountains behind" loading="lazy" decoding="async">
        </figure>
      </div>
      <ul class="ra-plan-list" aria-label="Plans">${[
    plan({ name: 'Essential', price: '$149', tag: 'The basics done right.', groups: [['HVAC', ['Outdoor condenser cleaning (standard)', 'Electrical inspection', 'Compressor amp checks', 'System inspection', 'Ducting &amp; insulation evaluation']]] }),
    plan({ name: 'Comfort', price: '$299', tag: 'More coverage. More comfort.', groups: [
      ['HVAC', ['Chemical-bath condenser cleaning', 'Electrical inspection', 'Compressor amp checks', 'System inspection', 'Ducting &amp; insulation evaluation']],
      ['Plumbing', ['Tank-style water heater flush', 'Whole-home plumbing inspection', 'Water pressure check', 'Drain-flow evaluation']]] }),
    plan({ name: 'Premium', price: '$449', tag: 'Our highest level of care.', groups: [['Everything in Comfort, plus', ['Air filter service (cleaning or replacement allowance)', 'Tankless water heater descaling', 'Water quality screening (basic on-site screening)', 'Whole-home comfort report', 'Free HVAC diagnostics', 'Free plumbing diagnostics']]] }),
  ].join('')}
      </ul>
    </div>
  </section>`;
}

/* ---------- Quick quote: Ben's 5 buttons ---------- */
rep('<label class="chip"><input type="radio" name="service" value="Maintenance plans" required><span>Maintenance plans</span></label>',
  '<label class="chip"><input type="radio" name="service" value="Tune-ups" required><span>Tune-ups</span></label>');

/* ---------- How a visit works: no upfront-pricing promise ---------- */
rep('<li><strong>See the price first</strong><span>Your tech finds the problem and shows you the price. You decide.</span></li>',
  '<li><strong>Hear your options</strong><span>We explain the problem and your options clearly before any work starts. You decide.</span></li>');

/* ---------- Service areas: 3 county groups ---------- */
const groups = [
  ['Riverside County', ['Riverside', 'Canyon Lake', 'Corona', 'Eastvale', 'Hemet', 'Jurupa Valley', 'Lake Elsinore', 'La Quinta', 'Menifee', 'Moreno Valley', 'Murrieta', 'Norco', 'Perris', 'Rancho Mirage', 'San Jacinto', 'Temecula', 'Wildomar']],
  ['San Bernardino County', ['Chino', 'Chino Hills', 'Colton', 'Fontana', 'Grand Terrace', 'Loma Linda', 'Redlands', 'Rialto', 'San Bernardino', 'Upland', 'Montclair', 'Ontario', 'Rancho Cucamonga', 'Big Bear Lake', 'Lake Arrowhead', 'Crestline', 'Running Springs', 'Wrightwood', 'Oak Glen']],
  ['Orange County', ['Anaheim', 'Santa Ana', 'Irvine', 'Huntington Beach', 'Costa Mesa', 'Fullerton', 'Garden Grove', 'Orange', 'Newport Beach', 'Mission Viejo', 'Tustin', 'Laguna Beach', 'Lake Forest', 'Buena Park']],
];
const areasHtml = `<div class="ra-areas">
${groups.map(([g, cities], i) => `          <details class="ra-area" data-reveal>
            <summary><span class="ra-sum"><span class="ra-sum-name">${g}</span><span class="ra-sum-meta">${i === 0 ? `<span class="ra-hq-tag">${icon('i-map-pin')}Home base</span>` : ''}<small>${cities.length} cities</small></span></span>${icon('i-chevron-down')}</summary>
            <ul class="area-chips" aria-label="Cities we serve in ${g}">
              ${cities.map((c) => c === 'Riverside' ? `<li class="is-hq">${icon('i-map-pin')}${c}</li>` : `<li>${c}</li>`).join('\n              ')}
            </ul>
          </details>`).join('\n')}
        </div>
        <p class="muted ra-areas-note">Don't see your city? Call us. If we can get there fast, we'll come.</p>`;
/* The map: built by scripts/build-map.mjs from scripts/maps/ra-plumbing-heating-air.json (cached in scripts/.cache) */
const mapCfg = join(ROOT, 'scripts', 'maps', 'ra-plumbing-heating-air.json');
const mapSvg = join(ROOT, 'scripts', '.cache', 'preview-maps', 'ra-plumbing-heating-air.svg');
const mapPartial = join(ROOT, 'scripts', '.cache', 'preview-maps', 'ra-plumbing-heating-air.html');
if (!existsSync(mapSvg) || !existsSync(mapPartial)) execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-map.mjs'), mapCfg], { stdio: 'inherit' });
mkdirSync(join(OUT, 'images', 'map'), { recursive: true });
/* Served cities in his light blue instead of the default warm tint */
writeFileSync(join(OUT, 'images', 'map', 'service-area.svg'), readFileSync(mapSvg, 'utf8').split('#F6E3D6').join('#E0F0F8').split('#EDC9B3').join('#B5DAEF'));
const mapHtml = readFileSync(mapPartial, 'utf8').replace(/^<!--.*?-->\n/, '').trim()
  .replace('{{root}}scripts/.cache/preview-maps/ra-plumbing-heating-air.svg', 'images/map/service-area.svg')
  .replace('alt="ALT"', 'alt="Map of Riverside, San Bernardino, and Orange counties, with Riverside as home base. Opens Google Maps."')
  .replace('<span class="svc-hq-mark"><svg><use href="#logo-mark"/></svg></span>', '<span class="svc-hq-mark tpl-hq tpl-hq-logo"><img src="images/logo-mark.png" alt="" width="32" height="32"></span>');
if (/#logo-mark|\{\{/.test(mapHtml)) fail('map partial still has a template tag');
rep('<p class="lead">Based in Riverside, so a tech is never far away.</p>', '<p class="lead">Based in Riverside, serving three counties.</p>');
rx(/<div class="container">\s*<div>\s*<p class="eyebrow">Service areas<\/p>/, `<div class="container areas-grid">
      <div class="map-card">
${mapHtml}
      </div>
      <div>
        <p class="eyebrow">Service areas</p>`);
rx(/<ul class="area-chips" aria-label="All 1 cities we serve">[\s\S]*?<\/ul>\s*<p class="muted">Just outside Riverside\? Call us\. If we can get there fast, we'll come\.<\/p>/, areasHtml);

rep('365 days a year..', '365 days a year.');

/* ---------- FAQ ---------- */
rep('Yes. Plans start at $149 a year. PLANS_LINK', 'Yes. Plans start at $149 a year. <a class="text-link" href="#plans">See the plans</a>.');

/* ---------- Footer ---------- */
rep('<p>R&amp;A Plumbing Heating &amp; Air serves homeowners in Riverside.</p>\n      <p>Fully insured.</p>',
  `<p>R&amp;A Plumbing Heating &amp; Air serves homes and businesses in Riverside, San Bernardino, and Orange County.</p>
      <p>Reliable by Nature.</p>
      <ul class="ra-socials" aria-label="Follow R&amp;A">
        <li><a href="https://www.instagram.com/raplumbingnhvac" target="_blank" rel="noopener" aria-label="Instagram"><svg aria-hidden="true"><use href="#s-instagram"/></svg></a></li>
        <li><a href="https://www.facebook.com/profile.php?id=61579298787869" target="_blank" rel="noopener" aria-label="Facebook"><svg aria-hidden="true"><use href="#s-facebook"/></svg></a></li>
        <li><a href="https://www.tiktok.com/@rnaphac" target="_blank" rel="noopener" aria-label="TikTok"><svg aria-hidden="true"><use href="#s-tiktok"/></svg></a></li>
      </ul>`);
rx(/\s*<p><a class="footer-text-link" href="#reviews" target="_blank" rel="noopener">Read our Google reviews<\/a><\/p>/, '');

/* ---------- Small script: tune-up button picks Tune-ups; county groups on phones ---------- */
rep('<script src="js/site.js" defer></script>', `<script src="js/site.js" defer></script>
<script>
(function () {
  document.querySelectorAll('[data-pick-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var v = a.getAttribute('data-pick-service');
      var input = document.querySelector('input[name="service"][value="' + v + '"]');
      if (input) { input.checked = true; input.dispatchEvent(new Event('change', { bubbles: true })); }
    });
  });
})();
</script>`);


/* ---------- Bold blue from the van wrap (R&A only) ---------- */
rep('</style>\n</head>', `
/* Bold blue from the van wrap: pill, accent words on light backgrounds, main buttons on light backgrounds, links */
:root { --ra-bold: #0078DE; --ra-bold-hover: #0067BF; }
.accent { color: var(--ra-bold); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 14' preserveAspectRatio='none'%3E%3Cpath d='M3 10.5C40 4 78 3.5 112 6.5S170 11 197 4.5' fill='none' stroke='%230078DE' stroke-width='4' stroke-linecap='round' vector-effect='non-scaling-stroke' opacity='.45'/%3E%3C/svg%3E"); }
.tpl-pill { background: var(--ra-bold); color: #fff; }
.btn-primary, .btn-primary:hover { --btn-bg: var(--ra-bold); --btn-bd: var(--ra-bold); --btn-fg: #fff; }
.btn-primary:hover { --btn-bg: var(--ra-bold-hover); --btn-bd: var(--ra-bold-hover); }
.on-dark .btn-primary { --btn-bg: #2493CF; --btn-bd: #2493CF; }
.on-dark .btn-primary:hover { --btn-bg: #2187BE; --btn-bd: #2187BE; }
.sb-call { background: var(--ra-bold); }
.sb-call:hover { background: var(--ra-bold-hover); }
a, .text-link { color: var(--ra-bold); }
a:hover { color: var(--ra-bold-hover); }
.tpl-logo .tpl-amp { color: var(--ra-bold); }
.tpl-tile-icon { background: var(--ra-bold); }
/* Reviews: a soft tint of the bold blue (92% white), so it reads as its own section after the cream visit steps; the label still reads 3:1 */
.reviews.tpl-bg-tint { background: #E8F3FC; }
/* "shows up on time." stays on one line from 320px up (the headline size is set for it) */
.tpl-hero h1 .accent { white-space: nowrap; }
/* Desktop hero (R&A only; phones and tablets keep the template hero). The photo keeps its scale and the same top
   edge as the template's band (2:1, about 720px on a 1440px screen) but shows down to its own bottom edge. The card
   hugs its content on the left and starts just under Ryan's shoulders and the van logo (60% of the photo's height),
   so it covers only his crossed arms and the lower van. The photo is not tall enough to reach the card's bottom, so
   the buttons and the 24/7 line sit on the page background (Ben chose this over zooming the photo). */
@media (min-width: 900px) {
  .tpl-hero { position: relative; isolation: isolate; --ra-band: min(50vw, max(720px, 39vw), 760px); --ra-p: .25; }
  .tpl-hero .tpl-hero-banner { position: absolute; inset: 0; z-index: 0; height: auto; aspect-ratio: auto; background: none; }
  .tpl-hero .tpl-hero-banner img { position: absolute; left: 0; top: calc((var(--ra-band) - 66.667vw) * var(--ra-p)); width: 100%; height: auto; object-fit: fill; }
  .tpl-hero .tpl-hero-wrap { margin-top: 0; padding-top: calc(40.27vw + (var(--ra-band) - 66.667vw) * var(--ra-p)); }
  .tpl-hero .tpl-hero-card { width: calc(clamp(3.5rem, 5.6vw, 5rem) * 8.3 + 128px); max-width: 100%; }
}
@media (min-width: 1600px) { .tpl-hero { --ra-p: .2; } }
</style>
</head>`);

/* ---------- Guards ---------- */
for (const bad of [/Google(?! Maps)(?!\.com\/maps)/i, /Turlock/i, /Greg\b/, /Kenny/, /second opinion/i, /upfront/i, /satisfaction guarantee/i, /Horizon/i, /Claude/i, /—/, /PLANS_LINK/, /\{\{/, /CSLB/]) {
  const m = html.match(bad); if (m) fail(`leftover "${m[0]}" near: ${html.slice(Math.max(0, m.index - 80), m.index + 80)}`);
}
for (const m of html.matchAll(/href="tel:([^"]+)"/g)) if (m[1] !== '+19519926216') fail(`wrong tel link ${m[1]}`);
for (const m of html.matchAll(/href="sms:([^"?]+)/g)) if (m[1] !== '+19519926216') fail(`wrong sms link ${m[1]}`);
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const m of html.matchAll(/href="#([^"]*)"/g)) if (m[1] && !ids.has(m[1])) fail(`link to a missing section: #${m[1]}`);
if (!/<meta name="robots" content="noindex, nofollow">/.test(html)) fail('noindex missing');

/* No two neighboring sections share a background, now that the plans section is in (scripts/section-backgrounds.mjs) */
const bal = balanceSections(html); html = bal.html;
if (bal.warnings.length) fail(bal.warnings.join('; '));
console.log('Section backgrounds: ' + bal.order.join(' > ') + (bal.changes.length ? ' (changed: ' + bal.changes.join('; ') + ')' : ''));
writeFileSync(file, html);

/* Drop stock photos the page no longer uses (the build copied them for the default hero and plumbing card) */
const photoDir = join(OUT, 'images', 'photos');
let dropped = 0;
for (const f of readdirSync(photoDir)) if (!html.includes(`images/photos/${f}`)) { unlinkSync(join(photoDir, f)); dropped++; }
for (const f of readdirSync(join(OUT, 'images', 'ra'))) if (!html.includes(`images/ra/${f}`)) { unlinkSync(join(OUT, 'images', 'ra', f)); dropped++; }
console.log(`Finished previews/ra-plumbing-heating-air/ (R&A sections added, ${dropped} unused stock photo files dropped).`);
