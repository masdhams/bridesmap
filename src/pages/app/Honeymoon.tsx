import { differenceInCalendarDays, parseISO } from 'date-fns'
import { ArrowRight, Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BerduaTabs, SplitTitle } from '../../components/berdua'
import { CoverButton, CoverLayer } from '../../components/cover'
import { Checkbox, ConfirmButton, Field, Modal, MoneyInput } from '../../components/ui'
import { usePlan } from '../../lib/store'
import type { CheckItem } from '../../lib/types'
import { cn, fmtDate, rupiah, uid } from '../../lib/utils'

export function tripDays(start?: string, end?: string) {
  return start && end ? Math.max(0, differenceInCalendarDays(parseISO(end), parseISO(start)) + 1) : 0
}

function bookingState(b: CheckItem): 'lunas' | 'dp' | 'pesan' {
  if (b.done || (b.amount && (b.paid ?? 0) >= b.amount)) return 'lunas'
  return (b.paid ?? 0) > 0 ? 'dp' : 'pesan'
}

export default function Honeymoon() {
  const { honeymoon: h, setHoneymoon, categories, add, update, profile } = usePlan()
  const [editTrip, setEditTrip] = useState(false)
  const [trip, setTrip] = useState(h)
  const [booking, setBooking] = useState<Partial<CheckItem> | null>(null)
  const [packText, setPackText] = useState('')
  const days = tripDays(h.startDate, h.endDate)
  const nights = Math.max(0, days - 1)
  const linked = categories.find((c) => c.name === 'Honeymoon')
  const spent = h.bookings.reduce((a, b) => a + (bookingState(b) === 'lunas' ? (b.amount ?? b.paid ?? 0) : (b.paid ?? 0)), 0)
  const afterWedding = h.startDate && profile.weddingDate ? differenceInCalendarDays(parseISO(h.startDate), parseISO(profile.weddingDate)) : null
  const [place, region] = h.destination.split(/,\s*/)
  const packed = h.packing.filter((p) => p.done).length

  // Budget bulan madu tersambung ke budget tracker sebagai kategori "Honeymoon".
  const saveTrip = () => {
    setHoneymoon({ destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, budget: trip.budget })
    if (linked) update('categories', linked.id, { allocated: trip.budget })
    else if (trip.budget > 0) add('categories', { id: uid(), name: 'Honeymoon', allocated: trip.budget })
    setEditTrip(false)
  }

  const saveBooking = () => {
    if (!booking?.label) return
    const item = { id: booking.id ?? uid(), label: booking.label, done: !!booking.done, amount: booking.amount, paid: booking.paid }
    setHoneymoon({ bookings: booking.id ? h.bookings.map((b) => (b.id === booking.id ? item : b)) : [...h.bookings, item] })
    setBooking(null)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <header className="flex h-11 items-center justify-between gap-3">
        <SplitTitle a="Honey" b="moon" />
        <button
          className="grid size-11 place-items-center rounded-full border border-border bg-card hover:bg-muted"
          aria-label="Ubah rencana honeymoon"
          onClick={() => {
            setTrip(h)
            setEditTrip(true)
          }}
        >
          <Pencil className="size-[18px]" strokeWidth={1.8} />
        </button>
      </header>
      <BerduaTabs />

      <div className={cn('relative flex min-h-[200px] flex-col justify-end gap-1 overflow-hidden rounded-[24px] p-5 text-white', h.coverPhoto ? 'bg-primary' : 'bg-primary-hover')}>
        {h.coverPhoto ? (
          <CoverLayer src={h.coverPhoto} pos={h.coverPos} full />
        ) : (
          <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(201,212,186,0.25),transparent_55%)]" />
        )}
        {/* Seluruh kartu bisa diklik untuk mengubah rencana; tombol foto berada di atasnya. */}
        <button
          className="absolute inset-0 rounded-[24px]"
          aria-label="Ubah destinasi & tanggal honeymoon"
          onClick={() => {
            setTrip(h)
            setEditTrip(true)
          }}
        />
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {afterWedding !== null && afterWedding >= 0 && (
            <span className="pointer-events-none inline-flex h-7 items-center rounded-full bg-white/15 px-2.5 text-xs font-semibold backdrop-blur-sm">H+{afterWedding} setelah hari-H</span>
          )}
          <CoverButton src={h.coverPhoto} pos={h.coverPos} onChange={(coverPhoto) => setHoneymoon({ coverPhoto })} onPos={(coverPos) => setHoneymoon({ coverPos })} label="foto sampul honeymoon" />
        </div>
        {h.destination ? (
          <span className="pointer-events-none relative font-serif text-[34px] leading-[1.05]">
            {place}
            {region && <span className="italic">, {region}</span>}
          </span>
        ) : (
          <span className="pointer-events-none relative font-serif text-[34px] leading-[1.05]">
            Ke mana <span className="italic">kalian pergi?</span>
          </span>
        )}
        <span className="pointer-events-none relative text-[13px] text-[#D5DCCB]">
          {h.startDate && h.endDate ? `${fmtDate(h.startDate, 'EEEE d')} – ${fmtDate(h.endDate, 'EEEE d MMM yyyy')} · ${nights} malam` : 'Isi destinasi & tanggal'}
        </span>
      </div>

      <section className="flex flex-col gap-2.5 rounded-[20px] border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-muted-foreground">Budget bulan madu</span>
          {linked && <span className="badge-success min-h-6 px-2 text-[11px]">Terhubung ke Budget</span>}
        </div>
        <span className="text-[26px] font-semibold tracking-[-0.01em] tabular-nums">
          {rupiah(spent)} <span className="text-sm font-medium text-muted-foreground">dari {rupiah(h.budget)}</span>
        </span>
        <div className="h-2 rounded-full bg-muted">
          <div className={cn('h-2 rounded-full transition-[width] duration-700 bar-grow', spent > h.budget ? 'bg-destructive' : 'bg-primary')} style={{ width: `${h.budget ? Math.min(100, (spent / h.budget) * 100) : 0}%` }} />
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-[15px] font-semibold">Pemesanan</h2>
          <button className="btn-soft min-h-9 px-3 text-[13px]" onClick={() => setBooking({ label: '', done: false })}>
            <Plus className="size-4" aria-hidden /> Tambah
          </button>
        </div>
        <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
          {h.bookings.map((b) => {
            const st = bookingState(b)
            return (
              <li key={b.id} className="flex min-h-16 items-center gap-3 border-b border-divider px-4 py-3 last:border-0">
                <span
                  aria-label={st === 'lunas' ? 'Lunas' : st === 'dp' ? 'DP' : 'Belum dipesan'}
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full',
                    st === 'lunas' ? 'bg-primary text-white' : st === 'dp' ? 'bg-[conic-gradient(var(--color-warning-solid)_50%,var(--color-warning-soft)_0)]' : 'border-[1.5px] border-[#A9A08C]',
                  )}
                >
                  {st === 'lunas' && <Check className="size-3.5" strokeWidth={2.6} />}
                </span>
                <button className="flex min-w-0 flex-1 flex-col text-left" onClick={() => setBooking(b)}>
                  <span className="truncate text-sm font-semibold">{b.label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {st === 'lunas' ? `${b.amount ? rupiah(b.amount) : 'Sudah'} · lunas` : st === 'dp' ? `DP ${rupiah(b.paid ?? 0)} dari ${rupiah(b.amount ?? 0)}` : b.amount ? `Perkiraan ${rupiah(b.amount)}` : 'Belum dipesan'}
                  </span>
                </button>
                {st === 'dp' ? (
                  <span className="badge-warning min-h-6 shrink-0 px-2 text-[11px]">DP</span>
                ) : st === 'pesan' ? (
                  <button className="btn-soft min-h-8 shrink-0 px-3 text-xs" onClick={() => setBooking(b)}>
                    Pesan
                  </button>
                ) : null}
              </li>
            )
          })}
          {h.bookings.length === 0 && <li className="px-4 py-5 text-sm text-muted-foreground">Belum ada pemesanan.</li>}
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/app/honeymoon/itinerary" className="flex min-h-[96px] flex-col justify-between rounded-[20px] bg-primary p-4 text-white">
          <span className="text-[13px] text-[#D5DCCB]">Itinerary</span>
          <span className="flex items-center justify-between text-base font-semibold">
            {days ? `${days} hari` : 'Atur hari'} <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
          </span>
        </Link>
        <a href="#packing" className="flex min-h-[96px] flex-col justify-between rounded-[20px] border border-border bg-muted p-4">
          <span className="text-[13px] text-muted-foreground">Daftar packing</span>
          <span className="text-base font-semibold tabular-nums">
            {packed} / {h.packing.length} barang
          </span>
        </a>
      </div>

      <section id="packing" className="flex scroll-mt-6 flex-col gap-2.5">
        <h2 className="font-sans text-[15px] font-semibold">Daftar packing</h2>
        <div className="rounded-[20px] border border-border bg-card px-4 py-1">
          {h.packing.map((p) => (
            <div key={p.id} className="flex items-center gap-2 border-b border-divider last:border-0">
              <div className="flex-1">
                <Checkbox checked={p.done} onChange={(v) => setHoneymoon({ packing: h.packing.map((x) => (x.id === p.id ? { ...x, done: v } : x)) })} label={p.label} />
              </div>
              <ConfirmButton onConfirm={() => setHoneymoon({ packing: h.packing.filter((x) => x.id !== p.id) })}>
                <Trash2 className="size-4" />
              </ConfirmButton>
            </div>
          ))}
          <form
            className="flex gap-2 py-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!packText.trim()) return
              setHoneymoon({ packing: [...h.packing, { id: uid(), label: packText.trim(), done: false }] })
              setPackText('')
            }}
          >
            <input className="input min-h-11" value={packText} onChange={(e) => setPackText(e.target.value)} placeholder="Tambah barang" aria-label="Tambah barang packing" />
            <button className="btn-outline min-h-11 shrink-0 px-4" aria-label="Tambah" disabled={!packText.trim()}>
              <Plus className="size-4" />
            </button>
          </form>
        </div>
      </section>

      <Modal
        open={editTrip}
        onClose={() => setEditTrip(false)}
        title="Rencana honeymoon"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditTrip(false)}>Batal</button>
            <button className="btn-primary" onClick={saveTrip}>Simpan</button>
          </>
        }
      >
        <Field label="Destinasi" htmlFor="hd" hint="Pakai koma untuk wilayah, mis. Labuan Bajo, NTT"><input id="hd" className="input" value={trip.destination} onChange={(e) => setTrip({ ...trip, destination: e.target.value })} placeholder="mis. Labuan Bajo, NTT" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Berangkat" htmlFor="hs"><input id="hs" type="date" className="input" value={trip.startDate ?? ''} onChange={(e) => setTrip({ ...trip, startDate: e.target.value })} /></Field>
          <Field label="Pulang" htmlFor="he"><input id="he" type="date" className="input" value={trip.endDate ?? ''} onChange={(e) => setTrip({ ...trip, endDate: e.target.value })} /></Field>
        </div>
        <Field label="Budget bulan madu" htmlFor="hb" hint="Otomatis jadi kategori 'Honeymoon' di Budget"><MoneyInput id="hb" value={trip.budget} onChange={(n) => setTrip({ ...trip, budget: n })} /></Field>
      </Modal>

      <Modal
        open={!!booking}
        onClose={() => setBooking(null)}
        title={booking?.id ? 'Ubah pemesanan' : 'Pemesanan baru'}
        footer={
          <>
            {booking?.id && (
              <ConfirmButton className="btn-ghost mr-auto text-destructive" onConfirm={() => { setHoneymoon({ bookings: h.bookings.filter((b) => b.id !== booking.id) }); setBooking(null) }}>
                <Trash2 className="size-4" aria-hidden /> Hapus
              </ConfirmButton>
            )}
            <button className="btn-ghost" onClick={() => setBooking(null)}>Batal</button>
            <button className="btn-primary" onClick={saveBooking} disabled={!booking?.label}>Simpan</button>
          </>
        }
      >
        <Field label="Nama" htmlFor="bl"><input id="bl" className="input" value={booking?.label ?? ''} onChange={(e) => setBooking({ ...booking, label: e.target.value })} placeholder="mis. Hotel 5 malam" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Total" htmlFor="bt"><MoneyInput id="bt" value={booking?.amount ?? 0} onChange={(n) => setBooking({ ...booking, amount: n || undefined })} /></Field>
          <Field label="Sudah dibayar" htmlFor="bp"><MoneyInput id="bp" value={booking?.paid ?? 0} onChange={(n) => setBooking({ ...booking, paid: n || undefined })} /></Field>
        </div>
        <Checkbox checked={!!booking?.done} onChange={(v) => setBooking({ ...booking, done: v })} label="Sudah lunas / beres" strike={false} />
      </Modal>
    </div>
  )
}
