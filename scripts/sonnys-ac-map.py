#!/usr/bin/env python3
"""Service area map for the Sonny's Air Conditioning preview, drawn from OpenStreetMap data.

A light map in Sonny's blues and grays, in the style of Pinwheel's map (scripts/build-map.mjs):
the SVG holds only shapes (land, ocean, lakes, rivers, county lines, main and local roads,
the 2-hour ring), so it stays sharp at any size and small. City dots, names, highway shields,
and Clovis as home base are HTML on top (scripts/sonnys-ac-map.json -> build-sonnys-ac.mjs),
so they use the site's font and stay readable on phones.

Input: a folder of Overpass API JSON files (out geom), all for the box 35.25,-122.05,37.5,-118.75:
  roads-*.json   way[highway~motorway|trunk|primary|secondary]  (tiles)
  tert.json      way[highway=tertiary]
  rivers.json    way[waterway=river]
  lakes.json     way/relation[natural=water][water~lake|reservoir]
  county.json    relation[boundary=administrative][admin_level=6]
  places.json    node[place~city|town]
  coast.json     way[natural=coastline]  (from the round 3 folder, passed as a second folder)
Output: sonnys-air-conditioning/images/service-area-map.svg and scripts/sonnys-ac-map.json.
Map data (c) OpenStreetMap contributors, ODbL.

Usage: python3 -I scripts/sonnys-ac-map.py OSM_DIR [COAST_DIR]
"""
import json, math, os, sys, glob

SRC = sys.argv[1]
COAST_DIR = sys.argv[2] if len(sys.argv) > 2 else SRC
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_SVG = os.path.join(HERE, '..', 'sonnys-air-conditioning', 'images', 'service-area-map.svg')
OUT_JSON = os.path.join(HERE, 'sonnys-ac-map.json')

T, B, L, R = 37.46, 35.27, -121.98, -118.86
W = 800
KX = W / (R - L)
K = KX / math.cos(math.radians((T + B) / 2))
H = round((T - B) * K)
HQ = (36.8252, -119.7029)  # Clovis (OSM place node, checked against places.json below)

def P(lat, lon):
    return ((lon - L) * KX, (T - lat) * K)

def load(name, d=SRC):
    out = []
    for f in sorted(glob.glob(os.path.join(d, name))):
        with open(f) as fh:
            try: out += json.load(fh)['elements']
            except ValueError: sys.exit('Not Overpass JSON: ' + f)
    return out

def dp(pts, tol):
    """Douglas-Peucker, iterative."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (x1, y1), (x2, y2) = pts[a], pts[b]
        dx, dy = x2 - x1, y2 - y1; ln = math.hypot(dx, dy) or 1e-9
        best, idx = -1, -1
        for i in range(a + 1, b):
            x, y = pts[i]
            d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / ln
            if d > best: best, idx = d, i
        if best > tol:
            keep[idx] = True; stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]

M = 6
def clip(geoms):
    """Project and split lines where they leave the (padded) frame."""
    lines = []
    for g in geoms:
        cur = []
        for pt in g:
            x, y = P(pt['lat'], pt['lon'])
            if -M <= x <= W + M and -M <= y <= H + M:
                cur.append((x, y))
            else:
                if cur: cur.append((x, y)); lines.append(cur); cur = []
        if len(cur) > 1: lines.append(cur)
    return lines

def rel(lines, tol, min_len=0.0, closed=False):
    """Path data with relative moves on a 0.1 px grid (small and exact)."""
    out = []
    for pts in lines:
        s = dp(pts, tol)
        if len(s) < 2: continue
        if min_len:
            ln = sum(math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]) for i in range(1, len(s)))
            if ln < min_len: continue
        q = [(round(x * 10), round(y * 10)) for x, y in s]
        seg = [f'M{q[0][0] / 10:g} {q[0][1] / 10:g}l']
        prev = q[0]; parts = []
        for x, y in q[1:]:
            dx, dy = x - prev[0], y - prev[1]
            if dx or dy: parts.append(f'{dx / 10:g} {dy / 10:g}')
            prev = (x, y)
        if not parts: continue
        seg.append(' '.join(parts).replace(' -', '-'))
        out.append(''.join(seg) + ('z' if closed else ''))
    return ''.join(out)

def geoms_of(elements, test):
    return [e['geometry'] for e in elements if e.get('type') == 'way' and e.get('geometry') and test(e.get('tags', {}))]

# ---------- roads (deduplicated across tiles) ----------
seen = set(); roads = []
for e in load('roads-*.json') + load('tert.json'):
    if e.get('type') != 'way' or e['id'] in seen or not e.get('geometry'): continue
    seen.add(e['id']); roads.append(e)
cls = lambda t: t.get('highway', '')
motor = clip(geoms_of(roads, lambda t: cls(t) in ('motorway', 'trunk')))
primary = clip(geoms_of(roads, lambda t: cls(t) == 'primary'))
secondary = clip(geoms_of(roads, lambda t: cls(t) == 'secondary'))
tertiary = clip(geoms_of(roads, lambda t: cls(t) == 'tertiary'))

# ---------- water ----------
rivers = clip(geoms_of(load('rivers.json'), lambda t: True))
lake_rings = []
for e in load('lakes.json'):
    if e.get('type') == 'way' and e.get('geometry'):
        lake_rings.append(e['geometry'])
    elif e.get('type') == 'relation':
        for m in e.get('members', []):
            if m.get('role') == 'outer' and m.get('geometry'): lake_rings.append(m['geometry'])
lakes = []
for g in lake_rings:
    pts = [P(p['lat'], p['lon']) for p in g]
    xs = [x for x, _ in pts]; ys = [y for _, y in pts]
    if (max(xs) - min(xs)) * (max(ys) - min(ys)) < 20: continue  # skip ponds
    if max(xs) < -M or min(xs) > W + M or max(ys) < -M or min(ys) > H + M: continue
    lakes.append(pts)

# ---------- counties ----------
cways = {}
for r in load('county.json'):
    for m in r.get('members', []):
        if m.get('type') == 'way' and m.get('geometry'): cways[m['ref']] = m['geometry']
counties = clip(list(cways.values()))

# ---------- coastline: join ways into chains, close the main one into an ocean shape ----------
key = lambda p: (round(p['lat'], 6), round(p['lon'], 6))
chains = [list(e['geometry']) for e in load('coast.json', COAST_DIR) if e.get('geometry')]
merged = True
while merged:
    merged = False
    starts = {}
    for i, c in enumerate(chains): starts.setdefault(key(c[0]), i)
    for i, c in enumerate(chains):
        j = starts.get(key(c[-1]))
        if j is not None and j != i:
            chains[i] = c + chains[j][1:]; chains.pop(j); merged = True; break
def in_view(c):
    return sum(1 for p in c if B - .1 <= p['lat'] <= T + .1 and L - .1 <= p['lon'] <= R)
main = max(chains, key=in_view)
cpts = [P(p['lat'], p['lon']) for p in main if B - .3 <= p['lat'] <= T + .3 and p['lon'] <= -120.4]
cpts = dp(cpts, 0.5)
ocean = 'M' + ' '.join(f'{x:.1f} {y:.1f}' for x, y in cpts) + f'L-40 {cpts[-1][1]:.1f}L-40 {cpts[0][1]:.1f}Z'
coast_line = rel([cpts], 0.5)

# ---------- places ----------
places = {}
for e in load('places.json') + load('places.json', COAST_DIR):
    n = e.get('tags', {}).get('name')
    if n and n not in places and 'lat' in e: places[n] = (e['lat'], e['lon'])
if 'Clovis' in places: HQ = places['Clovis']
SERVED = ['Merced', 'Chowchilla', 'Madera', 'Fresno', 'Sanger', 'Kerman', 'Selma', 'Reedley', 'Kingsburg', 'Dinuba',
          'Hanford', 'Lemoore', 'Visalia', 'Tulare', 'Los Banos', 'Firebaugh', 'Coalinga', 'Paso Robles']
MINOR = {'Chowchilla', 'Sanger', 'Kerman', 'Selma', 'Kingsburg', 'Dinuba', 'Lemoore', 'Firebaugh', 'Reedley'}
CONTEXT = ['Salinas', 'Monterey', 'Hollister', 'King City', 'Porterville', 'Delano', 'Oakhurst', 'Gilroy', 'Atascadero']
SIDE = {'Merced': 'r', 'Chowchilla': 'r', 'Madera': 'l', 'Fresno': 'b', 'Sanger': 'r', 'Kerman': 'l', 'Selma': 'l',
        'Reedley': 'r', 'Kingsburg': 'l', 'Dinuba': 'r', 'Hanford': 'b', 'Lemoore': 'l', 'Visalia': 'r', 'Tulare': 'r',
        'Los Banos': 'l', 'Firebaugh': 'l', 'Coalinga': 'l', 'Paso Robles': 'r'}
pct = lambda v, of: round(v / of * 100, 2)
pins = []
for n in SERVED:
    if n not in places: print('missing place', n); continue
    x, y = P(*places[n])
    pins.append({'name': n, 'x': pct(x, W), 'y': pct(y, H), 'side': SIDE.get(n, 'r'), 'minor': n in MINOR})
context = []
for n in CONTEXT:
    if n not in places: print('no context place', n); continue
    x, y = P(*places[n])
    if 3 < x < W - 3 and 3 < y < H - 3: context.append({'name': n, 'x': pct(x, W), 'y': pct(y, H)})
hx, hy = P(*HQ)

# ---------- highway shields: one per route, placed near a chosen spot on the route ----------
def ref_of(t):
    r = (t.get('ref') or '').split(';')[0].strip()
    if r.startswith('I '): return 'I', r[2:]
    if r.startswith('US '): return 'US', r[3:]
    if r.startswith('CA '): return 'CA', r[3:]
    return None, None
SHIELD_AT = {('I', '5'): (36.33, -120.27), ('CA', '99'): (36.47, -119.52), ('CA', '41'): (35.98, -119.95),
             ('CA', '180'): (36.70, -120.25), ('CA', '152'): (37.07, -120.66), ('CA', '198'): (36.26, -120.30),
             ('US', '101'): (36.06, -121.10), ('CA', '46'): (35.70, -120.13), ('CA', '33'): (36.97, -120.62),
             ('CA', '65'): (35.88, -119.07), ('CA', '168'): (37.02, -119.42), ('CA', '43'): (36.24, -119.66)}
pts_by = {}
for e in roads:
    t = e.get('tags', {})
    if cls(t) not in ('motorway', 'trunk', 'primary'): continue
    k = ref_of(t)
    if k in SHIELD_AT:
        for p in e['geometry']: pts_by.setdefault(k, []).append((p['lat'], p['lon']))
shields = []
for k, (la, lo) in SHIELD_AT.items():
    if k not in pts_by: print('no road for shield', k); continue
    bla, blo = min(pts_by[k], key=lambda p: (p[0] - la) ** 2 + ((p[1] - lo) * math.cos(math.radians(la))) ** 2)
    x, y = P(bla, blo)
    shields.append({'net': k[0], 'ref': k[1], 'x': pct(x, W), 'y': pct(y, H)})

# ---------- the 2-hour ring ----------
RING = 1.62 * K
ring_label = P(35.48, -120.2)
COUNTIES = [('Merced', 37.20, -120.75), ('Madera', 37.17, -119.95), ('Fresno', 36.45, -120.35), ('Kings', 35.93, -119.72),
            ('Tulare', 36.02, -119.06), ('Monterey', 36.15, -121.35), ('San Benito', 36.62, -121.05), ('San Luis Obispo', 35.40, -120.55)]
county_labels = []
for n, la, lo in COUNTIES:
    x, y = P(la, lo)
    county_labels.append({'name': n, 'x': pct(x, W), 'y': pct(y, H)})
ox, oy = P(35.75, -121.72)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<rect width="{W}" height="{H}" fill="#EEF3F7"/>
<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{RING:.1f}" fill="#DCEBF5"/>
<path d="{ocean}" fill="#C6DDEC"/>
<path d="{rel(lakes, 0.4, closed=True)}" fill="#C6DDEC"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="{coast_line}" stroke="#9CC2DB" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
<path d="{rel(rivers, 0.5, 4)}" stroke="#8DBEDD" stroke-width="1.3" vector-effect="non-scaling-stroke"/>
<path d="{rel(counties, 0.6, 3)}" stroke="#9AA9B8" stroke-width="1.1" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>
<path d="{rel(tertiary, 0.6, 3)}" stroke="#D3DCE5" stroke-width=".6" vector-effect="non-scaling-stroke"/>
<path d="{rel(secondary, 0.5, 2)}" stroke="#C5D0DB" stroke-width=".9" vector-effect="non-scaling-stroke"/>
<defs><path id="pri" d="{rel(primary, 0.5, 2)}" vector-effect="non-scaling-stroke"/><path id="mot" d="{rel(motor, 0.5, 2)}" vector-effect="non-scaling-stroke"/></defs>
<use href="#pri" stroke="#AFBDCB" stroke-width="2.6"/><use href="#pri" stroke="#FFFFFF" stroke-width="1.4"/>
<use href="#mot" stroke="#8597AA" stroke-width="3.8"/><use href="#mot" stroke="#FFFFFF" stroke-width="2.2"/>
<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{RING:.1f}" stroke="#0097D7" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="7 6" vector-effect="non-scaling-stroke"/>
</g>
</svg>
'''
with open(OUT_SVG, 'w') as f: f.write(svg)
meta = {'w': W, 'h': H, 'hq': {'name': 'Clovis', 'x': pct(hx, W), 'y': pct(hy, H)}, 'pins': pins, 'context': context,
        'shields': shields, 'counties': county_labels, 'ocean': {'x': pct(ox, W), 'y': pct(oy, H)},
        'ring': {'x': pct(ring_label[0], W), 'y': pct(ring_label[1], H)},
        'gmaps': f'https://www.google.com/maps/@?api=1&map_action=map&center={HQ[0]:.4f},{HQ[1]:.4f}&zoom=8'}
with open(OUT_JSON, 'w') as f: json.dump(meta, f, indent=1)
print('wrote', OUT_SVG, f'{W}x{H}', round(len(svg) / 1024, 1), 'KB;', len(pins), 'pins,', len(shields), 'shields,', len(context), 'context')
