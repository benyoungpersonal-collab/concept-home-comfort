/* Sonny's Air Conditioning (preview): logo intro, menus, scroll motion, count-up stats, phone call bar.
   No dependencies. The inline script in <head> adds .js and .lg-wait, with failsafes. */
(function () {
  'use strict';
  window.__sac = true;
  var html = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- logo intro: every page load, after first paint and fonts; replays on hover ----------
  var lg = document.querySelector('.site-header .lg');
  var playing = false;
  function playLogo() {
    if (!lg) { html.classList.remove('lg-wait'); return; }
    lg.classList.remove('lg-play', 'lg-soft');
    void lg.getBoundingClientRect();
    if (reduce) lg.classList.add('lg-soft');
    lg.classList.add('lg-play');
    html.classList.remove('lg-wait');
    playing = true;
  }
  if (lg) {
    lg.addEventListener('animationend', function (e) {
      if (e.target.classList && e.target.classList.contains('lg-wind')) { playing = false; lg.classList.remove('lg-play', 'lg-soft'); }
    });
    var brand = lg.closest('.brand');
    if (brand && canHover) brand.addEventListener('mouseenter', function () { if (!playing) playLogo(); });
  }
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 2500); })]).then(function () {
    requestAnimationFrame(function () { requestAnimationFrame(playLogo); });
  });

  // ---------- phone menu ----------
  var menu = document.querySelector('[data-menu]');
  var openBtn = document.querySelector('[data-menu-open]');
  if (menu && openBtn && menu.showModal) {
    openBtn.addEventListener('click', function () { menu.showModal(); openBtn.setAttribute('aria-expanded', 'true'); });
    menu.addEventListener('close', function () { openBtn.setAttribute('aria-expanded', 'false'); });
    menu.querySelectorAll('[data-menu-close], a').forEach(function (el) { el.addEventListener('click', function () { menu.close(); }); });
    menu.addEventListener('click', function (e) { if (e.target === menu) menu.close(); });
  }

  // ---------- Services dropdown: hover, click, keyboard, touch ----------
  document.querySelectorAll('.nav-dd').forEach(function (dd) {
    var btn = dd.querySelector('button'), list = dd.querySelector('.nav-dd-menu');
    var links = Array.prototype.slice.call(list.querySelectorAll('a'));
    var byHover = false, timer;
    function set(v) { dd.classList.toggle('open', v); btn.setAttribute('aria-expanded', v ? 'true' : 'false'); if (!v) byHover = false; }
    btn.addEventListener('click', function () { var isOpen = dd.classList.contains('open'); if (!isOpen || byHover) { set(true); byHover = false; } else set(false); });
    if (canHover) {
      dd.addEventListener('mouseenter', function () { clearTimeout(timer); if (!dd.classList.contains('open')) { set(true); byHover = true; } });
      dd.addEventListener('mouseleave', function () { if (byHover) timer = setTimeout(function () { set(false); }, 200); });
    }
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); set(true); links[0].focus(); }
      if (e.key === 'Escape') set(false);
    });
    list.addEventListener('keydown', function (e) {
      var i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (i <= 0) btn.focus(); else links[i - 1].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); links[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); links[links.length - 1].focus(); }
      else if (e.key === 'Escape') { set(false); btn.focus(); }
    });
    dd.addEventListener('focusout', function (e) { if (!dd.contains(e.relatedTarget)) set(false); });
    // pointerdown, not click: Safari on iPhone and iPad only fires click on tappable elements.
    document.addEventListener('pointerdown', function (e) { if (!dd.contains(e.target)) set(false); });
    links.forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  });

  // ---------- photos: start loading well before they scroll in ----------
  var lazy = document.querySelectorAll('img[loading="lazy"]');
  if ('IntersectionObserver' in window) {
    var pre = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.loading = 'eager'; pre.unobserve(en.target); } });
    }, { rootMargin: '0px 0px 1200px 0px' });
    lazy.forEach(function (img) { pre.observe(img); });
  }
  function whenLoaded(el, cb) {
    var img = el.tagName === 'IMG' ? el : el.querySelector('img');
    if (!img || (img.complete && img.naturalWidth)) return cb();
    var done = false;
    function go() { if (!done) { done = true; cb(); } }
    img.loading = 'eager';
    img.addEventListener('load', go, { once: true });
    img.addEventListener('error', go, { once: true });
    setTimeout(go, 3000);
  }

  // ---------- motion: images slide in from their side, text fades up; once each ----------
  var vw = document.documentElement.clientWidth;
  document.querySelectorAll('.rv-side').forEach(function (el) {
    var r = el.getBoundingClientRect(), off = ((r.left + r.right) / 2 - vw / 2) / vw;
    if (Math.abs(off) < 0.08 || r.width > vw * 0.8) el.setAttribute('data-from', '0');
    else el.style.setProperty('--from', off < 0 ? '-44px' : '44px');
  });
  var all = document.querySelectorAll('.rv, .rv-side');
  function show(el) { if (el.classList.contains('rv-side')) whenLoaded(el, function () { el.classList.add('in'); }); else el.classList.add('in'); }
  if (!reduce) {
    // Show anything in view or already scrolled past (fast scrolls and jump links skip frames).
    var pending = Array.prototype.slice.call(all), ticking = false;
    function check() {
      ticking = false;
      var lim = innerHeight * 0.94;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < lim) { show(el); return false; }
        return true;
      });
      if (!pending.length) { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    addEventListener('load', onScroll);
    check();
  } else { all.forEach(function (el) { el.classList.add('in'); }); }

  // ---------- stats count up from 0 the first time they scroll into view ----------
  var nums = document.querySelectorAll('[data-count]');
  if (nums.length && 'IntersectionObserver' in window && !reduce) {
    var row = nums[0].closest('.facts') || nums[0];
    var started = false;
    nums.forEach(function (n) { n.textContent = '0'; });
    var io3 = new IntersectionObserver(function (entries) {
      if (started || !entries.some(function (e) { return e.isIntersecting; })) return;
      started = true; io3.disconnect();
      var t0 = null, dur = 1400;
      (function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        nums.forEach(function (n) { n.textContent = String(Math.round(e * Number(n.getAttribute('data-count')))); });
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    }, { threshold: 0.4 });
    io3.observe(row);
  }

  // ---------- phone call bar: hidden while the page's own buttons are on screen ----------
  var bar = document.querySelector('.call-bar');
  var hide = document.querySelectorAll('[data-hide-bar]');
  if (bar && hide.length && 'IntersectionObserver' in window) {
    var on = new Set();
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) on.add(en.target); else on.delete(en.target); });
      bar.classList.toggle('is-hidden', on.size > 0);
    });
    hide.forEach(function (el) { io2.observe(el); });
  }
})();
