# Rules for this repo

## Homepage previews: deploy every build yourself

After any preview build or change, deploy it yourself with Wrangler:

```bash
npx wrangler pages deploy previews/<slug> --project-name=byw-<slug> --branch=main --commit-dirty=true
```

- `<slug>` is the business-name slug (the data file name in `prospects/`, e.g. `horizon-heating-air`).
- If the project does not exist yet, create it first:
  `npx wrangler pages project create byw-<slug> --production-branch=main`
- Use the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` environment variables. Never print the token.
  - In a Claude Code cloud session the token is saved as a network secret for api.cloudflare.com and the proxy injects it.
    There is no variable holding it, so run Wrangler with `CLOUDFLARE_API_TOKEN=proxy-injected` (a placeholder the proxy replaces).
    Get the account ID with `GET https://api.cloudflare.com/client/v4/accounts` if `CLOUDFLARE_ACCOUNT_ID` is not set.
- Cloud-session catch: in a Claude Code cloud session the proxy overwrites Wrangler's short-lived upload token with the
  API token, so `wrangler pages deploy` fails at "check-missing" (code 8000013), and Wrangler 4.159+ sends
  `pages project create` to Workers. There is no working workaround yet: a deployment sent without the upload step
  serves 500s for any file Cloudflare does not already have. In that case, build the zip instead
  (`cd previews/<slug> && zip -qr -X <scratchpad>/byw-<slug>.zip . -x ".*"`, index.html at the top level) and send it
  to Ben for Create deployment, and say why.
- A brand-new project's pages.dev link can return 500 for a few minutes while Cloudflare sets up the domain.
- Before redeploying an existing project, compare the live page with your build. Another session may have deployed newer work.
- When the deploy finishes, send Ben the live `https://byw-<slug>.pages.dev/` link and a phone screenshot of the deployed page.
- No zip files unless Ben asks for one.

## Going live

- Sample sites (Pinwheel and any other sample): when a change passes QA, merge it into main right away. Netlify publishes main to https://byw-home-comfort.netlify.app automatically. If you can't merge, say so in one line and Ben will get it merged.
- Prospect homepage previews: deploy them right away, as described above. If you have to send a zip instead, Ben has Claude chat deploy it from his Mac.
- Paying clients' live sites: never publish a change until Ben has seen it and says go.

## Hero photo

- Applies to every site in this repo (Pinwheel, samples, prospect previews, the template).
- Never shrink or shorten the hero photo to fit the card. To show more of the card, move the card up over the photo or make the card slimmer.
- On desktop the photo always runs behind the card, edge to edge, down to the next section's edge, with no gap (Pinwheel's layout; the template does this by default).
- Check the first screen at 1280x720, 1440x900, and 1920x1080: the headline, paragraph, and buttons must show.

## Colors

- Buttons and accents use Ridgeline's gold (#D4A531, hover #E0B444) unless the business already has its own brand colors. Never a brown or mustard gold. Pick one rich main color to go with it, like navy, deep teal, charcoal, or forest green. No peach or pastel colors. The template does this when the data file has no `colors.brand`: gold fills with white text and the soft dark shadow, navy headline words with a gold underline.
- On every new prospect preview, text and icons on gold are always white with a thin, soft dark text shadow (0 1px 2px, navy at about 45%) so the white reads clearly. Samples (Pinwheel, Bright Bolt) keep their own button text colors.
- Main buttons get a beveled shine (css/alive.css, shared by Pinwheel, Bright Bolt, and every preview): a subtle gradient, lighter at the top and richer at the bottom, a thin light highlight along the top edge, and a soft shadow underneath. A gentle shine sweeps across each main button every 6 seconds on every screen size, plus on hover on desktop. No sweep with "reduce motion". Each site keeps its own button color. Check button text contrast at the top, middle, and bottom of the gradient.
- No pause button on hero videos: a tap or click on the video pauses it (js/site.js), and with "reduce motion" on it shows the still image instead.

## Owner section

- The owner section label is always "Meet the owner."
- Never put a job-site photo in the owner section. With no real owner photo, use the illustrated owner placeholder (duotone in the site's colors, a small wave and blink, and a "Your photo here" tag), drawn as a man or a woman to match the owner when we know who it is. The template draws it by default; set `owner.gender` to "man" or "woman" in the data file.

## Remodelers and general contractors

- Never lead a general contractor or remodeling site with a bathroom photo or headline unless the business says bathrooms are their focus.

## Link preview picture
- Every sample site and every new prospect preview gets a link preview picture: its homepage's first screen on a laptop with the phone version over the laptop's front right corner (the thin iPhone-style frame from benyoungwebdesign.com), on a soft gradient in the site's darkest brand color. 1200x630 JPG under 300 KB, no words on it.
- Make it with `node scripts/share-image.cjs --url LIVE_URL --out images/og-share-YYYY-MM-DD.jpg` (today's date in the name, so phones don't show an old cached picture). For a preview that isn't live yet, point --url at a local server of its folder.
- Point the pages at it with the same script: `node scripts/share-image.cjs --tags-only --image-url FULL_LIVE_URL_OF_THE_JPG --name "Business Name" --html *.html`. It sets og:image, og:image:width, og:image:height, og:image:alt ("Business Name homepage on a laptop and a phone."), twitter:image, and twitter:image:alt.
- Remake it, under a new dated name, whenever a site's hero changes. After it goes live, open the live page and confirm the picture loads from the live address.

## Photos

- Photos with people are real stock photos (Unsplash or Pexels, free license) or the client's own. AI may only change the color of their clothes. Nothing else about a person or the scene is changed or generated.
- Photos without people (equipment, homes, finished work) can be AI-made.
- On Pinwheel, techs wear the same orange.
- To make a set of photos match (like the service cards), adjust exposure and white balance only, with no filters or color tints (the "tone" setting in scripts/photos.json).
- Note every photo's source in PHOTO-LIST.md (run `node scripts/photo-list.mjs` after photo changes).
- The old stock photo set is retired and deleted (the gray-polo tech with the flashlight at the AC unit, the mug in a sweater, the filter change, the red-shirt plumber, hero-hvac, hero-plumbing, and the unused family shots). Never bring them back. Template defaults are Pinwheel's current photos.

## Files

- Never save anything to Ben's Desktop. Keep test screenshots and check scripts in a qa/ folder kept out of git, and replace them on each run.
- Photos for previews: Ben puts full-size originals in his Google Drive folder "BYWD Preview Photos". Download them from there, since photos attached in chat get shrunk.
