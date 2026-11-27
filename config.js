/*
 * PENGATURAN BRAND — satu-satunya file yang wajib kamu ubah sebelum online.
 * Dipakai oleh landing page (index.html), semua undangan, dan tool admin.
 */
window.BRAND = {
  // Nama brand. Dipakai di website, pesan WhatsApp, footer undangan, dan video promo.
  nama: "berkenan.id",
  tagline: "Undangan Digital",

  // Nomor WhatsApp penerima pesanan: format 62xxxxxxxxxx, tanpa +, spasi, atau tanda hubung.
  whatsapp: "62895386124189",
  instagram: "berkenan.id", // tanpa @

  // Alamat situs setelah online, TANPA garis miring di akhir. Contoh: "https://berkenan.id"
  // Dipakai untuk membuat link undangan dan preview WhatsApp. Ganti saat pindah ke domain sendiri.
  situs: "https://ivan42118.github.io/berkenan.id",

  // URL Web App Google Apps Script untuk RSVP & ucapan (lihat rsvp/apps-script.gs).
  // Kosong = mode demo: ucapan hanya tersimpan di browser pengunjung.
  rsvpEndpoint: "",

  pembayaran: "Transfer bank atau QRIS",
  waktuPengerjaan: "1×24 jam",

  // Admin yang membalas chat. Tampil di bagian akhir landing page, FAQ, dan footer.
  admin: { nama: "Ivan", peran: "pendiri berkenan.id", jamBalas: "24 jam, setiap hari" },

  // Teks promo opsional di atas daftar harga. Pakai hanya kalau benar kamu jalankan.
  // Contoh: "Harga perkenalan untuk 20 pemesan pertama"
  promo: "",

  // Diskon berbatas waktu. Tampil otomatis di landing page (pita promo + hitung mundur + harga coret)
  // dan BERAKHIR OTOMATIS setelah tanggal "sampai", jadi harga normal kembali tanpa perlu diubah.
  //   aktif  : ubah ke false untuk mematikan lebih awal, misalnya saat kuota sudah penuh
  //   sampai : batas akhir promo (WIB = +07:00)
  //   harga  : harga promo per id paket; paket yang tidak disebut tetap harga normal
  //   kuota  : jumlah pemesan yang dapat harga promo (hanya teks; matikan "aktif" bila sudah penuh)
  diskon: {
    aktif: true,
    nama: "Promo Akhir Tahun",
    persen: 50,
    keterangan: "Spesial pembukaan berkenan.id",
    kuota: 30,
    sampai: "2027-01-01T23:59:59+07:00",
    harga: { basic: 49000, premium: 89000, eksklusif: 149000 }
  },

  // Testimoni & rekam jejak di landing page. Kosong = bagian ini disembunyikan.
  //   jenis : pernikahan | khitan | ulangtahun | acara (untuk ringkasan jumlah acara, tampil TANPA nama)
  //   izin  : ubah ke true HANYA setelah orangnya membaca dan setuju dengan kalimat di "teks".
  //           Selama belum true, nama & kata-katanya tidak tampil; yang tampil hanya ringkasan jumlah acara.
  //   foto / link (opsional): alamat https foto orangnya / undangannya.
  // Urutan di sini = urutan tampil. 6 pertama langsung terlihat, sisanya di balik tombol "Lihat … lainnya".
  // Kata-kata ditulis Ivan atas permintaan masing-masing (mereka menyerahkan kata-katanya).
  // Kirim dulu kalimatnya ke orangnya; setelah mereka oke, ubah izin-nya ke true.
  testimoni: [
    { nama: "Gilang & Michelle", jenis: "pernikahan", acara: "Pernikahan · Desain kustom · Eksklusif", izin: false,
      teks: "Kami cuma kirim ide kasar, lalu dibantu sampai jadi desain yang benar-benar sesuai keinginan kami. Beda dari undangan kebanyakan." },
    { nama: "Zenada Dirga Cahaya", jenis: "ulangtahun", acara: "Ulang tahun · Ceria Pastel · Premium", izin: false,
      teks: "Warnanya ceria dan lucu, pas untuk pesta ulang tahun. Dari konfirmasi kehadiran, kami jadi lebih mudah memperkirakan jumlah tamu." },
    { nama: "Wahyu & Nindi", jenis: "pernikahan", acara: "Pernikahan · Moss Garden · Eksklusif", izin: false,
      teks: "Nuansa hijaunya teduh, cocok dengan konsep acara kami. Video undangannya juga enak dibagikan di Status WhatsApp." },
    { nama: "Khitanan M. Abhar Aljunaid", jenis: "khitan", acara: "Khitanan · Desain kustom · Eksklusif", izin: false,
      teks: "Desainnya dibuat khusus untuk khitanan anak kami. Keluarga yang jauh juga bisa ikut mengirim doa lewat kolom ucapan." },
    { nama: "Rafi & Putri", jenis: "pernikahan", acara: "Pernikahan · Maroon Romance · Premium", izin: false,
      teks: "Foto-foto prewedding kami tampil cantik di galeri. Ucapan dari tamu juga terkumpul rapi, senang sekali membacanya satu per satu." },
    { nama: "Robith & Denada", jenis: "pernikahan", acara: "Pernikahan · Maroon Romance · Basic", izin: false,
      teks: "Paketnya sederhana, tapi tampilannya tetap elegan. Amplop digitalnya juga memudahkan tamu yang berhalangan hadir." },
    { nama: "Alumni SMK Veteran angkatan 2019", jenis: "acara", acara: "Reuni · Desain kustom", izin: false,
      teks: "Undangan reuninya terlihat profesional dan gampang disebar di grup alumni. Panitia jadi mudah merekap siapa saja yang datang." },
    { nama: "Andriyano & Sinta", jenis: "pernikahan", acara: "Pernikahan · Maroon Romance · Eksklusif", izin: false,
      teks: "Setiap permintaan perubahan dari kami dilayani dengan sabar. Hasil akhirnya persis seperti yang kami bayangkan." },
    { nama: "Burhan & Putri", jenis: "pernikahan", acara: "Pernikahan · Maroon Romance · Premium", izin: false,
      teks: "Warna marunnya elegan, pas dengan dekorasi kami. Keluarga juga gampang membukanya, tinggal klik langsung ketemu lokasinya." },
    { nama: "Tommy & Ajeng", jenis: "pernikahan", acara: "Pernikahan · Maroon Romance · Premium", izin: false,
      teks: "Link undangan per nama tamu bikin kirimnya terasa lebih sopan dan personal. Kami tinggal salin, lalu kirim lewat WhatsApp." },
    { nama: "Fikri & Bella", jenis: "pernikahan", acara: "Pernikahan · Maroon Romance · Premium", izin: false,
      teks: "Prosesnya cepat dan komunikasinya enak. Cocok untuk kami yang persiapannya serba mepet." },
    { nama: "Raka & Sesil", jenis: "pernikahan", acara: "Pernikahan · Maroon Romance · Premium", izin: false,
      teks: "Susunan acara dan dress code tertulis jelas di undangan, jadi tamu tidak bingung. Musiknya juga bikin suasananya makin hangat." }
  ],

  // Pengaturan demo per paket (undangan/?u=demo-…&paket=…):
  //   demoTanpa     : fitur yang tidak termasuk paket ini (galeri, cerita, rundown, dresscode, rsvp, kontak,
  //                   video, siaran, checkin, terimakasih)
  //   demoGaleri    : keterangan jumlah foto galeri, tampil di label bagian galeri
  //   demoTambahan  : keunggulan tambahan paket ini, tampil di bilah "Contoh paket"
  //   demoPreviewWa : true = tampilkan contoh preview link WhatsApp berfoto di demo
  //   demoVideoUndangan / demoTerimaKasih : true = tampilkan contoh video undangan & tombol versi setelah acara
  paket: [
    {
      id: "basic",
      nama: "Basic",
      harga: 99000,
      catatan: "Aktif 6 bulan",
      demoTanpa: ["galeri", "cerita", "rundown", "dresscode", "rsvp", "video", "siaran", "checkin", "terimakasih"],
      fitur: [
        "Bebas pilih semua tema",
        "Nama tamu personal, tanpa batas",
        "Hitung mundur & lokasi Google Maps",
        "Simpan ke kalender tamu",
        "Amplop digital (rekening / e-wallet)",
        "Musik latar",
        "5× revisi"
      ]
    },
    {
      id: "premium",
      nama: "Premium",
      harga: 179000,
      unggulan: true,
      catatan: "Aktif 1 tahun",
      demoTanpa: ["video", "siaran", "checkin", "terimakasih"],
      demoGaleri: "hingga 12 foto",
      fitur: [
        "Semua fitur Basic",
        "Galeri hingga 12 foto",
        "Kisah / cerita, rundown & dress code",
        "RSVP & ucapan tamu + rekap kehadiran",
        "Generator link tamu untuk sebar via WA",
        "10× revisi"
      ]
    },
    {
      id: "eksklusif",
      nama: "Eksklusif",
      harga: 299000,
      catatan: "Aktif tanpa batas waktu",
      demoTanpa: [],
      demoGaleri: "tanpa batas",
      demoTambahan: ["Desain kustom", "QR check-in", "Video undangan", "Video prewedding", "Live streaming", "Halaman terima kasih", "Aktif selamanya"],
      demoPreviewWa: true,
      demoVideoUndangan: true,
      demoTerimaKasih: true,
      fitur: [
        "Semua fitur Premium",
        "Desain kustom sesuai konsep acara",
        "QR check-in, buku tamu digital & layar sambutan",
        "Video undangan 15 detik untuk Status & Story",
        "Video prewedding & live streaming",
        "Halaman terima kasih setelah acara",
        "Galeri tanpa batas & preview link WA berfoto",
        "Pengerjaan prioritas 6 jam",
        "Revisi tanpa batas"
      ]
    }
  ],

  // Daftar tema di katalog. Tambah tema baru: buat CSS-nya di undangan/undangan.css,
  // buat data demo di undangan/data/, lalu tambahkan satu baris di sini.
  // kategori: pernikahan | khitan | ulangtahun | acara (dipakai filter katalog di landing page).
  // Semua tema bisa dipakai untuk jenis undangan apa pun; kategori hanya menentukan demo yang ditampilkan.
  tema: [
    { id: "maroon", nama: "Maroon Romance", kategori: "pernikahan", deskripsi: "Merah marun hangat, bunga mawar, dan kilau emas.", demo: "demo-maroon" },
    { id: "moss", nama: "Moss Garden", kategori: "pernikahan", deskripsi: "Hijau lumut yang teduh, nuansa pesta taman.", demo: "demo-moss" },
    { id: "vintage", nama: "Vintage Paper", kategori: "pernikahan", deskripsi: "Kertas krem bertekstur, foto bernuansa sepia.", demo: "demo-vintage" },
    { id: "gold", nama: "Noir Gold", kategori: "pernikahan", deskripsi: "Hitam elegan dengan aksen emas, glamor dan mewah.", demo: "demo-gold" },
    { id: "islami", nama: "Islami Zamrud", kategori: "khitan", deskripsi: "Hijau zamrud dan emas dengan ornamen bintang geometris.", demo: "demo-khitan" },
    { id: "ceria", nama: "Ceria Pastel", kategori: "ulangtahun", deskripsi: "Balon, konfeti, dan warna pastel yang riang.", demo: "demo-ultah" },
    { id: "modern", nama: "Modern Navy", kategori: "acara", deskripsi: "Bersih dan profesional untuk reuni, seminar, dan grand opening.", demo: "demo-acara" }
  ]
};
