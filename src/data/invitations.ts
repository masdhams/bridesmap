// Data undangan digital (PRD #33). Contoh fiktif per template untuk halaman pratinjau /undangan/*;
// undangan milik pasangan dibangun dari rencananya lewat src/lib/invitation.ts.

export type InvitationPerson = {
  nick: string
  full: string
  /** Contoh: "Putra pertama dari" */
  childOf: string
  parents: string
  instagram?: string
}

export type InvitationEvent = {
  name: string
  /** Jam mulai/selesai dalam format "08.00" */
  start: string
  end: string
  venue: string
  address: string
  /** Tautan Google Maps dari pasangan; kosong = dicari dari nama tempat & alamat. */
  mapsUrl?: string
}

export type Invitation = {
  groom: InvitationPerson
  bride: InvitationPerson
  /** Tanggal hari-H, YYYY-MM-DD */
  date: string
  /** Zona waktu tampilan dan offset UTC-nya */
  timezone: string
  utcOffset: string
  city: string
  quote: { text: string; by: string }
  /** `photo` dipakai template yang menampilkan foto per momen (Red Retro). */
  story: { year: string; title: string; text: string; photo?: string }[]
  events: InvitationEvent[]
  mapsQuery: string
  /** Tautan Google Maps untuk tombol lokasi utama (Sage). */
  mapsUrl?: string
  rsvpDeadline: string
  accounts: { bank: string; number: string; holder: string }[]
  giftAddress: string
  families: string
  photos: {
    envelope: [string?, string?]
    hero?: string
    heroSmall?: string
    groom?: string
    bride?: string
    gallery: string[]
    /** Foto di bagian penutup (Noir, Red Retro). */
    closing?: string
  }
}

export const SAGE_DEMO: Invitation = {
  groom: {
    nick: 'Raka',
    full: 'Raka Aditya Pratama',
    childOf: 'Putra pertama dari',
    parents: 'Bapak Bambang Pratama & Ibu Sri Wahyuni',
    instagram: 'rakapratama',
  },
  bride: {
    nick: 'Nadia',
    full: 'Nadia Ayu Larasati',
    childOf: 'Putri kedua dari',
    parents: 'Bapak Hendra Wijaya & Ibu Ratna Sari',
    instagram: 'nadialarasati',
  },
  date: '2027-03-20',
  timezone: 'WIB',
  utcOffset: '+07:00',
  city: 'Yogyakarta',
  quote: {
    text: 'Cinta tidak terdiri dari saling memandang, tetapi bersama-sama memandang ke arah yang sama.',
    by: 'Antoine de Saint-Exupéry',
  },
  story: [
    { year: '2019', title: 'Pertama Bertemu', text: 'Kami bertemu di sebuah kegiatan relawan di Yogyakarta. Obrolan singkat hari itu berlanjut sampai berbulan-bulan.' },
    { year: '2022', title: 'Menjalin Hubungan', text: 'Setelah tiga tahun berteman, kami memutuskan untuk berjalan bersama.' },
    { year: '2026', title: 'Lamaran', text: 'Disaksikan kedua keluarga, kami resmi bertunangan dan mulai mempersiapkan hari bahagia.' },
  ],
  events: [
    { name: 'Upacara Pernikahan', start: '08.00', end: '10.00', venue: 'Taman Ndalem Sirih', address: 'Jl. Kaliurang Km 7, Sleman, Yogyakarta' },
    { name: 'Resepsi', start: '11.00', end: '14.00', venue: 'Pendopo Ndalem Sirih', address: 'Jl. Kaliurang Km 7, Sleman, Yogyakarta' },
  ],
  mapsQuery: 'Jl. Kaliurang Km 7, Sleman, Yogyakarta',
  rsvpDeadline: '2027-03-10',
  accounts: [
    { bank: 'BCA', number: '1234 5678 90', holder: 'Raka Aditya Pratama' },
    { bank: 'Mandiri', number: '9876 5432 10', holder: 'Nadia Ayu Larasati' },
  ],
  giftAddress: 'Jl. Kaliurang Km 7 No. 12, Sleman, Yogyakarta 55581',
  families: 'Keluarga Besar Pratama & Wijaya',
  photos: { envelope: [], gallery: [] },
}

export const RED_RETRO_DEMO: Invitation = {
  groom: {
    nick: 'Bima',
    full: 'Bima Satria Nugraha',
    childOf: 'Putra pertama dari',
    parents: 'Bapak Iwan Nugraha & Ibu Lestari',
    instagram: 'bimasatria',
  },
  bride: {
    nick: 'Ayu',
    full: 'Ayu Kirana Putri',
    childOf: 'Putri kedua dari',
    parents: 'Bapak Darmawan & Ibu Sulastri',
    instagram: 'ayukirana',
  },
  date: '2027-08-21',
  timezone: 'WIB',
  utcOffset: '+07:00',
  city: 'Bandung',
  quote: {
    text: 'Cinta bukan tentang menemukan seseorang yang sempurna, tetapi belajar melihat seseorang yang tidak sempurna dengan cara yang sempurna.',
    by: 'Kutipan favorit kami',
  },
  story: [
    { year: '2019', title: 'Pertama kenal', text: 'Dikenalkan teman di sebuah acara musik. Obrolan soal kaset lama ternyata tidak selesai sampai pagi.' },
    { year: '2022', title: 'Jalan bareng', text: 'Dari kedai kopi kecil sampai keliling kota naik motor tua. Semua terasa seru kalau berdua.' },
    { year: '2026', title: 'Lamaran', text: 'Satu pertanyaan sederhana di ruang tamu, dan jawaban paling cepat yang pernah ada: iya.' },
  ],
  events: [
    { name: 'Akad Nikah', start: '08.00', end: '10.00', venue: 'Masjid Raya Bandung', address: 'Jl. Dalem Kaum No. 14, Bandung' },
    { name: 'Resepsi', start: '11.00', end: '14.00', venue: 'Gedung Sate Hall', address: 'Jl. Diponegoro No. 22, Bandung' },
  ],
  mapsQuery: 'Jl. Diponegoro No. 22, Bandung',
  rsvpDeadline: '2027-08-10',
  accounts: [
    { bank: 'BCA', number: '7730 2219 84', holder: 'Bima Satria Nugraha' },
    { bank: 'Mandiri', number: '1320 0456 7781', holder: 'Ayu Kirana Putri' },
  ],
  giftAddress: 'Jl. Cihampelas No. 88, Bandung 40131',
  families: 'Keluarga Nugraha & Darmawan',
  photos: { envelope: [], gallery: [] },
}

export const NOIR_DEMO: Invitation = {
  groom: {
    nick: 'Dimas',
    full: 'Dimas Arya Wicaksana',
    childOf: 'Putra kedua dari',
    parents: 'Bapak Hadi Wicaksana & Ibu Ratih Kusuma',
    instagram: 'dimasarya',
  },
  bride: {
    nick: 'Laras',
    full: 'Laras Ayu Pramesti',
    childOf: 'Putri pertama dari',
    parents: 'Bapak Agus Pramono & Ibu Sinta Dewi',
    instagram: 'larasayu',
  },
  date: '2027-06-12',
  timezone: 'WIB',
  utcOffset: '+07:00',
  city: 'Jakarta',
  quote: {
    text: 'Dua jiwa, satu cerita. Hari ini kami memulai bab yang paling lama kami nantikan.',
    by: 'Dimas & Laras',
  },
  story: [
    { year: '2020', title: 'Awal Cerita', text: 'Berawal dari satu proyek kantor yang sama, obrolan singkat di sela rapat berubah menjadi kebiasaan pulang bersama.' },
    { year: '2024', title: 'Lamaran', text: 'Di hadapan kedua keluarga, kami mengikat niat untuk melangkah ke tahap yang lebih serius.' },
    { year: '2027', title: 'Pernikahan', text: 'Hari yang kami nantikan, saat dua hati dipersatukan dalam ikatan suci dengan doa restu dari orang-orang tersayang.' },
  ],
  events: [
    { name: 'Akad Nikah', start: '08.00', end: '09.30', venue: 'Kediaman Mempelai Wanita', address: 'Jl. Cempaka Putih Raya No. 18, Jakarta Pusat' },
    { name: 'Resepsi', start: '11.00', end: '14.00', venue: 'Aula Teratai', address: 'Jl. Jend. Sudirman Kav. 12, Jakarta Selatan' },
  ],
  mapsQuery: 'Jl. Jend. Sudirman Kav. 12, Jakarta Selatan',
  rsvpDeadline: '2027-06-01',
  accounts: [
    { bank: 'BCA', number: '5210 8834 21', holder: 'Dimas Arya Wicaksana' },
    { bank: 'BNI', number: '0812 4456 77', holder: 'Laras Ayu Pramesti' },
  ],
  giftAddress: 'Jl. Cempaka Putih Raya No. 18, Jakarta Pusat 10510',
  families: 'Keluarga Besar Wicaksana & Pramono',
  photos: { envelope: [], gallery: [] },
}
