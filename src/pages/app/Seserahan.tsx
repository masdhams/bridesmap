import { Gift, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmButton, Empty, Field, Modal, MoneyInput, PageHeader, Progress, Segmented } from '../../components/ui'
import { usePlan } from '../../lib/store'
import type { Partner, SeserahanItem } from '../../lib/types'
import { cn, rupiah, uid } from '../../lib/utils'

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
      <PageHeader title="Seserahan" subtitle="Daftar barang seserahan per pihak beserta perkiraan biaya dan status persiapan."
        actions={<button className="btn-primary btn-sm" onClick={() => setDraft({ from: 'A', budget: 0 })}><Plus className="size-4" aria-hidden /> Barang</button>} />
      <div className="card mb-5 p-4">
        <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold">{ready} dari {seserahan.length} sudah siap</span><span className="tabular-nums text-muted-foreground">Total perkiraan {rupiah(total)}</span></div>
        <div className="mt-2"><Progress value={ready} max={seserahan.length} label="Progres seserahan" /></div>
      </div>
      {seserahan.length === 0 ? (
        <Empty icon={<Gift className="size-6" />} title="Belum ada barang seserahan" />
      ) : (
        (['A', 'B'] as Partner[]).map((p) => {
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
        })
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
