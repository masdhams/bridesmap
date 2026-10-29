import { ArrowRight, CircleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AllocationEditor } from '../../components/allocation'
import { PublicPage } from '../../components/PublicLayout'
import { Field, MoneyInput } from '../../components/ui'
import { EVENT_KINDS, HIDDEN_COSTS } from '../../data/content'
import * as alloc from '../../lib/allocation'
import type { EventKind } from '../../lib/types'
import { cn, rupiah } from '../../lib/utils'

// Kalkulator gratis tanpa akun (PRD #25): logika sama dengan alokasi per acara (#39).
export default function BudgetCalculator() {
  const [total, setTotal] = useState(120_000_000)
  const [guests, setGuests] = useState(300)
  const [picked, setPicked] = useState<EventKind[]>(['akad', 'resepsi'])
  const [on, setOn] = useState<Set<string>>(() => new Set(HIDDEN_COSTS.filter((h) => h.defaultOn).map((h) => h.key)))
  const reserved = HIDDEN_COSTS.filter((h) => on.has(h.key)).reduce((a, h) => a + h.estimate({ budget: total, guests }), 0)

  // Pembagian awal dibuat ulang saat total budget / daftar acara berubah; edit manual di bawah tetap dipertahankan sampai itu.
  const [state, setState] = useState<alloc.AllocState>(() => alloc.buildAllocation(Math.max(0, 120_000_000 - reserved), picked.map((kind) => ({ kind }))))
  const rebuild = (nextTotal: number, kinds: EventKind[], nextReserved = reserved) => setState(alloc.buildAllocation(Math.max(0, nextTotal - nextReserved), kinds.map((kind) => ({ kind }))))

  const togglePick = (k: EventKind) => {
    const kinds = picked.includes(k) ? picked.filter((x) => x !== k) : [...picked, k]
    if (!kinds.length) return
    setPicked(kinds)
    rebuild(total, kinds)
  }
  const toggleHidden = (key: string) => {
    const next = new Set(on)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setOn(next)
    const r = HIDDEN_COSTS.filter((h) => next.has(h.key)).reduce((a, h) => a + h.estimate({ budget: total, guests }), 0)
    rebuild(total, picked, r)
  }

  const t = useMemo(() => alloc.allocTotals(total, state.events, reserved), [total, state.events, reserved])
  const cateringPerGuest = useMemo(() => {
    const catering = state.categories.filter((c) => c.key === 'katering').reduce((a, c) => a + c.allocated, 0)
    return catering / Math.max(1, guests * 2)
  }, [state.categories, guests])

  const query = new URLSearchParams({ budget: String(total), tamu: String(guests), acara: picked.join(',') }).toString()

  return (
    <PublicPage>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link to="/alat" className="text-sm font-semibold text-primary hover:underline">← Alat gratis</Link>
        <h1 className="mt-2 text-5xl">Kalkulator budget nikah</h1>
        <p className="mt-2 max-w-2xl text-body">Pilih acara yang kalian rencanakan. Budget dibagi per acara, lalu per kategori. Semua angka awal adalah <strong>estimasi</strong> — ubah dalam persen atau Rupiah, sisanya otomatis menyesuaikan.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_1fr]">
          <aside className="card h-fit space-y-5 p-5 lg:sticky lg:top-20">
            <Field label="Total budget" htmlFor="b">
              <MoneyInput id="b" value={total} onChange={(n) => { setTotal(n); rebuild(n, picked) }} />
            </Field>
            <Field label="Jumlah undangan" htmlFor="g" hint="Perkiraan 1 undangan ≈ 2 orang">
              <input id="g" type="number" min={1} className="input" value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
            </Field>
            <div>
              <p className="label">Acara</p>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_KINDS.map((k) => {
                  const active = picked.includes(k.kind)
                  return (
                    <button key={k.kind} type="button" aria-pressed={active} onClick={() => togglePick(k.kind)} className={cn('min-h-11 rounded-2xl border px-3 text-left text-sm', active ? 'border-primary bg-primary-soft font-semibold text-on-primary-soft' : 'border-border bg-card text-body')}>
                      {k.label}
                    </button>
                  )
                })}
              </div>
              <p className="hint">Mengganti acara membagi ulang dari default.</p>
            </div>
            <div className="space-y-1.5 rounded-2xl bg-muted p-4 text-sm">
              <div className="flex justify-between"><span>Alokasi acara</span><span className="font-semibold tabular-nums">{rupiah(t.eventsTotal)}</span></div>
              <div className="flex justify-between"><span>Hidden cost</span><span className="font-semibold tabular-nums text-accent">{rupiah(t.reserved)}</span></div>
              <div className="flex justify-between border-t border-border pt-1.5"><span className="font-semibold">{t.free < 0 ? 'Melebihi budget' : 'Belum teralokasi'}</span><span className={cn('font-bold tabular-nums', t.free < 0 && 'text-destructive')}>{rupiah(Math.abs(t.free))}</span></div>
            </div>
            {t.free < 0 && <p className="flex gap-2 text-sm text-destructive" role="alert"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> Alokasi melebihi total budget. Kurangi salah satu acara atau kategori.</p>}
            <p className="text-xs text-muted-foreground">Katering ±{rupiah(cateringPerGuest)} per orang.</p>
            <Link to={`/mulai?${query}`} className="btn-primary w-full">Simpan ke rencana gratis <ArrowRight className="size-4" aria-hidden /></Link>
          </aside>

          <div className="space-y-8">
            <AllocationEditor
              total={total}
              reserved={reserved}
              events={state.events}
              categories={state.categories}
              onEventBudget={(id, n) => setState((s) => alloc.setEventBudget(s, id, n))}
              onCategory={(id, n) => setState((s) => alloc.setCategoryAllocation(s, id, n))}
              onReset={(id) => setState((s) => alloc.resetEvent(s, id))}
            />

            <section>
              <h2 className="text-3xl">Hidden cost</h2>
              <p className="mb-3 text-sm text-body">Centang yang relevan. Yang dicentang menyisihkan sebagian budget sebelum dibagi ke acara.</p>
              <ul className="space-y-3">
                {HIDDEN_COSTS.map((h) => (
                  <li key={h.key} className={cn('card p-4', on.has(h.key) && 'border-accent/40')}>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" className="check-accent mt-1" checked={on.has(h.key)} onChange={() => toggleHidden(h.key)} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap justify-between gap-x-3"><span className="font-semibold">{h.name}</span><span className="text-sm font-semibold tabular-nums text-accent">± {rupiah(h.estimate({ budget: total, guests }))}</span></span>
                        <span className="mt-1 block text-sm text-body">{h.why}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>
    </PublicPage>
  )
}
