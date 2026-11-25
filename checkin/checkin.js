/*
 * Halaman penerima tamu (QR check-in).
 * - Scan QR undangan (BKN1|slug|kode|nama) memakai kamera HP/laptop, tanpa aplikasi.
 * - Kehadiran tersimpan di HP ini (tetap jalan tanpa sinyal) dan, bila rsvpEndpoint di config.js
 *   terisi, dikirim ke Google Sheet serta disinkronkan antar-HP penerima tamu.
 * - Mode "Layar sambutan" untuk laptop/TV di pintu masuk.
 */
(function () {
  'use strict';
  var B = window.BRAND || {};
  var Q = new URLSearchParams(location.search);
  var slug = (Q.get('u') || '').toLowerCase().trim();
  var endpoint = String(B.rsvpEndpoint || '').trim();
  var JSQR_LIB = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
  var $ = function (id) { return document.getElementById(id); };

  // SAMAKAN dengan kodeTamu di undangan/undangan.js
  function kodeTamu(slugAcara, nama) {
    var s = String(slugAcara) + '|' + String(nama).replace(/\s+/g, ' ').trim().toLowerCase();
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    var abjad = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ', k = '';
    for (var j = 0; j < 6; j++) { k += abjad[h % 32]; h = Math.floor(h / 32); }
    return k;
  }
  function el(tag, kelas, teks) {
    var n = document.createElement(tag);
    if (kelas) n.className = kelas;
    if (teks != null) n.textContent = teks;
    return n;
  }
  function jam(t) { return new Date(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }
  function rapi(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

  if (!/^[a-z0-9-]{1,60}$/.test(slug)) {
    $('judul').textContent = 'Link belum lengkap';
    $('layar-mulai').querySelector('p').textContent = 'Buka halaman ini dari link penerima tamu, misalnya …/checkin/?u=nama-acara';
    $('mulai').hidden = true;
    return;
  }

  /* ---------- Data kehadiran (tersimpan di HP ini) ---------- */
  var KUNCI = 'checkin:' + slug;
  var daftar = (function () {
    try { var v = JSON.parse(localStorage.getItem(KUNCI) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  })();
  function simpan() { try { localStorage.setItem(KUNCI, JSON.stringify(daftar)); } catch (e) { /* penyimpanan penuh */ } }
  function cari(kode) { return daftar.filter(function (x) { return x.kode === kode; })[0]; }
  function catat(kode, nama, cara) {
    var it = { kode: kode, nama: nama, waktu: Date.now(), cara: cara, terkirim: false };
    daftar.push(it);
    simpan();
    perbaruiRingkas();
    kirimAntrian();
    return it;
  }

  /* ---------- Judul acara ---------- */
  var judul = slug;
  function judulAcara(d) {
    if (!d) return '';
    var t = function (s) { return rapi(s); };
    if (d.pria && d.wanita && (t(d.pria.panggilan) || t(d.wanita.panggilan))) return t(d.pria.panggilan) + ' & ' + t(d.wanita.panggilan);
    if (t(d.namaAcara)) return t(d.namaAcara);
    if (d.tokoh && t(d.tokoh.panggilan)) return t(d.tokoh.panggilan);
    return t(d.judul);
  }
  fetch('../undangan/data/' + slug + '.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { judul = judulAcara(d) || slug; tulisJudul(); })
    .catch(tulisJudul);
  function tulisJudul() { $('judul').textContent = judul; $('sb-acara').textContent = judul; document.title = 'Penerima Tamu · ' + judul; }

  /* ---------- Kamera & pemindaian ---------- */
  var video = $('video'), stream = null, hadapan = 'environment', jalan = false, jeda = false;
  var detektor = null, terakhir = { teks: '', t: 0 }, wakeLock = null;
  var kanvas = document.createElement('canvas'), ctx = kanvas.getContext('2d', { willReadFrequently: true });
  var skripDimuat = {};
  function muatSkrip(url) {
    if (!skripDimuat[url]) {
      skripDimuat[url] = new Promise(function (ok, gagal) {
        var s = document.createElement('script');
        s.src = url; s.async = true; s.crossOrigin = 'anonymous';
        s.onload = ok; s.onerror = function () { delete skripDimuat[url]; gagal(new Error('pembaca-qr')); };
        document.head.append(s);
      });
    }
    return skripDimuat[url];
  }
  function siapkanDetektor() {
    if (detektor || !('BarcodeDetector' in window)) return Promise.resolve();
    return window.BarcodeDetector.getSupportedFormats()
      .then(function (f) { if (f.indexOf('qr_code') >= 0) detektor = new window.BarcodeDetector({ formats: ['qr_code'] }); })
      .catch(function () {});
  }
  function pesanGalat(err) {
    var n = err && err.name;
    if (err && err.message === 'pembaca-qr') return 'Pembaca QR gagal dimuat. Periksa koneksi internet, lalu coba lagi.';
    if (n === 'NotAllowedError' || n === 'SecurityError') return 'Izin kamera ditolak. Buka pengaturan situs di browser, izinkan Kamera, lalu muat ulang halaman ini.';
    if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'Kamera tidak ditemukan di perangkat ini.';
    if (n === 'NotReadableError') return 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu coba lagi.';
    return 'Kamera tidak bisa dibuka. Pakai Chrome (Android) atau Safari (iPhone) versi terbaru.';
  }
  function hentikanKamera() {
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    stream = null; jalan = false;
  }
  function mulaiKamera() {
    $('info-kamera').textContent = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      $('info-kamera').textContent = window.isSecureContext ? 'Browser ini tidak mendukung kamera. Pakai Chrome atau Safari terbaru.' : 'Kamera hanya bisa dipakai lewat alamat https://';
      return Promise.resolve();
    }
    hentikanKamera();
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: hadapan }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(function (s) { stream = s; video.srcObject = s; return video.play(); })
      .then(siapkanDetektor)
      .then(function () { return detektor ? null : muatSkrip(JSQR_LIB); })
      .then(function () {
        jalan = true;
        $('layar-mulai').hidden = true;
        $('area-kamera').hidden = false;
        jagaLayar();
        pindai();
      })
      .catch(function (err) {
        hentikanKamera();
        $('layar-mulai').hidden = false;
        $('area-kamera').hidden = true;
        $('info-kamera').textContent = pesanGalat(err);
      });
  }
  // Layar tetap menyala selama memindai (bila didukung browser).
  function jagaLayar() {
    if (!('wakeLock' in navigator) || wakeLock) return;
    navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; w.addEventListener('release', function () { wakeLock = null; }); }).catch(function () {});
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && jalan) jagaLayar(); });

  function bacaJsqr() {
    if (!window.jsQR) return null;
    var w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return null;
    var sk = Math.min(1, 720 / Math.max(w, h)), cw = Math.round(w * sk), ch = Math.round(h * sk);
    kanvas.width = cw; kanvas.height = ch;
    ctx.drawImage(video, 0, 0, cw, ch);
    var hasil = window.jsQR(ctx.getImageData(0, 0, cw, ch).data, cw, ch, { inversionAttempts: 'dontInvert' });
    return hasil ? hasil.data : null;
  }
  function pindai() {
    if (!jalan) return;
    if (jeda || video.readyState < 2) { setTimeout(pindai, 200); return; }
    var p = detektor
      ? detektor.detect(video).then(function (h) { return h && h[0] ? h[0].rawValue : null; })
      : Promise.resolve(bacaJsqr());
    p.then(function (teks) { if (teks) prosesTeks(teks); })
      .catch(function () {})
      .then(function () { setTimeout(pindai, 160); });
  }

  /* ---------- Memeriksa QR ---------- */
  function prosesTeks(teks) {
    var kini = Date.now();
    if (teks === terakhir.teks && kini - terakhir.t < 4000) return; // QR yang sama masih di depan kamera
    terakhir = { teks: teks, t: kini };
    var b = String(teks).split('|');
    if (b[0] !== 'BKN1' || b.length < 4) return tampilkan('salah', 'Bukan QR undangan', 'QR ini bukan QR check-in undangan berkenan.id.');
    var slugQr = b[1], kode = b[2], nama = rapi(b.slice(3).join('|')).slice(0, 80);
    if (slugQr !== slug) return tampilkan('salah', 'QR untuk acara lain', (nama ? nama + ' ' : '') + 'terdaftar di undangan yang berbeda.');
    if (!nama || kodeTamu(slugQr, nama) !== kode) return tampilkan('salah', 'QR tidak valid', 'Kode tidak cocok. Minta tamu membuka ulang undangannya.');
    var ada = cari(kode);
    if (ada) return tampilkan('sudah', nama, 'Sudah check-in pukul ' + jam(ada.waktu));
    var it = catat(kode, nama, 'qr');
    tampilkan('ok', nama, 'Tercatat hadir · ' + jam(it.waktu));
  }

  /* ---------- Umpan balik: kartu hasil, bunyi, getar, layar sambutan ---------- */
  var audioCtx = null, tundaHasil = null, tundaSambutan = null, modeSambutan = false;
  function bunyi(jenis) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var nada = jenis === 'ok' ? [880, 1320] : jenis === 'sudah' ? [660] : [220, 170];
      nada.forEach(function (f, i) {
        var o = audioCtx.createOscillator(), g = audioCtx.createGain(), t0 = audioCtx.currentTime + i * 0.13;
        o.type = jenis === 'salah' ? 'square' : 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(t0); o.stop(t0 + 0.14);
      });
    } catch (e) { /* tanpa suara */ }
    if (navigator.vibrate) navigator.vibrate(jenis === 'ok' ? 60 : jenis === 'sudah' ? [40, 60, 40] : [120, 60, 120]);
  }
  function tampilkan(jenis, judulHasil, ket) {
    var h = $('hasil');
    h.className = 'hasil ' + jenis;
    h.querySelector('.hasil-judul').textContent = judulHasil;
    h.querySelector('.hasil-ket').textContent = ket;
    h.hidden = false;
    bunyi(jenis);
    jeda = true;
    clearTimeout(tundaHasil);
    tundaHasil = setTimeout(function () { jeda = false; }, 2200);
    if (modeSambutan) sambut(jenis, judulHasil, ket);
  }
  function sambut(jenis, nama, ket) {
    var isi = $('sb-isi');
    if (jenis === 'salah') {
      isi.className = 'sb-isi tampil salah';
      isi.querySelector('.sb-kecil').textContent = 'Mohon maaf';
      $('sb-nama').textContent = nama;
      $('sb-ket').textContent = 'Silakan menuju meja penerima tamu.';
    } else {
      isi.className = 'sb-isi tampil';
      isi.querySelector('.sb-kecil').textContent = jenis === 'sudah' ? 'Selamat datang kembali' : 'Selamat datang';
      $('sb-nama').textContent = nama;
      $('sb-ket').textContent = 'Terima kasih telah berkenan hadir';
    }
    $('sb-petunjuk').hidden = true;
    clearTimeout(tundaSambutan);
    tundaSambutan = setTimeout(function () { isi.className = 'sb-isi'; $('sb-petunjuk').hidden = false; }, 6000);
  }
  function bukaSambutan() {
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* tanpa suara */ }
    modeSambutan = true;
    $('sambutan').hidden = false;
    $('sb-video').append($('wadah-video'));
    var root = document.documentElement;
    if (root.requestFullscreen) root.requestFullscreen().catch(function () {});
    if (!jalan) mulaiKamera();
  }
  function tutupSambutan() {
    modeSambutan = false;
    $('sambutan').hidden = true;
    $('area-kamera').prepend($('wadah-video'));
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
  }

  /* ---------- Ringkasan, daftar hadir, tambah manual ---------- */
  function perbaruiRingkas() {
    $('jumlah-hadir').textContent = daftar.length;
    if (!$('panel-daftar').hidden) tulisDaftar();
    if (!$('panel-manual').hidden) tulisSaran();
    perbaruiStatus();
  }
  function tulisDaftar() {
    var q = rapi($('cari').value).toLowerCase(), ul = $('daftar-hadir');
    ul.textContent = '';
    var hasil = daftar.slice().sort(function (a, b) { return b.waktu - a.waktu; })
      .filter(function (x) { return !q || x.nama.toLowerCase().indexOf(q) >= 0; });
    if (!hasil.length) { ul.append(el('li', 'kosong', daftar.length ? 'Tidak ada nama yang cocok.' : 'Belum ada tamu yang check-in.')); return; }
    hasil.forEach(function (x) {
      var li = el('li');
      li.append(el('span', 'd-nama', x.nama), el('span', 'd-jam', jam(x.waktu)),
        el('span', 'd-cara', x.cara === 'manual' ? 'manual' : x.cara === 'lain' ? 'HP lain' : 'QR'));
      if (endpoint && !x.terkirim) li.append(el('span', 'd-antre', 'belum terkirim'));
      ul.append(li);
    });
  }
  function tulisSaran() {
    var q = rapi($('nama-manual').value).toLowerCase(), ul = $('saran-manual');
    ul.textContent = '';
    if (q.length < 2) return;
    daftar.filter(function (x) { return x.nama.toLowerCase().indexOf(q) >= 0; }).slice(0, 5).forEach(function (x) {
      ul.append(el('li', null, x.nama + ' · sudah hadir ' + jam(x.waktu)));
    });
  }
  function togglePanel(id) {
    ['panel-manual', 'panel-daftar'].forEach(function (p) { $(p).hidden = p !== id ? true : !$(p).hidden; });
    if (!$('panel-daftar').hidden) tulisDaftar();
    if (!$('panel-manual').hidden) { tulisSaran(); $('nama-manual').focus(); }
  }
  $('b-manual').addEventListener('click', function () { togglePanel('panel-manual'); });
  $('b-daftar').addEventListener('click', function () { togglePanel('panel-daftar'); });
  $('cari').addEventListener('input', tulisDaftar);
  $('nama-manual').addEventListener('input', tulisSaran);
  $('form-manual').addEventListener('submit', function (e) {
    e.preventDefault();
    var nama = rapi($('nama-manual').value).slice(0, 80);
    if (!nama) return;
    var kode = kodeTamu(slug, nama), ada = cari(kode);
    if (ada) tampilkan('sudah', nama, 'Sudah check-in pukul ' + jam(ada.waktu));
    else { var it = catat(kode, nama, 'manual'); tampilkan('ok', nama, 'Tercatat hadir (manual) · ' + jam(it.waktu)); }
    $('nama-manual').value = '';
    tulisSaran();
  });
  $('unduh-csv').addEventListener('click', function () {
    var sel = function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    var baris = ['Nama,Kode,Tanggal,Jam,Cara'].concat(daftar.slice().sort(function (a, b) { return a.waktu - b.waktu; }).map(function (x) {
      var t = new Date(x.waktu);
      return [sel(x.nama), sel(x.kode), sel(t.toLocaleDateString('id-ID')), sel(jam(x.waktu)), sel(x.cara)].join(',');
    }));
    var url = URL.createObjectURL(new Blob(['﻿' + baris.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url; a.download = 'kehadiran-' + slug + '.csv';
    document.body.append(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });
  $('hapus-data').addEventListener('click', function () {
    var pesan = 'Hapus ' + daftar.length + ' catatan kehadiran yang tersimpan di HP ini?' + (endpoint ? '\nData yang sudah terkirim ke Google Sheet tidak ikut terhapus.' : '\nData ini tidak bisa dikembalikan.');
    if (!confirm(pesan)) return;
    daftar = []; simpan(); perbaruiRingkas();
  });
  $('mulai').addEventListener('click', function () {
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* tanpa suara */ }
    mulaiKamera();
  });
  $('b-kamera').addEventListener('click', function () { hadapan = hadapan === 'environment' ? 'user' : 'environment'; mulaiKamera(); });
  $('b-sambutan').addEventListener('click', bukaSambutan);
  $('tutup-sambutan').addEventListener('click', tutupSambutan);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modeSambutan) tutupSambutan(); });

  /* ---------- Sinkron ke Google Sheet (bila rsvpEndpoint diisi) ---------- */
  var terakhirSinkron = 0, sedangKirim = false;
  function perbaruiStatus() {
    var s = $('status'), antre = daftar.filter(function (x) { return !x.terkirim; }).length;
    if (!endpoint) { s.textContent = 'Mode uji'; s.className = 'status uji'; return; }
    if (!navigator.onLine) { s.textContent = 'Offline' + (antre ? ' · ' + antre + ' antre' : ''); s.className = 'status offline'; return; }
    s.textContent = antre ? 'Mengirim ' + antre + '…' : 'Tersinkron';
    s.className = 'status ' + (antre ? 'offline' : 'ok');
  }
  function kirimAntrian() {
    perbaruiStatus();
    if (!endpoint || !navigator.onLine || sedangKirim) return;
    var antre = daftar.filter(function (x) { return !x.terkirim; });
    if (!antre.length) return;
    sedangKirim = true;
    Promise.all(antre.map(function (x) {
      return fetch(endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ aksi: 'checkin', slug: slug, kode: x.kode, nama: x.nama, waktu: x.waktu, cara: x.cara }) })
        .then(function () { x.terkirim = true; })
        .catch(function () { /* coba lagi nanti */ });
    })).then(function () { sedangKirim = false; simpan(); perbaruiRingkas(); });
  }
  function tarik() {
    if (!endpoint || !navigator.onLine) return;
    fetch(endpoint + (endpoint.indexOf('?') < 0 ? '?' : '&') + 'aksi=kehadiran&u=' + encodeURIComponent(slug))
      .then(function (r) { return r.json(); })
      .then(function (list) {
        if (!Array.isArray(list)) return;
        var baru = 0;
        list.forEach(function (r) {
          var kode = String(r.kode || '');
          if (!/^[A-Z0-9]{6}$/.test(kode) || cari(kode)) return;
          daftar.push({ kode: kode, nama: rapi(r.nama).slice(0, 80), waktu: Date.parse(r.waktu) || Date.now(), cara: 'lain', terkirim: true });
          baru++;
        });
        terakhirSinkron = Date.now();
        if (baru) { simpan(); }
        perbaruiRingkas();
      })
      .catch(function () {});
  }
  if (endpoint) {
    $('catatan-mode').textContent = 'Kehadiran dikirim ke Google Sheet dan disinkronkan antar-HP penerima tamu. Tanpa sinyal pun scan tetap jalan; data terkirim otomatis saat sinyal kembali.';
    tarik(); kirimAntrian();
    setInterval(function () { kirimAntrian(); tarik(); }, 10000);
    window.addEventListener('online', function () { kirimAntrian(); tarik(); });
    window.addEventListener('offline', perbaruiStatus);
  } else {
    $('catatan-mode').textContent = 'Mode uji: kehadiran hanya tersimpan di HP ini. Untuk menyatukan data beberapa HP penerima tamu ke Google Sheet, isi rsvpEndpoint di config.js.';
  }
  perbaruiRingkas();

  // Untuk pengujian dari konsol: BKNCheckin.proses('BKN1|slug|KODE|Nama')
  window.BKNCheckin = { proses: prosesTeks, kode: kodeTamu };
})();
