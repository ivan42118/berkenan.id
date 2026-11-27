(function () {
  'use strict';
  var B = window.BRAND || {};
  var NOMOR_CONTOH = '6281234567890';
  var VERSI = '20261128a'; // samakan dengan ?v= di index.html setiap kali ada update
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

  // Admin yang membalas chat (config.js → admin)
  var A = B.admin || {};
  isiSemua('[data-admin]', A.nama);
  isiSemua('[data-jam-balas]', A.jamBalas);
  var infoAdmin = document.getElementById('info-admin');
  if (infoAdmin && A.nama) {
    infoAdmin.textContent = 'Dibantu langsung oleh ' + A.nama + (A.peran ? ', ' + A.peran : '') + '.' + (A.jamBalas ? ' Chat dibalas ' + A.jamBalas + '.' : '');
    infoAdmin.hidden = false;
  }

  if (!wa || wa === NOMOR_CONTOH) document.getElementById('peringatan').hidden = false;

  // Semua tombol WhatsApp umum. Jenis acara mengikuti filter katalog yang sedang dipilih pengunjung.
  var JENIS_WA = { pernikahan: 'pernikahan', khitan: 'khitanan', ulangtahun: 'ulang tahun', acara: 'acara' };
  function pasangWaUmum(kategori) {
    var jenis = JENIS_WA[kategori];
    var pesan = sapaan + 'saya ingin membuat undangan digital' + (jenis ? ' untuk ' + jenis : '') + '. Boleh dibantu pilih tema dan paketnya?';
    document.querySelectorAll('[data-wa]').forEach(function (a) { a.href = linkWa(pesan); });
  }
  pasangWaUmum('');

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
        pasangWaUmum(k === 'semua' ? '' : k);
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
    var labelTema = el('div', 'label-tema');
    if (t.kategori) {
      kartu.dataset.kategori = t.kategori;
      labelTema.append(el('span', 'kategori-tema', NAMA_KATEGORI[t.kategori] || t.kategori));
    }
    if (diskonAktif()) labelTema.append(el('span', 'diskon-tema', 'Diskon ' + D.persen + '%'));
    if (labelTema.childNodes.length) kartu.append(labelTema);
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
  var pita = null, timerPromo = null, semuaHitung = [];
  function buatHitung() {
    var kotak = el('div', 'hitung-promo');
    semuaHitung.push(['hari', 'jam', 'menit', 'detik'].map(function (l) {
      var u = el('span', 'hp-unit'); var b = el('b', null, '00'); u.append(b, el('small', null, l)); kotak.append(u); return b;
    }));
    return kotak;
  }
  function pasangPita() {
    if (!diskonAktif()) return;
    var hero = document.querySelector('.hero-teks .eyebrow');
    if (hero) {
      var ajak = el('a', 'pil-promo', D.nama + ' · Diskon ' + D.persen + '%');
      ajak.href = '#harga';
      hero.parentNode.insertBefore(ajak, hero);
    }
    var kotak = buatHitung();
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
        document.querySelectorAll('.pil-promo, .diskon-tema, .promo-lapis').forEach(function (n) { n.remove(); });
        document.documentElement.classList.remove('promo-terbuka');
        hargaHero(); tulisHarga(); return;
      }
      var angka = [Math.floor(sisa / 864e5), Math.floor(sisa / 36e5) % 24, Math.floor(sisa / 6e4) % 60, Math.floor(sisa / 1e3) % 60];
      semuaHitung.forEach(function (unit) { angka.forEach(function (v, i) { unit[i].textContent = String(v).padStart(2, '0'); }); });
    }
    pasangPita.tik = tik;
    tik(); timerPromo = setInterval(tik, 1000);
  }
  pasangPita();

  // Jendela promo + konfeti saat situs dibuka. Setelah ditutup, tidak muncul lagi selama 24 jam.
  function konfeti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var kanvas = el('canvas', 'konfeti');
    kanvas.setAttribute('aria-hidden', 'true');
    document.body.append(kanvas);
    var ctx = kanvas.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W, H;
    function ukur() { W = innerWidth; H = innerHeight; kanvas.width = W * dpr; kanvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    ukur(); addEventListener('resize', ukur);
    var WARNA = ['#6b1c2b', '#b8914c', '#f6e2ae', '#e8a4b0', '#ffffff', '#8c9a74', '#d9b679'];
    var butir = [];
    function semprot(x, y, sudut, jumlah) {
      for (var i = 0; i < jumlah; i++) {
        var a = sudut + (Math.random() - 0.5) * 1.1, v = 7 + Math.random() * 9;
        butir.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.35,
          w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, warna: WARNA[i % WARNA.length], bentuk: Math.random() < 0.3 ? 'bulat' : 'kotak', goyang: Math.random() * 6.28 });
      }
    }
    semprot(0, H * 0.75, -Math.PI / 3, 90);                    // dari kiri bawah
    semprot(W, H * 0.75, -Math.PI * 2 / 3, 90);                // dari kanan bawah
    setTimeout(function () { semprot(W / 2, -10, Math.PI / 2, 70); }, 350); // hujan dari atas
    var mulai = performance.now();
    (function gambar(t) {
      ctx.clearRect(0, 0, W, H);
      butir.forEach(function (b) {
        b.vy += 0.22; b.vx *= 0.985; b.vy *= 0.985; b.goyang += 0.08;
        b.x += b.vx + Math.sin(b.goyang) * 0.6; b.y += b.vy; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.warna;
        if (b.bentuk === 'bulat') { ctx.beginPath(); ctx.arc(0, 0, b.w / 2.4, 0, 6.28); ctx.fill(); }
        else ctx.fillRect(-b.w / 2, -b.h / 2 * Math.abs(Math.cos(b.goyang)), b.w, b.h * Math.abs(Math.cos(b.goyang)) + 0.5);
        ctx.restore();
      });
      butir = butir.filter(function (b) { return b.y < H + 30; });
      if (butir.length && t - mulai < 7000) requestAnimationFrame(gambar);
      else { removeEventListener('resize', ukur); kanvas.remove(); }
    })(mulai);
  }
  function jendelaPromo() {
    if (!diskonAktif()) return;
    var KUNCI = 'berkenan-promo-ditutup';
    try { var lalu = Number(localStorage.getItem(KUNCI)); if (lalu && Date.now() - lalu < 864e5) return; } catch (e) { /* tanpa penyimpanan */ }
    var tutup = el('button', 'promo-tutup', '×');
    tutup.type = 'button'; tutup.setAttribute('aria-label', 'Tutup info promo');
    var daftar = el('ul', 'promo-harga');
    paket.forEach(function (p) {
      var h = hargaPromo(p);
      if (!h) return;
      var li = el('li'); li.append(el('span', null, p.nama), el('s', null, rupiah(p.harga)), el('b', null, rupiah(h)));
      daftar.append(li);
    });
    var lihat = el('a', 'btn', 'Lihat harga promo');
    lihat.href = '#harga';
    var tanya = el('a', 'btn garis', 'Tanya via WhatsApp');
    tanya.href = linkWa(sapaan + 'saya mau tanya tentang ' + D.nama + ' diskon ' + D.persen + '%.');
    tanya.target = '_blank'; tanya.rel = 'noopener';
    var atas = el('div', 'promo-atas');
    atas.append(el('p', 'promo-label', D.nama), el('p', 'promo-besar', 'Diskon ' + D.persen + '%'),
      el('p', 'promo-ket', (D.keterangan || 'Untuk semua paket') + (D.kuota ? ' · ' + D.kuota + ' pemesan pertama' : '')),
      buatHitung(), el('p', 'promo-sampai', 'Berakhir ' + tglAkhir()));
    var bawah = el('div', 'promo-bawah');
    bawah.append(daftar);
    var aksi = el('div', 'promo-aksi'); aksi.append(lihat, tanya); bawah.append(aksi);
    var kotak = el('div', 'promo-kotak'); kotak.append(tutup, atas, bawah);
    var lapis = el('div', 'promo-lapis');
    lapis.setAttribute('role', 'dialog'); lapis.setAttribute('aria-modal', 'true'); lapis.setAttribute('aria-label', D.nama + ' diskon ' + D.persen + '%');
    lapis.append(kotak);
    function tutupJendela() {
      try { localStorage.setItem(KUNCI, String(Date.now())); } catch (e) { /* abaikan */ }
      lapis.classList.add('keluar');
      document.documentElement.classList.remove('promo-terbuka');
      document.removeEventListener('keydown', esc);
      setTimeout(function () { lapis.remove(); }, 300);
    }
    function esc(e) { if (e.key === 'Escape') tutupJendela(); }
    tutup.addEventListener('click', tutupJendela);
    lihat.addEventListener('click', tutupJendela);
    lapis.addEventListener('click', function (e) { if (e.target === lapis) tutupJendela(); });
    document.addEventListener('keydown', esc);
    document.body.append(lapis);
    document.documentElement.classList.add('promo-terbuka');
    if (pasangPita.tik) pasangPita.tik();
    tutup.focus({ preventScroll: true });
    konfeti();
  }
  setTimeout(jendelaPromo, 700);

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

  // Testimoni (config.js → testimoni). Nama & kata-kata hanya tampil bila izin: true.
  // Sebelum itu yang tampil hanya ringkasan jumlah acara, tanpa nama siapa pun.
  var semuaTesti = (Array.isArray(B.testimoni) ? B.testimoni : []).filter(function (t) { return t && t.nama; });
  var testi = semuaTesti.filter(function (t) { return t.izin === true && t.teks; });
  var bagianTesti = document.getElementById('testimoni');
  if (bagianTesti && semuaTesti.length) {
    var JENIS_RINGKAS = { pernikahan: 'pernikahan', khitan: 'khitanan', ulangtahun: 'ulang tahun', acara: 'acara lain' };
    var hitungJenis = {};
    semuaTesti.forEach(function (t) { if (JENIS_RINGKAS[t.jenis]) hitungJenis[t.jenis] = (hitungJenis[t.jenis] || 0) + 1; });
    var ringkas = document.getElementById('ringkas-testi');
    var butirRingkas = function (n, label) { var li = el('li'); li.append(el('b', null, String(n)), el('span', null, label)); ringkas.append(li); };
    butirRingkas(semuaTesti.length, 'undangan');
    Object.keys(JENIS_RINGKAS).forEach(function (k) { if (hitungJenis[k]) butirRingkas(hitungJenis[k], JENIS_RINGKAS[k]); });
    if (testi.length) {
      var gridTesti = document.getElementById('grid-testimoni');
      var TAMPIL_AWAL = 6; // sisanya disembunyikan di balik tombol supaya halaman di HP tidak terlalu panjang
      testi.forEach(function (t, i) {
        var kartu = el('figure', 'kartu-testi');
        if (i >= TAMPIL_AWAL) kartu.hidden = true;
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
      if (testi.length > TAMPIL_AWAL) {
        var sisa = testi.length - TAMPIL_AWAL;
        var bungkusLagi = el('p', 'testi-lagi');
        var tombolLagi = el('button', 'btn garis kecil', 'Lihat ' + sisa + ' testimoni lainnya');
        tombolLagi.type = 'button';
        tombolLagi.addEventListener('click', function () {
          var tersembunyi = gridTesti.querySelectorAll('.kartu-testi[hidden]');
          tersembunyi.forEach(function (k) { k.hidden = false; });
          bungkusLagi.remove();
          if (tersembunyi[0]) { tersembunyi[0].tabIndex = -1; tersembunyi[0].focus({ preventScroll: true }); }
        });
        bungkusLagi.append(tombolLagi);
        gridTesti.after(bungkusLagi);
      }
      document.getElementById('testi-ajak').hidden = false;
      var menuHarga = document.querySelector('.menu a[href="#harga"]');
      if (menuHarga) { var m = el('a', null, 'Testimoni'); m.href = '#testimoni'; menuHarga.after(m); }
    } else {
      bagianTesti.querySelector('.eyebrow').textContent = 'Rekam jejak';
    }
    bagianTesti.hidden = false;
  }

  // Kontak di footer
  var kontak = document.getElementById('kontak');
  if (A.nama) kontak.append('Admin: ' + A.nama);
  if (wa && wa !== NOMOR_CONTOH) {
    if (kontak.childNodes.length) kontak.append(' · ');
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
