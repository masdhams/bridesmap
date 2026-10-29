export type Partner = 'A' | 'B'

export interface Profile {
  partnerA: string
  partnerB: string
  weddingDate: string // yyyy-MM-dd
  city: string
  totalBudget: number
  guestEstimate: number
  onboarded: boolean
  partnerInvited: boolean
  /** Daftar dokumen awal di Administrasi sudah dibuat (supaya tidak dibuat ulang setelah dihapus). */
  docsSeeded?: boolean
  /** Tanggal masih perkiraan (baru bulannya saja). */
  dateTentative?: boolean
  /** Foto pasangan di halaman Berdua (sudah dikompres). */
  couplePhoto?: string
  /** Foto profil masing-masing pasangan (dikompres). Kosong = inisial nama. */
  photoA?: string
  photoB?: string
  /** Foto latar kartu hitung mundur di Beranda (ditampilkan transparan). */
  heroPhoto?: string
  /** Titik fokus foto latar (persen), supaya potongannya bisa diatur. */
  heroPhotoPos?: PhotoPos
  createdAt: string
}

/** Titik fokus foto sampul: 0–100 persen dari kiri dan atas. */
export interface PhotoPos {
  x: number
  y: number
}

/** Momen di "Perjalanan kita" (halaman Berdua). */
export interface Moment {
  id: string
  title: string
  date: string // yyyy-MM-dd
  photo?: string
}

export type Assignee = Partner | 'both'

/** Jenis acara untuk alokasi budget (PRD #39). Acara adat bisa lebih dari satu (siraman, midodareni, dll.). */
export type EventKind = 'lamaran' | 'akad' | 'resepsi' | 'adat'

export interface WeddingEvent {
  id: string
  kind: EventKind
  name: string
  /** Budget acara dalam Rupiah. Persentase terhadap total dihitung dari angka ini. */
  budget: number
}

export interface BudgetCategory {
  id: string
  name: string
  allocated: number
  /** Kategori ini milik acara tertentu (alokasi per acara, PRD #39). Kosong = kategori umum/kustom. */
  eventId?: string
  /** Kunci kategori default (venue, katering, …) — dipakai untuk "kembalikan ke default". */
  key?: string
  /** Kategori biaya tersembunyi — ditampilkan dengan badge "sering terlewat". */
  hidden?: boolean
  hiddenKey?: string
}

export interface BudgetItem {
  id: string
  categoryId: string
  name: string
  amount: number
  paid: boolean
  note?: string
}

export type VendorStatus = 'kandidat' | 'negosiasi' | 'booked' | 'batal'

export interface Payment {
  id: string
  label: string
  amount: number
  dueDate: string
  paidDate?: string
  proof?: string // data URL bukti transfer
}

export interface Vendor {
  id: string
  categoryId: string
  name: string
  contact?: string
  /** Narahubung di vendor (nama orang yang kalian hubungi). */
  pic?: string
  link?: string
  quote: number
  agreedPrice?: number
  status: VendorStatus
  notes?: string
  payments: Payment[]
}

export interface SavingsEntry {
  id: string
  date: string
  amount: number
  by: Partner
  note?: string
}

export interface Savings {
  target: number
  monthlyPlan: number
  entries: SavingsEntry[]
}

export interface Task {
  id: string
  title: string
  phase: string
  offsetDays: number // relatif ke hari-H (negatif = sebelum)
  done: boolean
  doneBy?: Partner
  assignee?: Assignee
  note?: string
  custom?: boolean
  /** Kategori yang dipilih pengguna (kunci dari lib/taskCategory). Kosong = ditebak dari judul. */
  category?: string
  /** True kalau tugas ini ditandai selesai otomatis dari halaman Administrasi (bukan dicentang manual). */
  autoDone?: boolean
}

export type DocStatus = 'belum' | 'proses' | 'ada'

/** Satu dokumen di halaman Administrasi. Bisa terhubung ke satu tugas checklist. */
export interface DocItem {
  id: string
  name: string
  group: string
  /** Siapa pemilik / penanggung jawab dokumen. */
  owner: Assignee
  status: DocStatus
  /** Tautan ke dokumen (mis. Google Drive). */
  url?: string
  /** Foto/scan dokumen (data URL, sudah dikompres). */
  file?: string
  fileName?: string
  note?: string
  /** Tugas checklist yang ikut selesai kalau semua dokumennya berstatus "ada". */
  taskId?: string
  updatedAt?: string
  updatedBy?: Partner
}

export type RsvpStatus = 'belum' | 'hadir' | 'tidak' | 'ragu'
export type GuestSide = 'A' | 'B' | 'bersama'

export interface Guest {
  id: string
  name: string
  group: string
  side: GuestSide
  phone?: string
  pax: number
  rsvp: RsvpStatus
  diet?: string
  household?: string
  tableId?: string
}

export interface SeatTable {
  id: string
  name: string
  capacity: number
  x?: number
  y?: number
}

export interface SeserahanItem {
  id: string
  name: string
  from: Partner
  budget: number
  ready: boolean
}

export interface RundownItem {
  id: string
  time: string
  end?: string
  activity: string
  pic?: string
  note?: string
}

export interface RundownEvent {
  id: string
  name: string
  date?: string
  location?: string
  items: RundownItem[]
}

export interface VisionItem {
  id: string
  type: 'note' | 'image'
  content: string
  caption?: string
}

export interface VisionBoard {
  id: string
  name: string
  colors: string[]
  items: VisionItem[]
}

export interface DeepTalkAnswer {
  text: string
  at: string
}

export interface TimeCapsule {
  id: string
  from: Partner
  /** Penerima: berdua, atau salah satu (bisa diri sendiri). */
  to?: Assignee
  title: string
  message: string
  photo?: string
  photos?: string[]
  unlockDate: string
  createdAt: string
  /** Kapan surat pertama kali dibuka (kosong = belum pernah dibuka). */
  openedAt?: string
}

export interface CheckItem {
  id: string
  label: string
  done: boolean
  /** Untuk pemesanan honeymoon: total & yang sudah dibayar. */
  amount?: number
  paid?: number
}

export interface ItineraryItem {
  id: string
  time: string
  activity: string
  note?: string
  cost?: number
  highlight?: boolean
}

export interface ItineraryDay {
  id: string
  day: number
  title?: string
  /** Catatan lama (sebelum itinerary per jam). */
  plan?: string
  items?: ItineraryItem[]
}

export interface Honeymoon {
  destination: string
  /** Foto sampul destinasi (ditampilkan transparan di atas warna Sirih). */
  coverPhoto?: string
  coverPos?: PhotoPos
  startDate?: string
  endDate?: string
  budget: number
  itinerary: ItineraryDay[]
  bookings: CheckItem[]
  packing: CheckItem[]
}

export type WebsiteTheme = 'modern' | 'jawa' | 'islami' | 'tionghoa'

export interface Website {
  slug: string
  theme: WebsiteTheme
  story: string
  akadTime: string
  akadPlace: string
  resepsiTime: string
  resepsiPlace: string
  mapsUrl: string
  rsvpEnabled: boolean
}

export interface RsvpResponse {
  id: string
  name: string
  attending: boolean
  pax: number
  diet?: string
  message?: string
  at: string
}

/* ---------- Undangan digital (PRD #33) ---------- */

export type InvitationTemplate = 'sage' | 'noir' | 'red-retro'
export type InvitationTimezone = 'WIB' | 'WITA' | 'WIT'

/** Isian mempelai. Yang kosong diisi otomatis dari profil (nama). */
export interface InvitationPersonInput {
  nick?: string
  full?: string
  childOf?: string
  parents?: string
  instagram?: string
}

export interface InvitationEventInput {
  id: string
  name: string
  /** "08:00" */
  start: string
  end: string
  venue: string
  address: string
  /** Tautan Google Maps (mis. https://maps.app.goo.gl/…). Kosong = dicari dari nama tempat & alamat. */
  mapsUrl?: string
}

export interface InvitationStoryInput {
  id: string
  year: string
  title: string
  text: string
  photo?: string
}

export interface InvitationAccount {
  id: string
  bank: string
  number: string
  holder: string
}

/** Pengaturan undangan pasangan. Tanggal & kota mengikuti profil; acara mengikuti rundown kecuali diatur sendiri. */
export interface InvitationSettings {
  template: InvitationTemplate
  /** Pasangan A dan B. Tampil sebagai mempelai pertama dan kedua. */
  personA: InvitationPersonInput
  personB: InvitationPersonInput
  timezone: InvitationTimezone
  quote: { text: string; by: string }
  story: InvitationStoryInput[]
  /** Kosong = disusun dari rundown. */
  events?: InvitationEventInput[]
  mapsQuery?: string
  rsvpDeadline?: string
  accounts: InvitationAccount[]
  giftAddress: string
  families: string
  photos: {
    hero?: string
    heroSmall?: string
    personA?: string
    personB?: string
    envelope1?: string
    envelope2?: string
    closing?: string
    gallery: string[]
  }
}

/** Ucapan tamu dari undangan digital. */
export interface GuestWishEntry {
  id: string
  name: string
  msg: string
  city?: string
  attend?: boolean
  at: string
}
