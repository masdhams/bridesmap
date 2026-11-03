// Laporan budget lengkap untuk dicetak / disimpan sebagai PDF. Hanya tampil saat mencetak (kelas print-only).
import { budgetSummary, budgetTotals, paymentsPaid, vendorCost, type CategorySummary } from '../lib/selectors'
import { usePlan } from '../lib/store'
import type { Vendor, VendorStatus } from '../lib/types'
import { fmtDate, rupiah } from '../lib/utils'

const STATUS: Record<VendorStatus, string> = { kandidat: 'Kandidat', negosiasi: 'Negosiasi', booked: 'Booked', batal: 'Batal' }
const d = (iso: string) => fmtDate(iso, 'd MMM yyyy')

function Row({ left, right, muted, bold }: { left: React.ReactNode; right?: React.ReactNode; muted?: boolean; bold?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${bold ? 'font-semibold' : ''} ${muted ? 'text-neutral-600' : ''}`}>
      <span className="min-w-0">{left}</span>
      {right !== undefined && <span className="shrink-0 tabular-nums">{right}</span>}
    </div>
  )
}

function VendorLines({ v }: { v: Vendor }) {
  const paid = paymentsPaid(v)
  return (
    <li className="py-0.5">
      <Row left={<>{v.name}{v.pic ? <span className="text-neutral-600"> · PIC {v.pic}</span> : null}</>} right={rupiah(vendorCost(v))} />
      <div className="ml-4 text-neutral-600">
        <Row left={`Sudah dibayar ${rupiah(paid)} dari ${rupiah(vendorCost(v))}`} />
        {v.payments.map((p) => (
          <Row key={p.id} left={`${p.label}, ${p.paidDate ? `lunas ${d(p.paidDate)}` : `jatuh tempo ${d(p.dueDate)}`}`} right={rupiah(p.amount)} />
        ))}
      </div>
    </li>
  )
}

function CategoryBlock({ c }: { c: CategorySummary }) {
  const { items, vendors } = usePlan()
  const myItems = items.filter((i) => i.categoryId === c.id)
  const booked = vendors.filter((v) => v.categoryId === c.id && v.status === 'booked')
  const left = c.allocated - c.committed
  return (
    <div className="break-inside-avoid border-t border-neutral-300 py-2">
      <Row bold left={<>{c.name}{c.allocated > 0 && c.committed > c.allocated ? <span className="font-normal text-neutral-600"> (melebihi alokasi)</span> : null}</>} right={`${rupiah(c.committed)} / ${rupiah(c.allocated)}`} />
      <p className="m-0 text-neutral-600">
        Sudah dibayar {rupiah(c.paid)} · {left >= 0 ? `sisa alokasi ${rupiah(left)}` : `lewat ${rupiah(-left)}`}
      </p>
      {booked.length === 0 && myItems.length === 0 ? (
        <p className="m-0 mt-1 text-neutral-500">Belum ada vendor atau biaya.</p>
      ) : (
        <ul className="m-0 mt-1 list-none p-0">
          {booked.map((v) => (
            <VendorLines key={v.id} v={v} />
          ))}
          {myItems.map((i) => (
            <li key={i.id} className="py-0.5">
              <Row left={<>{i.name}<span className="text-neutral-600"> · {i.paid ? 'lunas' : 'belum dibayar'}</span></>} right={rupiah(i.amount)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function BudgetReport() {
  const s = usePlan()
  const sum = budgetSummary(s)
  const t = budgetTotals(sum)
  const total = s.profile.totalBudget
  const left = total - t.committed
  const eventOf = (id: string) => s.categories.find((c) => c.id === id)?.eventId
  const catName = (id: string) => s.categories.find((c) => c.id === id)?.name ?? 'Tanpa kategori'
  const groups = [
    ...s.events.map((e) => ({ key: e.id, title: `${e.name} (budget ${rupiah(e.budget)})`, list: sum.filter((c) => eventOf(c.id) === e.id) })),
    { key: 'umum', title: s.events.length ? 'Kategori lain' : 'Kategori', list: sum.filter((c) => !c.hidden && !eventOf(c.id)) },
    { key: 'hidden', title: 'Hidden cost', list: sum.filter((c) => c.hidden) },
  ].filter((g) => g.list.length > 0)
  const others = s.vendors.filter((v) => v.status !== 'booked')
  const upcoming = s.vendors
    .filter((v) => v.status === 'booked')
    .flatMap((v) => v.payments.filter((p) => !p.paidDate).map((p) => ({ v, p })))
    .sort((a, b) => a.p.dueDate.localeCompare(b.p.dueDate))

  return (
    <div className="print-only text-[11.5px] leading-snug text-black">
      <p className="m-0 font-serif text-2xl">Budget pernikahan {s.profile.partnerA} &amp; {s.profile.partnerB}</p>
      <p className="m-0 mb-3 text-neutral-600">
        Hari-H {fmtDate(s.profile.weddingDate, 'd MMMM yyyy')} · dicetak {fmtDate(new Date().toISOString().slice(0, 10), 'd MMMM yyyy')}
      </p>

      <section className="break-inside-avoid rounded border border-neutral-300 p-3">
        <Row bold left="Total budget" right={rupiah(total)} />
        <Row left="Disepakati (vendor booked dan biaya yang dicatat)" right={rupiah(t.committed)} />
        <Row left="Sudah dibayar" right={rupiah(t.paid)} />
        <Row bold left={left < 0 ? 'Melewati budget' : 'Sisa budget'} right={rupiah(Math.abs(left))} />
      </section>

      {s.events.length > 0 && (
        <section className="mt-4 break-inside-avoid">
          <p className="m-0 mb-1 font-semibold uppercase tracking-wide">Ringkasan per acara</p>
          {s.events.map((e) => {
            const cs = sum.filter((c) => eventOf(c.id) === e.id)
            const used = cs.reduce((a, c) => a + c.committed, 0)
            const paid = cs.reduce((a, c) => a + c.paid, 0)
            return <Row key={e.id} left={`${e.name}, budget ${rupiah(e.budget)}, dibayar ${rupiah(paid)}`} right={`terpakai ${rupiah(used)}`} />
          })}
        </section>
      )}

      {groups.map((g) => (
        <section key={g.key} className="mt-4">
          <p className="m-0 mb-1 font-semibold uppercase tracking-wide">{g.title}</p>
          {g.list.map((c) => (
            <CategoryBlock key={c.id} c={c} />
          ))}
        </section>
      ))}

      {upcoming.length > 0 && (
        <section className="mt-4 break-inside-avoid">
          <p className="m-0 mb-1 font-semibold uppercase tracking-wide">Pembayaran yang belum lunas</p>
          {upcoming.map(({ v, p }) => (
            <Row key={p.id} left={`${d(p.dueDate)} · ${v.name}, ${p.label}`} right={rupiah(p.amount)} />
          ))}
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-4">
          <p className="m-0 mb-1 font-semibold uppercase tracking-wide">Vendor lain (belum booked)</p>
          {others.map((v) => (
            <Row key={v.id} left={`${v.name} · ${catName(v.categoryId)} · ${STATUS[v.status]}`} right={`penawaran ${rupiah(v.quote)}`} />
          ))}
        </section>
      )}
    </div>
  )
}
