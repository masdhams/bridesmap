import { IcBudget, IcChecklist, IcDocs, IcDeepTalk, IcGuests, IcHome, IcGuide, IcHoneymoon, IcLetter, IcLove, IcRundown, IcSavings, IcSeating, IcSeserahan, IcSettings, IcVendor, IcVision, type AppIcon } from './icons'

export interface NavItem {
  to: string
  label: string
  icon: AppIcon
  desc?: string
}

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Rencana',
    items: [
      { to: '/app', label: 'Beranda', icon: IcHome },
      { to: '/app/checklist', label: 'Checklist', icon: IcChecklist, desc: 'Timeline H-12 bulan s.d. hari-H' },
      { to: '/app/administrasi', label: 'Administrasi', icon: IcDocs, desc: 'Dokumen nikah, KTP, kontrak vendor' },
      { to: '/app/rundown', label: 'Rundown & timeline', icon: IcRundown, desc: 'Akad & resepsi per jam' },
    ],
  },
  {
    title: 'Uang',
    items: [
      { to: '/app/budget', label: 'Budget', icon: IcBudget, desc: 'Termasuk hidden cost' },
      { to: '/app/vendor', label: 'Vendor & pembayaran', icon: IcVendor, desc: 'DP, termin, pelunasan, bukti transfer' },
      { to: '/app/tabungan', label: 'Tabungan nikah', icon: IcSavings, desc: 'Target & estimasi tercapai' },
      { to: '/app/seserahan', label: 'Seserahan', icon: IcSeserahan, desc: 'Barang & status persiapan' },
    ],
  },
  {
    title: 'Tamu',
    items: [
      { to: '/app/tamu', label: 'Tamu & RSVP', icon: IcGuests, desc: 'Impor CSV, rekap porsi katering' },
      { to: '/app/tempat-duduk', label: 'Tempat duduk', icon: IcSeating, desc: 'Meja & penempatan tamu' },
      { to: '/app/undangan', label: 'Undangan digital', icon: IcLetter, desc: 'Pilih template, isi, foto, kirim ke tamu' },
    ],
  },
  {
    title: 'Momen',
    items: [
      { to: '/app/berdua', label: 'Kisah Kita', icon: IcLove, desc: 'Foto, momen, dan ringkasan kalian' },
      { to: '/app/deep-talk', label: 'Deep Talk', icon: IcDeepTalk, desc: 'Satu pertanyaan tiap hari' },
      { to: '/app/surat', label: 'Surat untuk Nanti', icon: IcLetter, desc: 'Ditulis hari ini, dibuka nanti' },
      { to: '/app/vision-board', label: 'Vision board', icon: IcVision, desc: 'Warna, bunga, referensi' },
      { to: '/app/honeymoon', label: 'Honeymoon', icon: IcHoneymoon, desc: 'Itinerary, booking, packing' },
    ],
  },
  {
    title: 'Akun',
    items: [
      { to: '/app/pengaturan', label: 'Pengaturan & pasangan', icon: IcSettings },
      { to: '/app/panduan', label: 'Panduan', icon: IcGuide, desc: 'Mulai cepat & pertanyaan umum' },
    ],
  },
]
