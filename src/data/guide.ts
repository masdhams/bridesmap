// Teks halaman Panduan dan bantuan kontekstual. Ubah isinya di sini, bukan di JSX.

export interface GuideStep {
  /** Dipakai juga oleh kartu "Mulai di sini" di Beranda untuk menentukan langkah mana yang sudah selesai. */
  id: 'tanggal-budget' | 'alokasi' | 'vendor' | 'pasangan' | 'tamu' | 'kalender'
  title: string
  body: string
  to: string
  cta: string
}

export interface GuideFaq {
  id: string
  q: string
  a: string
}

export const GUIDE_INTRO = 'Panduan singkat memakai Bridesmap: mulai dari langkah pertama sampai pertanyaan yang paling sering muncul.'

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'tanggal-budget',
    title: 'Atur hari-H dan total budget',
    body: 'Isi tanggal pernikahan dan total budget. Jadwal checklist dan alokasi budget menyesuaikan dari dua angka ini.',
    to: '/app/pengaturan',
    cta: 'Buka Pengaturan',
  },
  {
    id: 'alokasi',
    title: 'Atur alokasi per acara',
    body: 'Bagi total budget ke tiap acara (lamaran, akad, resepsi), lalu ke kategorinya. Bisa dalam persen atau Rupiah.',
    to: '/app/budget/alokasi',
    cta: 'Atur alokasi',
  },
  {
    id: 'vendor',
    title: 'Tambah vendor',
    body: 'Catat kandidat vendor dan harga penawarannya. Setelah sepakat, ubah ke Booked dan atur jadwal DP sampai pelunasan.',
    to: '/app/vendor',
    cta: 'Tambah vendor',
  },
  {
    id: 'pasangan',
    title: 'Undang pasangan',
    body: 'Kirim tautan undangan lewat WhatsApp supaya kalian bisa mengisi rencana yang sama.',
    to: '/app/pengaturan',
    cta: 'Undang pasangan',
  },
  {
    id: 'tamu',
    title: 'Isi daftar tamu',
    body: 'Tambah tamu satu per satu, atau impor dari file CSV/Excel dan kontak HP. Status RSVP dan porsi katering terhitung otomatis.',
    to: '/app/tamu',
    cta: 'Buka daftar tamu',
  },
  {
    id: 'kalender',
    title: 'Hubungkan Google Calendar',
    body: 'Kirim tugas yang belum selesai sebagai pengingat ke kalender khusus bernama "Bridesmap". Hanya judul tugas dan tanggalnya yang dikirim.',
    to: '/app/pengaturan',
    cta: 'Hubungkan kalender',
  },
]

export const GUIDE_FAQ: GuideFaq[] = [
  {
    id: 'pembayaran',
    q: 'Bagaimana cara kerja pembayaran?',
    a: 'Bridesmap gratis dipakai, jadi tidak ada pembayaran ke kami. Pembayaran ke vendor tetap kalian lakukan langsung, misalnya lewat transfer. Aplikasi membantu mencatat jadwal DP, termin, dan pelunasan, menyimpan bukti transfer, dan mengingatkan sebelum jatuh tempo.',
  },
  {
    id: 'refund',
    q: 'Bagaimana kebijakan refund?',
    a: 'Karena tidak ada pembayaran ke Bridesmap, tidak ada refund dari kami. Pengembalian DP ke vendor mengikuti kontrak kalian dengan vendor tersebut. Simpan kontrak dan bukti transfernya di halaman vendor supaya mudah dicari saat dibutuhkan.',
  },
  {
    id: 'akun',
    q: 'Bagaimana cara daftar dan masuk?',
    a: 'Buka halaman Masuk, pilih Daftar, lalu isi email dan kata sandi (minimal 6 karakter). Buka link konfirmasi yang dikirim ke email kamu, lalu masuk dengan email dan kata sandi yang sama. Untuk keluar, pilih Keluar di bagian Akun pada Pengaturan. Fitur lupa kata sandi belum tersedia.',
  },
  {
    id: 'data',
    q: 'Di mana data kami disimpan?',
    a: 'Rencana, tamu, vendor, dan foto disimpan di akun kalian, jadi bisa dibuka lagi saat masuk dari perangkat lain. Salinan di browser juga tersimpan sebagai cadangan, dengan kapasitas sekitar 5 MB. Makin banyak foto, makin besar datanya, jadi ekspor secara berkala tetap dianjurkan. Kalau Google Calendar terhubung, sambungannya disimpan terenkripsi di server, dan yang dikirim ke Google hanya judul tugas serta tanggalnya.',
  },
  {
    id: 'kalender',
    q: 'Bagaimana menghubungkan dan memutuskan Google Calendar?',
    a: 'Masuk ke akun, buka Pengaturan, cari kartu Google Calendar, lalu pilih Hubungkan Google Calendar dan setujui izinnya. Setelah terhubung, tekan Sinkronkan sekarang untuk mengirim tugas yang belum selesai. Pengingat muncul pukul 09.00. Tugas yang sudah dicentang akan dihapus dari kalender saat sinkron berikutnya. Untuk berhenti, pilih Putuskan. Acara yang sudah terkirim tetap ada di kalender "Bridesmap" di Google, jadi hapus kalender itu di Google Calendar kalau sudah tidak diperlukan.',
  },
  {
    id: 'undangan',
    q: 'Bagaimana membuat dan membagikan undangan digital?',
    a: 'Buka menu Undangan digital, pilih salah satu desain, lalu isi nama, tanggal, cerita, dan foto. Desain yang dipilih langsung terlihat di pratinjau. Atur alamat undangan di bagian bawah halaman, lalu salin tautannya dan kirim ke tamu. Undangan saat ini hanya bisa dilihat lewat tautan yang kalian bagikan.',
  },
  {
    id: 'contoh',
    q: 'Apa itu data contoh, dan bisa dihapus?',
    a: 'Di Panduan, tombol Isi data contoh menambahkan beberapa vendor dan tamu contoh supaya aplikasi terlihat terisi. Data contoh diberi tanda (contoh) di namanya. Tombol Hapus data contoh menghapusnya lagi, dan data kalian yang asli tidak ikut terhapus.',
  },
  {
    id: 'ekspor',
    q: 'Bagaimana cara ekspor dan impor data?',
    a: 'Di Pengaturan, bagian Data kalian, pilih Ekspor data untuk mengunduh semua rencana dalam satu file. Untuk memindahkan ke perangkat lain, buka Pengaturan di perangkat itu lalu pilih Impor data. Impor menggantikan data yang sudah ada di perangkat tersebut.',
  },
  {
    id: 'pasangan',
    q: 'Bagaimana cara mengundang pasangan?',
    a: 'Di Pengaturan, bagian Undang pasangan, pilih Kirim lewat WhatsApp atau Salin tautan. Untuk sementara setiap akun punya rencananya sendiri, jadi kalian belum berbagi satu rencana yang sama secara real-time. Di satu perangkat, kalian bisa bergantian lewat avatar pasangan di bagian atas.',
  },
  {
    id: 'escrow',
    q: 'Apakah Bridesmap menjamin vendor saya aman?',
    a: 'Tidak. Kami bukan rekening bersama/escrow dan tidak menjamin vendor. Yang kami bantu: jadwal pembayaran yang jelas, pengingat, dan jejak bukti transfer yang rapi.',
  },
]

export const GUIDE_CONTACT = {
  title: 'Masih ada pertanyaan?',
  body: 'Kirim email ke kami untuk pertanyaan, masukan, atau kalau menemukan masalah.',
}

/** Bantuan singkat di keadaan kosong. Tautannya menuju bagian Mulai cepat di halaman Panduan. */
export const GUIDE_HINTS = {
  budget: 'Mulai dengan mengatur total budget dan alokasi per acara. Angka awalnya estimasi dan bisa diubah kapan saja.',
  vendor: 'Catat vendor sejak masih kandidat. Begitu Booked, harganya otomatis masuk budget.',
  tamu: 'Punya daftar di Excel atau kontak HP? Impor sekaligus, lalu kirim tautan RSVP lewat WhatsApp.',
}
