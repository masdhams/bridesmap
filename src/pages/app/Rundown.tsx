import { ComboInput } from '../../components/select'
import { CalendarClock, Copy, Plus, Printer, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmButton, Empty, Field, Modal, PageHeader } from '../../components/ui'
import { RUNDOWN_TEMPLATES } from '../../data/content'
import { usePlan } from '../../lib/store'
import type { RundownEvent, RundownItem } from '../../lib/types'
import { cn, fmtDate, uid } from '../../lib/utils'

export default function Rundown() {
  const { rundown, profile, add, update, remove } = usePlan()
  const [activeId, setActiveId] = useState<string | undefined>(rundown[0]?.id)
  const [item, setItem] = useState<Partial<RundownItem> | null>(null)
  const [eventDraft, setEventDraft] = useState<Partial<RundownEvent> | null>(null)
  const [copied, setCopied] = useState(false)
  const ev = rundown.find((r) => r.id === activeId) ?? rundown[0]
  const items = ev ? [...ev.items].sort((a, b) => a.time.localeCompare(b.time)) : []

  const saveItem = () => {
    if (!ev || !item?.activity || !item.time) return
    const list = item.id ? ev.items.map((i) => (i.id === item.id ? ({ ...i, ...item } as RundownItem) : i)) : [...ev.items, { id: uid(), time: item.time, end: item.end, activity: item.activity, pic: item.pic, note: item.note }]
    update('rundown', ev.id, { items: list })
    setItem(null)
  }

  const saveEvent = () => {
    if (!eventDraft?.name) return
    if (eventDraft.id) update('rundown', eventDraft.id, eventDraft)
    else {
      const tpl = RUNDOWN_TEMPLATES[eventDraft.name] ?? []
      const e: RundownEvent = { id: uid(), name: eventDraft.name, date: eventDraft.date ?? profile.weddingDate, location: eventDraft.location, items: tpl.map((t) => ({ id: uid(), ...t })) }
      add('rundown', e)
      setActiveId(e.id)
    }
    setEventDraft(null)
  }

  const shareText = () => {
    if (!ev) return
    const text = [`${ev.name} — ${profile.partnerA} & ${profile.partnerB}`, `${fmtDate(ev.date, 'EEEE, d MMMM yyyy')}${ev.location ? ` · ${ev.location}` : ''}`, '', ...items.map((i) => `${i.time}${i.end ? `–${i.end}` : ''}  ${i.activity}${i.pic ? ` (PIC: ${i.pic})` : ''}`)].join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <PageHeader title="Rundown & timeline hari-H" subtitle="Susunan acara per jam yang bisa dibagikan ke MC, WO, vendor, dan keluarga."
        actions={
          <>
            <button className="btn-outline btn-sm" onClick={shareText} disabled={!ev}><Copy className="size-4" aria-hidden /> {copied ? 'Tersalin!' : 'Salin untuk WA'}</button>
            <button className="btn-outline btn-sm" onClick={() => window.print()}><Printer className="size-4" aria-hidden /> PDF</button>
          </>
        } />

      <div className="no-print mb-4 flex flex-wrap gap-2">
        {rundown.map((r) => (
          <button key={r.id} onClick={() => setActiveId(r.id)} className={cn('chip min-h-10 px-4 text-sm border', ev?.id === r.id ? 'border-primary bg-primary text-on-primary' : 'border-border bg-card text-ink hover:border-primary/50')}>{r.name}</button>
        ))}
        <button className="chip min-h-10 px-4 text-sm border border-dashed border-border text-muted-foreground hover:text-primary" onClick={() => setEventDraft({ name: '', date: profile.weddingDate })}><Plus className="size-4" aria-hidden /> Acara</button>
      </div>

      {!ev ? (
        <Empty icon={<CalendarClock className="size-6" />} title="Belum ada acara" />
      ) : (
        <section className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-3xl font-semibold">{ev.name}</h2>
              <p className="text-sm text-muted-foreground">{fmtDate(ev.date, 'EEEE, d MMMM yyyy')}{ev.location && ` · ${ev.location}`}</p>
            </div>
            <div className="no-print flex gap-2">
              <button className="btn-ghost btn-sm" onClick={() => setEventDraft(ev)}>Ubah acara</button>
              <ConfirmButton className="btn-ghost btn-sm text-destructive" onConfirm={() => { remove('rundown', ev.id); setActiveId(undefined) }}>Hapus</ConfirmButton>
            </div>
          </div>
          <ol className="relative mt-5 border-l-2 border-primary-soft pl-5">
            {items.map((i) => (
              <li key={i.id} className="relative mb-4 last:mb-0">
                <span className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-card bg-primary" aria-hidden />
                <div className="flex items-start gap-3">
                  <button className="min-w-0 flex-1 text-left" onClick={() => setItem(i)}>
                    <p className="text-sm font-bold tabular-nums text-primary">{i.time}{i.end && `–${i.end}`}</p>
                    <p className="font-medium text-ink">{i.activity}</p>
                    {(i.pic || i.note) && <p className="text-xs text-muted-foreground">{i.pic && `PIC: ${i.pic}`}{i.pic && i.note && ' · '}{i.note}</p>}
                  </button>
                  <div className="no-print"><ConfirmButton onConfirm={() => update('rundown', ev.id, { items: ev.items.filter((x) => x.id !== i.id) })}><Trash2 className="size-4" /></ConfirmButton></div>
                </div>
              </li>
            ))}
          </ol>
          <button className="no-print btn-outline btn-sm mt-4" onClick={() => setItem({ time: items.at(-1)?.time ?? '08:00' })}><Plus className="size-4" aria-hidden /> Susunan acara</button>
        </section>
      )}

      <Modal open={!!item} onClose={() => setItem(null)} title={item?.id ? 'Ubah susunan' : 'Tambah susunan'}
        footer={<><button className="btn-ghost" onClick={() => setItem(null)}>Batal</button><button className="btn-primary" onClick={saveItem} disabled={!item?.activity}>Simpan</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Mulai" htmlFor="rt"><input id="rt" type="time" className="input" value={item?.time ?? ''} onChange={(e) => setItem({ ...item, time: e.target.value })} /></Field>
          <Field label="Selesai (opsional)" htmlFor="re"><input id="re" type="time" className="input" value={item?.end ?? ''} onChange={(e) => setItem({ ...item, end: e.target.value })} /></Field>
        </div>
        <Field label="Kegiatan" htmlFor="ra"><input id="ra" className="input" value={item?.activity ?? ''} onChange={(e) => setItem({ ...item, activity: e.target.value })} /></Field>
        <Field label="PIC" htmlFor="rp"><input id="rp" className="input" value={item?.pic ?? ''} onChange={(e) => setItem({ ...item, pic: e.target.value })} placeholder="MC / WO / keluarga" /></Field>
        <Field label="Catatan" htmlFor="rn"><input id="rn" className="input" value={item?.note ?? ''} onChange={(e) => setItem({ ...item, note: e.target.value })} /></Field>
      </Modal>

      <Modal open={!!eventDraft} onClose={() => setEventDraft(null)} title={eventDraft?.id ? 'Ubah acara' : 'Acara baru'}
        footer={<><button className="btn-ghost" onClick={() => setEventDraft(null)}>Batal</button><button className="btn-primary" onClick={saveEvent} disabled={!eventDraft?.name}>Simpan</button></>}>
        <Field label="Nama acara" htmlFor="en" hint={!eventDraft?.id ? 'Ketik "Akad nikah" atau "Resepsi" untuk memakai template.' : undefined}>
          <ComboInput id="en" value={eventDraft?.name ?? ''} onChange={(v) => setEventDraft({ ...eventDraft, name: v })} suggestions={Object.keys(RUNDOWN_TEMPLATES)} placeholder="mis. Siraman, Midodareni, Resepsi" />
        </Field>
        <Field label="Tanggal" htmlFor="ed"><input id="ed" type="date" className="input" value={eventDraft?.date ?? ''} onChange={(e) => setEventDraft({ ...eventDraft, date: e.target.value })} /></Field>
        <Field label="Lokasi" htmlFor="el"><input id="el" className="input" value={eventDraft?.location ?? ''} onChange={(e) => setEventDraft({ ...eventDraft, location: e.target.value })} /></Field>
      </Modal>
    </div>
  )
}
