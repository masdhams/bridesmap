import { Select } from '../../components/select'
import { CategoryPicker } from '../../components/CategoryPicker'
import { HelpHint } from '../../components/HelpHint'
import { GUIDE_HINTS } from '../../data/guide'
import { ChevronDown, ChevronRight, CircleAlert, Pencil, Plus, Printer, RotateCcw, SlidersHorizontal, Store, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryIcon, visualKey } from '../../components/budgetVisual'
import { Amount, Checkbox, ConfirmButton, Field, Modal, MoneyInput, PageHeader, Progress } from '../../components/ui'
import { HIDDEN_COSTS } from '../../data/content'
import { allocTotals, pctOf } from '../../lib/allocation'
import { budgetSummary, budgetTotals, vendorCost, type CategorySummary } from '../../lib/selectors'
import { usePlan } from '../../lib/store'
import type { BudgetItem } from '../../lib/types'
import { cn, fmtDate, rupiah, uid } from '../../lib/utils'

function CategoryCard({ c, vkey, onEdit }: { c: CategorySummary; vkey: string; onEdit: () => void }) {
  const [open, setOpen] = useState(false)
  const [itemModal, setItemModal] = useState<Partial<BudgetItem> | null>(null)
  const { add, update, remove, items: allItems, vendors: allVendors } = usePlan()
  const items = allItems.filter((i) => i.categoryId === c.id)
  const vendors = allVendors.filter((v) => v.categoryId === c.id && v.status === 'booked')
  const over = c.committed > c.allocated && c.allocated > 0

  const saveItem = () => {
    if (!itemModal?.name) return
    if (itemModal.id) update('items', itemModal.id, itemModal)
    else add('items', { id: uid(), categoryId: c.id, name: itemModal.name, amount: itemModal.amount ?? 0, paid: !!itemModal.paid, note: itemModal.note })
    setItemModal(null)
  }

  return (
    <li className="border-b border-divider last:border-0">
      <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <CategoryIcon vkey={vkey} size={40} />
        <div className="min-w-0 flex-1">
          {/* Nama panjang mendorong nominal ke baris berikutnya, jadi nominal tetap tampil penuh. */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-sm font-semibold">{c.name}</span>
              {over && <span className="badge-danger min-h-5 px-2 text-[11px]">lewat</span>}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              <Amount value={c.committed} bare /> <span className="font-medium text-muted-foreground">/ <Amount value={c.allocated} bare /></span>
            </span>
          </div>
          <div className="mt-2">
            <Progress value={c.committed} max={c.allocated || c.committed || 1} tone={over ? 'danger' : c.hidden ? 'accent' : 'primary'} label={`Pemakaian ${c.name}`} />
          </div>
        </div>
        <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="bg-background/60 px-4 pb-4">
          <p className="pt-1 text-xs text-muted-foreground tabular-nums">
            {rupiah(c.committed)} disepakati · {rupiah(c.paid)} dibayar
          </p>
          <ul className="divide-y divide-divider">
            {vendors.map((v) => (
              <li key={v.id} className="flex items-center gap-3 py-2.5 text-sm">
                <Store className="size-4 shrink-0 text-primary" aria-hidden />
                <Link to={`/app/vendor/${v.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-primary">
                  {v.name}
                </Link>
                <span className="font-semibold tabular-nums">{rupiah(vendorCost(v))}</span>
              </li>
            ))}
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-2 py-1.5 text-sm">
                <input type="checkbox" aria-label={`Tandai ${i.name} sudah dibayar`} checked={i.paid} onChange={(e) => update('items', i.id, { paid: e.target.checked })} />
                <button className="min-w-0 flex-1 truncate py-2 text-left hover:text-primary" onClick={() => setItemModal(i)}>
                  {i.name}
                  {i.paid && <span className="ml-2 text-xs text-success">lunas</span>}
                </button>
                <span className="font-semibold tabular-nums">{rupiah(i.amount)}</span>
                <ConfirmButton onConfirm={() => remove('items', i.id)}>
                  <Trash2 className="size-4" />
                </ConfirmButton>
              </li>
            ))}
          </ul>
          {vendors.length === 0 && items.length === 0 && <p className="py-3 text-sm text-muted-foreground">Belum ada pengeluaran. Vendor berstatus "booked" di kategori ini otomatis tampil di sini.</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn-soft btn-sm" onClick={() => setItemModal({ amount: 0, paid: false })}>
              <Plus className="size-4" aria-hidden /> Pengeluaran
            </button>
            <button className="btn-ghost btn-sm" onClick={onEdit}>
              <Pencil className="size-4" aria-hidden /> Ubah kategori
            </button>
          </div>
        </div>
      )}
      <Modal
        open={!!itemModal}
        onClose={() => setItemModal(null)}
        title={itemModal?.id ? 'Ubah pengeluaran' : 'Tambah pengeluaran'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setItemModal(null)}>Batal</button>
            <button className="btn-primary" onClick={saveItem} disabled={!itemModal?.name}>Simpan</button>
          </>
        }
      >
        <Field label="Nama" htmlFor="in"><input id="in" className="input" value={itemModal?.name ?? ''} onChange={(e) => setItemModal({ ...itemModal, name: e.target.value })} placeholder="mis. Sewa tenda tambahan" /></Field>
        <Field label="Jumlah" htmlFor="ia"><MoneyInput id="ia" value={itemModal?.amount ?? 0} onChange={(n) => setItemModal({ ...itemModal, amount: n })} /></Field>
        <Checkbox checked={!!itemModal?.paid} onChange={(v) => setItemModal({ ...itemModal, paid: v })} label="Sudah dibayar" strike={false} />
        <Field label="Catatan" htmlFor="ino"><textarea id="ino" rows={2} className="input" value={itemModal?.note ?? ''} onChange={(e) => setItemModal({ ...itemModal, note: e.target.value })} /></Field>
      </Modal>
    </li>
  )
}

/** Kartu atas: total budget (bisa diubah) dan tiga angka utama: disepakati, sudah dibayar, sisa. */
function HeroCard({ sum, onEditTotal }: { sum: CategorySummary[]; onEditTotal: () => void }) {
  const { profile } = usePlan()
  const t = budgetTotals(sum)
  const total = profile.totalBudget
  const left = total - t.committed
  const used = total > 0 ? Math.round((t.committed / total) * 100) : 0
  const status = left < 0 ? { cls: 'badge-danger', text: 'Over budget' } : used >= 90 ? { cls: 'badge-warning', text: 'Mendekati batas' } : { cls: 'badge-success', text: 'Sesuai rencana' }
  const stats = [
    { label: 'Disepakati', value: rupiah(t.committed), tone: 'text-ink' },
    { label: 'Sudah dibayar', value: rupiah(t.paid), tone: 'text-success' },
    { label: left < 0 ? 'Melewati budget' : 'Sisa', value: rupiah(Math.abs(left)), tone: left < 0 ? 'text-destructive' : 'text-ink' },
  ]
  return (
    <section className="card flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="eyebrow text-[11px]">Total budget</span>
          <button onClick={onEditTotal} className="group inline-flex items-center gap-2 text-left" aria-label={`Total budget ${rupiah(total)}. Ketuk untuk mengubah`}>
            <span className="font-serif text-[34px] leading-none tabular-nums sm:text-[40px]">{rupiah(total)}</span>
            <Pencil className="size-4 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-ink" aria-hidden />
          </button>
        </div>
        <span className={cn(status.cls, 'min-h-[26px] shrink-0 text-xs')}>{status.text}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={100} aria-label="Bagian budget yang sudah disepakati">
          <div className={cn('h-full rounded-full transition-[width] duration-700 bar-grow', left < 0 ? 'bg-destructive' : 'bg-primary')} style={{ width: `${Math.min(100, used)}%` }} />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">{used}% dari total budget sudah disepakati</span>
      </div>
      {/* Mobile: tiga baris (label kiri, nominal kanan) supaya nominal tidak terpotong. Layar lebar: tiga kolom. */}
      <dl className="flex flex-col gap-2.5 border-t border-divider pt-4 sm:grid sm:grid-cols-3 sm:gap-0">
        {stats.map((x, i) => (
          <div key={x.label} className={cn('flex items-baseline justify-between gap-3 sm:flex-col sm:justify-start sm:gap-1', i > 0 && 'sm:border-l sm:border-divider sm:pl-4')}>
            <dt className="text-[13px] text-muted-foreground sm:text-xs">{x.label}</dt>
            <dd className={cn('whitespace-nowrap text-[15px] font-semibold tabular-nums', x.tone)}>{x.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** Tab Ringkasan: satu baris per kategori (digabung lintas acara), urut dari alokasi terbesar. Tanpa diagram. */
function Overview({ sum, onOpen }: { sum: CategorySummary[]; onOpen: () => void }) {
  const { categories } = usePlan()
  const groups = new Map<string, { name: string; vkey: string; allocated: number; committed: number }>()
  for (const c of sum) {
    const key = categories.find((x) => x.id === c.id)?.key
    const id = c.hidden ? 'hidden' : (key ?? c.name.toLowerCase())
    const g = groups.get(id) ?? { name: c.hidden ? 'Hidden cost' : c.name, vkey: visualKey({ name: c.name, key, hidden: c.hidden }), allocated: 0, committed: 0 }
    g.allocated += c.allocated
    g.committed += c.committed
    groups.set(id, g)
  }
  const list = [...groups.values()].filter((g) => g.allocated > 0 || g.committed > 0).sort((a, b) => b.allocated - a.allocated)

  if (list.length === 0)
    return (
      <div className="card flex flex-col gap-3 p-5 text-sm text-body">
        <p>Belum ada kategori budget. Atur alokasi di tab Pengaturan.</p>
        <HelpHint>{GUIDE_HINTS.budget}</HelpHint>
      </div>
    )

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5 px-1">
        <h2 className="font-sans text-[15px] font-semibold">Pemakaian per kategori</h2>
        <p className="text-xs text-muted-foreground">Biaya yang sudah disepakati dibanding alokasi tiap kategori.</p>
      </div>
      <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
        {list.map((g) => {
          const pct = g.allocated > 0 ? Math.round((g.committed / g.allocated) * 100) : g.committed > 0 ? 100 : 0
          const over = g.committed > g.allocated && g.allocated > 0
          return (
            <li key={g.name} className="border-b border-divider last:border-0">
              <button onClick={onOpen} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-muted/40">
                <CategoryIcon vkey={g.vkey} />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-semibold leading-tight">{g.name}</span>
                    <span className={cn('shrink-0 text-sm font-semibold tabular-nums', over ? 'text-destructive' : 'text-ink')}>{pct}%</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {rupiah(g.committed)} dari {rupiah(g.allocated)}
                    {over && <span className="font-semibold text-destructive"> · lewat {rupiah(g.committed - g.allocated)}</span>}
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <span className={cn('block h-full rounded-full transition-[width] duration-700 bar-grow', over ? 'bg-destructive' : g.vkey === 'hidden' ? 'bg-accent' : 'bg-primary')} style={{ width: `${Math.min(100, pct)}%` }} />
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Ringkasan alokasi per acara (#39) + jalan masuk ke halaman pengaturan persen/Rupiah. */
function AllocationCard({ sum }: { sum: CategorySummary[] }) {
  const { profile, events, categories } = usePlan()
  const reserved = categories.filter((c) => c.hidden).reduce((a, c) => a + c.allocated, 0)
  const t = allocTotals(profile.totalBudget, events, reserved)
  const over = t.free < 0
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[26px]">
            Alokasi <span className="italic">per acara</span>
          </h2>
          <p className="text-[13px] leading-normal text-muted-foreground">Angka awal adalah estimasi. Ubah dalam persen atau Rupiah.</p>
        </div>
        <Link to="/app/budget/alokasi" className="btn-soft min-h-9 shrink-0 px-3 text-[13px]">
          <SlidersHorizontal className="size-4" aria-hidden /> Atur
        </Link>
      </div>
      {events.length === 0 ? (
        <p className="card p-4 text-sm text-body">Belum ada acara. Rencana lama memakai kategori umum — <Link to="/mulai" className="font-semibold text-primary underline-offset-4 hover:underline">buat rencana baru</Link> untuk alokasi per acara.</p>
      ) : (
        <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
          {events.map((e) => {
            const cats = sum.filter((c) => categories.find((x) => x.id === c.id)?.eventId === e.id)
            const used = cats.reduce((a, c) => a + c.committed, 0)
            return (
              <li key={e.id} className="border-b border-divider px-4 py-3.5 last:border-0">
                <Link to="/app/budget/alokasi" className="flex flex-col gap-2">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold">{e.name}</span>
                    <span className="text-sm font-semibold tabular-nums">{rupiah(e.budget)}</span>
                  </span>
                  <Progress value={used} max={e.budget || used || 1} tone={used > e.budget ? 'danger' : 'primary'} label={`Pemakaian ${e.name}`} />
                  <span className="flex justify-between text-xs text-muted-foreground tabular-nums">
                    <span>{pctOf(e.budget, profile.totalBudget).toString().replace('.', ',')}% dari total</span>
                    <span>terpakai {rupiah(used)}</span>
                  </span>
                </Link>
              </li>
            )
          })}
          {reserved > 0 && (
            <li className="border-b border-divider px-4 py-3.5">
              <Link to="/app/budget/alokasi" className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold">Hidden cost</span>
                  <span className="text-sm font-semibold tabular-nums">{rupiah(reserved)}</span>
                </span>
                <span className="flex justify-between text-xs text-muted-foreground tabular-nums">
                  <span>{pctOf(reserved, profile.totalBudget).toString().replace('.', ',')}% dari total</span>
                  <span>disisihkan lebih dulu</span>
                </span>
              </Link>
            </li>
          )}
          <li className={cn('flex items-center justify-between gap-3 px-4 py-3 text-sm', over ? 'bg-danger-soft text-danger-ink' : 'bg-muted text-body')} role={over ? 'alert' : undefined}>
            <span className="flex items-center gap-2">
              {over && <CircleAlert className="size-4" strokeWidth={2} aria-hidden />}
              {over ? 'Alokasi melebihi budget' : t.free === 0 ? 'Semua budget teralokasi' : 'Belum teralokasi'}
            </span>
            {t.free !== 0 && <span className="font-semibold tabular-nums">{rupiah(Math.abs(t.free))}</span>}
          </li>
        </ul>
      )}
    </section>
  )
}

function HiddenCosts() {
  const { profile, categories, toggleHiddenCost, update } = usePlan()
  const [showAll, setShowAll] = useState(false)
  const byKey = new Map(categories.filter((c) => c.hiddenKey).map((c) => [c.hiddenKey!, c]))
  const est = (key: string) => HIDDEN_COSTS.find((h) => h.key === key)!.estimate({ budget: profile.totalBudget, guests: profile.guestEstimate })
  // Yang sudah dicentang tampil dulu, lalu beberapa saran; sisanya di balik "Lihat semua".
  const ordered = [...HIDDEN_COSTS].sort((a, b) => Number(byKey.has(b.key)) - Number(byKey.has(a.key)))
  const checkedCount = byKey.size
  const visible = showAll ? ordered : ordered.slice(0, Math.max(4, checkedCount + 2))

  const recalc = () => {
    for (const c of categories) if (c.hiddenKey) update('categories', c.id, { allocated: Math.round(est(c.hiddenKey) / 10000) * 10000 })
  }

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[26px]">
            Hidden <span className="italic">cost</span>
          </h2>
          <p className="text-[13px] leading-normal text-muted-foreground">Yang sering bikin budget bengkak. Centang yang berlaku untuk kalian.</p>
        </div>
        <button className="btn-ghost btn-sm" onClick={recalc}>
          <RotateCcw className="size-4" aria-hidden /> Hitung ulang
        </button>
      </div>
      <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
        {visible.map((h) => {
          const cat = byKey.get(h.key)
          const name = h.name.replace(/ \(.+\)$/, '')
          return (
            <li key={h.key} className="border-b border-divider last:border-0">
              <div className="flex min-h-[58px] items-center gap-3 px-4 py-2.5">
                <input type="checkbox" className="check-square" checked={!!cat} onChange={() => toggleHiddenCost(h.key)} aria-label={name} title={h.why} />
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="text-sm font-semibold">{name}</span>
                  {cat ? (
                    h.missed && (
                      <span className="badge-accent min-h-5 self-start px-[7px] text-[11px]">
                        <CircleAlert className="size-3" strokeWidth={2} aria-hidden />
                        Sering terlewat
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground">Disarankan {rupiah(Math.round(est(h.key) / 10000) * 10000)}</span>
                  )}
                </span>
                {cat ? (
                  <span className="text-sm font-semibold tabular-nums">{rupiah(cat.allocated)}</span>
                ) : (
                  <button className="btn-soft min-h-9 px-3 text-[13px]" onClick={() => toggleHiddenCost(h.key)}>
                    Tambah
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {ordered.length > visible.length || showAll ? (
        <button className="btn-ghost btn-sm self-start" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Tampilkan lebih sedikit' : `Lihat semua ${HIDDEN_COSTS.length} biaya`}
        </button>
      ) : null}
      <p className="hint">Estimasi adalah titik awal kasar, bukan harga pasar resmi.</p>
    </section>
  )
}

export default function Budget() {
  const s = usePlan()
  const [edit, setEdit] = useState<{ id?: string; name: string; allocated: number; eventId?: string } | null>(null)
  const [editTotal, setEditTotal] = useState<number | null>(null)
  const [newItem, setNewItem] = useState<Partial<BudgetItem> | null>(null)
  const [tab, setTab] = useState<'ringkasan' | 'kategori' | 'pengaturan'>('ringkasan')
  const vkeyOf = (c: CategorySummary) => visualKey({ name: c.name, hidden: c.hidden, key: s.categories.find((x) => x.id === c.id)?.key })
  const sum = budgetSummary(s)
  // Kelompok daftar kategori: tiap acara, lalu kategori umum/kustom, lalu biaya tersembunyi.
  const eventOf = (id: string) => s.categories.find((c) => c.id === id)?.eventId
  const groups = [
    ...s.events.map((e) => ({ key: e.id, title: e.name, items: sum.filter((c) => eventOf(c.id) === e.id) })),
    { key: 'umum', title: s.events.length ? 'Kategori lain' : 'Kategori', items: sum.filter((c) => !c.hidden && !eventOf(c.id)) },
    { key: 'hidden', title: 'Hidden cost', items: sum.filter((c) => c.hidden) },
  ].filter((g) => g.items.length > 0)

  const saveCat = () => {
    if (!edit?.name) return
    if (edit.id) s.update('categories', edit.id, { name: edit.name, allocated: edit.allocated })
    else s.add('categories', { id: uid(), name: edit.name, allocated: edit.allocated, eventId: edit.eventId })
    setEdit(null)
  }
  const saveItem = () => {
    if (!newItem?.name || !newItem.categoryId) return
    s.add('items', { id: uid(), categoryId: newItem.categoryId, name: newItem.name, amount: newItem.amount ?? 0, paid: !!newItem.paid, note: newItem.note })
    setNewItem(null)
  }

  return (
    <div>
      <PageHeader
        title="Budget"
        subtitle="Biaya vendor yang sudah booked otomatis tersambung ke kategori. Pengeluaran lain bisa dicatat manual."
        actions={
          <>
            <button className="btn-outline btn-sm hidden sm:inline-flex" onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden /> Ekspor PDF
            </button>
            <button className="btn-primary min-h-11 px-4 text-sm" onClick={() => setNewItem({ categoryId: s.categories[0]?.id, amount: 0, paid: false })}>
              <Plus className="size-4" strokeWidth={2} aria-hidden /> Biaya
            </button>
          </>
        }
      />
      <div className="print-only mb-4">
        <p className="font-serif text-2xl">Budget pernikahan {s.profile.partnerA} &amp; {s.profile.partnerB}</p>
        <p className="text-sm">Hari-H {fmtDate(s.profile.weddingDate, 'd MMMM yyyy')} · dicetak {fmtDate(new Date().toISOString().slice(0, 10))}</p>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <HeroCard sum={sum} onEditTotal={() => setEditTotal(s.profile.totalBudget)} />

        <div role="tablist" aria-label="Bagian budget" className="no-print grid grid-cols-3 gap-1 rounded-full border border-border bg-muted p-1">
          {([
            { v: 'ringkasan', label: 'Ringkasan' },
            { v: 'kategori', label: 'Kategori' },
            { v: 'pengaturan', label: 'Pengaturan' },
          ] as const).map((t) => (
            <button
              key={t.v}
              role="tab"
              aria-selected={tab === t.v}
              onClick={() => setTab(t.v)}
              className={cn('min-h-10 rounded-full text-[13px]', tab === t.v ? 'bg-card font-semibold text-ink shadow-[var(--shadow-tab)]' : 'font-medium text-body hover:text-ink')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'ringkasan' && <Overview sum={sum} onOpen={() => setTab('kategori')} />}

        {tab === 'kategori' && (
          <section className="flex flex-col gap-2.5">
            <div className="flex items-end justify-between gap-2">
              <p className="px-1 text-xs text-muted-foreground">Ketuk kategori untuk melihat vendor dan pengeluarannya.</p>
              <button className="btn-ghost btn-sm no-print shrink-0" onClick={() => setEdit({ name: '', allocated: 0 })}>
                <Plus className="size-4" aria-hidden /> Kategori
              </button>
            </div>
            {groups.map((g) => (
              <div key={g.key} className="flex flex-col gap-1.5">
                <p className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{g.title}</p>
                <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
                  {g.items.map((c) => (
                    <CategoryCard key={c.id} c={c} vkey={vkeyOf(c)} onEdit={() => setEdit({ id: c.id, name: c.name, allocated: c.allocated, eventId: s.categories.find((x) => x.id === c.id)?.eventId })} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {tab === 'pengaturan' && (
          <div className="flex flex-col gap-6">
            <AllocationCard sum={sum} />
            <HiddenCosts />
          </div>
        )}
      </div>

      <Modal
        open={!!newItem}
        onClose={() => setNewItem(null)}
        title="Tambah biaya"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setNewItem(null)}>Batal</button>
            <button className="btn-primary" onClick={saveItem} disabled={!newItem?.name}>Simpan</button>
          </>
        }
      >
        <Field label="Nama biaya" htmlFor="bn"><input id="bn" className="input" value={newItem?.name ?? ''} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="mis. Sewa tenda tambahan" /></Field>
        <CategoryPicker idPrefix="bc" value={newItem?.categoryId} onChange={(v) => setNewItem({ ...newItem, categoryId: v })} />
        <Field label="Jumlah" htmlFor="ba"><MoneyInput id="ba" value={newItem?.amount ?? 0} onChange={(n) => setNewItem({ ...newItem, amount: n })} /></Field>
        <Checkbox checked={!!newItem?.paid} onChange={(v) => setNewItem({ ...newItem, paid: v })} label="Sudah dibayar" strike={false} />
        <p className="hint">Biaya vendor tidak perlu dicatat di sini — vendor berstatus Booked otomatis masuk budget.</p>
      </Modal>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Ubah kategori' : 'Kategori baru'}
        footer={
          <>
            {edit?.id && (
              <ConfirmButton
                className="btn-ghost mr-auto text-destructive"
                label="Hapus"
                onConfirm={() => {
                  s.remove('categories', edit.id!)
                  s.replace('items', s.items.filter((i) => i.categoryId !== edit.id))
                  setEdit(null)
                }}
              >
                <Trash2 className="size-4" aria-hidden /> Hapus
              </ConfirmButton>
            )}
            <button className="btn-ghost" onClick={() => setEdit(null)}>Batal</button>
            <button className="btn-primary" onClick={saveCat} disabled={!edit?.name}>Simpan</button>
          </>
        }
      >
        <Field label="Nama kategori" htmlFor="cn"><input id="cn" className="input" value={edit?.name ?? ''} onChange={(e) => setEdit({ ...edit!, name: e.target.value })} /></Field>
        {!edit?.id && s.events.length > 0 && (
          <Field label="Untuk acara" htmlFor="ce">
            <Select id="ce" value={edit?.eventId ?? ''} onChange={(v) => setEdit({ ...edit!, eventId: v || undefined })} options={[{ value: '', label: 'Umum (tanpa acara)' }, ...s.events.map((e) => ({ value: e.id, label: e.name }))]} />
          </Field>
        )}
        <Field label="Alokasi" htmlFor="ca"><MoneyInput id="ca" value={edit?.allocated ?? 0} onChange={(n) => setEdit({ ...edit!, allocated: n })} /></Field>
      </Modal>

      <Modal
        open={editTotal !== null}
        onClose={() => setEditTotal(null)}
        title="Total budget"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditTotal(null)}>Batal</button>
            <button className="btn-primary" onClick={() => { if ((editTotal ?? 0) > 0) s.setTotalBudget(editTotal!); setEditTotal(null) }}>Simpan</button>
          </>
        }
      >
        <Field label="Total budget pernikahan" htmlFor="tt" hint="Alokasi per acara & kategori ikut menyesuaikan dengan persentase yang sama.">
          <MoneyInput id="tt" value={editTotal ?? 0} onChange={setEditTotal} />
        </Field>
      </Modal>
    </div>
  )
}
