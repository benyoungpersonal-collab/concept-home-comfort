#!/usr/bin/env python3
"""
hero-images.py: makes the hero banner files and the link-preview image (og.jpg) from one hero photo.

    python3 scripts/hero-images.py --src PHOTO --out DIR --prefix hero --og DIR/og.jpg [--og-focus-y 30] [--box x0,y0,x1,y1]

- The banner files keep the photo's own shape (the page crops it with CSS object-fit, so the whole photo
  is available at every screen size): WebP at 480, 768, 1024, 1536 and 1920 wide, never wider than the source.
- og.jpg is 1200x630 cut from the photo: the full width when the photo is taller than 1200x630, with
  --og-focus-y (0 top to 100 bottom, default 30) picking which band to keep, like CSS object-position.
- --box trims the photo first (fractions of width and height), for example to keep another company's logo out.
- No recolor, tint or filter: resize and crop only.
Prints JSON: {"files": [{"file": ..., "w": ..., "h": ...}], "og": ...}

Called by scripts/build-preview.mjs when a data file has heroPhoto. Needs Python 3.9+ and Pillow.
"""
import argparse, json, os
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('--src', required=True)
p.add_argument('--out', required=True)
p.add_argument('--prefix', default='hero')
p.add_argument('--og', required=True)
p.add_argument('--og-focus-y', type=float, default=30)
p.add_argument('--og-focus-x', type=float, default=50)
p.add_argument('--box', default='')
p.add_argument('--widths', default='480,768,1024,1536,1920')
a = p.parse_args()

im = Image.open(a.src).convert('RGB')
if a.box:
    x0, y0, x1, y1 = [float(v) for v in a.box.split(',')]
    W, H = im.size
    im = im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
W, H = im.size
os.makedirs(a.out, exist_ok=True)
files = []
widths = sorted({w for w in (int(v) for v in a.widths.split(',')) if w < W} | {min(W, max(int(v) for v in a.widths.split(',')))})
for w in widths:
    h = round(H * w / W)
    name = f'{a.prefix}-{w}x{h}.webp'
    (im if w == W else im.resize((w, h), Image.LANCZOS)).save(os.path.join(a.out, name), quality=82 if w >= 1200 else 84, method=6)
    files.append({'file': name, 'w': w, 'h': h})

# og.jpg: 1200x630 (1.905:1)
R = 1200 / 630
if W / H <= R:  # taller than the og shape: full width, pick the band
    ch = round(W / R)
    y = round((H - ch) * a.og_focus_y / 100)
    og = im.crop((0, y, W, y + ch))
else:  # wider: full height, pick the slice
    cw = round(H * R)
    x = round((W - cw) * a.og_focus_x / 100)
    og = im.crop((x, 0, x + cw, H))
os.makedirs(os.path.dirname(os.path.abspath(a.og)), exist_ok=True)
og.resize((1200, 630), Image.LANCZOS).save(a.og, quality=88, optimize=True, progressive=True)
print(json.dumps({'files': files, 'og': a.og, 'source': [W, H]}))
