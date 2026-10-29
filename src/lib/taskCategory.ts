// Pengelompokan tugas per kategori untuk tampilan "Kategori" di Checklist.
// Pilihan pengguna (task.category) selalu diutamakan. Kalau kosong, kategori ditebak dari judul tugas
// dengan aturan di bawah. Aturan yang lebih spesifik dicek lebih dulu.

export const CATEGORIES = [
  { key: 'rencana', label: 'Rencana & keputusan berdua', hint: 'Konsep, tanggal, dan anggaran yang disepakati bersama' },
  { key: 'dokumen', label: 'Dokumen & administrasi', hint: 'Berkas nikah, KUA, KTP/KK, dan kesehatan' },
  { key: 'vendor', label: 'Vendor & venue', hint: 'Booking, survei, dan koordinasi vendor' },
  { key: 'uang', label: 'Keuangan & pembayaran', hint: 'Tabungan, pelunasan, dan biaya' },
  { key: 'busana', label: 'Busana & penampilan', hint: 'Fitting, rias, cincin, dan seragam' },
  { key: 'tamu', label: 'Undangan & tamu', hint: 'Daftar tamu, undangan, RSVP, dan tempat duduk' },
  { key: 'acara', label: 'Acara & hari-H', hint: 'Rundown, seserahan, dan hari pelaksanaan' },
  { key: 'lainnya', label: 'Lainnya', hint: '' },
] as const

export type CategoryKey = (typeof CATEGORIES)[number]['key']

// Kata pendek memakai batas kata (\b) supaya tidak cocok di dalam kata lain (mis. "MUA" di "semua").
const RULES: { key: CategoryKey; re: RegExp }[] = [
  { key: 'dokumen', re: /dokumen|\bKUA\b|\bKTP|\bN1\b|buku nikah|izin|biaya nikah|mahar|kesehatan pranikah/i },
  { key: 'acara', re: /adat|rundown|hari-H|nikmati|istirahat|seserahan|hantaran|ucapan/i },
  { key: 'rencana', re: /konsep|sepakati|tanggal|honeymoon|paspor|bulan madu/i },
  { key: 'uang', re: /lunasi|pembayaran|tabungan|budget|keuangan/i },
  { key: 'busana', re: /busana|fitting|\bMUA\b|seragam|cincin|\brias\b/i },
  { key: 'tamu', re: /undangan|save-the-date|tamu|RSVP|tempat duduk|souvenir/i },
  { key: 'vendor', re: /venue|katering|konsumsi|foto|videografer|prewedding|dekor|\bMC\b|\bWO\b|organizer|sound|hiburan|booking|survei|technical|vendor|tes food|pelunasan/i },
]

export function categoryOf(title: string): CategoryKey {
  for (const r of RULES) if (r.re.test(title)) return r.key
  return 'lainnya'
}

/** Kategori tugas: pilihan pengguna kalau ada, selain itu ditebak dari judul. */
export function taskCategoryOf(t: { title: string; category?: string }): CategoryKey {
  const picked = CATEGORIES.find((c) => c.key === t.category)
  return picked ? picked.key : categoryOf(t.title)
}
