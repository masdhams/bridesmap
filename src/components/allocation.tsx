// Editor alokasi budget per acara (PRD #39). Dipakai di halaman Alokasi (rencana asli) dan di kalkulator gratis tanpa akun.
import { ChevronDown, CircleAlert, Info, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EVENT_KINDS, HIDDEN_COSTS } from '../data/content'
import { allocTotals, eventCategoryTotal, kindLabel, pctOf } from '../lib/allocation'
import type { BudgetCategory, EventKind, WeddingEvent } from '../lib/types'
import { cn, rupiah } from '../lib/utils'
import { ConfirmButton, Field, Modal, MoneyInput } from './ui'

const COLORS = ['#34432F', '#6F7F5F', '#A9B59A', '#D3C29E', '#B8A27A']
const fmtPct = (n: number) => String(n).replace('.', ',')

/** Dua kolom yang saling terhubung: persen (terhadap `base`) dan Rupiah. Mengubah salah satu menghitung ulang yang lain. */
export function PctRpInput({ base, value, onChange, label }: { base: number; value: number; onChange: (rp: number) => void; label: string }) {
  const [text, setText] = useState(fmtPct(pctOf(value, base)))
  const [focus, setFocus] = useState(false)
  useEffect(() => {
    if (!focus) setText(fmtPct(pctOf(value, base)))
  }, [value, base, focus])
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-[88px] shrink-0">
        <input
          inputMode="decimal"
          aria-label={`${label} dalam persen`}
          className="input min-h-11 pr-7 text-right font-semibold tabular-nums"
          value={text}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onChange={(e) => {
            const raw = e.target.value.replace(',', '.').replace(/[^\d.]/g, '')
            const clean = raw.replace(/(\..*)\./g, '$1')
            setText(clean.replace('.', ','))
            const n = parseFloat(clean)
            onChange(Number.isFinite(n) && base > 0 ? Math.round((base * n) / 100) : 0)
          }}
        />
        <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
      </div>
      <div className="min-w-0 flex-1">
        <MoneyInput value={value} onChange={onChange} ariaLabel={`${label} dalam Rupiah`} />
      </div>
    </div>
  )
}

export interface AllocationEditorProps {
  total: number
  onTotal?: (n: number) => void
  /** Alokasi biaya tersembunyi yang sudah dicentang (mengurangi sisa). */
  reserved: number
  events: WeddingEvent[]
  categories: BudgetCategory[]
  onEventBudget: (id: string, n: number) => void
  onCategory: (id: string, n: number) => void
  onReset: (id: string) => void
  /** Return false = ditolak (mis. masih ada vendor). */
  onRemove?: (id: string) => boolean | void
  onAdd?: (kind: EventKind, name: string) => void
}

export function AllocationEditor(p: AllocationEditorProps) {
  const t = allocTotals(p.total, p.events, p.reserved)
  const [open, setOpen] = useState<string | null>(p.events[0]?.id ?? null)
  const [adding, setAdding] = useState(false)
  const [kind, setKind] = useState<EventKind>('adat')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  // Total diterapkan saat selesai mengetik (blur), bukan per ketikan — penskalaan per digit akan merusak angka.
  const [totalDraft, setTotalDraft] = useState(p.total)
  useEffect(() => setTotalDraft(p.total), [p.total])
  const [showHiddenInfo, setShowHiddenInfo] = useState(false)
  const editEv = p.events.find((e) => e.id === editing)
  const hiddenNames = HIDDEN_COSTS.filter((h) => h.defaultOn).map((h) => h.name.replace(/ \(.+\)$/, '').toLowerCase())
  const base = Math.max(p.total, t.allocated, 1)
  const over = t.free < 0

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-medium text-muted-foreground">Total budget</span>
          <span className="badge-accent min-h-6 px-2 text-[11px]">Estimasi awal</span>
        </div>
        {p.onTotal ? (
          <div>
            <MoneyInput value={totalDraft} onChange={setTotalDraft} onBlur={() => totalDraft > 0 && totalDraft !== p.total && p.onTotal?.(totalDraft)} ariaLabel="Total budget" />
            <p className="hint">Setelah selesai mengetik, semua acara & kategori ikut menyesuaikan dengan persentase yang sama.</p>
          </div>
        ) : (
          <p className="text-[28px] font-semibold tracking-tight tabular-nums">{rupiah(p.total)}</p>
        )}

        <div role="img" aria-label="Pembagian budget per acara" className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
          {p.events.map((e, i) => (
            <div key={e.id} className="transition-[width] duration-500 bar-grow" style={{ width: `${(e.budget / base) * 100}%`, background: COLORS[i % COLORS.length] }} />
          ))}
          {p.reserved > 0 && <div style={{ width: `${(p.reserved / base) * 100}%`, background: '#9A4E3B' }} />}
        </div>

        <ul className="flex flex-col gap-3 text-sm">
          {p.events.map((e, i) => (
            <li key={e.id} className="flex items-center gap-2.5">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="min-w-0 flex-1 truncate font-medium">{e.name}</span>
              <span className="flex shrink-0 flex-col items-end leading-tight">
                <span className="font-semibold tabular-nums">{rupiah(e.budget)}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{fmtPct(pctOf(e.budget, p.total))}% dari total</span>
              </span>
              <button
                type="button"
                aria-label={`Ubah budget ${e.name}`}
                onClick={() => setEditing(e.id)}
                className="-my-2 -mr-1 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-ink"
              >
                <Pencil className="size-4" strokeWidth={1.8} aria-hidden />
              </button>
            </li>
          ))}
          {p.reserved > 0 && (
            <>
              <li className="flex items-center gap-2.5">
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: '#9A4E3B' }} />
                <span className="min-w-0 flex-1 font-medium">Hidden cost</span>
                <span className="flex shrink-0 flex-col items-end leading-tight">
                  <span className="font-semibold tabular-nums">{rupiah(p.reserved)}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{fmtPct(pctOf(p.reserved, p.total))}% dari total</span>
                </span>
                <button
                  type="button"
                  aria-label="Apa itu hidden cost?"
                  aria-expanded={showHiddenInfo}
                  onClick={() => setShowHiddenInfo((v) => !v)}
                  className="-my-2 -mr-1 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-ink aria-expanded:bg-accent-soft aria-expanded:text-accent"
                >
                  <Info className="size-4" strokeWidth={1.8} aria-hidden />
                </button>
              </li>
              {showHiddenInfo && (
                <li role="note" className="rounded-2xl bg-accent-soft px-4 py-3 text-[13px] leading-relaxed text-accent-ink">
                  Biaya yang sering terlupa tapi hampir selalu muncul, seperti {hiddenNames.slice(0, -1).join(', ')}
                  {hiddenNames.length > 1 ? ' dan ' : ''}
                  {hiddenNames.at(-1)}. Kami sisihkan sebagian budget dari awal supaya tidak jadi kejutan di akhir. Pos-posnya bisa kalian pilih dan ubah sendiri.
                </li>
              )}
            </>
          )}
        </ul>

        <div className={cn('flex items-start gap-2 rounded-2xl px-4 py-3 text-sm', over ? 'bg-danger-soft text-danger-ink' : t.free === 0 ? 'bg-primary-soft text-on-primary-soft' : 'bg-muted text-body')} role={over ? 'alert' : 'status'}>
          {over && <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />}
          <span className="flex-1">
            {over ? 'Alokasi melebihi budget' : t.free === 0 ? 'Semua budget sudah teralokasi' : 'Belum teralokasi'}
          </span>
          {t.free !== 0 && <span className="font-semibold tabular-nums">{rupiah(Math.abs(t.free))}</span>}
        </div>
      </section>

      <ul className="flex flex-col gap-3">
        {p.events.map((e, i) => {
          const cats = p.categories.filter((c) => c.eventId === e.id)
          const sum = eventCategoryTotal(p.categories, e.id)
          const free = e.budget - sum
          const isOpen = open === e.id
          return (
            <li key={e.id} className="overflow-hidden rounded-[20px] border border-border bg-card">
              <button className="flex w-full items-center gap-3 px-4 py-4 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : e.id)}>
                <span className="size-3 shrink-0 rounded-[4px]" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-semibold">{e.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {kindLabel(e.kind)} · {fmtPct(pctOf(e.budget, p.total))}% dari total
                  </span>
                </span>
                <span className="text-[15px] font-semibold tabular-nums">{rupiah(e.budget)}</span>
                <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')} aria-hidden />
              </button>

              {isOpen && (
                <div className="flex flex-col gap-4 border-t border-divider bg-background/50 px-4 pb-4 pt-4">
                  <div>
                    <p className="label">Budget {e.name}</p>
                    <PctRpInput base={p.total} value={e.budget} onChange={(n) => p.onEventBudget(e.id, n)} label={`Budget ${e.name}`} />
                    <p className="hint">Persentase terhadap total budget. Kategori di bawah ikut menyesuaikan.</p>
                  </div>

                  <div>
                    <p className="label">Per kategori</p>
                    <ul className="flex flex-col gap-3">
                      {cats.map((c) => (
                        <li key={c.id} className="flex flex-col gap-1.5">
                          <span className="text-[13px] font-medium">{c.name}</span>
                          <PctRpInput base={e.budget} value={c.allocated} onChange={(n) => p.onCategory(c.id, n)} label={`${c.name} ${e.name}`} />
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={cn('flex items-start gap-2 rounded-2xl px-4 py-3 text-sm', free < 0 ? 'bg-danger-soft text-danger-ink' : free === 0 ? 'bg-primary-soft text-on-primary-soft' : 'bg-muted text-body')} role={free < 0 ? 'alert' : 'status'}>
                    {free < 0 && <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />}
                    <span className="flex-1">{free < 0 ? 'Kategori melebihi budget acara' : free === 0 ? 'Semua budget acara teralokasi' : 'Belum teralokasi di acara ini'}</span>
                    {free !== 0 && <span className="font-semibold tabular-nums">{rupiah(Math.abs(free))}</span>}
                    <span className="sr-only"> Total kategori {fmtPct(pctOf(sum, e.budget))} persen dari budget acara</span>
                  </div>
                  <p className="-mt-2 text-xs text-muted-foreground tabular-nums">Total kategori: {fmtPct(pctOf(sum, e.budget))}% dari budget acara</p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button className="btn-outline btn-sm" onClick={() => p.onReset(e.id)}>
                      <RotateCcw className="size-4" aria-hidden /> Kembalikan ke default
                    </button>
                    {p.onRemove && p.events.length > 1 && (
                      <ConfirmButton
                        className="btn-ghost btn-sm text-destructive"
                        label="Hapus acara"
                        onConfirm={() => setMsg(p.onRemove!(e.id) === false ? `"${e.name}" masih punya vendor. Pindahkan atau hapus vendornya dulu.` : '')}
                      >
                        <Trash2 className="size-4" aria-hidden /> Hapus acara
                      </ConfirmButton>
                    )}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {msg && (
        <p className="rounded-2xl bg-warning-soft px-4 py-3 text-sm text-warning" role="alert">
          {msg}
        </p>
      )}

      <Modal
        open={!!editEv}
        onClose={() => setEditing(null)}
        title={editEv ? `Budget ${editEv.name}` : ''}
        footer={
          <button className="btn-primary" onClick={() => setEditing(null)}>
            Selesai
          </button>
        }
      >
        {editEv && (
          <>
            <div>
              <PctRpInput base={p.total} value={editEv.budget} onChange={(n) => p.onEventBudget(editEv.id, n)} label={`Atur ${editEv.name}`} />
              <p className="hint">Persentase dihitung dari total budget {rupiah(p.total)}. Kategori di dalam acara ikut menyesuaikan dengan persentase tetap.</p>
            </div>
            <div className={cn('flex items-start gap-2 rounded-2xl px-4 py-3 text-sm', over ? 'bg-danger-soft text-danger-ink' : t.free === 0 ? 'bg-primary-soft text-on-primary-soft' : 'bg-muted text-body')} role={over ? 'alert' : 'status'}>
              {over && <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />}
              <span className="flex-1">{over ? 'Alokasi melebihi budget' : t.free === 0 ? 'Semua budget sudah teralokasi' : 'Belum teralokasi'}</span>
              {t.free !== 0 && <span className="font-semibold tabular-nums">{rupiah(Math.abs(t.free))}</span>}
            </div>
          </>
        )}
      </Modal>

      {p.onAdd &&
        (adding ? (
          <form
            className="card flex flex-col gap-4 p-5"
            onSubmit={(e) => {
              e.preventDefault()
              p.onAdd!(kind, name)
              setAdding(false)
              setName('')
            }}
          >
            <p className="font-semibold">Tambah acara</p>
            <div role="radiogroup" aria-label="Jenis acara" className="grid grid-cols-2 gap-2">
              {EVENT_KINDS.map((k) => (
                <button type="button" key={k.kind} role="radio" aria-checked={kind === k.kind} onClick={() => setKind(k.kind)} className={cn('min-h-11 rounded-2xl border px-3 text-left text-sm', kind === k.kind ? 'border-primary bg-primary-soft font-semibold text-on-primary-soft' : 'border-border bg-card text-body')}>
                  {k.label}
                </button>
              ))}
            </div>
            <Field label="Nama acara (opsional)" htmlFor="evn" hint={kind === 'adat' ? 'mis. Siraman, Midodareni, Sangjit' : undefined}>
              <input id="evn" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={kindLabel(kind)} />
            </Field>
            <p className="hint -mt-2">Budget awalnya diambil dari yang belum teralokasi, dengan persentase default {kindLabel(kind).toLowerCase()}.</p>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={() => setAdding(false)}>
                Batal
              </button>
              <button className="btn-primary flex-1">Tambah</button>
            </div>
          </form>
        ) : (
          <button className="btn-outline w-full" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden /> Tambah acara
          </button>
        ))}
    </div>
  )
}

