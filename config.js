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

  // Testimoni di landing page. Kosong = bagian testimoni disembunyikan.
  // Pakai hanya testimoni asli, dengan kata-kata dan izin orangnya. Contoh:
  //   { nama: "Rina & Dimas", acara: "Pernikahan · Bandung, 2025", teks: "Tamu kami banyak yang memuji…", link: "" }
  testimoni: [],

  // Pengaturan demo per paket (undangan/?u=demo-…&paket=…):
  //   demoTanpa     : fitur yang tidak termasuk paket ini (galeri, cerita, rundown, dresscode, rsvp, kontak,
  //                   video, checkin, terimakasih)
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
      demoTanpa: ["galeri", "cerita", "rundown", "dresscode", "rsvp", "video", "checkin", "terimakasih"],
      fitur: [
        "Bebas pilih semua tema",
        "Nama tamu personal, tanpa batas",
        "Hitung mundur & lokasi Google Maps",
        "Simpan ke kalender tamu",
        "Amplop digital (rekening / e-wallet)",
        "Musik latar",
        "1× revisi"
      ]
    },
    {
      id: "premium",
      nama: "Premium",
      harga: 179000,
      unggulan: true,
      catatan: "Aktif 1 tahun",
      demoTanpa: ["video", "checkin", "terimakasih"],
      demoGaleri: "hingga 12 foto",
      fitur: [
        "Semua fitur Basic",
        "Galeri hingga 12 foto",
        "Kisah / cerita, rundown & dress code",
        "RSVP & ucapan tamu + rekap kehadiran",
        "Generator link tamu untuk sebar via WA",
        "3× revisi"
      ]
    },
    {
      id: "eksklusif",
      nama: "Eksklusif",
      harga: 299000,
      catatan: "Aktif tanpa batas waktu",
      demoTanpa: [],
      demoGaleri: "tanpa batas",
      demoTambahan: ["Desain kustom", "QR check-in", "Video undangan", "Video prewedding", "Halaman terima kasih", "Aktif selamanya"],
      demoPreviewWa: true,
      demoVideoUndangan: true,
      demoTerimaKasih: true,
      fitur: [
        "Semua fitur Premium",
        "Desain kustom sesuai konsep acara (2× revisi desain)",
        "QR check-in, buku tamu digital & layar sambutan",
        "Video undangan 15 detik untuk Status & Story",
        "Video prewedding & live streaming",
        "Halaman terima kasih setelah acara",
        "Galeri tanpa batas & preview link WA berfoto",
        "Pengerjaan prioritas 6 jam, revisi sepuasnya 7 hari"
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
