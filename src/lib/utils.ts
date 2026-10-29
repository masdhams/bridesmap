import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const rupiahFmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
export const rupiah = (n: number) => rupiahFmt.format(Math.round(n || 0))

/** Format ringkas: Rp12,5 jt / Rp850 rb. */
export function rupiahShort(n: number) {
  const v = Math.round(n || 0)
  if (Math.abs(v) >= 1_000_000_000) return `Rp${(v / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`
  if (Math.abs(v) >= 1_000_000) return `Rp${(v / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  if (Math.abs(v) >= 1_000) return `Rp${(v / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`
  return `Rp${v}`
}

export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

export function fmtDate(iso?: string, pattern = 'd MMM yyyy') {
  if (!iso) return '-'
  try {
    return format(parseISO(iso), pattern, { locale: localeId })
  } catch {
    return iso
  }
}

export const daysUntil = (iso?: string) => (iso ? differenceInCalendarDays(parseISO(iso), new Date()) : NaN)

export const dueFromWedding = (weddingDate: string, offsetDays: number) =>
  format(addDays(parseISO(weddingDate), offsetDays), 'yyyy-MM-dd')

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/** Kompres gambar ke JPEG data URL supaya muat di penyimpanan lokal. */
export function compressImage(file: File, maxSize = 1024, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Gambar tidak bisa dibaca'))
    }
    img.src = url
  })
}

export function downloadFile(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Parse angka dari input rupiah ("12.500.000" → 12500000). */
export const parseAmount = (s: string) => Number(String(s).replace(/[^\d]/g, '')) || 0
