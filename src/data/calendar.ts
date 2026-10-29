// Hari libur nasional Indonesia (perkiraan). Tanggal hari besar keagamaan mengikuti
// SKB 3 Menteri yang terbit tiap tahun — TODO: perbarui saat SKB resmi keluar.
export const HOLIDAYS: Record<string, string> = {
  '2026-01-01': 'Tahun Baru Masehi',
  '2026-01-16': "Isra Mi'raj",
  '2026-02-17': 'Tahun Baru Imlek',
  '2026-03-19': 'Hari Suci Nyepi',
  '2026-03-20': 'Idul Fitri',
  '2026-03-21': 'Idul Fitri',
  '2026-04-03': 'Wafat Yesus Kristus',
  '2026-04-05': 'Paskah',
  '2026-05-01': 'Hari Buruh',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-27': 'Idul Adha',
  '2026-05-31': 'Waisak',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-06-16': 'Tahun Baru Islam',
  '2026-08-17': 'Hari Kemerdekaan RI',
  '2026-08-25': 'Maulid Nabi Muhammad',
  '2026-12-25': 'Hari Natal',
  '2027-01-01': 'Tahun Baru Masehi',
  '2027-01-05': "Isra Mi'raj",
  '2027-02-06': 'Tahun Baru Imlek',
  '2027-03-08': 'Hari Suci Nyepi',
  '2027-03-10': 'Idul Fitri',
  '2027-03-11': 'Idul Fitri',
  '2027-03-26': 'Wafat Yesus Kristus',
  '2027-03-28': 'Paskah',
  '2027-05-01': 'Hari Buruh',
  '2027-05-06': 'Kenaikan Yesus Kristus',
  '2027-05-17': 'Idul Adha',
  '2027-05-20': 'Waisak',
  '2027-06-01': 'Hari Lahir Pancasila',
  '2027-06-06': 'Tahun Baru Islam',
  '2027-08-15': 'Maulid Nabi Muhammad',
  '2027-08-17': 'Hari Kemerdekaan RI',
  '2027-12-25': 'Hari Natal',
}

const hijriFmt = (() => {
  try {
    return new Intl.DateTimeFormat('id-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return null
  }
})()

const hijriParts = (() => {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric' })
  } catch {
    return null
  }
})()

export function hijriLabel(d: Date): string {
  return hijriFmt ? hijriFmt.format(d) : ''
}

export function hijriMonthDay(d: Date): { month: number; day: number } | null {
  if (!hijriParts) return null
  const parts = hijriParts.formatToParts(d)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return Number.isFinite(month) ? { month, day } : null
}

export interface DateNote {
  tone: 'warn' | 'info' | 'good'
  text: string
}

/** Catatan pertimbangan untuk sebuah tanggal (hari libur, bulan Hijriah, akhir pekan). */
export function dateNotes(d: Date, iso: string): DateNote[] {
  const notes: DateNote[] = []
  const h = HOLIDAYS[iso]
  if (h) notes.push({ tone: 'warn', text: `Libur nasional: ${h}. Tamu luar kota terbantu, tapi harga vendor & venue biasanya lebih tinggi.` })
  const dow = d.getDay()
  if (dow === 0 || dow === 6) notes.push({ tone: 'good', text: 'Akhir pekan — tamu lebih mudah datang. Venue cepat penuh, booking lebih awal.' })
  const hm = hijriMonthDay(d)
  if (hm) {
    if (hm.month === 9) notes.push({ tone: 'warn', text: 'Bulan Ramadan — jarang dipilih untuk resepsi; katering & jam acara perlu menyesuaikan.' })
    if (hm.month === 10) notes.push({ tone: 'info', text: 'Bulan Syawal — musim nikah. Vendor cepat penuh dan harga cenderung naik.' })
    if (hm.month === 12) notes.push({ tone: 'info', text: 'Bulan Dzulhijjah — banyak pasangan memilih bulan ini; booking lebih awal.' })
    if (hm.month === 1) notes.push({ tone: 'info', text: 'Bulan Muharram (Suro) — sebagian keluarga Jawa menghindari menikah di bulan ini. Diskusikan dengan keluarga.' })
  }
  return notes
}
