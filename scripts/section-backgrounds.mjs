/*
  section-backgrounds.mjs: no two neighboring sections share a background.

  Reads the page's top-level sections in order (hero, trust row, every section, request, footer) and their
  background from the class: on-dark = navy, bg-white = white, tpl-bg-tint = a soft brand tint, bg-alt = the alternate
  light background, none = cream.
  When a section matches the one above it, it moves to the first light background that differs from both its
  neighbors (white, cream, tint), and only that section changes. Navy sections are never changed (their text is
  white), so the build warns if two navy sections ever touch.

  Used by scripts/build-preview.mjs after the page is filled, and again by any finishing pass that adds sections.
*/
const KEYS = { navy: 'on-dark', white: 'bg-white', tint: 'tpl-bg-tint', cream: '' };
const keyOf = (cls) => /\bon-dark\b/.test(cls) ? 'navy' : /\btpl-bg-tint\b/.test(cls) ? 'tint' : /\bbg-white\b/.test(cls) ? 'white' : /\bbg-alt\b/.test(cls) ? 'alt' : 'cream';

export function balanceSections(html) {
  const re = /\n {0,2}<(section|footer)\b([^>]*?)class="([^"]*)"([^>]*)>/g;
  const tags = [...html.matchAll(re)].map((m) => ({ index: m.index, full: m[0], el: m[1], before: m[2], cls: m[3], after: m[4] }));
  const keys = tags.map((t) => keyOf(t.cls));
  const changes = [], warnings = [];
  for (let i = 1; i < tags.length; i++) {
    if (keys[i] !== keys[i - 1]) continue;
    if (keys[i] === 'navy') { warnings.push(`two navy sections touch: ${idOf(tags[i - 1])} and ${idOf(tags[i])}`); continue; }
    const next = keys[i + 1];
    const pick = ['white', 'cream', 'tint'].find((k) => k !== keys[i - 1] && k !== next);
    if (!pick) continue;
    changes.push(`${idOf(tags[i])}: ${keys[i]} -> ${pick} (it matched ${idOf(tags[i - 1])})`);
    keys[i] = pick;
    tags[i].cls = tags[i].cls.replace(/\s*\b(bg-white|bg-alt|tpl-bg-tint)\b/g, '').trim() + (KEYS[pick] ? ' ' + KEYS[pick] : '');
    tags[i].changed = true;
  }
  let out = html;
  for (const t of [...tags].reverse()) {
    if (!t.changed) continue;
    const tag = `\n  <${t.el}${t.before}class="${t.cls}"${t.after}>`;
    out = out.slice(0, t.index) + tag + out.slice(t.index + t.full.length);
  }
  return { html: out, changes, warnings, order: tags.map((t, i) => `${idOf(t)}:${keys[i]}`) };
}

function idOf(t) {
  const id = (t.before + t.after).match(/\bid="([^"]+)"/);
  return id ? id[1] : t.el === 'footer' ? 'footer' : t.cls.split(' ')[0] === 'hero' || /\bhero\b/.test(t.cls) ? 'hero' : /\btrust\b/.test(t.cls) ? 'trust' : t.cls.split(' ')[0];
}
