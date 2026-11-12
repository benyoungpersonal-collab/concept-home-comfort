#!/usr/bin/env python3
"""
recolor-clothes.py: changes the color of a tech's shirt or uniform to Pinwheel orange, and nothing else.

    python3 scripts/recolor-clothes.py scripts/recolor/NAME.json

Photo rule (CLAUDE.md): people photos stay real stock photos, and only the color of their clothes may change.
This script is not generative. It keeps every pixel's brightness detail (folds, seams, shading, texture) and
changes only the color channels inside the garment mask, so faces, hands, and the scene are left as they are.

The config (scripts/recolor/NAME.json) names the source photo, where to write the result, and the garment:
  "regions": polygons around the garment, in 0-1 coordinates of the photo (anything outside is never touched)
  "keep":    polygons that are never touched even inside a region (faces, hands, logos on equipment)
  "match":   which pixels inside the regions are fabric: a hue range (OpenCV 0-180), a minimum saturation, and a
             lightness range, and optionally a LAB b range; "any": true skips the hue and saturation test
  "skin":    true (default) skips skin-colored pixels inside the regions
  "band":    {"grow": 0.012, "a_max": -3, "L": [55, 100]} also takes an edge band around the regions, but only pixels
             with the garment's own tint (for light shirts against a light background)
  "max_side": 2400 shrinks the saved copy so its longest side is at most this many pixels
  "grabcut": true separates the garment from a background of similar color (seeded by "regions" and "core")

The target is the orange measured on the Drains and Indoor air quality card shirts (LAB hue about 52 degrees,
median lightness about 32, chroma about 50). Lightness is remapped around that median so a dark navy uniform and a
light green shirt end up the same orange, with their own shading kept.
"""
import json, os, sys
import numpy as np, cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET_DEFAULT = {'L': 32.0, 'spread': 27.0, 'chroma': 50.0, 'hue': 51.5}


def poly_mask(shape, polys):
    h, w = shape
    m = np.zeros((h, w), np.uint8)
    for p in polys:
        pts = np.array([[round(x * w), round(y * h)] for x, y in p], np.int32)
        cv2.fillPoly(m, [pts], 255)
    return m > 0


def main(cfg_path):
    cfg = json.load(open(cfg_path))
    # optional "target": another site's shirt color in the same terms (default: Pinwheel orange)
    TARGET = {**TARGET_DEFAULT, **cfg.get('target', {})}
    src = Image.open(os.path.join(ROOT, cfg['src'])).convert('RGB')
    rgb = np.asarray(src)
    h, w = rgb.shape[:2]
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    L = lab[..., 0] * 100 / 255

    region = poly_mask((h, w), cfg['regions'])
    if cfg.get('grow'):
        # grow the regions by N pixels (as a share of the photo's width), for GrabCut to sort out the edge band
        g = max(1, round(cfg['grow'] * w))
        region = cv2.dilate(region.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * g + 1, 2 * g + 1))) > 0
    if cfg.get('keep'):
        region &= ~poly_mask((h, w), cfg['keep'])
    m = cfg.get('match', {})
    fabric = region.copy()
    if not m.get('any'):
        hue = hsv[..., 0].astype(int)
        lo, hi = m.get('hue', [0, 180])
        inhue = (hue >= lo) & (hue <= hi) if lo <= hi else (hue >= lo) | (hue <= hi)
        fabric &= inhue & (hsv[..., 1] >= m.get('sat', 0))
    if cfg.get('grabcut'):
        # separate the garment from a similar-colored background by color models (OpenCV GrabCut), seeded from the
        # regions (probably garment), the optional "core" polygons (surely garment), and everything else (background)
        gc = np.full((h, w), cv2.GC_BGD, np.uint8)
        gc[region] = cv2.GC_PR_FGD
        if cfg.get('core'):
            gc[poly_mask((h, w), cfg['core']) & region] = cv2.GC_FGD
        scale = 1600 / max(h, w)
        small = cv2.resize(rgb, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
        gcs = cv2.resize(gc, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_NEAREST)
        bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
        cv2.grabCut(cv2.cvtColor(small, cv2.COLOR_RGB2BGR), gcs, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
        fg = cv2.resize(((gcs == cv2.GC_FGD) | (gcs == cv2.GC_PR_FGD)).astype(np.uint8), (w, h), interpolation=cv2.INTER_LINEAR) > 0
        fabric &= fg
    lmin, lmax = m.get('L', [0, 100])
    fabric &= (L >= lmin) & (L <= lmax)
    if m.get('b'):
        # blue-yellow range (LAB b), e.g. to tell a near-black tee from the bluer navy jacket tied over it
        bmin, bmax = m['b']
        fabric &= (lab[..., 2] - 128 >= bmin) & (lab[..., 2] - 128 <= bmax)
    if cfg.get('band'):
        # edge band around the regions: a pixel there counts as garment only if it has the garment's own tint
        # (e.g. a mint shirt is greener than the white wall behind it), so the background never changes
        bd = cfg['band']; g = max(1, round(bd['grow'] * w))
        grown = cv2.dilate(region.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * g + 1, 2 * g + 1))) > 0
        if cfg.get('keep'):
            grown &= ~poly_mask((h, w), cfg['keep'])
        a_ = lab[..., 1] - 128
        bl, bh = bd.get('L', [0, 100])
        fabric |= grown & ~region & (a_ <= bd.get('a_max', 128)) & (a_ >= bd.get('a_min', -128)) & (L >= bl) & (L <= bh)
        region = grown
    if cfg.get('skin', True):
        # skin: warm hue, moderate saturation, mid-to-light (kept out so hands and faces never change)
        a, b = lab[..., 1] - 128, lab[..., 2] - 128
        skin = (a > 6) & (b > 8) & (np.degrees(np.arctan2(b, a)) > 40) & (np.degrees(np.arctan2(b, a)) < 80) & (L > 25) & (np.hypot(a, b) < 45)
        fabric &= ~skin
    # clean the mask: close small holes (seams, shadows), drop specks, soft 1-2px edge
    k = max(3, round(min(h, w) / 400) | 1)
    mm = cv2.morphologyEx(fabric.astype(np.uint8) * 255, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k * 3, k * 3)))
    mm = cv2.morphologyEx(mm, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    mm = (mm > 0) & region
    n, lbl, st, _ = cv2.connectedComponentsWithStats(mm.astype(np.uint8))
    min_area = cfg.get('min_area', 0.0005) * h * w
    keep_lbl = [i for i in range(1, n) if st[i, 4] >= min_area]
    mm = np.isin(lbl, keep_lbl)
    alpha = cv2.GaussianBlur(mm.astype(np.float32), (0, 0), cfg.get('feather', 1.2) * k / 3)
    alpha = np.minimum(alpha, region.astype(np.float32))

    # lightness: remap the garment's own range onto the reference orange's range, keeping every detail
    Lg = L[mm]
    p10, p50, p90 = np.percentile(Lg, [10, 50, 90])
    gain = min(cfg.get('max_gain', 2.2), max(cfg.get('min_gain', 0.0), TARGET['spread'] / max(p90 - p10, 4)))
    Lnew = np.clip(TARGET['L'] + (L - p50) * gain + cfg.get('L_shift', 0), 2, 92)
    # chroma follows lightness a little (deep folds are less saturated), hue is fixed to the reference
    C = TARGET['chroma'] * np.clip((Lnew / TARGET['L']) ** 0.6, 0.35, 1.25) * cfg.get('chroma_k', 1.0)
    ang = np.radians(TARGET['hue'])
    out = lab.copy()
    out[..., 0] = Lnew * 255 / 100
    out[..., 1] = 128 + C * np.cos(ang)
    out[..., 2] = 128 + C * np.sin(ang)
    new = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float32)
    res = rgb.astype(np.float32) * (1 - alpha[..., None]) + new * alpha[..., None]
    res = np.clip(res + 0.5, 0, 255).astype(np.uint8)

    # guard: nothing outside the regions may change
    changed = np.abs(res.astype(int) - rgb.astype(int)).max(axis=2) > 0
    outside = changed & ~region
    assert not outside.any(), f'{outside.sum()} pixels changed outside the garment regions'

    dest = os.path.join(ROOT, cfg['out'])
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    out_im = Image.fromarray(res)
    if cfg.get('max_side') and max(w, h) > cfg['max_side']:
        # the repo copy only needs to be as large as the biggest crop the site makes from it
        f = cfg['max_side'] / max(w, h)
        out_im = out_im.resize((round(w * f), round(h * f)), Image.LANCZOS)
    out_im.save(dest, quality=cfg.get('q', 92), subsampling=0)
    if cfg.get('debug'):
        dbg = rgb.copy(); dbg[mm] = (dbg[mm] * 0.4 + np.array([0, 255, 0]) * 0.6).astype(np.uint8)
        Image.fromarray(dbg).save(cfg['debug'], quality=80)
    print(f"{cfg['out']}: garment {mm.mean() * 100:.1f}% of the photo, source lightness p10/50/90 {p10:.0f}/{p50:.0f}/{p90:.0f}, gain {gain:.2f}")


if __name__ == '__main__':
    for c in sys.argv[1:]:
        main(c)
