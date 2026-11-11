/* reveal.js: "picture book" scroll motion, shared by Pinwheel and every homepage preview.
   - Headings, cards, photos, and buttons come in as they scroll into view, with a mix of moves: photos and cards in a
     row zoom up from slightly smaller with a tiny overshoot, items in a left or right column glide in from that side,
     and the rest rise up from the bottom. About 0.6s each, cards in a row a little staggered (css/alive.css).
   - Scroll back up past something and it goes back out the way it came. Keep scrolling down and it stays put.
   - The hero, header, and menus are never touched, so the top of the page shows instantly.
   - Nothing is hidden until this script runs (no JavaScript: everything stays visible). "Reduce motion": no motion.
   - Also runs How a visit works (numbers pop, the line draws) and the van drive-in.
   Add data-reveal (or data-reveal="zoom|left|right|up|fade") to include any other element. */
(function () {
  'use strict';
  /* Electrical edge (html.edge-bolt): a thin line in the brand color with a soft glow along each lightning edge
     (css/alive.css), and a small spark that runs along it once when it scrolls into view. The line is drawn even with
     "reduce motion"; only the spark is skipped. The contour matches the .edge-bolt mask in css/alive.css. */
  (function edges() {
    var root = document.documentElement;
    if (!root.classList.contains('edge-bolt')) return;
    var D = 'M0 40 50 8 84 40 118 11 154 32 184 44 216 40 242 7 261 15 276 56 352 16 386 56 405 31 420 9 448 15 470 51 536 10 578 13 612 43 662 7 681 15 696 56 754 16 842 48 874 26 900 11 942 32 976 45 1042 13 1084 18 1118 52 1152 14 1200 35 1240 48 1298 6 1332 55 1380 49 1420 11 1440 53';
    var NS = 'http://www.w3.org/2000/svg';
    var lines = [];
    var add = function (sec, where) {
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'edge-line at-' + where); svg.setAttribute('viewBox', '0 0 1440 64');
      svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      svg.innerHTML = '<path class="el-line" d="' + D + '"/><path class="el-spark" pathLength="1000" d="' + D + '"/>';
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
  // Keep the outermost: a card moves as one piece, not its heading and button separately.
  els = els.filter(function (el, i) { return els.indexOf(el) === i && !els.some(function (o) { return o !== el && o.contains(el); }); });

  /* Pick the move. Photos and cards in a row zoom up; items in a side column glide in from that side; the rest rise. */
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
      // A photo beside text glides in from its side on wide screens; full-width photos zoom
      if (r.width < vw * 0.6) return (r.left + r.width / 2) < vw / 2 ? 'left' : 'right';
      return 'zoom';
    }
    if (r.width < vw * 0.55 && vw >= 900) return (r.left + r.width / 2) < vw / 2 ? 'left' : 'right';
    return 'up';
  };

  // Anything already on screen when the page opens shows at once: no flash, no wait.
  var vh = window.innerHeight || d.documentElement.clientHeight;
  var onScreen = function (el) { var r = el.getBoundingClientRect(); return r.top < vh && r.bottom > 0; };
  // The hidden starting state is set with transitions off, so nothing animates on page load.
  d.documentElement.classList.add('tpl-no-anim');
  els.forEach(function (el) {
    el.setAttribute('data-m', moveFor(el));
    el.classList.add('tpl-reveal');
    if (onScreen(el)) el.classList.add('is-in');
  });

  /* Stagger: elements that come in together, in reading order, 70ms apart (capped). Going out has no delay. */
  var show = function (list) {
    list.sort(function (a, b) { var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (Math.round(ra.top / 40) - Math.round(rb.top / 40)) || (ra.left - rb.left); });
    list.forEach(function (el, i) { el.style.setProperty('--tpl-d', Math.min(i * 70, 350) + 'ms'); el.classList.add('is-in'); });
  };
  var hide = function (el) { el.style.setProperty('--tpl-d', '0ms'); el.classList.remove('is-in'); };
  /* One line across the screen, 10% up from the bottom: above it things are in, below it they are out.
     Going out only happens when the element drops below that line (scrolling back up), never off the top. */
  var io = new IntersectionObserver(function (entries) {
    var batch = [];
    entries.forEach(function (e) {
      if (e.isIntersecting) { if (!e.target.classList.contains('is-in')) batch.push(e.target); }
      else if (e.boundingClientRect.top > (e.rootBounds ? e.rootBounds.bottom : vh * 0.9) - 1) hide(e.target);
    });
    if (batch.length) show(batch);
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });

  // Cards in a sideways scroller (reviews) come and go with their row, since most of them are off to the side.
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

  /* Toggle a class as a block crosses the same line (used by the visit steps and the van). */
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
  // How a visit works: the numbers pop in one after another and the line draws between them
  [].forEach.call(d.querySelectorAll('.visit-steps'), function (ol) { toggleOn(ol, 'tpl-steps-ready', '-12%'); });
  // Van drive-in: drives in from the left and parks; scroll back up past it and it drives back out
  [].forEach.call(d.querySelectorAll('.tpl-van'), function (v) { toggleOn(v, 'tpl-van-ready', '-8%'); });
  /* A jump straight up (tapping the logo, a "back to top" link) can skip past the line without the observers seeing it,
     so a light check on scroll sends anything now below the line back out. */
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
