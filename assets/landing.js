(function () {
  'use strict';
  var B = window.BRAND || {};
  var NOMOR_CONTOH = '6281234567890';
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

  // Harga termurah di hero
  var paket = Array.isArray(B.paket) ? B.paket : [];
  if (paket.length) {
    var min = Math.min.apply(null, paket.map(function (p) { return p.harga; }));
    isiSemua('[data-harga-min]', rupiah(min));
  }

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
  (B.tema || []).forEach(function (t) {
    var demo = 'undangan/?u=' + encodeURIComponent(t.demo) + '&to=' + encodeURIComponent(SAPAAN_DEMO[t.kategori] || 'Tamu Undangan');
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
    lihat.href = demo; lihat.target = '_blank'; lihat.rel = 'noopener';
    var pakai = el('a', 'btn', 'Pakai Tema');
    pakai.href = linkWa(sapaan + 'saya tertarik dengan tema ' + t.nama + '. Boleh minta info lebih lanjut?');
    pakai.target = '_blank'; pakai.rel = 'noopener';
    aksi.append(lihat, pakai);

    kartu.append(pratinjau, el('h3', null, t.nama), el('p', null, t.deskripsi || ''), aksi);
    gridTema.append(kartu);
  });

  // Daftar harga
  var gridHarga = document.getElementById('grid-harga');
  paket.forEach(function (p) {
    var kartu = el('article', 'paket' + (p.unggulan ? ' unggulan' : ''));
    if (p.unggulan) kartu.append(el('span', 'label', 'Paling dipilih'));
    var harga = el('p', 'harga', rupiah(p.harga));
    harga.append(' ', el('small', null, '/ undangan'));
    var ul = el('ul');
    (p.fitur || []).forEach(function (f) { ul.append(el('li', null, f)); });
    var tombol = el('a', 'btn', 'Pesan ' + p.nama);
    tombol.href = linkWa(sapaan + 'saya mau pesan undangan digital paket ' + p.nama + ' (' + rupiah(p.harga) + ').\n\nTema pilihan: \nTanggal acara: \nKota: ');
    tombol.target = '_blank'; tombol.rel = 'noopener';
    kartu.append(el('h3', null, p.nama), harga, el('p', 'masa', p.catatan || ''), ul, tombol);
    gridHarga.append(kartu);
  });

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
