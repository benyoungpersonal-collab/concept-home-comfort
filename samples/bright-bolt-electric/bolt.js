/* bolt.js: brings Bolt (the mascot) in and out, picture-book style, like js/reveal.js.
   - Each spot ([data-bolt]) comes in when it crosses a line 10% up from the bottom of the screen, and goes back out
     when it drops below that line again (scrolling back up). The hero spot peeks in right after the page loads.
   - Idle motion (bob, blink, spark, the spot's own move) runs only while the spot is on screen (.is-live).
   - Tap Bolt for a happy hop with a small spark burst. At the quick quote he texts: his thumb taps the phone.
   - Reduce motion: he stands in place and nothing moves. Decorative only: every spot is aria-hidden. */
(function () {
  'use strict';
  var d = document;
  var spots = [].slice.call(d.querySelectorAll('[data-bolt]'));
  if (!spots.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) { spots.forEach(function (s) { s.classList.add('is-in'); if (s.parentNode.classList.contains('bolt-row')) s.parentNode.classList.add('is-in'); }); return; }

  /* A spot with a speech bubble sits in a .bolt-row; the row gets the same in/out class so the bubble follows */
  var set = function (s, on) {
    s.classList.toggle('is-in', on);
    if (s.parentNode && s.parentNode.classList.contains('bolt-row')) s.parentNode.classList.toggle('is-in', on);
  };
  var line = function () { return (window.innerHeight || d.documentElement.clientHeight) * 0.9; };
  var inOut = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) set(e.target, true);
      else if (e.boundingClientRect.top > (e.rootBounds ? e.rootBounds.bottom : line()) - 1) set(e.target, false);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
  var live = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.classList.toggle('is-live', e.isIntersecting); });
  }, { rootMargin: '40px 0px', threshold: 0 });

  spots.forEach(function (s) {
    /* The hero Bolt waits until the logo Bolt has zoomed in (about 1 second), so they never move at the same time */
    if (s.hasAttribute('data-bolt-load')) setTimeout(function () { set(s, true); }, d.querySelector('.bb-logo-fx') ? 1250 : 500);
    else inOut.observe(s);
    live.observe(s);
    var hop = s.querySelector('.bolt-hop');
    if (hop) hop.addEventListener('click', function () {
      if (hop.classList.contains('is-hop')) return;
      hop.classList.add('is-hop');
      setTimeout(function () { hop.classList.remove('is-hop'); }, 760);
    });
  });

  /* A jump straight up (tapping the logo) can skip past the line without the observer seeing it */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var l = line();
      spots.forEach(function (s) {
        if (!s.hasAttribute('data-bolt-load') && s.classList.contains('is-in') && s.getBoundingClientRect().top > l + 60) set(s, false);
      });
    });
  }, { passive: true });
})();
