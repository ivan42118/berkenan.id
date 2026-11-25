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
| `promo/` | Sumber video promo 9:16 + skrip render ke MP4 (lihat "Video promo" di bagian 6) |
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

**Contoh per paket.** Semua tema bisa dipakai di paket mana pun; yang membedakan paket adalah fiturnya. Setiap demo bisa dibuka sebagai paket tertentu lewat `?paket=basic|premium|eksklusif`, misalnya `undangan/?u=demo-maroon&paket=basic`. Di halaman demo muncul bilah "Contoh paket" untuk beralih paket, dan bagian yang tidak termasuk paket itu disembunyikan. Di mode Basic, bagian yang tidak termasuk diganti kartu bergembok "Tersedia mulai paket Premium" (dengan tombol untuk langsung melihatnya di Premium). Di Premium dan Eksklusif, bagian berbayar diberi label paketnya, dan Eksklusif menampilkan contoh preview link WhatsApp berfoto. Semuanya diatur di `config.js`: `demoTanpa` (bagian yang disembunyikan), `demoGaleri` (keterangan jumlah foto), `demoTambahan` (keunggulan tambahan di bilah atas), dan `demoPreviewWa`. Bilah ini hanya muncul di undangan demo (slug `demo-…`), tidak pernah di undangan pelanggan.

Harga paket saat ini sama untuk semua jenis. Pasar biasanya menerima harga lebih rendah untuk ulang tahun anak, jadi pertimbangkan paket khusus, misalnya mulai Rp 59–79 ribu. Atur di `config.js`.

## 1. Jalankan di komputer

```powershell
cd E:\website\undangan-digital
python -m http.server 5500
```

Buka `http://localhost:5500`. Jangan buka file dengan klik ganda (`file://`), karena undangan memuat data lewat server.

## 2. Sebelum online (wajib)

1. **Nama brand: berkenan.id** (handle Instagram @berkenan.id). Amankan domain `berkenan.id` dan daftarkan mereknya di DJKI setelah usaha berjalan.
2. Cek `config.js`: `nama`, `whatsapp` (format `62812…`), `instagram`, lalu ganti `situs` setelah domain aktif.
3. Setelah pindah domain, ganti juga alamat `og:image` di `index.html` (gambar pratinjau saat link dibagikan di WhatsApp).
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
   - **Fokus foto sampul:** kalau orang di foto sampul tidak di tengah (sering terjadi pada foto potret), isi kolom "Fokus foto sampul" dengan letak wajah di foto, misalnya `40% 35%` (40% dari kiri, 35% dari atas). Foto otomatis digeser, dan bila perlu sedikit diperbesar, supaya wajah tepat di tengah layar HP mana pun. Untuk foto galeri, tulis `{"src": "…", "fokus": "40% 35%"}` di JSON.
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

### Paket Eksklusif: cara mengerjakan tiap fitur

| Fitur | Cara | Waktu per pesanan |
|---|---|---|
| Desain kustom | Ubah warna, font, dan ornamen tema sesuai konsep acara (misalnya nuansa adat). Batasi 2× revisi desain; desain dari nol jadikan add-on terpisah. | 1–3 jam |
| QR check-in & layar sambutan | Centang "Aktifkan QR check-in" di admin, lalu kirim link penerima tamu (bagian 4 generator link tamu). | 5 menit |
| Video undangan 15 detik | `node promo/render.mjs --halaman="promo/video-undangan.html?u=<slug>" --keluaran=promo/hasil/video-<slug>.mp4` lalu kirim MP4-nya (lihat "Video promo" untuk syarat ffmpeg). | ±3 menit |
| Video prewedding & live streaming | Isi kolom "Video prewedding" (link YouTube atau .mp4) dan "Link siaran langsung". | 2 menit |
| Halaman terima kasih | Centang "Halaman terima kasih", isi pesan & foto hari H setelah acara. Aktif otomatis sehari setelah acara terakhir. Lihat lebih awal dengan menambahkan `&selesai=1` di link. | 10 menit |
| Aktif tanpa batas | Kosongkan "Aktif sampai". | – |

Di demo, semua fitur ini bisa dilihat lewat `?paket=eksklusif` (termasuk tombol "Lihat versi setelah acara").

### QR check-in tamu (uji coba)

Tamu menunjukkan QR di undangannya; penerima tamu memindainya dengan HP biasa lewat browser, tanpa aplikasi.

1. **Aktifkan di undangan:** centang "Aktifkan QR check-in tamu" di `admin/buat-undangan.html` (tersimpan sebagai `"checkin": true`). Di undangan muncul bagian "QR Check-in" berisi QR sesuai nama tamu di link. Link tamu lama dari generator tetap bisa dipakai karena kode QR dihitung dari nama.
2. **Halaman penerima tamu:** `checkin/?u=<slug>` (linknya juga ada di bagian 4 `admin/link-tamu.html`). Tekan "Mulai scan", izinkan kamera, lalu arahkan ke QR tamu. Hasilnya: hijau (tercatat), oranye (sudah check-in), merah (QR bukan untuk acara ini atau tidak valid). Tamu tanpa QR dicatat lewat "Tambah manual".
3. **Layar sambutan:** tombol "Layar sambutan" mengubah layar menjadi sambutan besar "Selamat datang, …" setiap ada tamu yang di-scan. Cocok untuk laptop atau TV di pintu masuk.
4. **Data:** tanpa `rsvpEndpoint`, kehadiran hanya tersimpan di HP penerima tamu itu (mode uji). Setelah Apps Script dipasang (bagian 4), kehadiran juga masuk ke sheet "Kehadiran" dan disinkronkan antar-HP. Daftar hadir bisa diunduh sebagai CSV.

Uji coba tanpa backend: buka undangan demo dengan `&checkin=1`, misalnya `undangan/?u=demo-maroon&to=Bapak+Andi&checkin=1`, lalu scan QR-nya dari HP lain yang membuka `checkin/?u=demo-maroon`.

Catatan: pustaka pembuat dan pembaca QR dimuat dari jsDelivr (qrcode-generator 1.4.4 dan jsQR 1.4.0). Android Chrome memakai pembaca QR bawaan; iPhone memakai jsQR.

### Logo

Semua file logo ada di `assets/logo/`:

| File | Untuk |
|---|---|
| `foto-profil.png` | Foto profil Instagram, TikTok, dan WhatsApp Business (1080×1080) |
| `logo-mendatar-terang.png` / `-gelap.png` | Logo lengkap (ikon + "berkenan"), latar transparan, untuk latar terang / gelap |
| `ikon-terang-512.png` / `ikon-gelap-512.png` | Ikon amplop saja, latar transparan |
| `og.png` | Gambar pratinjau saat link situs dibagikan |
| `favicon-*.png`, `apple-touch-icon.png` | Ikon tab browser dan ikon di layar HP |

Sumber vektornya `assets/logo/logo.js`. Untuk mengekspor ulang (misalnya setelah mengubah warna), buka `assets/logo/sumber.html?a=ikon&t=terang&s=512` di Chrome. Parameter lain: `a=datar`, `a=profil`, `a=og`, `t=gelap`. Huruf memakai font Cormorant Garamond dan Jost (gratis untuk komersial). Untuk keperluan cetak (spanduk, stiker), minta versi vektor dengan huruf yang sudah diubah menjadi garis.

### Video promo

`promo/video.html` adalah video promo 31 detik (1080×1920, untuk Reels, TikTok, Shorts, dan Status WA) yang memakai undangan demo asli. Nama brand, harga termurah, waktu pengerjaan, nomor WA, alamat situs, dan jumlah tema diambil dari `config.js`. Jadi setelah mengganti nama brand atau harga, cukup render ulang.

- **Pratinjau:** jalankan server (bagian 1), lalu buka `http://localhost:5500/promo/video.html`. Muat ulang halaman untuk memutar lagi.
- **Render ke MP4** (butuh Node 22+, Chrome, dan ffmpeg; hasilnya di `promo/hasil/`, yang tidak ikut ter-upload ke GitHub):

```powershell
pip install imageio-ffmpeg
$env:FFMPEG = python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"
node promo/render.mjs
```

- **Musik:** videonya sengaja tanpa suara. Tambahkan lagu dari pustaka musik TikTok/Instagram saat mengunggah, karena lagu di sana sudah berlisensi untuk platform tersebut. Jangan menempelkan lagu komersial sendiri.
- **Saat posting:** taruh link situs di bio, dan tulis caption yang mengajak chat, misalnya "Mau undangan seperti ini? Chat WA di bio, draf gratis dulu sebelum bayar."

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
