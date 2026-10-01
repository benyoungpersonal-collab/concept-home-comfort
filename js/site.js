/* Pinwheel Heating, Air & Plumbing (concept)
   Concept site by Ben Young Web Design. Sample data.
   Vanilla JS, no dependencies. Every feature starts only if its markup is on the page.
   Nothing here sends data anywhere. Forms and booking show a demo confirmation. */
(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return motionQuery.matches; };
  var $ = function (sel, el) { return (el || d).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || d).querySelectorAll(sel)); };
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage blocked: fine */ } }
  };
  // Relative path back to the site root, read from the logo link (works in /service-areas/ too)
  var ROOT = (function () {
    var logo = $('.site-header .logo');
    return logo ? logo.getAttribute('href').replace(/index\.html$/, '') : '';
  })();
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------- Offer bar ---------- */
  function initOfferBar() {
    var btn = $('[data-offer-close]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      root.classList.add('offer-off');
      store.set('pw-offer-dismissed', 'fall-2026');
      var logo = $('.site-header .logo');
      if (logo) logo.focus();
    });
  }

  /* ---------- Header: compact after scrolling ---------- */
  function initHeader() {
    var header = $('[data-header]');
    var sentinel = $('[data-header-sentinel]');
    if (!header || !sentinel || !('IntersectionObserver' in window)) { root.classList.add('is-scrolled'); return; }
    sentinel.style.top = '320px';
    new IntersectionObserver(function (entries) {
      var scrolled = !entries[0].isIntersecting;
      header.classList.toggle('is-compact', scrolled);
      root.classList.toggle('is-scrolled', scrolled);
    }).observe(sentinel);
  }

  /* ---------- Desktop dropdown panels (disclosure pattern) ---------- */
  function initPanels() {
    var toggles = $$('[data-panel-toggle]');
    if (!toggles.length) return;
    var setOpen = function (btn, open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var panel = d.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.hidden = !open;
    };
    var closeAll = function (except) {
      toggles.forEach(function (t) { if (t !== except) setOpen(t, false); });
    };
    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') !== 'true';
        closeAll(btn);
        setOpen(btn, open);
      });
      var li = btn.closest('li');
      li.addEventListener('focusout', function (e) {
        if (!li.contains(e.relatedTarget)) setOpen(btn, false);
      });
    });
    d.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-list > li')) closeAll();
    });
    d.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      toggles.forEach(function (t) {
        if (t.getAttribute('aria-expanded') === 'true') { setOpen(t, false); t.focus(); }
      });
    });
  }

  /* ---------- Mobile menu (native dialog) ---------- */
  function initMobileMenu() {
    var dlg = $('#mobile-menu');
    var openBtn = $('[data-menu-open]');
    if (!dlg || !openBtn || typeof dlg.showModal !== 'function') return;
    openBtn.addEventListener('click', function () {
      dlg.showModal();
      openBtn.setAttribute('aria-expanded', 'true');
    });
    $('[data-menu-close]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('close', function () { openBtn.setAttribute('aria-expanded', 'false'); });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('a')) dlg.close();
    });
    // Close the menu if the screen grows into the desktop layout
    window.matchMedia('(min-width: 1000px)').addEventListener('change', function (e) {
      if (e.matches && dlg.open) dlg.close();
    });
  }

  /* ---------- Count-up numbers ---------- */
  function initCountUp() {
    var els = $$('[data-count]');
    if (!els.length || reduced() || !('IntersectionObserver' in window)) return; // final values are already in the HTML
    var fmt = function (el, v) {
      var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
      el.textContent = Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target;
        var end = parseFloat(el.getAttribute('data-count'));
        var start = performance.now();
        var dur = 1400;
        var tick = function (now) {
          var p = Math.min(1, (now - start) / dur);
          fmt(el, end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick); else fmt(el, end);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) return; // already on screen: leave the final number
      fmt(el, 0);
      io.observe(el);
    });
  }

  /* ---------- Review carousel buttons ---------- */
  function initCarousels() {
    $$('[data-carousel]').forEach(function (wrap) {
      var track = $('[data-track]', wrap);
      var prev = $('[data-prev]', wrap);
      var next = $('[data-next]', wrap);
      if (!track || !prev || !next) return;
      var step = function () {
        var card = $('li', track);
        return card ? card.getBoundingClientRect().width + 16 : 320;
      };
      var go = function (dir) { track.scrollBy({ left: dir * step(), behavior: reduced() ? 'auto' : 'smooth' }); };
      prev.addEventListener('click', function () { go(-1); });
      next.addEventListener('click', function () { go(1); });
      var ticking = false;
      var update = function () {
        ticking = false;
        prev.disabled = track.scrollLeft < 8;
        next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
      };
      track.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  }

  /* ---------- Accordion (WAI-ARIA pattern) ---------- */
  function initAccordions() {
    $$('[data-accordion]').forEach(function (acc) {
      var openFirst = acc.hasAttribute('data-first-open');
      $$('.acc-trigger', acc).forEach(function (btn, i) {
        var panel = d.getElementById(btn.getAttribute('aria-controls'));
        if (!panel) return;
        var set = function (open) {
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          panel.classList.toggle('is-open', open);
        };
        set(openFirst && i === 0);
        btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
      });
    });
  }

  /* ---------- Instant price estimator (sample pricing) ---------- */
  function initEstimator() {
    var form = $('[data-estimator]');
    if (!form) return;
    var card = $('[data-est-card]');
    var empty = $('[data-est-empty]', card);
    var out = $('[data-est-output]', card);
    var err = $('[data-est-error]', form);
    var BASE = { ac: [6800, 9200], furnace: [4900, 7200], combo: [11200, 15600], heatpump: [12400, 17800] };
    var SIZE = { s: 0.85, m: 1, l: 1.2, xl: 1.45 };
    var AGE = { young: 0, mid: 0, old: 600, unsure: 300 };
    var SYS_LABEL = { ac: 'New AC', furnace: 'New furnace', combo: 'New AC and furnace', heatpump: 'New heat pump' };
    var SIZE_LABEL = { s: 'under 1,500 sq ft', m: '1,500 to 2,500 sq ft', l: '2,500 to 3,500 sq ft', xl: 'over 3,500 sq ft' };
    var MIN = 3500, MAX = 27500;
    var shown = false;
    var round = function (n) { return Math.round(n / 100) * 100; };

    var compute = function (scroll) {
      var size = (form.querySelector('input[name="size"]:checked') || {}).value;
      var sys = (form.querySelector('input[name="system"]:checked') || {}).value;
      var age = (form.querySelector('input[name="age"]:checked') || {}).value;
      if (!size || !sys || !age) {
        err.hidden = false;
        var firstMissing = !size ? 'size' : !sys ? 'system' : 'age';
        var target = form.querySelector('input[name="' + firstMissing + '"]');
        if (target) target.focus();
        return;
      }
      err.hidden = true;
      var low = round(BASE[sys][0] * SIZE[size] + AGE[age]);
      var high = round(BASE[sys][1] * SIZE[size] + AGE[age]);
      $('[data-est-low]', card).textContent = money(low);
      $('[data-est-high]', card).textContent = money(high);
      $('[data-est-for]', card).textContent = SYS_LABEL[sys] + ' for a home ' + SIZE_LABEL[size];
      var bar = $('[data-est-bar]', card);
      bar.style.left = ((low - MIN) / (MAX - MIN) * 100) + '%';
      bar.style.width = ((high - low) / (MAX - MIN) * 100) + '%';
      $('[data-est-young]', card).hidden = age !== 'young';
      empty.hidden = true;
      out.hidden = false;
      shown = true;
      if (scroll && window.innerWidth < 900) card.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    };
    form.addEventListener('submit', function (e) { e.preventDefault(); compute(true); });
    form.addEventListener('change', function () { if (shown) compute(false); });
  }

  /* ---------- Financing calculator (example APR) ---------- */
  function initFinance() {
    $$('[data-finance]').forEach(function (form) {
      var amount = $('[data-amount]', form);
      var amountOut = $('[data-amount-out]', form);
      var pay = $('[data-payment]', form);
      var termOut = $('[data-term-out]', form);
      var apr = parseFloat(form.getAttribute('data-apr') || '7.99');
      var calc = function () {
        var P = parseFloat(amount.value);
        var checked = form.querySelector('input[name="term"]:checked');
        var n = checked ? parseInt(checked.value, 10) : 120;
        var r = apr / 100 / 12;
        var m = P * r / (1 - Math.pow(1 + r, -n));
        var min = parseFloat(amount.min), max = parseFloat(amount.max);
        amountOut.textContent = money(P);
        amount.setAttribute('aria-valuetext', money(P));
        amount.style.setProperty('--fill', ((P - min) / (max - min) * 100) + '%');
        pay.textContent = money(m);
        if (termOut) termOut.textContent = n;
      };
      form.addEventListener('input', calc);
      form.addEventListener('change', calc);
      form.addEventListener('submit', function (e) { e.preventDefault(); });
      calc();
    });
  }

  /* ---------- Booking demo (native dialog, 3 steps) ---------- */
  function initBooking() {
    var dlg = $('#book');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var form = $('[data-booking]', dlg);
    var steps = $$('[data-step]', form);
    var stepper = $$('[data-steps] li', dlg);
    var btnBack = $('[data-back]', form);
    var btnNext = $('[data-next]', form);
    var btnSubmit = $('[data-submit]', form);
    var btnDone = $('[data-done]', form);
    var done = $('[data-booking-done]', form);
    var title = $('#booking-title', dlg);
    var current = 1;
    var lastTrigger = null;

    var buildDays = function () {
      var wrap = $('[data-days]', form);
      wrap.innerHTML = '';
      var now = new Date();
      var days = [];
      for (var i = 0; days.length < 8 && i < 14; i++) {
        var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        if (day.getDay() === 0) continue; // Sunday: emergency calls only
        if (i === 0 && now.getHours() >= 16) continue; // too late for today
        days.push({ date: day, offset: i });
      }
      days.forEach(function (item) {
        var dt = item.date;
        var name = item.offset === 0 ? 'Today' : item.offset === 1 ? 'Tomorrow' : DAY_NAMES[dt.getDay()];
        var value = LONG_DAYS[dt.getDay()] + ', ' + MONTHS[dt.getMonth()] + ' ' + dt.getDate();
        var label = d.createElement('label');
        label.className = 'chip day-chip';
        label.innerHTML = '<input type="radio" name="day" value="' + value + '" data-today="' + (item.offset === 0) + '"><span><b>' + name + '</b><small>' + MONTHS[dt.getMonth()] + ' ' + dt.getDate() + '</small></span>';
        wrap.appendChild(label);
      });
    };

    var syncWindows = function () {
      var day = form.querySelector('input[name="day"]:checked');
      var isToday = day && day.getAttribute('data-today') === 'true';
      var hour = new Date().getHours();
      $$('input[name="window"]', form).forEach(function (w) {
        var tooLate = isToday && parseInt(w.getAttribute('data-start'), 10) <= hour + 1;
        w.disabled = tooLate;
        if (tooLate && w.checked) w.checked = false;
      });
    };

    var showStep = function (n) {
      current = n;
      steps.forEach(function (s) { s.hidden = parseInt(s.getAttribute('data-step'), 10) !== n; });
      stepper.forEach(function (li, i) {
        li.classList.toggle('is-active', i === n - 1);
        li.classList.toggle('is-done', i < n - 1);
        if (i === n - 1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      });
      btnBack.hidden = n === 1;
      btnNext.hidden = n === 3;
      btnSubmit.hidden = n !== 3;
      btnDone.hidden = true;
      done.hidden = true;
      $$('[data-error]', form).forEach(function (e) { e.hidden = true; });
    };

    var valid = function (n) {
      var step = steps[n - 1];
      var ok = true;
      if (n === 1) ok = !!form.querySelector('input[name="service"]:checked');
      if (n === 2) ok = !!form.querySelector('input[name="day"]:checked') && !!form.querySelector('input[name="window"]:checked');
      if (n === 3) {
        ['bk-name', 'bk-phone', 'bk-city'].forEach(function (id) {
          var f = d.getElementById(id);
          var good = f.value.trim().length > (id === 'bk-phone' ? 6 : 0);
          f.setAttribute('aria-invalid', good ? 'false' : 'true');
          if (!good) ok = false;
        });
      }
      var err = $('[data-error]', step);
      if (err) err.hidden = ok;
      if (!ok) {
        var first = step.querySelector('[aria-invalid="true"], input:not(:disabled)');
        if (first) first.focus();
      }
      return ok;
    };

    var open = function (service, trigger) {
      lastTrigger = trigger || null;
      form.reset();
      $$('[aria-invalid]', form).forEach(function (f) { f.removeAttribute('aria-invalid'); });
      buildDays();
      syncWindows();
      var start = 1;
      if (service) {
        var match = form.querySelector('input[name="service"][value="' + service + '"]');
        if (match) { match.checked = true; start = 2; }
      }
      showStep(start);
      if (!dlg.open) dlg.showModal();
      title.focus();
    };

    var close = function () { if (dlg.open) dlg.close(); };

    btnNext.addEventListener('click', function () {
      if (valid(current)) { showStep(current + 1); title.focus(); }
    });
    btnBack.addEventListener('click', function () { showStep(Math.max(1, current - 1)); title.focus(); });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'day') syncWindows();
      if (e.target.name === 'service' || e.target.name === 'window' || e.target.name === 'day') {
        var err = $('[data-error]', steps[current - 1]);
        if (err) err.hidden = true;
      }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid(3)) return;
      var get = function (name) {
        var el = form.querySelector('[name="' + name + '"]:checked') || form.querySelector('[name="' + name + '"]');
        return el ? el.value.trim() : '';
      };
      var rows = [
        ['Service', get('service')],
        ['Day', get('day')],
        ['Arrival', get('window')],
        ['Name', get('name')],
        ['City', get('city')]
      ];
      var list = $('[data-summary]', form);
      list.innerHTML = '';
      rows.forEach(function (r) {
        var li = d.createElement('li');
        var a = d.createElement('span'); a.textContent = r[0];
        var b = d.createElement('span'); b.textContent = r[1];
        li.appendChild(a); li.appendChild(b);
        list.appendChild(li);
      });
      steps.forEach(function (s) { s.hidden = true; });
      stepper.forEach(function (li) { li.classList.remove('is-active'); li.classList.add('is-done'); li.removeAttribute('aria-current'); });
      btnBack.hidden = true; btnNext.hidden = true; btnSubmit.hidden = true;
      btnDone.hidden = false;
      done.hidden = false;
      done.focus();
    });
    btnDone.addEventListener('click', close);
    $('[data-booking-close]', dlg).addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('close', function () {
      if (location.hash === '#book' && window.history.replaceState) window.history.replaceState(null, '', location.pathname + location.search);
      if (lastTrigger && d.contains(lastTrigger) && lastTrigger.offsetParent !== null) lastTrigger.focus();
    });

    d.addEventListener('click', function (e) {
      var t = e.target.closest('[data-book]');
      if (!t) return;
      e.preventDefault();
      open(t.getAttribute('data-service'), t);
    });
    var fromHash = function () { if (location.hash === '#book') open(); };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  /* ---------- Generic demo forms ---------- */
  function initDemoForms() {
    $$('[data-demo-form]').forEach(function (form) {
      var doneEl = d.getElementById(form.getAttribute('data-demo-form'));
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var bad = null;
        $$('[required]', form).forEach(function (f) {
          var ok = f.type === 'radio' ? !!form.querySelector('input[name="' + f.name + '"]:checked') : f.value.trim() !== '';
          if (f.type !== 'radio') f.setAttribute('aria-invalid', ok ? 'false' : 'true');
          if (!ok && !bad) bad = f;
        });
        var err = $('[data-error]', form);
        if (bad) { if (err) err.hidden = false; bad.focus(); return; }
        if (err) err.hidden = true;
        var summary = doneEl && $('[data-summary]', doneEl);
        if (summary) {
          var plan = form.querySelector('input[name="plan"]:checked');
          var name = form.querySelector('[name="name"]');
          summary.textContent = (name ? name.value.trim() + ', ' : '') + (plan ? 'you picked ' + plan.value + '.' : 'your request is in.');
        }
        form.hidden = true;
        if (doneEl) { doneEl.hidden = false; doneEl.focus(); }
      });
    });
  }

  /* ---------- Repair or replace helper ---------- */
  function initHelper() {
    var form = $('[data-helper]');
    if (!form) return;
    var result = $('[data-helper-result]');
    var err = $('[data-error]', form);
    var SCORES = { age: [0, 1, 2, 3], quote: [0, 1, 2, 3], comfort: [0, 1, 2, 2], bills: [0, 1, 2] };
    var VERDICTS = {
      repair: {
        label: 'Our take',
        title: 'Repair it. Your system has good years left.',
        text: 'A repair is the smart money move right now. We will fix it, check the rest of the system, and tell you honestly how many years you can expect.'
      },
      plan: {
        label: 'Our take',
        title: 'Repair for now, and start planning.',
        text: 'A repair makes sense today, but your system is getting close. Ask for a free replacement quote so you can pick a new system on your schedule, not in a heat wave.'
      },
      replace: {
        label: 'Our take',
        title: 'Replacing will likely save you money.',
        text: 'Between the age, the repair cost, and your bills, a new system will probably cost less over the next five years. A free in-home quote shows your real numbers, with no pressure.'
      }
    };
    var compute = function () {
      var total = 0;
      var missing = null;
      Object.keys(SCORES).forEach(function (k) {
        var c = form.querySelector('input[name="' + k + '"]:checked');
        if (!c) { if (!missing) missing = k; return; }
        total += SCORES[k][parseInt(c.value, 10)];
      });
      if (missing) {
        err.hidden = false;
        form.querySelector('input[name="' + missing + '"]').focus();
        return false;
      }
      err.hidden = true;
      var age = parseInt(form.querySelector('input[name="age"]:checked').value, 10);
      var quote = parseInt(form.querySelector('input[name="quote"]:checked').value, 10);
      var key = total <= 3 ? 'repair' : total <= 6 ? 'plan' : 'replace';
      if (age === 3 && quote >= 2) key = 'replace';          // 18+ years and a big repair
      if (age <= 1 && quote === 0 && key === 'replace') key = 'plan'; // young system, small fix
      var v = VERDICTS[key];
      result.setAttribute('data-verdict', key);
      $('[data-verdict-title]', result).textContent = v.title;
      $('[data-verdict-text]', result).textContent = v.text;
      $('[data-score-dot]', result).style.left = Math.min(100, total / 10 * 100) + '%';
      $('[data-helper-empty]', result).hidden = true;
      $('[data-helper-output]', result).hidden = false;
      $('[data-helper-cta]', result).setAttribute('data-service', key === 'repair' ? 'AC repair' : 'New system quote');
      $('[data-helper-cta]', result).lastChild.textContent = key === 'repair' ? 'Book a repair visit' : 'Book a free in-home quote';
      return true;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (compute() && window.innerWidth < 900) result.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    });
    form.addEventListener('change', function () {
      if (!$('[data-helper-output]', result).hidden) compute();
    });
  }

  /* ---------- Demo assistant (scripted, no API calls) ---------- */
  function initChat() {
    var wrap = $('[data-chat]');
    if (!wrap) return;
    var toggle = $('[data-chat-toggle]', wrap);
    var panel = $('#chat-panel');
    var log = $('[data-chat-log]', wrap);
    var suggest = $('[data-chat-suggest]', wrap);
    var form = $('[data-chat-form]', wrap);
    var input = $('#chat-input');
    var started = false;
    var BOOK = ['Book online', '#book'];
    var CALL = ['Call now', 'tel:+12095550142'];
    var KB = [
      { q: 'Do you serve Mountain House?', keys: ['mountain house', 'mountain', 'mh '],
        a: 'Yes. Mountain House is one of our busiest areas, from Wicklund to The Lakes. Most calls there get a same-day visit.',
        actions: [['Mountain House page', ROOT + 'service-areas/mountain-house.html'], BOOK] },
      { q: 'Should I repair or replace a 15-year-old AC?', keys: ['repair or replace', 'replace', 'replacement', '15', 'year old', 'years old', 'old ac', 'worth fixing', 'new system', 'new ac'],
        a: 'At 15 years it depends on the repair. If the fix costs more than about a third of a new system, or your bills keep climbing, replacing usually saves money. Our 4-question helper gives you a straight answer.',
        actions: [['Try the helper', ROOT + 'heating-cooling.html#repair-or-replace'], ['Free replacement quote', '#book', 'New system quote']] },
      { q: 'Can you come today?', keys: ['today', 'same day', 'same-day', 'asap', 'right now', 'emergency', 'urgent', 'tonight', 'soon', 'available'],
        a: 'Most days, yes. Call for the fastest answer, or book online and we will text to confirm your arrival window.',
        actions: [CALL, BOOK] },
      { q: 'How much is a service call?', keys: ['how much', 'cost', 'price', 'fee', 'charge', 'trip', 'diagnostic', 'service call', 'expensive', 'estimate', 'quote'],
        a: 'Our diagnostic visit is $79 (sample pricing), and we waive it when you go ahead with the repair. You approve the full price before we start. Comfort Club members never pay a trip fee.',
        actions: [BOOK] },
      { q: 'Do you offer financing?', keys: ['financ', 'payment', 'monthly', 'credit', 'loan', 'afford', 'apr'],
        a: 'Yes. Monthly payment plans are available on new systems, water heaters, and repipes. The calculator shows an example payment in a few seconds.',
        actions: [['Payment calculator', ROOT + 'financing.html#calculator']] },
      { q: 'My water heater is leaking', keys: ['water heater', 'leak', 'leaking', 'hot water', 'burst', 'flood', 'tank', 'pipe'],
        a: 'Turn off the cold water valve on top of the tank, and the gas or power to the heater. For a bigger leak, shut off your main water valve. Then call us. Most water heaters are replaced the same day.',
        actions: [CALL, ['Book a plumber', '#book', 'Water heater']] },
      { q: 'What is the Comfort Club?', keys: ['comfort club', 'club', 'member', 'membership', 'plan', 'tune-up', 'tune up', 'maintenance'],
        a: 'It is our membership: 2 tune-ups a year, priority service, no trip fees, and 15% off repairs for $19 a month (sample pricing). Cancel anytime.',
        actions: [['See the Comfort Club', ROOT + 'membership.html']] },
      { q: 'What are your hours?', keys: ['hour', 'open', 'closed', 'weekend', 'sunday', 'saturday', 'when'],
        a: 'Monday to Saturday, 7am to 7pm. Our emergency line answers 24/7, including Sundays.',
        actions: [CALL] },
      { q: 'Are you licensed and insured?', keys: ['licens', 'insur', 'bonded', 'cslb', 'legit', 'certified'],
        a: 'Yes. California license CSLB #000000 (a placeholder on this concept), bonded, with full liability and workers comp coverage.',
        actions: [['About us', ROOT + 'about.html']] },
      { q: 'What areas do you serve?', keys: ['area', 'serve', 'service area', 'city', 'cities', 'tracy', 'manteca', 'lathrop', 'stockton', 'livermore', 'where', 'near me'],
        a: 'Tracy, Mountain House, Manteca, Lathrop, Stockton, and Livermore. Just outside those cities? Call and ask. If we can get there fast, we will come.',
        actions: [['See the map', ROOT + 'index.html#areas'], CALL] }
    ];
    var SUGGESTED = [0, 1, 2, 3, 5, 6, 4, 7];

    var scrollDown = function () { log.scrollTop = log.scrollHeight; };
    var addMsg = function (who, text, actions) {
      var el = d.createElement('div');
      el.className = 'msg msg-' + who;
      var p = d.createElement('p');
      p.textContent = text;
      el.appendChild(p);
      if (actions && actions.length) {
        var row = d.createElement('div');
        row.className = 'msg-actions';
        actions.forEach(function (a, i) {
          var link = d.createElement('a');
          link.className = 'btn btn-sm ' + (i === 0 ? 'btn-primary' : 'btn-secondary');
          link.href = a[1];
          link.textContent = a[0];
          if (a[1] === '#book') { link.setAttribute('data-book', ''); if (a[2]) link.setAttribute('data-service', a[2]); }
          row.appendChild(link);
        });
        el.appendChild(row);
      }
      log.appendChild(el);
      scrollDown();
    };
    var botReply = function (entry) {
      var typing = d.createElement('div');
      typing.className = 'msg msg-bot typing';
      typing.setAttribute('aria-hidden', 'true');
      typing.innerHTML = '<span></span><span></span><span></span>';
      log.appendChild(typing);
      scrollDown();
      window.setTimeout(function () {
        typing.remove();
        if (entry) addMsg('bot', entry.a, entry.actions);
        else addMsg('bot', 'Good question. A real person can answer that fast. Call or text, or book a visit and ask the tech.', [CALL, ['Text us', 'sms:+12095550142'], BOOK]);
      }, reduced() ? 150 : 650);
    };
    var match = function (text) {
      var t = ' ' + text.toLowerCase().replace(/[^a-z0-9%$\- ]/g, ' ') + ' ';
      var best = null, bestScore = 0;
      KB.forEach(function (entry) {
        var score = 0;
        entry.keys.forEach(function (k) { if (t.indexOf(k) !== -1) score += k.length; });
        if (score > bestScore) { best = entry; bestScore = score; }
      });
      return best;
    };
    var ask = function (text) {
      if (!text) return;
      addMsg('user', text);
      botReply(match(text));
    };
    var start = function () {
      if (started) return;
      started = true;
      addMsg('bot', 'Hi, I am the Pinwheel Helper. This is a demo with scripted answers. Tap a question or type your own.');
      SUGGESTED.forEach(function (i) {
        var b = d.createElement('button');
        b.type = 'button';
        b.textContent = KB[i].q;
        b.addEventListener('click', function () { ask(KB[i].q); });
        suggest.appendChild(b);
      });
    };
    var setOpen = function (open) {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { start(); input.focus(); } else { toggle.focus(); }
    };
    toggle.addEventListener('click', function () { setOpen(panel.hidden); });
    $('[data-chat-close]', wrap).addEventListener('click', function () { setOpen(false); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      input.value = '';
      ask(text);
    });
    log.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && a.getAttribute('href') !== '#book' && !/^tel:|^sms:/.test(a.getAttribute('href'))) panel.hidden = true;
    });
  }

  /* ---------- "Next opening" chip in the hero (demo schedule) ---------- */
  function initNextOpening() {
    var el = $('[data-next-opening]');
    if (!el) return;
    var now = new Date();
    var h = now.getHours();
    var sunday = now.getDay() === 0;
    var text;
    if (!sunday && h < 12) text = 'today, 2 to 5pm';
    else if (!sunday && h < 15) text = 'today, 5 to 7pm';
    else {
      var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      if (next.getDay() === 0) next.setDate(next.getDate() + 1);
      var isTomorrow = next.getDate() === new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getDate();
      text = (isTomorrow ? 'tomorrow' : LONG_DAYS[next.getDay()]) + ', 8 to 11am';
    }
    el.textContent = text;
  }

  /* ---------- QR code for the review page (vendored MIT library) ---------- */
  function initQR() {
    var box = $('[data-qr]');
    if (!box || typeof window.qrcode !== 'function') return;
    var url = window.location.href.split('#')[0];
    var qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    var n = qr.getModuleCount();
    var quiet = 4;
    var size = n + quiet * 2;
    var path = '';
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) path += 'M' + (c + quiet) + ' ' + (r + quiet) + 'h1v1h-1z';
      }
    }
    box.innerHTML = '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="QR code that opens this review page" shape-rendering="crispEdges"><rect width="' + size + '" height="' + size + '" fill="#fff"/><path d="' + path + '" fill="#14213D"/></svg>';
    var out = $('[data-qr-url]');
    if (out) out.textContent = url;
  }


  /* ---------- Chart tooltips (hover and keyboard focus; values also in the table view) ---------- */
  function initTooltips() {
    var marks = $$('[data-tip-value]');
    if (!marks.length) return;
    var tip = d.createElement('div');
    tip.className = 'viz-tip';
    tip.setAttribute('aria-hidden', 'true');
    var v = d.createElement('b');
    var l = d.createElement('span');
    tip.appendChild(v); tip.appendChild(l);
    d.body.appendChild(tip);
    var show = function (el) {
      v.textContent = el.getAttribute('data-tip-value');
      l.textContent = el.getAttribute('data-tip-label') || '';
      var r = el.getBoundingClientRect();
      var x = Math.min(window.innerWidth - 90, Math.max(90, r.left + r.width / 2));
      tip.style.left = x + 'px';
      tip.style.top = Math.max(56, r.top) + 'px';
      tip.classList.add('is-on');
    };
    var hide = function () { tip.classList.remove('is-on'); };
    marks.forEach(function (el) {
      el.addEventListener('pointerenter', function () { show(el); });
      el.addEventListener('pointerleave', hide);
      el.addEventListener('focus', function () { show(el); });
      el.addEventListener('blur', hide);
    });
    window.addEventListener('scroll', hide, { passive: true });
  }

  /* ---------- Small helpers: print button, demo-only links, plan picker ---------- */
  function initHelpers() {
    $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });
    $$('[data-demo-link]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var note = $('[data-demo-link-note]');
        if (note) note.hidden = false;
      });
    });
    $$('[data-plan-pick]').forEach(function (a) {
      a.addEventListener('click', function () {
        var radio = $('input[name="plan"][value="' + a.getAttribute('data-plan-pick') + '"]');
        if (radio) radio.checked = true;
      });
    });
  }

  /* ---------- Hero video (off until data-hero-video names a clip, e.g. "video/hero") ----------
     Loads after the page, muted loop, pauses off screen, never plays for reduced motion or Save-Data.
     Add data-video-desktop-only to keep phones on the poster photo. */
  function initHeroVideo() {
    var frame = $('[data-hero-video]');
    if (!frame) return;
    var base = frame.getAttribute('data-hero-video');
    if (!base || reduced() || !('IntersectionObserver' in window)) return;
    var conn = navigator.connection;
    if (conn && conn.saveData) return;
    if (frame.hasAttribute('data-video-desktop-only') && !window.matchMedia('(min-width: 900px)').matches) return;
    var img = $('img', frame);
    var start = function () {
      var v = d.createElement('video');
      v.className = 'hero-video';
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
      if (img) v.poster = img.currentSrc || img.src;
      [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(function (t) {
        var src = d.createElement('source'); src.src = base + '.' + t[0]; src.type = t[1]; v.appendChild(src);
      });
      v.addEventListener('playing', function () { v.classList.add('is-playing'); });
      frame.appendChild(v);
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else { v.pause(); }
        });
      }, { threshold: 0.2 });
      io.observe(v);
      if (motionQuery.addEventListener) motionQuery.addEventListener('change', function () { if (reduced()) { io.disconnect(); v.pause(); v.remove(); } });
    };
    var later = function () { setTimeout(start, 800); };
    if (d.readyState === 'complete') later(); else window.addEventListener('load', later);
  }

  initOfferBar();
  initHeader();
  initPanels();
  initMobileMenu();
  initCountUp();
  initCarousels();
  initAccordions();
  initEstimator();
  initFinance();
  initBooking();
  initDemoForms();
  initHelper();
  initChat();
  initNextOpening();
  initQR();
  initTooltips();
  initHelpers();
  initHeroVideo();
})();
