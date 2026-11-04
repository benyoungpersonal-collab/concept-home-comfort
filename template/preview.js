/* preview.js: the starting-price picker on homepage previews. Loaded after js/site.js.
   The prices come from the data file and sit on each chip as data-from / data-to. */
(function () {
  'use strict';
  var form = document.querySelector('[data-price-picker]');
  if (!form) return;
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var out = document.querySelector('[data-price-output]');
  var empty = document.querySelector('[data-price-empty]');
  var low = document.querySelector('[data-price-low]');
  var high = document.querySelector('[data-price-high]');
  var forEl = document.querySelector('[data-price-for]');
  var note = document.querySelector('[data-price-note]');
  var bar = document.querySelector('[data-price-bar]');
  var book = document.querySelector('[data-price-book]');
  var max = 0;
  form.querySelectorAll('input[data-to]').forEach(function (i) { max = Math.max(max, parseFloat(i.getAttribute('data-to')) || 0); });
  var show = function () {
    var i = form.querySelector('input[name="price-service"]:checked');
    if (!i) return;
    var from = parseFloat(i.getAttribute('data-from')), to = parseFloat(i.getAttribute('data-to'));
    low.textContent = money(from);
    high.textContent = to > from ? money(to) : '';
    high.previousElementSibling.hidden = !(to > from);
    forEl.textContent = i.value;
    var n = i.getAttribute('data-note') || '';
    note.textContent = n; note.hidden = !n;
    if (bar && max) { bar.style.left = (from / max * 100) + '%'; bar.style.width = Math.max(4, ((to > from ? to : from) - from) / max * 100) + '%'; }
    if (book) book.setAttribute('href', '#request');
    empty.hidden = true; out.hidden = false;
  };
  form.addEventListener('change', show);
  form.addEventListener('submit', function (e) { e.preventDefault(); show(); });
})();
