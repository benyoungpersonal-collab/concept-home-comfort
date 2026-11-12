/* Sonny's Air Conditioning (preview): menu, scroll reveal, phone call bar. No dependencies. */
(function () {
  'use strict';
  var menu = document.querySelector('[data-menu]');
  var openBtn = document.querySelector('[data-menu-open]');
  if (menu && openBtn && menu.showModal) {
    openBtn.addEventListener('click', function () { menu.showModal(); openBtn.setAttribute('aria-expanded', 'true'); });
    menu.addEventListener('close', function () { openBtn.setAttribute('aria-expanded', 'false'); });
    menu.querySelectorAll('[data-menu-close], a').forEach(function (el) { el.addEventListener('click', function () { menu.close(); }); });
    menu.addEventListener('click', function (e) { if (e.target === menu) menu.close(); });
  }

  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && rv.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  // Hide the phone call bar while the page's own buttons are on screen.
  var bar = document.querySelector('.call-bar');
  var hide = document.querySelectorAll('[data-hide-bar]');
  if (bar && hide.length && 'IntersectionObserver' in window) {
    var seen = new Set();
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); });
      bar.classList.toggle('is-hidden', seen.size > 0);
    });
    hide.forEach(function (el) { io2.observe(el); });
  }
})();
