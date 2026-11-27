/*
 * Mesin template undangan v3: pernikahan, khitan, ulang tahun, dan acara umum.
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
  // Demo per paket: undangan/?u=demo-…&paket=basic|premium|eksklusif (hanya untuk undangan demo).
  var paketDiminta = (params.get('paket') || '').toLowerCase();
  // Halaman terima kasih: ?selesai=1 untuk melihat tampilan setelah acara lebih awal.
  var paksaSelesai = params.get('selesai') === '1', modeSelesai = false;
  var app = document.getElementById('app');
  var geraknyaDikurangi = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nama tema lama tetap jalan.
  var ALIAS = { sage: 'moss', emas: 'gold', putih: 'vintage' };
  var FONT = {
    maroon: 'family=Cinzel:wght@400;500&family=Great+Vibes',
    moss: 'family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Great+Vibes',
    vintage: 'family=Bodoni+Moda:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;500&family=Great+Vibes',
    gold: 'family=Cinzel:wght@400;500;600&family=Great+Vibes',
    ceria: 'family=Fredoka:wght@400;500;600&family=Pacifico',
    islami: 'family=Marcellus&family=Parisienne',
    modern: 'family=DM+Serif+Display:ital@0;1'
  };
  // Gaya ornamen & partikel per tema (default: bunga & kelopak).
  var ORNAMEN = { ceria: 'balon', islami: 'geometri', modern: 'garis' };
  var PARTIKEL = { ceria: 'konfeti', islami: 'bintang', modern: 'bintang' };

  var TEMA_VALID = (BRAND.tema || []).map(function (t) { return t.id; });
  if (!TEMA_VALID.length) TEMA_VALID = Object.keys(FONT);
  var ZONA = { WIB: '+07:00', WITA: '+08:00', WIT: '+09:00' };
  var TZ = { WIB: 'Asia/Jakarta', WITA: 'Asia/Makassar', WIT: 'Asia/Jayapura' };

  // Teks yang berbeda untuk tiap jenis undangan.
  var JENIS = {
    pernikahan: {
      menuju: 'Menuju Hari Bahagia', judulHitung: 'Save the Date', profil: 'Mempelai',
      cerita: ['Kisah Kami', 'Love Story'], rsvp: ['Ucapan & Doa', 'RSVP'],
      ajakan: 'Mohon kesediaan Bapak/Ibu/Saudara/i untuk mengonfirmasi kehadiran dan menitipkan doa terbaik.',
      placeholder: function () { return 'Tulis ucapan & doa untuk kedua mempelai'; },
      amplop: ['Tanda Kasih', 'Amplop Digital'],
      pengantarAmplop: 'Doa restu Anda adalah karunia terindah bagi kami. Namun jika ingin memberi tanda kasih, Anda dapat mengirimkannya melalui:',
      penutupLabel: 'Kami yang berbahagia',
      penutup: 'Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
      waRsvp: 'acara pernikahan kalian'
    },
    khitan: {
      menuju: 'Menuju Hari Bahagia', judulHitung: 'Save the Date', profil: 'Profil',
      cerita: ['Momen Berharga', 'Cerita'], rsvp: ['Ucapan & Doa', 'RSVP'],
      ajakan: 'Mohon kesediaan Bapak/Ibu/Saudara/i untuk mengonfirmasi kehadiran dan menitipkan doa terbaik.',
      placeholder: function (nama) { return 'Tulis doa terbaik untuk ' + nama; },
      amplop: ['Tanda Kasih', 'Amplop Digital'],
      pengantarAmplop: 'Doa Anda adalah hadiah terindah bagi kami. Namun jika ingin memberi tanda kasih, Anda dapat mengirimkannya melalui:',
      penutupLabel: 'Kami yang berbahagia',
      penutup: 'Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
      waRsvp: 'acara tasyakuran khitanan'
    },
    ulangtahun: {
      menuju: 'Menuju Hari Spesial', judulHitung: "Let's Celebrate", profil: 'Profil',
      cerita: ['Cerita Tumbuh', 'Momen'], rsvp: ['Ucapan Selamat', 'RSVP'],
      ajakan: 'Kabari kami kalau kamu bisa datang, ya. Jangan lupa tinggalkan ucapan dan doa terbaik!',
      placeholder: function (nama) { return 'Tulis ucapan selamat untuk ' + nama; },
      amplop: ['Kirim Hadiah', 'Kado'],
      pengantarAmplop: 'Kehadiranmu sudah jadi hadiah terbaik. Tapi kalau ingin mengirim kado, bisa melalui:',
      penutupLabel: 'Sampai jumpa di pesta!',
      penutup: 'Terima kasih atas doa dan ucapannya. Kehadiranmu akan membuat hari ini semakin meriah.',
      waRsvp: 'acara ulang tahun'
    },
    acara: {
      menuju: 'Menuju Acara', judulHitung: 'Save the Date', profil: 'Tentang',
      cerita: ['Cerita Kami', 'Tentang'], rsvp: ['Konfirmasi Kehadiran', 'RSVP'],
      ajakan: 'Mohon konfirmasi kehadiran Anda agar kami dapat mempersiapkan acara dengan baik.',
      placeholder: function () { return 'Pesan atau pertanyaan untuk panitia (opsional)'; },
      amplop: ['Kontribusi', 'Donasi'],
      pengantarAmplop: 'Bagi yang ingin berkontribusi untuk acara ini, dapat melalui:',
      penutupLabel: 'Hormat kami',
      penutup: 'Atas perhatian dan kehadiran Bapak/Ibu/Saudara/i, kami ucapkan terima kasih.',
      waRsvp: 'acara'
    }
  };

  var timerHitung = null;
  var timerSlide = null;
  var audio = null;
  var sudahDibuka = langsungBuka;
  var pengamat = null;
  var pengamatNav = null;
  var orn = null; // set ornamen untuk tema yang sedang dirender

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
  function warnaAman(s) { s = teks(s); return /^#[0-9a-f]{3,8}$/i.test(s) ? s : ''; }
  function hanyaAngka(s) { return teks(s).replace(/\D/g, ''); }
  function paragraf(s, kelas) {
    return teks(s).split(/\n+/).filter(Boolean).map(function (p) { return el('p', { class: kelas || 'paragraf muncul', text: p }); });
  }

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

  // Titik fokus foto latar (sampul, slide, latar hitung mundur & penutup).
  // "x% y%" = letak wajah/subjek di foto asli, contoh "40% 35%". Foto digeser, dan bila perlu
  // sedikit diperbesar, supaya subjek tepat di tengah layar pada ukuran layar apa pun.
  var fokusPerFoto = {}, daftarFokus = [];
  function bacaFokus(s) {
    var b = fokusAman(s).split(/\s+/).map(parseFloat).filter(function (n) { return !isNaN(n); });
    if (b.length < 2) return null;
    return { x: Math.min(95, Math.max(5, b[0])) / 100, y: Math.min(95, Math.max(5, b[1])) / 100, zoom: b[2] >= 1 && b[2] <= 3 ? b[2] : 1 };
  }
  function hitungFokus(it) {
    var g = it.gambar;
    if (!it.el.isConnected || !g.naturalWidth) return;
    var cw = it.el.clientWidth, ch = it.el.clientHeight * it.tinggi;
    if (!cw || !ch) return;
    var w = g.naturalWidth, h = g.naturalHeight, f = it.fokus;
    var s = Math.max(cw / w, ch / h) * f.zoom;
    s = Math.max(s, cw / (2 * Math.min(f.x, 1 - f.x) * w)); // cukup lebar agar subjek bisa tepat di tengah
    var W = w * s, H = h * s;
    var X = Math.min(0, Math.max(cw - W, cw / 2 - f.x * W));
    var Y = Math.min(0, Math.max(ch - H, ch * 0.36 - f.y * H));
    it.el.style.setProperty('--bg-ukuran', W.toFixed(1) + 'px ' + H.toFixed(1) + 'px');
    it.el.style.setProperty('--bg-posisi', X.toFixed(1) + 'px ' + Y.toFixed(1) + 'px');
  }
  // kotak: elemen yang ukurannya menjadi bingkai foto; tinggi: porsi tinggi kotak yang dipakai foto.
  function pasangFokus(kotak, url, tinggi) {
    var f = bacaFokus(fokusPerFoto[url]);
    if (!f || !url) return;
    var it = { el: kotak, fokus: f, tinggi: tinggi || 1, gambar: new Image() };
    it.gambar.onload = function () { hitungFokus(it); };
    it.gambar.src = url;
    daftarFokus.push(it);
  }
  var tundaUkur;
  window.addEventListener('resize', function () {
    clearTimeout(tundaUkur);
    tundaUkur = setTimeout(function () {
      daftarFokus = daftarFokus.filter(function (it) { return it.el.isConnected; });
      daftarFokus.forEach(hitungFokus);
    }, 150);
  });

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

  function muatFont(tema, denganArab) {
    var href = 'https://fonts.googleapis.com/css2?' + FONT[tema] + (denganArab ? '&family=Amiri:wght@400;700' : '') + '&display=swap';
    var link = document.getElementById('font-tema');
    if (!link) { link = el('link', { id: 'font-tema', rel: 'stylesheet' }); document.head.append(link); }
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  }

  /* =========================================================
     Ikon & ornamen (SVG statis buatan sendiri)
     ========================================================= */

  var IKON = {
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2"/>',
    rumah: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    hati: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    orang: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
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
    kado: '<path d="M3 7h18v4H3zM5 11v9h14v-9M12 7v13"/>',
    baju: '<path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z"/>',
    telepon: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    daftar: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'
  };
  function ikon(nama) {
    return statis('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + IKON[nama] + '</svg>', 'ikon');
  }

  var ORN = (function () {
    function n(v) { return Math.round(v * 10) / 10; }
    function titik(x, y, r) { return '<circle class="titik" cx="' + x + '" cy="' + y + '" r="' + r + '"/>'; }
    function bintang5(x, y, r, kelas) {
      var p = [];
      for (var i = 0; i < 10; i++) {
        var rr = i % 2 ? r * 0.45 : r;
        var a = -Math.PI / 2 + i * Math.PI / 5;
        p.push(n(x + rr * Math.cos(a)) + ' ' + n(y + rr * Math.sin(a)));
      }
      return '<path class="' + (kelas || 'bintang') + '" d="M' + p.join('L') + 'Z"/>';
    }
    // Bintang segi delapan (dua persegi bertumpuk), khas ornamen Islami.
    function bintang8(x, y, r, kelas) {
      function persegi(putar) {
        var p = [];
        for (var i = 0; i < 4; i++) {
          var a = putar + i * Math.PI / 2;
          p.push(n(x + r * Math.cos(a)) + ' ' + n(y + r * Math.sin(a)));
        }
        return 'M' + p.join('L') + 'Z';
      }
      return '<path class="' + (kelas || 'garis-emas') + '" d="' + persegi(0) + persegi(Math.PI / 4) + '"/>';
    }

    /* ---------- set: bunga (tema pernikahan) ---------- */
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
        lapis(8, r * 0.46, r * 0.56, r * 0.5, 0, g) + lapis(7, r * 0.38, r * 0.44, r * 0.32, 24, g) + lapis(6, r * 0.28, r * 0.32, r * 0.17, 10, g) +
        '<circle r="' + n(r * 0.15) + '" class="inti"/><circle r="' + n(r * 0.06) + '" class="inti-dalam"/></g>';
    }
    function kuntum(x, y, r) {
      return '<g transform="translate(' + x + ' ' + y + ')">' + lapis(5, r * 0.42, r * 0.55, r * 0.5, 0, 'g-b2') + '<circle r="' + n(r * 0.2) + '" class="inti"/></g>';
    }
    function tunas(x, y, r, sudut) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + sudut + ')">' + daun(0, 0, r * 1.15, -28) + daun(0, 0, r * 1.15, 28) +
        '<ellipse class="kelopak-b" cx="0" cy="' + n(-r) + '" rx="' + n(r * 0.55) + '" ry="' + n(r) + '" fill="url(#g-b1)"/></g>';
    }
    /* ---------- bunga realistis berlapis (tema pernikahan) ----------
       Tiap rangkaian terdiri dari beberapa "tangkai" (lapisan SVG terpisah). Di CSS, tiap tangkai
       berayun sendiri dengan irama berbeda (.tangkai, @keyframes angin), jadi terlihat tertiup angin. */
    var KELOPAK_MAWAR = 'M0 0C-.5 -.05 -.78 -.5 -.6 -.86C-.45 -1.08 -.15 -1.06 0 -.98C.15 -1.06 .45 -1.08 .6 -.86C.78 -.5 .5 -.05 0 0Z';
    var TEPI_MAWAR = 'M-.56 -.84C-.42 -1 -.16 -1 0 -.93C.16 -1 .42 -1 .56 -.84';
    var KELOPAK_CANGKIR = 'M0 0C-.42 -.1 -.56 -.62 -.3 -.93C-.12 -1.05 .12 -1.05 .3 -.93C.56 -.62 .42 -.1 0 0Z';
    var KELOPAK_PEONI = 'M0 0C-.62 -.26 -.8 -.84 -.36 -1Q-.18 -1.1 0 -1.01Q.18 -1.1 .36 -1C.8 -.84 .62 -.26 0 0Z';
    // Daun mawar: bulat telur dengan tepi bergerigi halus (dibuat dari titik-titik, dua sisi terpisah untuk efek cahaya).
    var DAUN_KANAN = 'M0 0L.154 -.062L.258 -.125L.355 -.188L.396 -.25L.453 -.312L.456 -.375L.477 -.438L.448 -.5L.44 -.562L.383 -.625L.352 -.688L.277 -.75L.231 -.812L.144 -.875L.072 -.938L0 -1Q.03 -.5 0 0Z';
    var DAUN_KIRI = 'M0 0L-.154 -.062L-.258 -.125L-.355 -.188L-.396 -.25L-.453 -.312L-.456 -.375L-.477 -.438L-.448 -.5L-.44 -.562L-.383 -.625L-.352 -.688L-.277 -.75L-.231 -.812L-.144 -.875L-.072 -.938L0 -1Q.03 -.5 0 0Z';
    var URAT_KELOPAK = 'M0 -.1Q.03 -.45 0 -.78M-.1 -.14Q-.24 -.44 -.32 -.7M.1 -.14Q.24 -.44 .32 -.7';
    function acakB(seed) {
      return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var r = Math.imul(seed ^ seed >>> 15, 1 | seed);
        r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r;
        return ((r ^ r >>> 14) >>> 0) / 4294967296;
      };
    }
    function kelopakR(d, sudut, w, h, isi, tepi) {
      var t = 'rotate(' + n(sudut) + ') scale(' + n(w) + ' ' + n(h) + ')';
      return '<path d="' + d + '" transform="' + t + '" fill="url(#' + isi + ')" class="garis-kelopak" vector-effect="non-scaling-stroke"/>' +
        (tepi ? '<path d="' + URAT_KELOPAK + '" transform="' + t + '" class="urat-kelopak" vector-effect="non-scaling-stroke"/>' +
          '<path d="' + TEPI_MAWAR + '" transform="' + t + '" class="tepi-kelopak" vector-effect="non-scaling-stroke"/>' : '');
    }
    function bayang(x, y, rx, ry) { return '<ellipse cx="' + n(x) + '" cy="' + n(y) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="url(#g-bayang)"/>'; }
    // Mawar mekar dilihat dari atas: kelopak luar lebar & terang, makin ke tengah makin gelap dan menguncup.
    function mawar(x, y, r, v, putar, seed) {
      var rnd = acakB(seed), g = 'g-kel' + v, gd = 'g-kel' + v + 'd', i;
      var s = bayang(x + r * 0.1, y + r * 0.24, r * 1.22, r * 1.06) + '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + (putar || 0) + ')">';
      for (i = 0; i < 6; i++) s += kelopakR(KELOPAK_MAWAR, i * 60 + (rnd() - 0.5) * 16, r * (0.94 + rnd() * 0.12), r * (0.94 + rnd() * 0.12), g, true);
      for (i = 0; i < 5; i++) s += kelopakR(KELOPAK_MAWAR, 30 + i * 72 + (rnd() - 0.5) * 16, r * 0.74, r * 0.77, g, true);
      for (i = 0; i < 5; i++) s += kelopakR(KELOPAK_CANGKIR, 14 + i * 72 + (rnd() - 0.5) * 22, r * 0.54, r * 0.58, g, true);
      for (i = 0; i < 4; i++) s += kelopakR(KELOPAK_CANGKIR, 50 + i * 90, r * 0.36, r * 0.4, g, false);
      for (i = 0; i < 3; i++) s += kelopakR(KELOPAK_CANGKIR, 20 + i * 120, r * 0.22, r * 0.26, gd, false);
      s += '<circle r="' + n(r * 0.1) + '" fill="url(#' + gd + ')"/>' +
        '<path class="spiral' + v + '" d="M0 ' + n(-r * 0.03) + 'a' + n(r * 0.05) + ' ' + n(r * 0.05) + ' 0 1 1 ' + n(r * 0.07) + ' ' + n(r * 0.05) +
        'a' + n(r * 0.11) + ' ' + n(r * 0.11) + ' 0 1 1 ' + n(-r * 0.16) + ' ' + n(-r * 0.09) + 'a' + n(r * 0.18) + ' ' + n(r * 0.18) + ' 0 1 1 ' + n(r * 0.24) + ' ' + n(r * 0.16) + '"/>';
      return s + '</g>';
    }
    // Peoni: kelopak bergerigi bertumpuk lima lapis, benang sari emas di tengah.
    function peoni(x, y, r, v, putar, seed) {
      var rnd = acakB(seed), s = bayang(x + r * 0.1, y + r * 0.22, r * 1.2, r * 1.05) + '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + (putar || 0) + ')">';
      [[9, 1, 1.05, 0], [8, 0.8, 0.95, 18], [7, 0.6, 0.85, 6], [6, 0.4, 0.78, 28], [5, 0.25, 0.8, 12]].forEach(function (c, k) {
        for (var i = 0; i < c[0]; i++) {
          var h = r * c[1] * (0.9 + rnd() * 0.2);
          s += kelopakR(KELOPAK_PEONI, c[3] + i * 360 / c[0] + (rnd() - 0.5) * 16, h * c[2], h, 'g-kel' + v + (k > 1 ? 'd' : ''), k < 2);
        }
      });
      s += '<circle r="' + n(r * 0.08) + '" class="inti"/>';
      for (var j = 0; j < 10; j++) { var b = j * 36 * Math.PI / 180; s += '<circle cx="' + n(Math.cos(b) * r * 0.11) + '" cy="' + n(Math.sin(b) * r * 0.11) + '" r="' + n(r * 0.025) + '" class="inti-dalam"/>'; }
      return s + '</g>';
    }
    // Kuncup mawar di ujung tangkai
    function kuncupMawar(x, y, r, v, sudut) {
      return '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + sudut + ')">' +
        daunR(0, r * 0.9, r * 1.3, -42, true) + daunR(0, r * 0.9, r * 1.3, 42, true) +
        '<path d="' + KELOPAK_CANGKIR + '" transform="scale(' + n(r * 0.95) + ' ' + n(r * 1.35) + ')" fill="url(#g-kel' + v + 'd)" class="garis-kelopak" vector-effect="non-scaling-stroke"/>' +
        '<path d="' + KELOPAK_CANGKIR + '" transform="translate(' + n(-r * 0.22) + ' ' + n(r * 0.05) + ') rotate(-16) scale(' + n(r * 0.62) + ' ' + n(r * 1.1) + ')" fill="url(#g-kel' + v + ')" class="garis-kelopak" vector-effect="non-scaling-stroke"/>' +
        '<path d="' + KELOPAK_CANGKIR + '" transform="translate(' + n(r * 0.24) + ' ' + n(r * 0.08) + ') rotate(18) scale(' + n(r * 0.55) + ' ' + n(r * 1) + ')" fill="url(#g-kel' + v + ')" class="garis-kelopak" vector-effect="non-scaling-stroke"/></g>';
    }
    // Daun runcing dengan tulang & urat daun
    function daunR(x, y, p, sudut, gelap) {
      var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + n(sudut) + ')">' +
        '<path d="' + DAUN_KANAN + '" transform="scale(' + n(p * 0.62) + ' ' + n(p) + ')" fill="url(#g-daun' + (gelap ? 'R2' : 'R') + ')" class="garis-daun" vector-effect="non-scaling-stroke"/>' +
        '<path d="' + DAUN_KIRI + '" transform="scale(' + n(p * 0.62) + ' ' + n(p) + ')" fill="url(#g-daun' + (gelap ? 'R3' : 'R2') + ')" class="garis-daun" vector-effect="non-scaling-stroke"/>' +
        '<path class="urat-daun" d="M0 0Q' + n(p * 0.04) + ' ' + n(-p * 0.5) + ' ' + n(p * 0.02) + ' ' + n(-p * 0.94);
      for (var k = 1; k < 4; k++) {
        var yy = -p * k * 0.22;
        s += 'M' + n(p * 0.015) + ' ' + n(yy) + 'q' + n(p * 0.09) + ' ' + n(-p * 0.04) + ' ' + n(p * 0.16) + ' ' + n(-p * 0.12) +
          'M' + n(p * 0.015) + ' ' + n(yy) + 'q' + n(-p * 0.09) + ' ' + n(-p * 0.04) + ' ' + n(-p * 0.16) + ' ' + n(-p * 0.12);
      }
      return s + '"/></g>';
    }
    // Bunga kecil lima kelopak (putih-merona)
    function kembang(x, y, r, putar) {
      var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + (putar || 0) + ')">';
      for (var i = 0; i < 5; i++) s += '<ellipse cx="0" cy="' + n(-r * 0.56) + '" rx="' + n(r * 0.42) + '" ry="' + n(r * 0.62) + '" transform="rotate(' + i * 72 + ')" fill="url(#g-putih)" class="garis-kelopak"/>';
      s += '<circle r="' + n(r * 0.24) + '" class="inti"/>';
      for (var j = 0; j < 6; j++) { var b = j * 60 * Math.PI / 180; s += '<circle cx="' + n(Math.cos(b) * r * 0.3) + '" cy="' + n(Math.sin(b) * r * 0.3) + '" r="' + n(r * 0.06) + '" class="inti-dalam"/>'; }
      return s + '</g>';
    }
    // Tangkai kayu putih (eucalyptus): daun bulat keperakan berselang-seling
    function kayuPutih(titikTitik, ukuran, seed, tanpaBatang) {
      var rnd = acakB(seed), s = tanpaBatang ? '' : '<path class="tangkai-garis" d="M' + titikTitik.map(function (t) { return n(t[0]) + ' ' + n(t[1]); }).join('L') + '"/>';
      for (var i = 0; i < titikTitik.length - 1; i++) {
        var a = titikTitik[i], b = titikTitik[i + 1];
        for (var k = 0; k < 3; k++) {
          var t = (k + 0.5) / 3, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
          var sudut = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI + ((i * 3 + k) % 2 ? 90 : -90);
          var r = ukuran * (1 - (i * 3 + k) / (titikTitik.length * 3 + 2)) * (0.85 + rnd() * 0.3);
          var cx = x + Math.cos(sudut * Math.PI / 180) * r * 0.9, cy = y + Math.sin(sudut * Math.PI / 180) * r * 0.9;
          s += '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(r) + '" ry="' + n(r * 0.86) + '" transform="rotate(' + n(sudut) + ' ' + n(cx) + ' ' + n(cy) + ')" fill="url(#g-kayu)" class="garis-kelopak"/>' +
            '<path class="urat-daun" d="M' + n(x) + ' ' + n(y) + 'L' + n(cx + (cx - x) * 0.6) + ' ' + n(cy + (cy - y) * 0.6) + '"/>';
        }
      }
      return s;
    }
    // Baby's breath: ranting tipis dengan butir bunga putih kecil
    function bayi(x, y, panjang, sudut, seed) {
      var rnd = acakB(seed), s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + sudut + ')"><path class="tangkai-garis tipis" d="M0 0Q' + n(panjang * 0.1) + ' ' + n(-panjang * 0.5) + ' 0 ' + n(-panjang) + '"/>';
      for (var i = 0; i < 5; i++) {
        var py = -panjang * (0.45 + i * 0.12), arah = i % 2 ? 1 : -1, ex = arah * (10 + rnd() * 10), ey = py - 8 - rnd() * 8;
        s += '<path class="tangkai-garis tipis" d="M0 ' + n(py) + 'L' + n(ex) + ' ' + n(ey) + '"/>';
        for (var k = 0; k < 4; k++) s += '<circle cx="' + n(ex + (rnd() - 0.5) * 9) + '" cy="' + n(ey + (rnd() - 0.5) * 8) + '" r="' + n(1.4 + rnd() * 1.4) + '" class="butir-bayi"/>';
      }
      for (var j = 0; j < 4; j++) s += '<circle cx="' + n((rnd() - 0.5) * 9) + '" cy="' + n(-panjang + (rnd() - 0.5) * 8) + '" r="' + n(1.5 + rnd() * 1.3) + '" class="butir-bayi"/>';
      return s + '</g>';
    }
    // Ranting pakis emas
    function pakisEmas(x, y, panjang, sudut) {
      var s = '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + sudut + ')"><path class="daun-emas" d="M0 0Q4 ' + n(-panjang * 0.5) + ' 0 ' + n(-panjang) + '"/>';
      for (var i = 1; i < 8; i++) {
        var t = i / 8, py = -panjang * t, L = 9 * (1 - t * 0.6), ox = 2 * Math.sin(t * 3);
        s += '<path class="daun-emas" d="M' + n(ox) + ' ' + n(py) + 'q' + n(L * 0.6) + ' -3 ' + n(L) + ' ' + n(-L * 0.7) + 'M' + n(ox) + ' ' + n(py) + 'q' + n(-L * 0.6) + ' -3 ' + n(-L) + ' ' + n(-L * 0.7) + '"/>';
      }
      return s + '</g>';
    }
    // Satu lapisan tangkai: ox/oy = titik tumpu ayunan (% dari kotak), a = sudut ayun, d = lama satu irama.
    function lapisanTangkai(lebar, tinggi, isi, ox, oy, a, d) {
      return '<span class="ayunan" style="--ox:' + ox + '%;--oy:' + oy + '%;--a:' + a + 'deg;--d:' + d + 's"><svg viewBox="0 0 ' + lebar + ' ' + tinggi + '">' + isi + '</svg></span>';
    }
    function ukuran(lebar, tinggi) { return '<svg class="ukuran" viewBox="0 0 ' + lebar + ' ' + tinggi + '"></svg>'; }

    // Rangkaian sudut: gerombol bunga yang rapat (sedikit batang), daun pendek mengintip di tepinya.
    function isiSudut() {
        var dedaun = '';
        [[176, 208, 30, 62, 0], [206, 252, 30, 80, 1], [122, 182, 30, 28, 0], [80, 156, 30, -8, 1], [40, 168, 30, -40, 0],
          [20, 214, 30, -62, 1], [150, 196, 26, 44, 1], [232, 290, 26, 96, 0], [100, 150, 24, 10, 0]]
          .forEach(function (d) { dedaun += daunR(d[0], d[1], d[2], d[3], d[4]); });
        dedaun += pakisEmas(150, 210, 44, 46) + pakisEmas(56, 170, 42, -18);
        var kayu = kayuPutih([[96, 250], [150, 212], [196, 190]], 9, 3, true) + kayuPutih([[40, 240], [30, 196], [34, 156]], 8, 8, true);
        var ranting = bayi(186, 226, 40, 64, 4) + bayi(70, 160, 38, -14, 6) + bayi(226, 276, 34, 84, 9) +
          kuncupMawar(172, 188, 10, 1, 40) + kuncupMawar(66, 146, 9, 2, -20) + kuncupMawar(236, 262, 9, 1, 76);
        var kecil = peoni(118, 204, 30, 1, 30, 14) + mawar(178, 236, 25, 2, 18, 16) + mawar(76, 186, 22, 2, -20, 18) +
          kembang(150, 182, 12, 10) + kembang(204, 216, 11, 40) + kembang(212, 270, 12, 20) + kembang(44, 150, 11, 30) +
          kembang(98, 166, 10, 70) + kembang(142, 230, 10, 50) + kembang(26, 200, 10, 15);
        var utama = peoni(60, 236, 54, 2, 10, 3) + mawar(136, 268, 44, 1, -12, 5) + mawar(30, 174, 30, 1, 34, 9) + mawar(196, 298, 28, 2, 20, 12) +
          daunR(100, 300, 28, 52) + daunR(168, 306, 26, 84, true) + kembang(96, 286, 10, 25);
        return [dedaun, kayu, ranting, kecil, utama];
    }
    function isiUntaian() {
        var sisi = '<path class="tangkai-garis" d="M156 60C118 52 82 46 22 58"/>' +
          daunR(132, 56, 19, -78) + daunR(110, 52, 20, -100, true) + daunR(88, 50, 19, -76) + daunR(66, 52, 17, -104, true) + daunR(46, 56, 14, -82) +
          kayuPutih([[150, 64], [116, 68], [80, 69], [50, 66]], 5.5, 5) + bayi(96, 54, 28, -64, 2) + kembang(120, 44, 8, 20) + kembang(76, 46, 7, 50) + kembang(100, 62, 6, 10);
        return [sisi, '<g transform="translate(320 0) scale(-1 1)">' + sisi + '</g>',
          daunR(148, 66, 20, -54, true) + daunR(172, 66, 20, 54, true) + kuncupMawar(134, 42, 7, 2, -42) + kuncupMawar(186, 42, 7, 2, 42) + mawar(160, 50, 25, 1, 0, 11)];
    }
    // Lapisan: [titik tumpu x%, y%, sudut ayun, lama irama]
    var AYUN_SUDUT = [[1, 100, 2.4, 7.6], [2, 100, 4.2, 6.2], [6, 100, 5.2, 5.4], [10, 100, 3, 6.8], [8, 100, 1.5, 8.4]];
    var AYUN_UNTAIAN = [[50, 66, 3.2, 6.4], [50, 66, -3.2, 6.9], [50, 75, 1.4, 7.8]];
    function pakai(lebar, tinggi, awalan, ayun) {
      return ukuran(lebar, tinggi) + ayun.map(function (a, i) { return lapisanTangkai(lebar, tinggi, '<use href="#' + awalan + i + '"/>', a[0], a[1], a[2], a[3]); }).join('');
    }
    var bungaSet = {
      // Digambar sekali di <defs>, dipakai ulang oleh semua sudut & untaian (DOM tetap ringan).
      simbol: function () {
        return isiSudut().map(function (isi, i) { return '<g id="bs-s' + i + '">' + isi + '</g>'; }).join('') +
          isiUntaian().map(function (isi, i) { return '<g id="bs-u' + i + '">' + isi + '</g>'; }).join('');
      },
      sudut: function () { return pakai(300, 300, 'bs-s', AYUN_SUDUT); },
      untaian: function () { return pakai(320, 90, 'bs-u', AYUN_UNTAIAN); },
      pembatas: function () {
        return '<svg viewBox="0 0 240 30"><path class="garis-emas" d="M8 15H96M144 15H232"/>' + daun(104, 15, 14, -90, 'daun-emas') + daun(136, 15, 14, 90, 'daun-emas') +
          kembang(120, 15, 8, 0) + titik(92, 15, 1.6) + titik(148, 15, 1.6) + '</svg>';
      }
    };

    /* ---------- set: balon (tema ceria) ---------- */
    function balon(x, y, r, g) {
      var ry = r * 1.18, bawah = y + ry;
      return '<path class="tali" d="M' + x + ' ' + n(bawah + 5) + 'C' + n(x - 12) + ' ' + n(bawah + 50) + ' ' + n(x * 0.4) + ' ' + n(bawah + 90) + ' -6 306"/>' +
        '<path d="M' + n(x - 5) + ' ' + n(bawah + 6) + 'L' + x + ' ' + n(bawah - 2) + 'L' + n(x + 5) + ' ' + n(bawah + 6) + 'Z" fill="url(#' + g + ')"/>' +
        '<ellipse cx="' + x + '" cy="' + y + '" rx="' + r + '" ry="' + n(ry) + '" fill="url(#' + g + ')"/>' +
        '<ellipse class="kilap" cx="' + n(x - r * 0.38) + '" cy="' + n(y - ry * 0.38) + '" rx="' + n(r * 0.16) + '" ry="' + n(ry * 0.26) + '" transform="rotate(-25 ' + n(x - r * 0.38) + ' ' + n(y - ry * 0.38) + ')"/>';
    }
    function konfeti(x, y, w, h, sudut, kelas) {
      return '<rect class="' + kelas + '" x="' + n(x - w / 2) + '" y="' + n(y - h / 2) + '" width="' + w + '" height="' + h + '" rx="1" transform="rotate(' + sudut + ' ' + x + ' ' + y + ')"/>';
    }
    var balonSet = {
      sudut: function () {
        var s = balon(150, 196, 22, 'g-bal2') + balon(96, 74, 22, 'g-bal1') + balon(38, 108, 26, 'g-bal3') + balon(122, 132, 30, 'g-bal2') + balon(62, 176, 34, 'g-bal1');
        s += bintang5(196, 140, 9, 'bintang') + bintang5(24, 40, 7, 'bintang') + bintang5(176, 70, 6, 'bintang') + bintang5(210, 236, 7, 'bintang');
        [[188, 104, 8, 4, 30, 'kf1'], [146, 40, 8, 4, -20, 'kf2'], [222, 186, 7, 4, 60, 'kf3'], [12, 170, 7, 4, 15, 'kf2'], [236, 270, 8, 4, -40, 'kf1'], [168, 270, 6, 3, 70, 'kf3']]
          .forEach(function (k) { s += konfeti(k[0], k[1], k[2], k[3], k[4], k[5]); });
        s += titik(120, 30, 3) + titik(206, 210, 2.5) + titik(14, 250, 2.5);
        return '<svg viewBox="0 0 300 300">' + s + '</svg>';
      },
      untaian: function () {
        // Bendera segitiga (bunting) di sepanjang tali melengkung.
        var s = '<path class="tali-bunting" d="M10 16Q160 70 310 16"/>';
        var kelas = ['kf1', 'kf2', 'kf3'];
        for (var i = 0; i < 9; i++) {
          var t = (i + 0.5) / 9;
          var x = 10 * (1 - t) * (1 - t) + 160 * 2 * t * (1 - t) + 310 * t * t;
          var y = 16 * (1 - t) * (1 - t) + 70 * 2 * t * (1 - t) + 16 * t * t;
          s += '<path class="' + kelas[i % 3] + '" d="M' + n(x - 12) + ' ' + n(y - 2) + 'L' + n(x + 12) + ' ' + n(y - 2) + 'L' + n(x) + ' ' + n(y + 24) + 'Z"/>';
        }
        return '<svg viewBox="0 0 320 90">' + s + '</svg>';
      },
      pembatas: function () {
        return '<svg viewBox="0 0 240 30"><path class="garis-emas" d="M20 15H98M142 15H220"/>' + bintang5(120, 15, 9, 'bintang') +
          konfeti(108, 10, 6, 3, 30, 'kf1') + konfeti(132, 21, 6, 3, -30, 'kf2') + titik(14, 15, 2) + titik(226, 15, 2) + '</svg>';
      }
    };

    /* ---------- set: geometri (tema Islami) ---------- */
    var geometriSet = {
      sudut: function () {
        var s = '';
        [70, 130, 190, 250].forEach(function (r, i) { s += '<circle class="garis-emas tipis" cx="0" cy="300" r="' + r + '"/>'; });
        s += bintang8(0, 300, 100, 'garis-emas') + bintang8(0, 300, 160, 'garis-emas tipis') + bintang8(0, 300, 220, 'garis-emas');
        [[70, 230, 16], [130, 190, 11], [40, 160, 10], [180, 250, 9], [96, 120, 8], [206, 170, 7]].forEach(function (b) { s += bintang8(b[0], b[1], b[2], 'bintang-isi'); });
        s += titik(150, 140, 2.4) + titik(60, 100, 2) + titik(230, 216, 2) + titik(110, 270, 2);
        return '<svg viewBox="0 0 300 300">' + s + '</svg>';
      },
      untaian: function () {
        var s = '<path class="garis-emas" d="M20 45H128M192 45H300"/><path class="garis-emas tipis" d="M40 53H128M192 53H280"/>';
        s += bintang8(160, 45, 22, 'garis-emas') + bintang8(160, 45, 14, 'bintang-isi') + bintang8(112, 45, 7, 'bintang-isi') + bintang8(208, 45, 7, 'bintang-isi');
        s += titik(20, 45, 2.4) + titik(300, 45, 2.4);
        return '<svg viewBox="0 0 320 90">' + s + '</svg>';
      },
      pembatas: function () {
        return '<svg viewBox="0 0 240 30"><path class="garis-emas" d="M14 15H100M140 15H226"/>' + bintang8(120, 15, 11, 'garis-emas') + bintang8(120, 15, 6, 'bintang-isi') + '</svg>';
      }
    };

    /* ---------- set: garis (tema modern) ---------- */
    var garisSet = {
      sudut: function () {
        var s = '';
        [60, 100, 140, 180].forEach(function (r) { s += '<path class="garis-emas tipis" d="M0 ' + (300 - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + r + ' 300"/>'; });
        for (var i = 0; i < 5; i++) for (var j = 0; j < 5; j++) s += titik(150 + i * 14, 150 + j * 14, 1.6);
        s += '<circle class="bulat-aksen" cx="210" cy="96" r="14"/>' + '<path class="garis-emas" d="M20 60L120 60"/>';
        return '<svg viewBox="0 0 300 300">' + s + '</svg>';
      },
      untaian: function () {
        return '<svg viewBox="0 0 320 90"><path class="garis-emas" d="M60 45H146M174 45H260"/><path class="belah-ketupat" d="M160 33L172 45L160 57L148 45Z"/>' +
          titik(52, 45, 2) + titik(268, 45, 2) + '</svg>';
      },
      pembatas: function () {
        return '<svg viewBox="0 0 240 30"><path class="garis-emas" d="M60 15H112M128 15H180"/><circle class="bulat-aksen" cx="120" cy="15" r="3.5"/></svg>';
      }
    };

    function defs(gaya) {
      return '<svg class="orn-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
        '<radialGradient id="g-b1" cx=".5" cy="1" r="1"><stop offset="0" class="s-b1a"/><stop offset="1" class="s-b1b"/></radialGradient>' +
        '<radialGradient id="g-b2" cx=".5" cy="1" r="1"><stop offset="0" class="s-b2a"/><stop offset="1" class="s-b2b"/></radialGradient>' +
        '<linearGradient id="g-d" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="s-da"/><stop offset="1" class="s-db"/></linearGradient>' +
        '<linearGradient id="g-emas" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="s-e1"/><stop offset=".5" class="s-e2"/><stop offset="1" class="s-e1"/></linearGradient>' +
        '<radialGradient id="g-bal1" cx=".35" cy=".3" r=".8"><stop offset="0" class="s-b1b"/><stop offset="1" class="s-b1a"/></radialGradient>' +
        '<radialGradient id="g-bal2" cx=".35" cy=".3" r=".8"><stop offset="0" class="s-b2b"/><stop offset="1" class="s-b2a"/></radialGradient>' +
        '<radialGradient id="g-bal3" cx=".35" cy=".3" r=".8"><stop offset="0" class="s-db"/><stop offset="1" class="s-da"/></radialGradient>' +
        '<linearGradient id="g-kel1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="s-b1a"/><stop offset=".55" class="s-b1m"/><stop offset="1" class="s-b1b"/></linearGradient>' +
        '<linearGradient id="g-kel1d" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="s-b1g"/><stop offset="1" class="s-b1a"/></linearGradient>' +
        '<linearGradient id="g-kel2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="s-b2a"/><stop offset=".55" class="s-b2m"/><stop offset="1" class="s-b2b"/></linearGradient>' +
        '<linearGradient id="g-kel2d" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="s-b2g"/><stop offset="1" class="s-b2a"/></linearGradient>' +
        '<linearGradient id="g-putih" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ecd2c4"/><stop offset=".5" stop-color="#fbf1ea"/><stop offset="1" stop-color="#fffdf9"/></linearGradient>' +
        '<linearGradient id="g-daunR" x1="0" y1="1" x2=".6" y2="0"><stop offset="0" class="s-da"/><stop offset=".45" class="s-db"/><stop offset="1" class="s-dt"/></linearGradient>' +
        '<linearGradient id="g-daunR2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="s-dg"/><stop offset="1" class="s-da"/></linearGradient>' +
        '<linearGradient id="g-daunR3" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="s-dg"/><stop offset="1" class="s-dm2"/></linearGradient>' +
        '<linearGradient id="g-kayu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="s-k1"/><stop offset="1" class="s-k2"/></linearGradient>' +
        '<radialGradient id="g-bayang"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
        ((ambil(gaya || 'bunga').simbol) || '') + '</defs></svg>';
    }

    var set = { bunga: bungaSet, balon: balonSet, geometri: geometriSet, garis: garisSet };
    var cache = {};
    function ambil(gaya) {
      if (!cache[gaya]) {
        var s = set[gaya] || bungaSet;
        cache[gaya] = { gaya: gaya, sudut: s.sudut(), untaian: s.untaian(), pembatas: s.pembatas(), simbol: s.simbol ? s.simbol() : '' };
      }
      return cache[gaya];
    }
    return { ambil: ambil, defs: defs };
  })();

  var PARTIKEL_SVG = {
    kelopak: '<svg viewBox="0 0 20 20"><path class="p-kelopak" d="M10 0C17 5 16 14 10 20C4 14 3 5 10 0Z"/></svg>',
    konfeti: ['<svg viewBox="0 0 20 20"><rect class="kf1" x="4" y="7" width="12" height="6" rx="1"/></svg>',
      '<svg viewBox="0 0 20 20"><rect class="kf2" x="4" y="7" width="12" height="6" rx="1"/></svg>',
      '<svg viewBox="0 0 20 20"><rect class="kf3" x="4" y="7" width="12" height="6" rx="1"/></svg>',
      '<svg viewBox="0 0 20 20"><circle class="kf1" cx="10" cy="10" r="5"/></svg>'],
    bintang: '<svg viewBox="0 0 20 20"><path class="p-bintang" d="M10 0L12 8L20 10L12 12L10 20L8 12L0 10L8 8Z"/></svg>'
  };
  var CHIP = '<svg viewBox="0 0 48 36"><rect class="chip" x="1" y="1" width="46" height="34" rx="6"/><path class="chip-garis" d="M1 12h14M1 24h14M33 12h14M33 24h14M15 1v34M33 1v34M15 18h18"/></svg>';
  var SEGEL = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" class="segel-luar"/><circle cx="50" cy="50" r="39" class="segel-dalam"/><circle cx="50" cy="50" r="35" class="segel-cincin"/></svg>';

  function sudutHias(posisi) { return statis(orn.sudut, 'orn-sudut orn-' + orn.gaya + ' ' + posisi); }
  function untaian(kelas) { return statis(orn.untaian, 'orn-untaian ' + (kelas || '')); }
  function pembatas() { return statis(orn.pembatas, 'orn-pembatas'); }

  function judulBagian(judul, label) {
    return el('header', { class: 'judul-bagian' },
      untaian('muncul'),
      label ? el('p', { class: 'label muncul', text: label }) : null,
      el('h2', { class: 'judul-script muncul', 'data-anim': 'zoom', text: judul }));
  }

  /* =========================================================
     Identitas undangan: nama yang ditampilkan per jenis
     ========================================================= */

  function identitas(d) {
    var jenis = JENIS[d.jenis] ? d.jenis : 'pernikahan';
    var J = JENIS[jenis];
    var id = { jenis: jenis, J: J };
    if (jenis === 'pernikahan') {
      var pria = d.pria || {}, wanita = d.wanita || {};
      var dua = d.urutan === 'wanita' ? [wanita, pria] : [pria, wanita];
      var a = teks(dua[0].panggilan), b = teks(dua[1].panggilan);
      id.nama = [a, b].filter(Boolean).join(' & ') || 'Nama & Nama';
      id.profil = dua;
      id.peran = d.urutan === 'wanita' ? ['mempelai wanita', 'mempelai pria'] : ['mempelai pria', 'mempelai wanita'];
      id.label = teks(d.judul) || 'The Wedding of';
      id.judul = 'The Wedding of ' + id.nama;
      id.kalender = 'Pernikahan ' + id.nama;
      id.inisial = inisial(a) + inisial(b);
      id.tampil = function (kelas) {
        return el('h1', { class: 'nama-pasangan ' + (kelas || '') },
          el('span', { class: 'nm', text: a }), el('span', { class: 'amp', text: '&' }), el('span', { class: 'nm', text: b }));
      };
    } else if (jenis === 'acara') {
      var namaAcara = teks(d.namaAcara) || 'Nama Acara';
      id.nama = namaAcara;
      id.profil = [];
      id.label = teks(d.judul) || 'You are invited to';
      id.judul = namaAcara;
      id.kalender = namaAcara;
      id.inisial = inisial(namaAcara);
      id.tampil = function (kelas) { return el('h1', { class: 'nama-acara ' + (kelas || ''), text: namaAcara }); };
    } else {
      var t = d.tokoh || {};
      var nm = teks(t.panggilan) || 'Nama';
      var usia = teks(d.usia).slice(0, 4);
      id.nama = nm;
      id.profil = [t];
      id.peran = ['profil'];
      if (jenis === 'khitan') {
        id.label = teks(d.judul) || 'Tasyakuran Khitanan';
        id.judul = 'Tasyakuran Khitanan ' + nm;
      } else {
        id.label = teks(d.judul) || (usia ? 'Ulang Tahun ke-' + usia : 'Birthday Party');
        id.judul = (usia ? 'Ulang Tahun ke-' + usia + ' ' : 'Ulang Tahun ') + nm;
      }
      id.kalender = id.judul;
      id.inisial = inisial(nm);
      id.usia = jenis === 'ulangtahun' ? usia : '';
      id.tampil = function (kelas, denganUsia) {
        return el('h1', { class: 'nama-tunggal ' + (kelas || '') },
          denganUsia && id.usia ? el('span', { class: 'usia', text: id.usia }) : null,
          el('span', { class: 'nm', text: nm }));
      };
    }
    return id;
  }

  /* =========================================================
     Bagian-bagian undangan
     ========================================================= */

  function bagianSampul(d, id, tglUtama) {
    var foto = amanUrl(d.sampul);
    var s = el('section', { class: 'sampul' + (foto ? ' berfoto' : ''), id: 'sampul' });
    if (foto) {
      var f = el('div', { class: 'sampul-foto', 'aria-hidden': 'true' });
      f.style.setProperty('--foto-sampul', cssUrl(foto));
      s.append(f);
      pasangFokus(f, foto, 0.82); // foto sampul menempati 82% tinggi atas
    } else {
      s.append(el('div', { class: 'sampul-hias' },
        el('div', { class: 'segel besar' }, statis(SEGEL), el('span', { class: 'segel-huruf', text: id.inisial }))));
    }
    s.append(sudutHias('kiri-bawah'), sudutHias('kanan-bawah'));
    s.append(el('div', { class: 'sampul-isi' },
      el('p', { class: 'label', text: modeSelesai ? 'Terima Kasih' : id.label }),
      id.tampil('sebaris'),
      tglUtama ? el('p', { class: 'tgl-sampul', text: tglUtama }) : null,
      el('div', { class: 'kartu-tamu' },
        el('p', { class: 'kecil', text: modeSelesai ? 'Untuk Bapak/Ibu/Saudara/i' : 'Kepada Yth. Bapak/Ibu/Saudara/i' }),
        el('p', { class: 'nama-tamu', text: tamu || 'Tamu Undangan' }),
        el('p', { class: 'mini', text: modeSelesai ? 'Terima kasih atas kehadiran dan doa restu Anda.' : 'Mohon maaf apabila ada kesalahan penulisan nama atau gelar.' })),
      el('button', { class: 'tombol tombol-buka', type: 'button', onclick: bukaUndangan }, ikon('amplop'), el('span', { class: 'lbl', text: modeSelesai ? 'Lihat Kenangan' : 'Buka Undangan' }))));
    return s;
  }

  function bagianBeranda(d, id, acaraUtama, fotoSlide) {
    var s = el('section', { class: 'beranda', id: 'beranda' });
    var wadah = el('div', { class: 'slide-wadah', 'aria-hidden': 'true' });
    fotoSlide.forEach(function (src, i) {
      var sl = el('div', { class: 'slide' + (i === 0 ? ' aktif' : ''), style: 'animation-delay:-' + (i * 4) + 's' });
      sl.style.backgroundImage = cssUrl(src);
      wadah.append(sl);
      pasangFokus(sl, src, 1);
    });
    if (!fotoSlide.length) wadah.append(el('div', { class: 'slide aktif polos' }));
    s.append(wadah);
    if (!fotoSlide.length) s.append(sudutHias('kiri-atas'), sudutHias('kanan-bawah'));
    else s.append(sudutHias('kiri-bawah kecil'), sudutHias('kanan-bawah kecil')); // bunga di kaki foto beranda
    s.append(el('div', { class: 'beranda-isi' },
      el('p', { class: 'label muncul', text: id.label }),
      id.tampil('muncul', true),
      id.jenis === 'acara' && teks(d.penyelenggara) ? el('p', { class: 'penyelenggara muncul', text: teks(d.penyelenggara) }) : null,
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

  function kartuProfil(o, peran, arah) {
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
        statis(orn.sudut, 'bingkai-bunga orn-' + orn.gaya)),
      el('h3', { class: 'nama-script muncul', text: teks(o.panggilan) }),
      el('p', { class: 'nama-lengkap muncul', text: teks(o.lengkap) }),
      teks(o.ortu) ? el('p', { class: 'ortu muncul', text: teks(o.ortu) }) : null,
      ig ? el('a', { class: 'pil muncul', href: 'https://instagram.com/' + ig, target: '_blank', rel: 'noopener', 'aria-label': 'Instagram ' + peran }, ikon('ig'), '@' + ig) : null);
  }

  function pembukaan(d) {
    return [
      teks(d.arab) ? el('p', { class: 'arab muncul', lang: 'ar', dir: 'rtl', text: teks(d.arab) }) : null,
      teks(d.salam) ? el('p', { class: 'salam muncul', text: teks(d.salam) }) : null,
      teks(d.pembuka) ? el('p', { class: 'paragraf muncul', text: teks(d.pembuka) }) : null
    ];
  }

  function bagianProfil(d, id) {
    var s = el('section', { class: 'bagian mempelai-bagian', id: 'profil' }, sudutHias('kanan-atas kecil'), sudutHias('kiri-bawah kecil'));
    if (id.jenis === 'pernikahan') {
      s.append.apply(s, [].concat(pembukaan(d), [pembatas(),
        kartuProfil(id.profil[0], id.peran[0], 'kiri'),
        el('p', { class: 'dan muncul', 'data-anim': 'zoom', 'aria-hidden': 'true', text: '&' }),
        kartuProfil(id.profil[1], id.peran[1], 'kanan')]).filter(Boolean));
    } else if (id.jenis === 'acara') {
      s.append.apply(s, [].concat([judulBagian('Tentang Acara', teks(d.penyelenggara) ? 'Oleh ' + teks(d.penyelenggara) : '')],
        pembukaan(d), paragraf(d.deskripsi)).filter(Boolean));
    } else {
      var badge = id.usia ? el('p', { class: 'lencana-usia muncul', 'data-anim': 'zoom' }, el('strong', { text: id.usia }), el('span', { text: 'tahun' })) : null;
      s.append.apply(s, [].concat(pembukaan(d), [pembatas(), kartuProfil(id.profil[0], 'profil', 'zoom'), badge], paragraf(d.deskripsi)).filter(Boolean));
    }
    return s;
  }

  function bagianHitung(id, acaraUtama, fotoLatar) {
    if (!acaraUtama || !waktuAcara(acaraUtama)) return null;
    var s = el('section', { class: 'bagian berlatar hitung-bagian' + (fotoLatar ? ' berfoto' : '') });
    if (fotoLatar) { s.style.setProperty('--foto-latar', cssUrl(fotoLatar)); pasangFokus(s, fotoLatar, 1); }
    var kotak = el('div', { class: 'hitung', role: 'timer', 'aria-label': 'Hitung mundur menuju acara' });
    s.append(
      el('p', { class: 'label muncul', text: id.J.menuju }),
      el('h2', { class: 'judul-script muncul', 'data-anim': 'zoom', text: id.J.judulHitung }),
      el('p', { class: 'paragraf muncul', text: fmtTanggal(acaraUtama) }),
      kotak,
      el('a', { class: 'tombol garis muncul', href: linkKalender(acaraUtama, id.kalender), target: '_blank', rel: 'noopener' }, ikon('kalender'), el('span', { class: 'lbl', text: 'Simpan ke Kalender' })));
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
        kotak.append(el('p', { class: 'selesai', text: 'Acara telah berlangsung. Terima kasih atas doa dan kehadirannya.' }));
        return;
      }
      var nilai = [Math.floor(sisa / 864e5), Math.floor(sisa / 36e5) % 24, Math.floor(sisa / 6e4) % 60, Math.floor(sisa / 1e3) % 60];
      nilai.forEach(function (v, i) { angka[i].textContent = String(v).padStart(2, '0'); });
    }
    tik();
    timerHitung = setInterval(tik, 1000);
  }

  function kartuDresscode(d) {
    var tks = teks(d.dresscode);
    var warna = daftar(d.dresscodeWarna).map(warnaAman).filter(Boolean).slice(0, 6);
    if (!tks && !warna.length) return null;
    return el('article', { class: 'kartu dresscode muncul' },
      el('span', { class: 'ikon-bulat' }, ikon('baju')),
      el('p', { class: 'label', text: 'Dress Code' }),
      tks ? el('p', { class: 'paragraf', text: tks }) : null,
      warna.length ? el('div', { class: 'palet' }, warna.map(function (w) { return el('span', { class: 'swatch', style: 'background:' + w, title: w }); })) : null);
  }

  function bagianAcara(d, id) {
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
            waktuAcara(a) ? el('a', { class: 'tombol kecil garis', href: linkKalender(a, teks(a.nama) + ' – ' + id.nama), target: '_blank', rel: 'noopener' }, ikon('kalender'), el('span', { class: 'lbl', text: 'Kalender' })) : null));
      }),
      kartuDresscode(d),
      amanUrl(d.siaran) ? tandaiFitur(el('div', { class: 'kartu-acara siaran muncul' },
        el('p', { class: 'paragraf', text: 'Tidak bisa hadir? Saksikan momen ini secara langsung.' }),
        el('a', { class: 'tombol', href: amanUrl(d.siaran), target: '_blank', rel: 'noopener', onclick: slug.indexOf('demo-') === 0 ? function (e) {
          // Demo belum punya siaran sungguhan: tampilkan penjelasan, jangan membuka beranda YouTube.
          e.preventDefault(); var n = this.parentNode.querySelector('.catatan-demo'); if (n) n.hidden = false;
        } : null }, ikon('siaran'), el('span', { class: 'lbl', text: 'Tonton Siaran Langsung' })),
        slug.indexOf('demo-') === 0 ? el('p', { class: 'catatan-demo', hidden: true, text: 'Ini contoh. Di undangan asli, tombol ini langsung membuka siaran YouTube atau Instagram Live acara kalian.' }) : null), 'siaran') : null);
  }

  function bagianRundown(d) {
    var list = daftar(d.rundown).filter(function (r) { return teks(r.kegiatan); });
    if (!list.length) return null;
    return el('section', { class: 'bagian', id: 'rundown' },
      sudutHias('kanan-atas kecil'), sudutHias('kiri-bawah kecil'),
      judulBagian('Susunan Acara', 'Rundown'),
      el('ol', { class: 'rundown' }, list.map(function (r, i) {
        return el('li', { class: 'muncul', style: '--tunda:' + Math.min(i * 0.06, 0.4) + 's' },
          el('span', { class: 'rd-jam', text: teks(r.jam).replace(':', '.') }),
          el('div', null, el('strong', { text: teks(r.kegiatan) }), teks(r.ket) ? el('small', { text: teks(r.ket) }) : null));
      })));
  }

  function bagianCerita(d, id) {
    var cerita = daftar(d.cerita).filter(function (c) { return teks(c.judul) || teks(c.teks); });
    if (!cerita.length) return null;
    return el('section', { class: 'bagian', id: 'cerita' },
      sudutHias('kanan-atas kecil'), sudutHias('kiri-bawah kecil'),
      judulBagian(teks(d.judulCerita) || id.J.cerita[0], id.J.cerita[1]),
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
    return el('section', { class: 'bagian lembut', id: 'galeri' }, sudutHias('kiri-atas kecil'), sudutHias('kanan-bawah kecil'), judulBagian('Galeri', 'Momen Bahagia'), grid);
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

  function bagianRsvp(d, id) {
    var r = d.rsvp || {};
    if (r.aktif === false) return null;
    var J = id.J;
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
    var ucapan = el('textarea', { name: 'ucapan', rows: 4, maxlength: 500, placeholder: J.placeholder(id.nama) });
    var kirim = el('button', { class: 'tombol', type: 'submit' }, ikon('pesan'), el('span', { class: 'lbl', text: id.jenis === 'acara' ? 'Kirim Konfirmasi' : 'Kirim Ucapan' }));
    form = el('form', { class: 'kartu form-rsvp muncul', onsubmit: kirimRsvp },
      el('label', { class: 'field' }, 'Nama', inputNama),
      radio, bungkusJumlah,
      el('label', { class: 'field' }, id.jenis === 'acara' ? 'Pesan (opsional)' : 'Ucapan & doa', ucapan),
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
        el('div', null, el('strong', { text: String(list.length) }), el('span', { text: id.jenis === 'acara' ? 'Konfirmasi' : 'Ucapan' })),
        el('div', null, el('strong', { text: String(hadir) }), el('span', { text: 'Konfirmasi hadir' })),
        el('div', null, el('strong', { text: String(tidak) }), el('span', { text: 'Tidak hadir' })));
      daftarUcapan.textContent = '';
      var berisi = list.filter(function (u) { return teks(u.ucapan); });
      if (!berisi.length) daftarUcapan.append(el('li', { class: 'kosong', text: id.jenis === 'acara' ? 'Belum ada pesan.' : 'Jadilah yang pertama memberi ucapan.' }));
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

    var waTuan = hanyaAngka(r.wa);
    var bagian = el('section', { class: 'bagian', id: 'rsvp' },
      sudutHias('kanan-atas kecil'), sudutHias('kiri-bawah kecil'),
      judulBagian(J.rsvp[0], J.rsvp[1]),
      el('p', { class: 'paragraf muncul', text: J.ajakan }),
      form,
      waTuan ? el('a', { class: 'tombol garis kecil muncul', target: '_blank', rel: 'noopener', href: 'https://wa.me/' + waTuan + '?text=' + encodeURIComponent('Halo, saya ' + (tamu || '…') + '. Saya ingin konfirmasi kehadiran di ' + J.waRsvp + '.') }, el('span', { class: 'lbl', text: 'Konfirmasi via WhatsApp' })) : null,
      (!endpoint && !modePreview) ? el('p', { class: 'catatan-demo', text: 'Mode demo: ucapan hanya tersimpan di perangkat ini. Di undangan asli, rekap lengkap beserta jumlah orang yang hadir masuk ke spreadsheet pemilik acara.' }) : null,
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

  function bagianAmplop(d, id) {
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
      judulBagian(id.J.amplop[0], id.J.amplop[1]),
      el('p', { class: 'paragraf muncul', text: teks(a.pengantar) || id.J.pengantarAmplop }),
      rek.map(kartuAtm),
      alamat ? el('article', { class: 'kartu kirim-kado muncul' },
        el('span', { class: 'ikon-bulat' }, ikon('kado')),
        el('p', { class: 'label', text: 'Kirim Kado' }),
        el('p', { class: 'alamat', text: alamat }),
        tombolAlamat) : null);
  }

  function bagianKontak(d) {
    var list = daftar(d.kontak).filter(function (k) { return teks(k.nama); });
    if (!list.length) return null;
    return el('section', { class: 'bagian', id: 'kontak' },
      judulBagian('Narahubung', 'Kontak Panitia'),
      el('div', { class: 'grid-kontak' }, list.map(function (k) {
        var wa = hanyaAngka(k.wa).replace(/^0/, '62');
        return el('article', { class: 'kartu kontak muncul' },
          el('span', { class: 'avatar', 'aria-hidden': 'true', text: inisial(k.nama) }),
          el('div', null, el('strong', { text: teks(k.nama) }), teks(k.peran) ? el('small', { text: teks(k.peran) }) : null),
          wa ? el('a', { class: 'tombol kecil', href: 'https://wa.me/' + wa, target: '_blank', rel: 'noopener', 'aria-label': 'WhatsApp ' + teks(k.nama) }, ikon('telepon'), el('span', { class: 'lbl', text: 'Chat' })) : null);
      })));
  }

  function bagianPenutup(d, id, fotoLatar) {
    var situs = amanUrl(BRAND.situs) || '../';
    var ref = situs + (situs.indexOf('?') < 0 ? '?' : '&') + 'ref=undangan';
    var s = el('section', { class: 'bagian berlatar penutup' + (fotoLatar ? ' berfoto' : '') });
    if (fotoLatar) { s.style.setProperty('--foto-latar', cssUrl(fotoLatar)); pasangFokus(s, fotoLatar, 1); }
    var penanda = id.jenis === 'acara'
      ? el('h2', { class: 'nama-acara kecil muncul', text: teks(d.penyelenggara) || id.nama })
      : id.tampil('muncul');
    s.append(
      sudutHias('kiri-bawah'), sudutHias('kanan-bawah'),
      el('p', { class: 'paragraf muncul', text: teks(d.penutup) || id.J.penutup }),
      el('p', { class: 'label muncul', text: id.J.penutupLabel }),
      penanda,
      teks(d.keluarga) ? el('p', { class: 'keluarga muncul', text: teks(d.keluarga) }) : null,
      pembatas(),
      el('footer', { class: 'kaki' }, 'Undangan digital oleh ', el('a', { href: ref, target: '_blank', rel: 'noopener', text: BRAND.nama || 'kami' }),
        teks(d.musikKredit) ? el('small', { class: 'kredit-musik', text: teks(d.musikKredit) }) : null));
    return s;
  }

  function navBawah(id) {
    var item = [['beranda', 'rumah', 'Beranda'],
      ['profil', id.jenis === 'pernikahan' ? 'hati' : id.jenis === 'acara' ? 'info' : 'orang', id.J.profil],
      ['acara', 'kalender', 'Acara'], ['galeri', 'galeri', 'Galeri'], ['rsvp', 'pesan', 'RSVP'], ['amplop', 'hadiah', 'Hadiah']]
      .filter(function (x) { return document.getElementById(x[0]); });
    if (item.length < 2) return null;
    var nav = el('nav', { class: 'nav-bawah', 'aria-label': 'Navigasi undangan', hidden: !sudahDibuka });
    item.forEach(function (x, i) {
      nav.append(el('a', { href: '#' + x[0], title: x[2], 'data-target': x[0], class: i === 0 ? 'aktif' : null }, ikon(x[1]), el('span', { class: 'nav-lbl', text: x[2] })));
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

  function hujanPartikel(jenisPartikel) {
    if (geraknyaDikurangi) return null;
    var w = el('div', { class: 'hujan-kelopak partikel-' + jenisPartikel, 'aria-hidden': 'true' });
    var jumlah = jenisPartikel === 'bintang' ? 10 : jenisPartikel === 'konfeti' ? 18 : 14;
    for (var i = 0; i < jumlah; i++) {
      var ukuran = (jenisPartikel === 'bintang' ? 7 : 9) + Math.random() * 11;
      var lambat = jenisPartikel === 'bintang' ? 8 : 0;
      var k = el('span', { class: 'kelopak', style: 'left:' + (Math.random() * 100).toFixed(1) + '%;width:' + ukuran.toFixed(1) + 'px;height:' + ukuran.toFixed(1) + 'px;' +
        'animation-duration:' + (10 + lambat + Math.random() * 9).toFixed(1) + 's;animation-delay:-' + (Math.random() * 18).toFixed(1) + 's;opacity:' + (0.45 + Math.random() * 0.45).toFixed(2) });
      var bentuk = PARTIKEL_SVG[jenisPartikel] || PARTIKEL_SVG.kelopak;
      if (Array.isArray(bentuk)) bentuk = bentuk[i % bentuk.length];
      var dalam = statis(bentuk, 'kelopak-dalam');
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
     Video prewedding (YouTube atau file .mp4), dari data "video"
     ========================================================= */
  function idYoutube(url) {
    var m = String(url).match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : '';
  }
  function bagianVideo(d, id) {
    var url = amanUrl(d.video);
    if (!url) return null;
    var yt = idYoutube(url), media;
    if (yt) {
      media = el('div', { class: 'video-bingkai lebar muncul' },
        el('iframe', { src: 'https://www.youtube-nocookie.com/embed/' + yt + '?rel=0&playsinline=1', title: 'Video ' + id.nama, loading: 'lazy',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share', allowfullscreen: true, referrerpolicy: 'strict-origin-when-cross-origin' }));
    } else if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) {
      var v = el('video', { src: url, controls: true, playsinline: true, preload: 'metadata' });
      v.addEventListener('play', function () { if (audio && !audio.paused) audio.pause(); });
      media = el('div', { class: 'video-bingkai muncul' }, v);
    } else return null;
    return el('section', { class: 'bagian video-bagian', id: 'video' },
      judulBagian(id.jenis === 'pernikahan' ? 'Prewedding' : 'Video', 'Momen Kami'), media);
  }

  /* =========================================================
     Halaman terima kasih: setelah acara terakhir lewat (data terimaKasih.aktif),
     sampul & isi undangan berubah menjadi ucapan terima kasih + foto hari H.
     ========================================================= */
  function acaraSudahLewat(d) {
    var akhir = 0;
    daftar(d.acara).forEach(function (a) {
      var t = new Date(teks(a.tanggal) + 'T23:59:59' + (ZONA[a.zona] || '+07:00'));
      if (!isNaN(t) && t.getTime() > akhir) akhir = t.getTime();
    });
    return akhir > 0 && Date.now() > akhir;
  }
  function terimaKasihTersedia(d) {
    if (d.terimaKasih && d.terimaKasih.aktif === true) return true;
    return slug.indexOf('demo-') === 0 && !!paketAktif && paketMencakup(paketAktif, 'terimakasih') && bagianBerbayar().indexOf('terimakasih') >= 0;
  }
  function cekModeSelesai(d) { return terimaKasihTersedia(d) && (paksaSelesai || acaraSudahLewat(d)); }
  function bagianTerimaKasih(d, id) {
    if (!modeSelesai) return null;
    var t = d.terimaKasih || {};
    var foto = daftar(t.galeri).map(function (g) { return amanUrl(typeof g === 'string' ? g : g && g.src); }).filter(Boolean);
    if (!foto.length && slug.indexOf('demo-') === 0 && dataAsli) foto = daftar(dataAsli.galeri).map(function (g) { return amanUrl(typeof g === 'string' ? g : g && g.src); }).filter(Boolean);
    var s = el('section', { class: 'bagian terima-kasih', id: 'terima-kasih' },
      judulBagian('Terima Kasih', 'Hari Bahagia Telah Berlalu'),
      el('p', { class: 'paragraf muncul', text: teks(t.pesan) || 'Terima kasih atas kehadiran dan doa restu yang telah Bapak/Ibu/Saudara/i berikan di hari bahagia kami. Semoga kebaikan Anda dibalas berlipat ganda.' }));
    if (foto.length) {
      var list = foto.map(function (u, i) { return { src: u, ket: 'Momen hari H ' + (i + 1) }; });
      var grid = el('div', { class: 'galeri' });
      list.forEach(function (g, i) {
        grid.append(el('button', { class: 'foto-galeri muncul', 'data-anim': 'zoom', type: 'button', 'aria-label': 'Perbesar foto ' + (i + 1), onclick: function () { bukaLightbox(list, i); } },
          el('img', { src: g.src, alt: g.ket, loading: 'lazy' })));
      });
      s.append(el('p', { class: 'label muncul label-hari-h', text: 'Momen Hari H' }), grid);
    }
    return s;
  }

  /* Contoh video undangan 15 detik (hanya di demo paket yang mencakupnya) */
  function contohVideoUndangan(d, id) {
    var p = infoPaket(paketAktif);
    if (!p || !p.demoVideoUndangan || modeSelesai) return null;
    var v = el('video', { src: '../promo/contoh-video-undangan.mp4', controls: true, playsinline: true, preload: 'metadata', poster: amanUrl(d.sampul) || null });
    v.addEventListener('play', function () { if (audio && !audio.paused) audio.pause(); });
    return el('section', { class: 'bagian demo-video-undangan' },
      el('p', { class: 'lencana-demo', text: 'Khusus paket ' + p.nama }),
      el('h2', { class: 'judul-script muncul', text: 'Video Undangan' }),
      el('p', { class: 'paragraf muncul', text: 'Video 15 detik dari undangan kalian, siap diunggah ke Status WhatsApp dan Story Instagram.' }),
      el('div', { class: 'video-bingkai muncul' }, v));
  }

  /* =========================================================
     QR check-in tamu (aktif bila data "checkin": true)
     QR berisi: BKN1|slug|kode|nama. Kode dihitung dari slug + nama tamu, jadi link tamu lama
     tetap bisa dipakai tanpa daftar tamu. SAMAKAN fungsi kodeTamu dengan checkin/checkin.js.
     ========================================================= */
  var QR_LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
  var skripDimuat = {};
  function muatSkrip(url) {
    if (!skripDimuat[url]) {
      skripDimuat[url] = new Promise(function (ok, gagal) {
        var s = document.createElement('script');
        s.src = url; s.async = true; s.crossOrigin = 'anonymous';
        s.onload = ok; s.onerror = function () { delete skripDimuat[url]; gagal(new Error('gagal memuat')); };
        document.head.append(s);
      });
    }
    return skripDimuat[url];
  }
  function kodeTamu(slugAcara, nama) {
    var s = String(slugAcara) + '|' + String(nama).replace(/\s+/g, ' ').trim().toLowerCase();
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    var abjad = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ', k = '';
    for (var j = 0; j < 6; j++) { k += abjad[h % 32]; h = Math.floor(h / 32); }
    return k;
  }
  function checkinAktif(d) {
    if (modeSelesai || d.checkin === false && paketAktif) return false;
    if (d.checkin === true) return true;
    if (slug.indexOf('demo-') !== 0) return false;
    return params.get('checkin') === '1' || (!!paketAktif && paketMencakup(paketAktif, 'checkin') && bagianBerbayar().indexOf('checkin') >= 0);
  }
  function bagianCheckin(d, id) {
    if (!checkinAktif(d)) return null;
    var s = el('section', { class: 'bagian checkin', id: 'checkin' }, judulBagian('QR Check-in', 'Saat Tiba di Lokasi'));
    if (!tamu) {
      s.append(el('p', { class: 'paragraf muncul', text: 'QR check-in tersedia di link undangan yang memuat nama Anda.' }));
      return s;
    }
    s.append(
      el('p', { class: 'paragraf muncul', text: 'Tunjukkan QR ini kepada penerima tamu saat tiba. Kehadiran Anda langsung tercatat tanpa antre menulis buku tamu.' }),
      el('button', { class: 'tombol muncul', type: 'button', onclick: function () { bukaQr(id); } }, ikon('qr'), el('span', { class: 'lbl', text: 'Tampilkan QR Check-in' })));
    return s;
  }
  // Gambar QR ke SVG (untuk layar) dan kanvas (untuk disimpan sebagai gambar).
  function matriksQr(isi) {
    if (window.qrcode.stringToBytesFuncs && window.qrcode.stringToBytesFuncs['UTF-8']) window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8'];
    var qr = window.qrcode(0, 'M');
    qr.addData(isi);
    qr.make();
    var n = qr.getModuleCount(), m = [];
    for (var r = 0; r < n; r++) { m.push([]); for (var c = 0; c < n; c++) m[r].push(qr.isDark(r, c)); }
    return m;
  }
  function svgQr(m) {
    var n = m.length, tepi = 4, d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (m[r][c]) d += 'M' + (c + tepi) + ' ' + (r + tepi) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (n + tepi * 2) + ' ' + (n + tepi * 2) + '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#111"/></svg>';
  }
  function gambarQr(m, nama, judul) {
    var n = m.length, sel = 12, tepi = 4, lebar = (n + tepi * 2) * sel, tinggi = lebar + 150;
    var cv = document.createElement('canvas');
    cv.width = lebar; cv.height = tinggi;
    var x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, lebar, tinggi);
    x.fillStyle = '#111';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (m[r][c]) x.fillRect((c + tepi) * sel, (r + tepi) * sel, sel, sel);
    x.textAlign = 'center';
    x.font = '600 34px Jost, system-ui, sans-serif'; x.fillText(nama, lebar / 2, lebar + 46, lebar - 40);
    x.fillStyle = '#666'; x.font = '24px Jost, system-ui, sans-serif'; x.fillText(judul, lebar / 2, lebar + 90, lebar - 40);
    x.fillText('Tunjukkan ke penerima tamu', lebar / 2, lebar + 126, lebar - 40);
    return cv;
  }
  function bukaQr(id) {
    var kode = kodeTamu(slug, tamu);
    var isi = 'BKN1|' + slug + '|' + kode + '|' + tamu.replace(/\|/g, '/');
    var wadah = el('div', { class: 'qr-gambar' }, el('p', { class: 'qr-muat', text: 'Membuat QR…' }));
    var simpan = el('button', { class: 'qr-tombol', type: 'button', disabled: true }, 'Simpan gambar');
    var lapis;
    function tutup() { lapis.remove(); document.removeEventListener('keydown', esc); }
    function esc(e) { if (e.key === 'Escape') tutup(); }
    lapis = el('div', { class: 'qr-lapis', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'QR check-in', onclick: function (e) { if (e.target === lapis) tutup(); } },
      el('div', { class: 'qr-kartu' },
        el('p', { class: 'qr-judul', text: id.judul }),
        wadah,
        el('p', { class: 'qr-nama', text: tamu }),
        el('p', { class: 'qr-kode', text: 'Kode ' + kode }),
        el('p', { class: 'qr-bantu', text: 'Tunjukkan QR ini ke penerima tamu. Simpan gambarnya atau ambil tangkapan layar agar tetap bisa dipakai tanpa sinyal.' }),
        el('div', { class: 'qr-aksi' }, simpan, el('button', { class: 'qr-tombol garis', type: 'button', onclick: tutup }, 'Tutup'))));
    document.body.append(lapis);
    document.addEventListener('keydown', esc);
    muatSkrip(QR_LIB).then(function () {
      var m = matriksQr(isi);
      wadah.innerHTML = svgQr(m); // hanya kotak-kotak QR buatan sendiri, tanpa data pengguna
      simpan.disabled = false;
      simpan.addEventListener('click', function () {
        var a = document.createElement('a');
        a.href = gambarQr(m, tamu, id.judul).toDataURL('image/png');
        a.download = 'QR-checkin-' + tamu.replace(/[^\w-]+/g, '-').slice(0, 40) + '.png';
        document.body.append(a); a.click(); a.remove();
      });
    }).catch(function () {
      wadah.textContent = '';
      wadah.append(el('p', { class: 'qr-muat', text: 'QR gagal dimuat. Periksa koneksi internet lalu coba lagi.' }));
    });
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
    if (bilah) perbaruiBilah();
  }

  // Bunga berlapis: tiap tangkai mulai di titik irama acak, dan hanya bergoyang saat terlihat di layar.
  var pengamatBunga = null;
  function hidupkanBunga() {
    if (pengamatBunga) pengamatBunga.disconnect();
    var semua = Array.prototype.slice.call(document.querySelectorAll('.orn-sudut, .orn-untaian, .bingkai-bunga')).filter(function (n) { return n.querySelector('.ayunan'); });
    semua.forEach(function (n) {
      n.querySelectorAll('.ayunan').forEach(function (t) { t.style.setProperty('--t', (-Math.random() * 8).toFixed(2) + 's'); });
    });
    if (geraknyaDikurangi) return;
    if (!('IntersectionObserver' in window)) { semua.forEach(function (n) { n.classList.add('hidup'); }); return; }
    pengamatBunga = new IntersectionObserver(function (entri) {
      entri.forEach(function (e) { e.target.classList.toggle('hidup', e.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    semua.forEach(function (n) { pengamatBunga.observe(n); });
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
    if (FONT[tema]) muatFont(tema, !!teks(d.arab));
    orn = ORN.ambil(ORNAMEN[tema] || 'bunga');

    var id = identitas(d);
    modeSelesai = cekModeSelesai(d);
    document.body.dataset.jenis = id.jenis;
    var acaraUtama = daftar(d.acara)[0];
    var tglUtama = acaraUtama ? fmtTanggal(acaraUtama, { weekday: undefined, day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' . ') : '';

    // Foto untuk slideshow & latar diambil dari sampul + galeri.
    fokusPerFoto = {};
    if (amanUrl(d.sampul)) fokusPerFoto[amanUrl(d.sampul)] = teks(d.sampulFokus);
    daftar(d.galeri).forEach(function (g) { if (g && typeof g === 'object' && amanUrl(g.src) && teks(g.fokus)) fokusPerFoto[amanUrl(g.src)] = teks(g.fokus); });
    var semuaFoto = [amanUrl(d.sampul)].concat(daftar(d.galeri).map(function (g) { return amanUrl(typeof g === 'string' ? g : g.src); }))
      .filter(function (u, i, arr) { return u && arr.indexOf(u) === i; });
    var fotoSlide = semuaFoto.slice(0, 3);
    var fotoHitung = semuaFoto[3] || semuaFoto[1] || semuaFoto[0] || '';
    var fotoPenutup = semuaFoto[4] || semuaFoto[2] || semuaFoto[0] || '';

    document.title = id.judul;

    var scrollLama = window.scrollY;
    app.textContent = '';
    app.append(statis(ORN.defs(orn.gaya), 'defs-wadah'));
    if (!langsungBuka) app.append(bagianSampul(d, id, tglUtama));
    // Di demo per paket: bagian berbayar diberi label paket, yang tidak termasuk diganti kartu terkunci.
    var bagAcara = bagianAcara(d, id);
    if (bagAcara) tandaiFitur(bagAcara.querySelector('.dresscode'), 'dresscode');
    app.append(el('div', { class: 'isi' },
      bagianBeranda(d, id, acaraUtama, fotoSlide),
      bagianTerimaKasih(d, id),
      pratinjauWa(d, id),
      contohVideoUndangan(d, id),
      bagianKutipan(d),
      bagianProfil(d, id),
      modeSelesai ? null : bagianHitung(id, acaraUtama, fotoHitung),
      bagAcara,
      tandaiFitur(bagianCheckin(d, id), 'checkin') || (modeSelesai ? null : terkunci('checkin')),
      terkunci('dresscode'),
      tandaiFitur(bagianRundown(d), 'rundown') || terkunci('rundown'),
      tandaiFitur(bagianCerita(d, id), 'cerita') || terkunci('cerita'),
      tandaiFitur(bagianGaleri(d), 'galeri') || terkunci('galeri'),
      tandaiFitur(bagianVideo(d, id), 'video') || terkunci('video'),
      modeSelesai ? null : (tandaiFitur(bagianRsvp(d, id), 'rsvp') || terkunci('rsvp')),
      bagianAmplop(d, id),
      tandaiFitur(bagianKontak(d), 'kontak') || terkunci('kontak'),
      bagianPenutup(d, id, fotoPenutup)));
    var hujan = hujanPartikel(PARTIKEL[tema] || 'kelopak');
    if (hujan) app.append(hujan);
    var musik = amanUrl(d.musik);
    if (musik) app.append(tombolMusik(musik));
    var nav = navBawah(id);
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
    hidupkanBunga();
  }

  function tampilkanGalat(judul, pesan) {
    document.body.classList.remove('terkunci');
    app.textContent = '';
    app.append(el('section', { class: 'galat' },
      el('h1', { text: judul }),
      el('p', { text: pesan }),
      el('a', { class: 'tombol', href: amanUrl(BRAND.situs) || '../' }, el('span', { class: 'lbl', text: 'Ke halaman utama' }))));
  }

  /* =========================================================
     Demo per paket: sembunyikan bagian yang tidak termasuk paket,
     plus bilah untuk beralih paket (hanya saat demo dibuka langsung, bukan di dalam iframe).
     ========================================================= */

  var dataAsli = null, paketAktif = null;

  function infoPaket(id) {
    return (Array.isArray(BRAND.paket) ? BRAND.paket : []).filter(function (p) { return p.id === id; })[0] || null;
  }
  function saringPaket(d, id) {
    var p = infoPaket(id);
    if (!p) return d;
    var tanpa = Array.isArray(p.demoTanpa) ? p.demoTanpa : [];
    var c = Object.assign({}, d);
    if (tanpa.indexOf('galeri') >= 0) c.galeri = [];
    if (tanpa.indexOf('cerita') >= 0) c.cerita = [];
    if (tanpa.indexOf('rundown') >= 0) c.rundown = [];
    if (tanpa.indexOf('dresscode') >= 0) { c.dresscode = ''; c.dresscodeWarna = []; }
    if (tanpa.indexOf('rsvp') >= 0) c.rsvp = Object.assign({}, d.rsvp || {}, { aktif: false });
    if (tanpa.indexOf('kontak') >= 0) c.kontak = [];
    if (tanpa.indexOf('video') >= 0) c.video = '';
    if (tanpa.indexOf('siaran') >= 0) c.siaran = '';
    if (tanpa.indexOf('checkin') >= 0) c.checkin = false;
    return c;
  }
  function dalamBingkai() {
    try { return window.top !== window; } catch (e) { return true; }
  }
  function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
  // Harga promo paket selama diskon config.js masih berlaku (sama dengan landing page).
  function hargaPromoPaket(p) {
    var D = BRAND.diskon, akhir = D ? Date.parse(D.sampai) : NaN;
    if (!D || D.aktif === false || isNaN(akhir) || Date.now() >= akhir || !D.harga || !p) return null;
    var h = Number(D.harga[p.id]);
    return h > 0 && h < p.harga ? h : null;
  }
  // Link WhatsApp untuk memesan tema + paket yang sedang dilihat di demo.
  function linkPesanDemo(p) {
    var daftarTema = BRAND.tema || [], promo = hargaPromoPaket(p), D = BRAND.diskon || {};
    var tema = daftarTema.filter(function (t) { return t.demo === slug; })[0] || daftarTema.filter(function (t) { return t.id === (dataAsli || {}).tema; })[0];
    var harga = promo ? rupiah(promo) + ', ' + D.nama + ' — harga normal ' + rupiah(p.harga) : rupiah(p.harga);
    var pesan = 'Halo ' + (BRAND.nama || 'admin') + ', saya mau pesan undangan digital' + (tema ? ' tema ' + tema.nama : '') +
      ', paket ' + p.nama + ' (' + harga + ').\n\nJenis acara: \nTanggal acara: \nKota: ';
    return 'https://wa.me/' + String(BRAND.whatsapp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent(pesan);
  }

  var LABEL_BAGIAN = { galeri: 'Galeri foto', cerita: 'Cerita', rundown: 'Rundown', dresscode: 'Dress code', rsvp: 'RSVP & ucapan', kontak: 'Kontak panitia', video: 'Video prewedding', siaran: 'Live streaming', checkin: 'QR check-in tamu', terimakasih: 'Halaman terima kasih' };
  var LABEL_PIL = { galeri: 'Galeri', cerita: 'Cerita', rundown: 'Rundown', dresscode: 'Dress code', rsvp: 'RSVP', video: 'Video', siaran: 'Live streaming', checkin: 'QR check-in', terimakasih: 'Terima kasih' };
  var GEMBOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  // Bagian yang tidak ada di setidaknya satu paket (urutan sesuai config).
  function bagianBerbayar() {
    var semua = [];
    (BRAND.paket || []).forEach(function (p) { (p.demoTanpa || []).forEach(function (k) { if (semua.indexOf(k) < 0) semua.push(k); }); });
    return semua;
  }
  function paketMencakup(id, kunci) { var p = infoPaket(id); return !!p && (p.demoTanpa || []).indexOf(kunci) < 0; }
  function paketTermurahUntuk(kunci) { return (BRAND.paket || []).filter(function (p) { return (p.demoTanpa || []).indexOf(kunci) < 0; })[0] || null; }
  function adaIsi(d, kunci) {
    if (!d) return false;
    if (kunci === 'dresscode') return !!(teks(d.dresscode) || daftar(d.dresscodeWarna).length);
    if (kunci === 'rsvp') return (d.rsvp || {}).aktif !== false;
    if (kunci === 'video') return !!amanUrl(d.video);
    if (kunci === 'checkin') return d.checkin === true || slug.indexOf('demo-') === 0;
    if (kunci === 'terimakasih') return false; // tidak diganti kartu terkunci
    return daftar(d[kunci]).length > 0;
  }
  // Label kecil "Fitur Premium" di bagian yang tidak tersedia di semua paket.
  function tandaiFitur(node, kunci) {
    if (!node || !paketAktif || bagianBerbayar().indexOf(kunci) < 0) return node;
    var aktif = infoPaket(paketAktif) || {}, termurah = paketTermurahUntuk(kunci);
    var label = kunci === 'galeri' && aktif.demoGaleri ? aktif.nama + ' · galeri ' + aktif.demoGaleri : 'Fitur ' + (termurah ? termurah.nama : 'Premium');
    node.prepend(el('p', { class: 'lencana-demo', text: label }));
    return node;
  }
  // Pengganti bagian yang tidak termasuk paket yang sedang dilihat.
  function terkunci(kunci) {
    if (!paketAktif || paketMencakup(paketAktif, kunci) || !adaIsi(dataAsli, kunci)) return null;
    var p = paketTermurahUntuk(kunci), aktif = infoPaket(paketAktif) || {};
    return el('section', { class: 'bagian bagian-terkunci', id: 'terkunci-' + kunci },
      el('div', { class: 'kartu-terkunci muncul' },
        statis(GEMBOK, 'ikon-gembok'),
        el('h3', { text: LABEL_BAGIAN[kunci] || kunci }),
        el('p', { text: 'Tidak termasuk paket ' + aktif.nama + '. Tersedia mulai paket ' + (p ? p.nama : 'Premium') + '.' }),
        p ? el('button', { type: 'button', class: 'tombol garis kecil', onclick: function () { gantiPaket(p.id, kunci); } }, el('span', { class: 'lbl', text: 'Lihat di paket ' + p.nama })) : null));
  }
  // Contoh tampilan link undangan saat dibagikan di WhatsApp (keunggulan paket tertentu).
  function pratinjauWa(d, id) {
    var p = infoPaket(paketAktif);
    if (!p || !p.demoPreviewWa) return null;
    var foto = amanUrl(d.sampul);
    var situs = (amanUrl(BRAND.situs) || location.origin).replace(/^https?:\/\//, '').replace(/\/+$/, '');
    var host = situs.replace(/\/.*$/, '');
    var slugTampil = teks(id.nama).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'undangan';
    var fotoEl = foto ? el('div', { class: 'wa-foto', style: 'background-image:' + cssUrl(foto) }) : null;
    if (fotoEl) pasangFokus(fotoEl, foto, 1);
    return el('section', { class: 'bagian demo-wa' },
      el('p', { class: 'lencana-demo', text: 'Khusus paket ' + p.nama }),
      el('h2', { class: 'judul-script muncul', text: 'Preview Link' }),
      el('p', { class: 'paragraf muncul', text: 'Saat link undangan dibagikan di WhatsApp, yang tampil adalah foto dan nama kalian, bukan sekadar tautan.' }),
      el('div', { class: 'wa-chat muncul' },
        el('div', { class: 'wa-gelembung' },
          el('div', { class: 'wa-pratinjau' }, fotoEl,
            el('div', { class: 'wa-teks' },
              el('b', { text: id.judul }),
              el('span', { text: 'Kepada Yth. ' + (tamu || 'Tamu Undangan') + '. Dengan penuh sukacita kami mengundang Anda.' }),
              el('small', { text: host }))),
          el('p', { class: 'wa-link', text: 'https://' + situs + '/' + slugTampil + '/?to=' + encodeURIComponent(tamu || 'Tamu Undangan') }),
          el('span', { class: 'wa-jam', text: '19.30 ✓✓' }))),
      el('p', { class: 'mini muncul', text: 'Di paket lain, link terkirim sebagai tautan biasa tanpa foto.' }));
  }

  var bilah = null;
  function pasangBilahPaket() {
    var pilihan = el('div', { class: 'bp-pilihan', role: 'radiogroup', 'aria-label': 'Pilih paket' });
    (BRAND.paket || []).forEach(function (p) {
      pilihan.append(el('button', { type: 'button', class: 'bp-chip', role: 'radio', 'data-id': p.id, onclick: function () { gantiPaket(p.id); } }, p.nama));
    });
    var tutup = el('button', { type: 'button', class: 'bp-tutup', 'aria-label': 'Tutup bilah contoh paket', onclick: function () { bilah.remove(); bilah = null; } }, '×');
    bilah = el('div', { class: 'bilah-paket', role: 'region', 'aria-label': 'Contoh undangan per paket' },
      el('div', { class: 'bp-baris' }, el('span', { class: 'bp-label', text: 'Contoh paket' }), pilihan, tutup),
      el('div', { class: 'bp-aksi' }),
      el('div', { class: 'bp-fitur', 'aria-live': 'polite' }),
      el('p', { class: 'bp-petunjuk', text: 'Buka undangan, lalu gulir ke bawah untuk melihat bedanya.' }));
    document.body.append(bilah);
    perbaruiBilah();
  }
  function perbaruiBilah() {
    if (!bilah) return;
    var semuaPaket = BRAND.paket || [], p = infoPaket(paketAktif) || {};
    bilah.querySelectorAll('.bp-chip').forEach(function (b) {
      var aktif = b.getAttribute('data-id') === paketAktif;
      b.classList.toggle('aktif', aktif);
      b.setAttribute('aria-checked', aktif ? 'true' : 'false');
    });
    var aksi = bilah.querySelector('.bp-aksi'), promo = hargaPromoPaket(p);
    aksi.textContent = '';
    aksi.append(
      el('span', { class: 'bp-harga' }, promo ? el('s', { text: rupiah(p.harga) }) : null, rupiah(promo || p.harga)),
      el('a', { class: 'bp-pesan', href: linkPesanDemo(p), target: '_blank', rel: 'noopener' }, 'Pesan paket ini ›'));
    var wadah = bilah.querySelector('.bp-fitur');
    wadah.textContent = '';
    var tambahan = Array.isArray(p.demoTambahan) ? p.demoTambahan : [];
    if (tambahan.length) {
      var sebelum = semuaPaket[semuaPaket.indexOf(p) - 1];
      wadah.append(el('span', { class: 'bp-pil ada', text: '✓ Semua fitur ' + (sebelum ? sebelum.nama : '') }));
      tambahan.forEach(function (t) { wadah.append(el('span', { class: 'bp-pil plus', text: '+ ' + t })); });
    } else {
      bagianBerbayar().forEach(function (k) {
        var ada = paketMencakup(paketAktif, k);
        wadah.append(el('span', { class: 'bp-pil ' + (ada ? 'ada' : 'tidak'), text: (ada ? '✓ ' : '✕ ') + (LABEL_PIL[k] || LABEL_BAGIAN[k] || k) }));
      });
    }
    if (p.demoTerimaKasih) {
      wadah.append(el('button', { type: 'button', class: 'bp-mode', onclick: function () {
        paksaSelesai = !paksaSelesai;
        render(saringPaket(dataAsli, paketAktif));
        window.scrollTo({ top: 0, behavior: 'instant' });
        perbaruiBilah();
      } }, paksaSelesai ? '← Lihat versi sebelum acara' : 'Lihat versi setelah acara →'));
    }
    bilah.querySelector('.bp-petunjuk').hidden = sudahDibuka;
  }
  function gantiPaket(id, gulirKe) {
    if (!dataAsli) return;
    if (id !== paketAktif) {
      paketAktif = id;
      if (!(infoPaket(id) || {}).demoTerimaKasih) paksaSelesai = false;
      var y = window.scrollY;
      render(saringPaket(dataAsli, id));
      window.scrollTo({ top: y, behavior: 'instant' });
      perbaruiBilah();
      params.set('paket', id);
      history.replaceState(null, '', location.pathname + '?' + params.toString());
    }
    if (gulirKe) {
      var tujuan = gulirKe === 'dresscode' ? document.querySelector('.dresscode') : document.getElementById(gulirKe);
      if (tujuan) window.scrollTo({ top: tujuan.getBoundingClientRect().top + window.scrollY - (bilah ? bilah.offsetHeight : 0) - 16, behavior: 'smooth' });
    }
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
        dataAsli = d;
        paketAktif = slug.indexOf('demo-') === 0 && infoPaket(paketDiminta) ? paketDiminta : null;
        render(paketAktif ? saringPaket(d, paketAktif) : d);
        if (paketAktif && !dalamBingkai()) pasangBilahPaket();
      })
      .catch(function () { tampilkanGalat('Undangan tidak ditemukan', 'Link mungkin salah ketik atau undangan sudah tidak aktif.'); });
  }
})();
