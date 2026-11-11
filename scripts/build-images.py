#!/usr/bin/env python3
"""
build-images.py: makes the self-hosted photo files. Optional dev helper, not a build step.
The WebP files in images/photos/ are committed, so the site publishes as-is.

Run it after `node scripts/sync.mjs` whenever scripts/photos.json changes:

    python3 scripts/build-images.py           # make any missing files
    python3 scripts/build-images.py --force   # remake every file
    python3 scripts/build-images.py --prune   # also delete files no page uses

For each file listed in scripts/image-manifest.json it:
  1. downloads the photo's `src` once (cached in scripts/.cache/, not committed),
  2. applies `tone` if set (exposure and white balance only, to match a set of photos),
  3. trims it to `box` (keeps things like another company's logo out of every crop),
  4. crops to the size around the focal point `fp`, like a CDN focal-point crop,
  5. saves WebP (quality 70, or 62 at 1200px and wider).

Needs Python 3.9+ and Pillow (pip install pillow).
"""
import json, os, sys, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'images', 'photos')
CACHE = os.path.join(ROOT, 'scripts', '.cache')


def tone(img, t):
    """Exposure and white balance only: one gain per channel, applied in linear light (like a camera's
    exposure and white-balance settings). No curves, filters, or tints. photos.json: "tone": {"exposure": 1.06, "wb": [r, g, b]}."""
    if not t:
        return img
    e = float(t.get('exposure', 1)); wb = t.get('wb', [1, 1, 1])
    to_lin = [((v / 255 + 0.055) / 1.055) ** 2.4 if v / 255 > 0.04045 else v / 255 / 12.92 for v in range(256)]
    def to_srgb(x):
        x = min(max(x, 0.0), 1.0)
        return round(255 * (1.055 * x ** (1 / 2.4) - 0.055 if x > 0.0031308 else 12.92 * x))
    lut = []
    for g in wb:
        lut += [to_srgb(to_lin[v] * e * float(g)) for v in range(256)]
    return img.point(lut)


def source(key, photo):
    if photo.get('file'):  # a copy kept in the repo (see photos.json "edit")
        return tone(Image.open(os.path.join(ROOT, photo['file'])).convert('RGB'), photo.get('tone'))
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, f"{key}-{photo['id']}.jpg")
    if not os.path.exists(path):
        print(f'  downloading {key} from {photo["site"]}')
        req = urllib.request.Request(photo['src'], headers={'User-Agent': 'Mozilla/5.0 (pinwheel concept build)'})
        with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as f:
            f.write(r.read())
    return tone(Image.open(path).convert('RGB'), photo.get('tone'))


def render(img, spec):
    sw, sh = img.size
    x0, y0, x1, y1 = spec['box']
    img = img.crop((round(x0 * sw), round(y0 * sh), round(x1 * sw), round(y1 * sh)))
    w, h = spec['w'], spec['h']
    if spec['crop']:
        bw, bh = img.size
        target = w / h
        cw, ch = (round(bh * target), bh) if bw / bh > target else (bw, round(bw / target))
        fx, fy = spec['fp']
        cx = min(max(round(fx * bw - cw / 2), 0), bw - cw)
        cy = min(max(round(fy * bh - ch / 2), 0), bh - ch)
        img = img.crop((cx, cy, cx + cw, cy + ch))
        if cw < w:
            print(f"  note: {spec['file']} is upscaled from {cw}px; use a larger src")
    return img.resize((w, h), Image.LANCZOS)


def main():
    force, prune = '--force' in sys.argv, '--prune' in sys.argv
    photos = json.load(open(os.path.join(ROOT, 'scripts', 'photos.json')))
    manifest = json.load(open(os.path.join(ROOT, 'scripts', 'image-manifest.json')))
    os.makedirs(OUT, exist_ok=True)
    cache, made = {}, 0
    for spec in manifest:
        dest = os.path.join(OUT, spec['file'])
        if os.path.exists(dest) and not force:
            continue
        key = spec['key']
        if key not in cache:
            cache[key] = source(key, photos[key])
        render(cache[key], spec).save(dest, 'WEBP', quality=spec['q'], method=6)
        made += 1
    wanted = {s['file'] for s in manifest}
    extra = [f for f in os.listdir(OUT) if f.endswith('.webp') and f not in wanted]
    if prune:
        for f in extra:
            os.remove(os.path.join(OUT, f))
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT) if f.endswith('.webp'))
    print(f'Done. {made} file(s) made, {len(wanted)} in use, {total / 1024:.0f} KB total.'
          + (f' Removed {len(extra)} unused.' if prune and extra else f' {len(extra)} unused (use --prune).' if extra else ''))


if __name__ == '__main__':
    main()
