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

/* Photos with people in them: real stock or the client's own only. AI may only change the color of their clothes. */
const PEOPLE = new Set(['owner-luis', 'tech-ray', 'tech-jess', 'pinwheel-drains', 'pinwheel-air-quality', 'couple', 'crew-van', 'tech-door', 'family-baby']);
const PROMPTS = {
  'pinwheel-water-heater': 'A new white residential tank water heater installed in a clean, bright garage corner of a California home, copper lines and a yellow flex gas line, soft daylight, eye level, 4:3. No people, no logos, no brand names, no labels with text.',
  'pinwheel-heating': 'Clean, bright photo of a modern gray residential gas furnace with white PVC vent pipes in a tidy garage utility closet, a tool bag on the floor beside it, soft daylight, 4:3. No people, no hands, no logos, no brand names, no labels with text.',
  'pinwheel-hero': 'Wide photo of two clean gray outdoor AC condensers on concrete pads beside a light gray-sided California home, hydrangeas and a garden path, soft morning light, 2.4:1. No logos, no brand badges, no text.',
  thermostat: 'Close-up of a modern round smart thermostat on a white wall showing 72 degrees, soft daylight, shallow depth of field, 4:3. No brand names or logos.',
  'heat-pump': 'A ductless heat pump outdoor unit mounted beside a sunny stucco wall of a California home, clean install with a tidy line set cover, 4:3. No logos or brand names.',
  leak: 'Close-up of water dripping from a brass pipe fitting under a sink, dark background, a few drops in motion, 4:3. No logos.',
  pipes: 'New copper water pipes and PEX lines running neatly through an open wall during a whole-home repipe, warm work light, 4:3. No logos, no text.',
  turbines: 'Wind turbines on golden Altamont Pass hills at sunset, wide, 16:9. No text.',
  'stucco-home': 'White stucco Tracy, California home with a red clay tile roof and an arched entry on a sunny day, 3:2. No people, no text.',
  suburb: 'Aerial view of a sunny planned Central Valley neighborhood with tile roofs and backyards, 16:9. No text.',
};
const PEOPLE_RULE = 'People photo: real stock or their own photo only. AI may only change the color of their clothes: on Pinwheel, techs wear the same orange. Real job settings, no other company logos.';

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
  const source = (p.site === 'Supplied' ? `Supplied by ${p.by}` : `${p.site}, photo by ${p.by}: ${p.page}`) + (p.edit ? ` (${p.edit.replace(/\.$/, '')})` : '');
  const license = p.site === 'Unsplash' ? 'Unsplash License (free, commercial use)' : p.site === 'Pexels' ? 'Pexels License (free, commercial use)' : 'Owned';
  const prompt = PEOPLE.has(key) ? PEOPLE_RULE : (PROMPTS[key] || 'Realistic photo of the same subject, no people, no logos, no text.');
  rows.push(`| ${p.use || key} | ${p.alt} | ${pagesList.join(', ')} | ${source} | ${license} | ${prompt} |`);
}
rows.push('| How a visit works video and poster (home) | Plumber tightening an outdoor faucet | index.html | Pexels video (see credits.html) | Pexels License | Short 9 second clip of a gloved hand finishing a repair on an outdoor AC unit or a water heater, shallow depth of field. No logos, no faces. |');
rows.push('| Link preview picture (images/og-share-DATE.jpg) | The homepage on a laptop and a phone, made by scripts/share-image.cjs | every page (og:image) | Screenshots of this site | Not needed | Not needed: no people, made from the live homepage. |');

const md = `# PHOTO-LIST.md: Pinwheel Heating, Air & Plumbing

Every photo spot on the Pinwheel sample site, what is there now, where it came from, and a ready-to-paste AI prompt for a better version.
Made by \`node scripts/photo-list.mjs\` (run it after photo changes). Credits for every stock photo are on credits.html, built from scripts/photos.json.

Rules:
- Photos with people are real stock photos (Unsplash, Pexels, free license) or the client's own. AI may only change the color of their clothes. Nothing else about a person or the scene is changed or generated.
- Photos without people (equipment, homes, finished work) can be stock or AI-made.
- On Pinwheel, techs wear the same orange.
- Exposure and white balance may be adjusted to match a set of photos (like the service cards), with no filters or color tints. The settings are in scripts/photos.json ("tone").
- If nothing good turns up, a live sample keeps its current photo; a new build gets a neutral placeholder labeled with what goes there.

| Spot | Now | Pages | Source | License | AI prompt for a better version |
|---|---|---|---|---|---|
${rows.join('\n')}
`;
writeFileSync(join(ROOT, 'PHOTO-LIST.md'), md);
console.log(`Wrote PHOTO-LIST.md (${rows.length} photo spots).`);
