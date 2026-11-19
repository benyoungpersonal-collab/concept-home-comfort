#!/usr/bin/env python3
"""Find flat bands in screenshots: runs of rows that are one flat color (an empty gap, the end of a section, footer
whitespace). Used by scripts/share-image.cjs on every phone shot, laptop shot, and final link preview picture.

    python3 scripts/flat-bands.py JOBS.json

JOBS.json is a list of {"path": PNG/JPG, "box": [x, y, w, h] or null, "radius": [rx, ry] (rounded corners to skip) or null, "minRows": rows, "tol": color tolerance}.
Prints a JSON list (one per job) of {"bands": [[start_row, length, "#hex"], ...], "rows": n, "flatRows": [bool per row]}.
A row is flat when every pixel in it is within tol of the row's own colors (max - min per channel <= tol).
A band is a run of flat rows whose average colors stay within tol of the run's first row.
"""
import json, sys
import numpy as np
from PIL import Image

def analyze(job):
    im = Image.open(job['path']).convert('RGB')
    if job.get('box'):
        x, y, w, h = [int(round(v)) for v in job['box']]
        im = im.crop((x, y, x + w, y + h))
    a = np.asarray(im).astype(np.int16)
    tol = job.get('tol', 10)
    h, w = a.shape[:2]
    rx, ry = job.get('radius') or (0, 0)
    spread, mean = np.zeros(h), np.zeros((h, 3))
    for i in range(h):
        # rounded screen corners: use only the pixels inside the rounded rectangle on the top and bottom rows
        dy = max(ry - i - 0.5, i + 0.5 - (h - ry), 0) if ry else 0
        cut = int(np.ceil(rx * (1 - np.sqrt(max(0.0, 1 - (dy / ry) ** 2))))) + 2 if dy else 0
        row = a[i, cut:w - cut] if w - 2 * cut > 8 else a[i, w // 2 - 4:w // 2 + 4]
        spread[i] = (row.max(axis=0) - row.min(axis=0)).max()
        mean[i] = row.mean(axis=0)
    flat = spread <= tol
    bands, i, n = [], 0, len(flat)
    while i < n:
        if not flat[i]:
            i += 1; continue
        j = i
        while j + 1 < n and flat[j + 1] and np.abs(mean[j + 1] - mean[i]).max() <= tol:
            j += 1
        if j - i + 1 >= job['minRows']:
            c = mean[i].round().astype(int)
            bands.append([i, j - i + 1, '#%02x%02x%02x' % tuple(c)])
        i = j + 1
    out = {'bands': bands, 'rows': n}
    if job.get('rowsOut'):
        out['flatRows'] = flat.tolist()
    return out

if __name__ == '__main__':
    jobs = json.load(open(sys.argv[1]))
    print(json.dumps([analyze(j) for j in jobs]))
