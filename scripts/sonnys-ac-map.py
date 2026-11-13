#!/usr/bin/env python3
"""Service area map for the Sonny's Air Conditioning preview, drawn from OpenStreetMap data.

Input: Overpass API JSON (out geom) for the coastline, the six highways, and the city points:
  coast.json, r99.json, r41.json, r180.json, r152.json, r198.json, r5.json, places.json
  (queries: way[natural=coastline](bbox); relation[route=road][network=US:CA][ref=NN] -> way(r)(bbox);
   relation[route=road][network=US:I][ref=5] -> way(r)(bbox); node[place~city|town][name=...](bbox))
Output: sonnys-air-conditioning/images/service-area-map.svg (inlined into the homepage by build-sonnys-ac.mjs).
Map data (c) OpenStreetMap contributors, ODbL.

Usage: python3 -I scripts/sonnys-ac-map.py OSM_JSON_DIR
"""
import json, math, os, sys

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sonnys-air-conditioning', 'images', 'service-area-map.svg')

LAT_TOP, LAT_BOT, LON_L, LON_R = 37.46, 35.12, -122.02, -118.78
K = 270  # px per degree of latitude
KX = K * math.cos(math.radians(36.3))
W = round((LON_R - LON_L) * KX)
H = round((LAT_TOP - LAT_BOT) * K)

def P(lat, lon):
    return ((lon - LON_L) * KX, (LAT_TOP - lat) * K)

def load(name):
    with open(os.path.join(SRC, name)) as f:
        return json.load(f)['elements']

def dp(pts, tol):
    """Douglas-Peucker simplification."""
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1e-9
    best, idx = -1, 0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]
        d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / L
        if d > best:
            best, idx = d, i
    if best > tol:
        return dp(pts[:idx + 1], tol)[:-1] + dp(pts[idx:], tol)
    return [pts[0], pts[-1]]

def path_d(lines, tol=0.6):
    out = []
    for pts in lines:
        s = dp(pts, tol)
        if len(s) < 2:
            continue
        out.append('M' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in s))
    return ''.join(out)

def inside(x, y, m=60):
    return -m <= x <= W + m and -m <= y <= H + m

def clip_lines(geoms):
    """Project and split lines where they leave the (padded) frame."""
    lines = []
    for g in geoms:
        cur = []
        for pt in g:
            x, y = P(pt['lat'], pt['lon'])
            if inside(x, y):
                cur.append((x, y))
            elif cur:
                cur.append((x, y)); lines.append(cur); cur = []
        if len(cur) > 1:
            lines.append(cur)
    return lines

# ---------- coastline: join ways into chains, keep the main one, close it into an ocean shape ----------
ways = [e['geometry'] for e in load('coast.json') if e.get('geometry')]
key = lambda p: (round(p['lat'], 6), round(p['lon'], 6))
chains = [list(w) for w in ways]
merged = True
while merged:
    merged = False
    starts = {}
    for i, c in enumerate(chains):
        starts.setdefault(key(c[0]), i)
    for i, c in enumerate(chains):
        j = starts.get(key(c[-1]))
        if j is not None and j != i:
            chains[i] = c + chains[j][1:]
            chains.pop(j)
            merged = True
            break

def in_view(c):
    return sum(1 for p in c if LAT_BOT - .1 <= p['lat'] <= LAT_TOP + .1 and LON_L - .1 <= p['lon'] <= LON_R)

main = max(chains, key=in_view)
pts = [P(p['lat'], p['lon']) for p in main if LAT_BOT - .25 <= p['lat'] <= LAT_TOP + .25 and p['lon'] <= -120.4]
pts = dp(pts, 0.8)
coast_d = 'M' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
ocean_d = coast_d + f' L-40,{pts[-1][1]:.1f} L-40,{pts[0][1]:.1f} Z'
other_coast = [c for c in chains if c is not main and in_view(c) > 2]
other_d = path_d(clip_lines(other_coast), 0.5)

# ---------- highways ----------
ROUTES = [('5', 'r5.json', 'I-5', (36.47, -120.47)), ('99', 'r99.json', '99', (36.42, -119.47)),
          ('41', 'r41.json', '41', (35.78, -120.22)), ('180', 'r180.json', '180', (36.735, -120.32)),
          ('152', 'r152.json', '152', (37.055, -120.58)), ('198', 'r198.json', '198', (36.31, -120.02))]
roads, shields = [], []
for ref, fn, label, target in ROUTES:
    geoms = [e['geometry'] for e in load(fn) if e.get('geometry')]
    lines = clip_lines(geoms)
    roads.append(f'<path class="m-road m-r{ref}" d="{path_d(lines, 1.0)}"/>')
    tx, ty = P(*target)
    bx, by = min((p for l in lines for p in l), key=lambda p: (p[0] - tx) ** 2 + (p[1] - ty) ** 2)
    w = 18 + 11.5 * len(label)
    shields.append(f'<g class="m-shield{" m-i" if ref == "5" else ""}" transform="translate({bx:.1f},{by:.1f})">'
                   f'<rect x="{-w / 2:.1f}" y="-13" width="{w:.1f}" height="26" rx="6"/><text y="6.5" text-anchor="middle">{label}</text></g>')

# ---------- cities (OSM place nodes) ----------
places = {e['tags']['name']: (e['lat'], e['lon']) for e in load('places.json')}
LABEL = {  # side of the dot for each label (None = dot only)
    'Merced': 'r', 'Chowchilla': None, 'Madera': 'l', 'Fresno': 'b', 'Clovis': 'hq', 'Sanger': None, 'Kerman': None,
    'Selma': None, 'Reedley': 'r', 'Kingsburg': None, 'Dinuba': None, 'Hanford': 'b', 'Lemoore': None, 'Visalia': 'r',
    'Tulare': 'r', 'Los Banos': 'l', 'Firebaugh': None, 'Coalinga': 'l', 'Paso Robles': 'r'}
cities = []
for name, side in LABEL.items():
    lat, lon = places[name]
    x, y = P(lat, lon)
    if side == 'hq':
        cx, cy = x, y
        continue
    cities.append(f'<circle class="m-dot" cx="{x:.1f}" cy="{y:.1f}" r="5"/>')
    if side == 'r':
        cities.append(f'<text x="{x + 11:.1f}" y="{y + 7:.1f}">{name}</text>')
    elif side == 'l':
        cities.append(f'<text x="{x - 11:.1f}" y="{y + 7:.1f}" text-anchor="end">{name}</text>')
    elif side == 'b':
        cities.append(f'<text x="{x:.1f}" y="{y + 29:.1f}" text-anchor="middle">{name}</text>')

R = 1.62 * K  # about 2 hours of driving from Clovis, drawn as a simple ring
ring_lx, ring_ly = cx - R * .32, cy + R - 16
ox, oy = P(35.55, -121.95)

svg = f'''<svg class="area-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-labelledby="map-title map-desc">
<title id="map-title">Service area map</title>
<desc id="map-desc">Map of the San Joaquin Valley and the Central Coast built from OpenStreetMap data. Clovis is home base. The service area runs from Merced to Tulare along Highway 99 and west toward the coast as far as Paso Robles, about two hours from Clovis. Highways 99, 41, 180, 152, 198, and Interstate 5 are shown.</desc>
<defs><radialGradient id="m-reach"><stop offset="0" stop-color="#19A9E6" stop-opacity=".26"/><stop offset=".8" stop-color="#19A9E6" stop-opacity=".09"/><stop offset="1" stop-color="#19A9E6" stop-opacity=".03"/></radialGradient></defs>
<rect class="m-land" width="{W}" height="{H}"/>
<path class="m-ocean" d="{ocean_d}"/>
<path class="m-coast" d="{coast_d}"/>
{f'<path class="m-coast" d="{other_d}"/>' if other_d else ''}
<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{R:.1f}" fill="url(#m-reach)"/>
<circle class="m-ring" cx="{cx:.1f}" cy="{cy:.1f}" r="{R:.1f}"/>
<g class="m-roads">{''.join(roads)}</g>
<g class="m-shields">{''.join(shields)}</g>
<g class="m-cities">{''.join(cities)}</g>
<circle class="m-hq-ring" cx="{cx:.1f}" cy="{cy:.1f}" r="12"/><circle class="m-hq-dot" cx="{cx:.1f}" cy="{cy:.1f}" r="6.5"/>
<text class="m-hq" x="{cx + 19:.1f}" y="{cy - 4:.1f}">Clovis</text><text class="m-hq-sub" x="{cx + 19:.1f}" y="{cy + 17:.1f}">Home base</text>
<text class="m-ring-label" x="{ring_lx:.1f}" y="{ring_ly:.1f}" text-anchor="middle">About 2 hours from Clovis</text>
<text class="m-water" x="{ox:.1f}" y="{oy:.1f}">Pacific</text><text class="m-water" x="{ox:.1f}" y="{oy + 24:.1f}">Ocean</text>
</svg>
'''
with open(OUT, 'w') as f:
    f.write(svg)
print('wrote', OUT, W, 'x', H, round(len(svg) / 1024, 1), 'KB')
