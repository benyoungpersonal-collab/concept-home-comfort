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
  2. trims it to `box` (keeps things like another company's logo out of every crop),
  3. crops to the size around the focal point `fp`, like a CDN focal-point crop,
  4. saves WebP (quality 70, or 62 at 1200px and wider).

Needs Python 3.9+ and Pillow (pip install pillow).
"""
import json, os, sys, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'images', 'photos')
CACHE = os.path.join(ROOT, 'scripts', '.cache')


def source(key, photo):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, f"{key}-{photo['id']}.jpg")
    if not os.path.exists(path):
        print(f'  downloading {key} from {photo["site"]}')
        req = urllib.request.Request(photo['src'], headers={'User-Agent': 'Mozilla/5.0 (pinwheel concept build)'})
        with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as f:
            f.write(r.read())
    return Image.open(path).convert('RGB')


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
