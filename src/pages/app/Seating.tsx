import { Select } from '../../components/select'
import { Armchair, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { ConfirmButton, Empty, Field, Modal, PageHeader, Segmented } from '../../components/ui'
import { usePlan } from '../../lib/store'
import type { Guest, SeatTable } from '../../lib/types'
import { cn, uid } from '../../lib/utils'

const seated = (guests: Guest[], t: SeatTable) => guests.filter((g) => g.tableId === t.id)
const paxOf = (list: Guest[]) => list.reduce((a, g) => a + g.pax, 0)

function ListView() {
  const { guests, tables, update } = usePlan()
  const candidates = guests.filter((g) => g.rsvp !== 'tidak')
  const unassigned = candidates.filter((g) => !g.tableId || !tables.some((t) => t.id === g.tableId))
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <div className="grid gap-3 sm:grid-cols-2">
        {tables.map((t) => {
          const list = seated(guests, t)
          const pax = paxOf(list)
          return (
            <div key={t.id} className={cn('card p-4', pax > t.capacity && 'border-destructive/40')}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{t.name}</p>
                <span className={cn('chip', pax > t.capacity ? 'bg-danger-soft text-danger-ink' : 'bg-muted text-muted-foreground')}>{pax}/{t.capacity}</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {list.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{g.name}{g.pax > 1 && ` +${g.pax - 1}`}</span>
                    <button className="icon-btn size-8" aria-label={`Keluarkan ${g.name} dari ${t.name}`} onClick={() => update('guests', g.id, { tableId: undefined })}><X className="size-4" /></button>
                  </li>
                ))}
                {list.length === 0 && <li className="text-muted-foreground">Belum ada tamu</li>}
              </ul>
            </div>
          )
        })}
      </div>
      <aside className="card h-fit p-4">
        <p className="font-semibold">Belum dapat meja ({unassigned.length})</p>
        <ul className="mt-2 max-h-[28rem] space-y-2 overflow-y-auto">
          {unassigned.map((g) => (
            <li key={g.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{g.name}</span>
              <Select compact className="w-32 shrink-0" label={`Pilih meja untuk ${g.name}`} value="" placeholder="Pilih meja" onChange={(v) => update('guests', g.id, { tableId: v })} options={tables.map((t) => ({ value: t.id, label: t.name }))} />
            </li>
          ))}
          {unassigned.length === 0 && <li className="text-sm text-muted-foreground">Semua tamu sudah dapat meja.</li>}
        </ul>
      </aside>
    </div>
  )
}

function CanvasView() {
  const { guests, tables, update } = usePlan()
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const unassigned = guests.filter((g) => g.rsvp !== 'tidak' && (!g.tableId || !tables.some((t) => t.id === g.tableId)))

  // Tinggi kanvas mengikuti jumlah meja (3 per baris) supaya tidak ada meja yang terpotong.
  const rows = Math.max(2, Math.ceil(tables.length / 3))
  const H = 70 + rows * 140
  const pos = (t: SeatTable, i: number) => ({ x: t.x ?? 12 + (i % 3) * 30, y: t.y ?? ((50 + Math.floor(i / 3) * 140) / H) * 100 })
  const onDown = (e: RPointerEvent, t: SeatTable, i: number) => {
    const box = ref.current!.getBoundingClientRect()
    const p = pos(t, i)
    drag.current = { id: t.id, dx: ((e.clientX - box.left) / box.width) * 100 - p.x, dy: ((e.clientY - box.top) / box.height) * 100 - p.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: RPointerEvent) => {
    if (!drag.current) return
    const box = ref.current!.getBoundingClientRect()
    const x = Math.min(88, Math.max(2, ((e.clientX - box.left) / box.width) * 100 - drag.current.dx))
    const y = Math.min(((H - 118) / H) * 100, Math.max(1, ((e.clientY - box.top) / box.height) * 100 - drag.current.dy))
    update('tables', drag.current.id, { x, y })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_16rem]">
      <div ref={ref} onPointerMove={onMove} onPointerUp={() => (drag.current = null)} style={{ height: H }} className="card relative w-full touch-none overflow-hidden bg-[radial-gradient(circle,_var(--color-border)_1px,_transparent_1px)] [background-size:20px_20px]">
        <div className="absolute inset-x-1/4 top-0 rounded-b-2xl bg-primary-soft py-1.5 text-center text-xs font-semibold text-primary">Pelaminan</div>
        {tables.map((t, i) => {
          const p = pos(t, i)
          const list = seated(guests, t)
          const pax = paxOf(list)
          return (
            <div
              key={t.id}
              onPointerDown={(e) => onDown(e, t, i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => update('guests', e.dataTransfer.getData('text/guest'), { tableId: t.id })}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className={cn('absolute grid size-24 cursor-grab place-items-center rounded-full border-2 bg-card text-center shadow-[var(--shadow-soft)] active:cursor-grabbing sm:size-28', pax > t.capacity ? 'border-destructive' : 'border-primary/40')}
              title={list.map((g) => g.name).join(', ')}
            >
              <div className="pointer-events-none px-2">
                <p className="line-clamp-2 break-words text-xs font-bold leading-tight">{t.name}</p>
                <p className={cn('text-xs tabular-nums', pax > t.capacity ? 'text-destructive' : 'text-muted-foreground')}>{pax}/{t.capacity}</p>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-muted-foreground">{list.map((g) => g.name.split(' ')[0]).join(', ')}</p>
              </div>
            </div>
          )
        })}
      </div>
      <aside className="card h-fit p-4">
        <p className="font-semibold">Drag tamu ke meja</p>
        <p className="hint mb-2">Drag meja untuk mengatur denah.</p>
        <ul className="flex max-h-[24rem] flex-wrap gap-2 overflow-y-auto">
          {unassigned.map((g) => (
            <li key={g.id} draggable onDragStart={(e) => e.dataTransfer.setData('text/guest', g.id)} className="chip cursor-grab bg-primary-soft text-primary min-h-8">
              {g.name}{g.pax > 1 && ` +${g.pax - 1}`}
            </li>
          ))}
          {unassigned.length === 0 && <li className="text-sm text-muted-foreground">Semua tamu sudah dapat meja.</li>}
        </ul>
      </aside>
    </div>
  )
}

export default function Seating() {
  const { tables, guests, add, update, remove } = usePlan()
  const [view, setView] = useState<'daftar' | 'denah'>('daftar')
  const [draft, setDraft] = useState<Partial<SeatTable> | null>(null)
  // Daftar "Kelola meja" menutup saat klik di luar atau tekan Escape.
  const manage = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const close = (e: Event) => {
      const d = manage.current
      if (d?.open && !(e instanceof PointerEvent && d.contains(e.target as Node))) d.open = false
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(e)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [])
  const totalSeats = tables.reduce((a, t) => a + t.capacity, 0)
  const attending = guests.filter((g) => g.rsvp !== 'tidak').reduce((a, g) => a + g.pax, 0)

  const save = () => {
    if (!draft?.name) return
    if (draft.id) update('tables', draft.id, draft)
    else add('tables', { id: uid(), name: draft.name, capacity: draft.capacity || 8 })
    setDraft(null)
  }

  return (
    <div>
      <PageHeader back="/app" title="Tempat duduk" subtitle={`${tables.length} meja · ${totalSeats} kursi · ${attending} tamu (tidak termasuk yang tidak hadir)`}
        actions={<button className="btn-primary btn-sm" onClick={() => setDraft({ name: `Meja ${tables.length + 1}`, capacity: 8 })}><Plus className="size-4" aria-hidden /> Meja</button>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented label="Tampilan" value={view} onChange={setView} options={[{ value: 'daftar', label: 'Daftar' }, { value: 'denah', label: 'Denah (drag & drop)' }]} />
        {tables.length > 0 && (
          <details ref={manage} className="relative">
            <summary className="btn-ghost btn-sm list-none">Kelola meja</summary>
            <ul className="card absolute z-10 mt-1 w-64 p-2">
              {tables.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <button className="flex-1 break-words rounded-lg px-2 py-2 text-left text-sm hover:bg-muted" onClick={() => setDraft(t)}>{t.name} · {t.capacity} kursi</button>
                  <ConfirmButton onConfirm={() => remove('tables', t.id)}><Trash2 className="size-4" /></ConfirmButton>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      {tables.length === 0 ? (
        <Empty icon={<Armchair className="size-6" />} title="Belum ada meja" action={<button className="btn-primary" onClick={() => setDraft({ name: 'Meja 1', capacity: 8 })}>Tambah meja</button>}>Buat meja untuk keluarga inti dan VIP, lalu tempatkan tamu.</Empty>
      ) : view === 'daftar' ? (
        <ListView />
      ) : (
        <CanvasView />
      )}

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Ubah meja' : 'Meja baru'}
        footer={<><button className="btn-ghost" onClick={() => setDraft(null)}>Batal</button><button className="btn-primary" onClick={save} disabled={!draft?.name}>Simpan</button></>}>
        <Field label="Nama meja" htmlFor="tn"><input id="tn" className="input" value={draft?.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="mis. Keluarga inti" /></Field>
        <Field label="Kapasitas kursi" htmlFor="tc"><input id="tc" type="number" min={1} className="input" value={draft?.capacity ?? 8} onChange={(e) => setDraft({ ...draft, capacity: Math.max(1, Number(e.target.value)) })} /></Field>
      </Modal>
    </div>
  )
}
