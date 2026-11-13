#!/usr/bin/env python3
"""Service area map for the Sonny's Air Conditioning preview, drawn from U.S. Census Bureau TIGER/Line files.

A light map in Sonny's blues and grays, in the style of Pinwheel's map (scripts/build-map.mjs): the SVG holds
only shapes (ocean, land, lakes, rivers, county lines, main and local roads, the 2-hour ring), so it stays sharp
at any size and small. City dots, names, highway shields, and Clovis as home base are HTML on top
(scripts/sonnys-ac-map.json, read by build-sonnys-ac.mjs), so they use the site's font and stay readable on phones.

Data (TIGER/Line 2024, public domain), all from https://www2.census.gov/geo/tiger/ :
  GENZ2024/shp/cb_2024_us_county_500k.zip         land and coastline (cartographic boundary), county lines
  TIGER2024/PRISECROADS/tl_2024_06_prisecroads.zip  freeways (S1100), highways (S1200 I/U/S), main local roads (S1200 M/C/O)
  TIGER2024/LINEARWATER/tl_2024_06CCC_linearwater.zip  rivers (H3010 named "... Riv")
  TIGER2024/AREAWATER/tl_2024_06CCC_areawater.zip      lakes and reservoirs (H2030, H2040)
  TIGER2024/PLACE/tl_2024_06_place.zip              city points (internal points)
  CCC = the counties in the frame: 019 027 029 031 039 043 047 053 069 079 085 087 099 107
Output: sonnys-air-conditioning/images/service-area-map.svg and scripts/sonnys-ac-map.json.

Usage: pip install pyshp; python3 -I scripts/sonnys-ac-map.py TIGER_DIR
"""
import json, math, os, sys, glob
import shapefile  # pyshp

SRC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_SVG = os.path.join(HERE, '..', 'sonnys-air-conditioning', 'images', 'service-area-map.svg')
OUT_JSON = os.path.join(HERE, 'sonnys-ac-map.json')

T, B, L, R = 37.46, 35.27, -121.98, -118.86
W = 800
KX = W / (R - L)
K = KX / math.cos(math.radians((T + B) / 2))
H = round((T - B) * K)
BOX = (L - .1, B - .1, R + .1, T + .1)

def P(lon, lat):
    return ((lon - L) * KX, (T - lat) * K)

def hits(bbox):
    return not (bbox[2] < BOX[0] or bbox[0] > BOX[2] or bbox[3] < BOX[1] or bbox[1] > BOX[3])

def parts_of(shape):
    idx = list(shape.parts) + [len(shape.points)]
    return [shape.points[idx[i]:idx[i + 1]] for i in range(len(idx) - 1)]

def read(pattern, keep):
    """Yield (record, list of parts as [(lon, lat)]) for shapes in the frame that pass keep(record)."""
    for f in sorted(glob.glob(os.path.join(SRC, pattern))):
        for sr in shapefile.Reader(f).iterShapeRecords():
            if not sr.shape.points or not hits(sr.shape.bbox) or not keep(sr.record): continue
            yield sr.record, parts_of(sr.shape)

def dp(pts, tol):
    """Douglas-Peucker, iterative."""
    if len(pts) < 3: return pts
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
        if best > tol: keep[idx] = True; stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]

M = 8
def clip(parts):
    """Project lines and split them where they leave the (padded) frame."""
    lines = []
    for g in parts:
        cur = []
        for lon, lat in g:
            x, y = P(lon, lat)
            if -M <= x <= W + M and -M <= y <= H + M: cur.append((x, y))
            elif cur: cur.append((x, y)); lines.append(cur); cur = []
        if len(cur) > 1: lines.append(cur)
    return lines

def rel(lines, tol, min_len=0.0, closed=False):
    """Path data with relative moves on a 0.1 px grid (small and exact)."""
    out = []
    for pts in lines:
        s = dp(pts, tol) if not closed or len(pts) < 8 else dp(pts[:len(pts) // 2 + 1], tol) + dp(pts[len(pts) // 2:], tol)[1:]
        if len(s) < 2: continue
        if min_len and sum(math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]) for i in range(1, len(s))) < min_len: continue
        q = [(round(x * 10), round(y * 10)) for x, y in s]
        prev = q[0]; parts = []
        for x, y in q[1:]:
            dx, dy = x - prev[0], y - prev[1]
            if dx or dy: parts.append(f'{dx / 10:g} {dy / 10:g}')
            prev = (x, y)
        if not parts: continue
        out.append(f'M{q[0][0] / 10:g} {q[0][1] / 10:g}l' + ' '.join(parts).replace(' -', '-') + ('z' if closed else ''))
    return ''.join(out)

def polys(parts, min_area=0):
    """Project polygon rings (no clipping; the SVG viewport crops them)."""
    out = []
    for g in parts:
        pts = [P(lon, lat) for lon, lat in g]
        xs = [x for x, _ in pts]; ys = [y for _, y in pts]
        if (max(xs) - min(xs)) * (max(ys) - min(ys)) < min_area: continue
        out.append(pts)
    return out

# ---------- land and county lines (cartographic boundary file: clipped to the shoreline) ----------
land = []
for rec, parts in read('cb_2024_us_county_500k.zip', lambda r: r['STATEFP'] == '06'):
    land += polys(parts)
# County lines are the edges two counties share; coast edges belong to one county only.
edges = {}
def kq(p): return (round(p[0], 1), round(p[1], 1))
for ring in land:
    for a, b in zip(ring, ring[1:]):
        e = tuple(sorted((kq(a), kq(b))))
        if e[0] != e[1]: edges[e] = edges.get(e, 0) + 1
shared = [(a, b) for (a, b), n in edges.items() if n >= 2]
adj = {}
for a, b in shared: adj.setdefault(a, []).append(b); adj.setdefault(b, []).append(a)
used = set(); county_lines = []
def take(a, b): used.add((a, b)); used.add((b, a))
for a, b in shared:
    if (a, b) in used: continue
    line = [a, b]; take(a, b)
    for front in (False, True):
        while True:
            tip, prev = (line[0], line[1]) if front else (line[-1], line[-2])
            nxt = [n for n in adj.get(tip, []) if n != prev and (tip, n) not in used]
            if len(adj.get(tip, [])) != 2 or not nxt: break
            take(tip, nxt[0])
            if front: line.insert(0, nxt[0])
            else: line.append(nxt[0])
    county_lines.append(line)
county_lines = [l for l in county_lines if any(-M <= x <= W + M and -M <= y <= H + M for x, y in l)]

# ---------- roads ----------
freeway, highway, local, refs = [], [], [], {}
for rec, parts in read('tl_2024_06_prisecroads.zip', lambda r: True):
    m, t = rec['MTFCC'], rec['RTTYP']
    if m == 'S1100': freeway += parts
    elif t in ('I', 'U', 'S'): highway += parts
    else: local += parts
    name = rec['FULLNAME'] or ''
    for pre, net in (('I- ', 'I'), ('US Hwy ', 'US'), ('State Hwy ', 'CA'), ('State Rte ', 'CA')):
        if name.startswith(pre):
            num = name[len(pre):].split(' ')[0]
            if num.isdigit():
                for g in parts: refs.setdefault((net, num), []).extend(g)
freeway, highway, local = clip(freeway), clip(highway), clip(local)

# ---------- water ----------
rivers = []
for rec, parts in read('tl_2024_06*_linearwater.zip', lambda r: r['MTFCC'] == 'H3010' and (r['FULLNAME'] or '').endswith(' Riv')):
    rivers += parts
rivers = clip(rivers)
lakes = []
for rec, parts in read('tl_2024_06*_areawater.zip', lambda r: r['MTFCC'] in ('H2030', 'H2040') and r['AWATER'] > 1_500_000):
    lakes += polys(parts, 12)

# ---------- places ----------
places = {}
for f in glob.glob(os.path.join(SRC, 'tl_2024_06_place.zip')):
    for rec in shapefile.Reader(f).iterRecords():
        places.setdefault(rec['NAME'], (float(rec['INTPTLON']), float(rec['INTPTLAT'])))
places['Paso Robles'] = places['El Paso de Robles (Paso Robles)']  # its legal name in TIGER
HQ = places['Clovis']
SERVED = ['Merced', 'Chowchilla', 'Madera', 'Fresno', 'Sanger', 'Kerman', 'Selma', 'Reedley', 'Kingsburg', 'Dinuba',
          'Hanford', 'Lemoore', 'Visalia', 'Tulare', 'Los Banos', 'Firebaugh', 'Coalinga', 'Paso Robles']
MINOR = {'Chowchilla', 'Sanger', 'Kerman', 'Selma', 'Kingsburg', 'Dinuba', 'Lemoore', 'Firebaugh', 'Reedley'}
CONTEXT = ['Salinas', 'Hollister', 'King City', 'Porterville', 'Delano', 'Oakhurst', 'Bakersfield']
SIDE = {'Merced': 'r', 'Chowchilla': 'r', 'Madera': 'l', 'Fresno': 'b', 'Sanger': 'r', 'Kerman': 'l', 'Selma': 'l',
        'Reedley': 'r', 'Kingsburg': 'l', 'Dinuba': 'r', 'Hanford': 'b', 'Lemoore': 'l', 'Visalia': 'r', 'Tulare': 'r',
        'Los Banos': 'l', 'Firebaugh': 'l', 'Coalinga': 'l', 'Paso Robles': 'r'}
pct = lambda v, of: round(v / of * 100, 2)
pins = []
for n in SERVED:
    x, y = P(*places[n])
    pins.append({'name': n, 'x': pct(x, W), 'y': pct(y, H), 'side': SIDE.get(n, 'r'), 'minor': n in MINOR})
context = []
for n in CONTEXT:
    if n not in places: print('no context place', n); continue
    x, y = P(*places[n])
    if 20 < x < W - 20 and 12 < y < H - 12: context.append({'name': n, 'x': pct(x, W), 'y': pct(y, H)})
hx, hy = P(*HQ)

# ---------- highway shields: one per route, at the route point nearest a chosen spot ----------
SHIELD_AT = {('I', '5'): (36.58, -120.48), ('CA', '99'): (36.47, -119.52), ('CA', '41'): (35.98, -119.95),
             ('CA', '180'): (36.74, -120.42), ('CA', '152'): (37.07, -120.66), ('CA', '198'): (36.27, -120.08),
             ('US', '101'): (36.06, -121.10), ('CA', '46'): (35.70, -120.13), ('CA', '33'): (36.97, -120.62),
             ('CA', '65'): (35.60, -119.10), ('CA', '43'): (35.98, -119.55)}
shields = []
for key, (la, lo) in SHIELD_AT.items():
    pts = refs.get(key)
    if not pts: print('no road for shield', key); continue
    blo, bla = min(pts, key=lambda p: (p[1] - la) ** 2 + ((p[0] - lo) * math.cos(math.radians(la))) ** 2)
    x, y = P(blo, bla)
    shields.append({'net': key[0], 'ref': key[1], 'x': pct(x, W), 'y': pct(y, H)})

# ---------- labels and the 2-hour ring ----------
RING = 1.62 * K
COUNTIES = [('Merced', 37.20, -120.75), ('Madera', 37.17, -119.95), ('Fresno', 36.45, -120.35), ('Kings', 35.93, -119.72),
            ('Tulare', 35.88, -118.99), ('Monterey', 36.15, -121.35), ('San Benito', 36.62, -121.05), ('San Luis Obispo', 35.40, -120.55)]
county_labels = [{'name': n, 'x': pct(P(lo, la)[0], W), 'y': pct(P(lo, la)[1], H)} for n, la, lo in COUNTIES]
ox, oy = P(-121.72, 35.75)
rx, ry = P(-120.2, 35.48)

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<rect width="{W}" height="{H}" fill="#C6DDEC"/>
<path d="{rel(land, 0.35, closed=True)}" fill="#EEF3F7" stroke="#EEF3F7" stroke-width=".6"/>
<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{RING:.1f}" fill="#0097D7" fill-opacity=".07"/>
<path d="{rel(lakes, 0.4, closed=True)}" fill="#C6DDEC"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="{rel(rivers, 0.5, 4)}" stroke="#8DBEDD" stroke-width="1.3" vector-effect="non-scaling-stroke"/>
<path d="{rel(county_lines, 0.6, 3)}" stroke="#9AA9B8" stroke-width="1.1" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>
<path d="{rel(local, 0.6, 3)}" stroke="#CCD6E0" stroke-width=".8" vector-effect="non-scaling-stroke"/>
<defs><path id="hwy" d="{rel(highway, 0.5, 2)}" vector-effect="non-scaling-stroke"/><path id="fwy" d="{rel(freeway, 0.5, 2)}" vector-effect="non-scaling-stroke"/></defs>
<use href="#hwy" stroke="#AFBDCB" stroke-width="2.6"/><use href="#hwy" stroke="#FFFFFF" stroke-width="1.4"/>
<use href="#fwy" stroke="#8597AA" stroke-width="3.8"/><use href="#fwy" stroke="#FFFFFF" stroke-width="2.2"/>
<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{RING:.1f}" stroke="#0097D7" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="7 6" vector-effect="non-scaling-stroke"/>
</g>
</svg>
'''
with open(OUT_SVG, 'w') as f: f.write(svg)
meta = {'w': W, 'h': H, 'hq': {'name': 'Clovis', 'x': pct(hx, W), 'y': pct(hy, H)}, 'pins': pins, 'context': context,
        'shields': shields, 'counties': county_labels, 'ocean': {'x': pct(ox, W), 'y': pct(oy, H)}, 'ring': {'x': pct(rx, W), 'y': pct(ry, H)},
        'gmaps': f'https://www.google.com/maps/@?api=1&map_action=map&center={HQ[1]:.4f},{HQ[0]:.4f}&zoom=8'}
with open(OUT_JSON, 'w') as f: json.dump(meta, f, indent=1)
print('wrote', OUT_SVG, f'{W}x{H}', round(len(svg) / 1024, 1), 'KB;', len(pins), 'pins,', len(shields), 'shields,', len(context), 'context,',
      len(county_lines), 'county lines,', len(lakes), 'lakes')
