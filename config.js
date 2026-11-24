/*
 * PENGATURAN BRAND — satu-satunya file yang wajib kamu ubah sebelum online.
 * Dipakai oleh landing page (index.html), semua undangan, dan tool admin.
 */
window.BRAND = {
  // Nama kerja. Cek dulu ketersediaan nama, akun IG/TikTok, dan domainnya sebelum dipakai.
  nama: "Ikrar",
  tagline: "Undangan Digital",

  // Nomor WhatsApp penerima pesanan: format 62xxxxxxxxxx, tanpa +, spasi, atau tanda hubung.
  whatsapp: "6281234567890",
  instagram: "", // contoh: "ikrar.undangan" (tanpa @)

  // Alamat situs setelah online, TANPA garis miring di akhir. Contoh: "https://ikrar.my.id"
  // Dipakai untuk membuat link undangan dan preview WhatsApp. Ganti saat pindah ke domain sendiri.
  situs: "https://ivan42118.github.io/ikrar",

  // URL Web App Google Apps Script untuk RSVP & ucapan (lihat rsvp/apps-script.gs).
  // Kosong = mode demo: ucapan hanya tersimpan di browser pengunjung.
  rsvpEndpoint: "",

  pembayaran: "Transfer bank atau QRIS",
  waktuPengerjaan: "1×24 jam",

  // Teks promo opsional di atas daftar harga. Pakai hanya kalau benar kamu jalankan.
  // Contoh: "Harga perkenalan untuk 20 pemesan pertama"
  promo: "",

  paket: [
    {
      id: "basic",
      nama: "Basic",
      harga: 99000,
      catatan: "Aktif 6 bulan",
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
      catatan: "Aktif 1 tahun",
      fitur: [
        "Semua fitur Premium",
        "Galeri tanpa batas",
        "Preview link WhatsApp dengan foto kalian",
        "Pengerjaan prioritas 6 jam",
        "Revisi sepuasnya selama 7 hari"
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
