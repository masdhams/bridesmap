import { ImageUp, Pencil, Plus, StickyNote, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { ConfirmButton, PageHeader } from '../../components/ui'
import { usePlan } from '../../lib/store'
import { cn, compressImage, uid } from '../../lib/utils'

export default function Vision() {
  const { boards, add, update, remove } = usePlan()
  const [activeId, setActiveId] = useState<string | undefined>(boards[0]?.id)
  const [note, setNote] = useState('')
  const [color, setColor] = useState('#E8B4B8')
  const board = boards.find((b) => b.id === activeId) ?? boards[0]

  if (!board) return null
  const setBoard = (patch: Partial<typeof board>) => update('boards', board.id, patch)

  return (
    <div>
      <PageHeader back="/app" title="Vision Board" subtitle="Punya gambaran dekorasi dan tampilan wedding impian? Kumpulkan warna, bunga, dan referensi favorit kalian di sini. Nanti, tinggal bagikan ke vendor." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {boards.map((b) => (
          <button key={b.id} onClick={() => setActiveId(b.id)} className={cn('chip min-h-10 px-4 text-sm border', board.id === b.id ? 'border-primary bg-primary text-on-primary' : 'border-border bg-card text-ink')}>{b.name}</button>
        ))}
        <button className="chip min-h-10 border border-dashed border-border px-4 text-sm text-muted-foreground hover:text-primary" onClick={() => { const b = { id: uid(), name: `Board ${boards.length + 1}`, colors: [], items: [] }; add('boards', b); setActiveId(b.id) }}>
          <Plus className="size-4" aria-hidden /> Board
        </button>
      </div>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="group flex min-w-0 flex-1 items-center gap-2 rounded-xl border-b border-dashed border-line pb-0.5 focus-within:border-primary hover:border-ink" title="Klik untuk mengganti nama board">
            <input aria-label="Nama board (bisa diubah)" className="min-w-0 flex-1 bg-transparent font-serif text-2xl text-foreground focus:outline-none" value={board.name} onChange={(e) => setBoard({ name: e.target.value })} />
            <Pencil className="size-4 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-ink group-focus-within:text-primary" strokeWidth={1.8} aria-hidden />
          </label>
          {boards.length > 1 && <ConfirmButton className="btn-ghost btn-sm text-destructive" onConfirm={() => { remove('boards', board.id); setActiveId(undefined) }}>Hapus board</ConfirmButton>}
        </div>

        <h2 className="mt-5 font-sans text-sm font-semibold text-ink">Palet warna</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {board.colors.map((c, i) => (
            <div key={i} className="group relative">
              <div className="size-14 rounded-2xl border border-border shadow-[var(--shadow-soft)]" style={{ background: c }} title={c} />
              <span className="mt-1 block text-center text-[10px] font-mono text-muted-foreground">{c}</span>
              <button className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-card shadow text-muted-foreground" aria-label={`Hapus warna ${c}`} onClick={() => setBoard({ colors: board.colors.filter((_, j) => j !== i) })}><X className="size-3.5" /></button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="color" aria-label="Pilih warna" className="size-11 cursor-pointer rounded-xl border border-border bg-card p-1" value={color} onChange={(e) => setColor(e.target.value)} />
            <button className="btn-outline btn-sm" onClick={() => setBoard({ colors: [...board.colors, color.toUpperCase()] })}>Tambah warna</button>
          </div>
        </div>

        <h2 className="mt-6 font-sans text-sm font-semibold text-ink">Referensi</h2>
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) { setBoard({ items: [...board.items, { id: uid(), type: 'note', content: note.trim() }] }); setNote('') } }}>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. Baby breath dan mawar putih untuk dekorasi, dengan sentuhan rustic" aria-label="Catatan inspirasi" />
          <button className="btn-primary shrink-0" disabled={!note.trim()}><StickyNote className="size-4" aria-hidden /> Simpan catatan</button>
        </form>
        <div className="mt-3">
          <label className="btn-outline btn-sm">
            <ImageUp className="size-4" aria-hidden /> Tambahkan foto referensi
            <input type="file" accept="image/*" multiple className="sr-only" onChange={async (e) => {
              const files = Array.from(e.target.files ?? [])
              const imgs = await Promise.all(files.map((f) => compressImage(f, 800, 0.65)))
              setBoard({ items: [...board.items, ...imgs.map((content) => ({ id: uid(), type: 'image' as const, content }))] })
            }} />
          </label>
        </div>

        <div className="mt-4 columns-2 gap-3 sm:columns-3">
          {board.items.map((it) => (
            <div key={it.id} className="group relative mb-3 break-inside-avoid">
              {it.type === 'image' ? (
                <img src={it.content} alt="Referensi" className="w-full rounded-2xl" loading="lazy" />
              ) : (
                <p className="rounded-2xl bg-accent-soft/60 p-4 font-serif text-2xl text-ink">{it.content}</p>
              )}
              <button className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-card/90 text-muted-foreground shadow" aria-label="Hapus foto referensi" onClick={() => setBoard({ items: board.items.filter((x) => x.id !== it.id) })}><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
        {board.items.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Belum ada inspirasi yang disimpan. Tambahkan warna, catatan, atau foto yang kalian suka.</p>}
      </section>
    </div>
  )
}
