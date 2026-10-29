import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { PlanState } from './store'
import type { Payment, Vendor } from './types'
import { dueFromWedding } from './utils'

export const vendorCost = (v: Vendor) => v.agreedPrice ?? v.quote
export const paymentsPaid = (v: Vendor) => v.payments.filter((p) => p.paidDate).reduce((a, p) => a + p.amount, 0)
export const paymentsScheduled = (v: Vendor) => v.payments.reduce((a, p) => a + p.amount, 0)

export function vendorPayStatus(v: Vendor): 'belum' | 'dp' | 'lunas' {
  const paid = paymentsPaid(v)
  if (paid <= 0) return 'belum'
  return paid >= vendorCost(v) ? 'lunas' : 'dp'
}

export interface CategorySummary {
  id: string
  name: string
  hidden?: boolean
  allocated: number
  committed: number
  paid: number
}

/** Ringkasan per kategori: biaya vendor yang sudah booked otomatis masuk (PRD #26). */
export function budgetSummary(s: Pick<PlanState, 'categories' | 'items' | 'vendors'>): CategorySummary[] {
  return s.categories.map((c) => {
    const items = s.items.filter((i) => i.categoryId === c.id)
    const vendors = s.vendors.filter((v) => v.categoryId === c.id && v.status === 'booked')
    const committed = items.reduce((a, i) => a + i.amount, 0) + vendors.reduce((a, v) => a + vendorCost(v), 0)
    const paid = items.filter((i) => i.paid).reduce((a, i) => a + i.amount, 0) + vendors.reduce((a, v) => a + paymentsPaid(v), 0)
    return { id: c.id, name: c.name, hidden: c.hidden, allocated: c.allocated, committed, paid }
  })
}

export function budgetTotals(sum: CategorySummary[]) {
  return sum.reduce(
    (a, c) => ({ allocated: a.allocated + c.allocated, committed: a.committed + c.committed, paid: a.paid + c.paid }),
    { allocated: 0, committed: 0, paid: 0 },
  )
}

export interface UpcomingPayment extends Payment {
  vendorId: string
  vendorName: string
}

export function upcomingPayments(vendors: Vendor[]): UpcomingPayment[] {
  return vendors
    .filter((v) => v.status !== 'batal')
    .flatMap((v) => v.payments.filter((p) => !p.paidDate).map((p) => ({ ...p, vendorId: v.id, vendorName: v.name })))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

const FULL_LEAD = 365 // timeline bawaan dirancang untuk persiapan 12 bulan
const FINAL_STRETCH = 30 // sebulan terakhir tidak dipadatkan: tugasnya memang terikat hari-H

/**
 * Tanggal tugas. Tugas bawaan dirancang untuk 12 bulan; kalau hari-H kurang dari itu, tugas yang lebih awal
 * dipadatkan (urutan tetap) agar tugas pertama jatuh hari ini dan tidak semuanya langsung "terlambat".
 * Tugas buatan sendiri (`custom`) dan tugas sesudah hari-H memakai tanggal persis.
 */
export function taskDue(weddingDate: string, offsetDays: number, custom?: boolean) {
  if (!weddingDate) return ''
  if (custom || offsetDays >= 0) return dueFromWedding(weddingDate, offsetDays)
  const left = differenceInCalendarDays(parseISO(weddingDate), new Date())
  const lead = -offsetDays
  if (left <= 0 || left >= FULL_LEAD) return dueFromWedding(weddingDate, offsetDays)
  let newLead = lead
  if (left <= FINAL_STRETCH) newLead = Math.round((lead * left) / FULL_LEAD)
  else if (lead > FINAL_STRETCH) newLead = Math.round(FINAL_STRETCH + ((lead - FINAL_STRETCH) * (left - FINAL_STRETCH)) / (FULL_LEAD - FINAL_STRETCH))
  return dueFromWedding(weddingDate, -newLead)
}

/** Selisih hari tugas terhadap hari-H setelah penyesuaian (untuk label "H-60"). */
export const taskOffset = (weddingDate: string, offsetDays: number, custom?: boolean) =>
  weddingDate ? differenceInCalendarDays(parseISO(taskDue(weddingDate, offsetDays, custom)), parseISO(weddingDate)) : offsetDays

/** True kalau hari-H kurang dari 12 bulan lagi, sehingga timeline bawaan dipadatkan. */
export const timelineCompressed = (weddingDate: string) => {
  if (!weddingDate) return false
  const left = differenceInCalendarDays(parseISO(weddingDate), new Date())
  return left > 0 && left < FULL_LEAD
}

export function guestStats(guests: PlanState['guests']) {
  const count = (st: string) => guests.filter((g) => g.rsvp === st).reduce((a, g) => a + g.pax, 0)
  const totalPax = guests.reduce((a, g) => a + g.pax, 0)
  return { invited: guests.length, totalPax, hadir: count('hadir'), tidak: count('tidak'), ragu: count('ragu'), belum: count('belum') }
}

/** Nama kategori; kalau ada beberapa acara, ditambah nama acaranya agar tidak ambigu ("Venue · Resepsi"). */
export function categoryLabel(c: { name: string; eventId?: string }, events: { id: string; name: string }[]) {
  const ev = events.length > 1 ? events.find((e) => e.id === c.eventId) : undefined
  return ev ? `${c.name} · ${ev.name}` : c.name
}
