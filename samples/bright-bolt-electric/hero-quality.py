#!/usr/bin/env python3
"""Re-saves the hero banner files from the full-size source at a lighter WebP quality (same sizes and crop as
scripts/hero-images.py), so the phone hero loads faster. Run by finish.mjs: hero-quality.py SRC OUTDIR [BOX] (BOX: the same x0,y0,x1,y1 trim as heroPhoto.box)"""
import os, sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
if len(sys.argv) > 3 and sys.argv[3]:
    x0, y0, x1, y1 = (float(v) for v in sys.argv[3].split(','))
    im = im.crop((round(x0 * im.width), round(y0 * im.height), round(x1 * im.width), round(y1 * im.height)))
W, H = im.size
for name in sorted(os.listdir(out)):
    if not name.endswith('.webp'): continue
    w, h = (int(x) for x in name.rsplit('-', 1)[1][:-5].split('x'))
    (im if w == W else im.resize((w, h), Image.LANCZOS)).save(os.path.join(out, name), 'WEBP', quality=58 if w >= 1200 else 62, method=6)
