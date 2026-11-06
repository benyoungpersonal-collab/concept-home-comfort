# Homepage previews for prospects

One data file per business. One command builds a finished homepage preview in `previews/NAME/`. One more command puts it on Cloudflare Pages at `https://byw-NAME.pages.dev/`.

Every preview is `noindex`, says "Homepage preview by Ben Young Web Design" in the footer, and matches the current Pinwheel homepage, filled with the prospect's own name, phone, colors, services, and cities. Anything you leave out of the data file is left out of the page. No placeholder text, no empty boxes.

## What the page shows

Core sections, in this order: hero, trust strip, reviews (or proof, see below), services, how a visit works, estimate, meet the family, service areas, FAQ, request a visit.

Optional sections, on only when the data file has them: specials (right after how a visit works), financing, and membership.

Two modes, picked from the data file:

| Mode | When | What changes |
|---|---|---|
| Established | `googleRating`, `googleReviewsUrl`, and review quotes are filled in, and `reviewCount` is 5 or more | Rating bar with "Write a review", rating badge in the hero, review quotes. Title adds "5-Star Service" only when the rating is 5.0 |
| New business | Few or no reviews | No rating or review sections. A proof section instead: license, insured, years in the trade, warranty, owner, service area, and a "Leave us a review" button |

Set `"mode": "new"` or `"mode": "established"` to choose yourself.

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
| `services` | `[{ "name": "Heating", "blurb": "...", "sub": ["Furnace repair", "Heat pumps"], "url": "https://..." }]` | Main services with sub-services. Decides the trade (HVAC, plumbing, or both), the hero photo, and the title. `url` is optional: only when they have a real page for that service, and each one becomes a service page button |
| `colors` | `{ "brand": "#1F6FB8", "navy": "#14213D" }` | `brand` is their main color (red, blue, anything). No colors: Pinwheel's red-orange. Every shade on the page, the map, and the accents follows it, and light colors are darkened where text sits on them |
| `license` | `"CSLB #1099999"` | Trust strip, proof section, footer |
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
| `logo` | `"logos/sunrise-comfort.svg"` | Path relative to the data file. No logo: the business name with a colored initial |
| `yearsInBusiness` | `12` | "12 years local" in the trust strip |
| `hours`, `email`, `locations`, `faqs` | see `example.json` | Header, footer, and FAQ |
| `shortName`, `tagline` | `"Sunrise"` | Header name when the full name is long |
| `pill`, `pillShort` | `"Plumbing services in San Joaquin County"` | Override the line above the headline. Normally it is built for you as "[their services] in [their counties]" |
| `counties` | `["San Joaquin", "Stanislaus"]` | Only if the map cannot be built (no network) or the counties read wrong |
| `mapLabelSide` | `{ "Ripon": "b" }` | Moves one city label on the map (r, l, t, b, tr, tl, br, bl) if two ever touch |
| `trade`, `tradeLabel` | `"plumbing"`, `"Plumbing"` | Only if the build guesses the trade wrong |
| `headline`, `lead`, `description` | text | Override the hero copy and the link-preview description |
| `insured`, `upfrontPricing`, `guarantee` | `false` | All default to true. Set false to hide one |
| `previewUrl` | `"https://byw-sunrise-comfort.pages.dev/"` | Only if you deploy somewhere other than the default project name |

Rules baked in:

- Title and link preview: `Business Name | City HVAC` (or Plumbing, or HVAC & Plumbing), plus ` | 5-Star Service` only in established mode with a 5.0 rating.
- The hero line is a pill in their brand color: one line on desktop, a shorter version on phones, never under 12px. The build fails if no version fits a 320px phone.
- No "#1" or "best" claims, no em dashes, no Claude mentions, and no Pinwheel name or logo. The build stops if it finds any.
- Photos are real, free-license stock (Pexels, Unsplash), never recolored, with no other company's logo. HVAC previews use the technician at the condenser, plumbing previews the plumber under the sink.
- Family photos appear only in the request-a-visit section and the link-preview image (no words on it).
- Service page links are always equal-size rounded buttons (icon, name, arrow): 2 by 2 on phones, one row on desktop, never a row of plain text links. Heating uses the brand color, cooling the logo blue, plumbing navy, and air quality light blue with dark text. The build stops if it finds plain service text links.
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
- `oakline-plumbing.json`: a brand-new plumbing company with no reviews, blue brand. New-business mode: proof section, owner story, warranty, "Leave us a review".

Build all three with the commands above to see the difference.

## How it works

- `template/homepage.html` is the page with `{{fields}}` and `{{#if field}}...{{/if}}` blocks. `template/optional/` holds the specials, financing, and membership sections (same markup as Pinwheel's `partials/optional/`, filled from data). `template/preview.css` and `template/preview.js` add the preview-only pieces. It all shares `css/site.css`, `js/site.js`, the fonts, and photos with the Pinwheel site, so a design fix there improves every preview.
- The map comes from `scripts/build-map.mjs` (the same script as Pinwheel's map), cached in `scripts/.cache/`, so a rebuild works offline.
- `scripts/build-preview.mjs` fills the template, escapes every value, checks for leftovers, and copies only the files the page uses. No dependencies.
- The `previews/` folder is ignored by git. Rebuild any preview from its data file in a second.
