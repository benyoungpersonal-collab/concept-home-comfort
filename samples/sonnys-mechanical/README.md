# Sonny's Mechanical (homepage preview)

Homepage preview for Sonny's Mechanical, a heating and air company in Auberry, CA, by Ben Young Web Design. Live at
https://byw-home-comfort.netlify.app/sonnys-mechanical/ (Netlify publishes `main`). The served files are in
`sonnys-mechanical/` at the repo root; this folder holds the sources. Netlify returns a 404 for `/samples/*`.

## Where the facts come from

Nothing on the page goes past these sources. Anything not confirmed is in `unverified` in `site.json`.

- CSLB #1162052: SONNYS MECHANICAL INC, 33573 Frazier Rd, Auberry, CA 93602, (559) 392-0743. Corporation, issued
  09/29/2026, expires 09/30/2028, active. C-20 (warm-air heating, ventilating, and air conditioning). $25,000 bond with
  American Contractors Indemnity Company. Workers' comp with Markel Insurance Company. Qualifier George David Wayne III.
- CSLB #1129931: SONNY'S AIR CONDITIONING (his earlier license, same phone and qualifier), Fresno, issued 12/04/2024.
- BBB: Sonny's Air Conditioning, Clovis address, (559) 392-0743. A rating, accredited since 10/16/2026, business
  started 4/7/2024, Mr. George "Sonny" D Wayne, President/CEO. "New construction installation of HVAC services for
  residential and commercial and multi-family." One review (Delores R., 5 stars, 01/01/2026).
- His digital business card (brand.contact/sonnysair): "Specializing in doing the right thing, ALWAYS. Also Air
  Conditioning", email Gwayne@sonnysair.com. His old logo reads "Transparent-Honest-Predictable" (colors: black and
  cyan, used for this preview).
- No Google Business Profile could be read from this environment. Business name, hours, towns, and reviews from Google
  still need checking.

## Rebuild

```bash
python3 scripts/recolor-clothes.py samples/sonnys-mechanical/recolor-hero.json   # hero shirt to navy (needs opencv)
python3 samples/sonnys-mechanical/photos.py                                      # only when photos.json changes
node scripts/build-preview.mjs samples/sonnys-mechanical/site.json               # template build -> previews/
node samples/sonnys-mechanical/finish.mjs                                        # -> sonnys-mechanical/
```

Link preview picture: after a hero change, remake it under a new dated name, then run finish.mjs again:

```bash
node scripts/share-image.cjs --url https://byw-home-comfort.netlify.app/sonnys-mechanical/ --out samples/sonnys-mechanical/share/og-share-YYYY-MM-DD.jpg
```

## Files

| File | What it is |
|---|---|
| `site.json` | The data file: name, phone, license, services, colors, hero copy, owner, FAQ, unverified claims |
| `photos.json`, `photos.py`, `photos/` | Every photo: source, crop, and the files the build uses |
| `recolor-hero.json` | The hero tech's gray polo to navy (scripts/recolor-clothes.py, clothing color only) |
| `finish.mjs` | The finishing pass (hero lines, visit photo and steps, reviews, proof, Meet Sonny, schema, footer line, clean CSS/JS) |
| `sonny.css` | The few styles that differ from the template (slimmer desktop hero card, review tags, card buttons) |
| `share/` | The link preview picture (homepage on a laptop and a phone), newest date wins |
