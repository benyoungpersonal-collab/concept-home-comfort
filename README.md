# Pinwheel Heating, Air & Plumbing (concept site)

A sample website by **Ben Young Web Design** for showing HVAC and plumbing owners in the Tracy area what a top-tier site looks like. Pinwheel is a fictional business. Every review, name, number, and price is sample data and is labeled that way on the site.

- Static HTML, CSS, and vanilla JavaScript. No framework, no build step.
- Mobile first. Works at 390px with no sideways scroll.
- Lighthouse mobile performance 98 to 100 on every page (details below).
- Every page is `noindex`, and `robots.txt` blocks crawlers, so search engines stay away from the concept.

---

## About the name

The brief suggested "Delta Breeze Heating & Plumbing." A web search turned up real HVAC companies already using "Delta Breeze" (Oakley, Orangevale, and the Sacramento area), so per the brief I picked a clearly invented name instead: **Pinwheel Heating, Air & Plumbing**.

Why it works: the Altamont Pass windmills are the first thing you see driving home to Tracy, and a pinwheel is moving air, which is the whole job. The logo uses two warm blades (heat) and two cool blades (cooling).

**Before you show it widely:** a web search found no Pinwheel HVAC or plumbing business, but that is not a trademark search. Do a quick USPTO and California Secretary of State check.

---

## Pages

| Page | File | What it shows |
|---|---|---|
| Home | `index.html` | Offer bar, sticky header, hero, trust strip, review feed, services bento, price estimator, Comfort Club, financing calculator, owner and team, service area map, FAQ, final call band, mobile sticky bar, chat |
| Heating & Cooling | `heating-cooling.html` | Services, Valley heat warning signs, repair-or-replace helper, FAQ |
| Plumbing | `plumbing.html` | Emergency shutoff steps, services, tank vs tankless table, repiping, FAQ |
| Comfort Club | `membership.html` | Two plans, "does it pay for itself" math, demo join form, FAQ |
| Financing & Offers | `financing.html` | Payment calculator, 3-step process, 4 seasonal offers, FAQ |
| About | `about.html` | Owner story, why "Pinwheel," four promises, the crew, license and insurance |
| Tracy | `service-areas/tracy.html` | Local page: neighborhoods, local reviews, FAQ |
| Mountain House | `service-areas/mountain-house.html` | Local page: villages, aging first-gen systems, FAQ |
| Review page | `review.html` | Google review button, text-the-owner link, scannable QR code. No star-gating |
| Sample report | `sample-report.html` | One-page monthly results dashboard (sample data), printable |
| Photo credits | `credits.html` | Every photographer, fonts, and code credited |
| 404 | `404.html` | "This page blew away." Links home, call, and book |

The other 4 cities (Manteca, Lathrop, Stockton, Livermore) are covered on the homepage map and in the booking form. See [Adding the other 4 city pages](#adding-the-other-4-city-pages).

---

## 60-second demo (on your phone)

1. Open the homepage. Point out the tap-to-call button and the **Call, Book, Text** bar that never leaves the bottom of the screen.
2. Scroll to **What will a new system cost?** Tap 3 answers, tap **Get my price**. "Your customers see a real range before they ever call."
3. Tap **Book** in the bottom bar. Pick a service, a day, and a window, then add any name and number. Show the confirmation: "On a live site, this goes straight to your phone."
4. Tap the chat bubble and ask "Do you serve Mountain House?" It answers and hands off to a call or booking.
5. Open `review.html` on a laptop and scan the QR code with your phone. "Your techs show this at the door. Every customer gets the same Google button."
6. Finish on `sample-report.html`: "This is what you get from me every month."

---

## Preview locally

Photos load from the Unsplash CDN, so you need an internet connection.

```bash
# Option 1
npx serve .

# Option 2
python3 -m http.server 8080
```

Then open the URL it prints (for example `http://localhost:8080`).

## Deploy to Netlify

- Drag the folder into Netlify Drop, or connect this repo. `netlify.toml` already sets `publish = "."` with no build command.
- `netlify.toml` also sends an `X-Robots-Tag: noindex` header, caches fonts for a year, and returns a 404 for the working files (`/partials/`, `/scripts/`, `README.md`, `DESIGN.md`).
- After deploy, replace the placeholder domain `https://pinwheel-concept.netlify.app` (see the placeholder table).

---

## How to edit text

- **Page copy:** open the page's `.html` file and edit the words directly. Homepage sections are marked with comments like `<!-- 7. Instant price estimator -->`.
- **Shared parts** (header, footer, booking form, chat, sticky bar, call band, icons) live in `partials/`. Edit the partial, then run:

  ```bash
  node scripts/sync.mjs
  ```

  It copies the change into every page and fixes relative links for the `service-areas/` pages. Node 18 or newer, nothing to install. The HTML files in the repo are always complete, so this step is only needed after you edit a partial or `scripts/photos.json`.
- **Phone number:** find and replace both `(209) 555-0142` and `+12095550142` across the whole repo (it is also in the JSON-LD).
- **Chat answers:** `js/site.js`, the `KB` list inside `initChat`.
- **Estimator price ranges:** `js/site.js`, the `BASE`, `SIZE`, and `AGE` tables inside `initEstimator`.
- **Financing APR:** the `data-apr="7.99"` attribute on the calculator form in `financing.html` and `index.html`, plus the fine print right below it.
- **Offer bar:** `partials/header.html`. When the offer changes, also change `fall-2026` in `js/site.js` and `partials/head.html` so people who closed the old offer see the new one.

## How to swap photos

**Quick swap (another Unsplash photo):** edit the entry in `scripts/photos.json` (`base`, `w`, `h`, focal point `fp`, `alt`, and the photographer fields), then run `node scripts/sync.mjs`. Every image using that key updates, with a fresh `srcset`, and the credits page rebuilds itself. Only photos that appear on a page get credited.

**Real client photos (recommended):**

1. Export each photo as WebP at 480, 720, 960, and 1200px wide (hero max 1600px). Put them in `images/`.
2. Replace the `src` and `srcset` on the `<img>` (and the hero's `<source>` and preload links). Keep `width`, `height`, and a real `alt`.
3. The owner portrait is marked in `index.html` and `about.html` with `<!-- REAL OWNER PHOTO GOES HERE -->`.
4. Once no photos come from Unsplash, delete the `preconnect` to `images.unsplash.com` in `partials/head.html` and remove the `data-photo` attributes so sync leaves those tags alone.

Real photos of the owner, the crew, and the vans will beat any stock photo. That is the single biggest upgrade for a real client.

---

## What's placeholder

| Item | Where it appears |
|---|---|
| Business name, logo, "since 2010" | Everywhere |
| Phone (209) 555-0142 | Every `tel:` and `sms:` link, JSON-LD |
| License CSLB #000000 | Footer, About, trust strip, JSON-LD |
| Street address | Footer, JSON-LD |
| Owners (Luis and Carmen Ortega) and team names | Home, About |
| Reviews, reviewer names, 4.9 rating, 186 reviews | Home, city pages |
| Stats (16 years, 8,400+ homes, 97% on time) | Home trust strip |
| Prices, estimator ranges, plan prices, offers | Home, Comfort Club, Financing, `js/site.js` |
| 7.99% APR and terms | Financing, Home, `js/site.js` |
| Report numbers | `sample-report.html` |
| Google review link (`href="#"`) | `review.html` |
| Domain `pinwheel-concept.netlify.app` | Open Graph tags, JSON-LD, `sitemap.xml` |
| Photos (Unsplash stock) | See `credits.html` |
| `noindex` meta tags, `Disallow: /` in `robots.txt`, and the `X-Robots-Tag` header in `netlify.toml` | On purpose for a concept. Remove all three for a real launch |

---

## Adding the other 4 city pages

1. Copy `service-areas/tracy.html` to `service-areas/manteca.html` (and so on).
2. Rewrite the `<title>`, meta description, `og:` tags, JSON-LD (`areaServed`, FAQ), breadcrumb, H1, intro, the local cards, neighborhood chips, reviews, and FAQ.
3. Pick a local photo: add a key to `scripts/photos.json`, set the hero's `data-photo` to it, run `node scripts/sync.mjs`.
4. Link it: `partials/header.html` (Service Areas panel and mobile menu) and `partials/footer.html`, then run sync. On the homepage, turn the city's `<span>` in the `.city-list` into an `<a>` like Tracy's.
5. Add the URL to `sitemap.xml`.

Write real local copy for each city. Pages that only swap the city name read as thin to Google and to customers. Angles to start from (confirm with the owner):

| City | Drive from the Tracy shop | Angle to write about |
|---|---|---|
| Manteca | About 20 min | Newer two-story subdivisions (hot upstairs, zoning) and older homes near downtown (water heaters, repipes) |
| Lathrop | About 15 min | River Islands and other newer builds: builder-grade systems, first-time owners, maintenance plans |
| Stockton | About 25 to 30 min | Older tree-lined neighborhoods: galvanized pipes, root-damaged sewer lines, aging furnaces |
| Livermore | About 20 to 25 min over the Altamont | Hotter inland summers, higher-end remodels, indoor air quality during fire season |

---

## Features

- **Seasonal offer bar** that stays closed once dismissed.
- **Sticky header** that compacts on scroll. Phone number always one tap away.
- **Mobile sticky bar** (Call, Book, Text), with the chat bubble sitting above it.
- **Booking demo:** 3 steps, the next 8 open days (no Sundays, today drops off after 4pm), validation, confirmation. Sends nothing.
- **Demo AI assistant:** scripted answers to 10 common questions, then hands off to a call, text, or booking.
- **Instant price estimator:** 3 questions, a real price range, no email needed.
- **Financing calculator:** slider plus term, live monthly payment.
- **Repair-or-replace helper:** 4 questions, plain-language answer (Heating & Cooling page).
- **Review page** with a real, scannable QR code built from the page's own URL (vendored MIT library, no CDN) and no star-gating.
- **Sample monthly report:** KPI tiles, charts with table views, print or save as PDF.
- Google-style review feed, bento services grid, SVG service-area map, FAQ accordion, count-up stats.
- SEO: unique title and description per page, LocalBusiness (HVACBusiness and Plumber), Service, and FAQPage JSON-LD, `sitemap.xml`.

All forms show: "This is a demo. On a live site, this goes straight to the owner's phone."

---

## QA checklist (final run)

| Check | Result | How it was tested |
|---|---|---|
| Every phone number is a `tel:` link | PASS | 73 `tel:` links, all `+12095550142`. Text buttons use `sms:` (32 links) |
| No sideways scroll at 390px | PASS | All 12 pages, page width equals viewport, no element past the edge |
| No broken images | PASS | Every image loads, has `width`, `height`, and `alt` (390 and 1440) |
| No broken links or anchors | PASS | 1,335 internal links and in-page anchors checked |
| No console errors | PASS | All 12 pages at 390 and 1440, plus every demo flow |
| No em dashes | PASS | Zero em or en dashes in any file in the repo |
| Sticky bar never covers content | PASS | Footer padded for the bar; chat bubble sits above it; every page checked |
| Lighthouse mobile 90+ | PASS | 98 to 100 on all 12 pages |
| Accessibility (axe-core) | PASS | 0 violations on 12 pages at 390 and 1440 |
| Tap targets 44px+ | PASS | Every button and standalone link on every page (links inside sentences are exempt under WCAG) |
| One H1 per page, unique titles and descriptions | PASS | All 12 pages |
| AA contrast | PASS | axe plus manual checks (for example white on #D1441C is 4.61:1) |
| Visible focus, skip link, labeled forms | PASS | Tabbed through the homepage: every stop shows a 3px focus ring. axe checks labels |
| Reduced motion respected | PASS | With reduced motion on: transitions off, the 404 pinwheel stops, stats show final numbers |
| Forms never send, demo message shown | PASS | Booking, membership join, review button |
| QR code scans | PASS | Decoded back to the page URL |
| No star-gating | PASS | One Google button for every customer |
| Homepage body copy 700 to 900 words | PASS | 811 words |
| Fonts self-hosted WOFF2 | PASS | Inter 27KB, Plus Jakarta Sans 16KB (subset) |
| Hero 1600px max, preloaded, lazy below the fold | PASS | Art-directed hero (square on phones, 4:5 on desktop) |
| `noindex` everywhere, robots blocks all | PASS | Meta tag, `X-Robots-Tag` header, `Disallow: /` |
| Photos self-hosted | NOT DONE | Unsplash downloads were blocked in the build environment. Photos load as WebP from the Unsplash CDN with `srcset`, the fallback the brief allows |

## Review loop scores (final round)

Scored 1 to 10 after three screenshot rounds at 390 and 1440.

| Page | First look | Hierarchy | Spacing | Type | Color | Photos | Thumb reach | Speed | Copy |
|---|---|---|---|---|---|---|---|---|---|
| Home | 9 | 9 | 9 | 9 | 9 | 8 | 10 | 10 | 9 |
| Heating & Cooling | 9 | 9 | 9 | 9 | 9 | 9 | 10 | 10 | 9 |
| Plumbing | 9 | 9 | 9 | 9 | 9 | 8 | 10 | 10 | 9 |
| Comfort Club | 9 | 9 | 9 | 9 | 9 | 8 | 10 | 10 | 9 |
| Financing & Offers | 9 | 9 | 9 | 9 | 9 | 9 | 10 | 10 | 9 |
| About | 9 | 9 | 9 | 9 | 9 | 9 | 10 | 10 | 9 |
| Tracy | 9 | 9 | 9 | 9 | 9 | 9 | 10 | 10 | 9 |
| Mountain House | 9 | 9 | 9 | 9 | 9 | 9 | 10 | 10 | 9 |
| Review page | 9 | 10 | 9 | 9 | 9 | 9 | 10 | 10 | 9 |
| Sample report | 9 | 9 | 9 | 9 | 9 | n/a | 9 | 10 | 9 |
| Credits | 9 | 9 | 9 | 9 | 9 | n/a | 10 | 10 | 9 |
| 404 | 9 | 9 | 9 | 9 | 9 | n/a | 10 | 10 | 10 |

Photos are the only scores under 9, and stock cannot fix them. The hero is a friendly tech portrait, not a tech at a home AC unit (no free photo of that was good enough), the plumber shot has a blue studio glow, and the Comfort Club filter shot is generic. Real crew photos take these to 10.

## Lighthouse

Lighthouse 12.8.2, default mobile settings (simulated slow 4G, 4x CPU slowdown), compressed local server.

| Page | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | 99 | 100 | 100 | 66 | 2.1s | 0 | 0ms |
| Heating & Cooling | 99 | 100 | 100 | 66 | 2.0s | 0 | 0ms |
| Plumbing | 99 | 100 | 100 | 66 | 2.0s | 0 | 0ms |
| Comfort Club | 99 | 100 | 100 | 66 | 2.0s | 0 | 0ms |
| Financing & Offers | 99 | 100 | 100 | 66 | 2.0s | 0 | 0ms |
| About | 98 | 100 | 100 | 66 | 2.3s | 0 | 0ms |
| Tracy | 99 | 100 | 100 | 66 | 2.0s | 0 | 0ms |
| Mountain House | 99 | 100 | 100 | 66 | 2.0s | 0 | 0ms |
| Review page | 99 | 100 | 100 | 66 | 2.0s | 0 | 0ms |
| Sample report | 100 | 100 | 100 | 63 | 1.4s | 0 | 0ms |
| Credits | 100 | 100 | 100 | 63 | 1.4s | 0 | 0ms |
| 404 | 100 | 100 | 100 | 63 | 1.4s | 0 | 0ms |
| Home (desktop) | 100 | 100 | 100 | 66 | 0.6s | 0 | 0ms |

- **SEO is low on purpose.** The only failing SEO check is "page is blocked from indexing," which is the required `noindex`. Remove it for a real launch.
- **About the photos in the test:** the Unsplash CDN was blocked in the build environment, so Lighthouse loaded the same image URLs from a local stand-in serving WebP files at realistic sizes. After deploy, run PageSpeed Insights on the live URL to confirm with the real CDN.

---

## Known limits

- Photos are hotlinked from the Unsplash CDN, not self-hosted (downloads were blocked in the build environment). Fine for a concept; self-host for a real client.
- No free stock photo showed a tech working on a home AC unit, so the hero uses a friendly tech portrait.
- Only Tracy and Mountain House have city pages. Steps for the other 4 are above.
- "Pinwheel" passed a web search, not a trademark search.

---

## Files

```
index.html, heating-cooling.html, plumbing.html, membership.html,
financing.html, about.html, review.html, sample-report.html,
credits.html, 404.html
service-areas/        tracy.html, mountain-house.html
css/site.css          design tokens at the top, then components
js/site.js            all interactions (vanilla JS, one file)
js/vendor/            QR code library (MIT) and its license
fonts/                Inter and Plus Jakarta Sans (WOFF2, OFL licenses)
images/               Open Graph image and app icon
partials/             shared header, footer, booking, chat, icons
scripts/sync.mjs      optional helper that copies partials into pages
scripts/photos.json   every photo: crop, focal point, alt text, credit
DESIGN.md             the plan: tokens, wireframes, full copy deck
netlify.toml, robots.txt, sitemap.xml, favicon.svg
```

## Credits

- Photos: Unsplash photographers, listed on `credits.html`.
- Fonts: Inter and Plus Jakarta Sans, SIL Open Font License 1.1, subset and self-hosted.
- QR codes: QR Code Generator for JavaScript by Kazuhiko Arase, MIT license, vendored in `js/vendor/`.
- Icons, logo, and map: drawn for this concept as inline SVG.

Concept by Ben Young Web Design.
