// Tampilan tambahan halaman Vendor: ringkasan angka, kartu kategori (filter + celah yang belum terisi),
// dan tampilan Bandingkan per kategori. Semua dihitung dari data vendor yang sudah ada.
import { Check, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paymentsPaid, vendorCost } from '../lib/selectors'
import type { BudgetCategory, Vendor, VendorStatus } from '../lib/types'
import { cn, daysUntil, fmtDate, rupiah } from '../lib/utils'
import { CategoryIcon, visualKey } from './budgetVisual'

/** Jenis kategori dianggap sama lintas acara ("Venue" di Akad dan di Resepsi = satu jenis). */
export const typeOfCategory = (c: Pick<BudgetCategory, 'key' | 'name'>) => c.key ?? c.name.toLowerCase()

// Kategori ini jarang punya vendor, jadi tidak ditampilkan sebagai "celah".
const NOT_VENDOR = new Set(['cadangan', 'admin'])

export interface VendorType {
  key: string
  name: string
  /** Kategori yang dipakai saat menambah vendor dari kartu kosong (yang pertama untuk jenis ini). */
  categoryId: string
  vkey: string
}

export function vendorTypes(categories: BudgetCategory[], vendors: Vendor[]): VendorType[] {
  const map = new Map<string, VendorType>()
  const add = (c: BudgetCategory, force = false) => {
    const key = typeOfCategory(c)
    if (map.has(key) || (!force && NOT_VENDOR.has(key))) return
    map.set(key, { key, name: c.name, categoryId: c.id, vkey: visualKey({ name: c.name, key: c.key }) })
  }
  for (const c of categories) if (!c.hidden) add(c)
  // Kategori yang sudah dipakai vendor tetap tampil walau jenisnya biasanya tidak dianggap.
  for (const v of vendors) {
    const c = categories.find((x) => x.id === v.categoryId)
    if (c && !c.hidden) add(c, true)
  }
  return [...map.values()]
}

const price = (v: Vendor) => vendorCost(v)
const active = (v: Vendor) => v.status !== 'batal'

export function VendorStats({ vendors, types, typeOf }: { vendors: Vendor[]; types: VendorType[]; typeOf: (v: Vendor) => string }) {
  const covered = new Set(vendors.filter(active).map(typeOf))
  const filled = types.filter((t) => covered.has(t.key)).length
  const booked = vendors.filter((v) => v.status === 'booked')
  const deal = booked.reduce((a, v) => a + price(v), 0)
  const paid = booked.reduce((a, v) => a + paymentsPaid(v), 0)
  const considering = vendors.filter((v) => v.status === 'kandidat' || v.status === 'negosiasi').length
  const stats = [
    { label: 'Kategori terisi', value: `${filled} / ${types.length}`, sub: types.length - filled > 0 ? `${types.length - filled} belum ada vendor` : 'Semua sudah ada vendor' },
    { label: 'Vendor tercatat', value: String(vendors.length), sub: `${booked.length} booked · ${considering} dipertimbangkan` },
    { label: 'Nilai deal', value: rupiah(deal), sub: `${booked.length} vendor booked` },
    { label: 'Sudah dibayar', value: rupiah(paid), sub: deal > 0 ? `${Math.round((paid / deal) * 100)}% dari nilai deal` : 'Belum ada deal' },
  ]
  return (
    <dl className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="card flex min-w-0 flex-col gap-1 p-4">
          <dt className="text-xs text-muted-foreground">{s.label}</dt>
          <dd className="font-serif text-[22px] leading-tight tabular-nums sm:text-[26px]">{s.value}</dd>
          <dd className="text-[11px] leading-tight text-muted-foreground">{s.sub}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Kartu kategori: sekaligus filter. Kategori tanpa vendor tampil putus-putus dengan ajakan menambah. */
export function CategoryTiles({
  types,
  vendors,
  typeOf,
  value,
  onChange,
  onAdd,
}: {
  types: VendorType[]
  vendors: Vendor[]
  typeOf: (v: Vendor) => string
  value: string
  onChange: (key: string) => void
  onAdd: (categoryId: string) => void
}) {
  const base = 'flex min-h-[92px] w-[116px] shrink-0 snap-start flex-col items-start gap-2 rounded-[18px] border p-3 text-left transition-colors duration-200 sm:w-auto'
  return (
    <ul aria-label="Kategori vendor" className="-mx-5 flex snap-x scroll-px-5 gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-5">
      <li className="contents">
        <button type="button" aria-pressed={value === 'semua'} onClick={() => onChange('semua')} className={cn(base, value === 'semua' ? 'border-primary bg-primary-soft' : 'border-border bg-card hover:border-line')}>
          <span className="grid size-9 place-items-center rounded-[12px] bg-primary text-on-primary text-sm font-semibold tabular-nums">{vendors.length}</span>
          <span className="text-[13px] font-semibold leading-tight">Semua kategori</span>
        </button>
      </li>
      {types.map((t) => {
        const mine = vendors.filter((v) => typeOf(v) === t.key)
        const bookedCount = mine.filter((v) => v.status === 'booked').length
        const booked = bookedCount > 0
        const candidates = mine.filter((v) => v.status === 'kandidat' || v.status === 'negosiasi').length
        const empty = mine.length === 0
        return (
          <li key={t.key} className="contents">
            <button
              type="button"
              aria-pressed={value === t.key}
              onClick={() => (empty ? onAdd(t.categoryId) : onChange(value === t.key ? 'semua' : t.key))}
              aria-label={empty ? `${t.name}: belum ada vendor. Tambah vendor` : `${t.name}: ${mine.length} vendor`}
              className={cn(base, empty ? 'border-dashed border-line bg-transparent hover:bg-card' : value === t.key ? 'border-primary bg-primary-soft' : 'border-border bg-card hover:border-line')}
            >
              <CategoryIcon vkey={t.vkey} size={36} className={cn(empty && 'opacity-60')} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] font-semibold leading-tight">{t.name}</span>
                {empty ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
                    <Plus className="size-3" strokeWidth={2.4} aria-hidden /> Belum ada
                  </span>
                ) : booked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
                    <Check className="size-3" strokeWidth={2.6} aria-hidden /> Booked
                    {mine.length > 1 && <span className="font-normal text-muted-foreground"> · {bookedCount} dari {mine.length}</span>}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    {candidates} kandidat
                  </span>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

const STATUS_CHIP: Record<VendorStatus, string> = {
  kandidat: 'bg-muted text-muted-foreground',
  negosiasi: 'bg-warning-soft text-warning',
  booked: 'bg-success-soft text-success',
  batal: 'bg-danger-soft text-danger-ink',
}
const STATUS_TEXT: Record<VendorStatus, string> = { kandidat: 'Kandidat', negosiasi: 'Negosiasi', booked: 'Booked', batal: 'Batal' }

const waLink = (raw: string) => {
  const digits = raw.replace(/[^\d]/g, '').replace(/^0/, '62')
  return /^[+\d][\d\s-]{7,}$/.test(raw.trim()) ? `https://wa.me/${digits}` : null
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 text-[13px]">
    <dt className="shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-right font-medium tabular-nums">{children}</dd>
  </div>
)

/** Perbandingan: vendor satu kategori disusun berdampingan, dari harga terendah. */
export function CompareView({ vendors, types, typeOf }: { vendors: Vendor[]; types: VendorType[]; typeOf: (v: Vendor) => string }) {
  const groups = types
    .map((t) => ({ t, list: vendors.filter((v) => typeOf(v) === t.key) }))
    .filter((g) => g.list.length > 0)
    .map((g) => ({ ...g, list: [...g.list].sort((a, b) => Number(!active(a)) - Number(!active(b)) || (price(a) || Infinity) - (price(b) || Infinity)) }))

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ t, list }) => {
        const priced = list.filter((v) => active(v) && price(v) > 0)
        const cheapest = priced.length >= 2 ? Math.min(...priced.map(price)) : null
        return (
          <section key={t.key} aria-label={`Perbandingan ${t.name}`} className="flex flex-col gap-2.5">
            <h3 className="flex items-center gap-2.5 font-sans text-[15px] font-semibold">
              <CategoryIcon vkey={t.vkey} size={30} /> {t.name}
              <span className="text-xs font-normal text-muted-foreground">{list.length} vendor</span>
            </h3>
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {list.map((v) => {
                const pays = [...v.payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                const dp = pays[0]
                const next = pays.find((p) => !p.paidDate)
                const cost = price(v)
                const paid = paymentsPaid(v)
                const pct = cost > 0 ? Math.min(100, Math.round((paid / cost) * 100)) : 0
                const isCheapest = cheapest !== null && active(v) && cost === cheapest
                const diff = cheapest !== null && active(v) && cost > 0 && cost > cheapest ? cost - cheapest : 0
                const wa = v.contact ? waLink(v.contact) : null
                const overdue = next && daysUntil(next.dueDate) < 0
                return (
                  <li key={v.id} className={cn('card flex flex-col gap-3 p-4', !active(v) && 'opacity-60')}>
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/app/vendor/${v.id}`} className="min-w-0 text-[15px] font-semibold leading-tight hover:text-primary">
                        {v.name}
                      </Link>
                      <span className={cn('chip min-h-6 shrink-0 px-2 text-[11px]', STATUS_CHIP[v.status])}>{STATUS_TEXT[v.status]}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-serif text-[26px] leading-none tabular-nums">{cost > 0 ? rupiah(cost) : '—'}</span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        {v.agreedPrice ? 'Harga disepakati' : 'Penawaran'}
                        {isCheapest && <span className="badge-success min-h-5 px-1.5 text-[10px]">Termurah</span>}
                        {diff > 0 && <span className="tabular-nums">+{rupiah(diff)} dari termurah</span>}
                      </span>
                    </div>
                    <dl className="flex flex-col gap-1.5 border-t border-divider pt-3">
                      <Row label="DP">{dp ? <>{rupiah(dp.amount)} <span className="font-normal text-muted-foreground">· {dp.paidDate ? 'sudah dibayar' : fmtDate(dp.dueDate, 'd MMM')}</span></> : <span className="font-normal text-muted-foreground">Belum diatur</span>}</Row>
                      <Row label="Terbayar">{cost > 0 && pays.length > 0 ? `${rupiah(paid)} (${pct}%)` : <span className="font-normal text-muted-foreground">—</span>}</Row>
                      <Row label="Berikutnya">{next ? <span className={cn(overdue && 'font-semibold text-destructive')}>{next.label} · {fmtDate(next.dueDate, 'd MMM')}</span> : <span className="font-normal text-muted-foreground">{pays.length ? 'Lunas' : '—'}</span>}</Row>
                      <Row label="PIC">{v.pic ? <span className="font-sans">{v.pic}</span> : <span className="font-normal text-muted-foreground">—</span>}</Row>
                      <Row label="Kontak">
                        {v.contact ? (
                          wa ? (
                            <a href={wa} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
                              {v.contact}
                            </a>
                          ) : (
                            v.contact
                          )
                        ) : (
                          <span className="font-normal text-muted-foreground">—</span>
                        )}
                      </Row>
                    </dl>
                    {pays.length > 0 && cost > 0 && (
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Pembayaran ${v.name}`}>
                        <div className={cn('h-full rounded-full transition-[width] duration-700 bar-grow', pct >= 100 ? 'bg-success-solid' : 'bg-primary')} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
