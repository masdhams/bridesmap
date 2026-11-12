// Konten statis: template checklist, kategori budget, biaya tersembunyi, Deep Talk, dll.
// Semua angka perkiraan adalah titik awal — pengguna bisa mengubahnya.

export const BRAND = {
  name: 'Bridesmap',
  product: 'Bridesmap Wedding Planner',
  tagline: 'Plan your dream wedding. Enjoy every moment before it.',
}

export const EVENT_KINDS: { kind: 'lamaran' | 'akad' | 'resepsi' | 'adat'; label: string; hint: string; /** bobot awal pembagian total budget antar acara — ASUMSI, tidak ada di PRD */ weight: number }[] = [
  { kind: 'lamaran', label: 'Lamaran', hint: 'Acara yang lebih intim, dengan kebutuhan katering dan dekorasi yang bisa disesuaikan.', weight: 8 },
  { kind: 'akad', label: 'Akad nikah', hint: 'Termasuk kebutuhan administrasi dan perizinan.', weight: 17 },
  { kind: 'resepsi', label: 'Resepsi', hint: 'Biasanya menjadi acara dengan jumlah tamu dan kebutuhan terbesar.', weight: 60 },
  { kind: 'adat', label: 'Acara adat', hint: 'Seperti siraman, midodareni, sangjit, dan lainnya.', weight: 15 },
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

// Daftar & rumus hidden cost (revisi 2 Nov 2026, lihat revisi-kalkulator-hidden-cost.md). Dipakai bersama oleh LP, onboarding,
// menu Budget, dan kalkulator gratis. Asumsi porsi budget mengikuti ALLOCATION_DEFAULTS resepsi: venue 25%, katering 25%,
// dokumentasi 8%, MUA & busana 8%. Nominal per orang/porsi/kamar masih angka awal yang perlu divalidasi dengan price list vendor.
// Kunci lama dipertahankan bila maknanya sama, supaya kategori pengguna yang sudah ada tetap terhubung.
// Transportasi, akomodasi, administrasi, dan kebutuhan mendadak tidak dicentang otomatis karena sudah tercakup kategori
// di pembagian budget (Transportasi & akomodasi keluarga, Administrasi & izin, Cadangan); dicentang hanya bila belum masuk.
export const HIDDEN_COSTS: HiddenCost[] = [
  {
    key: 'pajak-service', missed: true,
    name: 'Pajak & service charge venue/katering',
    why: 'Pajak dan service charge yang belum termasuk di harga penawaran venue atau katering. Perkiraan awal: 2,5% dari total budget (pajak maksimal 10% + service ±10%, untuk seperempat tagihan venue & katering).',
    estimate: ({ budget }) => budget * 0.5 * 0.25 * 0.2,
  },
  {
    key: 'seragam', missed: true,
    name: 'Seragam keluarga & panitia',
    why: 'Kain, ongkos jahit, atau baju khusus untuk keluarga dan panitia. Perkiraan awal: 3 orang per 100 tamu (minimal 6 orang), Rp150.000 per orang.',
    estimate: ({ guests }) => Math.max(6, Math.round(guests * 0.03)) * 150000,
    defaultOn: true,
  },
  {
    key: 'transport-keluarga', missed: true,
    name: 'Transportasi keluarga besar',
    why: 'Sewa kendaraan, bensin, tol, atau transportasi rombongan keluarga. Perkiraan awal: 1% dari total budget. Centang kalau belum masuk kategori Transportasi & akomodasi keluarga.',
    estimate: ({ budget }) => budget * 0.01,
  },
  {
    key: 'akomodasi',
    name: 'Akomodasi keluarga luar kota',
    why: 'Hotel atau penginapan untuk keluarga dari luar kota. Perkiraan awal: 1 kamar per 150 tamu, 1 malam, Rp400.000 per kamar. Centang kalau belum masuk kategori Transportasi & akomodasi keluarga.',
    estimate: ({ guests }) => Math.max(1, Math.round(guests / 150)) * 400000,
  },
  {
    key: 'mua-keluarga', missed: true,
    name: 'Rias tambahan keluarga',
    why: 'Makeup dan hairdo untuk ibu, saudara, atau keluarga inti di luar paket MUA pengantin. Perkiraan awal: 4 orang, Rp200.000 per orang.',
    estimate: () => 4 * 200000,
  },
  {
    key: 'overtime-venue', missed: true,
    name: 'Overtime venue',
    why: 'Biaya sewa tambahan kalau acara melewati jam sewa gedung. Perkiraan awal: 1 jam, dengan tarif 4% dari nilai sewa venue per jam.',
    estimate: ({ budget }) => budget * 0.25 * 0.04,
  },
  {
    key: 'overtime', missed: true,
    name: 'Overtime vendor',
    why: 'Tambahan jam kerja fotografer, videografer, MUA, MC, atau WO kalau acara molor. Perkiraan awal: 1 jam dokumentasi, dengan tarif 10% dari nilai paketnya.',
    estimate: ({ budget }) => budget * 0.08 * 0.1,
  },
  {
    key: 'venue-tambahan',
    name: 'Biaya tambahan venue',
    why: 'Listrik tambahan atau genset, kebersihan, parkir, atau biaya masuk vendor dari luar. Perkiraan awal: 0,5% dari total budget + Rp2.000 per tamu.',
    estimate: ({ budget, guests }) => budget * 0.005 + guests * 2000,
  },
  {
    key: 'konsumsi-vendor',
    name: 'Konsumsi kru vendor',
    why: 'Makan untuk tim dokumentasi, MUA, dekor, WO, dan vendor lain yang bertugas seharian. Perkiraan awal: 1 porsi per 20 tamu (minimal 15 porsi), Rp40.000 per porsi.',
    estimate: ({ guests }) => Math.max(15, Math.round(guests * 0.05)) * 40000,
    defaultOn: true,
  },
  {
    key: 'porsi-cadangan',
    name: 'Tambahan konsumsi tamu',
    why: 'Porsi cadangan kalau tamu yang datang lebih banyak dari perkiraan. Perkiraan awal: 3% dari nilai katering.',
    estimate: ({ budget }) => budget * 0.25 * 0.03,
  },
  {
    key: 'tip',
    name: 'Uang lelah & tip kru',
    why: 'Uang terima kasih untuk kru dan petugas yang membantu acara, kalau kalian memberikannya. Perkiraan awal: 0,5% dari total budget.',
    estimate: ({ budget }) => budget * 0.005,
  },
  {
    key: 'admin',
    name: 'Administrasi & dokumen',
    why: 'Biaya nikah di luar KUA atau di luar jam kerja (Rp600.000, resmi; gratis di KUA pada jam kerja), meterai kontrak vendor, fotokopi, dan legalisir. Centang kalau belum masuk kategori Administrasi & izin.',
    estimate: () => 600000 + 8 * 10000 + 100000,
  },
  {
    key: 'busana-penyesuaian',
    name: 'Aksesori & penyesuaian busana',
    why: 'Permak baju, aksesori tambahan, atau laundry busana sewaan. Perkiraan awal: 5% dari budget MUA & busana.',
    estimate: ({ budget }) => budget * 0.08 * 0.05,
  },
  {
    key: 'darurat-hari-h',
    name: 'Kebutuhan mendadak hari-H',
    why: 'Beli perlengkapan yang ketinggalan atau kebutuhan kecil yang muncul di hari-H. Perkiraan awal: 0,5% dari total budget. Centang kalau kategori Cadangan sudah dipakai untuk hal lain.',
    estimate: ({ budget }) => budget * 0.005,
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
  { topic: 'Nilai', q: 'Apa tiga nilai hidup yang paling ingin kita jaga dalam rumah tangga nanti?' },
  { topic: 'Keuangan', q: 'Setelah menikah, bagaimana enaknya kita mengatur penghasilan: digabung, dipisah, atau sebagian?' },
  { topic: 'Keluarga', q: 'Seberapa sering kita ingin mengunjungi keluarga masing-masing setelah menikah?' },
  { topic: 'Ekspektasi', q: 'Hal sederhana apa yang paling membuatmu merasa dicintai?' },
  { topic: 'Keuangan', q: 'Mulai dari nominal berapa kita perlu ngobrol dulu sebelum membeli sesuatu?' },
  { topic: 'Kehidupan setelah menikah', q: 'Dalam tiga tahun pertama, kita membayangkan tinggal di mana?' },
  { topic: 'Konflik', q: 'Saat sedang marah, apa yang paling kamu butuhkan dariku: waktu sendiri atau ditemani bicara?' },
  { topic: 'Anak', q: 'Bagaimana bayanganmu tentang punya anak? Kapan dan berapa?' },
  { topic: 'Keuangan', q: 'Ada utang atau cicilan yang sebaiknya kita tahu dan bicarakan bersama?' },
  { topic: 'Karier', q: 'Apa mimpi karier yang ingin kamu capai dalam lima tahun ke depan? Bagaimana aku bisa mendukungmu?' },
  { topic: 'Keluarga', q: 'Kalau orang tua ikut memberi masukan dalam keputusan rumah tangga, bagaimana sebaiknya kita menyikapinya?' },
  { topic: 'Pekerjaan rumah', q: 'Seperti apa pembagian pekerjaan rumah yang terasa adil buat kita berdua?' },
  { topic: 'Spiritual', q: 'Kebiasaan ibadah atau kegiatan spiritual apa yang ingin kita jalani bersama?' },
  { topic: 'Kenangan', q: 'Momen apa bersamaku yang paling ingin kamu ulang?' },
  { topic: 'Keuangan', q: 'Berapa bagian penghasilan yang ingin kita sisihkan untuk tabungan dan investasi?' },
  { topic: 'Ekspektasi', q: 'Apa hal yang paling kamu khawatirkan tentang kehidupan setelah menikah?' },
  { topic: 'Kehidupan setelah menikah', q: 'Bagaimana caranya kita tetap punya waktu untuk diri sendiri dan teman-teman?' },
  { topic: 'Keluarga', q: 'Apakah kita ingin membantu keuangan orang tua? Kalau iya, seberapa besar yang terasa nyaman untuk kita?' },
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

/** Penawaran di Landing (keputusan product owner 30 Okt 2026): satu paket berbayar, tanpa tier gratis.
 *  Isi paket sama di semua fase harga; hanya fase berstatus 'active' yang bisa dibeli. */
export const OFFER = {
  normalPrice: 347_000,
  /** Checkout di OrderHero. */
  checkoutHref: 'https://bridesmap.orderhero.id/form/order-bridesmap',
  phases: [
    { name: 'Pre Launching', price: 99_000, status: 'ended' as const },
    { name: 'Launching', price: 129_000, status: 'active' as const },
  ],
  items: [
    'Undangan digital dengan desain yang tetap cantik dikenang',
    'Smart RSVP dan undangan personal untuk setiap tamu',
    'Budget setiap acara, termasuk biaya yang sering terlupakan',
    'Semua vendor dan jadwal pembayarannya',
    'Checklist persiapan yang tersinkron dengan Google Calendar',
    'Undang sebanyak mungkin orang tersayang',
    'Atur tempat duduk dan kumpulkan wedding inspiration',
    'Deep Talk untuk berdua, plus persiapan honeymoon',
    'Simpan dan bagikan rincian budget dalam PDF',
  ],
}

/** Pertanyaan umum di Landing (beda dari GUIDE_FAQ yang berisi cara pakai di dalam app). */
export const LANDING_FAQ: { q: string; a: string }[] = [
  {
    q: 'Kalau beli Bridesmap, dapat apa saja?',
    a: 'Kalian akan mendapatkan semua fitur Bridesmap dalam satu paket. Mulai dari mengatur budget, mencatat vendor dan pembayaran, checklist yang terhubung ke Google Calendar, daftar tamu, Seating Plan, sampai tiga pilihan desain undangan digital.',
  },
  {
    q: 'Bisa dipakai bareng pasangan?',
    a: 'Bisa! Kalian bisa mengundang pasangan melalui WhatsApp dari halaman Pengaturan. Untuk saat ini, setiap akun masih menyimpan rencananya masing-masing. Jika menggunakan satu perangkat, kalian bisa bergantian melalui avatar pasangan di bagian atas.',
  },
  {
    q: 'Bagaimana cara membuat undangan dan melihat konfirmasi tamu?',
    a: 'Pilih salah satu dari empat tema undangan (Tema-1 sampai Tema-4), lalu tambahkan nama, foto, dan cerita kalian. Setelah selesai, bagikan link undangan personal kepada tamu melalui WhatsApp. Konfirmasi kehadiran dan ucapan mereka akan langsung tercatat di daftar tamu.',
  },
  {
    q: 'Bagaimana kalau daftar tamu sudah kami buat di Excel?',
    a: 'Nggak perlu input ulang satu per satu. Kalian bisa langsung mengimpor daftar tamu dari file CSV, Excel, atau kontak HP (.vcf). Seluruh rencana juga bisa diekspor kapan saja melalui Pengaturan.',
  },
  {
    q: 'Apakah data dan rencana pernikahan kami aman tersimpan?',
    a: 'Semua rencana, daftar tamu, vendor, dan foto tersimpan di akun masing-masing. Jadi, kalian bisa membukanya dari perangkat lain tanpa harus mulai mencatat ulang. Jika Google Calendar dihubungkan, hanya judul tugas dan tanggal yang dikirim ke Google.',
  },
  {
    q: 'Apakah Bridesmap bertanggung jawab atas vendor yang kami pilih?',
    a: 'Bridesmap membantu kalian mencatat kesepakatan harga, jadwal pembayaran, dan bukti transfer vendor. Namun, Bridesmap bukan rekening bersama (escrow) dan tidak memberikan jaminan atas vendor yang kalian pilih.',
  },
  {
    q: 'Masih bisa mendapatkan harga Pre Launching?',
    a: 'Sayangnya, promo Pre Launching sudah berakhir. Saat ini kalian masih bisa mendapatkan Bridesmap dengan harga Launching Rp129.000, dari harga normal Rp347.000.',
  },
]

export const LEGAL = {
  maker: 'Tim Bridesmap', // TODO: nama pembuat/perusahaan asli (PRD #11 — identitas pembuat transparan)
  contactEmail: 'bridesmapofficial@gmail.com',
}
