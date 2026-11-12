#!/usr/bin/env python3
"""photos.py: makes the Sonny's Mechanical photo files from photos.json (needs Pillow).

    python3 samples/sonnys-mechanical/photos.py

Reads each source from photos/originals/ (the AI-made ones) or scripts/.cache/sonnys-mechanical/ (stock, downloaded once), crops around the focal point (fp),
and writes the files into photos/. People photos are never edited here: crop and resize only."""
import json, os, urllib.request
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(ROOT, 'scripts', '.cache', 'sonnys-mechanical')
OUT = os.path.join(HERE, 'photos')
os.makedirs(CACHE, exist_ok=True); os.makedirs(OUT, exist_ok=True)
data = json.load(open(os.path.join(HERE, 'photos.json')))

for key, p in data.items():
    if key.startswith('_'): continue
    src = os.path.join(HERE, 'photos', p['local']) if p.get('local') else os.path.join(CACHE, p['file'])
    if not os.path.exists(src):
        if p.get('make'): raise SystemExit(f"{key}: run first: {p['make']}")
        print('  downloading', key)
        req = urllib.request.Request(p['src'], headers={'User-Agent': 'Mozilla/5.0 (preview build)'})
        with urllib.request.urlopen(req, timeout=90) as r, open(src, 'wb') as f: f.write(r.read())
    img = Image.open(src).convert('RGB')
    W, H = img.size
    for name, w, h in p['out']:
        if h == 0:  # the whole photo (trimmed to 'box'), as the source for the hero files
            x0, y0, x1, y1 = p.get('box', [0, 0, 1, 1])
            im = img.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H)))
            if w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            im.save(os.path.join(OUT, name), quality=86, optimize=True, progressive=True); continue
        ar = w / h
        cw = min(W, H * ar); ch = cw / ar
        fx, fy = p['fp']
        x = min(max(fx * W - cw / 2, 0), W - cw); y = min(max(fy * H - ch / 2, 0), H - ch)
        im = img.crop((round(x), round(y), round(x + cw), round(y + ch))).resize((w, h), Image.LANCZOS)
        im.save(os.path.join(OUT, name), 'WEBP', quality=74, method=6)
    print('  ok', key)
