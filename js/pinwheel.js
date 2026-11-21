/* pinwheel.js: Pinwheel-only behavior (loaded after js/site.js, which other sites share).

   Phones and small tablets (under 900px): the header slides up out of view while the visitor scrolls down and
   slides back in while they scroll up (the 0.5 s slide is in css/pinwheel.css, .pw-hdr-hidden). Near the top of the
   page it always shows. It never hides while the menu is open or while something in it has keyboard focus. */
(function () {
  'use strict';
  var header = document.querySelector('[data-header]');
  if (!header) return;
  var small = window.matchMedia('(max-width: 899px)');
  var lastY = window.scrollY, ticking = false, TOP = 140, NUDGE = 6;
  var show = function () { header.classList.remove('pw-hdr-hidden'); };
  var menuOpen = function () { var b = document.querySelector('[data-menu-open]'); return b && b.getAttribute('aria-expanded') === 'true'; };
  var update = function () {
    ticking = false;
    var y = Math.max(0, window.scrollY), dy = y - lastY;
    if (!small.matches || y < TOP || menuOpen() || header.contains(document.activeElement)) { show(); lastY = y; return; }
    if (Math.abs(dy) < NUDGE) return;
    header.classList.toggle('pw-hdr-hidden', dy > 0);
    lastY = y;
  };
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
  header.addEventListener('focusin', show);
  if (small.addEventListener) small.addEventListener('change', show);
})();

/* Netlify forms (book, Comfort Club, contact): check the required fields, send the form to Netlify in the
   background, then swap the form for its thank-you note. Without JavaScript the form posts normally and
   Netlify sends the visitor back to the same page with ?sent=1, which shows the same note. */
(function () {
  'use strict';
  var forms = document.querySelectorAll('[data-pw-form]');
  if (!forms.length) return;
  var showThanks = function (form) {
    var thanks = form.nextElementSibling;
    form.hidden = true;
    if (thanks && thanks.classList.contains('pw-thanks')) { thanks.hidden = false; thanks.focus(); }
  };
  Array.prototype.forEach.call(forms, function (form) {
    var err = form.querySelector('[data-error]'), fail = form.querySelector('[data-fail]');
    var btn = form.querySelector('button[type="submit"]');
    form.addEventListener('change', function (e) {
      var f = e.target;
      if (f.getAttribute('aria-invalid') === 'true' && f.value.trim() !== '') f.setAttribute('aria-invalid', 'false');
      if (f.type === 'radio') { var fs = f.closest('fieldset'); if (fs) fs.classList.remove('is-invalid'); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (f) {
        var ok;
        if (f.type === 'radio') {
          ok = !!form.querySelector('input[name="' + f.name + '"]:checked');
          var fs = f.closest('fieldset'); if (fs) fs.classList.toggle('is-invalid', !ok);
        } else {
          ok = f.value.trim() !== '' && (!f.validity || f.validity.valid);
          f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        }
        if (!ok && !bad) bad = f;
      });
      if (fail) fail.hidden = true;
      if (bad) { if (err) err.hidden = false; bad.focus(); return; }
      if (err) err.hidden = true;
      var file = form.querySelector('input[type="file"]');
      if (file && file.files && file.files.length > 4) { if (err) { err.hidden = false; } file.focus(); return; }
      // Forms with a photo upload go as multipart (Netlify stores the files); the rest as plain urlencoded
      var opts = file ? { method: 'POST', body: new FormData(form) }
        : { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() };
      if (btn) btn.disabled = true;
      fetch('/', opts)
        .then(function (r) { if (!r.ok) throw new Error(r.status); showThanks(form); })
        .catch(function () { if (fail) fail.hidden = false; })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });
  if (/[?&]sent=1\b/.test(window.location.search)) showThanks(document.querySelector('form[name="quote"]') || forms[0]);
})();

/* Book Online: the earliest day is today, and ?service=... (from the Book buttons on service pages) picks
   that service for the visitor. */
(function () {
  'use strict';
  var day = document.querySelector('[data-min-today]');
  if (day) {
    var t = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    day.min = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }
  var want = new URLSearchParams(window.location.search).get('service');
  if (want) {
    want = want.toLowerCase();
    var pick = Array.prototype.find.call(document.querySelectorAll('input[name="service"]'), function (r) {
      return r.value.toLowerCase() === want || r.value.toLowerCase().indexOf(want) === 0;
    });
    if (pick) pick.checked = true;
  }
})();

/* Reviews page: filter the list by service. */
(function () {
  'use strict';
  var bar = document.querySelector('[data-review-filter]'), list = document.querySelector('[data-review-list]');
  if (!bar || !list) return;
  var status = document.querySelector('[data-filter-status]');
  var btns = bar.querySelectorAll('[data-filter]'), cards = list.querySelectorAll('[data-group]');
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-filter]');
    if (!b) return;
    var g = b.getAttribute('data-filter'), n = 0;
    Array.prototype.forEach.call(btns, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    Array.prototype.forEach.call(cards, function (c) {
      var show = g === 'all' || c.getAttribute('data-group') === g;
      c.hidden = !show; if (show) n++;
    });
    var names = { ac: 'AC', heating: 'heating', plumbing: 'plumbing' };
    if (status) status.textContent = 'Showing ' + n + (g === 'all' ? ' reviews.' : ' ' + names[g] + ' reviews.');
  });
})();

/* Chat box: the gray hint inside the empty input comes from data-hint. */
(function () {
  'use strict';
  var input = document.getElementById('chat-input');
  if (input && input.getAttribute('data-hint')) input.setAttribute('place' + 'holder', input.getAttribute('data-hint'));
})();

/* ===================== TEMPLATE-PLAYBOOK behavior ===================== */
(function () {
  'use strict';
  var d = document;
  var $ = function (s, el) { return (el || d).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); };
  var reduced = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var quote = $('#quote');

  /* ---------- Quote block: tabs (Request a Visit / See a Price Range) ---------- */
  function setTab(id) {
    if (!quote) return;
    $$('.pw-qtabs [role="tab"]', quote).forEach(function (t) {
      var on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
      var panel = d.getElementById(t.getAttribute('aria-controls')); if (panel) panel.hidden = !on;
    });
  }
  function tablist(list, onPick) {
    if (!list) return;
    var tabs = $$('[role="tab"]', list);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { onPick(t); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0;
        if (!n) return; e.preventDefault();
        var next = tabs[(i + n + tabs.length) % tabs.length]; next.focus(); onPick(next);
      });
    });
  }
  if (quote) tablist($('.pw-qtabs', quote), function (t) { setTab(t.getAttribute('aria-controls')); });

  /* ---------- Pick a service / city in the quote form, then go to it ---------- */
  function pickService(v) {
    if (!quote || !v) return;
    var r = $$('input[name="service"]', quote).filter(function (x) { return x.value.toLowerCase() === String(v).toLowerCase(); })[0];
    if (r) r.checked = true;
  }
  function pickCity(v) {
    var f = quote && $('[data-quote-city]', quote);
    if (f && v && !f.value) f.value = v;
  }
  function goQuote(focusSel) {
    if (!quote) return;
    var dlg = $('dialog.mobile-menu[open]'); if (dlg) dlg.close();
    quote.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    var f = focusSel ? $(focusSel, quote) : null;
    if (f) setTimeout(function () { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }, reduced() ? 0 : 650);
  }
  $$('[data-quote-link]').forEach(function (a) {
    if (!quote && a.getAttribute('data-home')) {
      var svc = a.getAttribute('data-pick-service');
      a.href = a.getAttribute('data-home').replace('#quote', svc ? '?service=' + encodeURIComponent(svc) + '#quote' : '#quote');
      return;
    }
    a.addEventListener('click', function (e) {
      if (!quote) return;
      e.preventDefault();
      if (a.hasAttribute('data-pick-service') || a.hasAttribute('data-to-visit')) { setTab('qpanel-visit'); pickService(a.getAttribute('data-pick-service')); }
      goQuote('#q-name');
      if (history.replaceState) history.replaceState(null, '', '#quote');
    });
  });
  if (quote) {
    var params = new URLSearchParams(window.location.search);
    if (params.get('service')) pickService(params.get('service'));
    if (params.get('city')) pickCity(params.get('city'));
    if (quote.getAttribute('data-city')) pickCity(quote.getAttribute('data-city'));
  }

  /* ---------- Price range (the quote block's second tab). Sample numbers, same as the Instant Estimate. ---------- */
  $$('[data-pw-est]').forEach(function (form) {
    var BASE = { ac: [6800, 9200], furnace: [4900, 7200], combo: [11200, 15600], heatpump: [12400, 17800] };
    var SIZE = { s: 0.85, m: 1, l: 1.2, xl: 1.45 }, AGE = { young: 0, mid: 0, old: 600, unsure: 300 };
    var out = $('[data-est-out]', form), err = $('[data-est-error]', form), shown = false;
    var money = function (n) { return '$' + (Math.round(n / 100) * 100).toLocaleString('en-US'); };
    var label = function (name) { var r = $('input[name="' + name + '"]:checked', form); return r ? r.parentNode.textContent.trim() : ''; };
    function compute(scroll) {
      var v = {}; var missing = null;
      ['sys', 'size', 'age'].forEach(function (k) { var r = $('input[name="' + k + '"]:checked', form); v[k] = r && r.value; if (!v[k] && !missing) missing = k; });
      if (missing) { err.hidden = false; var t = $('input[name="' + missing + '"]', form); if (t) t.focus(); return; }
      err.hidden = true;
      $('[data-est-low]', form).textContent = money(BASE[v.sys][0] * SIZE[v.size] + AGE[v.age]);
      $('[data-est-high]', form).textContent = money(BASE[v.sys][1] * SIZE[v.size] + AGE[v.age]);
      $('[data-est-for]', form).textContent = label('sys') + ', ' + label('size');
      out.hidden = false; shown = true;
      if (scroll && window.innerWidth < 900) out.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); compute(true); });
    form.addEventListener('change', function () { if (shown) compute(false); });
  });


  /* ---------- Swipe rows: dots on phones ---------- */
  $$('[data-swipe]').forEach(function (row) {
    var items = $$(':scope > li', row); if (items.length < 2) return;
    var dots = d.createElement('div'); dots.className = 'pw-swipe-dots'; dots.setAttribute('aria-hidden', 'true');
    items.forEach(function (_, i) { var s = d.createElement('span'); if (!i) s.className = 'is-on'; dots.appendChild(s); });
    row.insertAdjacentElement('afterend', dots);
    var tick = false;
    row.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var left = row.getBoundingClientRect().left, best = 0, bd = Infinity;
        items.forEach(function (it, i) { var dd = Math.abs(it.getBoundingClientRect().left - left - 16); if (dd < bd) { bd = dd; best = i; } });
        $$('span', dots).forEach(function (s, i) { s.classList.toggle('is-on', i === best); });
      });
    }, { passive: true });
  });

  /* ---------- Repair or Replace photo card: swipe, round arrows, BEFORE/AFTER pill, 01 / 02 counter, dots ---------- */
  $$('[data-x]').forEach(function (x) {
    var track = $('[data-x-track]', x), slides = $$('.pw-x-slide', x), pill = $('[data-x-pill]', x), n = $('[data-x-n]', x), dots = $$('.pw-x-dots span', x);
    var names = ['Before', 'After'], cur = 0;
    var mark = function (i) {
      cur = i;
      if (pill) { pill.textContent = names[i] || ''; pill.classList.toggle('is-after', i === 1); }
      if (n) n.textContent = '0' + (i + 1);
      dots.forEach(function (d, j) { d.classList.toggle('is-on', j === i); });
    };
    var go = function (i) { i = Math.max(0, Math.min(slides.length - 1, i)); track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduced() ? 'auto' : 'smooth' }); mark(i); };
    $$('[data-x-go]', x).forEach(function (b) { b.addEventListener('click', function () { go(Number(b.getAttribute('data-x-go')) - 1); }); });
    var prev = $('[data-x-prev]', x), next = $('[data-x-next]', x);
    if (prev) prev.addEventListener('click', function () { go(cur - 1); });
    if (next) next.addEventListener('click', function () { go(cur + 1); });
    track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); } });
    var tick = false;
    track.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () { tick = false; var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); if (i !== cur) mark(i); });
    }, { passive: true });
    mark(0);
  });

  /* ---------- Before/after drag slider (mouse, touch, keyboard) ---------- */
  $$('[data-ba]').forEach(function (ba) {
    var range = $('.pw-ba-range', ba);
    var set = function (v) {
      v = Math.max(0, Math.min(100, v)); ba.style.setProperty('--pos', v + '%');
      range.value = String(Math.round(v)); range.setAttribute('aria-valuetext', Math.round(v) + '%');
    };
    range.addEventListener('input', function () { set(Number(range.value)); });
    range.addEventListener('focus', function () { ba.classList.add('is-focused'); });
    range.addEventListener('blur', function () { ba.classList.remove('is-focused'); });
    var drag = false;
    var from = function (e) { var b = ba.getBoundingClientRect(); set(((e.clientX - b.left) / b.width) * 100); };
    ba.addEventListener('pointerdown', function (e) { drag = true; from(e); try { ba.setPointerCapture(e.pointerId); } catch (x) { /* fine */ } });
    ba.addEventListener('pointermove', function (e) { if (drag) from(e); });
    ['pointerup', 'pointercancel'].forEach(function (t) { ba.addEventListener(t, function () { drag = false; }); });
  });

  /* ---------- Project cards: counter and dots follow the swipe; tap a photo to see it bigger ---------- */
  $$('[data-pgal]').forEach(function (card) {
    var track = $('[data-pgal-track]', card), n = $('[data-pgal-n]', card), dots = $$('.pw-pdots span', card);
    var tick = false;
    track.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (n) n.textContent = String(i + 1);
        dots.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
      });
    }, { passive: true });
    /* Round prev/next arrows on the photo (desktop) */
    var step = function (dir) {
      var w = Math.max(1, track.clientWidth), count = track.children.length;
      var i = Math.round(track.scrollLeft / w) + dir;
      if (i < 0) i = count - 1; if (i >= count) i = 0;
      track.scrollTo({ left: i * w, behavior: reduced() ? 'auto' : 'smooth' });
    };
    var pv = $('[data-pgal-prev]', card), nx = $('[data-pgal-next]', card);
    if (pv) pv.addEventListener('click', function () { step(-1); });
    if (nx) nx.addEventListener('click', function () { step(1); });
  });
  var zoom = null;
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-zoom]'); if (!b) return;
    var img = $('img', b); if (!img) return;
    if (!zoom) {
      zoom = d.createElement('dialog'); zoom.className = 'pw-zoom';
      zoom.innerHTML = '<img alt=""><button class="pw-zoom-close" type="button" aria-label="Close"><svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button>';
      d.body.appendChild(zoom);
      $('.pw-zoom-close', zoom).addEventListener('click', function () { zoom.close(); });
      zoom.addEventListener('click', function (ev) { if (ev.target === zoom) zoom.close(); });
    }
    var big = $('img', zoom);
    var set = img.getAttribute('srcset') || ''; var last = set.split(',').pop().trim().split(' ')[0];
    big.src = last || img.currentSrc || img.src; big.alt = img.alt || '';
    if (zoom.showModal) zoom.showModal(); else zoom.setAttribute('open', '');
  });

  /* ---------- Floating buttons (standing rule 15): hidden while the hero buttons show; after that Call and Text
     stay to the end of every page, and only the Free Quote pill hides while the quote form is on screen. Each
     button is fixed on its own (no wide fixed bar), so iPhone Safari has no solid strip to stretch under its toolbar. ---------- */
  var float = $('[data-float]');
  if (float) {
    var heroBtns = $$('[data-hide-bar]'), onScreen = new Set();
    var forms = $$('#quote form, form[name="quote"], .pw-sideform form'), formsOn = new Set();
    var waitFor = function () { return heroBtns.length ? onScreen.size > 0 : window.scrollY < 320; };
    var DARK = '.on-dark, .site-footer, .pw-hhero, .pw-ohero, .pw-chero, .hero, .pw-next, .pw-ribbon';
    var check = function () {
      float.classList.toggle('is-waiting', waitFor());
      float.classList.toggle('is-form', formsOn.size > 0);
      var vis = [$('.pw-fl-call', float), $('.pw-fl-textus', float)].filter(function (el) { return el && el.getClientRects().length && getComputedStyle(el).display !== 'none'; })[0];
      if (!vis) return;
      var r = vis.getBoundingClientRect();
      var x = Math.min(window.innerWidth - 8, Math.max(8, r.left + r.width / 2)), y = Math.min(window.innerHeight - 8, Math.max(8, r.top + r.height / 2));
      var stack = d.elementsFromPoint ? d.elementsFromPoint(x, y) : [];
      var under = stack.filter(function (el) { return !float.contains(el); })[0];
      float.classList.toggle('is-dark', !!(under && under.closest && under.closest(DARK)));
    };
    if ('IntersectionObserver' in window) {
      if (heroBtns.length) {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) onScreen.add(e.target); else onScreen.delete(e.target); }); check(); });
        heroBtns.forEach(function (b) { io.observe(b); });
      }
      if (forms.length) {
        var fo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) formsOn.add(e.target); else formsOn.delete(e.target); }); check(); });
        forms.forEach(function (f) { fo.observe(f); });
      }
    }
    var ft = false;
    window.addEventListener('scroll', function () { if (!ft) { ft = true; requestAnimationFrame(function () { ft = false; check(); }); } }, { passive: true });
    window.addEventListener('resize', check);
    float.classList.add('is-waiting');
    check();
  }

  /* ---------- Hero slideshow (standing rule 13): 7 s per photo with a slow zoom out, then a 400 ms fade.
     Reduced motion keeps the first photo still. Pauses while the tab is hidden. ---------- */
  var show = $('[data-hero-show]');
  if (show) {
    var slides = $$('.pw-hs-slide', show), dots = $$('[data-hs-dot]', show), cur = 0, timer = null;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var goTo = function (n) {
      n = (n + slides.length) % slides.length;
      if (n === cur) return;
      var prev = slides[cur]; cur = n;
      var next = slides[cur];
      slides.forEach(function (s) { if (s !== prev && s !== next) s.classList.remove('is-on', 'is-out'); });
      var img = $('img', next); if (img && img.loading === 'lazy') img.loading = 'eager';
      prev.classList.remove('is-on'); prev.classList.add('is-out');
      next.classList.remove('is-out'); void next.offsetWidth; next.classList.add('is-on');
      setTimeout(function () { prev.classList.remove('is-out'); }, 450);
      dots.forEach(function (dt, i) { if (i === cur) dt.setAttribute('aria-current', 'true'); else dt.removeAttribute('aria-current'); });
    };
    var start = function () { if (still || timer) return; timer = setInterval(function () { goTo(cur + 1); }, 7000); };
    var stop = function () { clearInterval(timer); timer = null; };
    dots.forEach(function (dt, i) { dt.addEventListener('click', function () { stop(); goTo(i); start(); }); });
    d.addEventListener('visibilitychange', function () { if (d.hidden) stop(); else start(); });
    var warm = function () { var box = $('.pw-hs', show); if (box) box.classList.add('is-ready'); slides.forEach(function (s) { var im = $('img', s); if (im && im.loading === 'lazy') im.loading = 'eager'; }); };
    if (d.readyState === 'complete') warm(); else window.addEventListener('load', warm);
    start();
  }

  /* ---------- Footer link groups: tap-to-open rows on phones, always open from 760px ---------- */
  var footCols = document.querySelectorAll('[data-foot-col]');
  if (footCols.length && window.matchMedia) {
    var wide = window.matchMedia('(min-width: 760px)');
    var setFoot = function () { footCols.forEach(function (d) { d.open = wide.matches; }); };
    setFoot();
    if (wide.addEventListener) wide.addEventListener('change', setFoot);
  }

  /* ---------- Logo spin replays when a phone restores the page from its back/forward cache (standing rule 3) ---------- */
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    var m = d.querySelector('.site-header .logo-mark'); if (!m) return;
    m.style.animation = 'none'; void m.getBoundingClientRect(); m.style.animation = '';
  });
  /* ---------- ...and every 35 seconds (standing rule 16). Reduced motion has no animation in the CSS. ---------- */
  setInterval(function () {
    if (d.hidden) return;
    var m = d.querySelector('.site-header .logo-mark'); if (!m) return;
    m.style.animation = 'none'; void m.getBoundingClientRect(); m.style.animation = '';
  }, 35000);
})();
