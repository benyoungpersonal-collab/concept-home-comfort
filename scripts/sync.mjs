#!/usr/bin/env node
/*
  sync.mjs: keeps the shared parts of every page identical. Optional dev helper, not a build step.
  The HTML files in the repo are complete and publish as-is. Run this after you edit anything in
  /partials or /scripts/photos.json:

      node scripts/sync.mjs

  What it does, for every .html page:
  1. Fills <!-- partial:NAME --> ... <!-- /partial:NAME --> with partials/NAME.html
     ({{root}} becomes "" or "../" so links work from /service-areas/ too) and marks the
     current page's nav links with aria-current="page".
  2. Rebuilds every <img data-photo="key"> (and <link rel="preload" data-photo="key">) from
     scripts/photos.json: Unsplash CDN srcset, focal-point crop, width/height, alt, lazy loading,
     and a loading color.
  3. Rebuilds the photo credits list between <!-- credits --> and <!-- /credits -->.
  No dependencies. Node 18+.
*/
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['partials', 'scripts', 'node_modules', '.git', 'fonts', 'images', 'css', 'js']);
const photos = JSON.parse(readFileSync(join(ROOT, 'scripts/photos.json'), 'utf8'));
const partials = Object.fromEntries(
  readdirSync(join(ROOT, 'partials'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => [f.replace(/\.html$/, ''), readFileSync(join(ROOT, 'partials', f), 'utf8').trim()])
);

function pages(dir = ROOT) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name)) out = out.concat(pages(full));
    } else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function parseAttrs(tag) {
  const attrs = [];
  const body = tag.replace(/^<\w+/, '').replace(/\/?>$/, '');
  const re = /([^\s=]+)(?:\s*=\s*"([^"]*)")?/g;
  let m;
  while ((m = re.exec(body))) attrs.push([m[1], m[2] === undefined ? null : m[2]]);
  return attrs;
}
const getAttr = (attrs, name) => { const a = attrs.find(([k]) => k === name); return a ? a[1] : undefined; };

function cdnUrl(p, w, h, crop) {
  const params = new URLSearchParams();
  params.set('w', String(w));
  if (crop) {
    params.set('h', String(h));
    params.set('fit', 'crop');
    params.set('crop', 'focalpoint');
    params.set('fp-x', String(p.fp[0]));
    params.set('fp-y', String(p.fp[1]));
  }
  params.set('fm', 'webp');
  params.set('q', w >= 1200 ? '62' : '70');
  params.set('cs', 'tinysrgb');
  return `${p.base}?${params.toString().replace(/&/g, '&amp;')}`;
}

function photoSet(key, attrs, file) {
  const p = photos[key];
  if (!p) throw new Error(`Unknown photo "${key}" in ${file}`);
  const cropAttr = getAttr(attrs, 'data-crop') || 'orig';
  const widths = (getAttr(attrs, 'data-widths') || '480,800,1200').split(',').map((n) => parseInt(n, 10));
  if (Math.max(...widths) > 1600) throw new Error(`Photo wider than 1600px in ${file}`);
  let rw = p.w, rh = p.h, crop = false;
  if (cropAttr !== 'orig') { [rw, rh] = cropAttr.split(':').map(Number); crop = true; }
  const set = widths.map((w) => ({ w, h: Math.round((w * rh) / rw) }));
  return { p, set, crop };
}

function buildImg(tag, file) {
  const attrs = parseAttrs(tag);
  const key = getAttr(attrs, 'data-photo');
  const { p, set, crop } = photoSet(key, attrs, file);
  const eager = getAttr(attrs, 'data-eager') !== undefined;
  const mid = set[Math.min(1, set.length - 1)];
  const big = set[set.length - 1];
  const keep = ['data-photo', 'data-crop', 'data-widths', 'data-eager', 'data-alt', 'class', 'sizes', 'id'];
  const out = [];
  for (const k of keep) {
    const v = getAttr(attrs, k);
    if (v !== undefined) out.push(v === null ? k : `${k}="${v}"`);
  }
  out.push(`src="${cdnUrl(p, mid.w, mid.h, crop)}"`);
  out.push(`srcset="${set.map((s) => `${cdnUrl(p, s.w, s.h, crop)} ${s.w}w`).join(', ')}"`);
  if (getAttr(attrs, 'sizes') === undefined) out.push('sizes="100vw"');
  out.push(`width="${big.w}" height="${big.h}"`);
  out.push(`alt="${escAttr(getAttr(attrs, 'data-alt') ?? p.alt)}"`);
  out.push(eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"');
  out.push(`style="object-position:${Math.round(p.fp[0] * 100)}% ${Math.round(p.fp[1] * 100)}%;background-color:${p.color}"`);
  return `<img ${out.join(' ')}>`;
}

function buildSource(tag, file) {
  const attrs = parseAttrs(tag);
  const key = getAttr(attrs, 'data-photo');
  const { p, set, crop } = photoSet(key, attrs, file);
  const big = set[set.length - 1];
  const media = getAttr(attrs, 'media');
  const sizes = getAttr(attrs, 'sizes') || '100vw';
  return `<source data-photo="${key}" data-crop="${getAttr(attrs, 'data-crop') || 'orig'}" data-widths="${set.map((s) => s.w).join(',')}"${media ? ` media="${media}"` : ''} srcset="${set.map((s) => `${cdnUrl(p, s.w, s.h, crop)} ${s.w}w`).join(', ')}" sizes="${sizes}" width="${big.w}" height="${big.h}">`;
}

function buildPreload(tag, file) {
  const attrs = parseAttrs(tag);
  const key = getAttr(attrs, 'data-photo');
  const { p, set, crop } = photoSet(key, attrs, file);
  const sizes = getAttr(attrs, 'imagesizes') || '100vw';
  const media = getAttr(attrs, 'media');
  return `<link rel="preload" as="image" data-photo="${key}" data-crop="${getAttr(attrs, 'data-crop') || 'orig'}" data-widths="${set.map((s) => s.w).join(',')}" imagesrcset="${set.map((s) => `${cdnUrl(p, s.w, s.h, crop)} ${s.w}w`).join(', ')}" imagesizes="${sizes}"${media ? ` media="${media}"` : ''} fetchpriority="high">`;
}

function credits() {
  const items = Object.entries(photos)
    .filter(([k]) => !k.startsWith('_'))
    .map(([, p]) => {
      const utm = '?utm_source=pinwheel_concept&utm_medium=referral';
      return `      <li><strong>${escHtml(p.alt)}</strong><span>Photo by <a href="https://unsplash.com/@${p.user}${utm}">${escHtml(p.by)}</a> on <a href="${p.page}${utm}">Unsplash</a>. Used for: ${escHtml(p.use)}.</span></li>`;
    });
  return `<!-- credits -->\n    <ul class="credit-list">\n${items.join('\n')}\n    </ul>\n    <!-- /credits -->`;
}

let changed = 0;
for (const file of pages()) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const depth = rel.split('/').length - 1;
  // 404.html is served at any missing URL, so its links must be root-absolute
  const rootPrefix = rel === '404.html' ? '/' : '../'.repeat(depth);
  let html = readFileSync(file, 'utf8');
  const before = html;

  html = html.replace(/<!-- partial:([\w-]+) -->[\s\S]*?<!-- \/partial:\1 -->/g, (m, name) => {
    if (!(name in partials)) throw new Error(`Missing partial "${name}" used in ${rel}`);
    let content = partials[name].replace(/\{\{root\}\}/g, rootPrefix);
    content = content.replace(/(<a\b[^>]*?)\sdata-nav="([^"]+)"([^>]*>)/g, (all, pre, target, post) =>
      target === rel ? `${pre} data-nav="${target}" aria-current="page"${post}` : all);
    return `<!-- partial:${name} -->\n${content}\n<!-- /partial:${name} -->`;
  });
  html = html.replace(/<img\b[^>]*\sdata-photo="[^"]+"[^>]*>/g, (tag) => buildImg(tag, rel));
  html = html.replace(/<link\b[^>]*\sdata-photo="[^"]+"[^>]*>/g, (tag) => buildPreload(tag, rel));
  html = html.replace(/<source\b[^>]*\sdata-photo="[^"]+"[^>]*>/g, (tag) => buildSource(tag, rel));
  html = html.replace(/<!-- credits -->[\s\S]*?<!-- \/credits -->/g, () => credits());

  if (html !== before) { writeFileSync(file, html); changed++; console.log(`updated ${rel}`); }
}
console.log(changed ? `Done. ${changed} page(s) updated.` : 'Done. Everything was already in sync.');
