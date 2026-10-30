import { addDays, format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Checkbox, ConfirmButton, Empty, Field, MoneyInput, Modal, PageHeader, RoundButton } from '../../components/ui'
import { usePlan } from '../../lib/store'
import type { ItineraryDay, ItineraryItem } from '../../lib/types'
import { cn, fmtDate, rupiah, uid } from '../../lib/utils'
import { tripDays } from './Honeymoon'

/** Layar "Itinerary bulan madu": pilih hari, lihat susunan kegiatan per jam. */
export default function HoneymoonItinerary() {
  const { honeymoon: h, setHoneymoon } = usePlan()
  const days = tripDays(h.startDate, h.endDate)
  const [active, setActive] = useState(1)
  const [item, setItem] = useState<Partial<ItineraryItem> | null>(null)
  const [titleEdit, setTitleEdit] = useState<string | null>(null)
  const dateOf = (n: number) => (h.startDate ? addDays(parseISO(h.startDate), n - 1) : null)
  const day: ItineraryDay = h.itinerary.find((d) => d.day === active) ?? { id: uid(), day: active, items: [] }
  const items = [...(day.items ?? [])].sort((a, b) => a.time.localeCompare(b.time))
  const cost = items.reduce((a, i) => a + (i.cost ?? 0), 0)

  const saveDay = (patch: Partial<ItineraryDay>) => {
    const next = { ...day, ...patch }
    setHoneymoon({ itinerary: h.itinerary.some((d) => d.day === active) ? h.itinerary.map((d) => (d.day === active ? next : d)) : [...h.itinerary, next] })
  }
  const saveItem = () => {
    if (!item?.activity || !item.time) return
    const next = { id: item.id ?? uid(), time: item.time, activity: item.activity, note: item.note, cost: item.cost, highlight: item.highlight }
    saveDay({ items: item.id ? (day.items ?? []).map((i) => (i.id === item.id ? next : i)) : [...(day.items ?? []), next] })
    setItem(null)
  }

  const words = (day.title || 'Rencana hari ini').split(' ')
  const cut = Math.ceil(words.length / 2)
  const subtitle = h.startDate && h.endDate ? `${h.destination || 'Rencana perjalanan kalian'} · ${fmtDate(h.startDate, 'd')}–${fmtDate(h.endDate, 'd MMM yyyy')}` : 'Atur tanggal berangkat dan pulang dulu'

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <PageHeader
        back="/app/honeymoon"
        title={
          <>
            Itinerary
            <span className="mt-1 block font-sans text-[13px] tracking-normal text-muted-foreground">{subtitle}</span>
          </>
        }
        actions={
          days > 0 && (
            <RoundButton label="Tambah kegiatan" onClick={() => setItem({ time: items.at(-1)?.time ?? '08:00' })}>
              <Plus className="size-[18px]" strokeWidth={2} />
            </RoundButton>
          )
        }
      />

      {days === 0 ? (
        <Empty icon={<Pencil className="size-6" />} title="Belum ada tanggal perjalanan">
          Isi tanggal berangkat dan pulang di halaman Honeymoon dulu. Setelah itu, kalian bisa mulai menyusun kegiatan untuk setiap hari.
        </Empty>
      ) : (
        <>
          <div role="tablist" aria-label="Pilih hari" className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {Array.from({ length: days }, (_, i) => i + 1).map((n) => {
              const d = dateOf(n)
              const on = n === active
              return (
                <button key={n} role="tab" aria-selected={on} onClick={() => setActive(n)} className={cn('flex min-h-[60px] min-w-[54px] shrink-0 flex-col items-center justify-center rounded-2xl text-xs', on ? 'bg-primary text-white' : 'border border-border bg-card text-body')}>
                  <span className={on ? 'text-[#D5DCCB]' : 'text-muted-foreground'}>{d ? format(d, 'EEE', { locale: localeId }) : `Hari`}</span>
                  <span className="font-serif text-[22px] leading-tight">{d ? format(d, 'd') : n}</span>
                </button>
              )
            })}
          </div>

          <section className="flex flex-col gap-1">
            <p className="eyebrow">
              Hari {active}
              {dateOf(active) && ` · ${format(dateOf(active)!, 'EEEE, d MMMM', { locale: localeId })}`}
            </p>
            <button className="text-left" onClick={() => setTitleEdit(day.title ?? '')} aria-label="Ubah judul hari">
              <span className="font-serif text-[32px] leading-[1.05]">
                {words.slice(0, cut).join(' ')} <span className="italic">{words.slice(cut).join(' ')}</span>
              </span>
            </button>
            {day.plan && <p className="text-sm text-body">{day.plan}</p>}
          </section>

          {items.length === 0 ? (
            <p className="rounded-[20px] border border-border bg-card px-4 py-5 text-sm text-muted-foreground">Belum ada rencana untuk hari ini. Yuk, tambahkan kegiatan pertama.</p>
          ) : (
            <ol className="flex flex-col">
              {items.map((it, i) => (
                <li key={it.id} className="grid grid-cols-[48px_20px_1fr] gap-x-2">
                  <span className="pt-0.5 text-[13px] font-semibold tabular-nums">{it.time.replace(':', '.')}</span>
                  <span className="relative flex justify-center">
                    <span className={cn('relative z-10 mt-1.5 size-3 rounded-full border-2', it.highlight ? 'border-accent bg-accent' : 'border-ink bg-background')} />
                    {i < items.length - 1 && <span className="absolute inset-y-0 top-3 w-px bg-border" />}
                  </span>
                  <button className="mb-5 flex flex-col items-start gap-1 text-left" onClick={() => setItem(it)}>
                    <span className="text-sm font-semibold">{it.activity}</span>
                    {it.note && <span className={cn('text-xs', it.highlight ? 'font-semibold text-accent' : 'text-muted-foreground')}>{it.note}</span>}
                    {!!it.cost && <span className="badge-neutral min-h-5 px-2 text-[11px]">{rupiah(it.cost)}</span>}
                  </button>
                </li>
              ))}
            </ol>
          )}

          <div className="flex items-center justify-between rounded-[18px] bg-muted px-4 py-3.5">
            <span className="text-[13px] text-muted-foreground">Total biaya hari ini</span>
            <span className="text-base font-semibold tabular-nums">{rupiah(cost)}</span>
          </div>
        </>
      )}

      <Modal
        open={!!item}
        onClose={() => setItem(null)}
        title={item?.id ? 'Ubah kegiatan' : 'Tambah kegiatan'}
        footer={
          <>
            {item?.id && (
              <ConfirmButton className="btn-ghost mr-auto text-destructive" onConfirm={() => { saveDay({ items: (day.items ?? []).filter((i) => i.id !== item.id) }); setItem(null) }}>
                <Trash2 className="size-4" aria-hidden /> Hapus
              </ConfirmButton>
            )}
            <button className="btn-ghost" onClick={() => setItem(null)}>Batal</button>
            <button className="btn-primary" onClick={saveItem} disabled={!item?.activity}>Simpan kegiatan</button>
          </>
        }
      >
        <div className="grid grid-cols-[120px_1fr] gap-4">
          <Field label="Jam" htmlFor="it"><input id="it" type="time" className="input" value={item?.time ?? ''} onChange={(e) => setItem({ ...item, time: e.target.value })} /></Field>
          <Field label="Kegiatan" htmlFor="ia"><input id="ia" className="input" value={item?.activity ?? ''} onChange={(e) => setItem({ ...item, activity: e.target.value })} placeholder="mis. Snorkeling di Pink Beach" /></Field>
        </div>
        <Field label="Catatan" htmlFor="in"><input id="in" className="input" value={item?.note ?? ''} onChange={(e) => setItem({ ...item, note: e.target.value })} placeholder="mis. Jangan lupa bawa air minum 1 liter per orang" /></Field>
        <Field label="Biaya (opsional)" htmlFor="ic"><MoneyInput id="ic" value={item?.cost ?? 0} onChange={(n) => setItem({ ...item, cost: n || undefined })} /></Field>
        <Checkbox checked={!!item?.highlight} onChange={(v) => setItem({ ...item, highlight: v })} label="Tandai sebagai momen favorit" strike={false} />
      </Modal>

      <Modal
        open={titleEdit !== null}
        onClose={() => setTitleEdit(null)}
        title={`Judul hari ${active}`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setTitleEdit(null)}>Batal</button>
            <button className="btn-primary" onClick={() => { saveDay({ title: titleEdit?.trim() || undefined }); setTitleEdit(null) }}>Simpan</button>
          </>
        }
      >
        <Field label="Judul" htmlFor="dtl" hint="Bagian akhir judul akan tampil miring, mis. 'Sehari di atas kapal'">
          <input id="dtl" className="input" value={titleEdit ?? ''} onChange={(e) => setTitleEdit(e.target.value)} placeholder="Sehari di atas kapal" />
        </Field>
      </Modal>
    </div>
  )
}
