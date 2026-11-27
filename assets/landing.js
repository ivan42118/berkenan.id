(function () {
  'use strict';
  var B = window.BRAND || {};
  var NOMOR_CONTOH = '6281234567890';
  var VERSI = '20261127d'; // samakan dengan ?v= di index.html setiap kali ada update
  var wa = String(B.whatsapp || '').replace(/\D/g, '');

  function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
  function linkWa(pesan) { return 'https://wa.me/' + wa + '?text=' + encodeURIComponent(pesan); }
  function el(tag, kelas, teks) {
    var n = document.createElement(tag);
    if (kelas) n.className = kelas;
    if (teks != null) n.textContent = teks;
    return n;
  }
  function isiSemua(sel, nilai) {
    if (!nilai) return;
    document.querySelectorAll(sel).forEach(function (n) { n.textContent = nilai; });
  }

  var sapaan = 'Halo ' + (B.nama || 'admin') + ', ';

  // Teks brand dari config
  isiSemua('[data-brand]', B.nama);
  isiSemua('[data-tagline]', B.tagline);
  isiSemua('[data-pembayaran]', B.pembayaran);
  isiSemua('[data-waktu]', B.waktuPengerjaan);
  document.getElementById('tahun').textContent = new Date().getFullYear();

  if (!wa || wa === NOMOR_CONTOH) document.getElementById('peringatan').hidden = false;

  // Semua tombol WhatsApp umum
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = linkWa(sapaan + 'saya ingin tanya-tanya tentang undangan digital pernikahan.');
  });

  var paket = Array.isArray(B.paket) ? B.paket : [];

  // Diskon berbatas waktu (config.js → diskon). Berakhir otomatis setelah tanggal "sampai".
  var D = B.diskon || null;
  var akhirDiskon = D ? Date.parse(D.sampai) : NaN;
  function diskonAktif() { return !!D && D.aktif !== false && !isNaN(akhirDiskon) && Date.now() < akhirDiskon; }
  function hargaPromo(p) {
    if (!diskonAktif() || !D.harga) return null;
    var h = Number(D.harga[p.id]);
    return h > 0 && h < p.harga ? h : null;
  }
  function tglAkhir() {
    return new Date(akhirDiskon).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  }

  // Harga termurah di hero (saat promo: harga promo + harga normal dicoret)
  function hargaHero() {
    if (!paket.length) return;
    var min = Math.min.apply(null, paket.map(function (p) { return p.harga; }));
    var minPromo = Math.min.apply(null, paket.map(function (p) { return hargaPromo(p) || p.harga; }));
    document.querySelectorAll('[data-harga-min]').forEach(function (n) {
      n.textContent = rupiah(minPromo < min ? minPromo : min);
      if (minPromo < min) { n.append(' '); n.append(el('s', 'coret', rupiah(min))); }
    });
  }
  hargaHero();

  // Promo
  if (B.promo) {
    var promo = document.getElementById('promo');
    promo.textContent = B.promo;
    promo.hidden = false;
  }

  // Katalog tema + filter kategori
  var NAMA_KATEGORI = { pernikahan: 'Pernikahan', khitan: 'Khitan', ulangtahun: 'Ulang Tahun', acara: 'Acara' };
  var gridTema = document.getElementById('grid-tema');
  var filter = document.getElementById('filter-tema');
  var kategoriAda = [];
  (B.tema || []).forEach(function (t) { if (t.kategori && kategoriAda.indexOf(t.kategori) < 0) kategoriAda.push(t.kategori); });
  if (filter && kategoriAda.length > 1) {
    ['semua'].concat(kategoriAda).forEach(function (k, i) {
      var b = el('button', 'chip' + (i === 0 ? ' aktif' : ''), k === 'semua' ? 'Semua' : (NAMA_KATEGORI[k] || k));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        filter.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('aktif', c === b); c.setAttribute('aria-selected', c === b ? 'true' : 'false'); });
        gridTema.querySelectorAll('.kartu-tema').forEach(function (kartu) { kartu.hidden = k !== 'semua' && kartu.dataset.kategori !== k; });
      });
      filter.append(b);
    });
  }
  var SAPAAN_DEMO = { pernikahan: 'Calon Pengantin', khitan: 'Bapak/Ibu', ulangtahun: 'Teman Kecil', acara: 'Tamu Undangan' };
  var paketUnggulan = ((paket.filter(function (p) { return p.unggulan; })[0] || paket[0] || {}).id) || 'premium';
  (B.tema || []).forEach(function (t) {
    // v = versi situs, supaya browser tidak memakai halaman demo lama dari cache setelah update.
    var demo = 'undangan/?u=' + encodeURIComponent(t.demo) + '&to=' + encodeURIComponent(SAPAAN_DEMO[t.kategori] || 'Tamu Undangan') + '&v=' + VERSI;
    var kartu = el('article', 'kartu-tema');
    if (t.kategori) {
      kartu.dataset.kategori = t.kategori;
      kartu.append(el('span', 'kategori-tema', NAMA_KATEGORI[t.kategori] || t.kategori));
    }
    var pratinjau = el('div', 'pratinjau');
    var frame = document.createElement('iframe');
    frame.src = demo;
    frame.title = 'Pratinjau tema ' + t.nama;
    frame.loading = 'lazy';
    frame.tabIndex = -1;
    frame.setAttribute('aria-hidden', 'true');
    pratinjau.append(frame);

    var aksi = el('div', 'aksi');
    var lihat = el('a', 'btn garis', 'Lihat Demo');
    // Demo dibuka sebagai paket unggulan; di halaman demo pengunjung bisa beralih ke paket lain.
    lihat.href = demo + '&paket=' + encodeURIComponent(paketUnggulan); lihat.target = '_blank'; lihat.rel = 'noopener';
    var pakai = el('a', 'btn', 'Pakai Tema');
    pakai.href = linkWa(sapaan + 'saya tertarik dengan tema ' + t.nama + '. Boleh minta info lebih lanjut?');
    pakai.target = '_blank'; pakai.rel = 'noopener';
    aksi.append(lihat, pakai);

    kartu.append(pratinjau, el('h3', null, t.nama), el('p', null, t.deskripsi || ''), aksi);
    gridTema.append(kartu);
  });

  // Pita promo: judul, keterangan, kuota, dan hitung mundur sampai promo berakhir.
  var pita = null, timerPromo = null;
  function pasangPita() {
    if (!diskonAktif()) return;
    var hero = document.querySelector('.hero-teks .eyebrow');
    if (hero) {
      var ajak = el('a', 'pil-promo', D.nama + ' · Diskon ' + D.persen + '%');
      ajak.href = '#harga';
      hero.parentNode.insertBefore(ajak, hero);
    }
    var kotak = el('div', 'hitung-promo');
    var unit = ['hari', 'jam', 'menit', 'detik'].map(function (l) {
      var u = el('span', 'hp-unit'); var b = el('b', null, '00'); u.append(b, el('small', null, l)); kotak.append(u); return b;
    });
    pita = el('div', 'pita-promo');
    pita.setAttribute('role', 'note');
    pita.append(el('p', 'pp-judul', D.nama + ' — Diskon ' + D.persen + '%'),
      el('p', 'pp-ket', (D.keterangan ? D.keterangan + ', ' : '') + (D.kuota ? 'untuk ' + D.kuota + ' pemesan pertama. ' : '') + 'Berlaku sampai ' + tglAkhir() + '.'),
      kotak);
    var kepalaHarga = document.querySelector('#harga .kepala');
    kepalaHarga.append(pita);
    function tik() {
      var sisa = akhirDiskon - Date.now();
      if (sisa <= 0) { // promo selesai: kembalikan harga normal tanpa memuat ulang
        clearInterval(timerPromo); pita.remove();
        var pil = document.querySelector('.pil-promo'); if (pil) pil.remove();
        hargaHero(); tulisHarga(); return;
      }
      [Math.floor(sisa / 864e5), Math.floor(sisa / 36e5) % 24, Math.floor(sisa / 6e4) % 60, Math.floor(sisa / 1e3) % 60]
        .forEach(function (v, i) { unit[i].textContent = String(v).padStart(2, '0'); });
    }
    tik(); timerPromo = setInterval(tik, 1000);
  }
  pasangPita();

  // Daftar harga
  var gridHarga = document.getElementById('grid-harga');
  function tulisHarga() {
  gridHarga.textContent = '';
  paket.forEach(function (p) {
    var promo = hargaPromo(p);
    var kartu = el('article', 'paket' + (p.unggulan ? ' unggulan' : '') + (promo ? ' berpromo' : ''));
    if (p.unggulan) kartu.append(el('span', 'label', 'Paling dipilih'));
    if (promo) kartu.append(el('span', 'label-diskon', '-' + (Number(D.persen) || Math.round((1 - promo / p.harga) * 100)) + '%'));
    var harga = el('p', 'harga', rupiah(promo || p.harga));
    harga.append(' ', el('small', null, '/ undangan'));
    var hargaNormal = promo ? el('p', 'harga-normal') : null;
    if (hargaNormal) { hargaNormal.append('Harga normal ', el('s', null, rupiah(p.harga))); }
    var ul = el('ul');
    (p.fitur || []).forEach(function (f) { ul.append(el('li', null, f)); });
    var tombol = el('a', 'btn', 'Pesan ' + p.nama);
    var teksHarga = promo ? rupiah(promo) + ', ' + D.nama + ' — harga normal ' + rupiah(p.harga) : rupiah(p.harga);
    tombol.href = linkWa(sapaan + 'saya mau pesan undangan digital paket ' + p.nama + ' (' + teksHarga + ').\n\nTema pilihan: \nTanggal acara: \nKota: ');
    tombol.target = '_blank'; tombol.rel = 'noopener';
    // Contoh undangan dengan fitur paket ini saja (pakai demo tema pertama)
    var contoh = el('a', 'contoh-paket', 'Lihat contoh paket ' + p.nama + ' ›');
    var temaContoh = (B.tema || [])[0];
    if (temaContoh) {
      contoh.href = 'undangan/?u=' + encodeURIComponent(temaContoh.demo) + '&to=' + encodeURIComponent('Tamu Spesial') + '&paket=' + encodeURIComponent(p.id) + '&v=' + VERSI;
      contoh.target = '_blank'; contoh.rel = 'noopener';
    }
    kartu.append(el('h3', null, p.nama));
    if (hargaNormal) kartu.append(hargaNormal);
    kartu.append(harga, el('p', 'masa', p.catatan || ''), ul, tombol);
    if (temaContoh) kartu.append(contoh);
    gridHarga.append(kartu);
  });
  }
  tulisHarga();

  // Testimoni (config.js → testimoni). Bagian & menu hanya tampil bila ada isinya.
  var testi = (Array.isArray(B.testimoni) ? B.testimoni : []).filter(function (t) { return t && t.nama && t.teks; });
  var bagianTesti = document.getElementById('testimoni');
  if (bagianTesti && testi.length) {
    var gridTesti = document.getElementById('grid-testimoni');
    testi.forEach(function (t) {
      var kartu = el('figure', 'kartu-testi');
      var kutip = el('blockquote', null, String(t.teks));
      var siapa = el('figcaption');
      var foto = /^https:\/\//.test(String(t.foto || '')) ? el('img', 'testi-foto') : el('span', 'testi-inisial', String(t.nama).trim().charAt(0).toUpperCase());
      if (foto.tagName === 'IMG') { foto.src = t.foto; foto.alt = ''; foto.loading = 'lazy'; }
      var info = el('span', 'testi-info');
      info.append(el('strong', null, String(t.nama)));
      if (t.acara) info.append(el('small', null, String(t.acara)));
      siapa.append(foto, info);
      kartu.append(kutip, siapa);
      if (/^https:\/\//.test(String(t.link || ''))) {
        var lihat = el('a', 'testi-link', 'Lihat undangannya ›');
        lihat.href = t.link; lihat.target = '_blank'; lihat.rel = 'noopener';
        kartu.append(lihat);
      }
      gridTesti.append(kartu);
    });
    bagianTesti.hidden = false;
    var menuHarga = document.querySelector('.menu a[href="#harga"]');
    if (menuHarga) { var m = el('a', null, 'Testimoni'); m.href = '#testimoni'; menuHarga.after(m); }
  }

  // Kontak di footer
  var kontak = document.getElementById('kontak');
  if (wa && wa !== NOMOR_CONTOH) {
    var a = el('a', null, 'WhatsApp +' + wa);
    a.href = linkWa(sapaan); a.target = '_blank'; a.rel = 'noopener';
    kontak.append(a);
  }
  var ig = String(B.instagram || '').replace(/^@/, '').replace(/[^A-Za-z0-9._]/g, '');
  if (ig) {
    if (kontak.childNodes.length) kontak.append(' · ');
    var aIg = el('a', null, 'Instagram @' + ig);
    aIg.href = 'https://instagram.com/' + ig; aIg.target = '_blank'; aIg.rel = 'noopener';
    kontak.append(aIg);
  }
})();
