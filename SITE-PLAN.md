# SITE-PLAN.md: Pinwheel Heating, Air & Plumbing (full site)

Live: https://byw-home-comfort.netlify.app. A fictional sample company in Tracy, CA. Pinwheel files only (the repo root,
`partials/`, `service-areas/`, `resources/`, `css/pinwheel.css`, `js/pinwheel.js`). Sonny's, R&A, Horizon, Bright Bolt,
the template, and the previews are not touched.

The homepage (`index.html`) is approved and stays exactly as it looks. Only its links change, so they point to the new
pages. `sample-report.html` is not changed at all. `review.html` (write a review) keeps its content.

Every inner page is written by `scripts/build-pinwheel.mjs` from one shared layout, then `node scripts/sync.mjs` fills
the shared header, footer, sticky bar, and photos. So every page has the same header, footer, logo spin, phone header
behavior, phone bottom bar, fonts, and colors as the homepage.

## Pages

| Group | Page | URL |
|---|---|---|
| Home | Home (approved, links only) | `/index.html` |
| Services | Services hub (Cooling, Heating, Plumbing, Air Quality, each with a photo card) | `/services.html` |
| Cooling | Cooling overview | `/cooling.html` |
| Cooling | AC Repair | `/ac-repair.html` |
| Cooling | AC Installation & Replacement | `/ac-installation.html` |
| Heating | Furnace Repair & Replacement | `/heating.html` |
| Heating | Heat Pumps | `/heat-pumps.html` |
| Plumbing | Plumbing overview | `/plumbing.html` |
| Plumbing | Water Heaters | `/water-heaters.html` |
| Plumbing | Drains & Sewer | `/drains.html` |
| Plumbing | Leak Repair & Repiping | `/leak-repair.html` |
| Air Quality | Indoor Air Quality | `/air-quality.html` |
| Emergency | 24/7 Emergency Service | `/emergency.html` |
| Plans | Comfort Club maintenance plan (Netlify form) | `/comfort-club.html` (`/membership.html` redirects here) |
| Plans | Financing (payment estimator, no lender named) | `/financing.html` |
| Plans | Specials (coupon cards) | `/specials.html` |
| Tools | Instant Estimate | `/instant-estimate.html` |
| Tools | Book Online (Netlify form with a thank-you state) | `/book.html` |
| Company | Reviews (26 illustrative reviews, filter by service) | `/reviews.html` |
| Company | Write a review (kept as is) | `/review.html` |
| Company | About (Meet the owner, team, how we work, the van) | `/about.html` |
| Company | FAQ (grouped dropdowns) | `/faq.html` |
| Company | Resources (2 articles) | `/resources.html` |
| Company | Article: Repair or Replace? 6 Signs Your AC Is Done | `/resources/ac-repair-or-replace.html` |
| Company | Article: Why Is My Water Heater Making That Noise? | `/resources/water-heater-noise.html` |
| Company | Contact | `/contact.html` |
| Areas | Service Areas hub (map + a card for every city) | `/service-areas.html` |
| Areas | Tracy, Mountain House, Manteca, Lathrop, Stockton, Livermore | `/service-areas/<city>.html` |
| Legal | Privacy | `/privacy.html` |
| Legal | Photo credits | `/credits.html` |
| Legal | Sample monthly report (unchanged) | `/sample-report.html` |
| Error | 404 "This Page Took a Wrong Turn." | `/404.html` (Netlify rule for root-level misses only) |

## Service page layout (every service page)

1. Overlay hero (shorter than the homepage): own photo, light black overlay with a soft fade behind the words, frosted
   pill with the orange pin, a title like "AC Repair in Tracy, CA.", one plain paragraph, Call and Book buttons.
2. "Signs You Need ..." checklist.
3. What we do on the visit (numbered steps).
4. Upfront pricing: "starting at" sample prices with the Illustrative tag.
5. 3 related illustrative reviews.
6. A short FAQ for that service (dropdowns).
7. Comfort Club callout.
8. Book Online plus Call section.
9. Service areas strip.

## Navigation

Desktop header: Services (mega menu: Cooling, Heating, Plumbing, Air Quality columns, plus a 24/7 Emergency row),
Instant Estimate, Comfort Club, Specials, Service Areas (dropdown with every city), About (dropdown: About, Reviews,
FAQ, Financing, Resources), Contact, then the phone and the Book Online button.

Phones: the same structure in the menu, with each service group as a collapsible group, then Plans, Service Areas, and
Company groups, and the Call and Book buttons.

Footer: brand, phone, hours, and every page linked in groups (Cooling & Heating, Plumbing & Air, Plans & Tools,
Company, Service Areas). On phones the link groups sit two across, like Ridgeline's compact footer.

## Photos (one page each; none repeated across pages)

The homepage keeps its own photos (family, service cards, owner, team, crew van, request family). Inner pages never
reuse them. The only shared image is the logo. Two approved exceptions: the owner photo appears on About (Ben asked
for the existing owner photo there), and `review.html` keeps its photo because that page stays as is.

| Page | Photos (slot names from the photo search; final keys in scripts/photos.json) |
|---|---|
| services.html | services-hero; group cards svc-cooling, svc-heating, svc-plumbing, svc-air |
| cooling.html | cooling-hero; thermostat (existing) |
| ac-repair.html | ac-repair-hero |
| ac-installation.html | ac-install-hero |
| heating.html | heating-hero, heating-2 |
| heat-pumps.html | heat-pumps-hero |
| plumbing.html | plumbing-hero |
| water-heaters.html | water-heaters-hero |
| drains.html | drains-hero |
| leak-repair.html | leak-hero, repipe-2 |
| air-quality.html | air-quality-hero |
| emergency.html | emergency-hero, emergency-2 |
| comfort-club.html | comfort-club-hero |
| financing.html | couple (existing) |
| specials.html | specials-hero |
| instant-estimate.html | estimate-hero |
| book.html | book-hero |
| reviews.html | reviews-hero |
| about.html | about-team (hero), pw-owner (new owner portrait), about-street (golden-hour street, the name story), tech-ray (existing), about-van |
| service-areas.html | areas-hero (plus the existing drawn map) |
| service-areas/tracy.html | stucco-home (existing) |
| service-areas/mountain-house.html | suburb (existing) |
| service-areas/manteca.html | manteca-hero |
| service-areas/lathrop.html | lathrop-hero |
| service-areas/stockton.html | stockton-hero |
| service-areas/livermore.html | livermore-hero |
| faq.html | faq-hero |
| resources.html | resources-hero |
| resources/ac-repair-or-replace.html | article-ac-hero |
| resources/water-heater-noise.html | article-wh-hero |
| contact.html | tech-door (existing), contact-2 |
| privacy.html | privacy-hero |
| 404.html | notfound-hero |
| credits.html | credits-hero |

Rules: people photos are real stock (Unsplash or Pexels). Techs wear Pinwheel orange or navy; AI may only recolor a
shirt (scripts/recolor-clothes.py). Photos without people may be AI-made. Well-kept suburban homes only. Every photo
gets responsive WebP sizes (scripts/build-images.py), a credit on credits.html, and a row in PHOTO-LIST.md.

## Forms (Netlify Forms)

- `book` (book.html): service, day, arrival window, name, phone, address, notes. Thank-you state on the page.
- `comfort-club` (comfort-club.html): plan, name, phone, email, address. Thank-you state.
- The other quick-request forms keep the existing demo behavior.

## SEO

Each page: a title with the service plus "Tracy, CA" (city pages use their city), a meta description, its own og:title,
the shared link preview picture, and `noindex` as now (netlify.toml header). sitemap.xml lists every page.
