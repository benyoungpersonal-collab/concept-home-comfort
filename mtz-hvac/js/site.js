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
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {  } }
  };
  var ROOT = (function () {
    var logo = $('.site-header .logo');
    return logo ? logo.getAttribute('href').replace(/index\.html$/, '') : '';
  })();
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
    window.matchMedia('(min-width: 1000px)').addEventListener('change', function (e) {
      if (e.matches && dlg.open) dlg.close();
    });
  }
  function initCountUp() {
    var els = $$('[data-count]');
    if (!els.length || reduced() || !('IntersectionObserver' in window)) return;
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
      if (r.top < window.innerHeight && r.bottom > 0) return;
      fmt(el, 0);
      io.observe(el);
    });
  }
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
      var cards = $$('li', track);
      var dots = null;
      if (cards.length > 1) {
        dots = d.createElement('div');
        dots.className = 'review-dots';
        dots.setAttribute('role', 'group');
        dots.setAttribute('aria-label', 'Choose a review');
        cards.forEach(function (c, i) {
          var b = d.createElement('button');
          b.type = 'button';
          b.setAttribute('aria-label', 'Review ' + (i + 1) + ' of ' + cards.length);
          b.addEventListener('click', function () { goTo(i); });
          dots.appendChild(b);
        });
        var hint = $('.swipe-hint', wrap);
        (hint || track).insertAdjacentElement(hint ? 'beforebegin' : 'afterend', dots);
      }
      var current = function () {
        var left = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).paddingLeft || 0);
        var best = 0, bestD = Infinity;
        cards.forEach(function (c, i) { var dd = Math.abs(c.getBoundingClientRect().left - left); if (dd < bestD) { bestD = dd; best = i; } });
        return best;
      };
      var goTo = function (i) {
        var c = cards[i]; if (!c) return;
        track.scrollTo({ left: c.getBoundingClientRect().left - cards[0].getBoundingClientRect().left, behavior: reduced() ? 'auto' : 'smooth' });
      };
      var markDots = function () {
        if (!dots) return;
        var cur = current();
        $$('button', dots).forEach(function (b, i) { if (i === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      };
      track.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(function () { update(); markDots(); }); }
      }, { passive: true });
      window.addEventListener('resize', update);
      update(); markDots();
      if (cards.length < 2 || reduced()) return;
      var paused = 0, visible = false, timer = null;
      var atEnd = function () { return track.scrollLeft + track.clientWidth > track.scrollWidth - 8; };
      var tick = function () {
        if (paused || !visible || d.hidden || reduced()) return;
        if (atEnd()) goTo(0); else go(1);
      };
      var restart = function () { clearInterval(timer); timer = setInterval(tick, 7000); };
      var hold = function (on) { paused = Math.max(0, paused + (on ? 1 : -1)); if (!paused) restart(); };
      wrap.addEventListener('mouseenter', function () { hold(true); });
      wrap.addEventListener('mouseleave', function () { hold(false); });
      wrap.addEventListener('focusin', function () { hold(true); });
      wrap.addEventListener('focusout', function (e) { if (!wrap.contains(e.relatedTarget)) hold(false); });
      var touchTimer = null;
      wrap.addEventListener('touchstart', function () { if (!touchTimer) hold(true); clearTimeout(touchTimer); touchTimer = 1; }, { passive: true });
      wrap.addEventListener('touchend', function () { clearTimeout(touchTimer); touchTimer = setTimeout(function () { touchTimer = null; hold(false); }, 4000); }, { passive: true });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) restart(); }, { threshold: 0.35 }).observe(track);
      } else visible = true;
      restart();
    });
  }
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
  function initAccentFit() {
    var accents = $$('h1 .accent, h2 .accent, h3 .accent, .h1 .accent, .hero-h .accent');
    if (!accents.length) return;
    var fit = function () {
      accents.forEach(function (a) {
        a.classList.toggle('accent-wrap', false);
        var room = Infinity;
        for (var h = a.parentElement; h && h !== d.body; h = h.parentElement) {
          var cs = getComputedStyle(h);
          if (cs.display === 'inline') continue;
          room = Math.min(room, h.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
        }
        if (a.getBoundingClientRect().width > room + 1) a.classList.toggle('accent-wrap', true);
      });
    };
    fit();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(fit);
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 120); });
  }
  function initStickyBar() {
    var bar = $('.sticky-bar');
    var triggers = $$('[data-hide-bar]');
    if (!bar || !triggers.length || !('IntersectionObserver' in window)) return;
    var onScreen = new Set();
    var update = function () { bar.classList.toggle('is-waiting', onScreen.size > 0); };
    bar.classList.add('is-waiting');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) onScreen.add(e.target); else onScreen.delete(e.target); });
      update();
    });
    triggers.forEach(function (t) { io.observe(t); });
  }
  initHeader();
  initPanels();
  initMobileMenu();
  initCountUp();
  initCarousels();
  initAccordions();
  initAccentFit();
  initStickyBar();
})();
