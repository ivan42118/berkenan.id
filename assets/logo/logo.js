/*
 * Logo berkenan.id (sumber vektor).
 * Ikon: amplop terbuka, kartu persegi bermonogram B, segel lilin, ranting daun emas di kiri
 * (terselip di dalam amplop), dan kilau bintang di kanan atas. viewBox 0 0 100 100.
 *
 *   ikonBerkenan('terang')        → amplop marun, untuk latar terang
 *   ikonBerkenan('gelap')         → amplop emas, untuk latar gelap/marun
 *   ikonBerkenan('terang', true)  → versi ukuran kecil (favicon), tanpa detail halus
 *
 * Huruf B memakai font Cormorant Garamond Italic 600; halaman pemakai harus memuat font itu.
 * File PNG siap pakai ada di folder ini (lihat PANDUAN.md bagian "Logo").
 */
(function (global) {
  'use strict';
  var uid = 0;

  function bintang4(x, y, r, isi) {
    var k = r * 0.24;
    return '<path d="M' + x + ' ' + (y - r) + 'C' + (x + k * 0.4) + ' ' + (y - k) + ' ' + (x + k) + ' ' + (y - k * 0.4) + ' ' + (x + r) + ' ' + y +
      'C' + (x + k) + ' ' + (y + k * 0.4) + ' ' + (x + k * 0.4) + ' ' + (y + k) + ' ' + x + ' ' + (y + r) +
      'C' + (x - k * 0.4) + ' ' + (y + k) + ' ' + (x - k) + ' ' + (y + k * 0.4) + ' ' + (x - r) + ' ' + y +
      'C' + (x - k) + ' ' + (y - k * 0.4) + ' ' + (x - k * 0.4) + ' ' + (y - k) + ' ' + x + ' ' + (y - r) + 'Z" fill="' + isi + '"/>';
  }

  // Daun zaitun ramping: dua tone + tulang daun.
  function daun(x, y, sudut, skala, p) {
    return '<g transform="translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') rotate(' + sudut.toFixed(1) + ') scale(' + skala.toFixed(3) + ')">' +
      '<path d="M0 0C2.6 -2.7 7.3 -3.6 11.4 -1C12 -.6 12 .2 11.4 .45C7.3 2.7 2.7 2.5 0 0Z" fill="' + p.dasar + '"/>' +
      '<path d="M0 0C2.6 -2.7 7.3 -3.6 11.4 -1C12 -.6 12 .2 11.4 .45Q5.9 -.2 0 0Z" fill="' + p.teduh + '"/>' +
      '<path d="M.9 .02Q5.9 -.18 10.8 .05" fill="none" stroke="' + p.urat + '" stroke-width=".42" stroke-linecap="round"/>' +
      '</g>';
  }

  // Ranting di kurva kuadrat P0→P2; daun: [t, sisi -1/1, skala]; ditutup daun di ujung.
  function ranting(P0, P1, P2, daftar, p) {
    function titik(t) {
      return {
        x: (1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0],
        y: (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1],
        a: Math.atan2(2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]), 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0])) * 180 / Math.PI
      };
    }
    var s = '<path d="M' + P0[0] + ' ' + P0[1] + 'Q' + P1[0] + ' ' + P1[1] + ' ' + P2[0] + ' ' + P2[1] + '" fill="none" stroke="' + p.batang + '" stroke-width=".95" stroke-linecap="round"/>';
    daftar.forEach(function (d) { var q = titik(d[0]); s += daun(q.x, q.y, q.a + d[1] * 34, d[2], p); });
    var u = titik(1);
    return s + daun(u.x, u.y, u.a, 0.7, p);
  }

  function ikonBerkenan(tema, kecil) {
    var n = ++uid, gelap = tema === 'gelap';
    var W = gelap
      ? { saku: ['#f4dca4', '#d7b46c', '#b48b45'], tutup: ['#c9a25b', '#a57c3a'], dalam: '#7a5a28', kartu: '#fffaf0', tinta: '#5e1626', bingkai: '#b8914c', kilau: '#f6e2ae', kilau2: '#e9cf91', sorot: 'rgba(255,250,230,.6)' }
      : { saku: ['#86283a', '#6b1c2b', '#511421'], tutup: ['#a8505f', '#8a3646'], dalam: '#3d0d18', kartu: '#fffaf3', tinta: '#6b1c2b', bingkai: '#c9a45e', kilau: '#d4a95a', kilau2: '#e2c07c', sorot: 'rgba(255,225,215,.35)' };
    var D = gelap
      ? { dasar: '#fff0c8', teduh: '#e6c987', urat: 'rgba(150,105,45,.45)', batang: '#e2c486' }
      : { dasar: '#dcb86d', teduh: '#b48a42', urat: 'rgba(255,248,225,.7)', batang: '#b08640' };
    var gS = 'bks' + n, gT = 'bkt' + n, gL = 'bkl' + n, kl = 'bkk' + n;
    var s = '<defs>' +
      '<linearGradient id="' + gS + '" gradientUnits="userSpaceOnUse" x1="20" y1="50" x2="80" y2="92"><stop offset="0" stop-color="' + W.saku[0] + '"/><stop offset=".55" stop-color="' + W.saku[1] + '"/><stop offset="1" stop-color="' + W.saku[2] + '"/></linearGradient>' +
      '<linearGradient id="' + gT + '" gradientUnits="userSpaceOnUse" x1="50" y1="22" x2="50" y2="50"><stop offset="0" stop-color="' + W.tutup[0] + '"/><stop offset="1" stop-color="' + W.tutup[1] + '"/></linearGradient>' +
      '<clipPath id="' + kl + '"><rect x="14.6" y="0" width="70.8" height="100"/></clipPath>' +
      '</defs>';

    // Badan belakang + tutup amplop yang terbuka
    s += '<path d="M14 49H86V84C86 87.3 83.3 90 80 90H20C16.7 90 14 87.3 14 84Z" fill="' + W.dalam + '"/>';
    s += '<path d="M14 49.5L46.6 25.4C48.6 23.9 51.4 23.9 53.4 25.4L86 49.5Z" fill="url(#' + gT + ')"/>';

    // Ranting daun emas, terselip di dalam amplop di sisi kiri kartu
    if (!kecil) {
      s += '<g clip-path="url(#' + kl + ')">' +
        ranting([25, 74], [19.5, 54], [21, 29], [[0.5, -1, 0.95], [0.62, 1, 0.88], [0.74, -1, 0.82], [0.86, 1, 0.74]], D) + '</g>';
    }

    // Kartu undangan
    s += '<path d="M30 14H70C71.7 14 73 15.3 73 17V72H27V17C27 15.3 28.3 14 30 14Z" fill="' + W.kartu + '"' +
      (gelap ? '' : ' stroke="' + W.tinta + '" stroke-width="' + (kecil ? 2.6 : 1.8) + '" stroke-linejoin="round"') + '/>';
    if (!kecil) s += '<path d="M31 72V18.2H69V72" fill="none" stroke="' + W.bingkai + '" stroke-width="1.1"/>';
    s += '<text x="50" y="' + (kecil ? 51 : 49.5) + '" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-style="italic" font-weight="600" font-size="' + (kecil ? 33 : 30) + '" fill="' + W.tinta + '">B</text>';
    if (!kecil) {
      s += '<path d="M41.5 56H47.2M52.8 56H58.5" stroke="' + W.bingkai + '" stroke-width="1" stroke-linecap="round"/>';
      s += '<path d="M50 54.2L51.8 56L50 57.8L48.2 56Z" fill="' + W.bingkai + '"/>';
    }

    // Saku depan amplop
    s += '<path d="M14 51.5L45.5 72.6C48.2 74.4 51.8 74.4 54.5 72.6L86 51.5V84C86 87.3 83.3 90 80 90H20C16.7 90 14 87.3 14 84Z" fill="url(#' + gS + ')"/>';
    if (!kecil) {
      s += '<path d="M15.5 52.6L45.5 72.6C48.2 74.4 51.8 74.4 54.5 72.6L84.5 52.6" fill="none" stroke="' + W.sorot + '" stroke-width="1.3" stroke-linecap="round"/>';
      s += '<path d="M16.5 88L38 70.8M83.5 88L62 70.8" stroke="' + W.sorot + '" stroke-width=".9" stroke-linecap="round" opacity=".7"/>';
    }

    // Segel lilin berbintang
    var cx = 50, cy = 74.2;
    if (kecil) {
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="6.6" fill="' + (gelap ? '#6b1c2b' : '#d9b66f') + '"/>';
    } else {
      var d = '';
      for (var i = 0; i <= 120; i++) {
        var a = i / 120 * Math.PI * 2;
        var r = 7.4 + 0.45 * Math.sin(5 * a + 0.7) + 0.3 * Math.sin(9 * a + 2.1) + 0.2 * Math.sin(13 * a);
        d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2);
      }
      s += '<defs><radialGradient id="' + gL + '" cx=".38" cy=".32" r=".8">' +
        (gelap ? '<stop offset="0" stop-color="#8f2b3e"/><stop offset=".6" stop-color="#6b1c2b"/><stop offset="1" stop-color="#4a1220"/>'
               : '<stop offset="0" stop-color="#f6e2ae"/><stop offset=".55" stop-color="#d9b66f"/><stop offset="1" stop-color="#a97f3e"/>') + '</radialGradient></defs>';
      s += '<path d="' + d + 'Z" fill="url(#' + gL + ')"/>';
      var tinta = gelap ? '#e9cf91' : '#7a4f1e';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="none" stroke="' + tinta + '" stroke-width=".6" opacity=".7"/>';
      s += bintang4(cx, cy, 3.1, tinta);
    }

    // Kilau bintang
    s += bintang4(84, 15, kecil ? 9 : 8.2, W.kilau);
    s += bintang4(93.5, 29.5, kecil ? 4.4 : 3.8, W.kilau2);
    if (!kecil) s += '<circle cx="76" cy="6.5" r="1.4" fill="' + W.kilau2 + '"/>';
    return s;
  }

  // SVG lengkap siap disisipkan ke halaman.
  function svgIkon(tema, ukuran, kecil) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="' + ukuran + '" height="' + ukuran + '" role="img" aria-label="berkenan.id">' + ikonBerkenan(tema, kecil) + '</svg>';
  }

  global.ikonBerkenan = ikonBerkenan;
  global.svgIkonBerkenan = svgIkon;
})(window);
