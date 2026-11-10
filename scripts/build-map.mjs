#!/usr/bin/env node
/*
  build-map.mjs: draws a real service-area map from OpenStreetMap data, once, at build time.

      node scripts/build-map.mjs scripts/maps/pinwheel.json

  The config lists the cities (any order), the home-base city, and where to write files:
    { "cities": ["Tracy, CA", ...], "hq": "Tracy, CA", "hqLabel": "Home base",
      "svg": "images/map/NAME.svg", "partial": "partials/area-map.html", "alt": "..." }
  Optional: "nearby": ["Ceres, CA", "Denair, CA"] adds plain place names (no pin, no shading) for context,
  and "centerOnHq": true frames the map evenly around the home base instead of around all the cities.
  For a wide region: "pins": "hq" draws only the home-base pin (the other cities still frame the map and get shaded),
  "places": [{ "name": "Orange County", "lat": 33.7, "lon": -117.8 }] adds plain labels at fixed points (no lookup),
  "highways": "motorway|trunk" picks which roads to draw, and "zoom": 9 sets the Google Maps zoom.

  What it does:
  1. Finds each city with Nominatim (OpenStreetMap's search), one request per second.
  2. Fits a frame around the cities and pulls roads, rivers, canals, lakes, county lines,
     and city limits for that frame from the Overpass API.
  3. Renders a light SVG in the site's colors (no labels in the image, so it stays crisp
     and small) and an HTML partial with a pin and label for every city, Tracy as home
     base, a tap-through to Google Maps, and the "© OpenStreetMap contributors" credit.
  Labels are placed automatically to avoid collisions; "labelSide" in the config overrides one
  (r, l, t, b, tr, tl, br, bl).
  Responses are cached in scripts/.cache/, so a rebuild works offline and does not
  hit the OSM servers again. Delete the cache files to refresh the data.

  No API keys, no map script on the page. Node 18+. Data: © OpenStreetMap contributors (ODbL).
*/
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'scripts', '.cache');
const UA = 'BYW-service-map/1.0 (Ben Young Web Design; build-time render, cached)';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const cfgPath = process.argv[2];
if (!cfgPath) { console.error('Usage: node scripts/build-map.mjs scripts/maps/NAME.json'); process.exit(1); }
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
mkdirSync(CACHE, { recursive: true });

const C = { land: '#FBF8F4', served: '#F6E3D6', servedEdge: '#EDC9B3', water: '#CDE6F4', waterLine: '#9FCBE6', county: '#B9A994',
  motorCase: '#DDCDBA', motor: '#FFFFFF', trunkCase: '#E3D6C6', trunk: '#FFFFFF', primary: '#E6DACB', shield: '#14213D', countyText: '#9A8A76' };
const W = 800;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJSON(url, opts = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(opts.timeout || 60000), ...opts, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(`${res.status} from ${url}`);
  return res.json();
}

/* ---------- 1. Geocode ---------- */
const geoPath = join(CACHE, 'geocode.json');
const geo = existsSync(geoPath) ? JSON.parse(readFileSync(geoPath, 'utf8')) : {};
const nearbyQ = (cfg.nearby || []).filter((q) => !cfg.cities.includes(q));
for (const q of [...cfg.cities, ...nearbyQ]) {
  if (geo[q]) continue;
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`;
  const r = await getJSON(url);
  if (!r.length) throw new Error('Could not find ' + q);
  geo[q] = { lat: +r[0].lat, lon: +r[0].lon, county: r[0].address?.county || '', name: q.split(',')[0].trim() };
  writeFileSync(geoPath, JSON.stringify(geo, null, 1));
  await sleep(1100);
}
const cities = cfg.cities.map((q) => ({ ...geo[q], q, hq: q === cfg.hq }));
const nearby = nearbyQ.map((q) => ({ ...geo[q], q, hq: false, nearby: true }));
const framed = [...cities, ...nearby];

/* ---------- 2. Frame (Web Mercator) ---------- */
const mx = (lon) => (lon + 180) / 360;
const my = (lat) => { const s = Math.sin((lat * Math.PI) / 180); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); };
const ilon = (x) => x * 360 - 180;
const ilat = (y) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
let x0 = Math.min(...framed.map((c) => mx(c.lon))), x1 = Math.max(...framed.map((c) => mx(c.lon)));
let y0 = Math.min(...framed.map((c) => my(c.lat))), y1 = Math.max(...framed.map((c) => my(c.lat)));
const hqCity = cities.find((c) => c.hq);
if (cfg.centerOnHq && hqCity) { // the same reach on every side of the home base, so it sits in the middle
  const hx = mx(hqCity.lon), hy = my(hqCity.lat);
  const rx = Math.max(hx - x0, x1 - hx), ry = Math.max(hy - y0, y1 - hy);
  x0 = hx - rx * 1.15; x1 = hx + rx * 1.15; y0 = hy - ry * 1.15; y1 = hy + ry * 1.15;
}
const span = Math.max(x1 - x0, y1 - y0, 0.0004);
x0 -= span * 0.1; x1 += span * 0.1; y0 -= span * 0.09; y1 += span * 0.09;
// aspect between 1.25 and 1.6 (wide), centered
let aw = x1 - x0, ah = y1 - y0;
const target = Math.min(1.6, Math.max(1.25, aw / ah));
if (aw / ah > target) { const d = aw / target - ah; y0 -= d / 2; y1 += d / 2; } else { const d = ah * target - aw; x0 -= d / 2; x1 += d / 2; }
aw = x1 - x0; ah = y1 - y0;
const H = Math.round((W * ah) / aw);
const px = (lon) => ((mx(lon) - x0) / aw) * W;
const py = (lat) => ((my(lat) - y0) / ah) * H;
const bbox = [ilat(y1), ilon(x0), ilat(y0), ilon(x1)].map((v) => v.toFixed(4)); // s,w,n,e
const center = [ilat((y0 + y1) / 2), ilon((x0 + x1) / 2)];

/* ---------- 3. OSM data ---------- */
const B = bbox.join(',');
const query = `[out:json][timeout:150];(way["highway"~"^(${cfg.highways || 'motorway|trunk|primary'})$"](${B});way["waterway"~"^(river|canal)$"](${B});way["natural"="water"]["water"~"^(lake|reservoir|river)$"](${B});relation["boundary"="administrative"]["admin_level"="6"](${B});relation["boundary"="administrative"]["admin_level"="8"](${B}););out geom qt;`;
const osmPath = join(CACHE, 'osm-' + createHash('sha1').update(query).digest('hex').slice(0, 12) + '.json');
let osm;
if (existsSync(osmPath)) osm = JSON.parse(readFileSync(osmPath, 'utf8'));
else {
  let lastErr;
  for (const ep of OVERPASS) {
    try {
      console.log('Fetching OSM data from ' + new URL(ep).host + ' ...');
      osm = await getJSON(ep, { timeout: 90000, method: 'POST', body: 'data=' + encodeURIComponent(query), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      break;
    } catch (e) { lastErr = e; console.log('  ' + e.message); }
  }
  if (!osm) throw lastErr;
  writeFileSync(osmPath, JSON.stringify(osm));
}

/* ---------- 4. Geometry helpers ---------- */
const P = (g) => g.map((n) => [px(n.lon), py(n.lat)]);
const M = 12; // draw a little past the edge so strokes don't stop short
function clipSeg(a, b) { // Liang-Barsky against [-M, W+M] x [-M, H+M]
  let t0 = 0, t1 = 1; const dx = b[0] - a[0], dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] + M], [dx, W + M - a[0]], [-dy, a[1] + M], [dy, H + M - a[1]]]) {
    if (p === 0) { if (q < 0) return null; continue; }
    const r = q / p; if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
  }
  return [[a[0] + t0 * dx, a[1] + t0 * dy], [a[0] + t1 * dx, a[1] + t1 * dy]];
}
function clipLine(pts) {
  const out = []; let cur = null;
  for (let i = 1; i < pts.length; i++) {
    const s = clipSeg(pts[i - 1], pts[i]);
    if (!s) { if (cur) { out.push(cur); cur = null; } continue; }
    if (!cur) cur = [s[0], s[1]]; else cur.push(s[1]);
    if (s[1][0] !== pts[i][0] || s[1][1] !== pts[i][1]) { out.push(cur); cur = null; }
  }
  if (cur) out.push(cur);
  return out;
}
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let max = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b]; const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len; if (d > max) { max = d; idx = i; } }
    if (max > tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const f = (n) => (Math.round(n * 10) / 10).toString();
const dLine = (pts) => 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join('L');
const inView = (pts) => pts.some(([x, y]) => x > -M && x < W + M && y > -M && y < H + M);
function lines(ways, tol = 0.7, minLen = 4) {
  let d = '';
  for (const w of ways) for (const piece of clipLine(P(w.geometry))) {
    const s = simplify(piece, tol); let len = 0; for (let i = 1; i < s.length; i++) len += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
    if (s.length > 1 && len >= minLen) d += dLine(s);
  }
  return d;
}
function rings(members) { // join member ways into closed rings
  const segs = members.filter((m) => m.type === 'way' && m.geometry && (m.role === 'outer' || m.role === '')).map((m) => m.geometry.map((n) => [n.lon, n.lat]));
  const out = [];
  while (segs.length) {
    let ring = segs.shift();
    let grew = true;
    while (grew && (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])) {
      grew = false;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i], end = ring.at(-1);
        if (s[0][0] === end[0] && s[0][1] === end[1]) { ring = ring.concat(s.slice(1)); }
        else if (s.at(-1)[0] === end[0] && s.at(-1)[1] === end[1]) { ring = ring.concat(s.slice(0, -1).reverse()); }
        else continue;
        segs.splice(i, 1); grew = true; break;
      }
    }
    out.push(ring);
  }
  return out;
}
/* A closed ring starts and ends on the same point, which collapses Douglas-Peucker to nothing, so simplify it as two halves. */
const dPoly = (ring, tol) => {
  const pts = ring.map(([lon, lat]) => [px(lon), py(lat)]);
  const mid = Math.floor(pts.length / 2);
  const s = pts.length < 4 ? pts : [...simplify(pts.slice(0, mid + 1), tol), ...simplify(pts.slice(mid), tol).slice(1)];
  return s.length > 2 ? dLine(s) + 'Z' : '';
};

/* ---------- 5. Layers ---------- */
const els = osm.elements;
const ways = (fn) => els.filter((e) => e.type === 'way' && e.geometry && fn(e.tags || {}));
const servedNames = new Set(cities.map((c) => c.name.toLowerCase()));
let servedArea = '';
for (const r of els.filter((e) => e.type === 'relation' && e.tags?.admin_level === '8' && servedNames.has((e.tags.name || '').toLowerCase())))
  for (const ring of rings(r.members)) if (inView(ring.map(([lon, lat]) => [px(lon), py(lat)]))) servedArea += dPoly(ring, 0.6);
let water = '';
for (const w of ways((t) => t.natural === 'water')) {
  const pts = P(w.geometry); if (!inView(pts)) continue;
  let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity; for (const [x, y] of pts) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
  if ((maxx - minx) * (maxy - miny) < 6) continue;
  const s = simplify(pts, 0.6); if (s.length > 2) water += dLine(s) + 'Z';
}
const rivers = lines(ways((t) => t.waterway === 'river'), 0.7, 6);
const canals = lines(ways((t) => t.waterway === 'canal'), 0.8, 20);
const countyWays = new Map();
for (const r of els.filter((e) => e.type === 'relation' && e.tags?.admin_level === '6')) for (const m of r.members) if (m.type === 'way' && m.geometry) countyWays.set(m.ref, m);
const counties = lines([...countyWays.values()], 0.8, 6);
const motor = lines(ways((t) => t.highway === 'motorway'), 0.7, 3);
const trunk = lines(ways((t) => t.highway === 'trunk'), 0.7, 3);
const primary = lines(ways((t) => t.highway === 'primary'), 0.9, 8);

/* ---------- 6. Route shields (one per route, away from the pins) ---------- */
const pins = framed.filter((c) => cfg.pins !== 'hq' || c.hq || c.nearby).map((c) => ({ ...c, x: px(c.lon), y: py(c.lat) }));
const places = (cfg.places || []).map((c) => ({ ...c, x: px(c.lon), y: py(c.lat) }));
const shields = [];
const byRef = new Map();
for (const w of ways((t) => (t.highway === 'motorway' || t.highway === 'trunk') && t.ref)) {
  const ref = w.tags.ref.split(';')[0].trim();
  for (const piece of clipLine(P(w.geometry))) for (const p of piece) {
    if (p[0] < 30 || p[0] > W - 30 || p[1] < 24 || p[1] > H - 24) continue;
    if (!byRef.has(ref)) byRef.set(ref, []); byRef.get(ref).push(p);
  }
}
const refNum = (ref) => ref.replace(/^(I|US|CA|SR|State Route)[\s-]*/i, '');
for (const [ref, pts] of [...byRef.entries()].sort((a, b) => b[1].length - a[1].length)) {
  if (shields.some((s) => refNum(s.ref) === refNum(ref))) continue;
  let best = null, bestScore = -1;
  for (const p of pts) {
    const dPin = Math.min(...pins.map((c) => Math.hypot(c.x - p[0], c.y - p[1]) - (c.hq ? 40 : 0))); // home base has a big mark and a two-line label
    const dSh = shields.length ? Math.min(...shields.map((s) => Math.hypot(s.x - p[0], s.y - p[1]))) : 999;
    const score = Math.min(dPin, dSh * 1.2);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  if (best && bestScore > 46) shields.push({ ref, x: best[0], y: best[1] });
  if (shields.length >= 6) break;
}
const shieldSvg = shields.map((s) => { const n = refNum(s.ref); const w = 12 + n.length * 8; return `<g transform="translate(${f(s.x)} ${f(s.y)})"><rect x="${f(-w / 2)}" y="-10" width="${w}" height="20" rx="6" fill="${C.shield}"/><text y="4.5" text-anchor="middle">${n}</text></g>`; }).join('');

/* ---------- 7. County names in the top corners ---------- */
const countyNames = [...new Set(cities.map((c) => c.county).filter(Boolean))];
const pinsServed = pins.filter((c) => !c.nearby);
let countySvg = '';
if (countyNames.length === 2) {
  const avgX = (n) => { const cs = pinsServed.filter((c) => c.county === n); return cs.reduce((a, c) => a + c.x, 0) / cs.length; };
  const [left, right] = countyNames.sort((a, b) => avgX(a) - avgX(b));
  countySvg = `<text x="22" y="30">${left.toUpperCase()}</text><text x="${W - 22}" y="30" text-anchor="end">${right.toUpperCase()}</text>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${C.land}"/>
<path d="${servedArea}" fill="${C.served}" stroke="${C.servedEdge}" stroke-width="1"/>
<path d="${water}" fill="${C.water}"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="${canals}" stroke="${C.waterLine}" stroke-width="1" opacity=".8"/>
<path d="${rivers}" stroke="${C.waterLine}" stroke-width="2"/>
<path d="${counties}" stroke="${C.county}" stroke-width="1.4" stroke-dasharray="5 6"/>
<path d="${primary}" stroke="${C.primary}" stroke-width="1.6"/>
<path d="${trunk}" stroke="${C.trunkCase}" stroke-width="4.2"/><path d="${trunk}" stroke="${C.trunk}" stroke-width="2.2"/>
<path d="${motor}" stroke="${C.motorCase}" stroke-width="5.6"/><path d="${motor}" stroke="${C.motor}" stroke-width="3.2"/>
</g>
<g font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="700" letter-spacing="2" fill="${C.countyText}">${countySvg}</g>
<g font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" fill="#fff">${shieldSvg}</g>
</svg>
`;
writeFileSync(join(ROOT, cfg.svg), svg);

/* ---------- 8. Pins and labels (HTML, so they use the site's font and stay readable on phones) ---------- */
// Place labels at a phone-sized reference width; on wider screens everything spreads out.
const REF = 340, s = REF / W, FONT = 11;
const PAD = 8; // keep labels clear of other cities' dots so a label never reads as belonging to the wrong dot
const boxes = pins.map((c) => ({ x0: c.x * s - (c.hq ? 18 : PAD), y0: c.y * s - (c.hq ? 18 : PAD), x1: c.x * s + (c.hq ? 18 : PAD), y1: c.y * s + (c.hq ? 18 : PAD) }));
const overlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
// Greedy first pass, then a few passes that re-pick each label's side with every other label in place.
const SIDES = { r: 0, l: 0.5, b: 1, t: 1.5, br: 2, tr: 2.2, bl: 2.4, tl: 2.6 };
const labelBox = (c, side) => {
  const x = c.x * s, y = c.y * s, r = c.hq ? 19 : 9, d = c.hq ? 12 : 5;
  const tw = Math.max(c.name.length, c.hq ? (cfg.hqLabel || '').length * 0.85 : 0) * FONT * 0.6 + 4, th = c.hq ? 28 : 14;
  const o = { r: [x + r, y - th / 2], l: [x - r - tw, y - th / 2], b: [x - tw / 2, y + r - 2], t: [x - tw / 2, y - r - th + 2],
    br: [x + d, y + d], tr: [x + d, y - d - th], bl: [x - d - tw, y + d], tl: [x - d - tw, y - d - th] }[side];
  return { x0: o[0], y0: o[1], x1: o[0] + tw, y1: o[1] + th };
};
const costOf = (c, side) => {
  const bx = labelBox(c, side); let cost = SIDES[side];
  if (bx.x0 < 2 || bx.x1 > REF - 2 || bx.y0 < 2 || bx.y1 > H * s - 2) cost += 1000;
  for (const o of pins) if (o !== c && o.side) cost += overlap(bx, labelBox(o, o.side)) * 3;
  boxes.forEach((d, i) => { if (pins[i] !== c) cost += overlap(bx, d) * 2; });
  return cost;
};
// Config can lock a label to a side when the automatic choice reads badly: "labelSide": { "Manteca": "b" }
const locked = (c) => Boolean(cfg.labelSide?.[c.name]);
for (const c of pins) if (locked(c)) c.side = cfg.labelSide[c.name];
const order = [...pins].filter((c) => !locked(c) && !c.nearby).sort((a, b) => (b.hq - a.hq));
for (const c of order) c.side = Object.keys(SIDES).reduce((best, side) => (costOf(c, side) < costOf(c, best) ? side : best), 'r');
for (let pass = 0; pass < 4; pass++) for (const c of order) c.side = Object.keys(SIDES).reduce((best, side) => (costOf(c, side) < costOf(c, best) ? side : best), c.side);
for (const c of pins.filter((p) => !p.nearby)) { const k = costOf(c, c.side); if (k >= 20) console.log(`  note: label for ${c.name} overlaps something (cost ${Math.round(k)})`); }
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const pct = (v, of) => (Math.round((v / of) * 10000) / 100) + '%';
const gmaps = `https://www.google.com/maps/@?api=1&map_action=map&center=${center[0].toFixed(4)},${center[1].toFixed(4)}&zoom=${cfg.zoom || 10}`;
const pinHtml = pins.map((c) => c.nearby
  ? `    <span class="svc-place" style="left:${pct(c.x, W)};top:${pct(c.y, H)}">${esc(c.name)}</span>`
  : c.hq
  ? `    <span class="svc-pin is-hq" data-side="${c.side}" style="left:${pct(c.x, W)};top:${pct(c.y, H)}"><span class="svc-hq-mark"><svg><use href="#logo-mark"/></svg></span><span class="svc-pin-label"><strong>${esc(c.name)}</strong><small>${esc(cfg.hqLabel || '')}</small></span></span>`
  : `    <span class="svc-pin" data-side="${c.side}" style="left:${pct(c.x, W)};top:${pct(c.y, H)}"><span class="svc-pin-label">${esc(c.name)}</span></span>`)
  .concat(places.map((c) => `    <span class="svc-place svc-region" style="left:${pct(c.x, W)};top:${pct(c.y, H)}">${esc(c.name)}</span>`)).join('\n');
const partial = `<!-- Built by scripts/build-map.mjs from ${cfgPath.replace(/^.*scripts\//, 'scripts/')}. Edit the config and rebuild instead of editing this file. -->
<a class="svc-map" href="${esc(gmaps)}" target="_blank" rel="noopener">
  <img src="{{root}}${cfg.svg}" width="${W}" height="${H}" alt="${esc(cfg.alt || 'Map of the cities we serve. Opens Google Maps.')}" loading="lazy" decoding="async">
  <span class="svc-pins" aria-hidden="true">
${pinHtml}
  </span>
</a>
<p class="svc-map-credit">Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>. Tap the map to open Google Maps.</p>`;
writeFileSync(join(ROOT, cfg.partial), partial + '\n');
const kb = (Buffer.byteLength(svg) / 1024).toFixed(1);
console.log(`Wrote ${cfg.svg} (${W}x${H}, ${kb} KB) and ${cfg.partial} with ${pins.length - nearby.length} pins, ${nearby.length} plain labels, ${shields.length} route shields.`);
