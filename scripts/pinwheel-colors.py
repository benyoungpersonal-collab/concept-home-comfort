#!/usr/bin/env python3
"""
pinwheel-colors.py: writes the Pinwheel color block in css/pinwheel.css.

    python3 scripts/pinwheel-colors.py

css/site.css is shared with every homepage preview (the preview build recolors its warm rules for each prospect),
so Pinwheel's bolder orange does not edit site.css. Instead this script finds every site.css rule that uses one of the
original warm colors and writes a copy of just those declarations with the new orange, between the
/* colors:start */ and /* colors:end */ markers in css/pinwheel.css. Run it again if site.css changes.
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = '#EE5600'        # bolder, fully saturated orange: white bold text 3.52:1, 3.18:1 on cream
HOVER = '#D44C00'        # white text 4.35:1
DEEP = '#BE4500'         # small orange text: 4.7:1 on cream, 5.2:1 on white
TINT = '#FDEBE0'
LIGHT = '#F49159'        # orange on navy: 6.9:1

def mix(h, f):
    return '#%02X%02X%02X' % tuple(round(int(h[i:i + 2], 16) + (255 - int(h[i:i + 2], 16)) * f) for i in (1, 3, 5))

def rgb(h):
    return ' '.join(str(int(h[i:i + 2], 16)) for i in (1, 3, 5))

SWAP = [('%23E4572E', '%23' + BRAND[1:]), ('#E4572E', BRAND), ('rgb(209 68 28', f'rgb({rgb(BRAND)}'), ('rgb(228 87 46', f'rgb({rgb(BRAND)}'),
        ('#FDE8DF', TINT), ('#FFC9AE', mix(BRAND, .7)), ('#F9C8B2', mix(BRAND, .7)), ('#F2C2AE', mix(BRAND, .72)), ('#F7D5C7', mix(BRAND, .8)),
        ('#F29E4C', mix(BRAND, .35)), ('#FFB59E', LIGHT), ('rgb(255 186 150', f'rgb({rgb(mix(BRAND, .6))}'), ('rgb(253 232 223', f'rgb({rgb(TINT)}'),
        ('#D1441C', BRAND), ('#B93A16', HOVER), ('#B5391A', DEEP)]

def has(s):
    return any(a.upper() in s.upper() for a, _ in SWAP)

def recolor(s):
    for a, b in SWAP:
        s = s.replace(a, b).replace(a.lower(), b)
    return s

def walk(css):
    out, i = '', 0
    while i < len(css):
        o = css.find('{', i)
        if o == -1:
            break
        sel = css[i:o].strip()
        depth, j = 1, o + 1
        while j < len(css) and depth:
            depth += {'{': 1, '}': -1}.get(css[j], 0)
            j += 1
        body = css[o + 1:j - 1]
        if sel.startswith(('@media', '@supports', '@container')):
            inner = walk(body)
            if inner:
                out += f'{sel}{{{inner}}}'
        elif not sel.startswith('@') and not sel.startswith(':root') and has(body):
            decls = [d.strip() for d in re.split(r';(?![^(]*\))', body) if d.strip() and has(d)]
            if decls:
                out += f'{sel}{{{recolor(";".join(decls))}}}\n'
        i = j
    return out

site = re.sub(r'/\*[\s\S]*?\*/', '', open(os.path.join(ROOT, 'css', 'site.css'), encoding='utf8').read())
block = (f'/* colors:start (made by scripts/pinwheel-colors.py, do not edit by hand) */\n'
         f':root {{ --c-brand: {BRAND}; --c-brand-strong: {BRAND}; --c-brand-hover: {HOVER}; --c-brand-deep: {DEEP}; --c-brand-tint: {TINT}; --c-brand-light: {LIGHT}; }}\n'
         + walk(site) + '/* colors:end */')
path = os.path.join(ROOT, 'css', 'pinwheel.css')
cur = open(path, encoding='utf8').read() if os.path.exists(path) else '/* colors:start */\n/* colors:end */\n'
new = re.sub(r'/\* colors:start[\s\S]*?/\* colors:end \*/', lambda m: block, cur)
open(path, 'w', encoding='utf8').write(new)
print('wrote', path, '(', block.count('\n'), 'lines in the color block )')
