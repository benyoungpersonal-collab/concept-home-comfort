/* Sonny's Air Conditioning (preview): menu, scroll motion, count-up stats, phone call bar. No dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var menu = document.querySelector('[data-menu]');
  var openBtn = document.querySelector('[data-menu-open]');
  if (menu && openBtn && menu.showModal) {
    openBtn.addEventListener('click', function () { menu.showModal(); openBtn.setAttribute('aria-expanded', 'true'); });
    menu.addEventListener('close', function () { openBtn.setAttribute('aria-expanded', 'false'); });
    menu.querySelectorAll('[data-menu-close], a').forEach(function (el) { el.addEventListener('click', function () { menu.close(); }); });
    menu.addEventListener('click', function (e) { if (e.target === menu) menu.close(); });
  }

  // Images slide in from the side they sit on (full-width ones just fade up); text fades up. Once each.
  var side = document.querySelectorAll('.rv-side');
  side.forEach(function (el) {
    var r = el.getBoundingClientRect(), mid = (r.left + r.right) / 2, vw = document.documentElement.clientWidth;
    var off = (mid - vw / 2) / vw;
    el.style.setProperty('--from', Math.abs(off) < 0.08 || r.width > vw * 0.8 ? '0px' : (off < 0 ? '-44px' : '44px'));
    if (Math.abs(off) < 0.08 || r.width > vw * 0.8) el.style.translate = '';
  });
  var all = document.querySelectorAll('.rv, .rv-side');
  if ('IntersectionObserver' in window && all.length && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    all.forEach(function (el) { io.observe(el); });
  } else { all.forEach(function (el) { el.classList.add('in'); }); }

  // Stats count up from 0 the first time they scroll into view.
  var nums = document.querySelectorAll('[data-count]');
  if (nums.length && 'IntersectionObserver' in window && !reduce) {
    nums.forEach(function (n) { n.textContent = '0'; });
    var seen = false;
    var row = nums[0].closest('.facts') || nums[0];
    var io3 = new IntersectionObserver(function (entries) {
      if (seen || !entries.some(function (e) { return e.isIntersecting; })) return;
      seen = true; io3.disconnect();
      var t0 = null, dur = 1400;
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        nums.forEach(function (n) { n.textContent = String(Math.round(e * Number(n.getAttribute('data-count')))); });
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io3.observe(row);
  }

  // Hide the phone call bar while the page's own buttons are on screen.
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
