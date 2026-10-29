// Konten statis: template checklist, kategori budget, biaya tersembunyi, Deep Talk, dll.
// Semua angka perkiraan adalah titik awal — pengguna bisa mengubahnya.

export const BRAND = {
  name: 'Bridesmap',
  product: 'Bridesmap Wedding Planner',
  tagline: 'Plan with intention. Celebrate your story.',
}

export const EVENT_KINDS: { kind: 'lamaran' | 'akad' | 'resepsi' | 'adat'; label: string; hint: string; /** bobot awal pembagian total budget antar acara — ASUMSI, tidak ada di PRD */ weight: number }[] = [
  { kind: 'lamaran', label: 'Lamaran', hint: 'Acara lebih kecil, katering paling besar', weight: 8 },
  { kind: 'akad', label: 'Akad nikah', hint: 'Termasuk administrasi & izin', weight: 17 },
  { kind: 'resepsi', label: 'Resepsi', hint: 'Acara terbesar', weight: 60 },
  { kind: 'adat', label: 'Acara adat', hint: 'Siraman, midodareni, sangjit, dll.', weight: 15 },
]

/** Default alokasi per kategori (% dari budget acara) sesuai tabel PRD v1.6 §#39.
 *  Hipotesis awal, belum divalidasi — UI wajib menandainya sebagai estimasi. Tiap kolom berjumlah 100%. */
export const ALLOCATION_DEFAULTS: { key: string; name: string; pct: Record<'lamaran' | 'akad' | 'resepsi' | 'adat', number> }[] = [
  { key: 'venue', name: 'Venue', pct: { lamaran: 15, akad: 20, resepsi: 25, adat: 15 } },
  { key: 'katering', name: 'Katering', pct: { lamaran: 35, akad: 25, resepsi: 25, adat: 25 } },
  { key: 'dekor', name: 'Dekor & bunga', pct: { lamaran: 10, akad: 10, resepsi: 10, adat: 15 } },
  { key: 'mua', name: 'MUA & busana', pct: { lamaran: 8, akad: 8, resepsi: 8, adat: 12 } },
  { key: 'dokumentasi', name: 'Dokumentasi', pct: { lamaran: 8, akad: 8, resepsi: 8, adat: 8 } },
  { key: 'undangan', name: 'Undangan & cetak', pct: { lamaran: 5, akad: 4, resepsi: 3, adat: 3 } },
  { key: 'transport', name: 'Transportasi & akomodasi keluarga', pct: { lamaran: 7, akad: 6, resepsi: 5, adat: 5 } },
  { key: 'admin', name: 'Administrasi & izin', pct: { lamaran: 2, akad: 4, resepsi: 2, adat: 2 } },
  { key: 'hiburan', name: 'Hiburan & lainnya', pct: { lamaran: 2, akad: 5, resepsi: 4, adat: 3 } },
  { key: 'cadangan', name: 'Cadangan', pct: { lamaran: 8, akad: 10, resepsi: 10, adat: 12 } },
]

export interface HiddenCost {
  key: string
  name: string
  why: string
  /** Estimasi awal berdasarkan profil (total budget & jumlah tamu). */
  estimate: (p: { budget: number; guests: number }) => number
  defaultOn?: boolean
  /** Paling sering terlupa — diberi badge "Sering terlewat". */
  missed?: boolean
}

export const HIDDEN_COSTS: HiddenCost[] = [
  {
    key: 'transport-keluarga', missed: true,
    name: 'Transportasi keluarga besar',
    why: 'Sewa bus/mobil untuk rombongan keluarga dari luar kota, bensin, tol, dan parkir — sering dibayar dadakan dari kantong pribadi.',
    estimate: ({ budget }) => budget * 0.02,
    defaultOn: true,
  },
  {
    key: 'konsumsi-vendor',
    name: 'Konsumsi vendor, kru & penghulu',
    why: 'Fotografer, dekor, MUA, band, dan panitia juga perlu makan. Biasanya 20–40 porsi di luar hitungan tamu.',
    estimate: () => 30 * 50000,
    defaultOn: true,
  },
  {
    key: 'seragam', missed: true,
    name: 'Seragam keluarga & panitia',
    why: 'Kain/batik seragam untuk orang tua, saudara, dan among tamu. Sering disepakati keluarga tapi tidak masuk budget pasangan.',
    estimate: () => 20 * 250000,
    defaultOn: true,
  },
  {
    key: 'tip',
    name: 'Tip kru dekor, katering & WO',
    why: 'Uang terima kasih untuk kru yang kerja sejak subuh sampai bongkar malam.',
    estimate: () => 1500000,
  },
  {
    key: 'overtime', missed: true,
    name: 'Overtime venue, fotografer & MUA',
    why: 'Acara molor 1–2 jam bisa kena biaya tambahan per jam dari venue dan vendor dokumentasi.',
    estimate: () => 2000000,
  },
  {
    key: 'nikah-luar-kua',
    name: 'Biaya nikah di luar KUA / luar jam kerja',
    why: 'Akad di KUA pada jam kerja gratis; akad di luar KUA atau di luar jam kerja dikenakan PNBP resmi (saat ini Rp600.000).',
    estimate: () => 600000,
  },
  {
    key: 'pajak-service', missed: true,
    name: 'Pajak & service charge venue/katering',
    why: 'Venue hotel dan sebagian katering mencantumkan harga belum termasuk pajak & service (bisa ±21%).',
    estimate: ({ budget }) => budget * 0.48 * 0.21 * 0.5,
  },
  {
    key: 'mua-keluarga',
    name: 'MUA & busana keluarga inti',
    why: 'Rias untuk ibu, saudara, dan pagar ayu sering tidak termasuk paket MUA pengantin.',
    estimate: () => 6 * 400000,
  },
  {
    key: 'souvenir-lebih',
    name: 'Souvenir & porsi cadangan',
    why: 'Tamu bawa keluarga tanpa konfirmasi. Siapkan 10% lebih dari jumlah undangan.',
    estimate: ({ guests }) => Math.round(guests * 0.1) * 15000,
  },
  {
    key: 'listrik',
    name: 'Genset / tambahan daya listrik',
    why: 'Sound system, lighting, dan katering di rumah atau gedung kecil sering butuh genset terpisah.',
    estimate: () => 1500000,
  },
  {
    key: 'parkir-keamanan',
    name: 'Parkir, keamanan & kebersihan',
    why: 'Juru parkir, petugas keamanan lingkungan, dan kebersihan setelah acara.',
    estimate: () => 1000000,
  },
  {
    key: 'rapat-keluarga',
    name: 'Konsumsi rapat & persiapan keluarga',
    why: 'Pertemuan keluarga, lamaran, dan rapat panitia sebelum hari-H.',
    estimate: () => 1500000,
  },
  {
    key: 'admin',
    name: 'Biaya admin transfer, materai & dokumen',
    why: 'Biaya transfer antarbank, materai kontrak vendor, tes kesehatan pranikah, dan legalisir dokumen.',
    estimate: () => 300000,
  },
  {
    key: 'kirim-barang',
    name: 'Pengiriman seserahan & barang',
    why: 'Ongkos kirim atau sewa mobil untuk seserahan, hantaran, dan barang dekor milik keluarga.',
    estimate: () => 500000,
  },
]

export interface TaskTemplate {
  title: string
  phase: string
  offsetDays: number
}

export const PHASES = [
  'H-12 s.d. H-9 bulan',
  'H-9 s.d. H-6 bulan',
  'H-6 s.d. H-3 bulan',
  'H-3 s.d. H-1 bulan',
  'H-4 s.d. H-1 minggu',
  'H-7 s.d. H-1',
  'Hari-H & setelahnya',
]

export const TASK_TEMPLATES: TaskTemplate[] = [
  { phase: PHASES[0], offsetDays: -365, title: 'Diskusikan konsep, gaya, dan skala acara berdua' },
  { phase: PHASES[0], offsetDays: -360, title: 'Sepakati total budget & siapa saja yang ikut membiayai' },
  { phase: PHASES[0], offsetDays: -350, title: 'Tentukan tanggal & cadangan tanggal' },
  { phase: PHASES[0], offsetDays: -340, title: 'Perkirakan jumlah tamu dari kedua keluarga' },
  { phase: PHASES[0], offsetDays: -330, title: 'Survei & booking venue (minta kontrak tertulis)' },
  { phase: PHASES[0], offsetDays: -320, title: 'Mulai tabungan nikah bersama' },
  { phase: PHASES[0], offsetDays: -300, title: 'Pilih WO/on-the-day organizer (jika pakai) — cek ulasan & legalitas' },
  { phase: PHASES[1], offsetDays: -270, title: 'Tes food & booking katering' },
  { phase: PHASES[1], offsetDays: -260, title: 'Booking fotografer & videografer' },
  { phase: PHASES[1], offsetDays: -250, title: 'Booking MUA & busana pengantin' },
  { phase: PHASES[1], offsetDays: -240, title: 'Booking dekorasi' },
  { phase: PHASES[1], offsetDays: -230, title: 'Tentukan konsep acara adat (jika ada)' },
  { phase: PHASES[1], offsetDays: -210, title: 'Susun daftar tamu awal' },
  { phase: PHASES[1], offsetDays: -200, title: 'Rencanakan honeymoon & cek paspor' },
  { phase: PHASES[2], offsetDays: -180, title: 'Booking MC, hiburan & sound system' },
  { phase: PHASES[2], offsetDays: -170, title: 'Pesan cincin kawin' },
  { phase: PHASES[2], offsetDays: -160, title: 'Tentukan desain undangan & souvenir' },
  { phase: PHASES[2], offsetDays: -150, title: 'Siapkan daftar seserahan' },
  { phase: PHASES[2], offsetDays: -140, title: 'Fitting busana pertama' },
  { phase: PHASES[2], offsetDays: -120, title: 'Pesan seragam keluarga & panitia' },
  { phase: PHASES[2], offsetDays: -100, title: 'Booking tiket & hotel honeymoon' },
  { phase: PHASES[3], offsetDays: -90, title: 'Urus dokumen nikah (N1–N4, KUA / catatan sipil)' },
  { phase: PHASES[3], offsetDays: -80, title: 'Tes kesehatan pranikah' },
  { phase: PHASES[3], offsetDays: -75, title: 'Sebar save-the-date' },
  { phase: PHASES[3], offsetDays: -60, title: 'Prewedding photoshoot' },
  { phase: PHASES[3], offsetDays: -45, title: 'Sebar undangan' },
  { phase: PHASES[3], offsetDays: -40, title: 'Daftar & bayar biaya nikah di KUA' },
  { phase: PHASES[3], offsetDays: -35, title: 'Susun rundown akad & resepsi bersama WO/MC' },
  { phase: PHASES[4], offsetDays: -28, title: 'Rekap RSVP & konfirmasi jumlah porsi ke katering' },
  { phase: PHASES[4], offsetDays: -25, title: 'Susun daftar tempat duduk keluarga & VIP' },
  { phase: PHASES[4], offsetDays: -21, title: 'Fitting busana terakhir' },
  { phase: PHASES[4], offsetDays: -18, title: 'Technical meeting dengan semua vendor' },
  { phase: PHASES[4], offsetDays: -14, title: 'Cek status pelunasan setiap vendor' },
  { phase: PHASES[4], offsetDays: -10, title: 'Siapkan amplop tip & konsumsi kru' },
  { phase: PHASES[5], offsetDays: -7, title: 'Konfirmasi ulang jam datang setiap vendor' },
  { phase: PHASES[5], offsetDays: -5, title: 'Kemas seserahan & hantaran' },
  { phase: PHASES[5], offsetDays: -3, title: 'Bagikan rundown final ke vendor, MC & keluarga' },
  { phase: PHASES[5], offsetDays: -2, title: 'Siapkan dokumen & mahar untuk akad' },
  { phase: PHASES[5], offsetDays: -1, title: 'Istirahat cukup — serahkan koordinasi ke PIC' },
  { phase: PHASES[6], offsetDays: 0, title: 'Nikmati harinya — kalian sudah merencanakannya dengan baik' },
  { phase: PHASES[6], offsetDays: 3, title: 'Lunasi sisa pembayaran & ambil barang sewaan kembali' },
  { phase: PHASES[6], offsetDays: 14, title: 'Kirim ucapan terima kasih ke keluarga & vendor' },
  { phase: PHASES[6], offsetDays: 30, title: 'Urus perubahan data KTP/KK' },
]

/** Dokumen awal di halaman Administrasi. `taskTitle` = judul tugas checklist yang ikut selesai kalau semua dokumennya sudah ada. */
export interface DocTemplate {
  name: string
  group: string
  owner: 'A' | 'B' | 'both'
  taskTitle?: string
}

export const DOC_GROUPS = ['Dokumen pribadi', 'Berkas KUA & akad', 'Kontrak vendor', 'Honeymoon', 'Setelah menikah']

const NIKAH = 'Urus dokumen nikah (N1–N4, KUA / catatan sipil)'
export const DOC_TEMPLATES: DocTemplate[] = [
  { group: DOC_GROUPS[0], owner: 'A', name: 'KTP', taskTitle: NIKAH },
  { group: DOC_GROUPS[0], owner: 'B', name: 'KTP', taskTitle: NIKAH },
  { group: DOC_GROUPS[0], owner: 'both', name: 'Kartu Keluarga (KK)', taskTitle: NIKAH },
  { group: DOC_GROUPS[0], owner: 'A', name: 'Akta kelahiran', taskTitle: NIKAH },
  { group: DOC_GROUPS[0], owner: 'B', name: 'Akta kelahiran', taskTitle: NIKAH },
  { group: DOC_GROUPS[0], owner: 'both', name: 'Surat pengantar RT/RW & formulir N1–N4', taskTitle: NIKAH },
  { group: DOC_GROUPS[0], owner: 'both', name: 'Pas foto 2x3 / 4x6', taskTitle: NIKAH },
  { group: DOC_GROUPS[1], owner: 'both', name: 'Sertifikat / hasil tes kesehatan pranikah', taskTitle: 'Tes kesehatan pranikah' },
  { group: DOC_GROUPS[1], owner: 'both', name: 'Bukti pendaftaran nikah di KUA', taskTitle: 'Daftar & bayar biaya nikah di KUA' },
  { group: DOC_GROUPS[1], owner: 'both', name: 'Bukti bayar biaya nikah (jika ada)', taskTitle: 'Daftar & bayar biaya nikah di KUA' },
  { group: DOC_GROUPS[1], owner: 'both', name: 'Berkas lengkap & fotokopi untuk hari akad', taskTitle: 'Siapkan dokumen & mahar untuk akad' },
  { group: DOC_GROUPS[2], owner: 'both', name: 'Kontrak venue', taskTitle: 'Survei & booking venue (minta kontrak tertulis)' },
  { group: DOC_GROUPS[2], owner: 'both', name: 'Kontrak katering', taskTitle: 'Tes food & booking katering' },
  { group: DOC_GROUPS[2], owner: 'both', name: 'Kontrak fotografer & videografer', taskTitle: 'Booking fotografer & videografer' },
  { group: DOC_GROUPS[3], owner: 'A', name: 'Paspor', taskTitle: 'Rencanakan honeymoon & cek paspor' },
  { group: DOC_GROUPS[3], owner: 'B', name: 'Paspor', taskTitle: 'Rencanakan honeymoon & cek paspor' },
  { group: DOC_GROUPS[3], owner: 'both', name: 'Tiket & voucher hotel honeymoon', taskTitle: 'Booking tiket & hotel honeymoon' },
  { group: DOC_GROUPS[4], owner: 'both', name: 'Buku nikah / akta nikah' },
  { group: DOC_GROUPS[4], owner: 'both', name: 'KTP & KK baru (setelah perubahan data)', taskTitle: 'Urus perubahan data KTP/KK' },
]

export const DEEP_TALK:{ topic: string; q: string }[] = [
  { topic: 'Nilai', q: 'Apa tiga nilai hidup yang paling ingin kita jaga di rumah tangga nanti?' },
  { topic: 'Keuangan', q: 'Bagaimana kita akan mengatur gaji: digabung, dipisah, atau sebagian?' },
  { topic: 'Keluarga', q: 'Seberapa sering kita ingin berkunjung ke keluarga masing-masing setelah menikah?' },
  { topic: 'Ekspektasi', q: 'Hal kecil apa yang membuatmu merasa paling dicintai?' },
  { topic: 'Keuangan', q: 'Berapa batas belanja yang perlu didiskusikan dulu sebelum dibeli?' },
  { topic: 'Kehidupan setelah menikah', q: 'Kita ingin tinggal di mana dalam 3 tahun pertama?' },
  { topic: 'Konflik', q: 'Saat sedang marah, kamu butuh apa dariku: diberi ruang atau diajak bicara?' },
  { topic: 'Anak', q: 'Bagaimana pandanganmu soal punya anak — kapan dan berapa?' },
  { topic: 'Keuangan', q: 'Apa ada utang atau cicilan yang perlu aku tahu?' },
  { topic: 'Karier', q: 'Mimpi karier apa yang ingin kamu kejar 5 tahun ke depan, dan bagaimana aku bisa mendukung?' },
  { topic: 'Keluarga', q: 'Bagaimana kita menyikapi kalau orang tua ikut campur dalam keputusan kita?' },
  { topic: 'Pekerjaan rumah', q: 'Pembagian pekerjaan rumah seperti apa yang terasa adil buatmu?' },
  { topic: 'Spiritual', q: 'Kebiasaan ibadah atau spiritual apa yang ingin kita bangun bersama?' },
  { topic: 'Kenangan', q: 'Momen apa bersamaku yang paling ingin kamu ulang?' },
  { topic: 'Keuangan', q: 'Berapa persen penghasilan yang ingin kita tabung dan investasikan?' },
  { topic: 'Ekspektasi', q: 'Apa ketakutan terbesarmu tentang pernikahan?' },
  { topic: 'Kehidupan setelah menikah', q: 'Bagaimana kita tetap punya waktu untuk diri sendiri dan teman?' },
  { topic: 'Keluarga', q: 'Apakah kita akan membantu keuangan orang tua? Seberapa besar?' },
  { topic: 'Konflik', q: 'Kebiasaanku yang mana yang sebenarnya mengganggumu tapi belum kamu sampaikan?' },
  { topic: 'Nilai', q: 'Apa arti "rumah" buatmu?' },
  { topic: 'Kesehatan', q: 'Kebiasaan sehat apa yang ingin kita mulai berdua?' },
  { topic: 'Keuangan', q: 'Bagaimana kita mengambil keputusan untuk pembelian besar seperti rumah atau kendaraan?' },
  { topic: 'Ekspektasi', q: 'Bagaimana bentuk perayaan ulang tahun pernikahan yang kamu bayangkan?' },
  { topic: 'Kehidupan setelah menikah', q: 'Tradisi baru apa yang ingin kita ciptakan sebagai keluarga?' },
  { topic: 'Komunikasi', q: 'Seberapa sering kita perlu "rapat keluarga" untuk membahas rencana dan keuangan?' },
  { topic: 'Nilai', q: 'Apa yang kamu pelajari dari pernikahan orang tuamu — yang ingin ditiru dan yang tidak?' },
  { topic: 'Karier', q: 'Kalau salah satu dari kita dapat kesempatan kerja di kota lain, apa yang akan kita lakukan?' },
  { topic: 'Kenangan', q: 'Kapan pertama kali kamu yakin ingin menikah denganku?' },
  { topic: 'Keuangan', q: 'Dana darurat kita idealnya berapa bulan pengeluaran?' },
  { topic: 'Ekspektasi', q: 'Apa satu janji yang ingin kamu pegang seumur hidup untukku?' },
]

export const RUNDOWN_TEMPLATES: Record<string, { time: string; activity: string; pic?: string }[]> = {
  'Akad nikah': [
    { time: '07:00', activity: 'Keluarga & pengantin bersiap, MUA mulai rias', pic: 'MUA' },
    { time: '08:00', activity: 'Penerimaan tamu keluarga', pic: 'Among tamu' },
    { time: '08:30', activity: 'Penghulu tiba, pemeriksaan berkas', pic: 'Keluarga' },
    { time: '09:00', activity: 'Pembukaan & pembacaan ayat suci', pic: 'MC' },
    { time: '09:15', activity: 'Ijab kabul', pic: 'Penghulu' },
    { time: '09:30', activity: 'Penandatanganan buku nikah & penyerahan mahar', pic: 'Penghulu' },
    { time: '09:45', activity: 'Sungkeman', pic: 'MC' },
    { time: '10:15', activity: 'Foto keluarga', pic: 'Fotografer' },
    { time: '10:45', activity: 'Ramah tamah & makan', pic: 'Katering' },
  ],
  Resepsi: [
    { time: '10:00', activity: 'Gladi singkat & cek sound', pic: 'WO' },
    { time: '11:00', activity: 'Pintu dibuka, tamu datang', pic: 'Among tamu' },
    { time: '11:15', activity: 'Kirab / prosesi masuk pengantin', pic: 'MC' },
    { time: '11:30', activity: 'Sambutan keluarga', pic: 'MC' },
    { time: '11:45', activity: 'Doa & hidangan dibuka', pic: 'Katering' },
    { time: '12:00', activity: 'Salam-salaman & foto bersama tamu', pic: 'Fotografer' },
    { time: '13:30', activity: 'Penutupan', pic: 'MC' },
    { time: '14:00', activity: 'Bongkar dekor & serah terima venue', pic: 'Dekor' },
  ],
}

export const DEFAULT_SESERAHAN: { name: string; budget: number }[] = [
  { name: 'Seperangkat alat salat', budget: 750000 },
  { name: 'Al-Qur\'an / kitab suci', budget: 300000 },
  { name: 'Set perhiasan', budget: 3000000 },
  { name: 'Tas', budget: 1000000 },
  { name: 'Sepatu / sandal', budget: 700000 },
  { name: 'Set skincare & kosmetik', budget: 1000000 },
  { name: 'Pakaian & kain', budget: 800000 },
  { name: 'Parfum', budget: 500000 },
  { name: 'Buah & kue', budget: 400000 },
]

export const HONEYMOON_BOOKINGS = ['Tiket pesawat / kereta', 'Hotel / penginapan', 'Paspor (masa berlaku ≥6 bulan)', 'Visa (jika perlu)', 'Asuransi perjalanan', 'Transportasi lokal']
export const HONEYMOON_PACKING = ['Dokumen & fotokopi buku nikah', 'Obat pribadi', 'Charger & power bank', 'Baju renang', 'Sunscreen', 'Adaptor colokan']

export const TESTIMONIALS: { name: string; city: string; quote: string; url: string }[] = [
  // PRD §6.2 #11: hanya testimoni pasangan nyata yang bertaut ke akun publik. Isi setelah beta.
]

export const LEGAL = {
  maker: 'Tim Bridesmap', // TODO: nama pembuat/perusahaan asli (PRD #11 — identitas pembuat transparan)
  contactEmail: 'halo@bridecanvas.id', // TODO: email resmi
}
