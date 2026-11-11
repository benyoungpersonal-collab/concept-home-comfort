/*
  bolt.mjs: Bolt, the Bright Bolt Electric mascot, drawn as inline SVG.
  An original design: a chunky lightning bolt with a face, big eyes, and a smile, in a yellow hard hat, with short
  arms in blue work gloves. No feet: his body ends in the sharp point of a lightning bolt. Flat brand colors, thick navy outline, sticker style.

  Every part is its own group so it can move on its own (css/bolt.css):
    .b-fig (whole body: bob and hop), .b-eyes (blink), .b-hat, .b-arm-l / .b-arm-r (wave, point, thumbs up),
    .b-spark (the small idle spark), .b-burst (the spark burst on tap).

  boltSvg({ left, right }) returns the SVG markup for one pose:
    right: 'wave' | 'thumb' | 'rest'      left: 'rest' | 'point'
*/
const Y = '#FFD60A', HAT = '#FFC21A', HAT_HI = '#FFE36B', NAVY = '#0B1F3A', BLUE = '#3FA9FF', CUFF = '#1C7FD9', CHEEK = '#FFB21A';
const SW = 6; // the navy outline

/* Gloves, drawn upright around (0,0), then placed at the hand with translate and rotate */
const cuff = `<rect x="-9" y="8" width="18" height="8" rx="3" fill="${CUFF}" stroke="${NAVY}" stroke-width="4"/>`;
const GLOVES = {
  open: `${cuff}<ellipse cx="-12" cy="1" rx="5" ry="8.5" transform="rotate(-28 -12 1)" fill="${BLUE}" stroke="${NAVY}" stroke-width="4"/>`
    + `<rect x="-11" y="-14" width="22" height="24" rx="10" fill="${BLUE}" stroke="${NAVY}" stroke-width="4"/>`
    + `<path d="M-3.6 -13v8M3.6 -13v8" stroke="${NAVY}" stroke-width="2.6" stroke-linecap="round"/>`,
  fist: `${cuff}<rect x="-11" y="-10" width="22" height="20" rx="9" fill="${BLUE}" stroke="${NAVY}" stroke-width="4"/>`
    + `<path d="M-4 -9.5v6M3 -9.5v6" stroke="${NAVY}" stroke-width="2.6" stroke-linecap="round"/>`,
  thumb: `${cuff}<rect x="-11" y="-8" width="22" height="18" rx="8" fill="${BLUE}" stroke="${NAVY}" stroke-width="4"/>`
    + `<rect x="-6" y="-25" width="10" height="20" rx="5" fill="${BLUE}" stroke="${NAVY}" stroke-width="4"/>`
    + `<path d="M-11 0h8M-11 5h8" stroke="${NAVY}" stroke-width="2.6" stroke-linecap="round"/>`,
  point: `${cuff}<rect x="-5" y="-31" width="9" height="22" rx="4.5" fill="${BLUE}" stroke="${NAVY}" stroke-width="4"/>`
    + `<rect x="-11" y="-10" width="21" height="20" rx="9" fill="${BLUE}" stroke="${NAVY}" stroke-width="4"/>`
    + `<path d="M-3 -9.5v6M3.5 -9.5v6" stroke="${NAVY}" stroke-width="2.6" stroke-linecap="round"/>`,
};
/* Sticker border: a white copy of every outlined shape sits underneath, so Bolt reads on navy and on photos */
const white = (s, w, to) => s.replace(new RegExp(`stroke="${NAVY}" stroke-width="${w}"`, 'g'), `stroke="#fff" stroke-width="${to}"`);
const glove = (kind, x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})">${white(GLOVES[kind], 4, 11)}${GLOVES[kind]}</g>`;
/* A short sleeve-less arm: navy outline stroke with a yellow core, shoulder to hand */
const arm = (d) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${NAVY}" stroke-width="15" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${Y}" stroke-width="7" stroke-linecap="round"/>`;

const ARMS = {
  r: {
    wave: { cls: 'b-wave', svg: arm('M138 100 Q156 92 163 74') + glove('open', 166, 62, 12) },
    thumb: { cls: 'b-thumb', svg: arm('M138 100 Q158 106 168 92') + glove('thumb', 170, 84, 0) },
    rest: { cls: '', svg: arm('M140 102 Q156 110 158 124') + glove('fist', 159, 132, -10) },
  },
  l: {
    rest: { cls: '', svg: arm('M60 124 Q46 134 40 146') + glove('fist', 37, 153, 18) },
    point: { cls: 'b-point', svg: arm('M60 124 Q44 136 32 140') + glove('point', 24, 144, -112) },
  },
};

const star = (cx, cy, r, extra = '') => `<path ${extra} d="M${cx} ${cy - r}L${cx + r * .29} ${cy - r * .29}L${cx + r} ${cy}L${cx + r * .29} ${cy + r * .29}L${cx} ${cy + r}L${cx - r * .29} ${cy + r * .29}L${cx - r} ${cy}L${cx - r * .29} ${cy - r * .29}Z" fill="${BLUE}" stroke="${NAVY}" stroke-width="2.5" stroke-linejoin="round"/>`;

export function boltSvg({ left = 'rest', right = 'wave' } = {}) {
  const L = ARMS.l[left], R = ARMS.r[right];
  const burst = [[-58, -40], [0, -70], [58, -40], [66, 14], [-66, 14], [-34, 52], [34, 52]]
    .map(([dx, dy], i) => star(110, 130, i % 2 ? 7 : 9, `class="b-b" style="--dx:${dx}px;--dy:${dy}px"`)).join('');
  return `<svg class="bolt-svg" viewBox="0 0 220 262" width="220" height="262" focusable="false" aria-hidden="true">`
    + `<g class="b-fig">`
    /* sticker border behind everything */
    + `<g fill="#fff" stroke="#fff" stroke-linejoin="round" stroke-linecap="round">`
    + `<path d="M62 58L160 58L128 128L168 128L86 248L104 152L56 152Z" stroke-width="${SW + 11}"/><path d="M64 60C64 24 158 24 158 60ZM52 59Q111 50 170 59Q173 69 161 69H61Q49 69 52 59Z" stroke-width="${SW + 11}"/></g>`
    /* the bolt body */
    + `<path class="b-body" d="M62 58L160 58L128 128L168 128L86 248L104 152L56 152Z" fill="${Y}" stroke="${NAVY}" stroke-width="${SW}" stroke-linejoin="round"/>`
    + `<path d="M118 134L154 134L96 222" fill="none" stroke="#FFF3A6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`
    /* face */
    + `<ellipse cx="71" cy="111" rx="6.5" ry="4.5" fill="${CHEEK}"/><ellipse cx="128" cy="110" rx="5.5" ry="4" fill="${CHEEK}"/>`
    + `<g class="b-eyes"><ellipse cx="86" cy="90" rx="12.5" ry="14.5" fill="#fff" stroke="${NAVY}" stroke-width="4.5"/><ellipse cx="119" cy="90" rx="12.5" ry="14.5" fill="#fff" stroke="${NAVY}" stroke-width="4.5"/>`
    + `<circle cx="89" cy="92" r="7" fill="${NAVY}"/><circle cx="122" cy="92" r="7" fill="${NAVY}"/><circle cx="91.5" cy="89" r="2.4" fill="#fff"/><circle cx="124.5" cy="89" r="2.4" fill="#fff"/></g>`
    + `<path d="M92 108Q104 124 116 108Q104 112 92 108Z" fill="${NAVY}" stroke="${NAVY}" stroke-width="3" stroke-linejoin="round"/>`
    /* hard hat */
    + `<g class="b-hat"><path d="M64 60C64 24 158 24 158 60Z" fill="${HAT}" stroke="${NAVY}" stroke-width="${SW}" stroke-linejoin="round"/>`
    + `<path d="M104 32Q111 29 118 32V58H104Z" fill="${HAT_HI}"/>`
    + `<path d="M86 37l-6 10h5l-3 8 9-11h-5l3-7z" fill="${BLUE}" stroke="${NAVY}" stroke-width="2" stroke-linejoin="round"/>`
    + `<path d="M52 59Q111 50 170 59Q173 69 161 69H61Q49 69 52 59Z" fill="${HAT}" stroke="${NAVY}" stroke-width="${SW}" stroke-linejoin="round"/></g>`
    /* arms */
    + `<g class="b-arm b-arm-l ${L.cls}">${L.svg}</g><g class="b-arm b-arm-r ${R.cls}">${R.svg}</g>`
    + `</g>`
    /* sparks: one small idle spark, and the burst for a tap */
    + `<g class="b-spark">${star(188, 34, 10)}${star(200, 58, 5)}</g>`
    + `<g class="b-burst">${burst}</g>`
    + `</svg>`;
}
