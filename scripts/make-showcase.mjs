#!/usr/bin/env node
/*
  make-showcase.mjs: rebuilds showcase.html from index.html with every optional section turned on.
  Run it after editing the homepage, then run node scripts/sync.mjs:

      node scripts/make-showcase.mjs && node scripts/sync.mjs

  showcase.html is noindex (like every page here), is not linked from any page, and is not in the sitemap.
  It exists for walkthrough videos: each optional section carries an "Optional section" tag.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const must = (re, to) => { if (!re.test(html)) throw new Error('showcase: could not find ' + re); html = html.replace(re, to); };
must(/<title>[^<]*<\/title>/, '<title>Pinwheel showcase | every optional section on</title>');
must(/<meta name="description" content="[^"]*">/, '<meta name="description" content="The Pinwheel sample homepage with every optional section turned on: specials, instant estimate, Comfort Club, and financing. For walkthrough videos. Sample site by Ben Young Web Design.">');
must(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Pinwheel showcase | every optional section on">');
must(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="https://byw-home-comfort.netlify.app/showcase.html">');
must(/<body class="has-sticky-bar">/, '<body class="has-sticky-bar is-showcase">');
// a quiet note right under the header (outside the header partial, so sync leaves it alone)
must(/(<!-- \/partial:header -->\n)/, '$1<aside class="showcase-note" aria-label="About this page"><p><b>Showcase page.</b> Every optional section is on. The live sample homepage is index.html.</p></aside>\n');
// the membership and financing sections go where the homepage comment says they would
must(/  <!-- Optional sections: Comfort Club and Financing are OFF on this page\.[\s\S]*?-->\n/,
  '  <!-- Optional sections, all ON for the showcase -->\n  <!-- partial:optional-membership -->\n  <!-- /partial:optional-membership -->\n\n  <!-- partial:optional-financing -->\n  <!-- /partial:optional-financing -->\n');
// strip the JSON-LD so search engines never see a second copy of the business data
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n/, '');
writeFileSync(join(ROOT, 'showcase.html'), html);
console.log('Wrote showcase.html. Now run: node scripts/sync.mjs');
