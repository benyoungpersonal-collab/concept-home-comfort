/* i18n-build.mjs: writes js/i18n/pw-es.js, the Spanish dictionary the EN / ES toggle loads.

     node scripts/i18n-build.mjs [extra-es-files.json ...]

   Merges any JSON files given on the command line into scripts/i18n/es.json (English key -> Spanish), keeps only
   keys the pages still use (scripts/i18n/strings.json from i18n-extract.mjs), adds the patterns for words scripts
   write on the fly, and stamps a version on the script tag in partials/head.html so phones load the new copy.
   Run node scripts/sync.mjs afterwards to copy the head partial into every page. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = (f) => join(ROOT, f);
const esFile = P('scripts/i18n/es.json');
const es = existsSync(esFile) ? JSON.parse(readFileSync(esFile, 'utf8')) : {};
for (const f of process.argv.slice(2)) Object.assign(es, JSON.parse(readFileSync(f, 'utf8')));
const strings = JSON.parse(readFileSync(P('scripts/i18n/strings.json'), 'utf8'));

const used = {}, missing = [];
for (const k of Object.keys(strings).sort()) { if (k in es) used[k] = es[k]; else missing.push(k); }
writeFileSync(esFile, JSON.stringify(Object.fromEntries(Object.keys(es).sort().map((k) => [k, es[k]])), null, 1) + '\n');

/* Words scripts write on the fly: dates on the booking page, the review filter count, and price labels */
const patterns = `[
  [/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\\d{1,2})$/, function (m, mo, d) { return d + ' ' + { Jan: 'ene', Feb: 'feb', Mar: 'mar', Apr: 'abr', May: 'may', Jun: 'jun', Jul: 'jul', Aug: 'ago', Sep: 'sep', Oct: 'oct', Nov: 'nov', Dec: 'dic' }[mo]; }],
  [/^Showing (\\d+) reviews\\.$/, 'Mostrando $1 reseñas.'],
  [/^Showing (\\d+) (AC|heating|plumbing) reviews\\.$/, function (m, n, g) { return 'Mostrando ' + n + ' reseñas de ' + { AC: 'aire acondicionado', heating: 'calefacción', plumbing: 'plomería' }[g] + '.'; }],
  [/^(New AC|New furnace|New AC and furnace|New heat pump) for a home (under 1,500 sq ft|1,500 to 2,500 sq ft|2,500 to 3,500 sq ft|over 3,500 sq ft)$/, function (m, s, z) {
    return { 'New AC': 'Aire acondicionado nuevo', 'New furnace': 'Calefactor nuevo', 'New AC and furnace': 'Aire acondicionado y calefactor nuevos', 'New heat pump': 'Bomba de calor nueva' }[s] +
      ' para una casa de ' + { 'under 1,500 sq ft': 'menos de 1,500 pies cuadrados', '1,500 to 2,500 sq ft': '1,500 a 2,500 pies cuadrados', '2,500 to 3,500 sq ft': '2,500 a 3,500 pies cuadrados', 'over 3,500 sq ft': 'más de 3,500 pies cuadrados' }[z]; }],
  [/^(?:(.+), )?you picked (.+)\\.$/, function (m, n, p) { return (n ? n + ', ' : '') + 'eligió ' + p + '.'; }],
  [/^(?:(.+), )?your request is in\\.$/, function (m, n) { return (n ? n + ', ' : '') + 'recibimos su solicitud.'; }]
]`;
const body = `/* Spanish for the EN / ES toggle. Built by scripts/i18n-build.mjs from scripts/i18n/es.json. Do not edit by hand. */
window.PW_ES = ${JSON.stringify(used)};
window.PW_ES_PATTERNS = ${patterns};
`;
mkdirSync(P('js/i18n'), { recursive: true });
writeFileSync(P('js/i18n/pw-es.js'), body);
const v = createHash('sha1').update(body).digest('hex').slice(0, 8);
const head = readFileSync(P('partials/head.html'), 'utf8').replace(/(<script src="\{\{root\}\}js\/pw-i18n\.js\?v=[^"]*")(?: data-v="[^"]*")?/, `$1 data-v="${v}"`);
writeFileSync(P('partials/head.html'), head);
console.log(`js/i18n/pw-es.js: ${Object.keys(used).length} strings, ${(body.length / 1024).toFixed(0)} KB, version ${v}. Missing ${missing.length}.`);
if (missing.length) { writeFileSync(P('scripts/i18n/missing.json'), JSON.stringify(missing, null, 1) + '\n'); console.log('Untranslated keys are in scripts/i18n/missing.json'); }
