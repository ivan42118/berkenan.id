(function () {
  'use strict';
  var B = window.BRAND || {};
  var form = document.getElementById('form');
  var frame = document.getElementById('preview');
  var pesan = document.getElementById('pesan');
  var inputSlug = document.getElementById('slug');
  var KUNCI_DRAF = 'admin:draf-undangan';

  // Kolom untuk bagian yang bisa ditambah berulang.
  var GRUP = {
    'acara': [
      ['nama', 'Nama acara'], ['tanggal', 'Tanggal', 'date'], ['mulai', 'Jam mulai', 'time'],
      ['selesai', 'Jam selesai (kosong = "Selesai")', 'time'], ['zona', 'Zona waktu', 'zona'],
      ['tempat', 'Tempat'], ['alamat', 'Alamat', 'lebar'], ['maps', 'Link Google Maps (opsional)', 'lebar']
    ],
    'cerita': [['judul', 'Judul / tahun'], ['teks', 'Cerita', 'textarea'], ['foto', 'Foto (opsional)', 'lebar']],
    'galeri': [['src', 'Path / URL foto'], ['ket', 'Keterangan (opsional)']],
    'amplop.rekening': [['bank', 'Bank / e-wallet'], ['nomor', 'Nomor'], ['atas_nama', 'Atas nama']]
  };
  var LABEL_GRUP = { 'acara': 'Acara', 'cerita': 'Cerita', 'galeri': 'Foto', 'amplop.rekening': 'Rekening' };

  /* ---------- utilitas ---------- */
  function ambil(obj, jalur) {
    return jalur.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function pasang(obj, jalur, nilai) {
    var k = jalur.split('.');
    var o = obj;
    for (var i = 0; i < k.length - 1; i++) { o[k[i]] = o[k[i]] || {}; o = o[k[i]]; }
    o[k[k.length - 1]] = nilai;
  }
  function slugify(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(tag, attrs, teks) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (teks != null) n.textContent = teks;
    return n;
  }
  function info(teks, galat) { pesan.textContent = teks; pesan.className = 'pesan' + (galat ? ' galat' : ''); }
  function unduh(nama, isi, tipe) {
    var url = URL.createObjectURL(new Blob([isi], { type: tipe }));
    var a = el('a', { href: url, download: nama });
    document.body.append(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- isi pilihan tema & demo ---------- */
  var pilihTema = document.getElementById('tema');
  var pilihDemo = document.getElementById('pilih-demo');
  (B.tema || [{ id: 'sage', nama: 'Sage' }]).forEach(function (t) {
    pilihTema.append(el('option', { value: t.id }, t.nama));
    if (t.demo) pilihDemo.append(el('option', { value: t.demo }, 'Contoh: ' + t.nama));
  });

  /* ---------- grup berulang ---------- */
  function buatItem(grup, nilai) {
    nilai = nilai || {};
    var wadah = form.querySelector('[data-grup="' + grup + '"]');
    var item = el('div', { class: 'item' });
    var kepala = el('div', { class: 'item-kepala' });
    var judul = el('span', null, LABEL_GRUP[grup]);
    var alat = el('div', { class: 'alat' });
    var naik = el('button', { type: 'button', class: 'btn garis kecil', 'aria-label': 'Pindah ke atas' }, '↑');
    var hapus = el('button', { type: 'button', class: 'btn bahaya kecil' }, 'Hapus');
    naik.addEventListener('click', function () { if (item.previousElementSibling) { wadah.insertBefore(item, item.previousElementSibling); berubah(); } });
    hapus.addEventListener('click', function () { item.remove(); berubah(); });
    alat.append(naik, hapus);
    kepala.append(judul, alat);
    var baris = el('div', { class: 'baris' });
    GRUP[grup].forEach(function (k) {
      var lab = el('label', { class: 'f' + (k[2] === 'textarea' || k[2] === 'lebar' ? ' lebar' : '') }, k[1]);
      var input;
      if (k[2] === 'textarea') input = el('textarea');
      else if (k[2] === 'zona') {
        input = el('select');
        ['WIB', 'WITA', 'WIT'].forEach(function (z) { input.append(el('option', { value: z }, z)); });
      } else input = el('input', { type: k[2] === 'date' || k[2] === 'time' ? k[2] : 'text' });
      input.dataset.f = k[0];
      input.value = nilai[k[0]] != null ? nilai[k[0]] : (k[2] === 'zona' ? 'WIB' : '');
      lab.append(input);
      baris.append(lab);
    });
    item.append(kepala, baris);
    wadah.append(item);
    return item;
  }

  /* ---------- form ⇄ data ---------- */
  function kumpulkan() {
    var d = {};
    form.querySelectorAll('[data-k]').forEach(function (n) {
      var v = n.type === 'checkbox' ? n.checked : n.value.trim();
      pasang(d, n.dataset.k, v);
    });
    Object.keys(GRUP).forEach(function (g) {
      var list = [];
      form.querySelectorAll('[data-grup="' + g + '"] .item').forEach(function (item) {
        var o = {}, ada = false;
        item.querySelectorAll('[data-f]').forEach(function (n) {
          o[n.dataset.f] = n.value.trim();
          if (o[n.dataset.f] && n.dataset.f !== 'zona') ada = true;
        });
        if (ada) list.push(o);
      });
      pasang(d, g, list);
    });
    d.slug = slugify(d.slug);
    return d;
  }

  function isi(d) {
    d = d || {};
    form.querySelectorAll('[data-k]').forEach(function (n) {
      var v = ambil(d, n.dataset.k);
      if (n.type === 'checkbox') n.checked = v !== false;
      else n.value = v == null ? '' : v;
    });
    if (!pilihTema.value) pilihTema.selectedIndex = 0;
    Object.keys(GRUP).forEach(function (g) {
      form.querySelector('[data-grup="' + g + '"]').textContent = '';
      (ambil(d, g) || []).forEach(function (v) { buatItem(g, typeof v === 'string' ? { src: v } : v); });
    });
    if (!(ambil(d, 'acara') || []).length) buatItem('acara', { nama: 'Akad Nikah' });
    inputSlug.dataset.manual = d.slug ? '1' : '';
    berubah();
  }

  /* ---------- pratinjau & simpan ---------- */
  var tunda = null;
  function berubah() {
    clearTimeout(tunda);
    tunda = setTimeout(function () {
      var d = kumpulkan();
      try { localStorage.setItem(KUNCI_DRAF, JSON.stringify(d)); } catch (e) { /* penuh */ }
      kirimPreview(d);
      tampilkanLink(d);
    }, 200);
  }
  function kirimPreview(d) {
    if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'undangan-data', data: d || kumpulkan() }, location.origin);
  }
  window.addEventListener('message', function (e) {
    if (e.origin === location.origin && e.data && e.data.type === 'undangan-siap') kirimPreview();
  });

  function dasarSitus() { return (B.situs || location.origin).replace(/\/+$/, ''); }
  function tampilkanLink(d) {
    var box = document.getElementById('info-link');
    box.textContent = '';
    if (!d.slug) { box.textContent = 'Isi slug untuk melihat link undangan.'; return; }
    box.append('Link tamu: ', el('code', null, dasarSitus() + '/' + d.slug + '/?to=Nama+Tamu'));
    box.append(el('br'), 'Simpan ke: ', el('code', null, 'undangan/data/' + d.slug + '.json'), ' + ', el('code', null, d.slug + '/index.html'));
  }

  form.addEventListener('input', function (e) {
    if (e.target === inputSlug) inputSlug.dataset.manual = inputSlug.value ? '1' : '';
    if (e.target.hasAttribute('data-nama') && !inputSlug.dataset.manual) {
      var d = kumpulkan();
      var urut = d.urutan === 'wanita' ? [d.wanita, d.pria] : [d.pria, d.wanita];
      inputSlug.value = slugify([urut[0].panggilan, urut[1].panggilan].filter(Boolean).join('-'));
    }
    berubah();
  });
  form.addEventListener('change', berubah);
  form.querySelectorAll('[data-tambah]').forEach(function (b) {
    b.addEventListener('click', function () { buatItem(b.dataset.tambah).querySelector('input,textarea').focus(); berubah(); });
  });

  /* ---------- tombol atas ---------- */
  function validasi(d) {
    if (!/^[a-z0-9-]{1,60}$/.test(d.slug)) { info('Slug wajib diisi (huruf kecil, angka, tanda -).', true); inputSlug.focus(); return false; }
    if (!d.pria.panggilan || !d.wanita.panggilan) { info('Nama panggilan kedua mempelai wajib diisi.', true); return false; }
    if (!d.acara.length || !d.acara[0].tanggal) { info('Acara pertama wajib punya tanggal.', true); return false; }
    return true;
  }

  document.getElementById('btn-json').addEventListener('click', function () {
    var d = kumpulkan();
    if (!validasi(d)) return;
    unduh(d.slug + '.json', JSON.stringify(d, null, 2) + '\n', 'application/json');
    info('Tersimpan: ' + d.slug + '.json → taruh di folder undangan/data/.');
  });

  document.getElementById('btn-stub').addEventListener('click', function () {
    var d = kumpulkan();
    if (!validasi(d)) return;
    unduh('index.html', buatStub(d), 'text/html');
    info('Tersimpan: index.html → buat folder "' + d.slug + '" di root situs, lalu taruh file ini di dalamnya.');
  });

  document.getElementById('btn-baru').addEventListener('click', function () {
    if (!confirm('Kosongkan form? Draf yang belum diunduh akan hilang.')) return;
    isi({ tema: pilihTema.options[0] && pilihTema.options[0].value, rsvp: { aktif: true } });
    info('Form dikosongkan.');
  });

  pilihDemo.addEventListener('change', function () {
    if (!pilihDemo.value) return;
    fetch('../undangan/data/' + encodeURIComponent(pilihDemo.value) + '.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { d.slug = ''; isi(d); info('Contoh dimuat. Ganti datanya dan slug-nya.'); })
      .catch(function () { info('Gagal memuat contoh. Pastikan halaman dibuka lewat server lokal, bukan file://.', true); })
      .finally(function () { pilihDemo.value = ''; });
  });

  document.getElementById('file-json').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    file.text().then(function (t) { isi(JSON.parse(t)); info('Dibuka: ' + file.name); })
      .catch(function () { info('File JSON tidak valid.', true); });
    e.target.value = '';
  });

  /* ---------- halaman link pendek (untuk URL rapi & preview WhatsApp) ---------- */
  function buatStub(d) {
    var urut = d.urutan === 'wanita' ? [d.wanita, d.pria] : [d.pria, d.wanita];
    var pasangan = urut[0].panggilan + ' & ' + urut[1].panggilan;
    var a = d.acara[0];
    var tgl = '';
    try {
      tgl = new Date(a.tanggal + 'T12:00:00+07:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
    } catch (e) { /* abaikan */ }
    var gambar = d.sampul || d.wanita.foto || d.pria.foto || '';
    if (gambar && !/^https?:\/\//i.test(gambar)) gambar = B.situs ? dasarSitus() + '/undangan/' + gambar.replace(/^\/+/, '') : '';
    var judul = 'The Wedding of ' + pasangan;
    var desk = (tgl ? tgl + ' — ' : '') + 'Kami mengundang Anda untuk hadir dan memberikan doa restu.';
    var tujuan = '../undangan/?u=' + d.slug; // slug sudah divalidasi [a-z0-9-]
    return '<!doctype html>\n<html lang="id">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<meta name="robots" content="noindex, nofollow">\n' +
      '<title>' + esc(judul) + '</title>\n' +
      '<meta property="og:title" content="' + esc(judul) + '">\n' +
      '<meta property="og:description" content="' + esc(desk) + '">\n' +
      '<meta property="og:type" content="website">\n' +
      (gambar ? '<meta property="og:image" content="' + esc(gambar) + '">\n' : '') +
      '<script>location.replace("' + tujuan + '"+(location.search?"&"+location.search.slice(1):""));</script>\n' +
      '</head>\n<body><p><a href="' + esc(tujuan) + '">Buka undangan</a></p></body>\n</html>\n';
  }

  /* ---------- mulai ---------- */
  var draf = null;
  try { draf = JSON.parse(localStorage.getItem(KUNCI_DRAF)); } catch (e) { /* abaikan */ }
  isi(draf || { tema: pilihTema.options[0] && pilihTema.options[0].value, rsvp: { aktif: true } });
})();
