/*
 * Mesin template undangan v2: foto, ornamen bunga SVG, dan animasi.
 * Link undangan:  undangan/?u=<slug>&to=<nama tamu>
 * Data undangan:  undangan/data/<slug>.json   (buat lewat admin/buat-undangan.html)
 * Mode pratinjau: undangan/?preview=1  → menerima data dari admin lewat postMessage.
 */
(function () {
  'use strict';

  var BRAND = window.BRAND || {};
  var params = new URLSearchParams(location.search);
  var slug = (params.get('u') || '').toLowerCase().trim();
  var tamu = (params.get('to') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  var modePreview = params.get('preview') === '1';
  var langsungBuka = params.get('buka') === '1';
  var app = document.getElementById('app');
  var geraknyaDikurangi = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nama tema lama tetap jalan.
  var ALIAS = { sage: 'moss', emas: 'gold', putih: 'vintage' };
  var FONT = {
    maroon: 'family=Cinzel:wght@400;500&family=Pinyon+Script',
    moss: 'family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Great+Vibes',
    vintage: 'family=Bodoni+Moda:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;500&family=Pinyon+Script',
    gold: 'family=Cinzel:wght@400;500;600&family=Great+Vibes'
  };
  var TEMA_VALID = (BRAND.tema || []).map(function (t) { return t.id; });
  if (!TEMA_VALID.length) TEMA_VALID = ['maroon', 'moss', 'vintage', 'gold'];
  var ZONA = { WIB: '+07:00', WITA: '+08:00', WIT: '+09:00' };
  var TZ = { WIB: 'Asia/Jakarta', WITA: 'Asia/Makassar', WIT: 'Asia/Jayapura' };

  var timerHitung = null;
  var timerSlide = null;
  var audio = null;
  var sudahDibuka = langsungBuka;
  var pengamat = null;
  var pengamatNav = null;

  /* =========================================================
     Utilitas
     ========================================================= */

  // Teks dari data/tamu selalu lewat textContent, jadi tidak bisa menyisipkan HTML.
  function el(tag, attrs) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'style') n.style.cssText = v;
        else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) tambah(n, arguments[i]);
    return n;
  }
  function tambah(n, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { tambah(n, x); }); return; }
    n.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  // Hanya untuk markup statis milik template (ikon/ornamen), tidak pernah data pengguna.
  function statis(markup, kelas) {
    var w = document.createElement('span');
    w.className = kelas || '';
    w.setAttribute('aria-hidden', 'true');
    w.innerHTML = markup;
    return w;
  }

  function amanUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.indexOf('//') === 0) return '';
    return u;
  }
  function cssUrl(u) { return 'url("' + String(u).replace(/["\\\n\r]/g, '') + '")'; }
  function teks(v) { return v == null ? '' : String(v).trim(); }
  function daftar(v) { return Array.isArray(v) ? v.filter(Boolean) : []; }
  function inisial(s) { return (teks(s).charAt(0) || '?').toUpperCase(); }
  function fokusAman(s) { return teks(s).replace(/[^0-9a-z%. -]/gi, '').slice(0, 30); }
  // "fokus" foto: "x% y%" (titik fokus) + angka zoom opsional, contoh "50% 30% 1.6".
  function terapkanFokus(img, fokus) {
    var bagian = fokusAman(fokus).split(/\s+/).filter(Boolean);
    if (!bagian.length) return;
    var zoom = parseFloat(bagian[bagian.length - 1]);
    if (bagian.length === 3 && zoom >= 1 && zoom <= 3) bagian.pop(); else zoom = 1;
    var posisi = bagian.join(' ');
    img.style.objectPosition = posisi;
    if (zoom > 1) { img.style.transformOrigin = posisi; img.style.scale = String(zoom); }
  }

  function waktuAcara(a, kunci) {
    var jam = teks(a[kunci || 'mulai']) || '00:00';
    var d = new Date(teks(a.tanggal) + 'T' + jam + ':00' + (ZONA[a.zona] || '+07:00'));
    return isNaN(d) ? null : d;
  }
  function tz(a) { return TZ[a.zona] || 'Asia/Jakarta'; }
  function fmtTanggal(a, opsi) {
    var d = waktuAcara(a);
    if (!d) return '';
    return d.toLocaleDateString('id-ID', Object.assign({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: tz(a) }, opsi || {}));
  }
  function fmtJam(a) {
    var mulai = teks(a.mulai).replace(':', '.');
    var selesai = teks(a.selesai) ? teks(a.selesai).replace(':', '.') : 'Selesai';
    return mulai ? mulai + ' – ' + selesai + ' ' + (a.zona || 'WIB') : '';
  }
  function linkKalender(a, judul) {
    var tgl = teks(a.tanggal).replace(/-/g, '');
    var mulai = (teks(a.mulai) || '08:00').replace(':', '');
    var akhir = teks(a.selesai).replace(':', '');
    if (!akhir) {
      var j = Math.min(23, parseInt(mulai.slice(0, 2), 10) + 2);
      akhir = (j < 10 ? '0' : '') + j + mulai.slice(2);
    }
    var q = new URLSearchParams({
      action: 'TEMPLATE', text: judul,
      dates: tgl + 'T' + mulai + '00/' + tgl + 'T' + akhir + '00',
      ctz: tz(a), location: [a.tempat, a.alamat].filter(Boolean).join(', ')
    });
    return 'https://calendar.google.com/calendar/render?' + q.toString();
  }

  function salinTeks(s, tombol) {
    var label = tombol.querySelector('.lbl') || tombol;
    var asli = label.textContent;
    function ok() { label.textContent = 'Tersalin ✓'; setTimeout(function () { label.textContent = asli; }, 1800); }
    function cadangan() {
      var t = el('textarea', { readonly: true, style: 'position:fixed;opacity:0' });
      t.value = s; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); ok(); } catch (e) { /* abaikan */ }
      t.remove();
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(ok, cadangan);
    else cadangan();
  }

  function muatFont(tema) {
    var href = 'https://fonts.googleapis.com/css2?' + FONT[tema] + '&display=swap';
    var link = document.getElementById('font-tema');
    if (!link) { link = el('link', { id: 'font-tema', rel: 'stylesheet' }); document.head.append(link); }
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  }

  /* =========================================================
     Ikon & ornamen (SVG statis buatan sendiri)
     ========================================================= */

  var IKON = {
    rumah: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    hati: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    kalender: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    galeri: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
    pesan: '<path d="M4 5h16v11H9l-5 4z"/>',
    hadiah: '<rect x="3" y="8" width="18" height="5" rx="1"/><rect x="5" y="13" width="14" height="8" rx="1"/><path d="M12 8v13M12 8c-2-4-6-4-6-1s4 1 6 1zM12 8c2-4 6-4 6-1s-4 1-6 1z"/>',
    jam: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lokasi: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    amplop: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    bawah: '<path d="M6 9l6 6 6-6"/>',
    salin: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    ig: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>',
    musik: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    kiri: '<path d="M15 6l-6 6 6 6"/>',
    kanan: '<path d="M9 6l6 6-6 6"/>',
    tutup: '<path d="M6 6l12 12M18 6L6 18"/>',
    siaran: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    kado: '<path d="M3 7h18v4H3zM5 11v9h14v-9M12 7v13"/>'
  };
  function ikon(nama) {
    return statis('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + IKON[nama] + '</svg>', 'ikon');
  }

  var ORN = (function () {
    function n(v) { return Math.round(v * 10) / 10; }
    function daun(x, y, p, sudut, kelas) {
      var w = p * 0.34;
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + sudut + ')">' +
        '<path class="' + (kelas || 'daun') + '" d="M0 0C' + n(w) + ' ' + n(-p * 0.22) + ' ' + n(w * 0.95) + ' ' + n(-p * 0.72) + ' 0 ' + n(-p) +
        'C' + n(-w * 0.95) + ' ' + n(-p * 0.72) + ' ' + n(-w) + ' ' + n(-p * 0.22) + ' 0 0Z"/>' +
        '<path class="urat" d="M0 ' + n(-p * 0.06) + 'Q' + n(w * 0.12) + ' ' + n(-p * 0.5) + ' 0 ' + n(-p * 0.9) + '"/></g>';
    }
    function lapis(jumlah, rx, ry, jarak, putar, isi) {
      var s = '';
      for (var i = 0; i < jumlah; i++) {
        s += '<ellipse class="kelopak-b" cx="0" cy="' + n(-jarak) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" transform="rotate(' + n(putar + i * 360 / jumlah) + ')" fill="url(#' + isi + ')"/>';
      }
      return s;
    }
    function bunga(x, y, r, varian, putar) {
      var g = varian === 2 ? 'g-b2' : 'g-b1';
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (putar || 0) + ')">' +
        lapis(8, r * 0.46, r * 0.56, r * 0.5, 0, g) +
        lapis(7, r * 0.38, r * 0.44, r * 0.32, 24, g) +
        lapis(6, r * 0.28, r * 0.32, r * 0.17, 10, g) +
        '<circle r="' + n(r * 0.15) + '" class="inti"/><circle r="' + n(r * 0.06) + '" class="inti-dalam"/></g>';
    }
    function kuntum(x, y, r) {
      return '<g transform="translate(' + x + ' ' + y + ')">' + lapis(5, r * 0.42, r * 0.55, r * 0.5, 0, 'g-b2') +
        '<circle r="' + n(r * 0.2) + '" class="inti"/></g>';
    }
    function tunas(x, y, r, sudut) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + sudut + ')">' +
        daun(0, 0, r * 1.15, -28) + daun(0, 0, r * 1.15, 28) +
        '<ellipse class="kelopak-b" cx="0" cy="' + n(-r) + '" rx="' + n(r * 0.55) + '" ry="' + n(r) + '" fill="url(#g-b1)"/></g>';
    }
    function titik(x, y, r) { return '<circle class="titik" cx="' + x + '" cy="' + y + '" r="' + r + '"/>'; }

    var cacheSudut = null;
    function sudut() {
      if (cacheSudut) return cacheSudut;
      var s = '<path class="tangkai" d="M-6 306C30 240 66 190 150 140"/>' +
        '<path class="tangkai" d="M-6 300C70 286 150 262 236 214"/>' +
        '<path class="tangkai" d="M4 306C10 236 18 170 34 92"/>';
      [[34, 250, 58, -40], [58, 214, 52, 24], [96, 178, 48, -52], [132, 152, 44, 58], [150, 140, 40, 10],
        [70, 288, 56, 72], [124, 274, 52, 96], [182, 248, 48, 62], [230, 216, 42, 104], [200, 232, 40, 30],
        [16, 232, 54, -16], [22, 176, 50, -34], [26, 132, 46, 14], [32, 96, 40, -20]
      ].forEach(function (d) { s += daun(d[0], d[1], d[2], d[3]); });
      s += daun(118, 236, 46, 40, 'daun-emas') + daun(54, 160, 42, -60, 'daun-emas') + daun(214, 196, 36, 70, 'daun-emas');
      s += bunga(92, 222, 58, 1, 12) + bunga(176, 262, 38, 2, -18) + bunga(36, 142, 32, 2, 30);
      s += tunas(150, 196, 14, 40) + tunas(240, 228, 12, 70) + tunas(28, 92, 12, -10);
      s += kuntum(132, 250, 14) + kuntum(62, 180, 12) + kuntum(214, 270, 11);
      [[160, 214, 3], [178, 226, 2.2], [110, 168, 2.6], [84, 158, 2], [252, 246, 2.4], [46, 106, 2.2], [120, 292, 2.6], [196, 290, 2]]
        .forEach(function (t) { s += titik(t[0], t[1], t[2]); });
      cacheSudut = '<svg viewBox="0 0 300 300" class="svg-sudut">' + s + '</svg>';
      return cacheSudut;
    }

    var cacheUntaian = null;
    function untaian() {
      if (cacheUntaian) return cacheUntaian;
      var s = '<path class="tangkai" d="M18 62C80 40 120 52 160 60C200 52 240 40 302 62"/>';
      [[42, 58, 30, -70], [68, 50, 32, -112], [94, 50, 30, -62], [120, 56, 28, -116],
        [200, 56, 28, 116], [226, 50, 30, 62], [252, 50, 32, 112], [278, 58, 30, 70]
      ].forEach(function (d) { s += daun(d[0], d[1], d[2], d[3]); });
      s += daun(138, 62, 26, -150, 'daun-emas') + daun(182, 62, 26, 150, 'daun-emas');
      s += kuntum(108, 46, 10) + kuntum(212, 46, 10);
      s += bunga(160, 54, 26, 1, 0);
      s += titik(30, 64, 2) + titik(290, 64, 2) + titik(84, 40, 1.8) + titik(236, 40, 1.8);
      cacheUntaian = '<svg viewBox="0 0 320 90" class="svg-untaian">' + s + '</svg>';
      return cacheUntaian;
    }

    function pembatas() {
      return '<svg viewBox="0 0 240 30" class="svg-pembatas"><path class="garis-emas" d="M8 15H96M144 15H232"/>' +
        daun(104, 15, 14, -90, 'daun-emas') + daun(136, 15, 14, 90, 'daun-emas') + kuntum(120, 15, 9) +
        titik(92, 15, 1.6) + titik(148, 15, 1.6) + '</svg>';
    }

    function defs() {
      return '<svg class="orn-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
        '<radialGradient id="g-b1" cx=".5" cy="1" r="1"><stop offset="0" class="s-b1a"/><stop offset="1" class="s-b1b"/></radialGradient>' +
        '<radialGradient id="g-b2" cx=".5" cy="1" r="1"><stop offset="0" class="s-b2a"/><stop offset="1" class="s-b2b"/></radialGradient>' +
        '<linearGradient id="g-d" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="s-da"/><stop offset="1" class="s-db"/></linearGradient>' +
        '<linearGradient id="g-emas" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="s-e1"/><stop offset=".5" class="s-e2"/><stop offset="1" class="s-e1"/></linearGradient>' +
        '</defs></svg>';
    }

    return { sudut: sudut, untaian: untaian, pembatas: pembatas, defs: defs };
  })();

  var KELOPAK = '<svg viewBox="0 0 20 20"><path d="M10 0C17 5 16 14 10 20C4 14 3 5 10 0Z"/></svg>';
  var CHIP = '<svg viewBox="0 0 48 36"><rect class="chip" x="1" y="1" width="46" height="34" rx="6"/>' +
    '<path class="chip-garis" d="M1 12h14M1 24h14M33 12h14M33 24h14M15 1v34M33 1v34M15 18h18"/></svg>';
  var SEGEL = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" class="segel-luar"/>' +
    '<circle cx="50" cy="50" r="39" class="segel-dalam"/><circle cx="50" cy="50" r="35" class="segel-cincin"/></svg>';

  function sudutHias(posisi) { return statis(ORN.sudut(), 'orn-sudut ' + posisi); }
  function untaian(kelas) { return statis(ORN.untaian(), 'orn-untaian ' + (kelas || '')); }
  function pembatas() { return statis(ORN.pembatas(), 'orn-pembatas'); }

  function namaPasangan(a, b, kelas) {
    return el('h1', { class: 'nama-pasangan ' + (kelas || '') },
      el('span', { class: 'nm', text: a }), el('span', { class: 'amp', text: '&' }), el('span', { class: 'nm', text: b }));
  }

  function judulBagian(judul, label) {
    return el('header', { class: 'judul-bagian' },
      untaian('muncul'),
      label ? el('p', { class: 'label muncul', text: label }) : null,
      el('h2', { class: 'judul-script muncul', 'data-anim': 'zoom', text: judul }));
  }

  /* =========================================================
     Bagian-bagian undangan
     ========================================================= */

  function bagianSampul(d, dua, tglUtama) {
    var foto = amanUrl(d.sampul);
    var s = el('section', { class: 'sampul' + (foto ? ' berfoto' : ''), id: 'sampul' });
    if (foto) {
      var f = el('div', { class: 'sampul-foto', 'aria-hidden': 'true' });
      f.style.backgroundImage = cssUrl(foto);
      s.append(f);
    } else {
      var seg = el('div', { class: 'segel besar' }, statis(SEGEL), el('span', { class: 'segel-huruf', text: inisial(dua[0].panggilan) + inisial(dua[1].panggilan) }));
      s.append(el('div', { class: 'sampul-hias' }, seg));
    }
    s.append(sudutHias('kiri-bawah'), sudutHias('kanan-bawah'));
    s.append(el('div', { class: 'sampul-isi' },
      el('p', { class: 'label', text: 'The Wedding of' }),
      namaPasangan(teks(dua[0].panggilan), teks(dua[1].panggilan), 'sebaris'),
      tglUtama ? el('p', { class: 'tgl-sampul', text: tglUtama }) : null,
      el('div', { class: 'kartu-tamu' },
        el('p', { class: 'kecil', text: 'Kepada Yth. Bapak/Ibu/Saudara/i' }),
        el('p', { class: 'nama-tamu', text: tamu || 'Tamu Undangan' }),
        el('p', { class: 'mini', text: 'Mohon maaf apabila ada kesalahan penulisan nama atau gelar.' })),
      el('button', { class: 'tombol tombol-buka', type: 'button', onclick: bukaUndangan }, ikon('amplop'), el('span', { class: 'lbl', text: 'Buka Undangan' }))));
    return s;
  }

  function bagianBeranda(dua, acaraUtama, fotoSlide) {
    var s = el('section', { class: 'beranda', id: 'beranda' });
    var wadah = el('div', { class: 'slide-wadah', 'aria-hidden': 'true' });
    fotoSlide.forEach(function (src, i) {
      var sl = el('div', { class: 'slide' + (i === 0 ? ' aktif' : ''), style: 'animation-delay:-' + (i * 4) + 's' });
      sl.style.backgroundImage = cssUrl(src);
      wadah.append(sl);
    });
    if (!fotoSlide.length) wadah.append(el('div', { class: 'slide aktif polos' }));
    s.append(wadah);
    if (!fotoSlide.length) s.append(sudutHias('kiri-atas'), sudutHias('kanan-bawah'));
    s.append(el('div', { class: 'beranda-isi' },
      el('p', { class: 'label muncul', text: 'The Wedding of' }),
      namaPasangan(teks(dua[0].panggilan), teks(dua[1].panggilan), 'muncul'),
      acaraUtama ? el('p', { class: 'tgl-hias muncul', 'data-anim': 'blur' }, el('span', { text: fmtTanggal(acaraUtama) })) : null,
      el('a', { class: 'gulir', href: '#kutipan', 'aria-label': 'Gulir ke bawah' }, ikon('bawah'))));
    if (fotoSlide.length > 1) {
      var i = 0;
      timerSlide = setInterval(function () {
        var semua = wadah.children;
        semua[i].classList.remove('aktif');
        i = (i + 1) % semua.length;
        semua[i].classList.add('aktif');
      }, 5500);
    }
    return s;
  }

  function bagianKutipan(d) {
    var k = d.kutipan || {};
    if (!teks(k.teks)) return el('span', { id: 'kutipan' });
    return el('section', { class: 'bagian kutipan', id: 'kutipan' },
      sudutHias('kiri-atas kecil'), sudutHias('kanan-bawah kecil'),
      untaian('muncul'),
      el('blockquote', { class: 'muncul', 'data-anim': 'blur' },
        el('p', { text: teks(k.teks) }),
        teks(k.sumber) ? el('cite', { text: '— ' + teks(k.sumber) + ' —' }) : null));
  }

  function kartuMempelai(o, peran, arah) {
    var src = amanUrl(o.foto);
    var foto;
    if (src) {
      foto = el('img', { src: src, alt: teks(o.lengkap || o.panggilan), loading: 'lazy' });
      terapkanFokus(foto, o.fokus);
    } else {
      foto = el('div', { class: 'monogram', 'aria-hidden': 'true', text: inisial(o.panggilan) });
    }
    var ig = teks(o.instagram).replace(/^@/, '').replace(/[^A-Za-z0-9._]/g, '');
    return el('article', { class: 'mempelai' },
      el('div', { class: 'bingkai muncul', 'data-anim': arah },
        el('div', { class: 'bingkai-foto' }, foto),
        statis(ORN.sudut(), 'bingkai-bunga')),
      el('h3', { class: 'nama-script muncul', text: teks(o.panggilan) }),
      el('p', { class: 'nama-lengkap muncul', text: teks(o.lengkap) }),
      teks(o.ortu) ? el('p', { class: 'ortu muncul', text: teks(o.ortu) }) : null,
      ig ? el('a', { class: 'pil muncul', href: 'https://instagram.com/' + ig, target: '_blank', rel: 'noopener', 'aria-label': 'Instagram ' + peran }, ikon('ig'), '@' + ig) : null);
  }

  function bagianMempelai(d, dua) {
    var peran = d.urutan === 'wanita' ? ['mempelai wanita', 'mempelai pria'] : ['mempelai pria', 'mempelai wanita'];
    return el('section', { class: 'bagian mempelai-bagian', id: 'mempelai' },
      sudutHias('kanan-atas kecil'), sudutHias('kiri-bawah kecil'),
      teks(d.salam) ? el('p', { class: 'salam muncul', text: teks(d.salam) }) : null,
      teks(d.pembuka) ? el('p', { class: 'paragraf muncul', text: teks(d.pembuka) }) : null,
      pembatas(),
      kartuMempelai(dua[0], peran[0], 'kiri'),
      el('p', { class: 'dan muncul', 'data-anim': 'zoom', 'aria-hidden': 'true', text: '&' }),
      kartuMempelai(dua[1], peran[1], 'kanan'));
  }

  function bagianHitung(acaraUtama, pasangan, fotoLatar) {
    if (!acaraUtama || !waktuAcara(acaraUtama)) return null;
    var s = el('section', { class: 'bagian berlatar hitung-bagian' + (fotoLatar ? ' berfoto' : '') });
    if (fotoLatar) s.style.setProperty('--foto-latar', cssUrl(fotoLatar));
    var kotak = el('div', { class: 'hitung', role: 'timer', 'aria-label': 'Hitung mundur menuju acara' });
    s.append(
      el('p', { class: 'label muncul', text: 'Menuju Hari Bahagia' }),
      el('h2', { class: 'judul-script muncul', 'data-anim': 'zoom', text: 'Save the Date' }),
      el('p', { class: 'paragraf muncul', text: fmtTanggal(acaraUtama) }),
      kotak,
      el('a', { class: 'tombol garis muncul', href: linkKalender(acaraUtama, 'Pernikahan ' + pasangan), target: '_blank', rel: 'noopener' }, ikon('kalender'), el('span', { class: 'lbl', text: 'Simpan ke Kalender' })));
    mulaiHitung(kotak, waktuAcara(acaraUtama));
    return s;
  }

  function mulaiHitung(kotak, target) {
    var label = ['Hari', 'Jam', 'Menit', 'Detik'];
    var angka = label.map(function (l, i) {
      var a = el('span', { class: 'angka', text: '00' });
      kotak.append(el('div', { class: 'unit muncul', 'data-anim': 'zoom', style: '--tunda:' + (i * 0.12) + 's' }, a, el('span', { class: 'satuan', text: l })));
      return a;
    });
    function tik() {
      var sisa = target - Date.now();
      if (sisa <= 0) {
        clearInterval(timerHitung);
        kotak.textContent = '';
        kotak.append(el('p', { class: 'selesai', text: 'Acara telah berlangsung. Terima kasih atas doa dan restunya.' }));
        return;
      }
      var nilai = [Math.floor(sisa / 864e5), Math.floor(sisa / 36e5) % 24, Math.floor(sisa / 6e4) % 60, Math.floor(sisa / 1e3) % 60];
      nilai.forEach(function (v, i) { angka[i].textContent = String(v).padStart(2, '0'); });
    }
    tik();
    timerHitung = setInterval(tik, 1000);
  }

  function bagianAcara(d, pasangan) {
    var acara = daftar(d.acara);
    if (!acara.length) return null;
    return el('section', { class: 'bagian lembut', id: 'acara' },
      sudutHias('kiri-atas kecil'), sudutHias('kanan-bawah kecil'),
      judulBagian('Waktu & Tempat', 'Rangkaian Acara'),
      acara.map(function (a, i) {
        var maps = amanUrl(a.maps) || (teks(a.alamat) ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([a.tempat, a.alamat].filter(Boolean).join(', ')) : '');
        return el('article', { class: 'kartu-acara muncul', 'data-anim': i % 2 ? 'kanan' : 'kiri' },
          el('h3', { class: 'judul-script kecil', text: teks(a.nama) }),
          pembatas(),
          el('p', { class: 'baris-info' }, ikon('kalender'), el('span', { text: fmtTanggal(a) })),
          el('p', { class: 'baris-info' }, ikon('jam'), el('span', { text: fmtJam(a) })),
          el('p', { class: 'baris-info tempat' }, ikon('lokasi'), el('span', null, el('strong', { text: teks(a.tempat) }), teks(a.alamat) ? el('small', { text: teks(a.alamat) }) : null)),
          el('div', { class: 'baris-tombol' },
            maps ? el('a', { class: 'tombol kecil', href: maps, target: '_blank', rel: 'noopener' }, ikon('lokasi'), el('span', { class: 'lbl', text: 'Lihat Lokasi' })) : null,
            waktuAcara(a) ? el('a', { class: 'tombol kecil garis', href: linkKalender(a, teks(a.nama) + ' ' + pasangan), target: '_blank', rel: 'noopener' }, ikon('kalender'), el('span', { class: 'lbl', text: 'Kalender' })) : null));
      }),
      amanUrl(d.siaran) ? el('div', { class: 'kartu-acara siaran muncul' },
        el('p', { class: 'paragraf', text: 'Tidak bisa hadir? Saksikan momen kami secara langsung.' }),
        el('a', { class: 'tombol', href: amanUrl(d.siaran), target: '_blank', rel: 'noopener' }, ikon('siaran'), el('span', { class: 'lbl', text: 'Tonton Siaran Langsung' }))) : null);
  }

  function bagianCerita(d) {
    var cerita = daftar(d.cerita).filter(function (c) { return teks(c.judul) || teks(c.teks); });
    if (!cerita.length) return null;
    return el('section', { class: 'bagian', id: 'cerita' },
      sudutHias('kanan-atas kecil'),
      judulBagian('Kisah Kami', 'Love Story'),
      el('ol', { class: 'linimasa' }, cerita.map(function (c, i) {
        var foto = amanUrl(c.foto);
        return el('li', { class: 'muncul', 'data-anim': i % 2 ? 'kanan' : 'kiri' },
          foto ? el('img', { class: 'foto-cerita', src: foto, alt: teks(c.judul), loading: 'lazy' }) : null,
          el('h3', { text: teks(c.judul) }),
          el('p', { text: teks(c.teks) }));
      })));
  }

  function bagianGaleri(d) {
    var galeri = daftar(d.galeri).map(function (g) {
      return typeof g === 'string' ? { src: amanUrl(g), ket: '' } : { src: amanUrl(g.src), ket: teks(g.ket) };
    });
    if (!galeri.length) return null;
    var berfoto = galeri.filter(function (g) { return g.src; });
    var grid = el('div', { class: 'galeri' });
    galeri.forEach(function (g, i) {
      if (g.src) {
        var idx = berfoto.indexOf(g);
        grid.append(el('button', { class: 'foto-galeri muncul', 'data-anim': 'zoom', type: 'button', 'aria-label': 'Perbesar foto ' + (i + 1), onclick: function () { bukaLightbox(berfoto, idx); } },
          el('img', { src: g.src, alt: g.ket || 'Foto ' + (i + 1), loading: 'lazy' })));
      } else {
        grid.append(el('div', { class: 'foto-galeri kosong muncul', 'aria-hidden': 'true' }, el('span', { text: g.ket || 'Foto ' + (i + 1) })));
      }
    });
    return el('section', { class: 'bagian lembut', id: 'galeri' },
      sudutHias('kiri-atas kecil'),
      judulBagian('Galeri', 'Momen Bahagia'), grid);
  }

  function bukaLightbox(list, awal) {
    var i = awal;
    var img = el('img', { alt: '' });
    var ket = el('figcaption');
    var nomor = el('p', { class: 'lb-nomor' });
    var lb = el('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Galeri foto' });
    function tampil() {
      img.src = list[i].src; img.alt = list[i].ket || 'Foto ' + (i + 1);
      ket.textContent = list[i].ket || '';
      nomor.textContent = (i + 1) + ' / ' + list.length;
    }
    function geser(arah) { i = (i + arah + list.length) % list.length; tampil(); }
    function tutup() { lb.remove(); document.removeEventListener('keydown', kunci); }
    function kunci(e) {
      if (e.key === 'Escape') tutup();
      else if (e.key === 'ArrowLeft') geser(-1);
      else if (e.key === 'ArrowRight') geser(1);
    }
    var bTutup = el('button', { class: 'lb-tombol lb-tutup', type: 'button', 'aria-label': 'Tutup', onclick: tutup }, ikon('tutup'));
    var kontrol = list.length > 1 ? [
      el('button', { class: 'lb-tombol lb-kiri', type: 'button', 'aria-label': 'Foto sebelumnya', onclick: function () { geser(-1); } }, ikon('kiri')),
      el('button', { class: 'lb-tombol lb-kanan', type: 'button', 'aria-label': 'Foto berikutnya', onclick: function () { geser(1); } }, ikon('kanan')),
      nomor] : [];
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') tutup(); });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40 && list.length > 1) geser(dx < 0 ? 1 : -1);
      x0 = null;
    });
    tambah(lb, [bTutup, el('figure', null, img, ket), kontrol]);
    document.addEventListener('keydown', kunci);
    document.body.append(lb);
    tampil();
    bTutup.focus();
  }

  function bagianRsvp(d) {
    var r = d.rsvp || {};
    if (r.aktif === false) return null;
    var endpoint = amanUrl(r.endpoint || BRAND.rsvpEndpoint);
    var lokal = !endpoint || modePreview;
    var kunciLokal = 'ucapan:' + (slug || 'preview');
    var daftarUcapan = el('ul', { class: 'daftar-ucapan' });
    var statistik = el('div', { class: 'statistik' });
    var status = el('p', { class: 'status', role: 'status' });

    var inputNama = el('input', { name: 'nama', required: true, maxlength: 80, autocomplete: 'name', placeholder: 'Nama kamu' });
    inputNama.value = tamu;
    var pilihJumlah = el('select', { name: 'jumlah' }, [1, 2, 3, 4, 5].map(function (n) { return el('option', { value: n, text: n + ' orang' }); }));
    var bungkusJumlah = el('label', { class: 'field' }, 'Jumlah yang hadir', pilihJumlah);
    var opsi = [['hadir', 'Hadir'], ['tidak', 'Tidak hadir'], ['ragu', 'Masih ragu']];
    var form;
    function perbaruiJumlah() {
      var v = form.querySelector('input[name=kehadiran]:checked');
      bungkusJumlah.hidden = !v || v.value !== 'hadir';
    }
    var radio = el('div', { class: 'pilihan', role: 'radiogroup', 'aria-label': 'Konfirmasi kehadiran' }, opsi.map(function (o, i) {
      return el('label', null, el('input', { type: 'radio', name: 'kehadiran', value: o[0], checked: i === 0, onchange: perbaruiJumlah }), el('span', { text: o[1] }));
    }));
    var ucapan = el('textarea', { name: 'ucapan', rows: 4, maxlength: 500, placeholder: 'Tulis ucapan & doa untuk kedua mempelai' });
    var kirim = el('button', { class: 'tombol', type: 'submit' }, ikon('pesan'), el('span', { class: 'lbl', text: 'Kirim Ucapan' }));
    form = el('form', { class: 'kartu form-rsvp muncul', onsubmit: kirimRsvp },
      el('label', { class: 'field' }, 'Nama', inputNama),
      radio, bungkusJumlah,
      el('label', { class: 'field' }, 'Ucapan & doa', ucapan),
      kirim, status);

    function itemUcapan(u) {
      var label = { hadir: 'Hadir', tidak: 'Tidak hadir', ragu: 'Masih ragu' }[u.kehadiran];
      return el('li', { class: 'ucapan' },
        el('span', { class: 'avatar', 'aria-hidden': 'true', text: inisial(u.nama) }),
        el('div', null,
          el('p', { class: 'pengirim' }, el('strong', { text: teks(u.nama) }), label ? el('span', { class: 'lencana ' + u.kehadiran, text: label }) : null),
          el('p', { text: teks(u.ucapan) })));
    }
    function tampilkan(list) {
      list = list || [];
      var hadir = list.filter(function (u) { return u.kehadiran === 'hadir'; }).length;
      var tidak = list.filter(function (u) { return u.kehadiran === 'tidak'; }).length;
      statistik.textContent = '';
      statistik.append(
        el('div', null, el('strong', { text: String(list.length) }), el('span', { text: 'Ucapan' })),
        el('div', null, el('strong', { text: String(hadir) }), el('span', { text: 'Hadir' })),
        el('div', null, el('strong', { text: String(tidak) }), el('span', { text: 'Tidak hadir' })));
      daftarUcapan.textContent = '';
      var berisi = list.filter(function (u) { return teks(u.ucapan); });
      if (!berisi.length) daftarUcapan.append(el('li', { class: 'kosong', text: 'Jadilah yang pertama memberi ucapan.' }));
      berisi.forEach(function (u) { daftarUcapan.append(itemUcapan(u)); });
    }
    function bacaLokal() { try { return JSON.parse(localStorage.getItem(kunciLokal)) || []; } catch (e) { return []; } }
    var dataServer = [];
    function muat() {
      if (lokal) { tampilkan(bacaLokal()); return; }
      fetch(endpoint + (endpoint.indexOf('?') < 0 ? '?' : '&') + 'u=' + encodeURIComponent(slug))
        .then(function (res) { return res.json(); })
        .then(function (list) { dataServer = Array.isArray(list) ? list : []; tampilkan(dataServer); })
        .catch(function () { tampilkan([]); });
    }
    function kirimRsvp(e) {
      e.preventDefault();
      var hadir = form.querySelector('input[name=kehadiran]:checked');
      var isi = {
        slug: slug || 'preview',
        nama: inputNama.value.trim().slice(0, 80),
        kehadiran: hadir ? hadir.value : 'ragu',
        jumlah: hadir && hadir.value === 'hadir' ? Number(pilihJumlah.value) : 0,
        ucapan: ucapan.value.trim().slice(0, 500)
      };
      if (!isi.nama) { status.textContent = 'Nama wajib diisi.'; inputNama.focus(); return; }
      kirim.disabled = true; status.textContent = 'Mengirim…';
      function selesai() {
        kirim.disabled = false; ucapan.value = '';
        status.textContent = 'Terima kasih, konfirmasi kamu sudah kami terima.';
        var simpan = bacaLokal(); simpan.unshift(isi);
        try { localStorage.setItem(kunciLokal, JSON.stringify(simpan.slice(0, 50))); } catch (err) { /* penuh */ }
        if (lokal) tampilkan(simpan);
        else { dataServer.unshift(isi); tampilkan(dataServer); }
      }
      if (lokal) { setTimeout(selesai, 300); return; }
      // Apps Script tidak mengirim header CORS untuk POST, jadi pakai no-cors.
      fetch(endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(isi) })
        .then(selesai)
        .catch(function () { kirim.disabled = false; status.textContent = 'Gagal mengirim. Periksa koneksi lalu coba lagi.'; });
    }

    var waPasangan = teks(r.wa).replace(/\D/g, '');
    var bagian = el('section', { class: 'bagian', id: 'rsvp' },
      sudutHias('kanan-atas kecil'), sudutHias('kiri-bawah kecil'),
      judulBagian('Ucapan & Doa', 'RSVP'),
      el('p', { class: 'paragraf muncul', text: 'Mohon kesediaan Bapak/Ibu/Saudara/i untuk mengonfirmasi kehadiran dan menitipkan doa terbaik.' }),
      form,
      waPasangan ? el('a', { class: 'tombol garis kecil muncul', target: '_blank', rel: 'noopener', href: 'https://wa.me/' + waPasangan + '?text=' + encodeURIComponent('Halo, saya ' + (tamu || '…') + '. Saya ingin konfirmasi kehadiran di acara pernikahan kalian.') }, el('span', { class: 'lbl', text: 'Konfirmasi via WhatsApp' })) : null,
      (!endpoint && !modePreview) ? el('p', { class: 'catatan-demo', text: 'Mode demo: ucapan hanya tersimpan di perangkat ini.' }) : null,
      statistik,
      daftarUcapan);
    setTimeout(function () { perbaruiJumlah(); muat(); }, 0);
    return bagian;
  }

  function kartuAtm(r) {
    var nomor = teks(r.nomor);
    var tampil = nomor.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    var tombol = el('button', { class: 'tombol kecil', type: 'button' }, ikon('salin'), el('span', { class: 'lbl', text: 'Salin Nomor' }));
    tombol.addEventListener('click', function () { salinTeks(nomor.replace(/\s/g, ''), tombol); });
    return el('div', { class: 'atm-blok muncul', 'data-anim': 'zoom' },
      el('div', { class: 'kartu-atm' },
        el('p', { class: 'atm-bank', text: teks(r.bank) }),
        statis(CHIP, 'atm-chip'),
        el('p', { class: 'atm-nomor', text: tampil }),
        el('p', { class: 'atm-nama', text: teks(r.atas_nama) })),
      tombol);
  }

  function bagianAmplop(d) {
    var a = d.amplop || {};
    var rek = daftar(a.rekening).filter(function (r) { return teks(r.nomor); });
    if (!rek.length && !teks(a.alamat)) return null;
    var alamat = teks(a.alamat);
    var tombolAlamat = null;
    if (alamat) {
      tombolAlamat = el('button', { class: 'tombol kecil garis', type: 'button' }, ikon('salin'), el('span', { class: 'lbl', text: 'Salin Alamat' }));
      tombolAlamat.addEventListener('click', function () { salinTeks(alamat, tombolAlamat); });
    }
    return el('section', { class: 'bagian lembut', id: 'amplop' },
      sudutHias('kiri-atas kecil'), sudutHias('kanan-bawah kecil'),
      judulBagian('Tanda Kasih', 'Amplop Digital'),
      el('p', { class: 'paragraf muncul', text: teks(a.pengantar) || 'Doa restu Anda adalah karunia terindah bagi kami. Namun jika ingin memberi tanda kasih, Anda dapat mengirimkannya melalui:' }),
      rek.map(kartuAtm),
      alamat ? el('article', { class: 'kartu kirim-kado muncul' },
        el('span', { class: 'ikon-bulat' }, ikon('kado')),
        el('p', { class: 'label', text: 'Kirim Kado' }),
        el('p', { class: 'alamat', text: alamat }),
        tombolAlamat) : null);
  }

  function bagianPenutup(d, dua, fotoLatar) {
    var situs = amanUrl(BRAND.situs) || '../';
    var ref = situs + (situs.indexOf('?') < 0 ? '?' : '&') + 'ref=undangan';
    var s = el('section', { class: 'bagian berlatar penutup' + (fotoLatar ? ' berfoto' : '') });
    if (fotoLatar) s.style.setProperty('--foto-latar', cssUrl(fotoLatar));
    s.append(
      sudutHias('kiri-bawah'), sudutHias('kanan-bawah'),
      el('p', { class: 'paragraf muncul', text: teks(d.penutup) || 'Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.' }),
      el('p', { class: 'label muncul', text: 'Kami yang berbahagia' }),
      namaPasangan(teks(dua[0].panggilan), teks(dua[1].panggilan), 'muncul'),
      teks(d.keluarga) ? el('p', { class: 'keluarga muncul', text: teks(d.keluarga) }) : null,
      pembatas(),
      el('footer', { class: 'kaki' }, 'Undangan digital oleh ', el('a', { href: ref, target: '_blank', rel: 'noopener', text: BRAND.nama || 'kami' })));
    return s;
  }

  function navBawah() {
    var item = [['beranda', 'rumah', 'Beranda'], ['mempelai', 'hati', 'Mempelai'], ['acara', 'kalender', 'Acara'],
      ['galeri', 'galeri', 'Galeri'], ['rsvp', 'pesan', 'Ucapan'], ['amplop', 'hadiah', 'Hadiah']]
      .filter(function (x) { return document.getElementById(x[0]); });
    if (item.length < 2) return null;
    var nav = el('nav', { class: 'nav-bawah', 'aria-label': 'Navigasi undangan', hidden: !sudahDibuka });
    item.forEach(function (x, i) {
      nav.append(el('a', { href: '#' + x[0], 'aria-label': x[2], title: x[2], 'data-target': x[0], class: i === 0 ? 'aktif' : null }, ikon(x[1])));
    });
    if ('IntersectionObserver' in window) {
      if (pengamatNav) pengamatNav.disconnect();
      pengamatNav = new IntersectionObserver(function (entri) {
        entri.forEach(function (e) {
          if (!e.isIntersecting) return;
          nav.querySelectorAll('a').forEach(function (a) { a.classList.toggle('aktif', a.dataset.target === e.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      item.forEach(function (x) { pengamatNav.observe(document.getElementById(x[0])); });
    }
    return nav;
  }

  function hujanKelopak() {
    if (geraknyaDikurangi) return null;
    var w = el('div', { class: 'hujan-kelopak', 'aria-hidden': 'true' });
    for (var i = 0; i < 14; i++) {
      var ukuran = 9 + Math.random() * 11;
      var k = el('span', { class: 'kelopak', style: 'left:' + (Math.random() * 100).toFixed(1) + '%;width:' + ukuran.toFixed(1) + 'px;height:' + ukuran.toFixed(1) + 'px;' +
        'animation-duration:' + (10 + Math.random() * 9).toFixed(1) + 's;animation-delay:-' + (Math.random() * 18).toFixed(1) + 's;opacity:' + (0.45 + Math.random() * 0.45).toFixed(2) });
      var dalam = statis(KELOPAK, 'kelopak-dalam');
      dalam.style.animationDuration = (2.5 + Math.random() * 3).toFixed(1) + 's';
      k.append(dalam);
      w.append(k);
    }
    return w;
  }

  function tombolMusik(src) {
    audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'none';
    var t = el('button', { class: 'tombol-musik', type: 'button', 'aria-label': 'Putar musik', hidden: !sudahDibuka }, ikon('musik'));
    t.addEventListener('click', function () { if (audio.paused) audio.play().catch(function () {}); else audio.pause(); });
    audio.addEventListener('play', function () { t.classList.add('putar'); t.setAttribute('aria-label', 'Jeda musik'); });
    audio.addEventListener('pause', function () { t.classList.remove('putar'); t.setAttribute('aria-label', 'Putar musik'); });
    return t;
  }

  /* =========================================================
     Alur utama
     ========================================================= */

  function bukaUndangan() {
    sudahDibuka = true;
    var sampul = document.getElementById('sampul');
    if (sampul) sampul.classList.add('terbuka');
    document.body.classList.remove('terkunci');
    document.querySelectorAll('.tombol-musik, .nav-bawah').forEach(function (n) { n.hidden = false; });
    if (audio && !modePreview) audio.play().catch(function () {});
    window.scrollTo(0, 0);
  }

  function aktifkanAnimasi() {
    if (pengamat) pengamat.disconnect();
    var semua = document.querySelectorAll('.muncul');
    if (!('IntersectionObserver' in window) || geraknyaDikurangi) {
      semua.forEach(function (n) { n.classList.add('tampil'); });
      return;
    }
    pengamat = new IntersectionObserver(function (entri) {
      entri.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('tampil'); pengamat.unobserve(e.target); } });
    }, { threshold: 0.12 });
    semua.forEach(function (n) { pengamat.observe(n); });
  }

  function render(d) {
    d = d || {};
    clearInterval(timerHitung);
    clearInterval(timerSlide);
    if (audio) { audio.pause(); audio = null; }
    var tema = ALIAS[d.tema] || d.tema;
    if (TEMA_VALID.indexOf(tema) < 0) tema = TEMA_VALID[0];
    document.body.dataset.tema = tema;
    if (FONT[tema]) muatFont(tema);

    var pria = d.pria || {}, wanita = d.wanita || {};
    var dua = d.urutan === 'wanita' ? [wanita, pria] : [pria, wanita];
    var pasangan = [teks(dua[0].panggilan), teks(dua[1].panggilan)].filter(Boolean).join(' & ') || 'Nama & Nama';
    var acaraUtama = daftar(d.acara)[0];
    var tglUtama = acaraUtama ? fmtTanggal(acaraUtama, { weekday: undefined, day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' . ') : '';

    // Foto untuk slideshow & latar diambil dari sampul + galeri.
    var semuaFoto = [amanUrl(d.sampul)].concat(daftar(d.galeri).map(function (g) { return amanUrl(typeof g === 'string' ? g : g.src); }))
      .filter(function (u, i, arr) { return u && arr.indexOf(u) === i; });
    var fotoSlide = semuaFoto.slice(0, 3);
    var fotoHitung = semuaFoto[3] || semuaFoto[1] || semuaFoto[0] || '';
    var fotoPenutup = semuaFoto[4] || semuaFoto[2] || semuaFoto[0] || '';

    document.title = 'The Wedding of ' + pasangan;

    var scrollLama = window.scrollY;
    app.textContent = '';
    app.append(statis(ORN.defs(), 'defs-wadah'));
    if (!langsungBuka) app.append(bagianSampul(d, dua, tglUtama));
    app.append(el('div', { class: 'isi' },
      bagianBeranda(dua, acaraUtama, fotoSlide),
      bagianKutipan(d),
      bagianMempelai(d, dua),
      bagianHitung(acaraUtama, pasangan, fotoHitung),
      bagianAcara(d, pasangan),
      bagianCerita(d),
      bagianGaleri(d),
      bagianRsvp(d),
      bagianAmplop(d),
      bagianPenutup(d, dua, fotoPenutup)));
    var hujan = hujanKelopak();
    if (hujan) app.append(hujan);
    var musik = amanUrl(d.musik);
    if (musik) app.append(tombolMusik(musik));
    var nav = navBawah();
    if (nav) app.append(nav);

    if (sudahDibuka) {
      document.body.classList.remove('terkunci');
      var sampul = document.getElementById('sampul');
      if (sampul) sampul.classList.add('terbuka', 'instan');
      if (modePreview) window.scrollTo(0, scrollLama);
    } else {
      document.body.classList.add('terkunci');
    }
    aktifkanAnimasi();
  }

  function tampilkanGalat(judul, pesan) {
    document.body.classList.remove('terkunci');
    app.textContent = '';
    app.append(el('section', { class: 'galat' },
      el('h1', { text: judul }),
      el('p', { text: pesan }),
      el('a', { class: 'tombol', href: amanUrl(BRAND.situs) || '../' }, el('span', { class: 'lbl', text: 'Ke halaman utama' }))));
  }

  if (modePreview) {
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin) return;
      if (e.data && e.data.type === 'undangan-data') render(e.data.data);
    });
    if (window.parent !== window) window.parent.postMessage({ type: 'undangan-siap' }, location.origin);
  } else if (!/^[a-z0-9-]{1,60}$/.test(slug)) {
    tampilkanGalat('Link belum lengkap', 'Periksa kembali link undangan yang kamu terima.');
  } else {
    fetch('data/' + slug + '.json', { cache: 'no-cache' })
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (d) {
        // Masa aktif paket: setelah tanggal ini undangan tidak ditampilkan lagi.
        var batas = /^\d{4}-\d{2}-\d{2}$/.test(teks(d.aktifSampai)) ? new Date(d.aktifSampai + 'T23:59:59+07:00') : null;
        if (batas && Date.now() > batas) {
          tampilkanGalat('Masa aktif undangan telah berakhir', 'Terima kasih telah menjadi bagian dari hari bahagia ini.');
          return;
        }
        render(d);
      })
      .catch(function () { tampilkanGalat('Undangan tidak ditemukan', 'Link mungkin salah ketik atau undangan sudah tidak aktif.'); });
  }
})();
