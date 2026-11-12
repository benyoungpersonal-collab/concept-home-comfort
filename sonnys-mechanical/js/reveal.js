
(function () {
  'use strict';
  
  (function edges() {
    var root = document.documentElement;
    if (!root.classList.contains('edge-bolt')) return;
    var D = 'M0 6 150 42 108 30 240 60 390 24 348 36 480 4 630 42 588 30 720 60 870 24 828 36 960 4 1110 42 1068 30 1200 60 1350 24 1308 36 1440 4';
    var NS = 'http://www.w3.org/2000/svg';
    var lines = [];
    var add = function (sec, where) {
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'edge-line at-' + where); svg.setAttribute('viewBox', '0 0 1440 64');
      svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      svg.innerHTML = '<path class="el-outline" d="' + D + '"/><path class="el-line" d="' + D + '"/><path class="el-spark" pathLength="1000" d="' + D + '"/>';
      sec.appendChild(svg); lines.push(svg);
    };
    [].forEach.call(document.querySelectorAll('.edge-top'), function (s) { add(s, 'top'); });
    [].forEach.call(document.querySelectorAll('.edge-bottom'), function (s) { add(s, 'bottom'); });
    if (!lines.length || !('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-sparked'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    lines.forEach(function (l) { io.observe(l); });
  })();
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var d = document;
  var SEL = [
    '[data-reveal]',
    '.section .eyebrow', '.section h2', '.section-head .lead', '.section-head .rating-line', '.section-head > p', '.faq-head > *',
    '.pcard', '.review-card', '.deal', '.acc-item', '.call-card', '.tpl-callout', '.tpl-proof > li', '.tpl-review-ask', '.tpl-sample-note',
    '.visit-media-col', '.visit .btn', '.tpl-guarantee', '.request-photo', '.request-card', '.owner-figure', '.map-card', '.team-photo .photo', '.team-photo figcaption',
    '.section .lead', '.pull-quote', '.proof-chips', '.stats', '.team-row > li', '.team .btn-row', '.area-chips', '.areas .muted',
    '.est-form .q', '.est-form .field', '.est-form > div:last-child', '.est-side', '.tpl-tiles > li', '.offer-card', '.member-card', '.feature',
    '.bento-foot', '.specials-foot', '.carousel-controls', '.section > .container > .btn', '.section > .container > .btn-row'
  ].join(',');
  var skip = function (el) {
    return el.closest('.hero') || el.closest('.site-header') || el.closest('.mobile-menu') || el.closest('details') || el.closest('dialog') ||
      el.closest('[data-no-reveal]') || el.closest('.chat-panel') || el.closest('.visit-steps') || el.getClientRects().length === 0;
  };
  var els = [].slice.call(d.querySelectorAll(SEL)).filter(function (el) { return !skip(el); });
  var footerLogo = d.querySelector('.site-footer .footer-brand .logo');
  if (footerLogo) { footerLogo.setAttribute('data-m', 'fade'); els.push(footerLogo); }

  els = els.filter(function (el, i) { return els.indexOf(el) === i && !els.some(function (o) { return o !== el && o.contains(el); }); });

  
  var vw = window.innerWidth || d.documentElement.clientWidth;
  var PHOTO = '.visit-media-col, .request-photo, .owner-figure, .map-card, .team-photo .photo, .est-side, .member-card';
  var CARD = '.pcard, .review-card, .deal, .tpl-proof > li, .team-row > li, .tpl-tiles > li, .offer-card, .feature, .call-card';
  var BTN = '.btn, .btn-row, .carousel-controls';
  var moveFor = function (el) {
    var set = el.getAttribute('data-reveal');
    if (set && set !== '' && set !== 'true') return set;
    if (el.hasAttribute('data-m')) return el.getAttribute('data-m');
    if (el.matches(CARD)) return 'zoom';
    if (el.matches(BTN)) return 'zoom';
    var r = el.getBoundingClientRect();
    if (el.matches(PHOTO)) {

      if (r.width < vw * 0.6) return (r.left + r.width / 2) < vw / 2 ? 'left' : 'right';
      return 'zoom';
    }
    if (r.width < vw * 0.55 && vw >= 900) return (r.left + r.width / 2) < vw / 2 ? 'left' : 'right';
    return 'up';
  };

  var vh = window.innerHeight || d.documentElement.clientHeight;
  var onScreen = function (el) { var r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0; };

  d.documentElement.classList.add('tpl-no-anim');
  els.forEach(function (el) {
    el.setAttribute('data-m', moveFor(el));
    el.classList.add('tpl-reveal');
    if (onScreen(el)) el.classList.add('is-in');
  });

  
  var show = function (list) {
    list.sort(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (Math.round(ra.top / 40) - Math.round(rb.top / 40)) || (ra.left - rb.left); });
    list.forEach(function (el, i) { el.style.setProperty('--tpl-d', Math.min(i * 70, 350) + 'ms'); el.classList.add('is-in'); });
  };
  var hide = function (el) { el.style.setProperty('--tpl-d', '0ms'); el.classList.remove('is-in'); };
  
  var io = new IntersectionObserver(function (entries) {
    var batch = [];
    entries.forEach(function (e) {
      if (e.isIntersecting) { if (!e.target.classList.contains('is-in')) batch.push(e.target); }
      else if (e.boundingClientRect.top > (e.rootBounds ? e.rootBounds.bottom : vh * 0.9) - 1) hide(e.target);
    });
    if (batch.length) show(batch);
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

  var tracks = new Map();
  els.forEach(function (el) {
    var track = el.closest('.review-track');
    if (track) { if (!tracks.has(track)) tracks.set(track, []); tracks.get(track).push(el); } else io.observe(el);
  });
  tracks.forEach(function (cards, track) {
    var to = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) show(cards.filter(function (c) { return !c.classList.contains('is-in'); }));
        else if (e.boundingClientRect.top > 0) cards.forEach(hide);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    to.observe(track);
  });

  
  var toggleOn = function (el, readyClass, margin) {
    el.classList.add(readyClass);
    if (onScreen(el) && el.getBoundingClientRect().top < vh * 0.9) el.classList.add('is-in', 'is-drawn');
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('is-in', 'is-drawn');
        else if (e.boundingClientRect.top > 0) e.target.classList.remove('is-in', 'is-drawn');
      });
    }, { rootMargin: '0px 0px ' + (margin || '-15%') + ' 0px', threshold: 0 }).observe(el);
  };

  [].forEach.call(d.querySelectorAll('.visit-steps'), function (ol) { toggleOn(ol, 'tpl-steps-ready', '-12%'); });

  [].forEach.call(d.querySelectorAll('.tpl-van'), function (v) { toggleOn(v, 'tpl-van-ready', '-8%'); });
  
  var outs = els.concat([].slice.call(d.querySelectorAll('.visit-steps.tpl-steps-ready, .tpl-van.tpl-van-ready')));
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var line = (window.innerHeight || vh) * 0.9;
      outs.forEach(function (el) {
        if (!el.classList.contains('is-in') || el.closest('.review-track')) return;
        if (el.getBoundingClientRect().top > line + 60) { if (el.classList.contains('tpl-reveal')) hide(el); else el.classList.remove('is-in', 'is-drawn'); }
      });
    });
  }, { passive: true });
  void d.body.offsetHeight; // apply the starting state now, then turn transitions back on
  requestAnimationFrame(function () { requestAnimationFrame(function () { d.documentElement.classList.remove('tpl-no-anim'); }); });
})();
