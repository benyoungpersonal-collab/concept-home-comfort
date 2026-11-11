# Bright Bolt Electric (sample site)

A made-up electrician in Tracy, CA, built as a sample site by Ben Young Web Design. Live at
https://byw-home-comfort.netlify.app/bright-bolt-electric/ (Netlify publishes `main`). The served files are in
`bright-bolt-electric/` at the repo root; this folder holds the sources. Netlify returns a 404 for `/samples/*`.

Name check: a web search found no electrical company called "Bright Bolt Electric" in California (there are
unrelated "Bolt Electric" shops in Danville, Perris, and Fullerton). That is not a trademark search.

## Rebuild

```bash
python3 samples/bright-bolt-electric/photos.py                         # only when photos.json changes (needs Pillow)
node scripts/build-preview.mjs samples/bright-bolt-electric/site.json  # template build -> previews/bright-bolt-electric/
node samples/bright-bolt-electric/finish.mjs                           # -> bright-bolt-electric/
```

Link preview picture: after a hero change goes live, remake it under a new dated name, then run finish.mjs again
(it copies the newest `share/og-share-*.jpg` in and points og:image and twitter:image at it):

```bash
node scripts/share-image.cjs --url https://byw-home-comfort.netlify.app/bright-bolt-electric/ --out samples/bright-bolt-electric/share/og-share-YYYY-MM-DD.jpg
```

The build is the same template every prospect preview uses (photo-first hero, friendly fonts, zigzag bolt edges,
trust tiles, photo service cards, picture-book motion, quick quote, FAQ, map). `finish.mjs` adds what only this
sample has and writes `bright-bolt-electric/PHOTO-LIST.md`. It is a sample site, so it is not deployed to
Cloudflare like a prospect preview.

## Files

| File | What it is |
|---|---|
| `site.json` | The data file: name, phone, cities, services, colors, FAQ, 6 illustrative reviews |
| `photos.json`, `photos.py`, `photos/` | Every photo: Unsplash source, crop, and the files the build uses |
| `hero-quality.py` | Re-saves the hero banner files a little lighter (the phone hero is the largest paint) |
| `bolt.mjs` | Bolt the mascot, drawn as SVG in separate parts (body, eyes, each arm, hat, sparks) |
| `bolt.css`, `bolt.js` | Bolt's motion: slides in and back out with the page, blinks, bobs, sparks, and hops when tapped |
| `finish.mjs` | The finishing pass (colors, Bolt in 4 spots, illustrative reviews, copy, canonical, schema, sample footer) |
| `mark.svg` | The header mark, favicon, and map pin |
| `share/` | The link preview picture (homepage on a laptop and a phone), newest date wins |

## Bolt

- Hero: peeks up from behind the hero card and waves. Services: slides in and points at the cards.
  Quick quote: thumbs up with "We'll text you back!" Footer: waves, "Thanks for stopping by!"
- Comes in when his spot scrolls into view, goes back out when you scroll back up past it. Idle motion runs only
  while he is on screen. Tap him for a hop and a spark burst.
- Decorative: every spot is `aria-hidden`. Reduce motion: he stands in place. Only transform and opacity animate.
