/* i18n-extract.mjs: lists every English string on the Pinwheel pages, keyed the way js/pw-i18n.js keys them.

     node scripts/i18n-extract.mjs [http://127.0.0.1:4173/]

   Needs a local server on the repo root (python3 -m http.server 4173) and Playwright. Writes scripts/i18n/strings.json
   ({ key: [pages...] }), then reports which keys scripts/i18n/es.json does not translate yet.
   After translating, run node scripts/i18n-build.mjs to write js/i18n/pw-es.js. */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:4173/';
const SKIP_DIRS = new Set(['node_modules', 'samples', 'previews', 'template', 'prospects', 'mtz-hvac', 'bright-bolt-electric', 'sonnys-air-conditioning', 'sonnys-mechanical', 'workers', 'scripts', 'images', 'video', 'fonts', 'css', 'js', 'partials', 'qa']);
const SKIP_FILES = new Set(['showcase.html', 'membership.html', 'styles.html']); // older pages outside the playbook standard
const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (!SKIP_DIRS.has(f) && !f.startsWith('.')) walk(p); continue; }
    if (f.endsWith('.html') && !SKIP_FILES.has(relative(ROOT, p)) && readFileSync(p, 'utf8').includes('js/pw-i18n.js')) pages.push(relative(ROOT, p));
  }
})(ROOT);

const strings = {};
const add = (k, pg) => { (strings[k] ||= []).includes(pg) || strings[k].push(pg); };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
for (const pg of pages.sort()) {
  const p = await ctx.newPage();
  await p.goto(BASE + pg, { waitUntil: 'networkidle' });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 20)); } });
  const { text, attrs } = await p.evaluate(() => window.PWI18N.collect());
  [...text, ...attrs].forEach((k) => add(k, pg));
  await p.close();
}
await b.close();

/* Words the scripts write on the fly (not in the HTML at load) */
const extra = JSON.parse(readFileSync(join(ROOT, 'scripts/i18n/dynamic.json'), 'utf8'));
extra.strings.forEach((k) => add(k, '(script)'));

mkdirSync(join(ROOT, 'scripts/i18n'), { recursive: true });
writeFileSync(join(ROOT, 'scripts/i18n/strings.json'), JSON.stringify(strings, null, 1) + '\n');
const es = existsSync(join(ROOT, 'scripts/i18n/es.json')) ? JSON.parse(readFileSync(join(ROOT, 'scripts/i18n/es.json'), 'utf8')) : {};
const missing = Object.keys(strings).filter((k) => !(k in es));
writeFileSync(join(ROOT, 'scripts/i18n/missing.json'), JSON.stringify(missing, null, 1) + '\n');
console.log(`${pages.length} pages, ${Object.keys(strings).length} strings, ${missing.length} not translated yet (scripts/i18n/missing.json)`);
