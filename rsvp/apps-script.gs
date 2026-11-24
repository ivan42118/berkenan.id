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
 */

var NAMA_SHEET = 'RSVP';
var KEHADIRAN = ['hadir', 'tidak', 'ragu'];

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
