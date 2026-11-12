#!/usr/bin/env node
/*
  build-preview.mjs: builds a homepage preview for one prospect from one data file.

      node scripts/build-preview.mjs prospects/NAME.json      -> writes previews/NAME/

  What it does:
  1. Reads the data file (prospects/README.md lists every field).
  2. Picks the mode: "established" (a Google rating with 3 or more reviews: rating bar, rating badge, and only
     their real reviews) or "new" (fewer than 3 reviews: 3 sample review cards tagged "Sample", plus the proof
     section). Set "mode" in the data file, or let the build decide. prospects/README.md has the template rules.
  3. Builds a real service-area map from the cities (scripts/build-map.mjs, OpenStreetMap data, cached).
  4. Fills template/homepage.html in the preview section order (hero, trust row, services, membership, how a visit
     works, specials, reviews, team, quick quote, financing, FAQ, service areas, request). A section whose data is
     missing is left out entirely: no placeholder text, no empty boxes.
  4b. Makes the hero banner files and the link-preview image (og.jpg) from heroPhoto (scripts/hero-images.py),
     or uses the stock HVAC or plumbing hero when there is no heroPhoto.
  5. Copies only the files the page needs into previews/NAME/ and writes _headers (noindex) and robots.txt.
  6. Refuses to finish if anything is unfilled, mentions Claude, has an em dash, or if the hero pill
     cannot fit on a 320px phone at 12px.

  No dependencies. Node 18+.
*/
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname, basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { balanceSections } from './section-backgrounds.mjs';
import { vanBlock } from './van.mjs';
import { makeStylesPage, STYLES } from './make-styles.mjs';
import { titleCaseHeadings } from './title-case.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = process.argv[2];
if (!dataPath) { console.error('Usage: node scripts/build-preview.mjs prospects/NAME.json'); process.exit(1); }
const raw = JSON.parse(readFileSync(dataPath, 'utf8'));
const slug = String(raw.slug || basename(dataPath, '.json')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const OUT = join(ROOT, 'previews', slug);
const fail = (msg) => { console.error(msg); process.exit(1); };

/* ---------- 1. Data: required fields, then everything derived ---------- */
const str = (v) => (v === undefined || v === null ? '' : String(v).trim());
const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => (str(v) === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const missing = ['name', 'phone', 'city'].filter((k) => !str(raw[k]));
if (missing.length) fail(`Missing required field(s) in ${dataPath}: ${missing.join(', ')}`);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const listWords = (a) => a.length <= 1 ? a.join('') : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')}, and ${a[a.length - 1]}`;
const listAmp = (a) => a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} & ${a[a.length - 1]}`;
const hueOf = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const accent = (before, hi) => `${esc(before)} <span class="accent">${esc(hi)}</span>`;

const name = str(raw.name);
const city = str(raw.city);
const state = str(raw.state) || 'CA';
const digits = str(raw.phone).replace(/\D/g, '');
if (digits.length < 10) fail('phone needs 10 digits, got: ' + raw.phone);
const tel = '+' + (digits.length === 10 ? '1' + digits : digits);
const phonePretty = digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : str(raw.phone);
const year = new Date().getFullYear();
const shortName = str(raw.shortName) || name;
const initial = shortName.charAt(0).toUpperCase();

/* Reviews and mode */
const rating = num(raw.googleRating);
if (rating !== null && !(rating >= 1 && rating <= 5)) fail('googleRating must be between 1 and 5');
const reviewCount = num(raw.reviewCount);
const googleReviewsUrl = str(raw.googleReviewsUrl);
const writeReviewUrl = str(raw.writeReviewUrl);
const reviews = arr(raw.reviews).filter((r) => r && str(r.quote)).map((r) => {
  const n = str(r.name) || 'Google reviewer';
  return { name: n, quote: str(r.quote), initial: n.charAt(0).toUpperCase(), hue: hueOf(n), meta: [str(r.city), str(r.when)].filter(Boolean).join(' · ') };
});
const canBeEstablished = rating !== null && googleReviewsUrl !== '';
const realCount = reviewCount !== null ? reviewCount : reviews.length;
let mode = str(raw.mode).toLowerCase();
if (mode && !['established', 'new'].includes(mode)) fail('mode must be "established" or "new"');
/* 3 or more real Google reviews: their real reviews only. Fewer: sample cards, clearly tagged. */
if (!mode) mode = canBeEstablished && realCount >= 3 ? 'established' : 'new';
if (mode === 'established' && !canBeEstablished) { console.warn('note: mode is "established" but googleRating or googleReviewsUrl is missing, so the page uses new-business mode.'); mode = 'new'; }
const established = mode === 'established';
const isNew = !established;
const ratingIs5 = established && rating >= 5;

/* Services and trade */
const KIND = { heating: /(?<!water )heat(?!er)|furnace|boiler/i, cooling: /cool|\bac\b|a\/c|air cond/i, plumbing: /plumb|water heater|drain|sewer|leak|pipe|toilet|faucet|repip/i };
const kindOf = (text) => Object.keys(KIND).filter((k) => KIND[k].test(text));
const icons = [['water heater', 'i-waterheater'], ['heat pump', 'i-heatpump'], ['heat', 'i-flame'], ['furnace', 'i-flame'], ['cool', 'i-snowflake'], ['air cond', 'i-snowflake'], ['a/c', 'i-snowflake'], ['ac ', 'i-snowflake'], ['drain', 'i-drain'], ['sewer', 'i-drain'], ['leak', 'i-droplet'], ['repip', 'i-pipes'], ['pipe', 'i-pipes'], ['plumb', 'i-droplet'], ['air quality', 'i-wind'], ['duct', 'i-wind'], ['electric', 'i-zap'], ['maint', 'i-wrench'], ['tune', 'i-wrench'], ['solar', 'i-sun'], ['insul', 'i-home'], ['new system', 'i-heatpump'], ['install', 'i-heatpump'], ['replace', 'i-refresh']];
const iconFor = (n) => { const l = (n + ' ').toLowerCase(); for (const [k, v] of icons) if (l.includes(k)) return v; return 'i-sparkle'; };
const toneFor = (n) => /cool|a\/c|\bac\b|air cond|quality|duct/i.test(n) ? 'cool' : /plumb|water|drain|sewer|leak|pipe/i.test(n) ? 'navy' : '';
const svcList = arr(raw.services).map((s) => typeof s === 'string' ? { name: s } : s).filter((s) => s && str(s.name));
/* Service cards use the main color plus a second color: the first half main, the rest second, unless a service sets "tone". */
const services = svcList.map((s, i) => {
  const sub = arr(s.sub).map(str).filter(Boolean);
  const nm = str(s.name), tone = toneFor(nm);
  const kinds = kindOf(nm);
  const t = str(s.tone).toLowerCase();
  if (t && !['main', 'second'].includes(t)) fail(`services[${i}].tone must be "main" or "second"`);
  const colorTone = t || (i < Math.ceil(svcList.length / 2) ? 'main' : 'second');
  return { name: nm, nameLower: nm.toLowerCase(), blurb: str(s.blurb), icon: str(s.icon) || iconFor(nm), tone, tileTone: `tone-${colorTone}`, colorTone,
    anchor: 'svc-' + nm.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), sub, subLine: sub.join(' · '),
    isPlumbing: kinds.length ? kinds.every((k) => k === 'plumbing') : kindOf(sub.join(' ')).includes('plumbing') && !kindOf(sub.join(' ')).some((k) => k !== 'plumbing'),
    kicker: kinds.includes('plumbing') ? 'Plumbing' : kinds.includes('cooling') ? 'Cooling' : kinds.includes('heating') ? 'Heating' : 'Most requested' };
});
const kinds = new Set(services.flatMap((s) => kindOf(s.name + ' ' + s.sub.join(' '))));
const TRADES = ['hvac', 'plumbing', 'both', 'electrical', 'roofing', 'landscaping', 'general'];
let trade = str(raw.trade).toLowerCase();
if (!trade) trade = kinds.has('plumbing') && (kinds.has('heating') || kinds.has('cooling')) ? 'both' : kinds.has('plumbing') ? 'plumbing' : 'hvac';
if (!TRADES.includes(trade)) fail(`trade must be one of: ${TRADES.join(', ')}`);
const hvacLike = ['hvac', 'both'].includes(trade), plumbingLike = ['plumbing', 'both'].includes(trade);
const tradeLabel = str(raw.tradeLabel) || { hvac: 'HVAC', plumbing: 'Plumbing', both: 'HVAC & Plumbing', electrical: 'Electrician', roofing: 'Roofing', landscaping: 'Landscaping', general: 'Home Services' }[trade];
/* Font style (css/fonts.css) and trade edges (css/alive.css): per-site settings with trade defaults. */
const FONT_STYLES = STYLES.map((x) => x.key);
const fontStyle = str(raw.fontStyle).toLowerCase() || 'clean';
if (!FONT_STYLES.includes(fontStyle)) fail(`fontStyle must be one of: ${FONT_STYLES.join(', ')}`);
const EDGES = ['curve', 'wave', 'roof', 'grass', 'bolt', 'none'];
const edge = str(raw.edge).toLowerCase() || { hvac: 'curve', both: 'curve', plumbing: 'wave', roofing: 'roof', general: 'roof', landscaping: 'grass', electrical: 'bolt' }[trade];
if (!EDGES.includes(edge)) fail(`edge must be one of: ${EDGES.join(', ')}`);
const FONT_FILES = { clean: ['plus-jakarta-sans-latin-var', 'inter-latin-var'], bold: ['anton-latin-400', 'barlow-latin-400', 'barlow-condensed-latin-700'],
  classic: ['fraunces-latin-var', 'inter-latin-var'], rugged: ['rubik-dirt-latin-400', 'rubik-latin-var'], friendly: ['lilita-one-latin-400', 'nunito-latin-var'] };
const fontPreloads = FONT_FILES[fontStyle].map((f) => `<link rel="preload" href="fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`).join('\n');
/* An HVAC company that also does water heaters is still HVAC: the pill only names the trades they are. */
const svcWords = ['heating', 'cooling', 'plumbing'].filter((k) => kinds.has(k) && (k === 'plumbing' ? plumbingLike : hvacLike));
const svcPhrase = str(raw.pillServices) || (svcWords.length ? cap(listAmp(svcWords)) : services.length ? cap(listAmp(services.slice(0, 2).map((s) => s.nameLower))) : tradeLabel);
const svcShort = trade === 'both' ? 'HVAC & plumbing' : trade === 'plumbing' ? 'Plumbing' : kinds.has('heating') && kinds.has('cooling') ? 'HVAC' : svcPhrase;
const serviceSummary = services.length ? listWords(services.slice(0, 3).map((s) => s.nameLower)) : tradeLabel.toLowerCase();

/* Service areas, map, counties */
const areas = arr(raw.serviceAreas).map(str).filter(Boolean);
if (areas.length && !areas.some((a) => a.toLowerCase() === city.toLowerCase())) areas.unshift(city);
const areaChips = areas.map((a) => ({ name: a, hq: a.toLowerCase() === city.toLowerCase() }));
const areaSummary = areas.length === 0 ? city : areas.length <= 4 ? listWords(areas) : `${areas.slice(0, 3).join(', ')}, and ${areas.length - 3} more cities`;
let mapHtml = '', mapSvgFile = '', counties = arr(raw.counties).map(str).filter(Boolean).map((c) => c.replace(/\s+County$/i, ''));
/* mapNearby: 1 or 2 nearby towns shown as plain map labels (no pin, no shading) so a one-city map still has context */
const mapNearby = arr(raw.mapNearby).map(str).filter(Boolean).slice(0, 2);
if (arr(raw.mapNearby).length > 2) console.warn('note: mapNearby takes 1 or 2 towns. Only the first 2 are on the map.');
if ((areas.length >= 2 || (areas.length === 1 && mapNearby.length)) && raw.map !== false) {
  const dir = join(ROOT, 'scripts', '.cache', 'preview-maps');
  mkdirSync(dir, { recursive: true });
  const q = (a) => (/,/.test(a) ? a : `${a}, ${state}`);
  const cfg = { name: slug, cities: areas.map(q), hq: q(city), hqLabel: 'Home base', nearby: mapNearby.map(q), centerOnHq: true,
    svg: `scripts/.cache/preview-maps/${slug}.svg`, partial: `scripts/.cache/preview-maps/${slug}.html`, alt: 'ALT', labelSide: raw.mapLabelSide || {} };
  const cfgFile = join(dir, `${slug}.json`);
  writeFileSync(cfgFile, JSON.stringify(cfg, null, 1));
  try {
    execFileSync(process.execPath, [join(ROOT, 'scripts', 'build-map.mjs'), cfgFile], { stdio: ['ignore', 'pipe', 'pipe'] });
    mapHtml = readFileSync(join(ROOT, cfg.partial), 'utf8').replace(/^<!--.*?-->\n/, '').trim();
    mapSvgFile = join(ROOT, cfg.svg);
    if (!counties.length && areas.length >= 2) {
      const geo = JSON.parse(readFileSync(join(ROOT, 'scripts', '.cache', 'geocode.json'), 'utf8'));
      const tally = new Map();
      for (const a of areas) { const c = str(geo[q(a)]?.county).replace(/\s+County$/i, ''); if (c) tally.set(c, (tally.get(c) || 0) + 1); }
      const hqC = str(geo[q(city)]?.county).replace(/\s+County$/i, '');
      counties = [...tally.keys()].sort((a, b) => (b === hqC) - (a === hqC) || tally.get(b) - tally.get(a));
    }
  } catch (e) {
    console.warn('note: the service-area map could not be built (no network and no cache?), so the section shows the city list only.\n' + String(e.stderr || e.message).trim().split('\n').slice(-2).join('\n'));
  }
}
const countiesFull = counties.length === 0 ? '' : counties.length === 1 ? `${counties[0]} County` : `${listAmp(counties)} counties`;
const countiesShort = counties.length === 1 ? `${counties[0]} County` : listAmp(counties);
const areaCountText = areas.length > 1 ? `${areas.length} cities${countiesFull ? ` across ${countiesFull}` : ''}` : city;

/* Hero pill: "[their services] in [their counties]", one line, the longest version that fits, 13 to 15px (12px only as a last resort) */
const pillTiers = [];
const addTier = (t) => { t = str(t); if (t && !pillTiers.includes(t)) pillTiers.push(t); };
if (str(raw.pill)) addTier(raw.pill);
if (str(raw.pillShort)) addTier(raw.pillShort);
if (countiesFull) { addTier(`${svcPhrase} services in ${countiesFull}`); addTier(`${svcPhrase} in ${countiesShort}`); addTier(`${svcShort} in ${countiesShort}`); }
addTier(`${svcPhrase} services in ${city} and nearby`); addTier(`${svcPhrase} in ${city} and nearby`); addTier(`${svcShort} in ${city} and nearby`);
/* Inter 700 advance widths per character (em units), measured in the browser. Unknown characters count as wide. */
const CW = { ' ': .2368, '!': .3379, '"': .5513, '#': .6489, $: .6548, '%': 1.0156, '&': .6719, "'": .3389, '(': .3775, ')': .3775, '*': .5591, '+': .6787, ',': .334, '-': .4678, '.': .334, '/': .3887, ':': .334, ';': .3433, '?': .5596, '@': 1.0156,
  0: .6743, 1: .4312, 2: .6294, 3: .6455, 4: .6763, 5: .6221, 6: .6494, 7: .5991, 8: .6509, 9: .6494,
  A: .7598, B: .6616, C: .7398, D: .7222, E: .6074, F: .5869, G: .7505, H: .7471, I: .2808, J: .5845, K: .7192, L: .5654, M: .9316, N: .7622, O: .7705, P: .648, Q: .7769, R: .6567, S: .6548, T: .6675, U: .7319, V: .7598, W: 1.0571, X: .7383, Y: .731, Z: .6641,
  a: .5806, b: .6304, c: .5884, d: .6304, e: .5957, f: .3608, g: .6318, h: .6226, i: .2715, j: .2715, k: .5801, l: .2715, m: .9126, n: .6226, o: .6133, p: .6304, q: .6304, r: .4138, s: .5601, t: .3569, u: .6226, v: .5996, w: .8501, x: .5801, y: .6021, z: .5728 };
/* Pill sizes, smallest first: font size, side padding, letter spacing, top and bottom padding */
/* 13 to 15px normally. 12px is a fallback, used only when no version of the text fits a 320px phone at 13px. */
const STEPS_ALL = [{ f: 12, pad: 12, ls: 0, v: 6 }, { f: 13, pad: 14, ls: 0, v: 7 }, { f: 14, pad: 16, ls: 0.01, v: 8 }, { f: 15, pad: 19, ls: 0.01, v: 9 }];
const pillWidth = (t, s) => ([...t].reduce((a, c) => a + (CW[c] ?? 0.8), 0) * s.f + t.length * s.ls * s.f) * 1.03 + 2 * s.pad + 2;
const PHONE = 288; // hero column on a 320px phone
const fitsAt = (st) => pillTiers.map((t, i) => ({ t, i })).filter(({ t }) => pillWidth(t, st) <= PHONE);
const STEPS = fitsAt(STEPS_ALL[1]).length ? STEPS_ALL.slice(1) : STEPS_ALL;
if (STEPS[0].f === 12) console.warn('note: the hero pill only fits a 320px phone at 12px. A shorter "pillShort" (about 34 characters) lets it use 13px.');
const fitsPhone = fitsAt(STEPS[0]);
if (!fitsPhone.length) fail(`The hero pill is too long for a 320px phone. Add a shorter "pillShort" (about 40 characters or less). Tried: ${pillTiers.join(' | ')}`);
const keep = pillTiers.slice(0, fitsPhone[0].i + 1); // the longest tiers down to the first one that fits a phone
const cands = keep.flatMap((t, ti) => STEPS.map((s, si) => ({ ti, si, w: Math.ceil(pillWidth(t, s)), score: (keep.length - ti) * 10 + si })));
const best = (W) => cands.filter((c) => c.w <= W).sort((a, b) => b.score - a.score)[0];
const base = best(PHONE);
/* Show one tier. The real text (tier 0) is never display:none, so screen readers always read the H1. */
const SHOW = (i) => i === 0 ? '.tpl-pill .tp-0{display:inline;position:static;width:auto;height:auto;overflow:visible;clip-path:none}' : `.tpl-pill .tp-${i}{display:inline}`;
const HIDE = (n) => (n > 1 ? `${[...Array(n).keys()].slice(1).map((i) => `.tpl-pill .tp-${i}`).join(',')}{display:none}` : '') + '.tpl-pill .tp-0{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}';
let pillCss = SHOW(base.ti);
let cur = base;
for (const w of [...new Set(cands.map((c) => c.w))].sort((a, b) => a - b)) {
  if (w <= PHONE) continue;
  const b = best(w);
  if (b.score === cur.score) continue;
  const s = STEPS[b.si];
  pillCss += `@container (min-width:${w}px){.tpl-pill{font-size:${s.f}px;padding:${s.v}px ${s.pad}px;letter-spacing:${s.ls ? s.ls + 'em' : '0'}}${HIDE(keep.length)}${SHOW(b.ti)}}`;
  cur = b;
}
{ const s = STEPS[base.si]; pillCss = `.tpl-pill{font-size:${s.f}px;padding:${s.v}px ${s.pad}px;letter-spacing:${s.ls}em}` + pillCss; }
/* The pill is the page's H1, so only the longest tier is real text; the shorter tiers show through CSS (data-t). */
const pillHtml = keep.map((t, i) => i === 0 ? `<span class="tp-${i}">${esc(t)}</span>` : `<span class="tp-${i}" data-t="${esc(t)}"></span>`).join('');
const pillFull = keep[cur.ti];

/* Specials, FAQ, locations, estimate */
const specials = arr(raw.specials).filter((s) => s && str(s.amount) && str(s.title)).map((s) => ({ amount: str(s.amount), title: str(s.title), text: str(s.text), fine: str(s.fine) }));
const faqs = arr(raw.faqs).filter((f) => f && str(f.q) && str(f.a)).map((f, i) => ({ q: str(f.q), a: str(f.a), n: i + 1 }));
const locations = arr(raw.locations).filter((l) => l && str(l.name)).map((l) => ({ name: str(l.name), address: str(l.address), cityLine: str(l.cityLine) }));
const prices = arr(raw.startingPrices).filter((p) => p && str(p.service) && num(p.from) !== null).map((p) => ({ service: str(p.service), from: num(p.from), to: num(p.to) ?? num(p.from), note: str(p.note) }));
const quoteOptions = [...services.slice(0, 5).map((s) => s.name), 'Something else'];

/* Financing (optional) */
let financing = null;
if (raw.financing && typeof raw.financing === 'object') {
  const f = raw.financing;
  const apr = num(f.apr), min = num(f.min) ?? 3000, max = num(f.max) ?? 25000;
  const terms = arr(f.terms).map(num).filter((n) => n > 0);
  const termList = (terms.length ? terms : [36, 60, 84, 120]).slice(0, 4);
  const start = Math.round((min + (max - min) * 0.4) / 500) * 500;
  financing = { hasCalc: apr !== null && apr > 0, apr: apr ?? '', min, max, step: max - min > 5000 ? 500 : 100, start, startPretty: money(start), minPretty: money(min), maxPretty: money(max),
    terms: termList.map((m, i) => ({ months: m, last: i === termList.length - 1 })), lastTerm: termList[termList.length - 1],
    bullets: arr(f.bullets).map(str).filter(Boolean), lead: str(f.lead) || 'Monthly payments on repairs and new systems. Ask us about the options when you reach out.',
    href: str(f.url) || '#request', external: !!str(f.url), cta: str(f.cta) || (str(f.url) ? 'See financing options' : 'Ask about financing') };
}

/* Membership (optional) */
let membership = null;
if (raw.membership && typeof raw.membership === 'object' && str(raw.membership.name)) {
  const m = raw.membership;
  const benefits = arr(m.benefits).filter((b) => b && str(b.title)).map((b, i) => ({ title: str(b.title), text: str(b.text), icon: iconFor(b.title) === 'i-sparkle' ? ['i-zap', 'i-wrench', 'i-percent'][i % 3] : iconFor(b.title), tone: i % 3 === 1 ? 'cool' : '' }));
  membership = { name: str(m.name), headline: str(m.headline) ? esc(m.headline) : accent('Skip the line when it', "matters most."), lead: str(m.lead), benefits, price: str(m.price), per: str(m.per),
    cardLines: arr(m.cardLines).filter((l) => l && str(l.label) && str(l.value)).map((l) => ({ label: str(l.label), value: str(l.value) })) };
}

/* Owner and team */
const o = raw.owner && typeof raw.owner === 'object' ? raw.owner : {};
const owner = { name: str(o.name), role: str(o.role) || 'Owner', roleShort: (str(o.role) || 'owner').split(/ and |,/)[0].toLowerCase(), story: str(o.story), quote: str(o.quote), initial: str(o.name).charAt(0).toUpperCase() };
const hasOwner = !!(owner.name && (owner.story || owner.quote));
const ownerPhoto = str(o.photo);
const ownerPhotoExt = ownerPhoto ? extname(ownerPhoto).toLowerCase() : '';
if (ownerPhoto && !['.jpg', '.jpeg', '.png', '.webp'].includes(ownerPhotoExt)) fail('owner.photo must be a .jpg, .png, or .webp file');
/* No real owner photo: an illustrated placeholder (never a job-site photo, CLAUDE.md), duotone in the site's colors,
   with a small wave and a blink, and a "Your photo here" tag. owner.gender "man" or "woman" picks the drawing. */
const ownerGender = str(o.gender).toLowerCase();
if (ownerGender && !['man', 'woman'].includes(ownerGender)) fail('owner.gender must be "man" or "woman"');
const ownerIllustration = (() => {
  const hair = ownerGender === 'woman'
    ? '<path class="op-d" d="M72 150c-6-52 22-70 48-70s56 16 50 70l6 64c-24 12-88 12-112 0z"/>'
    : '';
  const top = ownerGender === 'woman'
    ? '<path class="op-d" d="M80 132c4-28 22-40 42-40 22 0 38 14 40 38-14-12-34-18-50-12-12 4-22 10-32 14z"/>'
    : '<path class="op-d" d="M78 136c-2-30 18-48 44-48 26 0 44 16 42 46-6-14-22-22-42-22-20 0-36 8-44 24z"/>';
  return `<svg class="tpl-owner-art" viewBox="0 0 240 300" role="img" aria-label="Illustration standing in for a photo of ${esc(owner.name)}">`
    + hair
    + '<path class="op-d" d="M26 300c2-58 40-90 94-90s92 32 94 90z"/>'
    + '<path class="op-l" d="M104 196h32v26l-16 14-16-14z"/>'
    + '<circle class="op-l" cx="120" cy="146" r="42"/>'
    + top
    + '<g class="op-eyes"><ellipse class="op-d" cx="105" cy="148" rx="4.5" ry="5.5"/><ellipse class="op-d" cx="135" cy="148" rx="4.5" ry="5.5"/></g>'
    + '<path class="op-ds" d="M107 166q13 11 26 0"/>'
    + '<g class="op-arm"><path class="op-ds op-sleeve" d="M184 236c10-20 18-38 22-62"/><circle class="op-l" cx="208" cy="160" r="15"/></g>'
    + '</svg>';
})();
const team = arr(raw.team).filter((t) => t && str(t.name)).map((t) => ({ name: str(t.name), role: str(t.role), initial: str(t.name).charAt(0).toUpperCase() }));
const promises = arr(raw.promises).map(str).filter(Boolean);

/* Trust and proof */
const years = num(raw.yearsInBusiness);
const yearsInTrade = num(raw.yearsInTrade);
const license = str(raw.license);
const insured = raw.insured !== false;
const upfront = raw.upfrontPricing !== false;
const guarantee = raw.guarantee !== false;
const warranty = str(raw.warranty);
const hasYears = years !== null && years > 0;
const hasTradeYears = yearsInTrade !== null && yearsInTrade > 0;
const since = num(raw.since); // the year they started (CSLB first issued date is a good source)
const bonded = raw.bonded === true;
const secondOpinion = raw.secondOpinion === true;

/* Logo and brand colors. The main color comes from colors.brand. With no brand color, buttons and accents use
   Ridgeline's gold (#D4A531, hover #E0B444, CLAUDE.md) with navy text, and headline words and small text stay navy, so
   the gold is never darkened into brown or mustard.
   A light color is darkened step by step until white text on it (and it on white) reads at 4.5:1. */
const logo = str(raw.logo);
const logoExt = logo ? extname(logo).toLowerCase() : '';
if (logo && !['.svg', '.png', '.jpg', '.jpeg', '.webp'].includes(logoExt)) fail('logo must be an .svg, .png, .jpg, or .webp file');
const logoSrc = logo ? `images/logo${logoExt}` : '';
/* logoMark: the square icon part of their logo, for the favicon and the map pin. Falls back to the full logo. */
const logoMark = str(raw.logoMark);
const logoMarkExt = logoMark ? extname(logoMark).toLowerCase() : '';
if (logoMark && !['.svg', '.png', '.jpg', '.jpeg', '.webp'].includes(logoMarkExt)) fail('logoMark must be an .svg, .png, .jpg, or .webp file');
const markSrc = logoMark ? `images/logo-mark${logoMarkExt}` : logoSrc;
/* headerMark: the square mark shown beside the name in the header (for example the picture part of the logo, on its
   own background). Falls back to logoMark. Without either, the header shows the first letter in a brand-color square. */
const headerMark = str(raw.headerMark);
const headerMarkExt = headerMark ? extname(headerMark).toLowerCase() : '';
if (headerMark && !['.svg', '.png', '.jpg', '.jpeg', '.webp'].includes(headerMarkExt)) fail('headerMark must be an .svg, .png, .jpg, or .webp file');
const headerMarkSrc = headerMark ? `images/header-mark${headerMarkExt}` : logoMark ? markSrc : '';
const markExt = logoMark ? logoMarkExt : logoExt;
/* Logo size for the img tag: read from the PNG or WebP header, otherwise a wide default. */
let logoW = 200, logoH = 44;
if (logo && ['.png', '.webp'].includes(logoExt)) { try {
  const b = readFileSync(resolve(dirname(dataPath), logo));
  if (logoExt === '.png') { logoW = b.readUInt32BE(16); logoH = b.readUInt32BE(20); }
  else { const kind = b.toString('ascii', 12, 16); // WebP: VP8X (extended), VP8L (lossless), or VP8 (lossy)
    if (kind === 'VP8X') { logoW = 1 + b.readUIntLE(24, 3); logoH = 1 + b.readUIntLE(27, 3); }
    else if (kind === 'VP8L') { const v = b.readUInt32LE(21); logoW = 1 + (v & 0x3FFF); logoH = 1 + ((v >> 14) & 0x3FFF); }
    else if (kind === 'VP8 ') { logoW = b.readUInt16LE(26) & 0x3FFF; logoH = b.readUInt16LE(28) & 0x3FFF; } }
} catch {} }
/* truckPhoto is no longer shown (the trust row is compact tiles now). A good van photo makes a great heroPhoto instead. */
const truck = null;
if (raw.truckPhoto) console.warn('note: truckPhoto is no longer shown. Use the van photo as heroPhoto instead (it also becomes the link-preview image).');
const truckExt = truck ? extname(str(truck.src)).toLowerCase() : '';
if (truck && !['.jpg', '.jpeg', '.png', '.webp'].includes(truckExt)) fail('truckPhoto.src must be a .jpg, .png, or .webp file');
if (truck && !(num(truck.width) && num(truck.height))) fail('truckPhoto needs width and height (in pixels)');
const givenBrand = str(raw.colors && raw.colors.brand);
const defaultGold = !givenBrand;
const brand = givenBrand || '#D4A531';
const fillMode = str(raw.colors && raw.colors.fill).toLowerCase() || (defaultGold ? 'bright' : '');
const navy = str(raw.colors && raw.colors.navy);
const second = str(raw.colors && raw.colors.second);
const hex = /^#[0-9a-fA-F]{6}$/;
for (const [k, v] of [['colors.brand', brand], ['colors.navy', navy], ['colors.second', second]]) if (v && !hex.test(v)) fail(`${k} must look like #RRGGBB, got ${v}`);
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrastWhite = (rgb) => 1.05 / (lum(rgb) + 0.05);
const darken = (rgb, f) => rgb.map((v) => v * (1 - f));
const darkenUntil = (hexColor, ratio) => { let rgb = toRgb(hexColor); let n = 0; while (contrastWhite(rgb) < ratio && n++ < 40) rgb = darken(rgb, 0.04); return toHex(rgb); };
const mix = (hexColor, f) => toHex(toRgb(hexColor).map((v) => v + (255 - v) * f));
const rgbStr = (h) => toRgb(h).join(' ');
let brandCss = '';
let brightReport = '';
let mapColors = null;
if (brand && brand.toUpperCase() !== '#E4572E') {
  /* colors.fill "vivid": one vivid brand color everywhere (fills with white text, headline words, labels, links, icons),
     instead of darker shades for text. The color is used as given: pick it so white bold text reaches 3:1 on it and it
     reaches 3:1 on cream (the build checks both). Only the hover state is a little deeper. */
  const vivid = fillMode === 'vivid';
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  if (vivid) {
    const w = contrastWhite(toRgb(brand)), c = ratio(toRgb(brand), toRgb('#F6F3EF'));
    if (w < 3 || c < 3) fail(`colors.fill vivid: ${brand} gives white text ${w.toFixed(2)}:1 and ${c.toFixed(2)}:1 on cream; both need 3:1. Use a slightly deeper shade of the same hue.`);
  }
  const strong = vivid ? brand : darkenUntil(brand, 4.5), deep = vivid ? brand : darkenUntil(brand, 5.5), hover = vivid ? toHex(darken(toRgb(brand), 0.08)) : darkenUntil(brand, 6), tint = mix(brand, 0.86);
  /* --c-brand-light is the accent color on dark bands, so it is lightened until it reads at 4.5:1 on the navy. */
  const darkBg = toRgb(navy ? darkenUntil(navy, 7) : '#14213D');
  let lf = 0.55; while (ratio(toRgb(mix(brand, lf)), darkBg) < 4.6 && lf < 0.95) lf += 0.03;
  const light = vivid ? brand : mix(brand, lf);
  if (vivid) brightReport = `vivid ${brand} everywhere: white text on it ${contrastWhite(toRgb(brand)).toFixed(2)}:1, on cream ${ratio(toRgb(brand), toRgb('#F6F3EF')).toFixed(2)}:1, on white ${ratio(toRgb(brand), toRgb('#FFFFFF')).toFixed(2)}:1, on navy ${ratio(toRgb(brand), darkBg).toFixed(2)}:1; hover ${hover}`;
  brandCss += `:root{--c-brand:${brand};--c-brand-strong:${strong};--c-brand-deep:${deep};--c-brand-hover:${hover};--c-brand-tint:${tint};--c-brand-light:${light};--c-brand-rgb:${rgbStr(strong)}}`;
  /* site.css has a few warm colors written out (the headline underline, button shadows, soft tints). Every rule that uses
     one is copied here with the brand's own shade, so a blue brand has no orange left on the page. */
  const swap = [['%23E4572E', encodeURIComponent(brand)], ['#E4572E', brand], ['rgb(209 68 28', `rgb(${rgbStr(strong)}`], ['rgb(228 87 46', `rgb(${rgbStr(brand)}`],
    ['#FDE8DF', tint], ['#FFC9AE', mix(brand, 0.7)], ['#F9C8B2', mix(brand, 0.7)], ['#F2C2AE', mix(brand, 0.72)], ['#F7D5C7', mix(brand, 0.8)], ['#F29E4C', mix(brand, 0.35)], ['#FFB59E', light], ['rgb(255 186 150', `rgb(${rgbStr(mix(brand, 0.6))}`], ['rgb(253 232 223', `rgb(${rgbStr(tint)}`]];
  const site = readFileSync(join(ROOT, 'css', 'site.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const hasWarm = (s) => swap.some(([a]) => s.toUpperCase().includes(a.toUpperCase()));
  const recolor = (s) => swap.reduce((acc, [a, b]) => acc.split(a).join(b).split(a.toLowerCase()).join(b), s);
  const walk = (css) => {
    let out = '', i = 0;
    while (i < css.length) {
      const open = css.indexOf('{', i); if (open === -1) break;
      const sel = css.slice(i, open).trim();
      let depth = 1, j = open + 1; while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
      const body = css.slice(open + 1, j - 1);
      if (sel.startsWith('@media') || sel.startsWith('@supports') || sel.startsWith('@container')) { const inner = walk(body); if (inner) out += `${sel}{${inner}}`; }
      else if (!sel.startsWith('@') && !sel.startsWith(':root') && hasWarm(body)) {
        const decls = body.split(/;(?![^(]*\))/).map((d) => d.trim()).filter((d) => d && hasWarm(d));
        if (decls.length) out += `${sel}{${recolor(decls.join(';'))}}`;
      }
      i = j;
    }
    return out;
  };
  brandCss += walk(site);
  mapColors = [['#F6E3D6', mix(brand, 0.86)], ['#EDC9B3', mix(brand, 0.66)]];
  /* colors.fill "bright": the brand color itself (often a bright logo color) fills buttons, the hero pill, the call
     button and the main service cards, instead of a darkened shade. When white text on it is under 4.5:1, text on those
     fills turns navy. Orange headline words use the closest deeper shade of the same color that reaches 3:1 on the cream
     background; smaller orange text keeps the deeper shade above, which reaches 4.5:1. */
  if (fillMode === 'bright') {
    const navyText = navy ? darkenUntil(navy, 7) : '#14213D';
    const ratioHex = (a, b) => ratio(toRgb(a), toRgb(b));
    const deepenVs = (hexColor, bg, r) => { let rgb = toRgb(hexColor); let n = 0; while (ratio(rgb, toRgb(bg)) < r && n++ < 80) rgb = darken(rgb, 0.015); return toHex(rgb); };
    /* Text on gold is always white with a soft dark shadow (CLAUDE.md); other bright fills keep the 4.5:1 test */
    const onFill = defaultGold || contrastWhite(toRgb(brand)) >= 4.5 ? '#FFFFFF' : navyText;
    let fillHover = toHex(darken(toRgb(brand), 0.08));
    if (ratioHex(onFill, fillHover) < 4.5) fillHover = brand;
    if (brand.toUpperCase() === '#D4A531' && ratioHex(onFill, '#E0B444') >= 4.5) fillHover = '#E0B444'; // Ridgeline's gold lightens on hover
    /* The hero's soft glow is the brand tint at 55% over cream, the darkest background headline words sit on. */
    const glow = toHex(toRgb('#F6F3EF').map((v, k) => v * 0.45 + toRgb(mix(brand, 0.6))[k] * 0.55));
    const accentLarge = deepenVs(deepenVs(brand, '#F6F3EF', 3), glow, 3);
    if (ratioHex(deep, '#F6F3EF') < 4.5) fail('colors.fill bright: the small-text shade does not reach 4.5:1 on cream.');
    brandCss += `:root{--c-brand-fill:${brand};--c-brand-fill-hover:${fillHover};--c-on-brand:${onFill};--c-brand-accent:${accentLarge}}`;
    /* Every rule that paints a background with the brand shade gets the fill color, and its text the matching color. */
    const fillProps = /^(background|background-color|--btn-bg|--btn-bd)\s*:/;
    const usesBrandShade = (v) => /var\(--c-brand-(strong|hover)\)/.test(v);
    const toFill = (d) => d.replace(/var\(--c-brand-strong\)/g, 'var(--c-brand-fill)').replace(/var\(--c-brand-(hover|deep)\)/g, 'var(--c-brand-fill-hover)');
    /* Two passes, so the cascade stays as written: pass 1 finds the selectors whose background uses the brand shade;
       pass 2 re-emits, in source order, those rules with the fill (and the matching text color) AND every later rule for
       the same selectors that resets background or color (like the desktop header phone going transparent). */
    const rules = (css, fn) => {
      let i = 0;
      while (i < css.length) {
        const open = css.indexOf('{', i); if (open === -1) break;
        const sel = css.slice(i, open).trim();
        let depth = 1, j = open + 1; while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
        const body = css.slice(open + 1, j - 1);
        if (sel.startsWith('@media') || sel.startsWith('@supports') || sel.startsWith('@container')) fn(sel, body, true);
        else if (!sel.startsWith('@') && !sel.startsWith(':root')) fn(sel, body, false);
        i = j;
      }
    };
    const declsOf = (body) => body.split(/;(?![^(]*\))/).map((d) => d.trim()).filter(Boolean);
    const fillDecls = (body) => declsOf(body).filter((d) => fillProps.test(d) && usesBrandShade(d));
    const norm = (sel) => sel.replace(/\s+/g, ' ');
    const filled = new Set();
    const collect = (css) => rules(css, (sel, body, isAt) => { if (isAt) collect(body); else if (fillDecls(body).length) filled.add(norm(sel)); });
    const reset = /^(background|background-color|color|--btn-bg|--btn-bd|--btn-fg)\s*:/;
    const emit = (css) => {
      let out = '';
      rules(css, (sel, body, isAt) => {
        if (isAt) { const inner = emit(body); if (inner) out += `${sel}{${inner}}`; return; }
        if (!filled.has(norm(sel))) return;
        const decls = declsOf(body);
        const fills = decls.filter((d) => fillProps.test(d) && usesBrandShade(d));
        if (fills.length) {
          const sets = fills.map(toFill);
          if (decls.some((d) => /^--btn-fg\s*:/.test(d))) sets.push('--btn-fg:var(--c-on-brand)');
          sets.push('color:var(--c-on-brand)');
          out += `${sel}{${sets.join(';')}}`;
        } else {
          const keep = decls.filter((d) => reset.test(d));
          if (keep.length) out += `${sel}{${keep.join(';')}}`;
        }
      });
      return out;
    };
    const strip = (f) => readFileSync(join(ROOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const cssSite = strip('css/site.css'), cssPreview = strip('template/preview.css');
    collect(cssSite); collect(cssPreview);
    brandCss += emit(cssSite) + emit(cssPreview);
    brandCss += '.accent{color:var(--c-brand-accent)}.on-dark .accent{color:var(--c-brand-light)}';
    if (defaultGold) brandCss += `:root{--c-brand-strong:${navyText};--c-brand-deep:${navyText};--c-brand-hover:${navyText};--c-brand-accent:${navyText};--c-brand-light:${brand}}.logo-initial,.tpl-logo .logo-initial{color:${navyText}}.btn-primary,.tpl-pill,.tpl-pill span,.sb-call{text-shadow:0 1px 2px rgb(10 42 74 / .45)}.btn-primary .icon,.sb-call .icon,.pcard-badge .icon,.tpl-tile-icon .icon{filter:drop-shadow(0 1px 1px rgb(10 42 74 / .4))}`;
    brandCss += '.tpl-bento .tile.tone-main:not(.photo-tile) h3,.tpl-bento .tile.tone-main:not(.photo-tile) p,.tpl-bento .tile.tone-main:not(.photo-tile) .tile-sub{color:var(--c-on-brand)}'
      + '.tpl-bento .tile.tone-main:not(.photo-tile) .tile-arrow{background:rgb(255 255 255 / .4);color:var(--c-on-brand)}';
    brightReport = `fill ${brand} with ${onFill === '#FFFFFF' ? 'white' : 'navy'} text (${ratioHex(onFill, brand).toFixed(2)}:1), hover ${fillHover} (${ratioHex(onFill, fillHover).toFixed(2)}:1), headline words ${accentLarge} (${ratioHex(accentLarge, '#F6F3EF').toFixed(2)}:1 on cream, ${ratioHex(accentLarge, glow).toFixed(2)}:1 on the hero glow), small text ${deep} (${ratioHex(deep, '#F6F3EF').toFixed(2)}:1 on cream, ${ratioHex(deep, '#FFFFFF').toFixed(2)}:1 on white)`;
  }
}
if (navy) { const n = darkenUntil(navy, 7); brandCss += `:root{--c-navy:${n};--c-navy-2:${mix(n, 0.08)};--c-on-dark-soft:#E3E9F2}`; }
/* Second color (their logo's other color) for half the service cards. No second color: the navy. White text reads on both. */
{ const sc = second || (navy ? darkenUntil(navy, 7) : '#14213D');
  brandCss += `:root{--c-second:${darkenUntil(sc, 4.6)};--c-second-deep:${darkenUntil(sc, 7.5)};--c-second-rgb:${rgbStr(darkenUntil(sc, 4.6))};--c-second-tint:${mix(sc, 0.88)}}`; }
const brandColor = brand || '#E4572E';

/* Copy */
const hours = str(raw.hours);
const headerHours = str(raw.headerHours); // optional short label next to the header phone, e.g. "Call or text, 8am to 8pm"
const email = str(raw.email);
const tagline = str(raw.tagline);
const previewUrl = (str(raw.previewUrl) || `https://byw-${slug}.pages.dev/`).replace(/\/?$/, '/');
/* Link preview title: "Business Name | Main Service in City, ST". There is no og:site_name, because iMessage drops the
   part of the title that matches it. mainService overrides the trade default. */
const mainService = str(raw.mainService) || { hvac: 'HVAC Repair', plumbing: 'Plumbing Repair', both: 'Plumbing & HVAC Repair', electrical: 'Electrical Repair', roofing: 'Roof Repair', landscaping: 'Landscaping', general: 'Home Repair' }[trade];
const titleTag = `${name} | ${mainService} in ${city}, ${state}`;
/* Header: the mark (headerMark, else logoMark) beside the business name, with a small-caps line under it.
   An "&" in the name takes the brand color, like most trade logos. */
const logoTag = str(raw.logoTag) || tagline;
const logoNameHtml = esc(shortName).replace(/&amp;/g, '<span class="tpl-amp">&amp;</span>');
const logoTagHtml = esc(logoTag).replace(/ · /g, ' <span aria-hidden="true">·</span> ');
const fixLine = { hvac: 'If it heats or cools, we fix it fast.', plumbing: 'If it runs water, we fix it fast.', both: 'If it heats, cools, or runs water, we fix it fast.' }[trade];
const leadAreas = areas.length === 0 ? city : areas.length <= 6 ? listWords(areas) : `${areas.slice(0, 6).join(', ')}, and ${areas.length - 6} more cities`;
const lead = str(raw.lead) || `Fast repair${upfront ? ' and honest, upfront pricing' : ''} for homes in ${leadAreas}. ${fixLine}`;
/* Two deliberate lines, like Pinwheel's, so the slim desktop hero card hugs the longer one */
/* The underlined part is short so it stays on one line on a 320px phone */
const defaultHeadline = trade === 'plumbing' ? `${esc('Plumbing done right,')}<br> ${esc('without')} <span class="accent">${esc('the runaround.')}</span>` : `${esc('A comfortable home,')}<br> ${esc('without')} <span class="accent">${esc('the runaround.')}</span>`;
/* Hero headline: headline, plus headlineAccent on its own line in the accent color with the underline. */
const heroHeadline = str(raw.headline) && str(raw.headlineAccent) ? `${esc(raw.headline)}<br> <span class="accent">${esc(raw.headlineAccent)}</span>` : str(raw.headline) ? esc(raw.headline) : defaultHeadline;
const servicesLead = str(raw.servicesLead) || `The same trained techs${upfront ? ' and the same upfront pricing' : ''} on every job, big or small.`;
const servicesHeadline = trade === 'plumbing' ? accent('One call for', 'every plumbing job.') : trade === 'both' ? accent('One call for heating,', 'air, and plumbing.') : accent('One call for', 'heating and cooling.');
const faviconText = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${brandColor}"/><text x="32" y="44" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="36" fill="#fff">${esc(initial)}</text></svg>`)}`;
/* Hero photo: heroPhoto (their own photo, e.g. the owner by the van) or the stock HVAC or plumbing photo.
   scripts/hero-images.py makes the banner sizes (whole photo, the page crops with object-fit) and og.jpg, cut from the
   same photo. Without Python and Pillow, the build falls back to the stock hero and the stock link image. */
const hp = raw.heroPhoto && typeof raw.heroPhoto === 'object' && str(raw.heroPhoto.src) ? raw.heroPhoto : null;
/* Stock heroes are Pinwheel's current photos (the old stock set is retired, CLAUDE.md): the two AC units beside a
   gray-sided home for HVAC, the orange-shirt plumber under the sink for plumbing. */
const stockHero = trade === 'plumbing'
  ? { files: [[480, 480], [768, 768], [1024, 1024], [1200, 1200]].map(([w, h]) => ({ file: `pinwheel-drains-hero-${w}x${h}.webp`, w, h })), dir: 'images/photos', og: 'images/og-plumbing.jpg',
      alt: 'Plumber in an orange shirt tightening a drain pipe under a bathroom sink', pos: ['62% 50%', '62% 45%', '62% 45%'] }
  : { files: [[480, 204], [768, 326], [1024, 434], [1600, 679], [2400, 1018]].map(([w, h]) => ({ file: `pinwheel-hero-${w}x${h}-full.webp`, w, h })), dir: 'images/photos', og: 'images/og-hvac.jpg',
      alt: 'Two gray outdoor A/C units on concrete pads beside a gray-sided home, with hydrangeas and a garden path', pos: ['52% 55%', '18% 50%', '0% 50%'] }; // Pinwheel's own crop: both units beside the desktop card
let hero = { ...stockHero, own: false };
if (hp) {
  const src = resolve(dirname(dataPath), str(hp.src));
  if (!existsSync(src)) fail('heroPhoto.src not found: ' + src);
  const cache = join(ROOT, 'scripts', '.cache', 'hero', slug);
  try {
    const out = JSON.parse(execFileSync('python3', [join(ROOT, 'scripts', 'hero-images.py'), '--src', src, '--out', cache, '--prefix', 'hero', '--og', join(cache, 'og.jpg'),
      '--og-focus-y', String(num(hp.ogFocusY) ?? 30), ...(str(hp.box) ? ['--box', str(hp.box)] : [])], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
    hero = { files: out.files, dir: 'images/hero', cacheDir: cache, og: join(cache, 'og.jpg'), alt: str(hp.alt) || `${name} owner by the work van`, pos: [str(hp.position) || '50% 30%', str(hp.positionDesktop) || '50% 25%', str(hp.positionWide) || '50% 20%'], own: true };
  } catch (e) {
    console.warn('note: the hero photo could not be processed (needs python3 and Pillow), so the stock hero is used.\n' + String(e.stderr || e.message).trim().split('\n').slice(-1)[0]);
  }
}
const heroBig = hero.files[hero.files.length - 1];
const heroData = {
  heroSrc: `${hero.dir}/${heroBig.file}`, heroW: heroBig.w, heroH: heroBig.h, heroAlt: hero.alt,
  heroSrcset: hero.files.map((f) => `${hero.dir}/${f.file} ${f.w}w`).join(', '),
  heroPosStyle: `--pos:${hero.pos[0]};--pos-d:${hero.pos[1]};--pos-w:${hero.pos[2]}`,
  ogAlt: (hp && str(hp.ogAlt)) || hero.alt,
};
/* Their real logo is the favicon when they have one. */
const faviconHref = markSrc || faviconText;
const faviconType = !markSrc || markExt === '.svg' ? 'image/svg+xml' : markExt === '.png' ? 'image/png' : markExt === '.webp' ? 'image/webp' : 'image/jpeg';

if (mapHtml) {
  const alt = areas.length > 1 ? `Map of ${countiesFull || 'the area'} showing the ${areas.length} cities we serve, with ${city} as home base. Opens Google Maps.`
    : `Map of ${city}${mapNearby.length ? ` and nearby ${listWords(mapNearby)}` : ''}, with ${city} as home base. Opens Google Maps.`;
  mapHtml = mapHtml.replace(`{{root}}scripts/.cache/preview-maps/${slug}.svg`, 'images/map/service-area.svg').replace('alt="ALT"', `alt="${esc(alt)}"`)
    .replace(/<span class="svc-hq-mark"><svg><use href="#logo-mark"\/><\/svg><\/span>/, markSrc ? `<span class="svc-hq-mark tpl-hq tpl-hq-logo"><img src="${markSrc}" alt="" width="32" height="32"></span>` : `<span class="svc-hq-mark tpl-hq">${esc(initial)}</span>`);
  if (/#logo-mark|\{\{/.test(mapHtml)) fail('Map partial still has a Pinwheel logo or template tag.');
}

/* ---------- Trust strip: 4 to 6 facts, never just one ---------- */
const licNum = (license.match(/(\d{5,})/) || [])[1] || '';
const trustItems = [];
/* A sub that continues the label ("from $149/year") stays on its line; any other sub gets its own smaller line. */
const tile = (t) => ({ ...t, hasSub: !!t.sub, subClass: t.sub ? (/^[a-z$]/.test(t.sub) ? 'tpl-tile-sub is-inline' : 'tpl-tile-sub') + (t.sub.length <= 20 ? ' tpl-nowrap' : '') : '' });
const addTrust = (icon, strong, sub = '') => trustItems.push(tile({ icon, strong, sub }));
/* The rating lives in the top strip and the reviews section only, so the trust row has no star item. */
if (license) addTrust('i-license', bonded ? 'Licensed & bonded' : 'Licensed', license);
if (insured) addTrust('i-shield', 'Insured');
if (since) addTrust('i-home-heart', `Serving ${city} since ${since}`);
else if (hasYears) addTrust('i-home-heart', `${years} years local`, `Serving ${city} since ${year - years}`);
else if (hasTradeYears) addTrust('i-wrench', `${yearsInTrade} years in the trade`, 'Experienced hands, new name');
if (secondOpinion) addTrust('i-eye', 'Free second opinions');
if (upfront) addTrust('i-tag', 'Upfront pricing');
if (warranty) addTrust('i-guarantee', 'Warranty', warranty);
else if (guarantee) addTrust('i-guarantee', 'Satisfaction guarantee', 'We make it right');
if (trustItems.length < 4 && !trustItems.some((t) => t.strong.includes(city))) addTrust('i-map-pin', `Based in ${city}`);
/* "trust" in the data file replaces the automatic list: [{ "icon": "i-clock", "strong": "24/7 emergency service", "sub": "" }] */
const customTrust = arr(raw.trust).filter((t) => t && str(t.strong)).map((t) => tile({ icon: str(t.icon) || 'i-check-circle', strong: str(t.strong), sub: str(t.sub) }));
const trust = (customTrust.length ? customTrust : trustItems).slice(0, 6);
if (trust.length < 3) console.warn(`note: the trust strip has only ${trust.length} fact(s). Add license, bonded, since, or other verified facts to reach at least 3.`);

/* ---------- Reviews ---------- */
/* Fewer than 3 real Google reviews: 3 sample cards so the owner sees how theirs will look, each tagged "Sample".
   Sample reviews are for the preview only and never go on a live site. */
const SAMPLE = {
  hvac: [['Maria G.', 'Our AC quit on a hot afternoon. The tech found the problem fast, showed us the price first, and had it cooling again the same visit.'],
    ['James T.', 'Quick furnace tune-up and a clear explanation of what he checked. Good to have someone local we can call.'],
    ['Linda K.', 'Honest advice. They told us a repair would do instead of pushing a new system.']],
  plumbing: [['Maria G.', 'Kitchen drain backed up the night before a family dinner. They came out, cleared it, and cleaned up after.'],
    ['James T.', 'Our water heater died on a Monday and they had a new one in by the next day. Fair price, explained up front.'],
    ['Linda K.', 'Found the leak without tearing up half the wall. Friendly and on time.']],
  both: [['Maria G.', 'Our AC quit on a hot afternoon. The tech found the problem fast, showed us the price first, and had it cooling again the same visit.'],
    ['James T.', 'Our water heater died on a Monday and they had a new one in by the next day. Fair price, explained up front.'],
    ['Linda K.', 'Honest advice. They told us a repair would do instead of pushing a new system.']],
  electrical: [['Maria G.', 'Breaker kept tripping in the kitchen. They found a bad outlet, fixed it, and explained what happened.'],
    ['James T.', 'Panel upgrade went smoothly. They pulled the permit and kept us posted the whole way.'],
    ['Linda K.', 'On time, careful in the house, and the price matched the quote.']],
  roofing: [['Maria G.', 'Found the leak after the first big storm and patched it the same week. No pressure to replace the whole roof.'],
    ['James T.', 'New roof done in two days and the yard was cleaner than before they started.'],
    ['Linda K.', 'Clear quote, good communication, and they showed us photos of the work.']],
  landscaping: [['Maria G.', 'Our backyard went from dirt to a place we actually use. They listened to what we wanted.'],
    ['James T.', 'Fixed our sprinkler system and our water bill went down. Quick and friendly.'],
    ['Linda K.', 'Reliable every week and the yard always looks sharp.']],
  general: [['Maria G.', 'Knocked out a whole list of small jobs in one visit. Fair price and tidy work.'],
    ['James T.', 'Showed up when they said they would and explained everything before starting.'],
    ['Linda K.', 'Easy to reach, friendly, and the work held up.']],
};
const sampleReviews = isNew ? SAMPLE[trade].map(([n, quote]) => ({ name: n, quote, initial: n.charAt(0), hue: hueOf(n) })) : [];
if (established && reviews.length >= 3 && reviews.length < 6) console.warn(`note: ${reviews.length} review quotes. The reviews auto-advance best with 6 or more real Google reviews, word for word.`);
if (established && reviews.length < 3) console.warn(`note: ${reviews.length} review quote(s) in the data file. Add 3 short real Google reviews, word for word, so the reviews section shows them.`);

/* ---------- FAQ: their own answers, or defaults for their trade filled from their facts ---------- */
/* Every default answer is either true from the data file or general advice. Questions whose answer needs a fact
   we do not have are left out. */
const stateName = { CA: 'California', NV: 'Nevada', OR: 'Oregon', AZ: 'Arizona', WA: 'Washington', TX: 'Texas' }[state] || state;
const hoursSentence = hours ? (/^open\b/i.test(hours) ? `We're ${hours.charAt(0).toLowerCase()}${hours.slice(1)}` : `Our hours are ${hours}`).replace(/\.?$/, '.') : '';
const hasWaterHeaters = services.some((sv) => /water heater/i.test(sv.name + ' ' + sv.sub.join(' ')));
const areasAnswer = areas.length > 1 ? `We serve ${listWords(areas)}. Just outside? Call us. If we can get there fast, we'll come.` : `${city} and nearby. Just outside ${city}? Call us. If we can get there fast, we'll come.`;
const faqDefaults = () => {
  const out = [];
  const add = (q, a, ok = true) => { if (ok && a) out.push({ q, a }); };
  add('How fast can you get here?', `Call or text, and we'll give you an arrival window.${hoursSentence ? ' ' + hoursSentence : ''}`);
  add('Do you give second opinions?', "Yes, for free. Got a big quote from someone else? We'll take a look.", secondOpinion);
  if (hvacLike) {
    add('Should I repair or replace my system?', "We'll show you both options and the price of each, so you can decide.");
    add('How often should I get a tune-up?', 'A good rule of thumb is once a year for your AC in spring, and once for your furnace in fall.');
  }
  if (plumbingLike) {
    add('What should I do if a pipe bursts?', 'Shut off the main water valve, usually where the water line enters the house, then call us.');
    if (!hvacLike) add('Should I repair or replace my water heater?', "Most tank water heaters last 8 to 12 years. We'll show you both options and the price of each, so you can decide.");
  }
  if (trade === 'electrical') {
    add('When should I call an electrician?', 'If breakers keep tripping, outlets feel warm, or lights flicker, have it checked soon.');
    add('Do I need a permit?', 'Most panel upgrades, new circuits, and rewiring need a permit from your city.');
  }
  if (trade === 'roofing') {
    add('How long does a roof last?', 'Asphalt shingles usually last 20 to 30 years. Tile roofs often last 50 or more.');
    add('Should I repair or replace my roof?', "We'll show you both options and the price of each, so you can decide.");
  }
  if (trade === 'landscaping') {
    add('How often should I water my lawn?', 'About an inch of water a week, early in the morning, works for most lawns.');
    add('When is the best time to plant?', 'Fall and spring are best for most trees and shrubs.');
  }
  if (trade === 'general' && services.length) add('What jobs do you take on?', `We handle ${listWords(services.slice(0, 4).map((sv) => sv.nameLower))}.`);
  add('Are you licensed?', licNum ? `Yes. ${stateName} license #${licNum}.${bonded ? " We're licensed and bonded." : ''}` : `Yes. ${license}.`, !!license);
  add('Do you work on water heaters?', 'Yes, we repair and replace them.', hasWaterHeaters && !plumbingLike);
  add('What areas do you serve?', areasAnswer);
  return out;
};
const faqSource = raw.faq === false ? [] : faqs.length ? faqs : faqDefaults();
const faqList = faqSource.map((f, i) => ({ q: f.q, a: f.a, n: i + 1 }));

/* Claims that are on by default or marked unverified: listed after the build so they get confirmed with the owner. */
const confirmList = [...new Set([
  ...arr(raw.unverified).map(str).filter(Boolean),
  ...(insured && raw.insured === undefined ? ['Insured (on by default)'] : []),
  ...(upfront && raw.upfrontPricing === undefined ? ['Upfront pricing (on by default)'] : []),
  ...(guarantee && !warranty && raw.guarantee === undefined ? ['Satisfaction guarantee (on by default)'] : []),
])];

const proofHeadline = hasTradeYears ? accent('A new name,', `${yearsInTrade} years in the trade.`) : accent('Licensed, insured, and', 'close by.');
const hasProof = !!license || insured || hasTradeYears || !!warranty || hasOwner || areas.length > 1 || !!writeReviewUrl;
/* Same order as the page: what they do first, the proof after */
const menu = [
  services.length && { id: 'services', label: 'Services' },
  membership && { id: 'membership', label: membership.name },
  { id: 'how-it-works', label: 'How a visit works' },
  specials.length && { id: 'specials', label: 'Specials and discounts' },
  { id: 'reviews', label: 'Reviews' },
  isNew && hasProof && { id: 'proof', label: 'Why us' },
  hasOwner && { id: 'team', label: 'Meet the owner' },
  { id: 'estimate', label: prices.length ? 'Starting prices' : 'Quick quote' },
  financing && { id: 'financing', label: 'Financing' },
  faqList.length && { id: 'faq', label: 'FAQ' },
  areas.length && { id: 'areas', label: 'Service areas' },
  { id: 'request', label: 'Request a visit' },
].filter(Boolean);

/* ---------- Photo service cards, mascot, van, button gradient ---------- */
/* Each card: a photo on top, a round icon badge over its corner, the title, one short line, and a button.
   Photo: services[].photo (their own file), else a matching stock photo (each used once), else a neutral placeholder
   that says which photo goes there. Every photo spot is listed in prospects/photo-lists/NAME.md with an AI prompt. */
const PHOTOS = JSON.parse(readFileSync(join(ROOT, 'scripts', 'photos.json'), 'utf8'));
const STOCK = [[/water heater|tankless/i, 'pinwheel-water-heater'], [/heat pump|mini.?split|ductless/i, 'heat-pump'], [/air quality|duct|filter|purif/i, 'pinwheel-air-quality'], [/leak/i, 'leak'],
  [/drain|sewer|clog|rooter/i, 'pinwheel-drains'], [/repip|pipe|re-pipe/i, 'pipes'], [/heat|furnace|boiler/i, 'pinwheel-heating'], [/cool|\bac\b|a\/c|air cond/i, 'thermostat'], [/plumb/i, 'pinwheel-drains']];
const PROMPT = (svc) => `Realistic photo for a home service website card about "${svc}": the finished work or the equipment in a clean, bright California home, natural daylight, eye level, 4:3. No people, no logos, no brand names, no text.`;
const photoList = [];
const usedStock = new Set();
const ownPhotos = [];
for (const [i, sv] of services.entries()) {
  const own = arr(raw.services)[i] && typeof raw.services[i] === 'object' ? raw.services[i].photo : undefined;
  sv.line = sv.blurb || sv.sub.slice(0, 3).join(', ');
  sv.cta = 'Get a quote';
  if (own && own !== false) {
    const ext = extname(String(own)).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) fail(`services[${i}].photo must be a .jpg, .png, or .webp file`);
    const to = `images/services/${sv.anchor}${ext}`;
    ownPhotos.push([String(own), to]);
    sv.photoHtml = `<div class="pcard-photo"><img src="${to}" width="720" height="540" alt="${esc(str(raw.services[i].photoAlt) || sv.name)}" loading="lazy" decoding="async"></div>`;
    photoList.push({ spot: `Service card: ${sv.name}`, now: `Their photo (${own})`, source: 'Supplied by the business', license: 'Theirs', prompt: PROMPT(sv.name) });
    continue;
  }
  /* The service name decides first (a "Heating" card with heat pumps in its list is still heating), then its sub-services.
     Stock card photos are Pinwheel's current ones (scripts/photos.json); the old stock set is retired (CLAUDE.md). */
  const pick = (text) => { for (const [re, k] of STOCK) if (re.test(text)) { if (k === null) return null; if (!usedStock.has(k)) return k; } return undefined; };
  let key = own === false ? null : pick(sv.name);
  if (key === undefined) key = pick(sv.sub.join(' '));
  if (key === undefined) key = null;
  if (key) {
    usedStock.add(key);
    const ph = PHOTOS[key];
    sv.photoHtml = `<div class="pcard-photo"><img sizes="(min-width: 1000px) 285px, (min-width: 700px) 31vw, 46vw" src="images/photos/${key}-720x540.webp" srcset="images/photos/${key}-480x360.webp 480w, images/photos/${key}-720x540.webp 720w" width="720" height="540" alt="${esc(ph.alt)}" loading="lazy" decoding="async" style="object-position:${Math.round(ph.fp[0] * 100)}% ${Math.round(ph.fp[1] * 100)}%;background-color:${ph.color}"></div>`;
    photoList.push({ spot: `Service card: ${sv.name}`, now: ph.alt, source: `${ph.site}, photo by ${ph.by} (${ph.page})`, license: `${ph.site} License (free for commercial use)`, prompt: PROMPT(sv.name) });
  } else {
    sv.photoHtml = `<div class="pcard-photo is-placeholder"><span>Photo: ${esc(sv.name.toLowerCase())}</span></div>`;
    photoList.push({ spot: `Service card: ${sv.name}`, now: 'Placeholder (labeled)', source: 'None yet', license: 'n/a', prompt: PROMPT(sv.name) });
  }
}
if (services.length && services.length < 3) console.warn('note: fewer than 3 services. The photo cards look best with 4 or 8.');
/* serviceCards: "photo" (the default) or "tiles" (the older bento tiles). A site with a finishing pass written for the
   tiles (prospects/finish/NAME.mjs) keeps them until that pass is updated and the data file says "photo". */
const finishPass = existsSync(join(ROOT, 'prospects', 'finish', `${slug}.mjs`));
let serviceCards = str(raw.serviceCards).toLowerCase() || (finishPass ? 'tiles' : 'photo');
if (!['photo', 'tiles'].includes(serviceCards)) fail('serviceCards must be "photo" or "tiles"');
if (finishPass && !str(raw.serviceCards)) console.warn(`note: ${slug} has a finishing pass written for the old service tiles, so it keeps them. Update prospects/finish/${slug}.mjs and set "serviceCards": "photo" to switch.`);

/* Mascot slot: an optional transparent PNG or SVG (mascot) that slides in at 2 or 3 spots with a small idle bob.
   mascotSpots picks the spots (hero, visit, request); all three by default. No mascot file: nothing shows. */
const mascot = str(raw.mascot);
const mascotExt = mascot ? extname(mascot).toLowerCase() : '';
if (mascot && !['.png', '.svg', '.webp'].includes(mascotExt)) fail('mascot must be a transparent .png, .webp, or .svg file');
let mascotW = 200, mascotH = 200;
if (mascotExt === '.png') { try { const b = readFileSync(resolve(dirname(dataPath), mascot)); mascotW = b.readUInt32BE(16); mascotH = b.readUInt32BE(20); } catch {} }
const spots = arr(raw.mascotSpots).length ? arr(raw.mascotSpots).map((x) => str(x).toLowerCase()) : ['hero', 'visit', 'request'];
for (const sp of spots) if (!['hero', 'visit', 'request'].includes(sp)) fail('mascotSpots can only use: hero, visit, request');

/* Van drive-in: "van": true (service areas) or { "section": "areas" | "how-it-works", "line": "...", "phone": false } */
const vanCfg = raw.van === true ? {} : raw.van && typeof raw.van === 'object' ? raw.van : null;
const vanSection = vanCfg ? (str(vanCfg.section) || 'areas') : '';
if (vanCfg && !['areas', 'how-it-works'].includes(vanSection)) fail('van.section must be "areas" or "how-it-works"');
const vanHtml = vanCfg ? vanBlock({ name: shortName, line: str(vanCfg.line) || logoTagFor(), phone: vanCfg.phone === false ? '' : phonePretty,
  mark: `<rect width="28" height="28" rx="7" fill="var(--c-brand-strong)"/><text x="14" y="20" text-anchor="middle" font-family="var(--ff-display)" font-weight="800" font-size="16" fill="#fff">${esc(initial)}</text>`,
  label: `A ${shortName} work van drives in and parks` }) : '';
function logoTagFor() { return str(raw.logoTag) || str(raw.tagline) || tradeLabel; }

/* Gradient main buttons: from a slightly lighter shade to the full brand color. The lift stops where the button text
   would drop under 3:1 on the lightest part (bold button text). */
const btnBase = (() => { const m = brandCss.match(/--c-brand-fill:(#[0-9A-F]{6})/i) || brandCss.match(/--c-brand-strong:(#[0-9A-F]{6})/i); return m ? m[1] : '#D1441C'; })();
const btnText = (brandCss.match(/--c-on-brand:(#[0-9A-F]{6})/i) || [, '#FFFFFF'])[1];
const ratioOf = (a, b) => { const [x, y] = [lum(toRgb(a)), lum(toRgb(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
let btnLift = 0; for (const f of [0.14, 0.12, 0.1, 0.08, 0.06, 0.04]) { if (ratioOf(btnText, mix(btnBase, f)) >= 3) { btnLift = f; break; } }
const btnReport = `buttons ${mix(btnBase, btnLift)} to ${btnBase}: text ${ratioOf(btnText, mix(btnBase, btnLift)).toFixed(2)}:1 at the lightest, ${ratioOf(btnText, btnBase).toFixed(2)}:1 at the full color`;
brandCss += `:root{--btn-lift:${Math.round(btnLift * 100)}%}`;

const data = {
  name, nameDot: /[.!?]$/.test(name) ? name : name + '.', shortName, tagline, initial, city, year, tel, phonePretty, previewUrl, titleTag, lead,
  metaDescription: str(raw.description) || `${name}: ${serviceSummary} for homeowners in ${areaSummary}. Call ${phonePretty}.`,
  headline: str(raw.headline) ? esc(raw.headline) : defaultHeadline, heroHeadline, servicesHeadline, servicesLead, pillHtml, ...heroData,
  logoNameHtml, logoNameLen: [...shortName].length, logoTag, logoTagHtml, hasHeaderMark: !!headerMarkSrc, headerMarkSrc,
  themeColor: navy ? darkenUntil(navy, 7) : '#14213D', pageCss: brandCss + pillCss, faviconHref, faviconType,
  heroPlumber: trade === 'plumbing',
  established, isNew, ratingText: rating !== null ? rating.toFixed(1) : '', reviewCount, starsLabel: rating !== null ? `Rated ${rating.toFixed(1)} out of 5` : '', starsFrac: rating !== null ? (rating / 5).toFixed(3) : 1, googleReviewsUrl, writeReviewUrl,
  reviews, hasReviews: reviews.length > 0, sampleReviews, hasSampleReviews: sampleReviews.length > 0, hasRatingLine: established && rating !== null,
  trust, trustCount: trust.length, hasTrust: trust.length > 0, secondOpinion, mapNearby,
  hasProof,
  proofHeadline, proofLead: `${name} is ${hasTradeYears ? 'new, but the hands are not' : 'local, licensed, and easy to reach'}. Here is what you can count on before you call.`,
  tradeYearsText: owner.name ? `${owner.name.split(' ')[0]} has been on the tools for ${yearsInTrade} years before opening ${shortName}.` : `Years of hands-on work before opening ${shortName}.`,
  ownerProof: owner.name ? `Owned and run by ${owner.name}, right here in ${city}.` : '', areaCountText,
  areas, areaChips, areaSummary, areaCount: areas.length, hasAreas: areas.length > 0, hasMap: !!mapHtml, mapHtml,
  areasLead: areas.length > 1 ? `Based in ${city} and serving ${areaCountText}, so a tech is never far away.` : `Based in ${city}, so a tech is never far away.`,
  areasNote: areas.length > 1 ? "Just outside these cities? Call us. If we can get there fast, we'll come." : `Just outside ${city}? Call us. If we can get there fast, we'll come.`,
  services, hasServices: services.length > 0, leadService: services.slice(0, 1), moreServices: services.slice(1), hasMoreServices: services.length > 1, serviceSummary,
  specials, hasSpecials: specials.length > 0,
  prices, hasPrices: prices.length > 0, quoteOptions: services.length ? quoteOptions : [], quoteStep2: services.length ? 2 : 1, quoteStep3: services.length ? 3 : 2,
  quoteError: services.length ? 'Pick a service, tell us what is going on, and add your mobile number.' : 'Tell us what is going on and add your mobile number.',
  estimateNav: prices.length ? 'Prices' : 'Quick quote',
  financing, hasFinancing: !!financing, membership, hasMembership: !!membership,
  owner, hasOwner, hasOwnerPhoto: hasOwner && !!ownerPhoto, ownerIllustration, ownerPhotoSrc: ownerPhoto ? `images/owner${ownerPhotoExt}` : '', ownerPhotoAlt: str(o.photoAlt) || `${owner.name}, ${owner.role.toLowerCase()} of ${name}`,
  team, promises, menu,
  faqs: faqList, hasFaqs: faqList.length > 0,
  locations, hasLocations: locations.length > 0, oneLocation: locations.length === 1,
  hasLogo: !!logo, logoSrc, logoW, logoH,
  hasTruck: !!truck, truckSrc: truck ? `images/truck${truckExt}` : '', truckW: truck ? num(truck.width) : '', truckH: truck ? num(truck.height) : '',
  truckAlt: truck ? (str(truck.alt) || `${name} work van`) : '',
  license, hasLicense: !!license, yearsInBusiness: years, hasYears, sinceYear: years ? year - years : '', yearsInTrade, hasTradeYears, showTradeYears: hasTradeYears && !hasYears,
  warranty, hasWarranty: !!warranty,
  insured, upfront, guarantee: guarantee || !!warranty,
  guaranteeLine: warranty ? `Warranty: ${warranty}` : guarantee ? "Satisfaction guarantee: if something's not right, we'll make it right." : '',
  hours, hasHours: !!hours, headerHours, hasHeaderHours: !!headerHours, email, hasEmail: !!email,
  htmlClass: `fs-${fontStyle}${edge === 'none' ? '' : ` edge-${edge}`}`, edgeClass: edge === 'none' ? '' : ' edge-top edge-bottom', fontPreloads,
  heroH1: str(raw.h1), tileCards: serviceCards === 'tiles',
  mascotSrc: mascot ? `images/mascot${mascotExt}` : '', mascotW, mascotH, mascotHero: !!mascot && spots.includes('hero'), mascotVisit: !!mascot && spots.includes('visit'), mascotRequest: !!mascot && spots.includes('request'),
  vanHtml, vanAreas: vanSection === 'areas' && areas.length > 0, vanVisit: vanSection === 'how-it-works' || (vanSection === 'areas' && !areas.length),
};

/* ---------- 2. Tiny template engine: {{a.b}} escaped, {{{raw}}}, {{#if}} {{else}} {{/if}}, {{#each}} {{this}} {{/each}}, {{> partial}} ---------- */
function get(ctx, path) {
  if (path === 'this') return ctx.this !== undefined ? ctx.this : ctx;
  let cur = ctx;
  for (const key of path.split('.')) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur === 'object' && key in cur) cur = cur[key];
    else if (cur.__parent) return get(cur.__parent, path);
    else return undefined;
  }
  return cur;
}
const truthy = (v) => Array.isArray(v) ? v.length > 0 : !!v;
function vars(s, ctx) {
  return s.replace(/\{\{\{([\w.@]+)\}\}\}/g, (m, p) => { const v = get(ctx, p); return v === undefined || v === null ? '' : String(v); })
          .replace(/\{\{([\w.@]+)\}\}/g, (m, p) => { const v = get(ctx, p); return v === undefined || v === null ? '' : esc(v); });
}
function splitElse(body) {
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    if (body.startsWith('{{#', i)) depth++;
    else if (body.startsWith('{{/', i)) depth--;
    else if (depth === 0 && body.startsWith('{{else}}', i)) return [body.slice(0, i), body.slice(i + 8)];
  }
  return [body, ''];
}
function expand(tpl, ctx) {
  let out = '', pos = 0;
  while (pos < tpl.length) {
    const open = tpl.indexOf('{{#', pos);
    if (open === -1) { out += vars(tpl.slice(pos), ctx); break; }
    out += vars(tpl.slice(pos, open), ctx);
    const head = tpl.slice(open).match(/^\{\{#(if|each) ([\w.@]+)\}\}/);
    if (!head) throw new Error('Bad block near: ' + tpl.slice(open, open + 40));
    let depth = 1, i = open + head[0].length, close = -1;
    while (i < tpl.length) {
      if (tpl.startsWith('{{#', i)) depth++;
      else if (tpl.startsWith('{{/', i)) { depth--; if (depth === 0) { close = i; break; } }
      i++;
    }
    if (close === -1) throw new Error('Unclosed block ' + head[0]);
    const closeEnd = tpl.indexOf('}}', close) + 2;
    const [yes, no] = splitElse(tpl.slice(open + head[0].length, close));
    const val = get(ctx, head[2]);
    if (head[1] === 'if') out += expand(truthy(val) ? yes : no, ctx);
    else if (Array.isArray(val) && val.length) out += val.map((item, idx) => expand(yes, { ...(item && typeof item === 'object' ? item : {}), this: item, __parent: ctx, '@index': idx })).join('');
    else out += expand(no, ctx);
    pos = closeEnd;
  }
  return out;
}

/* ---------- 3. Render ---------- */
/* Shared partials come from partials/ (the sprite); preview-only sections from template/ (e.g. {{> optional/specials}}).
   The sprite's Pinwheel logo symbols are dropped, so no preview carries another company's logo. */
const partial = (p) => {
  const file = existsSync(join(ROOT, 'template', p + '.html')) ? join(ROOT, 'template', p + '.html') : join(ROOT, 'partials', p + '.html');
  if (!existsSync(file)) throw new Error('Missing partial ' + p);
  let s = readFileSync(file, 'utf8').trim();
  if (p === 'sprite') s = s.replace(/\s*<!--[^>]*Logo mark[\s\S]*?-->/, '').replace(/\s*<symbol id="logo-mark[\s\S]*?<\/symbol>/g, '');
  return s;
};
const tpl = readFileSync(join(ROOT, 'template', 'homepage.html'), 'utf8').replace(/\{\{> ([\w/-]+)\}\}/g, (m, p) => partial(p));
/* Headlines in title case (template/COPY-PATTERNS.md): the hero headline and every section heading. */
let html = titleCaseHeadings(expand(tpl, data)).replace(/[ \t]*<!--[\s\S]*?-->\n?/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n\s*\n(\s*\n)+/g, '\n\n');
/* No two neighboring sections share a background (scripts/section-backgrounds.mjs). */
const bal = balanceSections(html); html = bal.html;
for (const w of bal.warnings) console.warn('note: ' + w);
const unfilled = html.match(/\{\{[^}]*\}\}/g);
if (unfilled) fail('Unfilled template tags: ' + [...new Set(unfilled)].join(' '));
if (/claude/i.test(html)) fail('The page mentions Claude. Remove that from the data file.');
if (/—/.test(html)) fail('The page contains an em dash. Replace it in the data file.');
/* Pinwheel's photos are the stock defaults; in a preview they are served as images/photos/stock-* so no file name says Pinwheel */
html = html.replace(/images\/photos\/pinwheel-/g, 'images/photos/stock-');
const pw = html.match(/.{0,60}(?:#logo-mark|Pinwheel).{0,60}/i); if (pw) fail('The page still has a Pinwheel name or logo in it: ' + pw[0]);
if (/(^|[^\w&])#1\b|\bnumber one\b|\bbest in\b/i.test(html)) fail('The page makes a "#1" or "best" claim. Remove it from the data file.');

/* ---------- 4. Copy only what the page uses ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const copy = (from, to = from) => { mkdirSync(dirname(join(OUT, to)), { recursive: true }); copyFileSync(join(ROOT, from), join(OUT, to)); return 1; };
const own = { 'css/preview.css': 'template/preview.css', 'css/preview-late.css': 'template/preview-late.css', 'js/preview.js': 'template/preview.js' };
let copied = 0;
const refs = new Set([...html.matchAll(/\b(src|href|poster|imagesrcset|srcset)="([^"]+)"/g)].flatMap((m) => m[2].startsWith('data:') ? [] : (/srcset/.test(m[1]) ? m[2].split(',') : [m[2]]).map((p) => p.trim().split(/\s+/)[0].split('?')[0])));
for (const ref of refs) {
  if (!ref || /^(https?:|tel:|sms:|mailto:|#|data:)/.test(ref) || ref.endsWith('.html') || ref.startsWith('images/logo') || ref.startsWith('images/header-mark') || ref.startsWith('images/hero/') || ref.startsWith('images/owner') || ref.startsWith('images/truck') || ref.startsWith('images/mascot') || ref.startsWith('images/services/') || ref === 'images/map/service-area.svg') continue;
  if (own[ref]) { copied += copy(own[ref], ref); continue; }
  if (ref.startsWith('images/photos/stock-')) { const from = ref.replace('images/photos/stock-', 'images/photos/pinwheel-'); if (!existsSync(join(ROOT, from))) fail('Referenced file is missing: ' + from); copied += copy(from, ref); continue; }
  if (!existsSync(join(ROOT, ref))) fail('Referenced file is missing: ' + ref);
  copied += copy(ref);
}
for (const f of readdirSync(join(ROOT, 'fonts'))) copied += copy(`fonts/${f}`);
for (const v of [...html.matchAll(/data-video="([^"]+)"/g)].map((m) => m[1])) for (const ext of ['mp4', 'webm']) if (existsSync(join(ROOT, `${v}.${ext}`))) copied += copy(`${v}.${ext}`);
/* Link-preview image: cut from the hero photo */
if (hero.own) {
  mkdirSync(join(OUT, 'images', 'hero'), { recursive: true });
  for (const f of hero.files) { copyFileSync(join(hero.cacheDir, f.file), join(OUT, 'images', 'hero', f.file)); copied++; }
  copyFileSync(hero.og, join(OUT, 'images', 'og.jpg')); copied++;
} else copied += copy(hero.og, 'images/og.jpg');
const copyOwn = (rel, to) => { const from = resolve(dirname(dataPath), rel); if (!existsSync(from)) fail('File not found: ' + from); mkdirSync(dirname(join(OUT, to)), { recursive: true }); copyFileSync(from, join(OUT, to)); copied++; };
if (logo) copyOwn(logo, logoSrc);
if (logoMark) copyOwn(logoMark, markSrc);
if (headerMark) copyOwn(headerMark, headerMarkSrc);
if (truck) copyOwn(str(truck.src), `images/truck${truckExt}`);
if (data.hasOwnerPhoto) copyOwn(ownerPhoto, data.ownerPhotoSrc);
if (mascot) copyOwn(mascot, data.mascotSrc);
for (const [from, to] of ownPhotos) copyOwn(from, to);
if (mapHtml) {
  let svg = readFileSync(mapSvgFile, 'utf8');
  if (mapColors) for (const [a, b] of mapColors) svg = svg.split(a).join(b);
  /* Route badges that land on a county name in the top corners are dropped, so nothing on the map overlaps. */
  const labels = [...svg.matchAll(/<text x="([\d.]+)" y="30"( text-anchor="end")?>([^<]+)<\/text>/g)].map((m) => { const w = m[3].length * 9.9; const x = +m[1]; return m[2] ? [x - w, x] : [x, x + w]; });
  svg = svg.replace(/<g transform="translate\(([\d.]+) ([\d.]+)\)"><rect x="(-?[\d.]+)"[\s\S]*?<\/g>/g, (g, x, y, rx) => {
    const half = -rx + 8;
    return +y < 52 && labels.some(([a, b]) => +x + half > a && +x - half < b) ? '' : g;
  });
  mkdirSync(join(OUT, 'images', 'map'), { recursive: true });
  writeFileSync(join(OUT, 'images', 'map', 'service-area.svg'), svg); copied++;
}
writeFileSync(join(OUT, 'index.html'), html);
/* /styles: the same hero in all five font styles, with their colors and buttons (noindex, not linked) */
const stylesHtml = makeStylesPage(html, { name, current: fontStyle, note: 'Homepage preview by Ben Young Web Design. Not linked from the preview.' });
if (/claude/i.test(stylesHtml) || /—/.test(stylesHtml)) fail('The styles page mentions Claude or has an em dash.');
writeFileSync(join(OUT, 'styles.html'), stylesHtml);
/* Photo list: every photo spot, what is there now, its source and license, and a ready-to-paste AI image prompt */
{
  const rows = [
    { spot: 'Hero banner', now: hero.alt, source: hero.own ? 'Their photo (heroPhoto)' : 'Stock (see credits in the main repo, scripts/photos.json)', license: hero.own ? 'Theirs' : 'Unsplash or Pexels License', prompt: `Realistic wide photo of ${hero.own ? 'the owner beside their work van' : 'a clean home exterior with the equipment this business services'} in ${city}, ${state}, morning light, 2:1. No logos except their own, no text.` },
    ...photoList,
    { spot: 'How a visit works (video poster)', now: 'Plumber tightening an outdoor faucet (stock video)', source: 'Pexels video', license: 'Pexels License', prompt: `Short 9 second clip of a technician's gloved hands finishing a repair at a ${trade === 'plumbing' ? 'sink' : 'furnace or AC unit'}, shallow depth of field. No logos, no faces.` },
    ...(data.hasOwner ? [{ spot: 'Meet the owner: owner portrait', now: data.hasOwnerPhoto ? 'Their photo' : `Illustrated placeholder (${ownerGender || 'man'}), "Your photo here"`, source: data.hasOwnerPhoto ? 'Supplied' : 'Drawn in the template', license: data.hasOwnerPhoto ? 'Theirs' : 'Owned', prompt: 'Use a real photo of the owner. Never AI, never a job-site photo.' }] : []),
    { spot: 'Request a visit: family photo', now: 'Family on a green couch (stock)', source: 'Pexels', license: 'Pexels License', prompt: 'Real stock only (people). A family relaxing at home in a bright living room.' },
    ...(mascot ? [{ spot: 'Mascot (hero, how it works, request)', now: mascot, source: 'Supplied', license: 'Theirs', prompt: 'Transparent PNG, the mascot facing left and right, about 600px tall.' }] : []),
  ];
  const md = `# Photo list: ${name}\n\nBuilt by scripts/build-preview.mjs. Every photo spot on the preview, what is there now, where it came from, and a ready-to-paste AI prompt for a better version.\nRules: people photos are real stock or theirs, never AI. Photos without people (equipment, homes, finished work) can be stock or AI-made.\n\n| Spot | Now | Source | License | AI prompt for a better version |\n|---|---|---|---|---|\n`
    + rows.map((r) => `| ${r.spot} | ${r.now} | ${r.source} | ${r.license} | ${r.prompt} |`).join('\n') + '\n';
  mkdirSync(join(ROOT, 'prospects', 'photo-lists'), { recursive: true });
  writeFileSync(join(ROOT, 'prospects', 'photo-lists', `${slug}.md`), md);
}
writeFileSync(join(OUT, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n/images/*\n  Cache-Control: public, max-age=604800\n');
writeFileSync(join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

const hidden = Object.entries({ 'service areas': data.hasAreas, map: data.hasMap, services: data.hasServices, specials: data.hasSpecials, 'starting prices (quick quote shown instead)': data.hasPrices, financing: data.hasFinancing, membership: data.hasMembership, 'meet the family': hasOwner, FAQ: data.hasFaqs, locations: data.hasLocations, logo: data.hasLogo, license: data.hasLicense, hours: data.hasHours, email: data.hasEmail })
  .filter(([, v]) => !v).map(([k]) => k);
console.log(`Built previews/${slug}/ (${copied} files copied).`);
console.log(`Mode: ${mode}${established ? '' : ' (sample review cards and the proof section)'}. Title: ${titleTag}`);
console.log(`Hero pill: desktop "${pillFull}" | 390 phone "${keep[best(358).ti]}" | 320 phone "${keep[base.ti]}"`);
if (hidden.length) console.log(`Left out because the data file has no value: ${hidden.join(', ')}.`);
console.log(`Hero photo: ${hero.own ? 'their own (heroPhoto), og.jpg cut from it' : 'stock ' + (trade === 'plumbing' ? 'Pinwheel plumber' : 'Pinwheel AC units') + ' (add heroPhoto for theirs)'}. Header: ${headerMarkSrc ? 'their mark' : 'initial'} + "${shortName}"${logoTag ? ` / "${logoTag}"` : ''}.`);
console.log(`Font style: ${fontStyle}. Edges: ${edge}. Van: ${vanSection || 'off'}. Mascot: ${mascot ? spots.join(', ') : 'off'}. ${btnReport}.`);
console.log(`Styles page: ${previewUrl}styles. Photo list: prospects/photo-lists/${slug}.md (${photoList.filter((r) => /Placeholder/.test(r.now)).length} placeholder card photo(s)).`);
console.log(`Section backgrounds: ${bal.order.join(' > ')}${bal.changes.length ? ` (changed: ${bal.changes.join('; ')})` : ''}.`);
console.log(`Trust row (${trust.length}): ${trust.map((t) => t.strong + (t.sub ? ` (${t.sub})` : '')).join(' | ')}`);
console.log(`Reviews: ${established ? `${data.ratingText} stars from ${reviewCount ?? '?'} Google reviews, ${reviews.length} quote(s) shown` : '3 sample cards, tagged Sample (preview only, never on a live site)'}. FAQ: ${faqList.length} questions${faqs.length ? '' : ' (trade defaults)'}.`);
if (brightReport) console.log(`Accent: ${brightReport}.`);
if (confirmList.length) console.log(`Confirm with the owner: ${confirmList.join(', ')}.`);
console.log(`Preview URL it expects: ${previewUrl}  (Cloudflare project name: byw-${slug})`);
