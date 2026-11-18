/* mtz.js: MTZ HVAC Services homepage behavior (with js/site.js and js/reveal.js).
   1. Phones: the header slides out while scrolling down and back in while scrolling up.
   2. EN | ES: switches every word on the page to Spanish (js/i18n-es.js) and back, and remembers the choice.
   3. Book Online: service, day, and 2-hour window chips, a live summary, and a working Netlify form (mtz-booking)
      that swaps to the thank-you note. "Book this" links pick their service in the form. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, el) { return (el || d).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* blocked: fine */ } }
  };

  /* ---------- 1. Phone header: hide on scroll down, show on scroll up ---------- */
  (function () {
    var header = $('[data-header]');
    if (!header) return;
    var small = window.matchMedia('(max-width: 899px)');
    var lastY = window.scrollY, ticking = false, TOP = 140, NUDGE = 6;
    var show = function () { header.classList.remove('pw-hdr-hidden'); };
    var menuOpen = function () { var b = $('[data-menu-open]'); return b && b.getAttribute('aria-expanded') === 'true'; };
    var update = function () {
      ticking = false;
      var y = Math.max(0, window.scrollY), dy = y - lastY;
      if (!small.matches || y < TOP || menuOpen() || header.contains(d.activeElement)) { show(); lastY = y; return; }
      if (Math.abs(dy) < NUDGE) return;
      header.classList.toggle('pw-hdr-hidden', dy > 0);
      lastY = y;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
    header.addEventListener('focusin', show);
    if (small.addEventListener) small.addEventListener('change', show);
  })();

  /* ---------- 2. Language ---------- */
  var ES = window.MTZ_ES || {};
  var lang = 'en';
  var en = {}; // the English, read from the page the first time an element is switched
  var EN_DOC = { title: d.title, desc: ($('meta[name="description"]') || {}).content };
  var UI = {
    en: { today: 'Today', tomorrow: 'Tomorrow', dows: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      longDows: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], months_long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      dash: '–', thanks: function (s, day, w) { return s + ' on ' + day + ', arriving ' + w + '.'; }, review: function (i, n) { return 'Review ' + i + ' of ' + n; }, chooseReview: 'Choose a review', sending: 'Sending...' },
    es: { today: 'Hoy', tomorrow: 'Mañana', dows: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'], months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
      longDows: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], months_long: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
      dash: '–', thanks: function (s, day, w) { return s + ' el ' + day + ', con llegada de ' + w + '.'; }, review: function (i, n) { return 'Reseña ' + i + ' de ' + n; }, chooseReview: 'Elige una reseña', sending: 'Enviando...' }
  };
  var ui = function () { return UI[lang]; };

  function applyLang(next, save) {
    lang = next === 'es' ? 'es' : 'en';
    root.lang = lang;
    $$('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!(k in en)) en[k] = el.innerHTML;
      var html = lang === 'es' && ES[k] != null ? ES[k] : en[k];
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':'), attr = p[0], k = p[1], store_k = '@' + k + '@' + attr;
        if (!(store_k in en)) en[store_k] = el.getAttribute(attr) || '';
        el.setAttribute(attr, lang === 'es' && ES[k] != null ? ES[k] : en[store_k]);
      });
    });
    d.title = lang === 'es' && ES._title ? ES._title : EN_DOC.title;
    var meta = $('meta[name="description"]');
    if (meta) meta.content = lang === 'es' && ES._desc ? ES._desc : EN_DOC.desc;
    $$('.mtz-lang-btn').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
    var lf = $('[data-lang-field]'); if (lf) lf.value = lang === 'es' ? 'Spanish' : 'English';
    $$('.review-dots').forEach(function (g) {
      g.setAttribute('aria-label', ui().chooseReview);
      var bs = $$('button', g); bs.forEach(function (b, i) { b.setAttribute('aria-label', ui().review(i + 1, bs.length)); });
    });
    if (window.MTZ_onLang) window.MTZ_onLang();
    if (save) store.set('mtz-lang', lang);
    root.classList.remove('lang-es-pending');
    window.dispatchEvent(new Event('resize')); // headline underline fit (site.js) re-measures the new words
  }
  $$('.mtz-lang-btn').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang'), true); });
  });

  /* ---------- 3. Booking ---------- */
  var form = $('[data-mtz-booking]');
  var thanks = $('[data-thanks]');
  var daysWrap = $('[data-days]');
  var dayFallback = $('[data-day-fallback]');
  var fallbackInput = dayFallback ? $('input', dayFallback) : null;
  var CLOSE_HOUR = 18; // last window ends at 6pm
  var labelOf = function (input) { var s = input && input.parentNode.querySelector('span [data-i18n], span[data-i18n]'); return s ? s.textContent.trim() : (input ? input.value : ''); };
  var dayLabel = function (dt, i) {
    var u = ui();
    var top = i === 0 && sameDay(dt, new Date()) ? u.today : (isTomorrow(dt) ? u.tomorrow : u.dows[dt.getDay()]);
    return { top: top, date: lang === 'es' ? dt.getDate() + ' ' + u.months[dt.getMonth()] : u.months[dt.getMonth()] + ' ' + dt.getDate() };
  };
  var longDay = function (dt) { var u = ui(); return lang === 'es' ? u.longDows[dt.getDay()] + ' ' + dt.getDate() + ' de ' + u.months_long[dt.getMonth()] : u.longDows[dt.getDay()] + ', ' + u.months_long[dt.getMonth()] + ' ' + dt.getDate(); };
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function isTomorrow(dt) { var t = new Date(); t.setDate(t.getDate() + 1); return sameDay(dt, t); }
  var iso = function (dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); };
  var engDay = function (dt) { return UI.en.longDows[dt.getDay()] + ', ' + UI.en.months_long[dt.getMonth()] + ' ' + dt.getDate(); };

  /* The next 7 open days (Monday to Saturday). Today counts while an arrival window is still ahead. */
  var days = [];
  function buildDays() {
    if (!form || !daysWrap) return;
    var picked = $('input[name="day_pick"]:checked', daysWrap);
    var pickedIso = picked ? picked.getAttribute('data-iso') : null;
    days = [];
    var now = new Date(), dt = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (now.getHours() >= CLOSE_HOUR - 2) dt.setDate(dt.getDate() + 1);
    while (days.length < 7) { if (dt.getDay() !== 0) days.push(new Date(dt)); dt.setDate(dt.getDate() + 1); }
    daysWrap.innerHTML = '';
    days.forEach(function (day, i) {
      var l = dayLabel(day, i);
      var lab = d.createElement('label');
      lab.className = 'mtz-chip mtz-day';
      lab.innerHTML = '<input type="radio" name="day_pick" value="' + engDay(day) + '" data-iso="' + iso(day) + '" data-i="' + i + '"><span><span class="mtz-day-dow">' + l.top + '</span><span class="mtz-day-date">' + l.date + '</span></span>';
      daysWrap.appendChild(lab);
    });
    if (pickedIso) { var again = $('input[data-iso="' + pickedIso + '"]', daysWrap); if (again) again.checked = true; }
    if (dayFallback) { dayFallback.classList.add('is-replaced'); fallbackInput.removeAttribute('required'); fallbackInput.type = 'hidden'; }
  }

  /* Windows that already started today are crossed out */
  function syncWindows() {
    if (!form) return;
    var p = $('input[name="day_pick"]:checked', form);
    var isToday = p && sameDay(days[+p.getAttribute('data-i')], new Date());
    var h = new Date().getHours();
    $$('input[name="window"]', form).forEach(function (w) {
      var past = isToday && +w.getAttribute('data-start') <= h;
      w.disabled = past;
      if (past && w.checked) w.checked = false;
    });
  }

  function summary() {
    if (!form) return {};
    var s = $('input[name="service"]:checked', form), p = $('input[name="day_pick"]:checked', form), w = $('input[name="window"]:checked', form);
    var out = { service: s ? labelOf(s) : '', day: p ? longDay(days[+p.getAttribute('data-i')]) : '', window: w ? labelOf(w) : '' };
    $$('[data-sum]', form).forEach(function (dd) { dd.textContent = out[dd.getAttribute('data-sum')] || ui().dash; });
    if (fallbackInput && p) fallbackInput.value = p.value;
    var sf = $('[data-summary-field]', form);
    if (sf) sf.value = (s ? s.value : '?') + ' | ' + (p ? p.value : '?') + ' | ' + (w ? w.value : '?');
    return out;
  }

  function pickService(value) {
    if (!form) return;
    var r = $$('input[name="service"]', form).filter(function (x) { return x.value === value; })[0];
    if (r) { r.checked = true; var st = r.closest('.mtz-step'); if (st) { st.classList.remove('is-invalid'); var e = $('[data-err-for]', st); if (e) e.hidden = true; } summary(); }
  }

  if (form) {
    buildDays(); syncWindows(); summary();
    /* Checks (the form is novalidate): a step that is missing gets an orange outline, a short message under it, and a
       quick shake. Each message goes away as soon as its step is filled. aria-invalid tells screen readers. */
    var STEPS = [
      { key: 'service', box: function () { return $('[data-step="service"]', form); }, ok: function () { return !!$('input[name="service"]:checked', form); }, focus: function () { return $('input[name="service"]', form); } },
      { key: 'day', box: function () { return $('[data-step="day"]', form); }, ok: function () { return !!$('input[name="day_pick"]:checked', form) || (!$('input[name="day_pick"]', form) && fallbackInput && fallbackInput.value.trim() !== ''); }, focus: function () { return $('input[name="day_pick"]', form) || fallbackInput; } },
      { key: 'window', box: function () { return $('[data-step="window"]', form); }, ok: function () { return !!$('input[name="window"]:checked', form); }, focus: function () { return $('input[name="window"]:not(:disabled)', form); } },
      { key: 'name', box: function () { return $('[data-field="name"]', form); }, ok: function () { return form.elements.name.value.trim().length > 0; }, focus: function () { return form.elements.name; } },
      { key: 'phone', box: function () { return $('[data-field="phone"]', form); }, ok: function () { return (form.elements.phone.value.match(/\d/g) || []).length >= 7; }, focus: function () { return form.elements.phone; } },
      { key: 'address', box: function () { return $('[data-field="address"]', form); }, ok: function () { return form.elements.address.value.trim().length > 2; }, focus: function () { return form.elements.address; } }
    ];
    var mark = function (st, bad) {
      var box = st.box(), msg = $('[data-err-for="' + st.key + '"]', form);
      if (box) box.classList.toggle('is-invalid', bad);
      if (msg) msg.hidden = !bad;
      var group = box && box.querySelector('[role="radiogroup"]');
      var field = form.elements[st.key];
      if (group) group.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (field && field.setAttribute) field.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (group && bad) group.setAttribute('aria-describedby', 'err-' + st.key);
    };
    var recheck = function () { STEPS.forEach(function (st) { var box = st.box(); if (box && box.classList.contains('is-invalid') && st.ok()) mark(st, false); }); };
    form.addEventListener('change', function (e) { if (e.target.name === 'day_pick') syncWindows(); recheck(); summary(); });
    form.addEventListener('input', recheck);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fail = $('[data-fail]', form), first = null;
      STEPS.forEach(function (st) { var bad = !st.ok(); mark(st, bad); if (bad && !first) first = st; });
      if (fail) fail.hidden = true;
      if (first) {
        var box = first.box();
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var top = box.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
        box.classList.remove('is-shaking'); void box.offsetWidth; box.classList.add('is-shaking');
        setTimeout(function () { box.classList.remove('is-shaking'); }, 500);
        var f = first.focus(); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, reduce ? 0 : 350);
        return;
      }
      var sum = summary();
      var btn = $('button[type="submit"]', form), btnText = btn.innerHTML;
      btn.disabled = true;
      var data = new FormData(form);
      data.delete('day_pick');
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() })
        .then(function (r) { if (!r.ok) throw new Error(r.status); showThanks(sum); })
        .catch(function () { if (fail) fail.hidden = false; })
        .then(function () { btn.disabled = false; btn.innerHTML = btnText; });
    });

    /* "Book this service" and the special's button: pick the service, then the browser jumps to #book */
    d.addEventListener('click', function (e) {
      var a = e.target.closest('[data-book-service]');
      if (a) pickService(a.getAttribute('data-book-service'));
    });
    var q = /[?&]service=([^&#]+)/.exec(window.location.search);
    if (q) pickService(decodeURIComponent(q[1].replace(/\+/g, ' ')));
    if (/[?&]sent=1\b/.test(window.location.search)) showThanks(null);

    window.MTZ_pickService = pickService;
    window.MTZ_onLang = function () {
      if (window.MTZ_onPanelLang) window.MTZ_onPanelLang();
      buildDays(); syncWindows(); summary();
      if (thanks && !thanks.hidden && thanks._sum) { var s = summaryFromValues(thanks._sum); $('[data-thanks-sum]', thanks).textContent = s; }
    };
  }

  function summaryFromValues(v) {
    var s = $$('input[name="service"]', form).filter(function (x) { return x.value === v.service; })[0];
    var w = $$('input[name="window"]', form).filter(function (x) { return x.value === v.window; })[0];
    return ui().thanks(s ? labelOf(s) : v.service, longDay(v.day), w ? labelOf(w) : v.window);
  }
  function showThanks(sum) {
    if (!thanks) return;
    form.hidden = true;
    thanks.hidden = false;
    if (sum) {
      var p = $('input[name="day_pick"]:checked', form);
      thanks._sum = { service: $('input[name="service"]:checked', form).value, day: days[+p.getAttribute('data-i')], window: $('input[name="window"]:checked', form).value };
      $('[data-thanks-sum]', thanks).textContent = summaryFromValues(thanks._sum);
    } else { $('[data-thanks-sum]', thanks).hidden = true; }
    thanks.focus({ preventScroll: true });
    var top = thanks.closest('.mtz-book-card').getBoundingClientRect().top + window.scrollY - 110;
    if (Math.abs(window.scrollY - top) > 40) window.scrollTo({ top: top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  /* ---------- Learn more: a detail panel for each service (a centered modal on desktop, a bottom sheet on phones).
     Close with X, Esc, or a tap outside. Focus stays inside while it is open and goes back to the card after. ---------- */
  (function () {
    var dlg = $('[data-svc-panel]'); if (!dlg || typeof dlg.showModal !== 'function') return;
    var opener = null, current = null;
    var fill = function () {
      if (!current) return;
      var data = (window.MTZ_SERVICES || {})[current]; if (!data) return;
      var t = data[root.lang === 'es' ? 'es' : 'en'];
      var li = function (x) { return '<li><svg class="icon" aria-hidden="true"><use href="#i-check-circle"/></svg><span>' + x + '</span></li>'; };
      $('[data-panel-title]', dlg).textContent = t.name;
      $('[data-panel-desc]', dlg).textContent = t.desc;
      $('[data-panel-inc]', dlg).innerHTML = t.inc.map(li).join('');
      $('[data-panel-signs]', dlg).innerHTML = t.signs.map(li).join('');
      var img = $('[data-panel-img]', dlg);
      img.src = 'images/photos/mtz-' + current + '-960x720.webp'; img.alt = t.alt;
    };
    window.MTZ_onPanelLang = fill;
    d.addEventListener('click', function (e) {
      var b = e.target.closest('[data-learn]'); if (!b) return;
      e.preventDefault(); opener = b; current = b.getAttribute('data-learn'); fill();
      dlg.showModal(); dlg.querySelector('.mtz-panel-scroll').scrollTop = 0;
      $('[data-panel-close]', dlg).focus();
    });
    var close = function () { if (dlg.open) dlg.close(); };
    $('[data-panel-close]', dlg).addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); }); // tap on the dimmed backdrop
    dlg.addEventListener('close', function () { if (opener && !dlg._booking) opener.focus({ preventScroll: true }); dlg._booking = false; });
    /* Focus trap (dialog.showModal keeps focus in the page's top layer; this also wraps Tab at both ends) */
    dlg.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = $$('a[href], button:not([disabled])', dlg).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && d.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && d.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    $('[data-panel-book]', dlg).addEventListener('click', function (e) {
      e.preventDefault();
      var data = (window.MTZ_SERVICES || {})[current];
      dlg._booking = true; close();
      if (data && window.MTZ_pickService) window.MTZ_pickService(data.value);
      var book = $('#book'); var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (book) { window.scrollTo({ top: book.getBoundingClientRect().top + window.scrollY - 70, behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', '#book'); }
      var r = data && $$('input[name="service"]').filter(function (x) { return x.value === data.value; })[0];
      if (r) setTimeout(function () { r.focus({ preventScroll: true }); }, reduce ? 0 : 500);
    });
  })();

  /* ---------- How it works: the line draws as the section scrolls by; each card comes alive when the line reaches it ---------- */
  (function () {
    var sec = $('[data-how]'); if (!sec) return;
    var wrap = $('.mtz-steps-wrap', sec), cards = $$('[data-stepcard]', sec);
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) { wrap.style.setProperty('--draw', 1); cards.forEach(function (c) { c.classList.add('is-on'); }); return; }
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = wrap.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height * 0.9)));
      wrap.style.setProperty('--draw', p.toFixed(3));
      var n = cards.length;
      cards.forEach(function (c, i) { if (p >= (i / (n - 1)) * 0.92 + 0.02) c.classList.add('is-on'); });
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- Start: Spanish if the visitor picked it before (or ?lang=es) ---------- */
  var wanted = /[?&]lang=es\b/.test(window.location.search) ? 'es' : (/[?&]lang=en\b/.test(window.location.search) ? 'en' : store.get('mtz-lang'));
  if (wanted === 'es') applyLang('es', false); else root.classList.remove('lang-es-pending');
  /* site.js builds the review dots after this file runs; label them in the current language once it has */
  window.addEventListener('DOMContentLoaded', function () { setTimeout(function () { if (lang === 'es') applyLang('es', false); }, 0); });
})();
