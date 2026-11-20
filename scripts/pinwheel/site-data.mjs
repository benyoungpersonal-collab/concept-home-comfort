/* site-data.mjs: one source of truth for Pinwheel's page list, navigation, cities, and illustrative reviews.
   Used by scripts/build-pinwheel.mjs (pages, header, footer, sitemap). Sample data for a fictional business. */

export const SITE = 'https://byw-home-comfort.netlify.app/';
export const NAME = 'Pinwheel Heating, Air & Plumbing';
export const PHONE = '(209) 555-0142';
export const TEL = 'tel:+12095550142';
export const SMS = 'sms:+12095550142';

// Service groups for the Services mega menu, the phone menu, the footer, and the services hub
export const GROUPS = [
  { key: 'cooling', name: 'Cooling', icon: 'i-snowflake', bubble: 'cool', overview: 'cooling.html', pages: [
    { file: 'ac-repair.html', name: 'AC Repair', blurb: 'Same-day fixes for warm air, noises, and ice.' },
    { file: 'ac-installation.html', name: 'AC Installation & Replacement', blurb: 'New systems sized with a real load calculation.' },
    { file: 'cooling.html', name: 'Cooling Overview', blurb: 'Tune-ups, ducts, thermostats, and our repair-or-replace helper.' },
  ] },
  { key: 'heating', name: 'Heating', icon: 'i-flame', bubble: '', overview: 'heating.html', pages: [
    { file: 'heating.html', name: 'Furnace Repair & Replacement', blurb: 'No heat, short cycling, or a furnace near the end.' },
    { file: 'heat-pumps.html', name: 'Heat Pumps', blurb: 'One quiet system that heats and cools.' },
  ] },
  { key: 'plumbing', name: 'Plumbing', icon: 'i-droplet', bubble: 'navy', overview: 'plumbing.html', pages: [
    { file: 'water-heaters.html', name: 'Water Heaters', blurb: 'Tank and tankless repair and replacement.' },
    { file: 'drains.html', name: 'Drains & Sewer', blurb: 'Clogs, main lines, and camera inspections.' },
    { file: 'leak-repair.html', name: 'Leak Repair & Repiping', blurb: 'Hidden leaks found and whole homes repiped.' },
    { file: 'plumbing.html', name: 'Plumbing Overview', blurb: 'Fixtures, softeners, gas lines, and more.' },
  ] },
  { key: 'air', name: 'Air Quality', icon: 'i-wind', bubble: 'cool', overview: 'air-quality.html', pages: [
    { file: 'air-quality.html', name: 'Indoor Air Quality', blurb: 'Filters, purifiers, and duct cleaning for smoke season.' },
  ] },
];

// Every city we serve. Cities with "file" have their own page; the rest have a card on the hub.
export const CITIES = [
  { slug: 'tracy', name: 'Tracy', file: 'service-areas/tracy.html', county: 'San Joaquin', note: 'Home base since 2010. Most calls get a same-day visit.' },
  { slug: 'mountain-house', name: 'Mountain House', file: 'service-areas/mountain-house.html', county: 'San Joaquin', note: 'About 15 minutes from our Tracy shop.' },
  { slug: 'manteca', name: 'Manteca', file: 'service-areas/manteca.html', county: 'San Joaquin', note: 'Our Manteca yard is right in town.' },
  { slug: 'lathrop', name: 'Lathrop', file: 'service-areas/lathrop.html', county: 'San Joaquin', note: 'From River Islands to Mossdale Landing.' },
  { slug: 'stockton', name: 'Stockton', file: 'service-areas/stockton.html', county: 'San Joaquin', note: 'Same day or the next morning, citywide.' },
  { slug: 'livermore', name: 'Livermore', file: 'service-areas/livermore.html', county: 'Alameda', note: 'Over the Altamont, usually the same day.' },
  { slug: 'french-camp', name: 'French Camp', county: 'San Joaquin', note: 'Covered from our Manteca yard, usually the same day.' },
  { slug: 'lodi', name: 'Lodi', county: 'San Joaquin', note: 'Same day or the next morning, including older homes with boilers.' },
  { slug: 'ripon', name: 'Ripon', county: 'San Joaquin', note: 'Covered from our Manteca yard, about 15 minutes away.' },
  { slug: 'escalon', name: 'Escalon', county: 'San Joaquin', note: 'Covered from our Manteca yard, usually the same day.' },
  { slug: 'pleasanton', name: 'Pleasanton', county: 'Alameda', note: 'Same day or the next morning from Tracy.' },
  { slug: 'dublin', name: 'Dublin', county: 'Alameda', note: 'Same day or the next morning from Tracy.' },
];

export const ABOUT_MENU = [
  { file: 'about.html', name: 'About Us', blurb: 'Meet the owner and the team.', icon: 'i-home-heart' },
  { file: 'projects.html', name: 'Projects', blurb: 'Installs and repairs, before and after.', icon: 'i-camera' },
  { file: 'reviews.html', name: 'Reviews', blurb: 'What Tracy-area neighbors say about us.', icon: 'i-star' },
  { file: 'faq.html', name: 'FAQ', blurb: 'Straight answers on cooling, heating, plumbing, and price.', icon: 'i-info' },
  { file: 'financing.html', name: 'Financing', blurb: 'Monthly payments on new systems and big repairs.', icon: 'i-dollar' },
  { file: 'resources.html', name: 'Resources', blurb: 'Plain guides for homeowners.', icon: 'i-sparkle' },
];

/* Illustrative reviews. group: ac | heating | plumbing (the filter on reviews.html). tag: the service page that shows it. */
export const REVIEWS = [
  { n: 'Maria G.', city: 'Tracy', when: '2 weeks ago', group: 'ac', tag: 'ac-repair', h: 14, text: 'Our AC quit on a 108 degree day. A tech was here by 3 and the house was cool by dinner. He showed me the price on his tablet before he touched anything.' },
  { n: 'Priya R.', city: 'Tracy', when: '3 weeks ago', group: 'ac', tag: 'ac-repair', h: 150, text: 'Another company said we needed a whole new system. Pinwheel found a bad capacitor and fixed it for a fraction of that. Honest people.' },
  { n: 'Tom W.', city: 'Manteca', when: '1 month ago', group: 'ac', tag: 'ac-repair', h: 32, text: 'The AC was blowing warm air in the evening and freezing up by morning. Marcus found a refrigerant leak at a fitting, fixed it, and walked me through the readings.' },
  { n: 'Angela M.', city: 'Lathrop', when: '2 months ago', group: 'ac', tag: 'ac-install', h: 260, text: 'We got three quotes for a new AC. Pinwheel was the only one who measured every room and checked the attic ducts. The new system is quiet and our July bill dropped.' },
  { n: 'Kevin L.', city: 'Mountain House', when: '5 weeks ago', group: 'ac', tag: 'ac-install', h: 190, text: 'Install crew showed up at 8, put drop cloths everywhere, and had the new condenser running by 3. They hauled the old unit away and handled the permit.' },
  { n: 'Rosa D.', city: 'Stockton', when: '3 months ago', group: 'ac', tag: 'ac-install', h: 330, text: 'Our 1998 unit finally gave out. They gave us a good, better, best option on paper and never pushed. We picked the middle one and it has been great.' },
  { n: 'Gary P.', city: 'Tracy', when: '1 month ago', group: 'ac', tag: 'air-quality', h: 80, text: 'During the smoke last summer my daughter could not stop coughing. They put in a media filter cabinet and a purifier, and the air in the house felt different within a day.' },
  { n: 'Linh T.', city: 'Livermore', when: '6 weeks ago', group: 'ac', tag: 'air-quality', h: 120, text: 'They cleaned our ducts after a remodel and showed us the before and after photos. There was a surprising amount of drywall dust in there.' },
  { n: 'Samantha K.', city: 'Mountain House', when: '2 months ago', group: 'ac', tag: 'air-quality', h: 300, text: 'Upstairs bedrooms were always stuffy. They added a fresh air system and balanced the ducts. Now the kids sleep with the door closed and it stays comfortable.' },
  { n: 'Derek S.', city: 'Mountain House', when: '1 month ago', group: 'plumbing', tag: 'water-heaters', h: 205, text: 'Water heater started leaking on a Sunday. They answered, came out, and had a new one in by Monday at noon. Fair price and zero mess.' },
  { n: 'Helen R.', city: 'Manteca', when: '3 weeks ago', group: 'plumbing', tag: 'water-heaters', h: 18, text: 'Our water heater was making a popping sound. The plumber flushed out a lot of sediment and told us we did not need a new one yet. I appreciated that.' },
  { n: 'Marcus J.', city: 'Lathrop', when: '2 months ago', group: 'plumbing', tag: 'water-heaters', h: 240, text: 'We switched to tankless with Pinwheel. They explained the gas line upgrade up front, so there were no surprises on the bill.' },
  { n: 'Brenda O.', city: 'Tracy', when: '4 weeks ago', group: 'plumbing', tag: 'drains', h: 60, text: 'The kitchen sink kept backing up. They ran a camera and found roots in the line, cleared it, and sent me the video so I could see it myself.' },
  { n: 'Jorge V.', city: 'Stockton', when: '2 months ago', group: 'plumbing', tag: 'drains', h: 170, text: 'Main line clog on a Saturday morning with family coming over. They had it cleared before noon and did not charge extra for the weekend because we are in the Comfort Club.' },
  { n: 'Diane F.', city: 'Livermore', when: '5 weeks ago', group: 'plumbing', tag: 'drains', h: 350, text: 'Slow shower drain for months. The tech cleared it in twenty minutes and showed me what not to put down it. Simple and friendly.' },
  { n: 'Paul N.', city: 'Tracy', when: '3 months ago', group: 'plumbing', tag: 'leak-repair', h: 100, text: 'Our water bill doubled and we could not find why. They found a slab leak under the hallway with listening gear and only opened a small spot to fix it.' },
  { n: 'Erin C.', city: 'Stockton', when: '2 months ago', group: 'plumbing', tag: 'leak-repair', h: 280, text: 'We repiped our 1955 house with Pinwheel. Water was on every night, they patched every hole, and the pressure upstairs is finally normal.' },
  { n: 'Victor A.', city: 'Manteca', when: '6 weeks ago', group: 'plumbing', tag: 'leak-repair', h: 40, text: 'Pinhole leak in the garage ceiling. They came the same afternoon, fixed it, and checked the rest of the copper while they were there.' },
  { n: 'Karen B.', city: 'Tracy', when: '2 weeks ago', group: 'heating', tag: 'heating', h: 10, text: 'No heat on a cold December night. The tech replaced the igniter in about an hour and checked for carbon monoxide before he left. Very thorough.' },
  { n: 'Raj P.', city: 'Mountain House', when: '1 month ago', group: 'heating', tag: 'heating', h: 210, text: 'Furnace kept shutting off. They found a dirty flame sensor, cleaned it, and changed the filter. Small fix, fair price, and no upselling.' },
  { n: 'Lisa M.', city: 'Lathrop', when: '3 months ago', group: 'heating', tag: 'heating', h: 320, text: 'Our furnace was 24 years old. They showed us the cracked heat exchanger on camera, so we knew replacing it was the right call. The new one is so quiet.' },
  { n: 'Mike H.', city: 'Livermore', when: '2 months ago', group: 'heating', tag: 'heat-pumps', h: 140, text: 'We replaced our old AC and furnace with one heat pump. Our winter gas bill basically disappeared and the house is more even than before.' },
  { n: 'Grace Y.', city: 'Tracy', when: '5 weeks ago', group: 'heating', tag: 'heat-pumps', h: 250, text: 'They put a ductless unit in our garage gym. Clean install, the line set is tidy along the wall, and it heats and cools that room perfectly.' },
  { n: 'Andre W.', city: 'Manteca', when: '4 months ago', group: 'heating', tag: 'heat-pumps', h: 70, text: 'Pinwheel helped us claim the heat pump rebates. They filled out most of the paperwork and the check came a few weeks later.' },
  { n: 'Nancy E.', city: 'Stockton', when: '6 weeks ago', group: 'heating', tag: 'emergency', h: 0, text: 'Called at 11pm when the furnace made a burning smell. They talked me through shutting it off and had a tech out first thing in the morning.' },
  { n: 'Chris D.', city: 'Tracy', when: '3 weeks ago', group: 'plumbing', tag: 'emergency', h: 230, text: 'A pipe burst in the laundry room at 6am. The person on the phone walked me to the shutoff and a plumber was here within the hour.' },
];

export const STATS = { rating: '4.9', count: 186 };
