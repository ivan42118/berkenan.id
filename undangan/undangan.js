/*
 * Mesin template undangan.
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

  var TEMA_VALID = (BRAND.tema || []).map(function (t) { return t.id; });
  if (!TEMA_VALID.length) TEMA_VALID = ['sage', 'emas', 'putih'];
  var ZONA = { WIB: '+07:00', WITA: '+08:00', WIT: '+09:00' };
  var TZ = { WIB: 'Asia/Jakarta', WITA: 'Asia/Makassar', WIT: 'Asia/Jayapura' };

  var data = null;
  var timerHitung = null;
  var audio = null;
  var sudahDibuka = langsungBuka;
  var pengamat = null;

  /* ---------- utilitas ---------- */

  // Semua teks masuk lewat textContent, jadi data tamu/JSON tidak bisa menyisipkan HTML.
  function el(tag, attrs) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
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

  // Hanya izinkan http(s) atau path relatif; tolak javascript:, data:, dll.
  function amanUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.indexOf('//') === 0) return '';
    return u;
  }

  function teks(v) { return v == null ? '' : String(v).trim(); }
  function daftar(v) { return Array.isArray(v) ? v.filter(Boolean) : []; }

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
    if (!akhir) { // "sampai selesai" → anggap 2 jam
      var j = Math.min(23, parseInt(mulai.slice(0, 2), 10) + 2);
      akhir = (j < 10 ? '0' : '') + j + mulai.slice(2);
    }
    var q = new URLSearchParams({
      action: 'TEMPLATE',
      text: judul,
      dates: tgl + 'T' + mulai + '00/' + tgl + 'T' + akhir + '00',
      ctz: tz(a),
      location: [a.tempat, a.alamat].filter(Boolean).join(', ')
    });
    return 'https://calendar.google.com/calendar/render?' + q.toString();
  }

  function inisial(s) { return (teks(s).charAt(0) || '?').toUpperCase(); }

  function ornamen() {
    var w = el('div', { class: 'ornamen', 'aria-hidden': 'true' });
    // SVG statis (tidak berisi data pengguna).
    w.innerHTML = '<svg viewBox="0 0 240 40" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">' +
      '<path d="M10 20h70M160 20h70"/>' +
      '<path d="M120 6c-6 6-6 22 0 28 6-6 6-22 0-28z"/>' +
      '<path d="M120 20c-10-8-24-8-32 0 8 8 22 8 32 0zM120 20c10-8 24-8 32 0-8 8-22 8-32 0z"/>' +
      '<circle cx="84" cy="20" r="2" fill="currentColor"/><circle cx="156" cy="20" r="2" fill="currentColor"/></svg>';
    return w;
  }

  function salinTeks(s, tombol) {
    var asli = tombol.textContent;
    function ok() { tombol.textContent = 'Tersalin ✓'; setTimeout(function () { tombol.textContent = asli; }, 1800); }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(s).then(ok, function () { cadangan(); });
    } else cadangan();
    function cadangan() {
      var t = el('textarea', { readonly: true, style: 'position:fixed;opacity:0' });
      t.value = s; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); ok(); } catch (e) { /* abaikan */ }
      t.remove();
    }
  }

  function foto(orang, kelas) {
    var src = amanUrl(orang.foto);
    if (src) return el('img', { class: kelas, src: src, alt: teks(orang.lengkap || orang.panggilan), loading: 'lazy' });
    return el('div', { class: kelas + ' monogram', 'aria-hidden': 'true', text: inisial(orang.panggilan) });
  }

  function judulBagian(judul, sub) {
    return el('header', { class: 'judul-bagian muncul' },
      sub ? el('p', { class: 'sub', text: sub }) : null,
      el('h2', { text: judul }),
      ornamen());
  }

  /* ---------- bagian-bagian undangan ---------- */

  function bagianSampul(d, pasangan, tglUtama) {
    var bg = amanUrl(d.sampul);
    var s = el('section', { class: 'sampul' + (bg ? ' berfoto' : ''), id: 'sampul' });
    if (bg) s.style.setProperty('--foto-sampul', 'url("' + bg.replace(/["\\]/g, '') + '")');
    s.append(el('div', { class: 'sampul-isi' },
      el('p', { class: 'sub', text: 'The Wedding of' }),
      el('h1', { class: 'nama-script', text: pasangan }),
      tglUtama ? el('p', { class: 'tgl-sampul', text: tglUtama }) : null,
      ornamen(),
      el('div', { class: 'kepada' },
        el('p', { text: 'Kepada Yth. Bapak/Ibu/Saudara/i' }),
        el('p', { class: 'nama-tamu', text: tamu || 'Tamu Undangan' }),
        el('p', { class: 'kecil', text: 'Mohon maaf apabila ada kesalahan penulisan nama atau gelar.' })),
      el('button', { class: 'tombol', type: 'button', onclick: bukaUndangan }, '✉  Buka Undangan')));
    return s;
  }

  function bagianPembuka(d, pasangan, acaraUtama) {
    var s = el('section', { class: 'bagian pembuka', id: 'beranda' },
      el('p', { class: 'sub muncul', text: 'Kami Menikah' }),
      el('h2', { class: 'nama-script besar muncul', text: pasangan }),
      acaraUtama ? el('p', { class: 'tgl-besar muncul', text: fmtTanggal(acaraUtama) }) : null,
      ornamen());
    if (acaraUtama && waktuAcara(acaraUtama)) {
      var kotak = el('div', { class: 'hitung muncul', role: 'timer', 'aria-label': 'Hitung mundur menuju acara' });
      s.append(kotak);
      mulaiHitung(kotak, waktuAcara(acaraUtama));
      s.append(el('a', { class: 'tombol garis muncul', href: linkKalender(acaraUtama, 'Pernikahan ' + pasangan), target: '_blank', rel: 'noopener' }, 'Simpan ke Kalender'));
    }
    return s;
  }

  function mulaiHitung(kotak, target) {
    var label = ['Hari', 'Jam', 'Menit', 'Detik'];
    var angka = label.map(function (l) {
      var a = el('span', { class: 'angka', text: '0' });
      kotak.append(el('div', { class: 'unit' }, a, el('span', { class: 'label', text: l })));
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

  function bagianKutipan(d) {
    var k = d.kutipan || {};
    if (!teks(k.teks)) return null;
    return el('section', { class: 'bagian kutipan' },
      el('blockquote', { class: 'muncul' },
        el('p', { text: '“' + teks(k.teks) + '”' }),
        teks(k.sumber) ? el('cite', { text: teks(k.sumber) }) : null));
  }

  function kartuMempelai(o, peran) {
    var ig = teks(o.instagram).replace(/^@/, '').replace(/[^A-Za-z0-9._]/g, '');
    return el('article', { class: 'mempelai muncul' },
      el('div', { class: 'bingkai-foto' }, foto(o, 'foto-mempelai')),
      el('h3', { class: 'nama-script', text: teks(o.panggilan) }),
      el('p', { class: 'nama-lengkap', text: teks(o.lengkap) }),
      teks(o.ortu) ? el('p', { class: 'ortu', text: teks(o.ortu) }) : null,
      ig ? el('a', { class: 'ig', href: 'https://instagram.com/' + ig, target: '_blank', rel: 'noopener', 'aria-label': 'Instagram ' + peran }, '@' + ig) : null);
  }

  function bagianMempelai(d) {
    var pria = d.pria || {}, wanita = d.wanita || {};
    var urut = d.urutan === 'wanita' ? [[wanita, 'mempelai wanita'], [pria, 'mempelai pria']] : [[pria, 'mempelai pria'], [wanita, 'mempelai wanita']];
    return el('section', { class: 'bagian', id: 'mempelai' },
      teks(d.salam) ? el('p', { class: 'salam muncul', text: teks(d.salam) }) : null,
      teks(d.pembuka) ? el('p', { class: 'paragraf muncul', text: teks(d.pembuka) }) : null,
      kartuMempelai(urut[0][0], urut[0][1]),
      el('p', { class: 'dan muncul', 'aria-hidden': 'true', text: '&' }),
      kartuMempelai(urut[1][0], urut[1][1]));
  }

  function bagianAcara(d, pasangan) {
    var acara = daftar(d.acara);
    if (!acara.length) return null;
    return el('section', { class: 'bagian latar-lembut', id: 'acara' },
      judulBagian('Waktu & Tempat', 'Save the Date'),
      acara.map(function (a) {
        var maps = amanUrl(a.maps) || (teks(a.alamat) ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([a.tempat, a.alamat].filter(Boolean).join(', ')) : '');
        return el('article', { class: 'kartu acara muncul' },
          el('h3', { text: teks(a.nama) }),
          el('p', { class: 'hari', text: fmtTanggal(a) }),
          el('p', { class: 'jam', text: fmtJam(a) }),
          el('div', { class: 'garis-tipis' }),
          el('p', { class: 'tempat', text: teks(a.tempat) }),
          el('p', { class: 'alamat', text: teks(a.alamat) }),
          el('div', { class: 'baris-tombol' },
            maps ? el('a', { class: 'tombol kecil', href: maps, target: '_blank', rel: 'noopener' }, 'Lihat Lokasi') : null,
            waktuAcara(a) ? el('a', { class: 'tombol kecil garis', href: linkKalender(a, teks(a.nama) + ' ' + pasangan), target: '_blank', rel: 'noopener' }, '+ Kalender') : null));
      }),
      teks(d.siaran) && amanUrl(d.siaran) ? el('p', { class: 'muncul tengah' }, el('a', { class: 'tombol garis', href: amanUrl(d.siaran), target: '_blank', rel: 'noopener' }, 'Tonton Siaran Langsung')) : null);
  }

  function bagianCerita(d) {
    var cerita = daftar(d.cerita).filter(function (c) { return teks(c.judul) || teks(c.teks); });
    if (!cerita.length) return null;
    return el('section', { class: 'bagian', id: 'cerita' },
      judulBagian('Kisah Kami', 'Love Story'),
      el('ol', { class: 'linimasa' }, cerita.map(function (c) {
        return el('li', { class: 'muncul' }, el('h3', { text: teks(c.judul) }), el('p', { text: teks(c.teks) }));
      })));
  }

  function bagianGaleri(d) {
    var galeri = daftar(d.galeri);
    if (!galeri.length) return null;
    var grid = el('div', { class: 'galeri' });
    galeri.forEach(function (g, i) {
      var src = amanUrl(typeof g === 'string' ? g : g.src);
      var ket = typeof g === 'string' ? '' : teks(g.ket);
      if (src) {
        grid.append(el('button', { class: 'foto-galeri muncul', type: 'button', 'aria-label': 'Perbesar foto ' + (i + 1), onclick: function () { bukaLightbox(src, ket); } },
          el('img', { src: src, alt: ket || 'Foto ' + (i + 1), loading: 'lazy' })));
      } else {
        grid.append(el('div', { class: 'foto-galeri kosong muncul', 'aria-hidden': 'true' }, el('span', { text: ket || 'Foto ' + (i + 1) })));
      }
    });
    return el('section', { class: 'bagian latar-lembut', id: 'galeri' }, judulBagian('Galeri', 'Momen Bahagia'), grid);
  }

  function bukaLightbox(src, ket) {
    var tutup = function () { lb.remove(); document.removeEventListener('keydown', esc); };
    var esc = function (e) { if (e.key === 'Escape') tutup(); };
    var lb = el('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', onclick: tutup },
      el('img', { src: src, alt: ket || 'Foto' }),
      ket ? el('p', { text: ket }) : null,
      el('button', { class: 'tutup', type: 'button', 'aria-label': 'Tutup', text: '×' }));
    document.addEventListener('keydown', esc);
    document.body.append(lb);
  }

  function bagianRsvp(d) {
    var r = d.rsvp || {};
    if (r.aktif === false) return null;
    var endpoint = amanUrl(r.endpoint || BRAND.rsvpEndpoint);
    var kunciLokal = 'ucapan:' + (slug || 'preview');
    var daftarUcapan = el('ul', { class: 'daftar-ucapan' });
    var status = el('p', { class: 'status', role: 'status' });

    var inputNama = el('input', { name: 'nama', required: true, maxlength: 80, autocomplete: 'name', placeholder: 'Nama kamu' });
    inputNama.value = tamu;
    var pilihJumlah = el('select', { name: 'jumlah' }, [1, 2, 3, 4, 5].map(function (n) { return el('option', { value: n, text: n + ' orang' }); }));
    var bungkusJumlah = el('label', { class: 'field' }, 'Jumlah yang hadir', pilihJumlah);
    var opsi = [['hadir', 'Hadir'], ['tidak', 'Tidak hadir'], ['ragu', 'Masih ragu']];
    var radio = el('div', { class: 'pilihan', role: 'radiogroup', 'aria-label': 'Konfirmasi kehadiran' }, opsi.map(function (o, i) {
      return el('label', null, el('input', { type: 'radio', name: 'kehadiran', value: o[0], checked: i === 0, onchange: perbaruiJumlah }), el('span', { text: o[1] }));
    }));
    var ucapan = el('textarea', { name: 'ucapan', rows: 4, maxlength: 500, placeholder: 'Tulis ucapan & doa untuk kedua mempelai' });
    var kirim = el('button', { class: 'tombol', type: 'submit' }, 'Kirim');

    function perbaruiJumlah() {
      var v = form.querySelector('input[name=kehadiran]:checked');
      bungkusJumlah.hidden = !v || v.value !== 'hadir';
    }

    var form = el('form', { class: 'kartu form-rsvp muncul', onsubmit: kirimRsvp },
      el('label', { class: 'field' }, 'Nama', inputNama),
      radio, bungkusJumlah,
      el('label', { class: 'field' }, 'Ucapan & doa', ucapan),
      kirim, status);

    function itemUcapan(u) {
      var label = { hadir: 'Hadir', tidak: 'Tidak hadir', ragu: 'Masih ragu' }[u.kehadiran];
      return el('li', { class: 'ucapan' },
        el('p', { class: 'pengirim' }, el('strong', { text: teks(u.nama) }), label ? el('span', { class: 'lencana ' + u.kehadiran, text: label }) : null),
        el('p', { text: teks(u.ucapan) }));
    }
    function tampilkan(list) {
      daftarUcapan.textContent = '';
      list = (list || []).filter(function (u) { return teks(u.ucapan); });
      if (!list.length) daftarUcapan.append(el('li', { class: 'kosong', text: 'Jadilah yang pertama memberi ucapan.' }));
      list.forEach(function (u) { daftarUcapan.append(itemUcapan(u)); });
    }
    function bacaLokal() { try { return JSON.parse(localStorage.getItem(kunciLokal)) || []; } catch (e) { return []; } }
    function muat() {
      if (!endpoint || modePreview) { tampilkan(bacaLokal()); return; }
      fetch(endpoint + (endpoint.indexOf('?') < 0 ? '?' : '&') + 'u=' + encodeURIComponent(slug))
        .then(function (res) { return res.json(); })
        .then(function (list) { tampilkan(Array.isArray(list) ? list : []); })
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
      var selesai = function () {
        kirim.disabled = false; ucapan.value = '';
        status.textContent = 'Terima kasih, konfirmasi kamu sudah kami terima.';
        var lokal = bacaLokal(); lokal.unshift(isi);
        try { localStorage.setItem(kunciLokal, JSON.stringify(lokal.slice(0, 50))); } catch (err) { /* penuh */ }
        if (!endpoint || modePreview) tampilkan(lokal);
        else daftarUcapan.prepend(itemUcapan(isi));
      };
      if (!endpoint || modePreview) { setTimeout(selesai, 300); return; }
      // Google Apps Script tidak mengirim header CORS untuk POST, jadi pakai no-cors (respons tidak dibaca).
      fetch(endpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(isi) })
        .then(selesai)
        .catch(function () { kirim.disabled = false; status.textContent = 'Gagal mengirim. Periksa koneksi lalu coba lagi.'; });
    }

    var waPasangan = teks(r.wa).replace(/\D/g, '');
    var bagian = el('section', { class: 'bagian', id: 'rsvp' },
      judulBagian('Konfirmasi Kehadiran', 'RSVP & Ucapan'),
      el('p', { class: 'paragraf muncul', text: 'Mohon kesediaan Bapak/Ibu/Saudara/i untuk mengonfirmasi kehadiran dan menitipkan doa terbaik.' }),
      form,
      waPasangan ? el('p', { class: 'tengah muncul' }, el('a', { class: 'tombol garis kecil', target: '_blank', rel: 'noopener', href: 'https://wa.me/' + waPasangan + '?text=' + encodeURIComponent('Halo, saya ' + (tamu || '…') + '. Saya ingin konfirmasi kehadiran di acara pernikahan kalian.') }, 'Konfirmasi via WhatsApp')) : null,
      (!endpoint && !modePreview) ? el('p', { class: 'catatan-demo', text: 'Mode demo: ucapan hanya tersimpan di perangkat ini.' }) : null,
      daftarUcapan);
    setTimeout(function () { perbaruiJumlah(); muat(); }, 0);
    return bagian;
  }

  function bagianAmplop(d) {
    var a = d.amplop || {};
    var rek = daftar(a.rekening).filter(function (r) { return teks(r.nomor); });
    if (!rek.length && !teks(a.alamat)) return null;
    return el('section', { class: 'bagian latar-lembut', id: 'amplop' },
      judulBagian('Amplop Digital', 'Tanda Kasih'),
      el('p', { class: 'paragraf muncul', text: teks(a.pengantar) || 'Doa restu Anda adalah karunia terindah bagi kami. Namun jika ingin memberi tanda kasih, Anda dapat mengirimkannya melalui:' }),
      rek.map(function (r) {
        var nomor = teks(r.nomor);
        var tombolSalin = el('button', { class: 'tombol kecil', type: 'button' }, 'Salin Nomor');
        tombolSalin.addEventListener('click', function () { salinTeks(nomor.replace(/\s/g, ''), tombolSalin); });
        return el('article', { class: 'kartu rekening muncul' },
          el('p', { class: 'bank', text: teks(r.bank) }),
          el('p', { class: 'nomor', text: nomor }),
          el('p', { class: 'atas-nama', text: teks(r.atas_nama) ? 'a.n. ' + teks(r.atas_nama) : '' }),
          tombolSalin);
      }),
      teks(a.alamat) ? el('article', { class: 'kartu rekening muncul' },
        el('p', { class: 'bank', text: 'Kirim Kado' }),
        el('p', { class: 'alamat', text: teks(a.alamat) })) : null);
  }

  function bagianPenutup(d, pasangan) {
    var situs = amanUrl(BRAND.situs) || '../';
    var ref = situs + (situs.indexOf('?') < 0 ? '?' : '&') + 'ref=undangan';
    return el('section', { class: 'bagian penutup' },
      el('p', { class: 'paragraf muncul', text: teks(d.penutup) || 'Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.' }),
      el('p', { class: 'sub muncul', text: 'Kami yang berbahagia' }),
      el('h2', { class: 'nama-script besar muncul', text: pasangan }),
      teks(d.keluarga) ? el('p', { class: 'keluarga muncul', text: teks(d.keluarga) }) : null,
      ornamen(),
      el('footer', { class: 'kaki' }, 'Undangan digital oleh ', el('a', { href: ref, target: '_blank', rel: 'noopener', text: BRAND.nama || 'kami' })));
  }

  function tombolMusik(src) {
    audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'none';
    var t = el('button', { class: 'tombol-musik', type: 'button', 'aria-label': 'Jeda musik', hidden: !sudahDibuka }, '♪');
    t.addEventListener('click', function () {
      if (audio.paused) { audio.play().catch(function () {}); } else audio.pause();
    });
    audio.addEventListener('play', function () { t.classList.add('putar'); t.setAttribute('aria-label', 'Jeda musik'); });
    audio.addEventListener('pause', function () { t.classList.remove('putar'); t.setAttribute('aria-label', 'Putar musik'); });
    return t;
  }

  /* ---------- alur utama ---------- */

  function bukaUndangan() {
    sudahDibuka = true;
    var sampul = document.getElementById('sampul');
    if (sampul) sampul.classList.add('terbuka');
    document.body.classList.remove('terkunci');
    var tm = document.querySelector('.tombol-musik');
    if (tm) tm.hidden = false;
    if (audio && !modePreview) audio.play().catch(function () {});
    var awal = document.getElementById('beranda');
    if (awal) awal.scrollIntoView({ behavior: 'smooth' });
  }

  function aktifkanAnimasi() {
    if (pengamat) pengamat.disconnect();
    var semua = document.querySelectorAll('.muncul');
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      semua.forEach(function (n) { n.classList.add('tampil'); });
      return;
    }
    pengamat = new IntersectionObserver(function (entri) {
      entri.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('tampil'); pengamat.unobserve(e.target); } });
    }, { threshold: 0.12 });
    semua.forEach(function (n) { pengamat.observe(n); });
  }

  function render(d) {
    data = d || {};
    clearInterval(timerHitung);
    if (audio) { audio.pause(); audio = null; }
    var tema = TEMA_VALID.indexOf(data.tema) >= 0 ? data.tema : TEMA_VALID[0];
    document.body.dataset.tema = tema;

    var pria = data.pria || {}, wanita = data.wanita || {};
    var dua = data.urutan === 'wanita' ? [wanita, pria] : [pria, wanita];
    var pasangan = [teks(dua[0].panggilan), teks(dua[1].panggilan)].filter(Boolean).join(' & ') || 'Nama & Nama';
    var acaraUtama = daftar(data.acara)[0];
    var tglUtama = acaraUtama ? fmtTanggal(acaraUtama, { weekday: undefined, day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' . ') : '';

    document.title = 'The Wedding of ' + pasangan;

    var scrollLama = window.scrollY;
    app.textContent = '';
    if (!langsungBuka) app.append(bagianSampul(data, pasangan, tglUtama));
    app.append(el('div', { class: 'isi' },
      bagianPembuka(data, pasangan, acaraUtama),
      bagianKutipan(data),
      bagianMempelai(data),
      bagianAcara(data, pasangan),
      bagianCerita(data),
      bagianGaleri(data),
      bagianRsvp(data),
      bagianAmplop(data),
      bagianPenutup(data, pasangan)));
    var musik = amanUrl(data.musik);
    if (musik) app.append(tombolMusik(musik));

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
      el('a', { class: 'tombol', href: amanUrl(BRAND.situs) || '../' }, 'Ke halaman utama')));
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
