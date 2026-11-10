# Homepage previews for prospects

One data file per business. One command builds a finished homepage preview in `previews/NAME/`. One more command puts it on Cloudflare Pages at `https://byw-NAME.pages.dev/`.

Every preview is `noindex`, says "Homepage preview by Ben Young Web Design" in the footer, and matches the current Pinwheel homepage, filled with the prospect's own name, phone, colors, services, and cities. Anything you leave out of the data file is left out of the page. No placeholder text, no empty boxes.

## What the page shows

Sections, in this order: what they do first, the proof after **(build)**.

1. Hero: their photo edge to edge, then a white card over its bottom edge (pill, headline, paragraph, buttons, hours line)
2. Trust row
3. Services
4. Membership or maintenance plans (optional)
5. How a visit works
6. Specials (optional)
7. Reviews (plus the proof section for a new business)
8. Meet the family (optional)
9. Quick quote, or starting prices when the data file has them
10. Financing (optional)
11. FAQ
12. Service areas
13. Request a visit

The mobile menu and the footer list the sections in the same order.

Two modes, picked from the data file:

| Mode | When | What changes |
|---|---|---|
| Established | `googleRating` and `googleReviewsUrl` are filled in, and `reviewCount` is 3 or more | Rating bar at the top (with "Write a review" when `writeReviewUrl` is set), the rating line in the reviews section, and their real review quotes. The rating shows only in those two places: not in the hero, not in the trust row |
| New business | Fewer than 3 reviews | 3 sample review cards tagged "Sample" (preview only), plus a proof section: license, insured, years in the trade, warranty, owner, service area, and a "Leave us a review" button |

Set `"mode": "new"` or `"mode": "established"` to choose yourself.

## Template rules (every preview)

These apply to every prospect. The build enforces the ones marked **(build)**; the rest are on you before you build.

**Research first**
- Their Google listing: rating, review count, hours, services, logo, the best 3 reviews (word for word), team names, and cities mentioned.
- Their CSLB license: number, first issued date, status, bond, and workers' comp (https://www.cslb.ca.gov, Check a License). If CSLB will not load, use a public record site and say which one, because those can be out of date.
- If the Google listing cannot be read, ask Ben for the facts instead of guessing.
- If Ben pastes a Preview facts note from his Tracker, start from that.

**Look and feel** **(build)**
- Hero: the photo first, edge to edge under the header (16:9 on phones, 2:1 and about 720px tall on desktop, never much taller on wide screens), then a white card with rounded top corners laid over its bottom edge. No rating badge and no preview note in the hero.
- Header: their mark (`headerMark`, else `logoMark`, else their first letter in a brand-color square) beside their name (`shortName`), with a small-caps line under it (`logoTag`, else `tagline`). An "&" in the name takes the brand color. The name size follows its length, so long names fit from 320px up.
- No gradient glows or color washes anywhere: solid colors. Only the dark shade behind words on a photo card stays, for contrast.
- Neighboring sections never share a background. Each section is cream (no class), white (`bg-white`), a soft brand tint (`tpl-bg-tint`, the reviews section by default) or navy (`on-dark`), and the build checks every pair in order (scripts/section-backgrounds.mjs): when two neighbors match, only the lower one moves to a light background that differs from both of its neighbors. Navy is never changed. A finishing pass that adds sections runs the same check.
- Even, tighter spacing between sections: every section has the same top and bottom padding (half of site.css's), the last line in a section adds no extra margin, and the footer starts with the same spacing.
- Balanced headline line breaks (`text-wrap: balance`), never one word alone on a line.
- Scroll animations (js/reveal.js): sections and cards fade up about half a second as they come into view, once each, cards staggered a little, and the footer logo fades in. The hero is never animated. "Reduce motion" turns it off, nothing is hidden without JavaScript, and only opacity and transform change, so nothing shifts the layout. Add `data-reveal` to include any other element.
- The preview note ("Homepage preview by Ben Young Web Design. Some photos are placeholders until we add yours.") is in the footer only.
- Link preview: the title is `Business Name | Main Service in City, ST` (`mainService`, else the trade default like "Plumbing & HVAC Repair"; `state`, default CA). There is no og:site_name, because iMessage drops the part of the title that matches it. og.jpg (1200x630) is cut from the hero photo, and its alt text is `heroPhoto.ogAlt`.

**Trust row** **(build)**
- Tiles: a bold brand-color square with a white icon and the label centered under it, on navy. 2x2 on phones, one row from 600px up.
- 4 to 6 facts, never just one. The build picks them in this order and keeps the first 6: license (as "Licensed & bonded" when `bonded` is true), insured, since year, free second opinions, upfront pricing, warranty or satisfaction guarantee. `trust` in the data file replaces the list.
- A brand-new business still gets at least 3, like their license number, "Licensed & bonded" when CSLB shows an active bond, and "Based in [their city]" (added for you when there are fewer than 4).
- When a guarantee is on, a line under the 3 visit steps says: "Satisfaction guarantee: if something's not right, we'll make it right." (or their real warranty).

**Logo and colors**
- Use their real logo when they have one (`logo`). It goes in the footer (on a white chip), and `logoMark` goes in the favicon and the map pin **(build)**. The header shows the mark beside their name (see Look and feel).
- Service cards with a photo never get a color tint **(build)**. The photo shows in its true colors, with only a soft dark gradient behind the words at the bottom (like Pinwheel's AC repair card). The gradient follows the text block, so the words pass contrast on any photo and any screen size.
- Service cards use the main color plus a second color **(build)**: `colors.brand` (main, default orange) and `colors.second` (usually the other color in their logo, default navy). The first half of the cards use the main color and the rest the second, unless a service sets `"tone": "main"` or `"second"`.

**Reviews** **(build)**
- 3 or more real Google reviews (`reviewCount` 3 or more): show only their real reviews, word for word, first name and last initial, trimmed with "..." if long. Never use a negative review. Until the quotes are in the data file, the section shows the rating and a link to read them all on Google.
- Fewer than 3: the reviews section still shows, with 3 sample review cards so they can see how it will look. It is labeled "Preview: this is how your Google reviews will show up," every card has a "Sample" tag, the names are generic first names with a last initial, and the reviews are short and believable for their trade. Under it: "Most people read reviews before they call. Your site will make it easy for customers to leave one."
- Sample reviews never go on a live site. At launch the section shows only real reviews, or a "Leave us a review" button if they have none yet.
- Stars fill to the real rating (4.7 is four and most of a fifth), never five full stars by default.

**FAQ** **(build)**
- Every preview has an FAQ. Without `faqs` in the data file, the build writes defaults for their trade (`trade`: hvac, plumbing, both, electrical, roofing, landscaping, or general), filled with their own facts: license number, hours, services, cities.
- Every answer has to be true from their facts, or general advice. A question whose answer needs a fact you do not have is left out. Set `"faq": false` to hide the section.

**Map** **(build)**
- Centered on their city, with their logo as the pin (their initial with no logo), and 1 to 2 nearby cities as plain labels with no pins (`mapNearby`). The chips list only the cities they serve, plus "Just outside [city]? Call us. If we can get there fast, we'll come." for a one-city business (the same line ends the FAQ answer about service areas).

**Photos**
- Real photos only when they look good at the size they will show and fit the spot: crew, trucks, or clean finished work. Blurry, dark, cluttered, or a close-up of equipment: stock instead. Zero real photos is fine. Keep the note that photos are placeholders until we add theirs.

**Phone numbers** **(build)**
- Phone numbers never break across lines. "Prefer to talk?" puts "Call (xxx) xxx-xxxx" on its own line as one link.

**Confirm with the owner** **(build)**
- Anything not verified gets listed under "Confirm with the owner" in your reply to Ben. Put those claims in `unverified` in the data file; the build prints them, plus any claim that is only on by default (insured, upfront pricing, satisfaction guarantee).

## What to collect from each prospect

Must have (the build refuses to run without these):

| Field | Example | Where to find it |
|---|---|---|
| `name` | `"Sunrise Comfort Co."` | Their Google Business Profile, exactly as written |
| `phone` | `"209-555-0177"` | Google Business Profile or their current site |
| `city` | `"Manteca"` | The city on their Google listing. It is the home-base pin on the map |

Should have (each one unlocks something; leave it out and it hides):

| Field | Example | Notes |
|---|---|---|
| `serviceAreas` | `["Manteca", "Lathrop", "Ripon"]` | Every city they serve. The build draws a real OpenStreetMap map from these and reads the counties for the hero line |
| `services` | `[{ "name": "Heating", "blurb": "...", "sub": ["Furnace repair", "Heat pumps"] }]` | Main services with sub-services. Decides the trade (HVAC, plumbing, or both), the hero photo, and the title |
| `colors` | `{ "brand": "#1F6FB8", "second": "#1F5FA8", "navy": "#14213D" }` | `brand` is their main color (red, blue, anything). No colors: Pinwheel's red-orange. Every shade on the page, the map, and the accents follows it, and light colors are darkened where text sits on them |
| `colors.fill` | `"bright"` | Use the brand color itself (often a bright logo color) on buttons, the hero pill, the call button and the main service cards. If white text on it is under 4.5:1, text on those fills turns navy. Headline words get the closest deeper shade that reaches 3:1 on cream and on the hero glow; small orange text keeps a shade that reaches 4.5:1. The build prints every pair |
| `colors.fill` | `"vivid"` | One vivid brand color everywhere: buttons and the hero pill (white text), headline words, section labels, links, and icons. Pick the shade so white bold text reaches 3:1 on it and it reaches 3:1 on cream; the build refuses a color that misses either. Small text (labels, links, small buttons) will be under the 4.5:1 that the accessibility check wants for small text, so QA reports it |
| `license` | `"CSLB #1099999"` | Trust strip, proof section, FAQ, footer |
| `bonded` | `true` | Only when CSLB shows an active contractor's bond. The trust strip says "Licensed & bonded" |
| `since` | `2016` | The year they started (CSLB first issued date works). "Serving [city] since 2016" in the trust strip |
| `secondOpinion` | `true` | Only if they offer free second opinions. Trust strip, a callout under the services, and an FAQ |
| `mapNearby` | `["Ceres", "Denair"]` | 1 or 2 nearby towns shown as plain map labels (no pin) for context |
| `unverified` | `["Insured", "Upfront pricing"]` | Claims on the page that the owner still has to confirm. The build lists them |
| `owner` | `{ "name": "Dana Whitfield", "role": "Owner and lead tech", "story": "...", "quote": "...", "photo": "owners/dana.jpg" }` | Meet the family. Needs a name plus a story or quote. `photo` is optional: only a real photo of the owner, never stock |

Established businesses:

| Field | Example | Notes |
|---|---|---|
| `googleRating` | `4.9` | From their Google listing |
| `reviewCount` | `212` | From their Google listing |
| `googleReviewsUrl` | `"https://g.page/r/XXXX/reviews"` | Google Business Profile > Ask for reviews gives both links |
| `writeReviewUrl` | `"https://g.page/r/XXXX/review"` | "Write a review" in the top bar. In new-business mode it becomes the "Leave us a review" button |
| `reviews` | `[{ "name": "Elena R.", "city": "Manteca", "when": "2 weeks ago", "quote": "..." }]` | 3 short quotes copied word for word from Google |

New businesses:

| Field | Example | Notes |
|---|---|---|
| `yearsInTrade` | `14` | Years the owner has worked in the trade, even before this business |
| `warranty` | `"1-year warranty on all labor, in writing"` | Their real warranty only |
| `writeReviewUrl` | as above | The "Leave us a review" button |

Nice to have:

| Field | Example | Notes |
|---|---|---|
| `startingPrices` | `[{ "service": "AC repair", "from": 189, "to": 650, "note": "..." }]` | The estimate section shows a price range per service. Without it, the estimate is a quick quote by text: pick the service, describe the problem, get a text back |
| `specials` | `[{ "amount": "$79", "title": "Fall furnace check", "text": "...", "fine": "Through Dec 31." }]` | Their real offers only |
| `financing` | `{ "apr": 7.99, "min": 3000, "max": 25000, "terms": [36, 60, 84, 120], "bullets": ["..."], "url": "https://..." }` | Payment calculator. Without `apr`, a short note and a button. `url` is their lender page if they have one |
| `membership` | `{ "name": "Sunrise Club", "lead": "...", "price": "$17", "per": "a month", "benefits": [{ "title": "...", "text": "..." }], "cardLines": [{ "label": "Next tune-up", "value": "April" }] }` | Their real plan only |
| `team` | `[{ "name": "Rico", "role": "HVAC tech" }]` | Name cards under the owner story |
| `promises` | `["We clean up before we leave"]` | Check chips under the owner story. Only what they actually promise |
| `logoMark` | `"logos/name-mark.png"` | The square icon part of their logo, for the favicon and the map pin. Without it, the full logo is used |
| `heroPhoto` | `{ "src": "photos/name/owner-van.png", "alt": "...", "ogAlt": "Dana, owner of Sunrise, in front of her van.", "ogFocusY": 30, "position": "50% 30%", "positionDesktop": "50% 25%", "positionWide": "50% 20%", "box": "0,0,1,0.9" }` | Their own hero photo, best a wide shot of the owner by the van. The build makes the banner sizes and og.jpg from it (scripts/hero-images.py, needs Python and Pillow). `position*` is the CSS object-position per screen size, `ogFocusY` (0 top to 100 bottom) picks the band for og.jpg, `box` trims the photo first. Without it: the stock HVAC tech or plumber, with its own og image. Never recolor or filter it |
| `headerMark` | `"logos/name-header.png"` | The square mark for the header, beside the name (for example just the picture part of the logo, on its own background). Without it, `logoMark` |
| `logoTag` | `"Plumbing · Heating & Air"` | The small-caps line under the name in the header. Without it, `tagline` |
| `headlineAccent` | `"shows up on time."` | With `headline`, the hero headline is `headline` on line 1 and this on line 2, in the accent color with the underline |
| `mainService`, `state` | `"Plumbing & HVAC Repair"`, `"CA"` | The link-preview title: `Name | mainService in City, ST` |
| `trust` | `[{ "icon": "i-clock", "strong": "24/7 emergency service" }, { "icon": "i-wrench", "strong": "Maintenance plans", "sub": "from $149/year" }]` | Replaces the automatic trust row. A sub starting lowercase continues the label; any other sub gets its own smaller line |
| `servicesLead` | text | The line under the services heading |
| `logo` | `"logos/sunrise-comfort.svg"` | Path relative to the data file. No logo: the business name with a colored initial |
| `yearsInBusiness` | `12` | "12 years local" in the trust strip |
| `headerHours` | `"Call or text, 8am to 8pm"` | Optional short label next to the phone in the header. Without it, `hours` is used |
| `hours`, `email`, `locations`, `faqs` | see `example.json` | Header, footer, and FAQ |
| `shortName`, `tagline` | `"Sunrise"` | Header name when the full name is long |
| `pill`, `pillShort` | `"Plumbing services in San Joaquin County"` | Override the line above the headline. Normally it is built for you as "[their services] in [their counties]" |
| `counties` | `["San Joaquin", "Stanislaus"]` | Only if the map cannot be built (no network) or the counties read wrong |
| `mapLabelSide` | `{ "Ripon": "b" }` | Moves one city label on the map (r, l, t, b, tr, tl, br, bl) if two ever touch |
| `trade`, `tradeLabel` | `"plumbing"`, `"Plumbing"` | hvac, plumbing, both, electrical, roofing, landscaping, or general. Picks the FAQ defaults and sample reviews. Set it when the build guesses wrong (an HVAC company with a water heater card is still `"hvac"`) |
| `faq` | `false` | Hides the FAQ. Without `faqs`, the build writes defaults for the trade |
| service `tone`, `icon` | `"second"`, `"i-waterheater"` | Per service: which color its card uses, and its icon if the automatic one is wrong |
| `headline`, `lead`, `description` | text | Override the hero copy and the link-preview description |
| `insured`, `upfrontPricing`, `guarantee` | `false` | All default to true. Set false to hide one |
| `previewUrl` | `"https://byw-sunrise-comfort.pages.dev/"` | Only if you deploy somewhere other than the default project name |

Rules baked in:

- Title and link preview: `Business Name | Main Service in City, ST`, no og:site_name, og.jpg cut from the hero photo.
- The hero line is a pill in their brand color: one line on desktop, a shorter version on phones, never under 12px. The build fails if no version fits a 320px phone.
- No "#1" or "best" claims, no em dashes, no Claude mentions, and no Pinwheel name or logo. The build stops if it finds any.
- Photos are real, free-license stock (Pexels, Unsplash), never recolored, with no other company's logo. HVAC previews use the technician at the condenser, plumbing previews the plumber under the sink.
- Family photos appear only in the request-a-visit section.
- How a visit works is Pinwheel's 3 steps. Step 3: "When we're done, photos of the finished work go straight to your phone."

## Make a preview

```bash
# 1. Start from the example
cp prospects/example.json prospects/sunrise-comfort.json
#    Edit it. Delete every field you do not have. Delete the _comment line.
#    Logo file (if any) goes in prospects/logos/.

# 2. Build it
node scripts/build-preview.mjs prospects/sunrise-comfort.json
#    -> previews/sunrise-comfort/ and a note listing any sections it left out.

# 3. Look at it on your phone before sending
npx serve previews/sunrise-comfort

# 4. Put it on Cloudflare Pages
export CLOUDFLARE_API_TOKEN=...      # one-time setup below
export CLOUDFLARE_ACCOUNT_ID=...
scripts/deploy-preview.sh sunrise-comfort
#    -> https://byw-sunrise-comfort.pages.dev/
```

Change something later: edit the data file, run steps 2 and 4 again. Same link.

## One-time Cloudflare setup (about 5 minutes)

1. Make a free account at https://dash.cloudflare.com/sign-up and confirm the email.
2. **Account ID:** in the dashboard, open **Compute (Workers)** or **Workers & Pages**. The Account ID is in the right sidebar of that overview page. Copy it.
3. **API token:** click your profile icon (top right) > **My Profile** > **API Tokens** > **Create Token** > **Create Custom Token**. Name it `byw-previews`. Permissions: **Account** / **Cloudflare Pages** / **Edit**. Account Resources: your account. Continue, create, and copy the token. It is shown once.
4. Put both in your shell before deploying (or add them to `~/.zshrc`):

   ```bash
   export CLOUDFLARE_ACCOUNT_ID=paste-here
   export CLOUDFLARE_API_TOKEN=paste-here
   ```

The deploy script uses `npx wrangler`, so Node 18 or newer is the only thing that needs to be installed. Each prospect is its own Pages project (`byw-NAME`), so a preview can be deleted on its own: `npx wrangler pages project delete byw-NAME`.

Client sites stay on Netlify. Previews stay on Cloudflare. Nothing about a preview touches a client site.

## Test previews

Three made-up businesses live in this folder to test the fallbacks:

- `sunrise-comfort.json`: established, everything filled in, a logo, custom colors, 5.0 rating (title gets "5-Star Service"), starting prices, specials, financing, and membership.
- `delta-air.json`: established, 4.6 rating, default red, no logo. No specials, prices, owner, FAQ, license, hours, email, or locations, so those sections disappear and the estimate is a quick quote.
- `oakline-plumbing.json`: a brand-new plumbing company with no reviews, blue brand. New-business mode: 3 sample reviews tagged "Sample", proof section, owner story, warranty, "Leave us a review".

Build all three with the commands above to see the difference.

## How it works

- `template/homepage.html` is the page with `{{fields}}` and `{{#if field}}...{{/if}}` blocks. `template/optional/` holds the specials, financing, and membership sections (same markup as Pinwheel's `partials/optional/`, filled from data). `template/preview.css` and `template/preview.js` add the preview-only pieces. It all shares `css/site.css`, `js/site.js`, the fonts, photos, and video with the Pinwheel site, so a design fix there improves every preview.
- The map comes from `scripts/build-map.mjs` (the same script as Pinwheel's map), cached in `scripts/.cache/`, so a rebuild works offline.
- `scripts/build-preview.mjs` fills the template, escapes every value, checks for leftovers, and copies only the files the page uses. No dependencies.
- The `previews/` folder is ignored by git. Rebuild any preview from its data file in a second.
