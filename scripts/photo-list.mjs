#!/usr/bin/env node
/*
  photo-list.mjs: writes PHOTO-LIST.md for Pinwheel. Every photo spot on the site, what is there now, its source and
  license, and a ready-to-paste AI image prompt for a better version (photos without people only; people stay real).

      node scripts/photo-list.mjs

  Homepage previews get their own list from scripts/build-preview.mjs (prospects/photo-lists/NAME.md).
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const photos = JSON.parse(readFileSync(join(ROOT, 'scripts', 'photos.json'), 'utf8'));
const SKIP = new Set(['partials', 'scripts', 'node_modules', '.git', 'fonts', 'images', 'css', 'js', 'template', 'previews', 'prospects', 'video', 'qa']);
const pages = (dir = ROOT) => readdirSync(dir).flatMap((n) => { const f = join(dir, n); return statSync(f).isDirectory() ? (SKIP.has(n) ? [] : pages(f)) : n.endsWith('.html') ? [f] : []; });

/* Photos with people in them: real stock or the client's own only, never AI. */
const PEOPLE = new Set(['owner-luis', 'tech-ray', 'tech-jess', 'plumber', 'couple', 'family-couch', 'dad-daughter', 'couple-home', 'crew-van', 'tech-door', 'family-baby', 'filter', 'cozy']);
const PROMPTS = {
  'pinwheel-hero': 'Wide photo of two clean gray outdoor AC condensers on concrete pads beside a light gray-sided California home, hydrangeas and a garden path, soft morning light, 2.4:1. No logos, no brand badges, no text.',
  thermostat: 'Close-up of a modern round smart thermostat on a white wall showing 72 degrees, soft daylight, shallow depth of field, 4:3. No brand names or logos.',
  'heat-pump': 'A ductless heat pump outdoor unit mounted beside a sunny stucco wall of a California home, clean install with a tidy line set cover, 4:3. No logos or brand names.',
  leak: 'Close-up of water dripping from a brass pipe fitting under a sink, dark background, a few drops in motion, 4:3. No logos.',
  pipes: 'New copper water pipes and PEX lines running neatly through an open wall during a whole-home repipe, warm work light, 4:3. No logos, no text.',
  turbines: 'Wind turbines on golden Altamont Pass hills at sunset, wide, 16:9. No text.',
  'stucco-home': 'White stucco Tracy, California home with a red clay tile roof and an arched entry on a sunny day, 3:2. No people, no text.',
  suburb: 'Aerial view of a sunny planned Central Valley neighborhood with tile roofs and backyards, 16:9. No text.',
};
const WATER_HEATER = 'A new white residential tank water heater installed in a clean, bright garage corner of a California home, copper lines and a yellow flex gas line, soft daylight, eye level, 4:3. No people, no logos, no brand names, no labels with text.';

const spots = new Map();
for (const f of pages()) {
  const rel = relative(ROOT, f).split(sep).join('/');
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<img\b[^>]*\sdata-photo="([^"]+)"[^>]*>/g)) {
    const key = m[1];
    if (!spots.has(key)) spots.set(key, new Set());
    spots.get(key).add(rel === 'styles.html' || rel === 'showcase.html' ? null : rel);
  }
}
const rows = [];
for (const [key, where] of spots) {
  const p = photos[key]; if (!p) continue;
  const pagesList = [...where].filter(Boolean).sort();
  if (!pagesList.length) continue;
  const source = p.site === 'Supplied' ? `Supplied by ${p.by}` : `${p.site}, photo by ${p.by}: ${p.page}`;
  const license = p.site === 'Unsplash' ? 'Unsplash License (free, commercial use)' : p.site === 'Pexels' ? 'Pexels License (free, commercial use)' : 'Owned';
  const prompt = PEOPLE.has(key) ? 'People photo: real stock or their own photo only, never AI. Techs in solid black, navy, red, or light-blue work shirts, real job settings, no other company logos, no gray tees.' : (PROMPTS[key] || 'Realistic photo of the same subject, no people, no logos, no text.');
  rows.push(`| ${p.use || key} | ${p.alt} | ${pagesList.join(', ')} | ${source} | ${license} | ${prompt} |`);
}
rows.push(`| Water heaters service card (home) | Icon panel, no photo yet (no stock water heater passed the photo rules) | index.html | None | n/a | ${WATER_HEATER} |`);
rows.push('| How a visit works video and poster (home) | Plumber tightening an outdoor faucet | index.html | Pexels video (see credits.html) | Pexels License | Short 9 second clip of a gloved hand finishing a repair on an outdoor AC unit or a water heater, shallow depth of field. No logos, no faces. |');
rows.push('| Link preview images (images/og-*.jpg) | Family and A/C unit crops with the Pinwheel logo | every page (og:image) | Cut from the photos above | Same as the photo | Not needed: made from the site photos. |');

const md = `# PHOTO-LIST.md: Pinwheel Heating, Air & Plumbing

Every photo spot on the Pinwheel sample site, what is there now, where it came from, and a ready-to-paste AI prompt for a better version.
Made by \`node scripts/photo-list.mjs\` (run it after photo changes). Credits for every stock photo are on credits.html, built from scripts/photos.json.

Rules: people photos are real free-license stock (Unsplash, Pexels) or the client's own, never AI. Photos without people (equipment, homes, finished work) can be stock or AI-made. If nothing good turns up, a live sample keeps its current photo; a new build gets a neutral placeholder labeled with what goes there.

| Spot | Now | Pages | Source | License | AI prompt for a better version |
|---|---|---|---|---|---|
${rows.join('\n')}
`;
writeFileSync(join(ROOT, 'PHOTO-LIST.md'), md);
console.log(`Wrote PHOTO-LIST.md (${rows.length} photo spots).`);
