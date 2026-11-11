/*
  van.mjs: the outline work van for the van drive-in (css/alive.css, js/reveal.js).
  Drawn in the site's own colors through CSS variables, with the business name on the side.
  Used by scripts/build-preview.mjs (data file: "van": true) and, for Pinwheel, by `node scripts/van.mjs pinwheel`,
  which writes partials/van.html (then run node scripts/sync.mjs).
*/
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* name: big on the side. line: small caps line under it. phone: under that. mark: SVG markup for the door (28x28 at 0,0). */
export function vanSvg({ name, line = '', phone = '', mark = '', label }) {
  const len = [...name].length;
  const size = Math.min(31, Math.round(212 / (len * 0.6)));
  const lineSize = line.length > 30 ? 8.5 : 10;
  const wheel = (cx) => `<g class="van-wheel"><circle cx="${cx}" cy="160" r="25" fill="var(--c-navy)"/><circle cx="${cx}" cy="160" r="12" fill="#D9DFEA"/>`
    + [0, 72, 144, 216, 288].map((a) => { const r = (a * Math.PI) / 180; return `<line x1="${cx}" y1="160" x2="${(cx + Math.cos(r) * 11).toFixed(1)}" y2="${(160 + Math.sin(r) * 11).toFixed(1)}" stroke="var(--c-navy)" stroke-width="2.5" stroke-linecap="round"/>`; }).join('')
    + `<circle cx="${cx}" cy="160" r="3.2" fill="var(--c-navy)"/></g>`;
  return `<svg class="van" viewBox="0 0 440 196" width="440" height="196" role="img" aria-label="${esc(label || `${name} work van`)}">
  <g class="van-speed" stroke="var(--c-line-strong)" stroke-width="4" stroke-linecap="round"><line x1="-70" y1="64" x2="-14" y2="64"/><line x1="-96" y1="96" x2="-20" y2="96"/><line x1="-60" y1="128" x2="-12" y2="128"/></g>
  <ellipse cx="226" cy="186" rx="196" ry="7" fill="rgb(20 33 61 / .1)"/>
  <g class="van-body">
    <g stroke="var(--c-navy)" stroke-width="3" stroke-linecap="round"><line x1="56" y1="22" x2="232" y2="22"/><line x1="72" y1="22" x2="72" y2="30"/><line x1="216" y1="22" x2="216" y2="30"/><line x1="100" y1="17" x2="100" y2="22"/><line x1="130" y1="17" x2="130" y2="22"/><line x1="160" y1="17" x2="160" y2="22"/><line x1="190" y1="17" x2="190" y2="22"/><line x1="86" y1="17" x2="204" y2="17"/></g>
    <path d="M30 160Q20 160 20 150V44Q20 30 34 30H292Q304 30 312 38L354 90 398 98Q414 101 416 118L417 150Q417 160 407 160H384A30 30 0 0 0 324 160H136A30 30 0 0 0 76 160Z" fill="#fff" stroke="var(--c-navy)" stroke-width="4" stroke-linejoin="round"/>
    <path d="M22 114H415L416 126H22Z" fill="var(--c-brand-strong)"/>
    <path d="M266 42H300Q306 42 310 47L340 86Q342 90 337 90H266Q262 90 262 86V46Q262 42 266 42Z" fill="#E3F3FD" stroke="var(--c-navy)" stroke-width="3" stroke-linejoin="round"/>
    <line x1="256" y1="34" x2="256" y2="158" stroke="var(--c-navy)" stroke-width="2.5"/>
    <rect x="266" y="98" width="16" height="5" rx="2.5" fill="var(--c-navy)"/>
    <rect x="398" y="104" width="14" height="8" rx="3" fill="#FBBC04" stroke="var(--c-navy)" stroke-width="2"/>
    <rect x="394" y="146" width="26" height="9" rx="4" fill="var(--c-navy)"/>
    <text x="138" y="${size > 24 ? 74 : 70}" text-anchor="middle" font-family="var(--ff-display)" font-weight="800" font-size="${size}" letter-spacing="-.5" fill="var(--c-navy)">${esc(name)}</text>
    ${line ? `<text x="138" y="92" text-anchor="middle" font-family="var(--ff-body)" font-weight="700" font-size="${lineSize}" letter-spacing="1.6" fill="var(--c-brand-deep)">${esc(line.toUpperCase())}</text>` : ''}
    ${phone ? `<text x="138" y="108" text-anchor="middle" font-family="var(--ff-body)" font-weight="700" font-size="12.5" fill="var(--c-navy)">${esc(phone)}</text>` : ''}
    ${mark ? `<g transform="translate(274 128)">${mark}</g>` : ''}
  </g>
  ${wheel(106)}${wheel(354)}
</svg>`;
}

/* The van block: the van on a dashed road line. It drives in from the left when its section scrolls into view. */
export function vanBlock(opts) {
  return `<div class="tpl-van">\n  ${vanSvg(opts)}\n  <div class="tpl-van-road" aria-hidden="true"></div>\n</div>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === 'pinwheel') {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
  const html = `<!-- Van drive-in (per-site setting). Built by node scripts/van.mjs pinwheel. -->\n` + vanBlock({ name: 'Pinwheel', line: 'Heating · Air · Plumbing', phone: '(209) 555-0142',
    mark: '<svg width="28" height="28" viewBox="0 0 48 48"><use href="#logo-mark"/></svg>', label: 'A Pinwheel work van drives in and parks' });
  writeFileSync(join(ROOT, 'partials', 'van.html'), html + '\n');
  console.log('wrote partials/van.html');
}
