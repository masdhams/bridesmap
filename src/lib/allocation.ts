// Logika alokasi budget per acara (PRD #39). Fungsi murni: dipakai store (rencana asli) dan kalkulator gratis (tanpa akun).
//
// Hierarki: total budget → budget tiap acara → alokasi tiap kategori di acara itu.
//  • Persen dan Rupiah selalu saling menghitung ulang (nominal adalah sumber kebenaran, persen diturunkan).
//  • Mengubah budget acara menskalakan kategorinya dengan proporsi tetap.
//  • Total TIDAK dipaksa 100%: selisihnya tampil sebagai "belum teralokasi" atau peringatan melebihi budget.
import { ALLOCATION_DEFAULTS, EVENT_KINDS, HIDDEN_COSTS } from '../data/content'
import type { BudgetCategory, EventKind, WeddingEvent } from './types'
import { uid } from './utils'

export interface AllocState {
  events: WeddingEvent[]
  categories: BudgetCategory[]
}

const STEP = 10_000
const roundTo = (n: number, step = STEP) => Math.round(n / step) * step

export const kindLabel = (k: EventKind) => EVENT_KINDS.find((e) => e.kind === k)?.label ?? k
export const kindWeight = (k: EventKind) => EVENT_KINDS.find((e) => e.kind === k)?.weight ?? 10

/** Persentase → Rupiah, dibulatkan ke 10 rb; sisa pembulatan masuk ke kategori terbesar agar jumlahnya pas. */
export function defaultCategories(kind: EventKind, eventId: string, budget: number): BudgetCategory[] {
  const rows = ALLOCATION_DEFAULTS.map((d) => ({ d, amount: roundTo((budget * d.pct[kind]) / 100) }))
  const diff = budget - rows.reduce((a, r) => a + r.amount, 0)
  if (rows.length && Math.abs(diff) > 0) {
    const biggest = rows.reduce((a, r) => (r.amount > a.amount ? r : a), rows[0])
    biggest.amount = Math.max(0, biggest.amount + diff)
  }
  return rows.map(({ d, amount }) => ({ id: uid(), name: d.name, allocated: amount, eventId, key: d.key }))
}

/** Bagi `total` ke daftar acara menurut bobot awal (asumsi — PRD belum menetapkan pembagian antar acara). */
export function buildAllocation(total: number, picks: { kind: EventKind; name?: string }[]): AllocState {
  const list = picks.length ? picks : [{ kind: 'akad' as EventKind }, { kind: 'resepsi' as EventKind }]
  const weights = list.map((p) => kindWeight(p.kind))
  const sum = weights.reduce((a, b) => a + b, 0)
  const budgets = list.map((_, i) => roundTo((total * weights[i]) / sum))
  const diff = total - budgets.reduce((a, b) => a + b, 0)
  const big = budgets.indexOf(Math.max(...budgets))
  budgets[big] = Math.max(0, budgets[big] + diff)

  const events: WeddingEvent[] = list.map((p, i) => ({ id: uid(), kind: p.kind, name: p.name?.trim() || kindLabel(p.kind), budget: budgets[i] }))
  const categories = events.flatMap((e) => defaultCategories(e.kind, e.id, e.budget))
  return { events, categories }
}

/** Skala dibulatkan ke Rp 1.000 supaya angka tetap rapi saat persen/total diubah. */
const scale = (n: number, ratio: number) => roundTo(n * ratio, 1000)

/** Ubah budget satu acara: kategori ikut diskalakan, persentase per kategori tetap.
 *  Kalau sebelumnya seluruh budget acara sudah teralokasi, sisa pembulatan dimasukkan ke kategori terbesar agar tetap pas. */
export function setEventBudget(state: AllocState, eventId: string, budget: number): AllocState {
  const ev = state.events.find((e) => e.id === eventId)
  if (!ev) return state
  const next = Math.max(0, Math.round(budget))
  const own = state.categories.filter((c) => c.eventId === eventId)
  const sum = own.reduce((a, c) => a + c.allocated, 0)
  const fully = ev.budget > 0 && sum === ev.budget
  const ratio = ev.budget > 0 ? next / ev.budget : 0

  let categories = state.categories.map((c) => {
    if (c.eventId !== eventId) return c
    // Acara yang tadinya 0: bagi ulang dengan persentase default supaya tidak tetap kosong.
    if (ev.budget <= 0 || sum <= 0) {
      const pct = ALLOCATION_DEFAULTS.find((d) => d.key === c.key)?.pct[ev.kind]
      return pct != null ? { ...c, allocated: roundTo((next * pct) / 100) } : c
    }
    return { ...c, allocated: scale(c.allocated, ratio) }
  })

  if (fully || ev.budget <= 0) {
    const mine = categories.filter((c) => c.eventId === eventId)
    const diff = next - mine.reduce((a, c) => a + c.allocated, 0)
    if (diff !== 0 && mine.length) {
      const big = mine.reduce((a, c) => (c.allocated > a.allocated ? c : a), mine[0])
      categories = categories.map((c) => (c.id === big.id ? { ...c, allocated: Math.max(0, c.allocated + diff) } : c))
    }
  }
  return { events: state.events.map((e) => (e.id === eventId ? { ...e, budget: next } : e)), categories }
}

export function setCategoryAllocation(state: AllocState, categoryId: string, allocated: number): AllocState {
  return { ...state, categories: state.categories.map((c) => (c.id === categoryId ? { ...c, allocated: Math.max(0, Math.round(allocated)) } : c)) }
}

/** Ubah total budget: persentase acara & kategori dipertahankan, nominalnya mengikuti. */
export function setTotal(state: AllocState, oldTotal: number, newTotal: number): AllocState {
  if (oldTotal <= 0 || newTotal < 0) return state
  const ratio = newTotal / oldTotal
  return state.events.reduce((st, e) => setEventBudget(st, e.id, scale(e.budget, ratio)), state)
}

/** Kembalikan kategori satu acara ke persentase default (id kategori dipertahankan agar vendor tidak yatim). */
export function resetEvent(state: AllocState, eventId: string): AllocState {
  const ev = state.events.find((e) => e.id === eventId)
  if (!ev) return state
  const fresh = defaultCategories(ev.kind, eventId, ev.budget)
  return {
    ...state,
    categories: state.categories.map((c) => {
      if (c.eventId !== eventId) return c
      const f = fresh.find((x) => x.key && x.key === c.key)
      return f ? { ...c, allocated: f.allocated } : c
    }),
  }
}

/** Tambah acara. Budget awalnya diambil dari yang belum teralokasi (kalau ada). */
export function addEvent(state: AllocState, kind: EventKind, name: string, available: number): { state: AllocState; id: string } {
  const id = uid()
  const budget = Math.max(0, roundTo(available))
  const ev: WeddingEvent = { id, kind, name: name.trim() || kindLabel(kind), budget }
  return { id, state: { events: [...state.events, ev], categories: [...state.categories, ...defaultCategories(kind, id, budget)] } }
}

export function removeEvent(state: AllocState, eventId: string): AllocState {
  return { events: state.events.filter((e) => e.id !== eventId), categories: state.categories.filter((c) => c.eventId !== eventId) }
}

export interface AllocTotals {
  eventsTotal: number
  reserved: number
  allocated: number
  /** Positif = belum teralokasi, negatif = melebihi budget. */
  free: number
}

export function allocTotals(total: number, events: WeddingEvent[], reserved: number): AllocTotals {
  const eventsTotal = events.reduce((a, e) => a + e.budget, 0)
  const allocated = eventsTotal + reserved
  return { eventsTotal, reserved, allocated, free: total - allocated }
}

export const eventCategoryTotal = (categories: BudgetCategory[], eventId: string) => categories.filter((c) => c.eventId === eventId).reduce((a, c) => a + c.allocated, 0)

/** Persen dengan satu desimal, mis. 22,5. */
export const pctOf = (value: number, base: number) => (base > 0 ? Math.round((value / base) * 1000) / 10 : 0)

/** Total biaya tersembunyi yang dicentang dari awal (dibulatkan ke Rp 10 rb, sama seperti saat dibuat jadi kategori). */
export const defaultReserved = (budget: number, guests: number) =>
  HIDDEN_COSTS.filter((h) => h.defaultOn).reduce((a, h) => a + roundTo(h.estimate({ budget, guests })), 0)
