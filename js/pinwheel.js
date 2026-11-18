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
