# Panduan Bisnis Undangan Digital

Isi folder ini adalah situs jualan undangan digital (pernikahan, khitan, ulang tahun, dan acara umum) yang siap online. Isinya landing page, mesin undangan dengan 3 tema, tool admin untuk membuat undangan dalam ±10 menit, dan backend RSVP gratis lewat Google Sheets. Tidak butuh database, server, atau biaya bulanan.

## Isi folder

| Path | Fungsi |
|---|---|
| `config.js` | **Satu-satunya file yang wajib diubah**: nama brand, nomor WA, harga, daftar tema |
| `index.html`, `assets/` | Landing page untuk jualan |
| `undangan/` | Mesin undangan. Data tiap pelanggan ada di `undangan/data/<slug>.json` |
| `admin/buat-undangan.html` | Form pembuat undangan + pratinjau langsung + tombol unduh |
| `admin/link-tamu.html` | Generator link bernama untuk setiap tamu + tombol kirim WA |
| `rsvp/apps-script.gs` | Backend RSVP & ucapan (Google Sheets), gratis |
| `robots.txt` | Mencegah undangan pelanggan muncul di Google |

## Jenis undangan & tema

Satu mesin bisa membuat empat jenis undangan. Pilih di kolom **Jenis undangan** pada `admin/buat-undangan.html`. Teks, susunan bagian, dan judul otomatis menyesuaikan.

| Jenis | Isian khusus | Demo |
|---|---|---|
| Pernikahan | Mempelai pria & wanita | `demo-maroon`, `demo-moss`, `demo-vintage`, `demo-gold` |
| Khitan / aqiqah | Profil anak, nama orang tua | `demo-khitan` (tema Islami) |
| Ulang tahun | Profil, usia ("ke-…") | `demo-ultah` (tema Ceria) |
| Acara umum | Nama acara, penyelenggara, deskripsi | `demo-acara` (tema Modern) |

Bagian opsional untuk semua jenis: **rundown** (susunan acara), **dress code** beserta contoh warna, **kontak panitia**, teks **Arab** (misalnya bismillah), galeri, cerita, RSVP, dan amplop/kado/iuran. Bagian yang kosong otomatis disembunyikan.

Ada 7 tema (Maroon, Moss, Vintage, Noir Gold, Islami, Ceria, Modern). **Tema dan jenis bisa dicampur bebas**, misalnya ulang tahun ke-17 dengan Noir Gold, atau aqiqah dengan Ceria.

Harga paket saat ini sama untuk semua jenis. Pasar biasanya menerima harga lebih rendah untuk ulang tahun anak, jadi pertimbangkan paket khusus, misalnya mulai Rp 59–79 ribu. Atur di `config.js`.

## 1. Jalankan di komputer

```powershell
cd E:\website\undangan-digital
python -m http.server 5500
```

Buka `http://localhost:5500`. Jangan buka file dengan klik ganda (`file://`), karena undangan memuat data lewat server.

## 2. Sebelum online (wajib)

1. **Tentukan nama brand.** "Ikrar" hanya nama kerja. Cek dulu nama yang kamu pilih belum dipakai di Instagram, TikTok, dan domain.
2. Ubah `config.js`: `nama`, `whatsapp` (format `62812…`), `instagram`, lalu `situs` setelah domain aktif.
3. Ganti kata "Ikrar" di `<title>` dan meta deskripsi pada `index.html`.
4. **Foto demo.** Keempat demo (Maroon, Moss, Vintage, Noir Gold) memakai foto dari Pexels, yang gratis untuk penggunaan komersial, dan dimuat langsung dari server Pexels. Supaya demo tidak pernah rusak kalau link Pexels berubah, simpan salinannya di `undangan/foto/demo/` lalu ganti URL-nya di file `undangan/data/demo-*.json`. Begitu ada pelanggan yang mengizinkan, ganti dengan foto asli mereka.

## 3. Online gratis

**Cara termudah: Cloudflare Pages.** Gratis, cepat di Indonesia, dan mendukung domain sendiri.
1. Buat akun di dash.cloudflare.com → Workers & Pages → Create → Pages → *Upload assets*.
2. Upload isi folder `undangan-digital`. Folder `admin/` perlu ikut kalau generator link tamu mau dipakai pelanggan. Tool ini tidak menyimpan rahasia apa pun.
3. Pasang domain. `.my.id` sekitar Rp 15–30 ribu/tahun, `.com` sekitar Rp 150–200 ribu/tahun.

Lebih praktis jangka panjang: simpan folder ini di GitHub, lalu hubungkan ke Cloudflare Pages. Setiap kali kamu menambah undangan dan *push*, situs ter-update otomatis.

## 4. Pasang RSVP (sekali saja)

Ikuti petunjuk di bagian atas `rsvp/apps-script.gs` (±5 menit), lalu tempel URL `/exec` ke `rsvpEndpoint` di `config.js`. Semua undangan memakai satu sheet. Untuk rekap per pasangan, jalankan fungsi `rekap()` di Apps Script.

Selama `rsvpEndpoint` masih kosong, RSVP berjalan dalam mode demo: ucapan hanya tersimpan di HP tamu yang mengisinya.

## 5. Alur melayani satu pesanan (±10–30 menit)

1. Pelanggan chat WA dari landing page. Kirim daftar data yang dibutuhkan: nama panggilan & lengkap, orang tua, jadwal & lokasi acara (link Google Maps), foto, rekening (opsional), dan lagu.
2. Buka `admin/buat-undangan.html` → pilih "Muat contoh…" sesuai tema → ganti datanya. Isi **Aktif sampai** sesuai paket (6 bulan / 1 tahun).
3. Foto: kecilkan dulu (misalnya lewat squoosh.app, lebar ±1200px), simpan di `undangan/foto/<slug>/`, lalu tulis path-nya di form.
   - **Foto sampul** + 2 foto galeri pertama otomatis jadi slideshow di halaman pembuka. Foto galeri ke-3 dan ke-4 jadi latar hitung mundur dan penutup. Jadi taruh foto terbaik di urutan awal.
   - **Fokus & zoom foto mempelai:** kalau wajah terpotong di bingkai lengkung, isi misalnya `60% 30% 1.8`. Artinya titik fokus 60% dari kiri dan 30% dari atas, diperbesar 1,8×. Ini berguna untuk memotong satu orang dari foto berdua.
   - Mempelai tanpa foto otomatis memakai bingkai monogram (inisial nama). Ini bisa jadi pilihan paket yang lebih murah.
4. Klik **Unduh data (.json)** → simpan ke `undangan/data/`.
   Klik **Unduh link pendek (index.html)** → buat folder `<slug>/` di root situs, lalu simpan di situ.
5. Upload / push. Kirim link draf ke pelanggan: `https://domainmu/<slug>/?to=Nama+Tamu`.
6. Setelah disetujui dan dibayar: kirim `admin/link-tamu.html?u=<slug>` (atau buatkan daftarnya) supaya mereka bisa sebar ke semua tamu.

**Setelah mengubah file CSS/JS** (bukan JSON undangan), naikkan nomor versi `?v=…` di `index.html`, `undangan/index.html`, `admin/*.html`, serta `VERSI` di `assets/landing.js`. Ini supaya HP pengunjung tidak memakai file lama dari cache dan tampilannya tidak berantakan.

Revisi cukup edit JSON-nya. Link tidak berubah, jadi tamu yang sudah menerima langsung melihat versi terbaru.

## 6. Rencana 30 hari pertama: 10 pelanggan

Membangun situs adalah bagian mudahnya. Uangnya datang dari distribusi. Lakukan semua ini sejak minggu pertama:

- **Lingkaran sendiri (minggu 1).** Tawarkan ke teman, keluarga, dan grup WA alumni yang akan menikah. Beri harga teman dengan syarat: testimoni + izin dipakai sebagai portofolio. 3 pelanggan pertama paling penting.
- **Konten pendek setiap hari.** Rekam layar HP saat undangan dibuka (sampul → musik → hitung mundur), lalu unggah ke TikTok, Reels, dan Shorts. Satu video per hari, beda tema atau beda fitur.
- **Marketplace.** Buka toko di Shopee/Tokopedia dengan produk "undangan digital". Pembelinya memang sudah mencari di sana.
- **Kerja sama vendor.** Tawari WO, MUA, fotografer, dan pengelola gedung komisi 15–20% per pesanan yang mereka bawa.
- **Iklan gratis di setiap undangan.** Footer "Undangan digital oleh …" dilihat ratusan tamu per acara. Banyak di antara mereka akan menikah juga.
- **Iklan berbayar baru setelah ada penjualan organik.** Mulai dari Rp 50 ribu/hari di Meta atau TikTok, dan lanjutkan hanya kalau biaya per pesanan masih di bawah margin.

## 7. Hitungan kasar

| Pesanan / bulan | Rata-rata Rp 150 ribu | Catatan |
|---|---|---|
| 10 | Rp 1,5 juta | Realistis di bulan pertama kalau rajin promosi |
| 30 | Rp 4,5 juta | Butuh konten rutin + 1–2 vendor partner |
| 60 | Rp 9 juta | Saatnya otomatisasi (lihat langkah berikutnya) |

Biaya tetap hampir nol: domain + kuota internet. Sumber daya utamanya waktumu.

## 8. Hal yang perlu dijaga

- **Musik.** Lagu komersial di undangan berbayar berisiko masalah hak cipta. Pakai musik bebas royalti yang lisensinya jelas, atau lagu yang dipilih dan disediakan pelanggan sendiri.
- **Data pribadi.** Data RSVP hanya untuk pasangan yang bersangkutan, jangan disebar. Hapus data dan foto setelah masa aktif habis.
- **"Lihat draf dulu, baru bayar."** Janji ini membangun kepercayaan saat belum ada testimoni. Kalau ada yang tidak membayar, ubah menjadi DP 50% di landing page dan FAQ.
- **Testimoni.** Pakai hanya testimoni asli, dengan izin pelanggan.

## 9. Langkah berikutnya (setelah ±30 pesanan/bulan)

1. **Self-service.** Pelanggan mengisi form sendiri (form admin ini sudah jadi pondasinya) dan bayar otomatis lewat Midtrans, Xendit, atau Tripay. Butuh backend kecil, misalnya Supabase. Di titik ini produkmu berubah jadi SaaS.
2. **Tema baru.** Salin satu blok `body[data-tema="..."]` di `undangan/undangan.css` dan ganti warnanya (termasuk warna bunga `--b1a`…`--da`). Tambahkan font-nya di `FONT` dalam `undangan/undangan.js`, buat data demo, lalu tambahkan satu baris di `config.js`. Tema adat (Jawa, Sunda, Minang) biasanya laris.
3. **Jasa landing page.** Portofolio ini sekaligus bisa dipakai untuk menjual jasa website ke UMKM.
