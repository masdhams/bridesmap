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

/** Penjelasan satu fitur: cara kerja, cara mengisi, dan cara membaca angkanya. */
export interface GuideTopic {
  id: string
  title: string
  /** Bagian judul yang dicetak miring, mengikuti gaya judul lain di Panduan. */
  italic: string
  intro: string
  to: string
  cta: string
  blocks: { heading: string; ordered?: boolean; items: string[] }[]
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 'budget',
    title: 'Budget:',
    italic: 'cara kerja, isi, dan baca',
    intro: 'Budget membantu kalian melihat tiga hal sekaligus: uang yang direncanakan, uang yang sudah disepakati dengan vendor, dan uang yang sudah keluar.',
    to: '/app/budget',
    cta: 'Buka Budget',
    blocks: [
      {
        heading: 'Cara kerjanya',
        items: [
          'Total budget kalian bagi ke tiap acara (lamaran, akad, resepsi, dan acara adat kalau ada). Tiap acara dibagi lagi ke kategorinya, seperti venue, katering, dan dekorasi.',
          'Pembagian awal hanya perkiraan. Kalian bisa mengubahnya dalam persen atau Rupiah di tab Pengaturan, bagian Atur alokasi.',
          'Vendor yang statusnya Booked masuk ke budget dengan sendirinya. Angka yang dipakai adalah harga yang disepakati, atau harga penawaran kalau belum ada kesepakatan. Jadi harga vendor tidak perlu dicatat dua kali.',
          'Biaya di luar vendor, misalnya sewa tenda atau doorprize, kalian catat sendiri sebagai biaya di kategori yang sesuai.',
          'Hidden cost adalah biaya yang sering terlupa, seperti pajak dan service charge, overtime vendor, atau konsumsi kru. Centang yang kalian perlukan di tab Pengaturan. Nominalnya dihitung dari total budget dan jumlah tamu, dan masih bisa diubah.',
        ],
      },
      {
        heading: 'Cara mengisinya',
        ordered: true,
        items: [
          'Isi total budget dan tanggal hari-H di Pengaturan.',
          'Buka Budget, tab Pengaturan, lalu cek pembagian per acara. Ubah kalau perlu.',
          'Catat vendor di menu Vendor & pembayaran. Ubah statusnya ke Booked setelah kalian sepakat.',
          'Untuk biaya lain, buka tab Kategori, ketuk kategorinya, lalu pilih Tambah biaya.',
          'Setiap ada pembayaran, centang Sudah dibayar. Untuk vendor, isi tanggal bayar di jadwal pembayarannya.',
        ],
      },
      {
        heading: 'Cara membacanya',
        items: [
          'Disepakati adalah biaya vendor Booked ditambah biaya lain yang sudah kalian catat. Sudah dibayar adalah bagian yang benar-benar sudah keluar. Sisa adalah total budget dikurangi Disepakati.',
          'Status di bagian atas ada tiga. Sesuai rencana berarti masih aman. Mendekati batas berarti yang disepakati sudah mencapai 90% dari total. Over budget berarti sudah melewati total.',
          'Ringkasan menjumlahkan kategori yang sama dari semua acara. Katering lamaran, akad, dan resepsi jadi satu angka, jadi angkanya bisa lebih besar dari katering satu acara.',
          'Kategori menampilkan angka per acara. Pakai tab ini untuk melihat acara mana yang paling banyak memakai biaya.',
          'Tanda lewat dan batang merah berarti biaya di kategori itu sudah melebihi alokasinya. Geser alokasi dari kategori yang masih longgar, atau naikkan total budget.',
          'Kategori yang tampil 0 belum punya vendor atau biaya. Itu wajar, misalnya venue untuk acara lamaran di rumah.',
        ],
      },
    ],
  },
  {
    id: 'checklist',
    title: 'Checklist:',
    italic: 'cara kerja, isi, dan baca',
    intro: 'Checklist adalah daftar tugas dari 12 bulan sebelum hari-H sampai sesudahnya, supaya kalian tahu apa yang perlu dikerjakan dan kapan.',
    to: '/app/checklist',
    cta: 'Buka Checklist',
    blocks: [
      {
        heading: 'Cara kerjanya',
        items: [
          'Tanggal tiap tugas dihitung dari hari-H. Kalau hari-H berubah, semua tanggal ikut bergeser.',
          'Kalau hari-H kurang dari 12 bulan lagi, jadwal dipadatkan dan tugas pertama mulai hari ini.',
          'Tugas dikelompokkan dalam tujuh fase, dari H-12 bulan sampai Hari-H dan setelahnya. Tab Timeline menampilkan per fase. Tab Kategori mengelompokkan tugas berdasarkan jenisnya, misalnya undangan dan tamu.',
          'Sebagian tugas terhubung ke halaman Administrasi. Tugas itu tercentang sendiri begitu semua dokumennya berstatus Ada.',
          'Setiap tugas bisa dipegang satu orang atau berdua, ditandai dengan avatar di sebelah kanan.',
        ],
      },
      {
        heading: 'Cara mengisinya',
        ordered: true,
        items: [
          'Centang tugas yang sudah selesai. Kalau salah, centang sekali lagi untuk membatalkan.',
          'Ketuk tugasnya untuk mengubah nama, deadline, penanggung jawab, kategori, atau catatan.',
          'Untuk tugas sendiri, tekan tombol + di kanan atas, lalu isi nama tugas, deadline, dan siapa yang mengerjakan.',
          'Untuk tugas yang terhubung dokumen, lengkapi dokumennya di Administrasi. Tugasnya akan selesai otomatis.',
        ],
      },
      {
        heading: 'Cara membacanya',
        items: [
          'Kartu Progres persiapan menunjukkan jumlah tugas yang selesai dan persentasenya. Di bawahnya ada Status: Sesuai jadwal, atau jumlah tugas yang terlambat.',
          'Terlambat berarti deadline sudah lewat dan tugasnya belum dicentang. Tanda ini juga muncul di baris tugasnya.',
          'Centang di tab fase berarti semua tugas di fase itu sudah selesai. Saat halaman dibuka, tab yang tampil adalah fase dengan tugas terdekat yang belum selesai.',
          'Bagian Selesai di fase ini menyimpan tugas yang sudah beres. Buka kalau kalian ingin melihatnya atau membatalkan centangnya.',
          'Mau diingatkan di HP? Hubungkan Google Calendar di Pengaturan, dan tugas yang belum selesai bisa dikirim sebagai pengingat.',
        ],
      },
    ],
  },
]

export const GUIDE_FAQ: GuideFaq[] = [
  {
    id: 'akun',
    q: 'Bagaimana cara masuk, dan apa yang dilakukan kalau lupa kata sandi?',
    a: 'Akun dibuat dari email yang kalian pakai saat membeli. Setelah pembelian, kalian menerima email untuk membuat kata sandi. Lalu buka halaman Masuk dan masuk dengan email dan kata sandi itu. Kalau lupa kata sandi, pilih Lupa / belum punya kata sandi di halaman Masuk, dan tautan untuk membuat kata sandi baru akan dikirim ke email kalian. Untuk keluar, pilih Keluar di bagian Akun pada Pengaturan.',
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
