import { Gift, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PanelBar } from '../../components/bento'
import { IcSeserahan } from '../../components/icons'
import { ConfirmButton, Empty, Field, Modal, MoneyInput, PageHeader, PartnerAvatar, Progress, Segmented } from '../../components/ui'
import { usePlan } from '../../lib/store'
import type { Partner, SeserahanItem } from '../../lib/types'
import { cn, rupiah, rupiahShort, uid } from '../../lib/utils'

export default function Seserahan() {
  const { seserahan, profile, add, update, remove } = usePlan()
  const [draft, setDraft] = useState<Partial<SeserahanItem> | null>(null)
  const ready = seserahan.filter((s) => s.ready).length
  const total = seserahan.reduce((a, s) => a + s.budget, 0)
  const name = (p: Partner) => (p === 'A' ? profile.partnerA : profile.partnerB)

  const save = () => {
    if (!draft?.name) return
    if (draft.id) update('seserahan', draft.id, draft)
    else add('seserahan', { id: uid(), name: draft.name, from: draft.from ?? 'A', budget: draft.budget ?? 0, ready: false })
    setDraft(null)
  }

  return (
    <div>
      <PageHeader back="/app" title="Seserahan" subtitle="Daftar barang seserahan per pihak beserta perkiraan biaya dan status persiapan."
        actions={<button className="btn-primary btn-sm" onClick={() => setDraft({ from: 'A', budget: 0 })}><Plus className="size-4" aria-hidden /> Barang</button>} />
      <div className="card mb-5 p-4 lg:hidden">
        <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold">{ready} dari {seserahan.length} sudah siap</span><span className="tabular-nums text-muted-foreground">Total perkiraan {rupiah(total)}</span></div>
        <div className="mt-2"><Progress value={ready} max={seserahan.length} label="Progres seserahan" /></div>
      </div>
      {/* Desktop: tiga kartu ringkasan. */}
      <div className="mb-6 hidden gap-4 lg:grid lg:grid-cols-3">
        <section className="flex flex-col gap-4 rounded-[28px] bg-primary p-6 text-white shadow-[var(--shadow-soft)]">
          <span className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-white/10">
              <IcSeserahan className="size-5" strokeWidth={1.8} aria-hidden />
            </span>
            <span className="flex flex-col">
              <span className="text-[17px] font-semibold">Sudah siap</span>
              <span className="text-xs text-[#D5DCCB]">Total perkiraan {rupiah(total)}</span>
            </span>
          </span>
          <span className="mt-auto font-serif text-[52px] leading-[0.85] tabular-nums">
            {ready}
            <span className="text-[26px] text-[#D5DCCB]">/{seserahan.length}</span>
          </span>
          <PanelBar value={ready} max={seserahan.length} />
        </section>
        {(['A', 'B'] as Partner[]).map((p) => {
          const list = seserahan.filter((s) => s.from === p)
          const done = list.filter((s) => s.ready).length
          return (
            <section key={p} className="card flex flex-col gap-4 p-6">
              <span className="flex items-center gap-3">
                <PartnerAvatar who={p} name={name(p)} size={44} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[17px] font-semibold">Dari pihak {name(p)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{done} dari {list.length} siap</span>
                </span>
              </span>
              <span className="mt-auto font-serif text-[36px] leading-none tabular-nums">{rupiahShort(list.reduce((a, s) => a + s.budget, 0))}</span>
              <Progress value={done} max={list.length || 1} label={`Progres seserahan pihak ${name(p)}`} />
            </section>
          )
        })}
      </div>
      {seserahan.length === 0 ? (
        <Empty icon={<Gift className="size-6" />} title="Belum ada barang seserahan" />
      ) : (
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
        {(['A', 'B'] as Partner[]).map((p) => {
          const list = seserahan.filter((s) => s.from === p)
          if (!list.length) return null
          return (
            <section key={p} className="mb-5">
              <h2 className="mb-3 text-2xl">Dari pihak {name(p)}</h2>
              <ul className="card divide-y divide-border/60 px-4">
                {list.map((s) => (
                  <li key={s.id} className="flex items-center gap-3">
                    <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 py-2">
                      <input type="checkbox" className="" checked={s.ready} onChange={(e) => update('seserahan', s.id, { ready: e.target.checked })} />
                      <span className={cn('min-w-0 flex-1', s.ready && 'text-muted-foreground line-through')}>{s.name}</span>
                    </label>
                    <button className="text-sm tabular-nums text-muted-foreground hover:text-primary py-2" onClick={() => setDraft(s)}>{rupiah(s.budget)}</button>
                    <ConfirmButton onConfirm={() => remove('seserahan', s.id)}><Trash2 className="size-4" /></ConfirmButton>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        </div>
      )}
      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Ubah barang' : 'Barang seserahan'}
        footer={<><button className="btn-ghost" onClick={() => setDraft(null)}>Batal</button><button className="btn-primary" onClick={save} disabled={!draft?.name}>Simpan</button></>}>
        <Field label="Nama barang" htmlFor="sn"><input id="sn" className="input" value={draft?.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <div><p className="label">Dari pihak</p><Segmented label="Dari pihak" value={draft?.from ?? 'A'} onChange={(from) => setDraft({ ...draft, from })} options={[{ value: 'A', label: profile.partnerA }, { value: 'B', label: profile.partnerB }]} /></div>
        <Field label="Perkiraan biaya" htmlFor="sb"><MoneyInput id="sb" value={draft?.budget ?? 0} onChange={(n) => setDraft({ ...draft, budget: n })} /></Field>
      </Modal>
    </div>
  )
}
