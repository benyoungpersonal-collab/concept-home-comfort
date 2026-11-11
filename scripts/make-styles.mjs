#!/usr/bin/env node
/*
  make-styles.mjs: the font style menu at /styles. The same hero in all five font styles (css/fonts.css), with the
  site's own colors and buttons, so Ben can show a client their options. noindex, and not linked from the site.

      node scripts/make-styles.mjs            Pinwheel: index.html -> styles.html (then node scripts/sync.mjs)

  scripts/build-preview.mjs uses makeStylesPage() to write previews/NAME/styles.html for every preview.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STYLES = [
  { key: 'clean', name: 'Clean', fonts: 'Plus Jakarta Sans ExtraBold headlines, Inter body' },
  { key: 'bold', name: 'Bold', fonts: 'Anton headlines in caps, Barlow body, Barlow Condensed caps for the nav, labels, and buttons' },
  { key: 'classic', name: 'Classic', fonts: 'Fraunces headlines, Inter body' },
  { key: 'rugged', name: 'Rugged', fonts: 'Rubik Dirt for the big headline, Rubik for everything else' },
  { key: 'friendly', name: 'Friendly', fonts: 'Lilita One headlines, Nunito body' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* html: a finished homepage. name: the business name. current: the style the site uses now. note: the footer line. */
export function makeStylesPage(html, { name, current = 'clean', note = '' }) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '')
    .replace(/<title>[^<]*<\/title>/, `<title>Font styles | ${esc(name)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="The ${esc(name)} homepage hero in five font styles.">`)
    .replace(/\n?<meta (property|name)="(og:[^"]*|twitter:[^"]*)" content="[^"]*">/g, '')
    .replace(/<link rel="preload" as="image"[^>]*>\n?/g, '');
  const htmlClass = ((html.match(/<html[^>]*class="([^"]*)"/) || [])[1] || '').split(/\s+/).filter((c) => c && !/^fs-/.test(c)).join(' ');
  const sprite = (html.match(/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" style="position:absolute;width:0[\s\S]*?<\/svg>/) || [''])[0];
  const heroSrc = html.match(/<section class="hero tpl-hero[\s\S]*?<\/section>/);
  if (!heroSrc) throw new Error('make-styles: no hero section found');
  const hero = (i) => heroSrc[0]
    .replace(/^<section ([^>]*?) ?aria-labelledby="hero-title"/, '<div $1')
    .replace(/<\/section>$/, '</div>')
    .replace(/<h1 class="([^"]*)">([\s\S]*?)<\/h1>/, '<p class="$1">$2</p>')
    .replace(/ id="hero-title"/g, '')
    .replace(/ data-hide-bar/g, '')
    .replace(/<div class="tpl-mascot[\s\S]*?<\/div>/g, '')
    .replace(/ data-eager/g, i === 0 ? ' data-eager' : '')
    .replace(/ fetchpriority="high"/g, i === 0 ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"');
  const blocks = STYLES.map((s, i) => `<section class="styles-block fs-${s.key}" aria-labelledby="st-${s.key}">
  <div class="container styles-label">
    <h2 id="st-${s.key}"><span>${i + 1}</span>${s.name}${s.key === current ? ' <em>On the site now</em>' : ''}</h2>
    <p>${esc(s.fonts)}</p>
  </div>
  ${hero(i)}
</section>`).join('\n');
  return `<!doctype html>
<html lang="en" class="${htmlClass} styles-html">
<head>${head.replace(/\s+$/, '')}
<style>
.styles-html { --section-y: 0px; }
.styles-page { background: #ECE7E0; }
.styles-top { padding: 28px 0 8px; }
.styles-top h1, .styles-label h2 { font-family: "Inter", system-ui, sans-serif; color: #14213D; letter-spacing: -.02em; text-transform: none; font-weight: 800; }
.styles-top h1 { font-size: clamp(1.5rem, 1.2rem + 1.4vw, 2.25rem); margin: 0 0 6px; }
.styles-top p, .styles-label p { margin: 0; font-family: "Inter", system-ui, sans-serif; font-size: 15px; color: #5A6275; text-transform: none; letter-spacing: 0; }
.styles-block { margin: 0 0 40px; background: var(--c-bg, #F6F3EF); }
.styles-label { padding: 22px 0 16px; }
.styles-label h2 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 22px; margin: 0 0 4px; }
.styles-label h2 span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: #14213D; color: #fff; font-size: 14px; }
.styles-label h2 em { font-style: normal; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: #E3F4EA; color: #16794C; letter-spacing: .02em; }
.styles-foot { padding: 8px 0 40px; font-family: "Inter", system-ui, sans-serif; font-size: 13px; color: #5A6275; }
</style>
</head>
<body class="styles-page">
${sprite}
<header class="container styles-top">
  <h1>Font styles for ${esc(name)}</h1>
  <p>The same homepage hero in all five styles, with your colors and buttons. Pick the one that sounds most like you.</p>
</header>
<main>
${blocks}
</main>
<footer class="container styles-foot"><p>${esc(note || "Ben Young Web Design")}</p></footer>
</body>
</html>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
  const out = makeStylesPage(readFileSync(join(ROOT, 'index.html'), 'utf8'), { name: 'Pinwheel Heating, Air & Plumbing', current: 'bold',
    note: 'Pinwheel is a sample site by Ben Young Web Design. Not linked from the site.' });
  writeFileSync(join(ROOT, 'styles.html'), out);
  console.log('Wrote styles.html (served at /styles). Not linked from any page and not in the sitemap.');
}
