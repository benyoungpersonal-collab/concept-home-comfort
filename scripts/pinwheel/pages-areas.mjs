/* pages-areas.mjs: the Service Areas hub and one page per city with local details (not copy-paste).
   Sample data for a fictional business. */
import { hero, sec, reviewCard, faqSection, faqLd, club, bookCall, areasStrip, linkCards, serviceLd, crumbLd, heroPreload, ic, tag } from './components.mjs';
import { CITIES, REVIEWS, PHONE, SITE } from './site-data.mjs';

const CITY = {
  tracy: {
    photo: 'stucco-home', pill: 'Our home base since 2010', lead: 'Tracy has been our home base since 2010. Our shop is in town, so most calls here get a same-day visit, and you always see the price before we start.',
    seeLead: 'Every town wears out a home in its own way. Here is what we fix most often in Tracy.',
    features: [['i-wind', 'cool', 'Dusty outdoor coils', 'Afternoon wind off the Altamont packs outdoor coils with dust and dry grass. A yearly coil cleaning keeps your AC from working twice as hard in July.'], ['i-pipes', 'navy', 'Galvanized pipes downtown', 'Many older homes around downtown Tracy still have their original galvanized pipes. Low pressure and rusty water are the first signs it is time to repipe.'], ['i-thermometer', '', 'Boom-era equipment', 'Homes from the early 2000s building boom are running original equipment. Our repair-or-replace helper tells you if yours is worth fixing.'], ['i-waterheater', 'navy', 'Hard water', 'Tracy water leaves minerals at the bottom of the tank. A yearly flush can add years of life, and we can do it during any service visit.']],
    hoods: ['Downtown Tracy', 'Tracy Hills', 'Ellis', 'Redbridge', 'Edgewood', 'Fair Oaks Ranch', 'Gateway', 'Northgate', 'Tracy Presidio', 'Bridle Creek'],
    hoodsLead: 'From 1940s bungalows downtown to brand-new homes in Tracy Hills, our techs know the floor plans and the quirks.',
    homes: [['Older homes near downtown', 'Bungalows and post-war homes, often with galvanized pipes, wall furnaces, and small attic access.'], ['1990s and 2000s tracts', 'Two-story stucco homes with original AC and furnaces reaching 20 years old.'], ['New construction', 'Tracy Hills and Ellis homes with high-efficiency systems still under builder warranty.']],
    faq: [['Do you charge extra to come to Tracy?', 'No. Tracy is our home base, so pricing is the same everywhere in 95376, 95377, and 95304.'], ['Do you pull permits in Tracy?', 'Yes. We pull permits for new systems and water heaters and meet the inspector, so you do not have to.'], ['How fast can you get to my house?', 'Most Tracy calls get a same-day visit, often within a few hours.']],
  },
  'mountain-house': {
    photo: 'suburb', pill: 'About 15 minutes from our Tracy shop', lead: 'From Wicklund to The Lakes, we keep Mountain House cool, warm, and running. Our Tracy shop is about 15 minutes away, so most calls get a same-day visit.',
    seeLead: 'Mountain House homes are young, but the original equipment inside many of them is not.',
    features: [['i-thermometer', '', 'R-22 systems', 'Systems installed before 2010 usually run on R-22 refrigerant, which is no longer made. A leak on one of these gets expensive fast.'], ['i-home', 'cool', 'Warm upstairs rooms', 'One system for two floors means the upstairs runs warm. Duct balancing, zoning, or a small ductless unit evens it out.'], ['i-waterheater', 'navy', 'Original water heaters', 'Many original tanks are well past their expected life. We replace them the same day, with new seismic straps and a permit.'], ['i-shield', '', 'HOA-friendly installs', 'New equipment goes back in the original spot, with quiet outdoor units your neighbors will not notice.']],
    hoods: ['Wicklund', 'Bethany', 'Altamont', 'Questa', 'Cordes', 'Hansen', 'Lakeshore', 'College Park', 'Mustang', 'Prosperity'],
    hoodsLead: 'Our techs know the Mountain House floor plans, where the attic access hides, and which closets hold the water heater.',
    homes: [['Early villages', 'Wicklund, Bethany, and Altamont homes from the early 2000s with original systems near the end of their life.'], ['Two-story family homes', 'Most homes run both floors on one system, so the upstairs is the first to complain in July.'], ['Newer villages', 'Cordes and Hansen homes with newer, high-efficiency equipment that needs yearly care to keep its warranty.']],
    faq: [['Is my older system on R-22?', 'If it was installed before 2010, it likely uses R-22 refrigerant, which is no longer made. Repairs that need refrigerant get expensive fast, so a replacement quote is worth a look.'], ['Why is my upstairs so warm?', 'Heat rises, and many two-story homes run both floors off one system. Duct balancing, a zoning system, or a small ductless unit usually fixes it.'], ['Will you work with my HOA?', 'Yes. We keep new equipment in the original spot, choose quiet units, and give you any paperwork your association asks for.']],
  },
  manteca: {
    photo: 'manteca-hero', pill: 'Covered from our Manteca yard', lead: 'Our Manteca yard is right in town, so vans are rolling to Manteca homes by 7:30 every morning. Most calls get a same-day visit, and you see the price before we start.',
    seeLead: 'Manteca summers are long and hot, and a lot of homes here were built in the same few decades. These are the jobs we do most.',
    features: [['i-snowflake', 'cool', 'Summer AC strain', 'Manteca regularly sees 100-degree afternoons for weeks. Single-story homes with attic ducts lose a lot of cool air, so sealing the ducts often helps more than a bigger AC.'], ['i-thermometer', '', 'Aging 1990s systems', 'Many homes off Union Road and in the older tracts still run their first or second system. If yours is past 15 years, it is worth planning ahead.'], ['i-waterheater', 'navy', 'Hard water on tanks', 'Manteca water is hard, so sediment builds up fast. We flush tanks and add softeners for homes tired of spots and short-lived heaters.'], ['i-users', '', 'Comfort for retirees', 'In Del Webb and other 55-plus neighborhoods, we keep systems simple to use, with large-display thermostats and priority visits in heat waves.']],
    hoods: ['Del Webb at Woodbridge', 'Union Ranch', 'Curran Grove', 'Chadwick Square', 'Spreckels Park', 'Downtown Manteca', 'Lakeshore', 'Oakwood Shores'],
    hoodsLead: 'From the lakes on the south side to the older streets near downtown, our Manteca techs know the neighborhoods by name.',
    homes: [['Single-story stucco homes', 'Common across Manteca, with long attic duct runs that lose cool air in July.'], ['55-plus communities', 'Del Webb homes where reliable heat and cooling matter most, and simple controls help.'], ['Newer south Manteca homes', 'Two-story homes from the 2010s with high-efficiency systems and tankless water heaters.']],
    faq: [['How fast can you get to Manteca?', 'Our Manteca yard is in town, so most calls get a same-day visit, often within a few hours.'], ['Do you work in Del Webb at Woodbridge?', 'Yes. We work in Del Webb every week, and members of the Comfort Club get priority visits during heat waves.'], ['Is Manteca water hard on water heaters?', 'Yes. It is on the hard side, so we recommend a yearly flush, and a softener if you are seeing spots and buildup.']],
  },
  lathrop: {
    photo: 'lathrop-hero', pill: 'From River Islands to Mossdale', lead: 'Lathrop is growing fast, and we take care of homes from the brand-new streets of River Islands to the older blocks near the old town center. Most calls get a same-day visit.',
    seeLead: 'Most Lathrop homes are newer, so the jobs here look different from older towns.',
    features: [['i-shield', '', 'Builder warranties', 'Many River Islands homes are still under builder warranty. We service them by the book and keep the records, so the warranty stays good.'], ['i-sparkle', 'cool', 'High-efficiency tune-ups', 'New variable-speed systems and heat pumps need yearly care to run as efficiently as promised. A spring tune-up keeps them that way.'], ['i-waterheater', 'navy', 'Tankless water heaters', 'Many new Lathrop homes came with tankless heaters. They need a yearly descale with our hard water, or they start throwing error codes.'], ['i-home', '', 'Two-story comfort', 'Big two-story floor plans often need zoning tweaks so the upstairs bedrooms stay as comfortable as the kitchen.']],
    hoods: ['River Islands', 'Mossdale Landing', 'Stonebridge', 'Historic Lathrop', 'Lathrop Acres', 'Central Lathrop'],
    hoodsLead: 'Our techs know the River Islands floor plans, the Mossdale Landing models, and the older homes near the center of town.',
    homes: [['River Islands new builds', 'Homes from 2015 on, with high-efficiency systems, smart thermostats, and tankless water heaters.'], ['Mossdale Landing', 'Homes from the 2000s, with original systems now 15 to 20 years old.'], ['Older Lathrop homes', 'Smaller single-story homes with older ducts and water heaters.']],
    faq: [['Will a tune-up keep my builder warranty?', 'Yes. Most manufacturers require yearly maintenance, and we give you a record of every visit for your warranty file.'], ['Why does my tankless heater show an error?', 'With our hard water, scale builds up inside tankless heaters. A yearly descale usually clears the error and keeps it running.'], ['How fast can you get to Lathrop?', 'Most Lathrop calls get a same-day visit from our Manteca yard or our Tracy shop.']],
  },
  stockton: {
    photo: 'stockton-hero', pill: 'Same day or the next morning', lead: 'Stockton has some of the oldest homes we work on, from Miracle Mile bungalows to north Stockton tracts. Most calls are seen the same day or first thing the next morning.',
    seeLead: 'Stockton homes range from the 1920s to last year, and the jobs here range just as far.',
    features: [['i-flame', '', 'Old furnaces and boilers', 'Older homes near Miracle Mile and the Country Club area often still have wall furnaces, floor furnaces, or hot water boilers. We repair them and replace them safely.'], ['i-pipes', 'navy', 'Galvanized and cast iron pipes', 'Homes from before 1970 often have galvanized supply lines and cast iron drains. Rusty water and slow drains are common, and a repipe fixes both for good.'], ['i-drain', 'navy', 'Roots in sewer lines', 'Big old street trees are beautiful, and their roots love clay sewer lines. A camera inspection shows us where they get in.'], ['i-snowflake', 'cool', 'Summer AC strain', 'The delta breeze helps at night, but afternoons still top 100 degrees. Older homes with little insulation work their ACs hard.']],
    hoods: ['Miracle Mile', 'Brookside', 'Spanos Park', 'Lincoln Village', 'Weston Ranch', 'Country Club', 'Morada', 'Quail Lakes'],
    hoodsLead: 'From the tree-lined streets near Miracle Mile to the newer homes in Spanos Park, we know Stockton homes block by block.',
    homes: [['Pre-war bungalows', 'Homes from the 1920s to 1940s with boilers, wall furnaces, and original plumbing.'], ['Mid-century homes', 'Lincoln Village and Country Club homes from the 1950s and 60s, often ready for new ducts and a repipe.'], ['Newer north Stockton', 'Brookside and Spanos Park homes with central systems now 20 to 30 years old.']],
    faq: [['Do you still work on boilers and wall furnaces?', 'Yes. We repair and replace boilers, wall furnaces, and floor furnaces, and we can show you modern options when a replacement makes sense.'], ['Why does my drain keep backing up?', 'In older Stockton homes, roots in clay sewer lines are the usual cause. A camera inspection shows us exactly where, so we fix the cause.'], ['How fast can you get to Stockton?', 'Most Stockton calls are seen the same day or first thing the next morning.']],
  },
  livermore: {
    photo: 'livermore-hero', pill: 'Over the Altamont, usually same day', lead: 'Livermore is just over the Altamont from our Tracy shop. Summers here are hot, nights cool off fast, and we keep homes comfortable through both, usually with a same-day visit.',
    seeLead: 'Livermore sits in its own valley, with hotter days and cooler nights than the Bay. These are the jobs we see most.',
    features: [['i-thermometer', '', 'Big day-to-night swings', 'Livermore can drop 40 degrees from afternoon to night. Systems cycle hard, and a smart thermostat with a good schedule makes a real difference.'], ['i-home', 'cool', 'Older single-story homes', 'Springtown and the neighborhoods around downtown have many single-story homes from the 1960s and 70s with original ducts that leak into the attic.'], ['i-waterheater', 'navy', 'Hard water', 'Livermore water is hard, so we flush tanks and descale tankless heaters on a yearly schedule.'], ['i-heatpump', '', 'Heat pump upgrades', 'Mild winters and hot summers make Livermore a great fit for heat pumps, and most homes qualify for rebates.']],
    hoods: ['Springtown', 'South Livermore', 'Downtown Livermore', 'Sunset West', 'Portola', 'Jensen', 'Ravenswood', 'North Livermore'],
    hoodsLead: 'From Springtown to South Livermore, our techs know the floor plans and how the afternoon heat hits each part of town.',
    homes: [['1960s and 70s single-story homes', 'Common in Springtown and central Livermore, often with original attic ducts.'], ['South Livermore family homes', 'Two-story homes from the 1990s and 2000s with systems reaching the end of their life.'], ['Newer downtown homes', 'Townhomes and newer builds with compact systems and tankless water heaters.']],
    faq: [['Do you charge extra to come over the Altamont?', 'No. Livermore is part of our regular service area, and pricing is the same as in Tracy.'], ['Is a heat pump a good fit in Livermore?', 'Yes. Mild winters and hot summers are a great match for heat pumps, and most homes qualify for rebates.'], ['How fast can you get to Livermore?', 'Most Livermore calls get a same-day visit, or first thing the next morning on busy summer days.']],
  },
};

export const cityPages = (ph) => CITIES.filter((c) => c.file).map((c) => {
  const d = CITY[c.slug];
  const reviews = REVIEWS.filter((r) => r.city === c.name).slice(0, 3);
  const trail = [['Home', 'index.html'], ['Service Areas', 'service-areas.html'], [c.name]];
  return {
    file: c.file, title: `Heating, AC & Plumbing in ${c.name}, CA | Pinwheel`,
    desc: `AC repair, furnace repair, water heaters, drains, and leak repair in ${c.name}, CA. ${d.pill}. Upfront prices from a local family-owned team. Sample site.`,
    ogTitle: `Heating, AC & Plumbing in ${c.name}, CA`, preload: heroPreload(ph(d.photo)),
    jsonld: [serviceLd({ name: `Heating, cooling, and plumbing in ${c.name}`, type: 'HVAC and plumbing', desc: `Service for homes in ${c.name}, CA. Sample data.`, file: c.file }), faqLd(d.faq), crumbLd(c.file, trail)],
    body: (R) => [
      hero(R, { photo: ph(d.photo), crumbs: trail, pill: d.pill, title: `Heating, Air &amp; Plumbing in <span class="accent">${c.name}, CA.</span>`, lead: d.lead }),
      sec({ id: 'local', cls: 'bg-white', eyebrow: `What we see in ${c.name}`, h2: `Local Homes, <span class="accent">Local Problems.</span>`, lead: d.seeLead,
        inner: `<div class="pw-features">${d.features.map(([icon, b, t, text]) => `<article class="feature" data-reveal><span class="icon-bubble${b ? ' ' + b : ''}">${ic(icon)}</span><h3>${t}</h3><p>${text}</p></article>`).join('')}</div>` }),
      sec({ id: 'homes', eyebrow: 'Homes and neighborhoods', h2: `We Know ${c.name} <span class="accent">Block by Block.</span>`, lead: d.hoodsLead,
        inner: `<div class="pw-homes">
        <ul class="pw-homes-list">${d.homes.map(([t, text]) => `<li data-reveal><strong>${t}</strong><span>${text}</span></li>`).join('')}</ul>
        <div class="pw-hoods" data-reveal><h3>Neighborhoods we serve</h3><ul class="pw-hood-list">${d.hoods.map((h) => `<li>${ic('i-map-pin')}${h}</li>`).join('')}</ul></div>
      </div>` }),
      sec({ id: 'city-services', cls: 'bg-white', eyebrow: `Services in ${c.name}`, h2: `What We Do in <span class="accent">${c.name}.</span>`,
        inner: linkCards(R, [
          { href: 'ac-repair.html', icon: 'i-snowflake', bubble: 'cool', title: 'AC Repair', text: 'Most AC repairs get done in one visit.' },
          { href: 'heating.html', icon: 'i-flame', title: 'Furnace Repair', text: 'Same-day heating repairs with a CO check every visit.' },
          { href: 'water-heaters.html', icon: 'i-waterheater', bubble: 'navy', title: 'Water Heaters', text: 'Flushes, repairs, and same-day replacement.' },
          { href: 'drains.html', icon: 'i-drain', bubble: 'navy', title: 'Drains & Sewer', text: 'Clogs cleared, with a camera when needed.' },
          { href: 'heat-pumps.html', icon: 'i-heatpump', title: 'Heat Pumps', text: 'One quiet system that heats and cools.' },
          { href: 'leak-repair.html', icon: 'i-pipes', bubble: 'navy', title: 'Leak Repair & Repiping', text: 'Hidden leaks found and fixed cleanly.' },
        ]) }),
      reviews.length ? sec({ id: 'reviews', cls: 'tpl-bg-tint', eyebrow: 'Reviews', h2: `From Your Neighbors in <span class="accent">${c.name}.</span>`,
        lead: `${tag('Illustrative reviews')}`, inner: `<ul class="pw-reviews">${reviews.map(reviewCard).join('')}</ul>
      <p class="pw-more"><a class="btn btn-secondary" href="${R}reviews.html">Read all reviews${ic('i-arrow-right')}</a></p>` }) : '',
      faqSection(R, d.faq, { h2: `${c.name} <span class="accent">Questions.</span>`, cls: 'bg-white', prefix: 'city' }),
      club(R), bookCall(R), areasStrip(R, c.file),
    ].join('\n\n'),
  };
});

export const areasHub = (ph) => ({
  file: 'service-areas.html', title: 'Service Areas | Heating, AC & Plumbing Around Tracy, CA | Pinwheel',
  desc: 'Pinwheel serves 12 cities around Tracy, CA: Mountain House, Manteca, Lathrop, Stockton, Livermore, Lodi, Ripon, Escalon, French Camp, Pleasanton, and Dublin. Sample site.',
  ogTitle: 'Service Areas Around Tracy, CA', preload: heroPreload(ph('areas-hero')),
  jsonld: [crumbLd('service-areas.html', [['Home', 'index.html'], ['Service Areas']])],
  body: (R) => [
    hero(R, { photo: ph('areas-hero'), crumbs: [['Home', 'index.html'], ['Service Areas']], pill: '12 cities in 2 counties', title: '<span class="accent">Service Areas</span> Around Tracy, CA.',
      lead: 'Our vans start each day in Tracy and Manteca, so most of the 12 cities we cover across San Joaquin and Alameda counties see a tech the same day.' }),
    `  <section class="section areas bg-white" id="map" aria-labelledby="map-title">
    <div class="container areas-grid">
      <div class="map-card">
<!-- partial:area-map -->
<!-- /partial:area-map -->
      </div>
      <div>
        <p class="eyebrow">Where we work</p>
        <h2 id="map-title">Close By, So We <span class="accent">Get There Fast.</span></h2>
        <p class="lead">Tracy is home base, and our Manteca yard covers the cities to the east. Pricing is the same in every city we serve.</p>
        <p class="muted">Just outside these cities? Call us at ${PHONE}. If we can get there fast, we will come.</p>
      </div>
    </div>
  </section>`,
    sec({ id: 'cities', eyebrow: 'Every city we serve', h2: 'Find <span class="accent">Your City.</span>',
      inner: `<ul class="pw-cities">${CITIES.map((c) => `<li class="pw-city${c.file ? ' has-page' : ''}" id="${c.slug}" data-reveal>
          <p class="pw-city-county">${c.county} County</p>
          <h3>${c.file ? `<a href="${R}${c.file}">${c.name}</a>` : c.name}</h3>
          <p>${c.note}</p>
          ${c.file ? `<a class="pw-text-link" href="${R}${c.file}">See ${c.name} details${ic('i-arrow-right')}</a>` : `<a class="pw-text-link" href="tel:+12095550142">Call to book in ${c.name}${ic('i-arrow-right')}</a>`}
        </li>`).join('\n        ')}</ul>` }),
    club(R), bookCall(R),
  ].join('\n\n'),
});
