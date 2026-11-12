/* Sonny's Air Conditioning: Send Your Plans form.
   Files go straight from the browser to Cloudflare R2 through short-lived signed links from the
   sonnys-plans Worker (workers/sonnys-plans). Large plan sets are sent in parts, four at a time,
   with retries, and one progress bar for the whole upload. */
(function () {
  'use strict';
  var form = document.querySelector('[data-plans-form]');
  if (!form) return;

  var API = form.getAttribute('data-api');
  var MAX_FILES = 20, MAX_BYTES = 2 * 1024 * 1024 * 1024, PARALLEL = 4, RETRIES = 4;

  var dropEl = form.querySelector('[data-drop]');
  var input = form.querySelector('input[type="file"]');
  var list = form.querySelector('[data-files]');
  var errBox = form.querySelector('[data-form-error]');
  var prog = form.querySelector('[data-progress]');
  var progBar = prog.querySelector('.progress-bar span');
  var progLabel = prog.querySelector('[data-progress-label]');
  var progNum = prog.querySelector('[data-progress-num]');
  var progNote = prog.querySelector('[data-progress-note]');
  var submit = form.querySelector('[type="submit"]');
  var done = document.querySelector('[data-done]');
  var files = [];
  var busy = false;

  function fmt(b) {
    if (b >= 1073741824) return (b / 1073741824).toFixed(2) + ' GB';
    if (b >= 1048576) return (b / 1048576).toFixed(b >= 104857600 ? 0 : 1) + ' MB';
    return Math.max(1, Math.round(b / 1024)) + ' KB';
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function showError(msg) { errBox.textContent = msg; errBox.classList.toggle('on', !!msg); if (msg) errBox.scrollIntoView({ block: 'center', behavior: 'smooth' }); }

  var icoFile = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
  var icoX = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function render() {
    list.innerHTML = '';
    files.forEach(function (f, i) {
      var li = document.createElement('li');
      li.className = 'file';
      li.innerHTML = icoFile + '<div style="min-width:0"><div class="file-name">' + esc(f.name) + '</div><div class="file-meta">' + fmt(f.size) + '</div></div>' +
        '<button type="button" class="file-x" aria-label="Remove ' + esc(f.name) + '">' + icoX + '</button><div class="file-bar"><span></span></div>';
      li.querySelector('.file-x').addEventListener('click', function () { if (!busy) { files.splice(i, 1); render(); } });
      f.el = li;
      list.appendChild(li);
    });
  }

  function addFiles(fl) {
    var skipped = [];
    Array.prototype.forEach.call(fl, function (f) {
      var isPdf = /\.pdf$/i.test(f.name) || f.type === 'application/pdf';
      if (!isPdf) { skipped.push(f.name + ' (not a PDF)'); return; }
      if (f.size > MAX_BYTES) { skipped.push(f.name + ' (over 2 GB)'); return; }
      if (!f.size) { skipped.push(f.name + ' (empty)'); return; }
      if (files.some(function (x) { return x.name === f.name && x.size === f.size; })) return;
      if (files.length >= MAX_FILES) { skipped.push(f.name + ' (20 files max)'); return; }
      files.push({ file: f, name: f.name, size: f.size });
    });
    render();
    showError(skipped.length ? 'Skipped: ' + skipped.join(', ') + '. Plans need to be PDFs, up to 2 GB each.' : '');
  }

  input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { dropEl.addEventListener(ev, function (e) { e.preventDefault(); dropEl.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { dropEl.addEventListener(ev, function (e) { e.preventDefault(); dropEl.classList.remove('is-over'); }); });
  dropEl.addEventListener('drop', function (e) { if (!busy && e.dataTransfer) addFiles(e.dataTransfer.files); });

  // ---------- validation ----------
  function setErr(name, on) {
    var el = form.elements[name];
    var field = (el && (el.closest ? el.closest('.field') : null)) || (el && el[0] && el[0].closest('.field'));
    if (!field) return;
    field.classList.toggle('has-err', on);
    var ctl = field.querySelector('input:not([type="radio"]), textarea');
    if (ctl) ctl.setAttribute('aria-invalid', on ? 'true' : 'false');
  }
  function val(n) { var el = form.elements[n]; return el ? String(el.value || '').trim() : ''; }
  function validate() {
    var bad = [];
    if (!val('name')) bad.push('name');
    if (val('mobile').replace(/\D/g, '').length < 10) bad.push('mobile');
    if (!val('company')) bad.push('company');
    if (!val('location')) bad.push('location');
    if (!form.querySelector('input[name="type"]:checked')) bad.push('type');
    ['name', 'mobile', 'company', 'location', 'type'].forEach(function (n) { setErr(n, bad.indexOf(n) > -1); });
    if (bad.length) {
      var first = form.elements[bad[0]];
      (first && first.focus ? first : first[0]).focus();
    }
    return !bad.length;
  }
  form.addEventListener('input', function (e) { var f = e.target.closest('.field'); if (f && f.classList.contains('has-err')) { f.classList.remove('has-err'); } });
  form.addEventListener('change', function (e) { var f = e.target.closest('.field'); if (f) f.classList.remove('has-err'); });

  // ---------- upload ----------
  function post(path, body) {
    return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Upload service error (' + r.status + ').'); e.server = true; throw e; } return j; }); });
  }

  function putPart(url, blob, onProgress) {
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open('PUT', url);
      x.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded); };
      x.onload = function () {
        var etag = x.getResponseHeader('ETag');
        if (x.status >= 200 && x.status < 300 && etag) resolve(etag);
        else reject(new Error('Part failed (' + x.status + ')'));
      };
      x.onerror = function () { reject(new Error('Network error')); };
      x.ontimeout = function () { reject(new Error('Timed out')); };
      x.timeout = 15 * 60 * 1000;
      x.send(blob);
    });
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function uploadAll(plan) {
    var total = files.reduce(function (s, f) { return s + f.size; }, 0);
    var loaded = {};      // part key -> bytes sent
    var doneBytes = 0;
    var started = Date.now();
    var jobs = [];
    plan.files.forEach(function (pf, fi) {
      var f = files[fi];
      f.parts = [];
      f.sent = 0;
      pf.urls.forEach(function (url, pi) {
        var start = pi * pf.partSize, end = Math.min(f.size, start + pf.partSize);
        jobs.push({ fi: fi, n: pi + 1, url: url, start: start, end: end, key: fi + ':' + pi });
      });
    });

    function tick() {
      var inFlight = 0; for (var k in loaded) inFlight += loaded[k];
      var sent = Math.min(total, doneBytes + inFlight);
      var pct = total ? sent / total : 1;
      progBar.style.width = (pct * 100).toFixed(1) + '%';
      progNum.textContent = Math.floor(pct * 100) + '%';
      var secs = (Date.now() - started) / 1000;
      var rate = secs > 2 ? sent / secs : 0;
      var left = rate ? (total - sent) / rate : 0;
      progNote.textContent = fmt(sent) + ' of ' + fmt(total) + (rate && pct < 1 ? ' · about ' + (left < 90 ? Math.max(5, Math.round(left / 5) * 5) + ' sec' : Math.round(left / 60) + ' min') + ' left' : '');
      files.forEach(function (f, fi) {
        var s = f.sent; for (var k in loaded) if (k.indexOf(fi + ':') === 0) s += loaded[k];
        var bar = f.el && f.el.querySelector('.file-bar span');
        if (bar) bar.style.width = Math.min(100, s / f.size * 100).toFixed(1) + '%';
      });
    }

    var i = 0;
    function worker() {
      if (i >= jobs.length) return Promise.resolve();
      var job = jobs[i++];
      var f = files[job.fi];
      var blob = f.file.slice(job.start, job.end);
      var attempt = 0;
      function go() {
        loaded[job.key] = 0;
        return putPart(job.url, blob, function (b) { loaded[job.key] = b; tick(); }).then(function (etag) {
          delete loaded[job.key];
          doneBytes += job.end - job.start;
          f.sent += job.end - job.start;
          f.parts.push({ n: job.n, etag: etag });
          if (f.parts.length === plan.files[job.fi].urls.length && f.el) { f.el.classList.add('done'); f.el.querySelector('.file-meta').textContent = fmt(f.size) + ' · uploaded'; }
          tick();
        }, function (err) {
          delete loaded[job.key];
          tick();
          if (++attempt > RETRIES) throw err;
          progLabel.textContent = 'Connection hiccup, retrying…';
          return wait(1500 * attempt * attempt).then(function () { progLabel.textContent = 'Uploading your plans'; return go(); });
        });
      }
      return go().then(worker);
    }
    var pool = [];
    for (var w = 0; w < Math.min(PARALLEL, jobs.length); w++) pool.push(worker());
    return Promise.all(pool);
  }

  function beforeUnload(e) { e.preventDefault(); e.returnValue = ''; return ''; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    showError('');
    if (!validate()) { showError('Please fill in the highlighted fields.'); return; }

    busy = true;
    submit.disabled = true;
    form.classList.add('is-uploading');
    var hasFiles = files.length > 0;
    prog.classList.add('on');
    progLabel.textContent = hasFiles ? 'Getting your upload ready' : 'Sending your project';
    progBar.style.width = '0%'; progNum.textContent = ''; progNote.textContent = '';
    window.addEventListener('beforeunload', beforeUnload);

    var typeEl = form.querySelector('input[name="type"]:checked');
    var payload = {
      name: val('name'), mobile: val('mobile'), company: val('company'), address: val('address'),
      location: val('location'), type: typeEl ? typeEl.value : '', notes: val('notes'), website: val('website'),
      files: files.map(function (f) { return { name: f.name, size: f.size }; }),
    };
    var plan;
    post('/api/start', payload).then(function (p) {
      plan = p;
      if (!hasFiles || p.bot) return;
      progLabel.textContent = 'Uploading your plans';
      return uploadAll(p);
    }).then(function () {
      progLabel.textContent = 'Finishing up';
      progBar.style.width = '100%'; progNum.textContent = '100%';
      return post('/api/complete', { id: plan.id, token: plan.token, files: files.map(function (f) { return { parts: f.parts || [] }; }) });
    }).then(function () {
      window.removeEventListener('beforeunload', beforeUnload);
      form.hidden = true;
      done.classList.add('on');
      var n = done.querySelector('[data-done-count]');
      if (n) n.textContent = hasFiles ? (files.length === 1 ? 'Your plan set is' : 'All ' + files.length + ' files are') + ' in, and George has your details.' : 'George has your project details.';
      done.scrollIntoView({ block: 'start', behavior: 'smooth' });
      done.focus({ preventScroll: true });
    }).catch(function (err) {
      window.removeEventListener('beforeunload', beforeUnload);
      if (plan && plan.id && !(err && err.server && /notice did not go out/.test(err.message))) {
        post('/api/abort', { id: plan.id, token: plan.token }).catch(function () {});
      }
      busy = false;
      submit.disabled = false;
      form.classList.remove('is-uploading');
      prog.classList.remove('on');
      files.forEach(function (f) { if (f.el) f.el.classList.remove('done'); });
      var msg = err && err.server ? err.message : 'The upload stopped (' + (err && err.message || 'network error') + '). Check your connection and press Send Your Plans again, or call (559) 392-0743.';
      showError(msg);
    });
  });
})();
