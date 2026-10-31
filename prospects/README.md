# Homepage previews for prospects

One data file per business. One command builds a finished homepage preview in `previews/NAME/`. One more command puts it on Cloudflare Pages at `https://byw-NAME.pages.dev/`.

Every preview is `noindex`, says "Homepage preview by Ben Young Web Design" in the footer, and uses the Pinwheel design with the prospect's name, phone, colors, rating, reviews, services, and service areas. Anything you leave out of the data file is left out of the page. No placeholder text, no empty boxes.

## What to collect from each prospect

Must have (the build refuses to run without these):

| Field | Example | Where to find it |
|---|---|---|
| `name` | `"Sunrise Comfort Co."` | Their Google Business Profile, exactly as written |
| `phone` | `"209-555-0177"` | Google Business Profile or their current site |
| `city` | `"Manteca"` | The city on their Google listing |

Should have (each one unlocks a section; leave it out and the section hides):

| Field | Example | Notes |
|---|---|---|
| `serviceAreas` | `["Manteca", "Lathrop", "Ripon"]` | Every city they serve. Put their home city in the list too; it gets the pin |
| `services` | `[{ "name": "Heating", "sub": ["Furnace repair", "Heat pumps"] }]` | Main services with sub-services. `blurb` is an optional one-liner per service |
| `googleRating` | `5.0` | From their Google listing. The page title adds "5-Star Service" only when this is exactly 5.0 |
| `reviewCount` | `212` | From their Google listing |
| `googleReviewsUrl` | `"https://g.page/r/XXXX/reviews"` | Google Business Profile > Ask for reviews gives both links. Without this the rating hides |
| `writeReviewUrl` | `"https://g.page/r/XXXX/review"` | The "Write a review" link in the top bar |
| `reviews` | `[{ "name": "Elena R.", "city": "Manteca", "when": "2 weeks ago", "quote": "..." }]` | 3 short quotes copied word for word from Google. `city` and `when` are optional |

Nice to have:

| Field | Example | Notes |
|---|---|---|
| `logo` | `"logos/sunrise-comfort.svg"` | Path relative to the data file. SVG, PNG, JPG, or WebP. No logo: the page uses the business name with a colored initial |
| `colors` | `{ "brand": "#D9731F", "navy": "#1E5E8A" }` | Hex colors. Default is Pinwheel's orange and navy. Light colors are darkened automatically where text sits on them, so any color stays readable |
| `license` | `"CSLB #1099999"` | Shows in the trust strip and footer |
| `yearsInBusiness` | `12` | Shows "12 years local" in the trust strip |
| `hours` | `"Mon to Sat, 7am to 7pm"` | Header, hero, footer |
| `email` | `"office@example.com"` | Footer |
| `specials` | `[{ "amount": "$79", "title": "Fall furnace check", "text": "...", "fine": "Through Dec 31." }]` | Specials section. Use their real offers only |
| `faqs` | `[{ "q": "...", "a": "..." }]` | FAQ section |
| `locations` | `[{ "name": "Manteca shop", "address": "1200 Industrial Park Dr", "cityLine": "Manteca, CA 95337" }]` | Footer locations |
| `shortName` | `"Sunrise"` | Used in the header when the full name is long |
| `tagline` | `"Heating · Air · Plumbing"` | Small line under the name (only when there is no logo) |
| `headline`, `eyebrow`, `lead`, `description` | text | Override the hero copy and the link-preview description |
| `insured`, `upfrontPricing`, `guarantee` | `false` | All three default to true (trust strip items). Set to false to hide one |
| `previewUrl` | `"https://byw-sunrise-comfort.pages.dev/"` | Only if you deploy somewhere other than the default project name |

Rules baked in:

- Title and link preview: `Business Name | City HVAC`, plus ` | 5-Star Service` only when `googleRating` is 5.0.
- No "#1" or "best" claims anywhere. Do not add them to the data file either.
- No em dashes. The build stops if it finds one.
- The link-preview image is a family photo (not the hero photo), the same for every preview.

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

Two made-up businesses live in this folder to test the fallbacks:

- `sunrise-comfort.json`: everything filled in, a logo, custom colors, 5.0 rating (so the title gets "5-Star Service").
- `delta-air.json`: no logo, 4.6 rating, no specials, FAQ, license, hours, email, or locations. Those sections disappear and the title has no "5-Star Service".

Build both with the commands above to see the difference.

## How it works

- `template/homepage.html` is the page with `{{fields}}` and `{{#if field}}...{{/if}}` blocks. It shares `css/site.css`, `js/site.js`, the fonts, photos, and video with the Pinwheel site, so a design fix there improves every preview.
- `scripts/build-preview.mjs` fills the template, escapes every value, checks for leftovers, and copies only the files the page uses. No dependencies.
- The `previews/` folder is ignored by git. Rebuild any preview from its data file in a second.
