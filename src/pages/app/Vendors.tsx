import { Select } from '../../components/select'
import { CategoryPicker } from '../../components/CategoryPicker'
import { Check, Plus, Search, ShieldCheck, Store } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VendorRow } from '../../components/cards'
import { HelpHint } from '../../components/HelpHint'
import { GUIDE_HINTS } from '../../data/guide'
import { dueBadge } from './Dashboard'
import { CategoryTiles, CompareView, typeOfCategory, VendorStats, vendorTypes } from '../../components/vendorViews'
import { Empty, Field, FilterChips, Modal, MoneyInput, PageHeader, Segmented } from '../../components/ui'
import { paymentsPaid, upcomingPayments, vendorCost, vendorPayStatus, categoryLabel } from '../../lib/selectors'
import { usePlan } from '../../lib/store'
import type { Vendor, VendorStatus } from '../../lib/types'
import { cn, daysUntil, fmtDate, rupiah, uid } from '../../lib/utils'

const STATUS_DOT: Record<VendorStatus, string> = { kandidat: 'bg-muted-foreground', negosiasi: 'bg-warning', booked: 'bg-success', batal: 'bg-destructive' }

export const STATUS_LABEL: Record<VendorStatus, string> = { kandidat: 'Kandidat', negosiasi: 'Negosiasi', booked: 'Booked', batal: 'Batal' }
export const STATUS_STYLE: Record<VendorStatus, string> = {
  kandidat: 'bg-muted text-muted-foreground',
  negosiasi: 'bg-warning-soft text-warning',
  booked: 'bg-success-soft text-success',
  batal: 'bg-danger-soft text-danger-ink',
}
const PAY_LABEL = { belum: 'Belum bayar', dp: 'DP / sebagian', lunas: 'Lunas' }

export function VendorForm({ value, onChange }: { value: Partial<Vendor>; onChange: (v: Partial<Vendor>) => void }) {
  return (
    <>
      <Field label="Nama vendor" htmlFor="vn"><input id="vn" className="input" value={value.name ?? ''} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="mis. Katering Ibu Sari" /></Field>
      <CategoryPicker idPrefix="vc" value={value.categoryId} onChange={(v) => onChange({ ...value, categoryId: v })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="PIC / narahubung" htmlFor="vpic" hint="Nama orang yang kalian hubungi di vendor."><input id="vpic" className="input" value={value.pic ?? ''} onChange={(e) => onChange({ ...value, pic: e.target.value || undefined })} placeholder="mis. Mbak Sari" /></Field>
        <Field label="Kontak (WA/telepon)" htmlFor="vp"><input id="vp" className="input" inputMode="tel" value={value.contact ?? ''} onChange={(e) => onChange({ ...value, contact: e.target.value })} /></Field>
      </div>
      <Field label="Tautan (IG/website)" htmlFor="vl"><input id="vl" className="input" value={value.link ?? ''} onChange={(e) => onChange({ ...value, link: e.target.value })} placeholder="https://" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Harga penawaran" htmlFor="vq"><MoneyInput id="vq" value={value.quote ?? 0} onChange={(n) => onChange({ ...value, quote: n })} /></Field>
        <Field label="Harga disepakati" htmlFor="va" hint="Masuk ke budget saat status Booked"><MoneyInput id="va" value={value.agreedPrice ?? 0} onChange={(n) => onChange({ ...value, agreedPrice: n || undefined })} /></Field>
      </div>
      <Field label="Status" htmlFor="vs">
        <Select id="vs" value={value.status ?? 'kandidat'} onChange={(v) => onChange({ ...value, status: v as VendorStatus })} options={Object.entries(STATUS_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
      </Field>
      <Field label="Catatan" htmlFor="vno"><textarea id="vno" rows={3} className="input" value={value.notes ?? ''} onChange={(e) => onChange({ ...value, notes: e.target.value })} placeholder="Isi paket, syarat pembatalan, nomor kontrak…" /></Field>
    </>
  )
}

export default function Vendors() {
  const { vendors, categories, events, add } = usePlan()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'semua' | VendorStatus>('semua')
  const [catFilter, setCatFilter] = useState('semua')
  const [q, setQ] = useState('')
  const [view, setView] = useState<'daftar' | 'bandingkan'>('daftar')
  const [draft, setDraft] = useState<Partial<Vendor> | null>(null)
  // Jenis kategori digabung lintas acara (mis. "Venue" di Akad dan Resepsi dihitung satu).
  const typeOf = (v: Vendor) => {
    const c = categories.find((x) => x.id === v.categoryId)
    return c ? typeOfCategory(c) : 'lainnya'
  }
  const types = vendorTypes(categories, vendors)
  // Cari di nama, kategori, kontak, dan catatan vendor.
  const query = q.trim().toLowerCase()
  const matches = (v: Vendor) => !query || [v.name, categories.find((c) => c.id === v.categoryId)?.name, v.contact, v.pic, v.notes].some((x) => x?.toLowerCase().includes(query))
  const inCat = vendors.filter((v) => (catFilter === 'semua' || typeOf(v) === catFilter) && matches(v))
  const list = inCat.filter((v) => filter === 'semua' || v.status === filter)
  const overdue = upcomingPayments(vendors).filter((p) => daysUntil(p.dueDate) < 0).length

  const save = () => {
    if (!draft?.name || !draft.categoryId) return
    const v: Vendor = { id: uid(), name: draft.name, categoryId: draft.categoryId, contact: draft.contact, pic: draft.pic, link: draft.link, quote: draft.quote ?? 0, agreedPrice: draft.agreedPrice, status: draft.status ?? 'kandidat', notes: draft.notes, payments: [] }
    add('vendors', v)
    setDraft(null)
    navigate(`/app/vendor/${v.id}`)
  }

  return (
    <div>
      <PageHeader title="Vendor & pembayaran" subtitle="Simpan kandidat, bandingkan harga, lalu atur jadwal DP sampai pelunasan untuk vendor yang di-booking."
        actions={<button className="btn-primary btn-sm" onClick={() => setDraft({ categoryId: categories[0]?.id, status: 'kandidat', quote: 0 })}><Plus className="size-4" aria-hidden /> Vendor</button>} />

      <div className="card-flat mb-5 flex gap-3 p-5 text-sm">
        <ShieldCheck className="size-5 shrink-0 text-success" aria-hidden />
        <p className="text-ink">
          <strong>Sebelum bayar DP:</strong> minta kontrak tertulis, cek alamat &amp; ulasan nyata, bayar ke rekening atas nama usaha, dan bayar bertahap sesuai progres. Simpan setiap bukti transfer di sini.
        </p>
      </div>
      {overdue > 0 && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-destructive">{overdue} pembayaran sudah lewat jatuh tempo.</p>}

      {vendors.length > 0 && (
        <div className="mb-5 flex flex-col gap-4">
          <VendorStats vendors={vendors} types={types} typeOf={typeOf} />
          <CategoryTiles
            types={types}
            vendors={vendors}
            typeOf={typeOf}
            value={catFilter}
            onChange={setCatFilter}
            onAdd={(categoryId) => setDraft({ categoryId, status: 'kandidat', quote: 0 })}
          />
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="flex min-h-[50px] items-center gap-2.5 rounded-[14px] border border-input bg-card px-3.5 focus-within:border-primary sm:flex-1">
              <Search className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden />
              <input type="search" className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Cari nama vendor, PIC, kontak, atau catatan" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari vendor" />
            </div>
            <Segmented label="Tampilan vendor" value={view} onChange={setView} options={[{ value: 'daftar', label: 'Daftar' }, { value: 'bandingkan', label: 'Bandingkan' }]} />
          </div>
          <FilterChips
            label="Filter status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'semua', label: <>Semua <span className="tabular-nums opacity-70">{inCat.length}</span></> },
              ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value: value as VendorStatus, label: <><span aria-hidden className={cn('size-2 rounded-full', STATUS_DOT[value as VendorStatus])} />{label} <span className="tabular-nums opacity-70">{inCat.filter((v) => v.status === value).length}</span></> })),
            ]}
          />
        </div>
      )}

      {vendors.length > 0 && list.length === 0 ? (
        <div className="card flex flex-col items-start gap-3 p-5 text-sm text-body">
          <p>Tidak ada vendor yang cocok dengan filter ini.</p>
          <button className="btn-soft btn-sm" onClick={() => { setCatFilter('semua'); setFilter('semua'); setQ('') }}>Tampilkan semua vendor</button>
        </div>
      ) : list.length === 0 ? (
        <Empty icon={<Store className="size-6" />} title="Belum ada vendor" action={<div className="flex flex-col items-center gap-4"><button className="btn-primary" onClick={() => setDraft({ categoryId: categories[0]?.id, status: 'kandidat', quote: 0 })}>Tambah vendor pertama</button><HelpHint>{GUIDE_HINTS.vendor}</HelpHint></div>}>
          Catat kandidat vendor per kategori beserta harga penawaran, lalu ubah ke Booked saat sudah sepakat.
        </Empty>
      ) : view === "bandingkan" ? (
        <CompareView vendors={list} types={types} typeOf={typeOf} />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((v) => {
            const pay = vendorPayStatus(v)
            const sorted = [...v.payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            const next = sorted.find((p) => !p.paidDate)
            const catObj = categories.find((c) => c.id === v.categoryId)
            const cat = catObj ? categoryLabel(catObj, events) : '—'
            const sub =
              v.status === 'booked' && next
                ? `${cat} · termin ${sorted.indexOf(next) + 1} dari ${sorted.length} · ${fmtDate(next.dueDate, 'd MMM')}`
                : v.status === 'booked'
                  ? `${cat} · ${PAY_LABEL[pay]} · ${rupiah(paymentsPaid(v))} dibayar`
                  : `${cat}${v.contact ? ` · ${v.contact}` : ''}`
            const badge =
              v.status === 'booked' && pay === 'lunas' ? (
                <span className="badge-success min-h-7 text-xs"><Check className="size-3.5" strokeWidth={2.4} aria-hidden />Lunas</span>
              ) : v.status === 'booked' && next ? (
                dueBadge(next.dueDate)
              ) : (
                <span className={cn('chip min-h-7 text-xs', STATUS_STYLE[v.status])}>{STATUS_LABEL[v.status]}</span>
              )
            return (
              <li key={v.id}>
                <VendorRow to={`/app/vendor/${v.id}`} name={v.name} sub={sub} amount={rupiah(vendorCost(v))} badge={badge} />
              </li>
            )
          })}
        </ul>
      )}

      <Modal open={!!draft} onClose={() => setDraft(null)} title="Tambah vendor"
        footer={<><button className="btn-ghost" onClick={() => setDraft(null)}>Batal</button><button className="btn-primary" onClick={save} disabled={!draft?.name}>Simpan</button></>}>
        {draft && <VendorForm value={draft} onChange={setDraft} />}
      </Modal>
    </div>
  )
}
