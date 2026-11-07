// Laporan kalkulator budget untuk disimpan sebagai PDF. Hanya tampil saat mencetak.
import type { BudgetCategory, WeddingEvent } from '../../lib/types'
import { rupiah } from '../../lib/utils'

function Row({ left, right, bold, muted }: { left: React.ReactNode; right?: React.ReactNode; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-0.5 ${bold ? 'font-semibold' : ''} ${muted ? 'text-neutral-600' : ''}`}>
      <span className="min-w-0">{left}</span>
      {right !== undefined && <span className="shrink-0 tabular-nums">{right}</span>}
    </div>
  )
}

interface Props {
  total: number
  guests: number
  reserved: number
  hidden: { name: string; amount: number }[]
  events: WeddingEvent[]
  categories: BudgetCategory[]
  cateringPerGuest: number
}

export function BudgetPrint({ total, guests, reserved, hidden, events, categories, cateringPerGuest }: Props) {
  const eventsTotal = events.reduce((a, e) => a + e.budget, 0)
  const free = total - eventsTotal - reserved
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="print-only mx-auto max-w-3xl p-6 text-[12px] leading-snug text-black">
      <p className="m-0 font-serif text-2xl">Rencana budget nikah</p>
      <p className="m-0 mb-3 text-neutral-600">Dibuat di Bridesmap · {today} · estimasi, bukan penawaran vendor</p>

      <section className="break-inside-avoid rounded border border-neutral-300 p-3">
        <Row bold left="Total budget" right={rupiah(total)} />
        <Row left="Jumlah undangan" right={`${guests} undangan`} />
        <Row left="Alokasi acara" right={rupiah(eventsTotal)} />
        <Row left="Hidden cost disisihkan" right={rupiah(reserved)} />
        <Row bold left={free < 0 ? 'Melebihi budget' : 'Belum teralokasi'} right={rupiah(Math.abs(free))} />
        <Row muted left="Katering per orang" right={`±${rupiah(cateringPerGuest)}`} />
      </section>

      {events.map((e) => {
        const cs = categories.filter((c) => c.eventId === e.id)
        return (
          <section key={e.id} className="mt-4 break-inside-avoid">
            <p className="m-0 mb-1 border-b border-neutral-400 pb-1 font-semibold uppercase tracking-wide">
              {e.name} · {rupiah(e.budget)}
            </p>
            {cs.map((c) => (
              <Row key={c.id} left={c.name} right={`${rupiah(c.allocated)} (${e.budget > 0 ? Math.round((c.allocated / e.budget) * 100) : 0}%)`} />
            ))}
          </section>
        )
      })}

      {hidden.length > 0 && (
        <section className="mt-4 break-inside-avoid">
          <p className="m-0 mb-1 border-b border-neutral-400 pb-1 font-semibold uppercase tracking-wide">Hidden cost · {rupiah(reserved)}</p>
          {hidden.map((h) => (
            <Row key={h.name} left={h.name} right={`±${rupiah(h.amount)}`} />
          ))}
        </section>
      )}
    </div>
  )
}
