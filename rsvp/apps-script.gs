/**
 * BACKEND RSVP & UCAPAN GRATIS — Google Sheets + Apps Script
 *
 * Cara pasang (sekali saja, untuk semua undangan):
 *  1. Buat Google Sheet baru, misalnya "RSVP Undangan".
 *  2. Menu Ekstensi → Apps Script. Hapus isi default, tempel seluruh file ini, lalu simpan.
 *  3. Klik Terapkan (Deploy) → Deployment baru → jenis "Aplikasi web".
 *       Jalankan sebagai: Saya
 *       Yang memiliki akses: Siapa saja
 *  4. Izinkan akses, lalu salin URL yang berakhiran /exec.
 *  5. Tempel URL itu ke `rsvpEndpoint` di config.js.
 *
 * Semua undangan masuk ke satu sheet "RSVP", dibedakan lewat kolom "Undangan" (slug).
 * Yang ditampilkan ke publik hanya nama, ucapan, dan status hadir. Jumlah tamu tetap privat.
 * Setiap kali mengubah kode ini, buat versi deployment baru (Kelola deployment → Edit → Versi baru).
 *
 * QR CHECK-IN: halaman penerima tamu (checkin/?u=<slug>) memakai endpoint yang sama. Kehadiran masuk
 * ke sheet "Kehadiran" (satu baris per tamu, scan ganda tidak dicatat dua kali).
 */

var NAMA_SHEET = 'RSVP';
var KEHADIRAN = ['hadir', 'tidak', 'ragu'];
var SHEET_HADIR = 'Kehadiran';

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(NAMA_SHEET);
  if (!sh) {
    sh = ss.insertSheet(NAMA_SHEET);
    sh.appendRow(['Waktu', 'Undangan', 'Nama', 'Kehadiran', 'Jumlah', 'Ucapan']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function bersih_(s, maks) {
  return String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maks);
}

// Cegah "formula injection": teks yang diawali = + - @ dianggap teks biasa oleh Sheets.
function amanSel_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var kunci = LockService.getScriptLock();
  try {
    kunci.waitLock(10000);
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.aksi === 'checkin') return checkin_(d);
    var slug = bersih_(d.slug, 60).toLowerCase();
    var nama = bersih_(d.nama, 80);
    if (!/^[a-z0-9-]+$/.test(slug) || !nama) return json_({ ok: false });
    var hadir = KEHADIRAN.indexOf(d.kehadiran) >= 0 ? d.kehadiran : 'ragu';
    var jumlah = hadir === 'hadir' ? Math.max(1, Math.min(10, parseInt(d.jumlah, 10) || 1)) : 0;
    var ucapan = bersih_(d.ucapan, 500);
    sheet_().appendRow([new Date(), slug, amanSel_(nama), hadir, jumlah, amanSel_(ucapan)]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false });
  } finally {
    kunci.releaseLock();
  }
}

function doGet(e) {
  var slug = bersih_(e && e.parameter && e.parameter.u, 60).toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) return json_([]);
  if (e.parameter.aksi === 'kehadiran') return kehadiran_(slug);
  var baris = sheet_().getDataRange().getValues().slice(1);
  var hasil = baris
    .filter(function (r) { return r[1] === slug && String(r[5]).trim(); })
    .slice(-100)
    .reverse()
    .map(function (r) { return { nama: String(r[2]), ucapan: String(r[5]), kehadiran: r[3] }; });
  return json_(hasil);
}

/**
 * Rekap untuk dikirim ke pasangan: jalankan fungsi ini dari editor (pilih rekap → Jalankan)
 * setelah mengganti SLUG. Hasilnya dibuat sebagai sheet baru "Rekap <slug>".
 */
function rekap() {
  var SLUG = 'raka-nadia';
  var baris = sheet_().getDataRange().getValues().slice(1).filter(function (r) { return r[1] === SLUG; });
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nama = 'Rekap ' + SLUG;
  var lama = ss.getSheetByName(nama);
  if (lama) ss.deleteSheet(lama);
  var sh = ss.insertSheet(nama);
  var hadir = baris.filter(function (r) { return r[3] === 'hadir'; });
  var total = hadir.reduce(function (n, r) { return n + (Number(r[4]) || 0); }, 0);
  sh.appendRow(['Total konfirmasi', baris.length]);
  sh.appendRow(['Hadir (orang)', total]);
  sh.appendRow(['Tidak hadir', baris.filter(function (r) { return r[3] === 'tidak'; }).length]);
  sh.appendRow(['Masih ragu', baris.filter(function (r) { return r[3] === 'ragu'; }).length]);
  sh.appendRow([]);
  sh.appendRow(['Waktu', 'Nama', 'Kehadiran', 'Jumlah', 'Ucapan']);
  baris.forEach(function (r) { sh.appendRow([r[0], amanSel_(String(r[2])), r[3], r[4], amanSel_(String(r[5]))]); });
}

/* ---------- QR check-in ---------- */

function sheetHadir_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_HADIR);
  if (!sh) {
    sh = ss.insertSheet(SHEET_HADIR);
    sh.appendRow(['Waktu tercatat', 'Undangan', 'Kode', 'Nama', 'Cara', 'Jam di HP penerima']);
    sh.setFrozenRows(1);
  }
  return sh;
}

// Dipanggil dari doPost (sudah di dalam kunci). Satu kode tamu hanya dicatat sekali per undangan.
function checkin_(d) {
  var slug = bersih_(d.slug, 60).toLowerCase();
  var kode = bersih_(d.kode, 6).toUpperCase();
  var nama = bersih_(d.nama, 80);
  if (!/^[a-z0-9-]+$/.test(slug) || !/^[A-Z0-9]{6}$/.test(kode) || !nama) return json_({ ok: false });
  var sh = sheetHadir_();
  var ada = sh.getDataRange().getValues().slice(1).some(function (r) { return r[1] === slug && r[2] === kode; });
  if (ada) return json_({ ok: true, sudah: true });
  var cara = d.cara === 'manual' ? 'manual' : 'QR';
  var jamHp = Number(d.waktu) ? new Date(Number(d.waktu)) : '';
  sh.appendRow([new Date(), slug, kode, amanSel_(nama), cara, jamHp]);
  return json_({ ok: true });
}

// Daftar kehadiran untuk sinkron antar-HP penerima tamu.
function kehadiran_(slug) {
  var baris = sheetHadir_().getDataRange().getValues().slice(1).filter(function (r) { return r[1] === slug; });
  return json_(baris.map(function (r) {
    var t = r[5] instanceof Date ? r[5] : r[0];
    return { kode: String(r[2]), nama: String(r[3]).replace(/^'/, ''), waktu: t instanceof Date ? t.toISOString() : '' };
  }));
}
