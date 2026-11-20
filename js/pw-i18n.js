/* pw-i18n.js: the EN / ES toggle for Pinwheel.
   Every text block on the page (an element with its own words whose content is only inline tags) is keyed by its
   English HTML, with each inline <svg> icon swapped for the token ⟦s⟧ and white space collapsed. The Spanish
   dictionary (js/i18n/pw-es.js, keyed the same way) loads only when someone picks ES. Attributes people read or hear
   (aria-label, placeholder, alt, title) are swapped too. The choice is remembered in localStorage ("pw-lang").
   scripts/i18n-extract.mjs uses PWI18N.collect() from this file, so the keys always match. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var INLINE = { A: 1, SPAN: 1, STRONG: 1, EM: 1, B: 1, I: 1, BR: 1, SMALL: 1, SUP: 1, SUB: 1, ABBR: 1, MARK: 1, CODE: 1, TIME: 1, CITE: 1, Q: 1, U: 1, S: 1 };
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, TEXTAREA: 1, svg: 1, SVG: 1 };
  var ATTRS = ['aria-label', 'placeholder', 'alt', 'title'];
  var SVG_RE = /<svg\b[\s\S]*?<\/svg>/g;
  var TOKEN = '⟦s⟧';
  var me = d.currentScript;
  var srcBase = me && me.src ? me.src.replace(/js\/pw-i18n\.js.*$/, '') : '';
  var dictV = (me && me.getAttribute('data-v')) || '1';

  var norm = function (s) { return s.replace(/\s+/g, ' ').trim(); };
  var hasWords = function (s) { return /[A-Za-z]{2,}/.test(s.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ')); };
  var skipped = function (el) { return !el || el.closest('[translate="no"], .notranslate, svg'); };
  var ownText = function (el) {
    for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && /\S/.test(n.nodeValue)) return true;
    return false;
  };
  var allInline = function (el) {
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
      if (c.namespaceURI === 'http://www.w3.org/2000/svg') continue;
      if (!INLINE[c.tagName] || !allInline(c)) return false;
    }
    return true;
  };
  /* A text block: has its own words and only inline content. If its parent is the same kind of block, the parent wins. */
  var isUnit = function (el) { return ownText(el) && allInline(el) && !SKIP[el.tagName]; };
  function units(scope) {
    var out = [], seen = new Set();
    var walker = d.createTreeWalker(scope || d.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; },
    });
    var n;
    while ((n = walker.nextNode())) {
      var el = n.parentElement;
      if (!el || SKIP[el.tagName] || skipped(el)) continue;
      // climb to the outermost text block, passing through inline tags (a link inside bold inside a sentence is one block)
      var top = isUnit(el) ? el : null, cur = el;
      while (cur.parentElement && cur.parentElement !== d.body) {
        var par = cur.parentElement;
        if (isUnit(par)) { top = par; cur = par; continue; }
        if (INLINE[par.tagName]) { cur = par; continue; }
        break;
      }
      if (top) el = top;
      if (!isUnit(el)) { if (/[A-Za-z]{2,}/.test(n.nodeValue)) out.push(n); continue; } // loose words next to block tags
      if (seen.has(el)) continue;
      seen.add(el); out.push(el);
    }
    return out;
  }
  var keyOf = function (el) { return el.nodeType === 3 ? norm(el.nodeValue) : norm(el.innerHTML.replace(SVG_RE, TOKEN)); };

  /* For the extractor: every key on the page, plus attribute text */
  function collect() {
    var text = [], attrs = [];
    units().forEach(function (el) { var k = keyOf(el); if (hasWords(k)) text.push(k); });
    if (d.title) text.push(norm(d.title));
    d.querySelectorAll('[' + ATTRS.join('],[') + ']').forEach(function (el) {
      if (el.closest('[translate="no"], .notranslate')) return;
      ATTRS.forEach(function (a) { var v = el.getAttribute(a); if (v && hasWords(v)) attrs.push(norm(v)); });
    });
    return { text: text, attrs: attrs };
  }

  /* ---------- Swapping ---------- */
  var orig = new Map(), origAttr = [], origTitle = null, dict = null, lang = 'en', observer = null, busy = false;
  var PATTERNS = []; // [RegExp, replacement] for words scripts write on the fly (filled by the dictionary file)

  function tr(k) {
    if (!dict) return null;
    if (Object.prototype.hasOwnProperty.call(dict, k)) return dict[k];
    for (var i = 0; i < PATTERNS.length; i++) if (PATTERNS[i][0].test(k)) return k.replace(PATTERNS[i][0], PATTERNS[i][1]);
    return null;
  }
  function swapUnit(el) {
    if (el.nodeType === 3) {
      var tk = norm(el.nodeValue), te = tr(tk); if (te == null || te === tk) return;
      if (!orig.has(el)) orig.set(el, el.nodeValue);
      el.nodeValue = el.nodeValue.replace(/\S[\s\S]*\S|\S/, te); return;
    }
    var html = el.innerHTML, k = norm(html.replace(SVG_RE, TOKEN)), es = tr(k);
    if (es == null || es === k) return;
    var icons = html.match(SVG_RE) || [], i = 0;
    if (!orig.has(el)) orig.set(el, html);
    el.innerHTML = es.split(TOKEN).reduce(function (acc, part, j) { return j ? acc + (icons[i++] || '') + part : part; }, '');
  }
  function swapAttrs(scope) {
    (scope || d).querySelectorAll('[' + ATTRS.join('],[') + ']').forEach(function (el) {
      if (el.closest('[translate="no"], .notranslate')) return;
      ATTRS.forEach(function (a) {
        var v = el.getAttribute(a); if (!v) return;
        var es = tr(norm(v)); if (es == null || es === v) return;
        origAttr.push([el, a, v]); el.setAttribute(a, es);
      });
    });
  }
  function applyAll(scope) {
    busy = true;
    units(scope).forEach(swapUnit);
    swapAttrs(scope);
    if (!scope && d.title) { var t = tr(norm(d.title)); if (t) { origTitle = origTitle || d.title; d.title = t; } }
    busy = false;
  }
  function restore() {
    if (observer) observer.disconnect();
    busy = true;
    orig.forEach(function (html, el) { if (el.nodeType === 3) el.nodeValue = html; else el.innerHTML = html; });
    origAttr.reverse().forEach(function (x) { x[0].setAttribute(x[1], x[2]); });
    if (origTitle) d.title = origTitle;
    orig.clear(); origAttr = []; origTitle = null;
    busy = false;
  }
  function watch() {
    if (observer || !window.MutationObserver) { if (observer) observer.observe(d.body, { childList: true, subtree: true, characterData: true }); return; }
    var queued = new Set(), timer = 0;
    observer = new MutationObserver(function (list) {
      if (busy || lang !== 'es') return;
      list.forEach(function (m) {
        var t = m.target.nodeType === 3 ? m.target.parentElement : m.target;
        if (t && t.nodeType === 1) queued.add(t);
      });
      clearTimeout(timer);
      timer = setTimeout(function () {
        busy = true;
        queued.forEach(function (t) {
          if (!t.isConnected) return;
          var u = t; while (u && !isUnit(u) && u.parentElement && INLINE[u.tagName]) u = u.parentElement;
          if (u && isUnit(u)) { orig.delete(u); swapUnit(u); } else { units(t).forEach(swapUnit); }
          swapAttrs(t.parentElement || t);
        });
        queued.clear();
        busy = false;
      }, 0);
    });
    observer.observe(d.body, { childList: true, subtree: true, characterData: true });
  }
  function loadDict(cb) {
    if (dict) return cb();
    var s = d.createElement('script');
    s.src = srcBase + 'js/i18n/pw-es.js?v=' + dictV;
    s.onload = function () { dict = window.PW_ES || {}; PATTERNS = (window.PW_ES_PATTERNS || []); cb(); };
    s.onerror = function () { root.classList.remove('pw-es-wait'); };
    d.head.appendChild(s);
  }
  function setButtons() {
    d.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
  }
  function setLang(next, remember) {
    if (remember) { try { localStorage.setItem('pw-lang', next); } catch (e) { /* private mode */ } }
    if (next === lang) { root.classList.remove('pw-es-wait'); return; }
    if (next === 'es') {
      loadDict(function () {
        lang = 'es'; root.lang = 'es';
        applyAll(); watch(); setButtons();
        root.classList.remove('pw-es-wait');
        d.dispatchEvent(new CustomEvent('pw:lang', { detail: 'es' }));
      });
    } else {
      lang = 'en'; root.lang = 'en';
      restore(); setButtons();
      d.dispatchEvent(new CustomEvent('pw:lang', { detail: 'en' }));
    }
  }

  window.PWI18N = { collect: collect, keyOf: keyOf, units: units, setLang: setLang, lang: function () { return lang; } };

  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lang]');
    if (!b) return;
    e.preventDefault();
    setLang(b.getAttribute('data-lang'), true);
  });
  var start = function () {
    var saved = null; try { saved = localStorage.getItem('pw-lang'); } catch (e) { /* private mode */ }
    if (/[?&]lang=es\b/.test(location.search)) saved = 'es';
    if (saved === 'es') setLang('es'); else root.classList.remove('pw-es-wait');
  };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})();
