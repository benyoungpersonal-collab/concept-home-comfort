/* pages-home.mjs: Pinwheel's homepage in the TEMPLATE-PLAYBOOK order.
   1 Hero (with the trust strip) · 2 Services · 3 Repair or Replace tap-through · 4 Projects · 5 Free quote (added by
   the shell, with the specials ribbon) · 6 Meet the Owner · 7 Reviews (dark band) · 8 Service area · 9 FAQ · footer.
   The shell adds the quote block at the end of every page; on the homepage it sits in slot 5, so the homepage turns
   the shell's copy off and places the block itself. */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { faqLd, hero, heroPreload, crumbLd, tag, ic } from './components.mjs';
import { homeHero, servicesBlock, explainer, projectsBlock, quoteBlock, ownerBlock, reviewsBand, areasBlock, homeFaq, HOME_FAQ, PROJECTS, BA_PAIR, baSlider } from './blocks.mjs';

const biz = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'business-ld.json'), 'utf8'));

export const home = (ph) => ({
  file: 'index.html', home: true, quote: false,
  title: 'Pinwheel Heating, Air &amp; Plumbing | AC &amp; Heating Repair in Tracy, CA',
  ogTitle: 'Pinwheel Heating, Air & Plumbing | AC & Heating Repair in Tracy, CA',
  desc: 'Heating, AC, and plumbing repair, tune-ups, and new systems in Tracy, Mountain House, Manteca, and 9 more cities. Licensed techs and a price before any work.',
  preload: [
    `<link rel="preload" as="image" data-photo="pinwheel-family-tall" data-crop="orig" data-widths="480,640,840" imagesizes="100vw" media="(max-width: 599px)" fetchpriority="high">`,
    `<link rel="preload" as="image" data-photo="pinwheel-family" data-crop="orig" data-widths="768,1024,1600,2400" imagesizes="100vw" media="(min-width: 600px)" fetchpriority="high">`,
  ],
  jsonld: [...biz, faqLd(HOME_FAQ)],
  body: (R) => [
    homeHero(R),
    servicesBlock(R),
    explainer(R),
    projectsBlock(R),
    quoteBlock(R, { page: 'index.html' }),
    ownerBlock(R),
    reviewsBand(R),
    areasBlock(R),
    homeFaq(R),
  ].join('\n\n'),
});

/* Projects: every photo, grouped by the same categories as the homepage cards. Tap any photo to see it bigger. */
export const projectsPage = (ph) => ({
  file: 'projects.html',
  title: 'Projects | AC, Furnace, Heat Pump &amp; Duct Work in Tracy, CA | Pinwheel',
  ogTitle: 'Our Projects in Tracy, CA',
  desc: 'Photos of AC installs, furnaces, heat pumps, mini-splits, and ductwork from Pinwheel Heating, Air & Plumbing in Tracy, CA.',
  preload: heroPreload(ph('pw-pj-ac-pair')),
  jsonld: [crumbLd('projects.html', [['Home', 'index.html'], ['Projects']])],
  body: (R) => [
    hero(R, { photo: ph('pw-pj-ac-pair'), crumbs: [['Home', 'index.html'], ['Projects']], pill: 'Installs and repairs around Tracy, CA',
      title: 'Our Work, <span class="accent">Old to New.</span>', lead: 'New AC units, furnaces, heat pumps, and ductwork from homes around Tracy. Tap any photo to see it bigger.', quoteService: 'New system' }),
    `  <section class="section bg-white pw-projects-page" id="before-after" aria-labelledby="ba-title">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Before and after</p>
        <h2 id="ba-title">Swipe to See <span class="accent">the After.</span></h2>
        <p class="lead">Same wall, same house: a 20-year-old AC next to the new one that replaced it. ${tag('AI-made sample photos')}</p>
      </div>
      <div class="pw-ba-wrap">${baSlider(BA_PAIR[0], BA_PAIR[1], ['', ''])}</div>
    </div>
  </section>`,
    ...PROJECTS.map((p, i) => `  <section class="section${i % 2 ? ' bg-white' : ''} pw-pjgroup" id="${p.key}" aria-labelledby="pj-${p.key}">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Projects</p>
        <h2 id="pj-${p.key}">${p.title}</h2>
      </div>
      <ul class="pw-pjgrid">
        ${p.photos.filter((k) => k !== 'pw-pj-ac-pair').map((k) => `<li data-reveal><button class="pw-pjgrid-item" type="button" data-zoom aria-label="See this photo bigger"><img data-photo="${k}" data-crop="4:3" data-widths="480,720,960" sizes="(min-width: 1000px) 380px, (min-width: 600px) 46vw, 92vw" alt=""></button></li>`).join('\n        ')}
      </ul>
    </div>
  </section>`),
  ].join('\n\n'),
});
