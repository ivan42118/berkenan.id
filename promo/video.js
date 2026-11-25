/*
 * Animasi video promo. Semua yang bergerak dihitung dari waktu t (detik) di fungsi seek(t),
 * termasuk animasi CSS di dalam undangan (iframe), supaya render frame demi frame hasilnya mulus.
 *  - Pratinjau  : buka promo/video.html di browser (diputar sekali; muat ulang untuk mengulang).
 *  - Render MP4 : node promo/render.mjs   (memanggil seek(t) untuk setiap frame)
 */
(function () {
  'use strict';
  var B = window.BRAND || {};
  var Q = new URLSearchParams(location.search);
  var RENDER = Q.get('render') === '1';
  var W = 1080, H = 1920;
  var S = 1.36;                       // samakan dengan --s di video.css
  var LW = 375 * S;                   // lebar layar HP di panggung

  // ---------- Data dari config.js ----------
  var paket = Array.isArray(B.paket) ? B.paket : [];
  var hargaMin = paket.length ? Math.min.apply(null, paket.map(function (x) { return Number(x.harga) || 0; })) : 99000;
  var wa = String(B.whatsapp || '').replace(/\D/g, '');
  var waRapi = wa.replace(/^62/, '0').replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3');
  var situs = String(B.situs || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
  var semuaTema = (Array.isArray(B.tema) && B.tema.length) ? B.tema : [{ id: 'maroon', nama: 'Maroon Romance', kategori: 'pernikahan', demo: 'demo-maroon' }];
  var NAMA_KATEGORI = { pernikahan: 'Pernikahan', khitan: 'Khitan', ulangtahun: 'Ulang Tahun', acara: 'Acara' };

  function isi(sel, teks) { document.querySelectorAll(sel).forEach(function (n) { n.textContent = teks; }); }
  isi('[data-harga-rb]', 'Rp ' + Math.round(hargaMin / 1000) + 'rb');
  isi('[data-harga-penuh]', 'Rp ' + hargaMin.toLocaleString('id-ID'));
  isi('[data-waktu]', B.waktuPengerjaan || '1×24 jam');
  isi('[data-brand]', B.nama || 'Undangan');
  isi('[data-tagline]', B.tagline || 'Undangan Digital');
  isi('[data-wa]', waRapi || '-');
  isi('[data-situs]', situs);
  isi('[data-jumlah-tema]', String(semuaTema.length));

  // ---------- Alat bantu ----------
  function $(id) { return document.getElementById(id); }
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function p(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  var E = {
    out: function (x) { return 1 - Math.pow(1 - x, 3); },
    in: function (x) { return x * x * x; },
    inOut: function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    back: function (x) { var c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  };
  function atur(el, opasitas, transform) {
    el.style.opacity = opasitas.toFixed(3);
    el.style.visibility = opasitas <= 0.002 ? 'hidden' : 'visible';
    el.style.transform = transform || 'none';
  }
  // Masuk dari bawah (naik + pudar), keluar ke atas.
  function tampil(el, t, masuk, keluar, o) {
    o = o || {};
    var dur = o.dur || 0.5, dy = o.dy == null ? 50 : o.dy;
    var a = p(t, masuk, masuk + dur), b = keluar == null ? 0 : p(t, keluar, keluar + 0.35);
    var y = dy * (1 - E.out(a)) - 60 * E.in(b);
    var sk = o.pop ? 0.82 + 0.18 * E.back(a) : 1;
    atur(el, Math.min(E.out(a), 1 - b), 'translateY(' + y.toFixed(1) + 'px) scale(' + sk.toFixed(4) + ')');
    return a;
  }
  function campur(c1, c2, k) {
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * k);
    var g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * k);
    var bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * k);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  function tidur(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function bingkai() { return new Promise(function (r) { requestAnimationFrame(function () { r(); }); }); }

  // ---------- Posisi elemen ----------
  var POS = { h1a: 640, h1b: 735, h1c: 930, h1d: 1095, cap2: 168, cap3: 168, cap4: 168,
    s5a: 470, s5b: 528, s5c: 792, s5d: 905, s6a: 285, s6b: 640, s6c: 822, s6d: 888, s6e: 1000, s6f: 1215 };
  // Logo (ikon amplop versi emas) di adegan penutup
  if (window.svgIkonBerkenan) $('ikon-akhir').innerHTML = svgIkonBerkenan('gelap', 340);
  Object.keys(POS).forEach(function (k) { $(k).style.top = POS[k] + 'px'; });

  // ---------- Linimasa (detik) ----------
  var T = {
    hpMasuk: 2.85, cap2: 3.25, gantiNama: [3.45, 4.75, 6.05], ketuk: 7.15, buka: 7.4,
    s3: 8.65, diam: 0.35, langkah: 1.05, gerak: 0.5,
    s4: 15.6, slot: 1.2, geser: 0.42,
    s5: 22.8, s6: 27.0, akhir: 31.5
  };
  window.DURASI = T.akhir;

  var NAMA_TAMU = ['Bapak Andi Wijaya', 'Ibu Sari & Keluarga', 'Mas Dimas Pratama'];
  var TAMU_TEMA = { moss: 'Rina & Pasangan', vintage: 'Keluarga Bapak Hadi', gold: 'Bapak & Ibu Hartono',
    islami: 'Bapak Ahmad Fauzi', ceria: 'Adik Kayla', modern: 'Rekan Alumni 2012' };
  var WARNA = {
    maroon: ['#2a0911', '#6b1c2b'], moss: ['#111a11', '#3f5339'], vintage: ['#2b1f15', '#7d5d3d'],
    gold: ['#050504', '#3a2f1c'], islami: ['#031c17', '#135447'], ceria: ['#2c2150', '#93507f'],
    modern: ['#0a1222', '#24375c'], akhir: ['#16070b', '#4d1724']
  };
  var HENTI = [
    { sel: '#profil', label: 'Profil mempelai' },
    { sel: '.hitung-bagian', label: 'Hitung mundur acara' },
    { sel: '#acara', label: 'Waktu, tempat & Google Maps' },
    { sel: '#galeri', label: 'Galeri foto · Premium' },
    { sel: '#rsvp', label: 'RSVP & ucapan · Premium' },
    { sel: '#amplop', label: 'Amplop digital' }
  ];

  // ---------- Undangan di dalam HP (iframe) ----------
  var layar = document.querySelector('.layar');
  function buatFrame(tema, namaTamu) {
    var f = document.createElement('iframe');
    f.src = '../undangan/?u=' + encodeURIComponent(tema.demo) + '&to=' + encodeURIComponent(namaTamu) + '&v=promo';
    f.tabIndex = -1;
    f.setAttribute('aria-hidden', 'true');
    layar.insertBefore(f, layar.firstChild);
    return { tema: tema, el: f, lihat: new WeakMap() };
  }
  var utama = buatFrame(semuaTema[0], NAMA_TAMU[0]);
  var putaran = semuaTema.slice(1).map(function (t) { return buatFrame(t, TAMU_TEMA[t.id] || 'Tamu Undangan'); });
  var semuaFrame = [utama].concat(putaran);

  // Hentikan jam animasi undangan dan setel manual: tiap animasi dihitung sejak pertama kali terlihat.
  // Efek muncul saat digulir dipercepat, karena di video tiap bagian hanya tampil sekitar setengah detik.
  var CEPAT_MUNCUL = 2.2;
  function kendalikan(fr, ms) {
    var doc = fr.el.contentDocument;
    if (!doc || !doc.getAnimations) return;
    doc.getAnimations().forEach(function (a) {
      var awal = fr.lihat.get(a);
      if (awal === undefined) { awal = ms; fr.lihat.set(a, awal); }
      var target = a.effect && a.effect.target;
      var cepat = ('transitionProperty' in a) && target && target.classList && target.classList.contains('muncul') ? CEPAT_MUNCUL : 1;
      a.pause();
      a.currentTime = Math.max(0, ms - awal) * cepat;
    });
  }

  // ---------- Kilau emas (partikel) ----------
  var kanvas = $('kilau'), ctx = kanvas.getContext('2d');
  function acak(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var r = Math.imul(seed ^ seed >>> 15, 1 | seed); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  var rnd = acak(20261125), BUTIR = [];
  for (var i = 0; i < 85; i++) BUTIR.push({ x: rnd() * W, y: rnd() * H, v: 16 + rnd() * 46, r: 1.2 + rnd() * 3.4, f: rnd() * 6.283, w: 1.2 + rnd() * 2.6, goy: 8 + rnd() * 28 });
  function gambarKilau(t, kuat) {
    ctx.clearRect(0, 0, W, H);
    if (kuat <= 0) return;
    BUTIR.forEach(function (b) {
      var y = ((b.y - b.v * t) % H + H) % H, x = b.x + Math.sin(t * 0.5 + b.f) * b.goy;
      var a = kuat * (0.12 + 0.6 * (0.5 + 0.5 * Math.sin(t * b.w + b.f)));
      ctx.globalAlpha = a * 0.22; ctx.fillStyle = '#f3d9a0';
      ctx.beginPath(); ctx.arc(x, y, b.r * 3.2, 0, 6.283); ctx.fill();
      ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.283); ctx.fill();
      if (b.r > 3.6) {
        ctx.strokeStyle = '#f8e6bb'; ctx.lineWidth = 1.4; ctx.globalAlpha = a * 0.8;
        ctx.beginPath(); ctx.moveTo(x - b.r * 4, y); ctx.lineTo(x + b.r * 4, y); ctx.moveTo(x, y - b.r * 4); ctx.lineTo(x, y + b.r * 4); ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;
  }

  // ---------- Status adegan yang hanya berjalan maju ----------
  var sudahKlik = false, namaAktif = 0, labelTampil = { pil3: -1, pil4: -1 };

  function frameUtama(t) {
    var doc = utama.el.contentDocument, win = utama.el.contentWindow;
    if (!doc || !win) return { y: 0, idx: 0 };
    // Ganti nama tamu di sampul
    var n = 0;
    T.gantiNama.forEach(function (g, k) { if (t >= g) n = k; });
    var namaEl = doc.querySelector('.nama-tamu'), kartu = doc.querySelector('.kartu-tamu');
    if (namaEl && n !== namaAktif) { namaEl.textContent = NAMA_TAMU[n]; namaAktif = n; }
    if (kartu) {
      var tg = T.gantiNama[n], q = p(t, tg, tg + 0.6);
      var denyut = t >= tg && t < T.buka ? Math.sin(Math.PI * q) : 0;
      kartu.style.transform = 'scale(' + (1 + 0.05 * denyut).toFixed(4) + ')';
      kartu.style.boxShadow = denyut > 0 ? '0 0 0 ' + (4 * denyut).toFixed(1) + 'px rgba(236,201,138,' + (0.85 * denyut).toFixed(2) + '), 0 0 ' + (40 * denyut).toFixed(0) + 'px rgba(236,201,138,' + (0.6 * denyut).toFixed(2) + ')' : '';
    }
    // Ketuk tombol "Buka Undangan"
    var tombol = doc.querySelector('.tombol-buka'), ketuk = $('ketuk');
    if (tombol && !sudahKlik) {
      var r = tombol.getBoundingClientRect();
      ketuk.style.left = ((r.left + r.width / 2) * S).toFixed(1) + 'px';
      ketuk.style.top = ((r.top + r.height / 2) * S).toFixed(1) + 'px';
      var tekan = p(t, T.ketuk, T.ketuk + 0.25);
      tombol.style.transform = 'scale(' + (1 - 0.06 * Math.sin(Math.PI * tekan)).toFixed(4) + ')';
    }
    var k1 = p(t, T.ketuk, T.ketuk + 0.65);
    atur(ketuk, t >= T.ketuk ? (k1 < 0.25 ? k1 / 0.25 : 1 - (k1 - 0.25) / 0.75) * 0.9 : 0, 'scale(' + (0.45 + 1.1 * E.out(k1)).toFixed(3) + ')');
    if (t >= T.buka && !sudahKlik && tombol) {
      sudahKlik = true; tombol.style.transform = ''; tombol.click();
      // Isian nama di form RSVP ikut nama tamu terakhir yang tampil di sampul.
      doc.querySelectorAll('input').forEach(function (i) { if (i.value === NAMA_TAMU[0]) i.value = NAMA_TAMU[namaAktif]; });
    }

    // Gulir isi undangan
    if (!sudahKlik || t < T.s3) return { y: 0, idx: 0 };
    var maks = doc.scrollingElement.scrollHeight - win.innerHeight;
    var titik = [0];
    HENTI.forEach(function (h) {
      var el = doc.querySelector(h.sel);
      titik.push(el ? Math.min(maks, Math.max(0, el.getBoundingClientRect().top + win.scrollY)) : titik[titik.length - 1]);
    });
    var mulai = T.s3 + T.diam, y = 0, idx = 0;
    if (t >= mulai) {
      var k = Math.floor((t - mulai) / T.langkah);
      if (k >= HENTI.length) { y = titik[HENTI.length]; idx = HENTI.length; }
      else {
        var q2 = E.inOut(clamp((t - mulai - k * T.langkah) / T.gerak, 0, 1));
        y = titik[k] + (titik[k + 1] - titik[k]) * q2;
        idx = k + 1;
      }
    }
    win.scrollTo({ top: Math.round(y), behavior: 'instant' });
    return { y: y, idx: idx };
  }

  function seekSinkron(t) {
    // Latar
    var pasang = WARNA.maroon, n = putaran.length;
    if (t >= T.s4 && t < T.s5) {
      var k = Math.min(n - 1, Math.floor((t - T.s4) / T.slot));
      var dari = k === 0 ? WARNA.maroon : (WARNA[putaran[k - 1].tema.id] || WARNA.maroon);
      var ke = WARNA[putaran[k].tema.id] || WARNA.maroon;
      var q = E.inOut(p(t, T.s4 + k * T.slot, T.s4 + k * T.slot + T.geser));
      pasang = [campur(dari[0], ke[0], q), campur(dari[1], ke[1], q)];
    } else if (t >= T.s5) {
      var terakhir = n ? (WARNA[putaran[n - 1].tema.id] || WARNA.maroon) : WARNA.maroon, q5 = E.inOut(p(t, T.s5, T.s5 + 0.8));
      pasang = [campur(terakhir[0], WARNA.akhir[0], q5), campur(terakhir[1], WARNA.akhir[1], q5)];
    } else {
      pasang = [campur(WARNA.maroon[0], WARNA.maroon[0], 0), campur(WARNA.maroon[1], WARNA.maroon[1], 0)];
    }
    $('latar').style.background = 'radial-gradient(130% 75% at 50% 34%, ' + pasang[1] + ' 0%, ' + pasang[0] + ' 100%)';

    // Adegan 1: hook
    tampil($('h1a'), t, 0.08, 2.8);
    tampil($('h1b'), t, 0.55, 2.83);
    var redup = 1 - 0.5 * E.out(p(t, 1.55, 1.95)); // baris masalah meredup saat solusinya muncul
    ['h1a', 'h1b'].forEach(function (id) { $(id).style.opacity = (parseFloat($(id).style.opacity) * redup).toFixed(3); });
    tampil($('h1c'), t, 1.6, 2.86, { pop: true, dur: 0.55 });
    tampil($('h1d'), t, 2.0, 2.9, { pop: true, dur: 0.45 });

    // HP masuk, mengambang, lalu keluar
    var hp = $('hp');
    var masuk = E.out(p(t, T.hpMasuk, T.hpMasuk + 0.85)), keluar = E.inOut(p(t, T.s5, T.s5 + 0.6));
    var apung = Math.sin(t * 1.4) * 6;
    var hpY = 1500 * (1 - masuk) + 520 * keluar + apung;
    var hpR = 7 * (1 - masuk);
    atur(hp, t < T.hpMasuk ? 0 : Math.min(1, masuk * 1.6) * (1 - keluar), 'translateY(' + hpY.toFixed(1) + 'px) rotate(' + hpR.toFixed(2) + 'deg) scale(' + (1 - 0.1 * keluar).toFixed(4) + ')');
    $('cahaya').style.opacity = (masuk * (1 - keluar)).toFixed(3);

    // Keterangan
    tampil($('cap2'), t, T.cap2, T.s3 - 0.3);
    tampil($('cap3'), t, T.s3, T.s4 - 0.25);
    tampil($('cap4'), t, T.s4, T.s5 - 0.2);

    // Frame undangan yang terlihat + posisinya
    var aktif = [];
    if (t >= T.hpMasuk && t < T.s4 + T.geser) {
      aktif.push({ fr: utama, lokal: t - T.hpMasuk, x: -LW * E.inOut(p(t, T.s4, T.s4 + T.geser)), z: 1 });
    }
    putaran.forEach(function (fr, k) {
      var a = T.s4 + k * T.slot;
      var akhir = k === n - 1 ? T.s5 + 0.7 : a + T.slot + T.geser;
      if (t < a || t >= akhir) return;
      var m = E.inOut(p(t, a, a + T.geser));
      var kel = k < n - 1 ? E.inOut(p(t, a + T.slot, a + T.slot + T.geser)) : 0;
      aktif.push({ fr: fr, lokal: t - a + 0.6, x: LW * (1 - m) - LW * kel, z: 2 + k });
    });
    semuaFrame.forEach(function (fr) {
      var ada = aktif.filter(function (x) { return x.fr === fr; })[0];
      fr.el.style.visibility = ada ? 'visible' : 'hidden';
      if (ada) { fr.el.style.transform = 'translateX(' + ada.x.toFixed(1) + 'px) scale(' + S + ')'; fr.el.style.zIndex = ada.z; }
    });

    // Label fitur (adegan 3) & tema (adegan 4)
    return aktif;
  }

  function labelFitur(t, info) {
    // Label berganti di tengah gerakan, saat isi bagian berikutnya mulai terlihat di HP.
    var pil = $('pil3');
    var awalLabel = T.s3 + T.diam + T.gerak * 0.5;
    var idx = t < awalLabel ? 0 : Math.min(HENTI.length, Math.floor((t - awalLabel) / T.langkah) + 1);
    if (idx >= 1 && labelTampil.pil3 !== idx) { pil.textContent = HENTI[idx - 1].label; labelTampil.pil3 = idx; }
    var mulaiLabel = awalLabel + (Math.max(1, idx) - 1) * T.langkah;
    var a = idx >= 1 ? p(t, mulaiLabel, mulaiLabel + 0.35) : 0;
    // Label pertama muncul memudar; label berikutnya langsung berganti dengan efek "pop" (tanpa berkedip).
    atur(pil, idx < 1 ? 0 : idx === 1 ? E.out(a) : 1, 'scale(' + (0.86 + 0.14 * E.back(a)).toFixed(4) + ')');
    pil.style.display = 'inline-flex';

    var n = putaran.length;
    var awal4 = T.s4 + T.geser * 0.5;
    if (t >= awal4 && n) {
      var k = Math.min(n - 1, Math.floor((t - awal4) / T.slot));
      if (labelTampil.pil4 !== k) {
        var tm = putaran[k].tema;
        $('kat4').textContent = NAMA_KATEGORI[tm.kategori] || tm.kategori || '';
        $('nama4').textContent = tm.nama;
        labelTampil.pil4 = k;
      }
      var a4 = p(t, awal4 + k * T.slot, awal4 + k * T.slot + 0.35);
      atur($('pil4'), k === 0 ? E.out(a4) : 1, 'scale(' + (0.86 + 0.14 * E.back(a4)).toFixed(4) + ')');
    } else {
      atur($('pil4'), 0);
    }
  }

  function adeganAkhir(t) {
    tampil($('s5a'), t, T.s5 + 0.2, T.s6 - 0.3);
    tampil($('s5b'), t, T.s5 + 0.35, T.s6 - 0.28, { pop: true, dur: 0.6 });
    tampil($('s5c'), t, T.s5 + 0.55, T.s6 - 0.26);
    var ul = $('s5d');
    tampil(ul, t, T.s5 + 0.7, T.s6 - 0.24, { dy: 0, dur: 0.2 });
    ul.querySelectorAll('li').forEach(function (li, k) {
      var a = p(t, T.s5 + 0.85 + k * 0.32, T.s5 + 1.3 + k * 0.32);
      li.style.opacity = E.out(a).toFixed(3);
      li.style.transform = 'translateX(' + (-70 * (1 - E.out(a))).toFixed(1) + 'px)';
    });

    tampil($('s6a'), t, T.s6, null, { pop: true, dur: 0.7 });
    tampil($('s6b'), t, T.s6 + 0.25, null, { dur: 0.6 });
    tampil($('s6c'), t, T.s6 + 0.4, null);
    tampil($('s6d'), t, T.s6 + 0.6, null);
    var a6 = tampil($('s6e'), t, T.s6 + 0.85, null, { pop: true, dur: 0.6 });
    if (a6 >= 1) $('s6e').style.transform = 'scale(' + (1 + 0.025 * Math.sin((t - T.s6 - 1.45) * 4.2)).toFixed(4) + ')';
    tampil($('s6f'), t, T.s6 + 1.15, null);
  }

  // Satu frame. Saat render: tunggu sebentar supaya IntersectionObserver di undangan sempat memunculkan elemen.
  window.seek = function (t) {
    var aktif = seekSinkron(t);
    var info = frameUtama(t);
    labelFitur(t, info);
    adeganAkhir(t);
    var kuat = t < T.hpMasuk + 0.5 ? 1 : t >= T.s5 ? 1 : 0.55;
    gambarKilau(t, kuat);
    function setelJam() { aktif.forEach(function (x) { kendalikan(x.fr, x.lokal * 1000); }); }
    if (!RENDER) { setelJam(); return Promise.resolve(); }
    return bingkai().then(bingkai).then(function () { return tidur(0); }).then(setelJam);
  };

  // ---------- Persiapan: tunggu undangan, font, dan foto siap ----------
  function sampai(cek, batas) {
    var mulai = Date.now();
    return new Promise(function (res) {
      (function ulang() { if (cek() || Date.now() - mulai > (batas || 20000)) res(); else setTimeout(ulang, 120); })();
    });
  }
  function muatGambar(url) {
    return new Promise(function (res) { var g = new Image(); g.onload = g.onerror = function () { res(); }; g.src = url; setTimeout(res, 15000); });
  }
  function fotoDi(doc) {
    var url = [];
    doc.querySelectorAll('[style]').forEach(function (n) {
      var s = n.getAttribute('style') || '', m, re = /url\(["']?([^"')]+)["']?\)/g;
      while ((m = re.exec(s))) url.push(m[1]);
    });
    doc.querySelectorAll('img').forEach(function (img) { img.loading = 'eager'; if (img.currentSrc || img.src) url.push(img.currentSrc || img.src); });
    return url.filter(function (u, i, a) { return a.indexOf(u) === i; });
  }
  function siapkan() {
    var tunggu = semuaFrame.map(function (fr) {
      return sampai(function () { var d = fr.el.contentDocument; return d && d.getElementById('sampul') && d.querySelector('.isi'); })
        .then(function () { return fr.el.contentDocument.fonts.ready; })
        .then(function () { return Promise.all(fotoDi(fr.el.contentDocument).map(muatGambar)); });
    });
    var font = ['600 60px Jost', '700 98px Jost', '500 34px Jost', '400 38px Jost', 'italic 600 120px "Cormorant Garamond"'].map(function (f) { return document.fonts.load(f); });
    return Promise.all(tunggu.concat(font)).then(function () { return document.fonts.ready; })
      .then(function () { return tidur(RENDER ? 1500 : 300); })
      .then(function () { semuaFrame.forEach(function (fr) { kendalikan(fr, 0); }); window.siap = true; });
  }

  // Pratinjau di browser: skala panggung agar muat di layar, lalu putar sekali.
  if (!RENDER) {
    var pas = function () { var k = Math.min(innerWidth / W, innerHeight / H); $('panggung').style.transform = 'scale(' + k + ')'; };
    pas(); addEventListener('resize', pas);
  }
  window.seek(0);
  siapkan().then(function () {
    if (RENDER) return;
    var mulaiDari = Number(Q.get('t')) || 0, t0 = null;
    (function putar(ts) {
      if (t0 === null) t0 = ts;
      var t = mulaiDari + (ts - t0) / 1000;
      window.seek(Math.min(t, T.akhir));
      if (t < T.akhir) requestAnimationFrame(putar);
    })(performance.now());
  });
})();
