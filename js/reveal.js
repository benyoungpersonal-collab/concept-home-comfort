/* reveal.js: sections and cards fade up as they scroll into view, once each, cards a little staggered.
   - The hero is never touched, so the header, photo, headline and buttons show instantly.
   - Nothing is hidden until this script runs (no JavaScript: everything stays visible).
   - "Reduce motion" turns it off. Only opacity and transform change, so nothing shifts the layout.
   Add data-reveal to any element to include it. */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SEL = [
    '[data-reveal]', '.section-head', '.faq-head', '.tile', '.tpl-callout', '.visit-media-col', '.visit-steps > li',
    '.review-card', '.tpl-sample-note', '.tpl-proof > li', '.tpl-review-ask', '.est-grid > *', '.acc-item', '.call-card',
    '.map-card', '.areas .eyebrow', '.areas h2', '.areas .lead', '.area-chips', '.areas .muted',
    '.request-photo', '.request-card', '.tpl-tiles > li', '.team-grid > *', '.offer-card', '.member-card', '.feature'
  ].join(',');
  var els = [].slice.call(document.querySelectorAll(SEL)).filter(function (el) {
    // Skip the hero and header, anything inside a dropdown (it shows when opened), and anything not drawn on this screen size.
    return !el.closest('.hero') && !el.closest('.site-header') && !el.closest('.mobile-menu') && !el.closest('details') && !el.closest('[data-no-reveal]') && el.getClientRects().length > 0;
  });
  var footerLogo = document.querySelector('.site-footer .footer-brand .logo');
  if (footerLogo) { footerLogo.classList.add('tpl-fade'); els.push(footerLogo); }
  // Anything already on screen when the page opens shows at once: no flash, no wait.
  var vh = window.innerHeight || document.documentElement.clientHeight;
  els = els.filter(function (el) {
    var r = el.getBoundingClientRect();
    return !(r.top < vh && r.bottom > 0 && r.left < window.innerWidth && r.right > 0);
  });
  els = els.filter(function (el) { return !els.some(function (o) { return o !== el && o.contains(el); }); });
  els.forEach(function (el) { el.classList.add('tpl-reveal'); });
  var done = function (el) {
    // After the fade, drop the classes so the element's own hover transitions run at full speed again.
    setTimeout(function () { el.classList.remove('tpl-reveal', 'is-in', 'tpl-fade'); el.style.removeProperty('--tpl-d'); }, 700 + (parseInt(el.style.getPropertyValue('--tpl-d'), 10) || 0));
  };
  var show = function (list) {
    list.sort(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (ra.top - rb.top) || (ra.left - rb.left); });
    list.forEach(function (el, i) { el.style.setProperty('--tpl-d', Math.min(i * 80, 320) + 'ms'); el.classList.add('is-in'); done(el); });
  };
  var io = new IntersectionObserver(function (entries) {
    var batch = [];
    entries.forEach(function (e) { if (e.isIntersecting) { batch.push(e.target); io.unobserve(e.target); } });
    if (batch.length) show(batch);
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  // Cards in a sideways scroller (reviews) appear with their row, since most of them are off to the side.
  var tracks = new Map();
  els.forEach(function (el) {
    var track = el.closest('.review-track');
    if (track) { if (!tracks.has(track)) tracks.set(track, []); tracks.get(track).push(el); } else io.observe(el);
  });
  tracks.forEach(function (cards, track) {
    var to = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { to.disconnect(); show(cards.slice()); }
    }, { threshold: 0.12 });
    to.observe(track);
  });
})();
