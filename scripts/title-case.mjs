/*
  title-case.mjs: title case for headlines (template/COPY-PATTERNS.md, "Title case headlines").

  - titleCase(text): capitalize each word; small words (a, an, and, as, at, but, by, for, in, nor, of, on, or, per,
    the, to, vs, via) stay lowercase unless they come first, last, start a new sentence, or sit right before a
    comma or other punctuation ("Close By, So We Get There Fast."). Hyphenated words get each part capitalized.
    Words that already have a capital inside (EV, CA, iPhone) are left as they are. Only letter case changes.
  - titleCaseHtml(html): the same for a piece of HTML, keeping tags, entities, and {{template fields}} untouched.
  - titleCaseHeadings(html): applies it to every hero headline and section heading on a page: h1 (except the hero
    pill), h2, and .hero-h. Body text, eyebrows, labels, and buttons are not touched.
*/
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'vs', 'via']);
const WORD = /[A-Za-z][A-Za-z'’]*(?:-[A-Za-z][A-Za-z'’]*)*/g;

const capPart = (w) => (/[A-Z]/.test(w.slice(1)) ? w : w.charAt(0).toUpperCase() + w.slice(1));

/* plain: text with tags, entities, and template fields masked to same-length non-word characters */
function caseMap(plain) {
  const words = [...plain.matchAll(WORD)];
  const out = plain.split('');
  words.forEach((m, i) => {
    const w = m[0], at = m.index, end = at + w.length;
    const before = plain.slice(0, at).replace(/[\s"“'‘(\[#~]+$/, '');
    const after = plain.slice(end);
    const first = i === 0 || /[.:?!]$/.test(before);
    const last = i === words.length - 1 || /^[.:?!]/.test(after);
    const punct = /^[,;)]/.test(after);
    const lower = w.toLowerCase();
    let next;
    if (SMALL.has(lower) && !first && !last && !punct && w === lower) next = lower;
    else next = w.split('-').map(capPart).join('-');
    for (let k = 0; k < w.length; k++) out[at + k] = next[k];
  });
  return out.join('');
}

export function titleCase(text) { return caseMap(String(text)); }

export function titleCaseHtml(html) {
  const mask = html.replace(/<[^>]*>|&[#A-Za-z0-9]+;|\{\{[\s\S]*?\}\}/g, (m) => '#'.repeat(m.length));
  const cased = caseMap(mask);
  let out = '';
  for (let i = 0; i < html.length; i++) out += mask[i] === '#' ? html[i] : cased[i];
  return out;
}

export function titleCaseHeadings(html) {
  return html
    .replace(/(<h2\b[^>]*>)([\s\S]*?)(<\/h2>)/g, (m, a, b, c) => a + titleCaseHtml(b) + c)
    .replace(/(<h1\b(?![^>]*\b(?:hero-pill|tpl-pill)\b)[^>]*>)([\s\S]*?)(<\/h1>)/g, (m, a, b, c) => a + titleCaseHtml(b) + c)
    .replace(/(<p\b[^>]*\bclass="[^"]*\bhero-h\b[^"]*"[^>]*>)([\s\S]*?)(<\/p>)/g, (m, a, b, c) => a + titleCaseHtml(b) + c);
}

/* Command line: node scripts/title-case.mjs FILE... rewrites the headings in those HTML files in place. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let changed = 0;
  for (const f of process.argv.slice(2)) {
    const before = readFileSync(f, 'utf8'), after = titleCaseHeadings(before);
    if (after !== before) { writeFileSync(f, after); changed++; console.log('title case:', f); }
  }
  console.log(`${changed} file(s) changed.`);
}
