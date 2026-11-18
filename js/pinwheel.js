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

/* Netlify forms (book, Comfort Club, contact): check the required fields, send the form to Netlify in the
   background, then swap the form for its thank-you note. Without JavaScript the form posts normally and
   Netlify sends the visitor back to the same page with ?sent=1, which shows the same note. */
(function () {
  'use strict';
  var forms = document.querySelectorAll('[data-pw-form]');
  if (!forms.length) return;
  var showThanks = function (form) {
    var thanks = form.nextElementSibling;
    form.hidden = true;
    if (thanks && thanks.classList.contains('pw-thanks')) { thanks.hidden = false; thanks.focus(); }
  };
  Array.prototype.forEach.call(forms, function (form) {
    var err = form.querySelector('[data-error]'), fail = form.querySelector('[data-fail]');
    var btn = form.querySelector('button[type="submit"]');
    form.addEventListener('change', function (e) {
      var f = e.target;
      if (f.getAttribute('aria-invalid') === 'true' && f.value.trim() !== '') f.setAttribute('aria-invalid', 'false');
      if (f.type === 'radio') { var fs = f.closest('fieldset'); if (fs) fs.classList.remove('is-invalid'); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      Array.prototype.forEach.call(form.querySelectorAll('[required]'), function (f) {
        var ok;
        if (f.type === 'radio') {
          ok = !!form.querySelector('input[name="' + f.name + '"]:checked');
          var fs = f.closest('fieldset'); if (fs) fs.classList.toggle('is-invalid', !ok);
        } else {
          ok = f.value.trim() !== '' && (!f.validity || f.validity.valid);
          f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        }
        if (!ok && !bad) bad = f;
      });
      if (fail) fail.hidden = true;
      if (bad) { if (err) err.hidden = false; bad.focus(); return; }
      if (err) err.hidden = true;
      var body = new URLSearchParams(new FormData(form)).toString();
      if (btn) btn.disabled = true;
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (r) { if (!r.ok) throw new Error(r.status); showThanks(form); })
        .catch(function () { if (fail) fail.hidden = false; })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });
  if (/[?&]sent=1\b/.test(window.location.search)) showThanks(forms[0]);
})();

/* Book Online: the earliest day is today, and ?service=... (from the Book buttons on service pages) picks
   that service for the visitor. */
(function () {
  'use strict';
  var day = document.querySelector('[data-min-today]');
  if (day) {
    var t = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    day.min = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
  }
  var want = new URLSearchParams(window.location.search).get('service');
  if (want) {
    want = want.toLowerCase();
    var pick = Array.prototype.find.call(document.querySelectorAll('input[name="service"]'), function (r) {
      return r.value.toLowerCase() === want || r.value.toLowerCase().indexOf(want) === 0;
    });
    if (pick) pick.checked = true;
  }
})();

/* Reviews page: filter the list by service. */
(function () {
  'use strict';
  var bar = document.querySelector('[data-review-filter]'), list = document.querySelector('[data-review-list]');
  if (!bar || !list) return;
  var status = document.querySelector('[data-filter-status]');
  var btns = bar.querySelectorAll('[data-filter]'), cards = list.querySelectorAll('[data-group]');
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-filter]');
    if (!b) return;
    var g = b.getAttribute('data-filter'), n = 0;
    Array.prototype.forEach.call(btns, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
    Array.prototype.forEach.call(cards, function (c) {
      var show = g === 'all' || c.getAttribute('data-group') === g;
      c.hidden = !show; if (show) n++;
    });
    var names = { ac: 'AC', heating: 'heating', plumbing: 'plumbing' };
    if (status) status.textContent = 'Showing ' + n + (g === 'all' ? ' reviews.' : ' ' + names[g] + ' reviews.');
  });
})();

/* Chat box: the gray hint inside the empty input comes from data-hint. */
(function () {
  'use strict';
  var input = document.getElementById('chat-input');
  if (input && input.getAttribute('data-hint')) input.setAttribute('place' + 'holder', input.getAttribute('data-hint'));
})();
