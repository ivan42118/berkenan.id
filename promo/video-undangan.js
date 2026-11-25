/*
 * Video undangan 15 detik: merekam undangan pelanggan (iframe) — sampul, buka undangan,
 * lalu bergulir ke profil, hitung mundur, dan acara — ditutup tautan undangan.
 * Semua gerak dihitung dari waktu t di seek(t) supaya render frame demi frame mulus.
 */
(function () {
  'use strict';
  var B = window.BRAND || {};
  var Q = new URLSearchParams(location.search);
  var RENDER = Q.get('render') === '1';
  var slug = (Q.get('u') || '').toLowerCase().trim();
  var tamu = Q.get('to') || 'Keluarga & Sahabat';
  var S = 2.88; // 375 px → 1080 px
  var T = { ketuk: 3.3, buka: 3.75, gulir: 5.2, diam: 0.25, langkah: 2.0, gerak: 0.65, akhir: 12.4, selesai: 15 };
  window.DURASI = T.selesai;
  var HENTI = ['#profil', '.hitung-bagian', '#acara'];
  var $ = function (id) { return document.getElementById(id); };
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function p(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function inOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function out(x) { return 1 - Math.pow(1 - x, 3); }
  function tidur(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function bingkai() { return new Promise(function (r) { requestAnimationFrame(function () { r(); }); }); }

  if (!/^[a-z0-9-]{1,60}$/.test(slug)) { document.body.textContent = 'Tambahkan ?u=<slug undangan> di alamat halaman ini.'; return; }
  var situs = String(B.situs || location.origin).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  $('tautan').textContent = situs + '/' + slug; // link pendek undangan (folder <slug>/ di situs)
  document.querySelectorAll('[data-merek]').forEach(function (n) { n.textContent = B.nama || 'berkenan.id'; });

  var frame = document.createElement('iframe');
  frame.src = '../undangan/?u=' + encodeURIComponent(slug) + '&to=' + encodeURIComponent(tamu) + '&v=video';
  frame.setAttribute('aria-hidden', 'true');
  $('panggung').prepend(frame);

  // Jam animasi undangan dikendalikan manual (lihat promo/video.js).
  var lihat = new WeakMap();
  function kendalikan(ms) {
    var doc = frame.contentDocument;
    if (!doc || !doc.getAnimations) return;
    doc.getAnimations().forEach(function (a) {
      var awal = lihat.get(a);
      if (awal === undefined) { awal = ms; lihat.set(a, awal); }
      var target = a.effect && a.effect.target;
      var cepat = ('transitionProperty' in a) && target && target.classList && target.classList.contains('muncul') ? 2 : 1;
      a.pause();
      a.currentTime = Math.max(0, ms - awal) * cepat;
    });
  }

  var sudahKlik = false;
  function seekSinkron(t) {
    var doc = frame.contentDocument, win = frame.contentWindow;
    if (!doc || !win) return;
    var tombol = doc.querySelector('.tombol-buka'), ketuk = $('ketuk');
    if (tombol && !sudahKlik) {
      var r = tombol.getBoundingClientRect();
      ketuk.style.left = ((r.left + r.width / 2) * S) + 'px';
      ketuk.style.top = ((r.top + r.height / 2) * S) + 'px';
    }
    var k = p(t, T.ketuk, T.ketuk + 0.6);
    ketuk.style.opacity = t >= T.ketuk && t < T.ketuk + 0.6 ? ((k < 0.3 ? k / 0.3 : 1 - (k - 0.3) / 0.7) * 0.9).toFixed(3) : '0';
    ketuk.style.transform = 'scale(' + (0.45 + 1.1 * out(k)).toFixed(3) + ')';
    if (t >= T.buka && !sudahKlik && tombol) { sudahKlik = true; tombol.click(); }

    // Gulir ke bagian penting
    if (sudahKlik && t >= T.gulir) {
      var maks = doc.scrollingElement.scrollHeight - win.innerHeight;
      var titik = [0];
      HENTI.forEach(function (sel) {
        var el = doc.querySelector(sel);
        titik.push(el ? Math.min(maks, Math.max(0, el.getBoundingClientRect().top + win.scrollY - 20)) : titik[titik.length - 1]);
      });
      var mulai = T.gulir + T.diam, y = 0;
      if (t >= mulai) {
        var i = Math.floor((t - mulai) / T.langkah);
        if (i >= HENTI.length) y = titik[HENTI.length];
        else y = titik[i] + (titik[i + 1] - titik[i]) * inOut(clamp((t - mulai - i * T.langkah) / T.gerak, 0, 1));
      }
      win.scrollTo({ top: Math.round(y), behavior: 'instant' });
    }
    var a = out(p(t, T.akhir, T.akhir + 0.7));
    $('akhir').style.opacity = a.toFixed(3);
    $('akhir').style.transform = 'translateY(' + (60 * (1 - a)).toFixed(1) + 'px)';
  }

  window.seek = function (t) {
    seekSinkron(t);
    if (!RENDER) { kendalikan(t * 1000); return Promise.resolve(); }
    return bingkai().then(bingkai).then(function () { return tidur(0); }).then(function () { kendalikan(t * 1000); });
  };

  function sampai(cek, batas) {
    var mulai = Date.now();
    return new Promise(function (res) { (function ulang() { if (cek() || Date.now() - mulai > (batas || 20000)) res(); else setTimeout(ulang, 120); })(); });
  }
  function muatGambar(url) { return new Promise(function (res) { var g = new Image(); g.onload = g.onerror = function () { res(); }; g.src = url; setTimeout(res, 15000); }); }
  function fotoDi(doc) {
    var url = [];
    doc.querySelectorAll('[style]').forEach(function (n) {
      var s = n.getAttribute('style') || '', m, re = /url\(["']?([^"')]+)["']?\)/g;
      while ((m = re.exec(s))) url.push(m[1]);
    });
    doc.querySelectorAll('img').forEach(function (img) { img.loading = 'eager'; if (img.currentSrc || img.src) url.push(img.currentSrc || img.src); });
    return url.filter(function (u, i, arr) { return arr.indexOf(u) === i; });
  }

  if (!RENDER) {
    var pas = function () { var k = Math.min(innerWidth / 1080, innerHeight / 1920); $('panggung').style.transform = 'scale(' + k + ')'; };
    pas(); addEventListener('resize', pas);
  }
  sampai(function () { var d = frame.contentDocument; return d && d.getElementById('sampul') && d.querySelector('.isi'); })
    .then(function () { return frame.contentDocument.fonts.ready; })
    .then(function () { return Promise.all(fotoDi(frame.contentDocument).map(muatGambar)); })
    .then(function () { return document.fonts.load('600 46px Jost'); })
    .then(function () { return tidur(RENDER ? 1500 : 300); })
    .then(function () {
      kendalikan(0);
      window.siap = true;
      if (RENDER) return;
      var t0 = null;
      (function putar(ts) {
        if (t0 === null) t0 = ts;
        var t = (ts - t0) / 1000;
        window.seek(Math.min(t, T.selesai));
        if (t < T.selesai) requestAnimationFrame(putar);
      })(performance.now());
    });
})();
