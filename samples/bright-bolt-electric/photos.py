#!/usr/bin/env python3
"""photos.py: makes the Bright Bolt Electric photo files from photos.json (needs Pillow).

    python3 samples/bright-bolt-electric/photos.py

Downloads each source once into scripts/.cache/bright-bolt-electric/, then crops around the focal point (fp),
paints out any listed areas (only on photos with no people), and writes WebP files into photos/.
People photos are never edited: crop and resize only."""
import json, os, urllib.request
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(ROOT, 'scripts', '.cache', 'bright-bolt-electric')
OUT = os.path.join(HERE, 'photos')
os.makedirs(CACHE, exist_ok=True); os.makedirs(OUT, exist_ok=True)
data = json.load(open(os.path.join(HERE, 'photos.json')))

for key, p in data.items():
    if key.startswith('_'): continue
    src = os.path.join(CACHE, f"{key}-{p['id']}.jpg")
    if not os.path.exists(src):
        print('  downloading', key)
        req = urllib.request.Request(p['src'], headers={'User-Agent': 'Mozilla/5.0 (sample site build)'})
        with urllib.request.urlopen(req, timeout=90) as r, open(src, 'wb') as f: f.write(r.read())
    img = Image.open(src).convert('RGB')
    W, H = img.size
    if p.get('paint'):
        assert not p.get('people'), 'never edit a photo with people in it'
        d = ImageDraw.Draw(img)
        for x0, y0, x1, y1 in p['paint']:
            bx = (int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))
            # fill with the median color just left of the area (the same dark panel)
            sample = img.crop((bx[0] - 6, bx[1], bx[0] - 1, bx[3])).resize((1, 1), Image.LANCZOS).getpixel((0, 0))
            d.rectangle(bx, fill=sample)
    if p.get('clothes_color'):
        # People photos: clothes color only (CLAUDE.md). Inside each listed area on the clothing, warm-colored pixels
        # (a brand patch, stitched lettering) take the clothing's own color, measured from the cap fabric beside them,
        # keeping a little of their light and shade so the fabric still looks like fabric.
        import colorsys
        px = img.load()
        for area in p['clothes_color']:
            x0, y0, x1, y1 = area[:4]; vmax = area[4] if len(area) > 4 else 1.0  # vmax: only pixels this dark (the fabric, never skin)
            bx = (int(x0 * W), int(y0 * H), int(x1 * W), int(y1 * H))
            # reference: the darkest quarter of the area is the cap fabric itself
            vals = sorted((sum(px[x, y]), px[x, y]) for x in range(bx[0], bx[2], 3) for y in range(bx[1], bx[3], 3))
            ref = vals[: max(1, len(vals) // 4)]
            cr, cg, cb = (sum(c[1][i] for c in ref) / len(ref) for i in range(3))
            ch, cs_, cv = colorsys.rgb_to_hsv(cr / 255, cg / 255, cb / 255)
            for x in range(bx[0], bx[2]):
                for y in range(bx[1], bx[3]):
                    r, g, b = px[x, y]
                    h_, s_, v_ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                    warm = ((h_ < 0.14 or h_ > 0.88) and s_ > 0.12) or r > b + 2 or r > g + 4
                    stitch_red = s_ > 0.4 and (h_ < 0.035 or h_ > 0.9)  # saturated pure red thread, never skin tones
                    if warm and (v_ <= vmax or stitch_red):
                        nv = cv + (v_ - cv) * 0.18
                        nr, ng, nb = colorsys.hsv_to_rgb(ch, cs_, max(0, min(1, nv)))
                        px[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255))
    for name, w, h in p['out']:
        if h == 0:  # the whole photo (trimmed to 'box' if set) at full size, as the source for the hero files
            x0, y0, x1, y1 = p.get('box', [0, 0, 1, 1])
            im = img.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
            if w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            im.save(os.path.join(OUT, name), quality=84, optimize=True, progressive=True); continue
        ar = w / h
        z = p.get('zoom', 1.0)
        cw = min(W, H * ar) / z; ch = cw / ar
        fx, fy = p['fp']
        x = min(max(fx * W - cw / 2, 0), W - cw); y = min(max(fy * H - ch / 2, 0), H - ch)
        im = img.crop((round(x), round(y), round(x + cw), round(y + ch))).resize((w, h), Image.LANCZOS)
        im.save(os.path.join(OUT, name), 'WEBP', quality=72 if w < 1200 else 64, method=6)
    print('  ok', key)
