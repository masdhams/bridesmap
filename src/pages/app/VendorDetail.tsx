import { ArrowLeft, CalendarPlus, Check, ExternalLink, Pencil, Phone, Plus, Receipt, Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { initials } from '../../components/cards'
import { ConfirmButton, Field, Modal, MoneyInput } from '../../components/ui'
import { googleCalendarUrl } from '../../lib/calendar'
import { paymentsPaid, paymentsScheduled, vendorCost, categoryLabel } from '../../lib/selectors'
import { usePlan } from '../../lib/store'
import type { Payment, Vendor } from '../../lib/types'
import { cn, compressImage, daysUntil, fmtDate, rupiah, todayISO, uid } from '../../lib/utils'
import { STATUS_LABEL, VendorForm } from './Vendors'

const payEvent = (v: Vendor, p: Payment) => ({
  uid: `pay-${p.id}`,
  title: `Bayar ${p.label} — ${v.name}`,
  date: p.dueDate,
  description: 'Jatuh tempo pembayaran vendor. Cek nominal & bukti transfer di Bridesmap.',
  alarmDays: 7,
})

export default function VendorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { vendors, categories, events, update, remove, profile } = usePlan()
  const v = vendors.find((x) => x.id === id)
  const [editing, setEditing] = useState<Partial<Vendor> | null>(null)
  const [payDraft, setPayDraft] = useState<Partial<Payment> | null>(null)
  const [proofView, setProofView] = useState<string | null>(null)
  const [uploadErr, setUploadErr] = useState('')
  if (!v) return <Navigate to="/app/vendor" replace />

  const cost = vendorCost(v)
  const paid = paymentsPaid(v)
  const scheduled = paymentsScheduled(v)
  const payments = [...v.payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const current = payments.find((p) => !p.paidDate)
  const unpaid = payments.filter((p) => !p.paidDate)
  const setPayments = (list: Payment[]) => update('vendors', v.id, { payments: list })
  const patchPay = (pid: string, patch: Partial<Payment>) => setPayments(v.payments.map((x) => (x.id === pid ? { ...x, ...patch } : x)))
  const catObj = categories.find((c) => c.id === v.categoryId)
  const category = catObj ? categoryLabel(catObj, events) : 'Vendor'
  const hMinus = (iso: string) => {
    const d = Math.round((new Date(profile.weddingDate).getTime() - new Date(iso).getTime()) / 864e5)
    return d > 0 ? ` · H-${d}` : ''
  }

  const savePay = () => {
    if (!payDraft?.label || !payDraft.dueDate) return
    if (payDraft.id) patchPay(payDraft.id, payDraft)
    else setPayments([...v.payments, { id: uid(), label: payDraft.label, amount: payDraft.amount ?? 0, dueDate: payDraft.dueDate }])
    setPayDraft(null)
  }

  const quickSplit = () => {
    const dp = Math.round((cost * 0.3) / 1000) * 1000
    const due = profile.weddingDate ? new Date(new Date(profile.weddingDate).getTime() - 14 * 864e5).toISOString().slice(0, 10) : todayISO()
    setPayments([...v.payments, { id: uid(), label: 'DP 30%', amount: dp, dueDate: todayISO() }, { id: uid(), label: 'Pelunasan', amount: cost - dp, dueDate: due }])
  }

  const onProof = async (p: Payment, file?: File) => {
    if (!file) return
    setUploadErr('')
    try {
      const proof = await compressImage(file, 1200, 0.7)
      patchPay(p.id, { proof, paidDate: p.paidDate ?? todayISO() })
    } catch {
      setUploadErr('Foto tidak bisa dibaca. Coba format JPG atau PNG.')
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 xl:grid xl:max-w-none xl:grid-cols-2 xl:items-start xl:gap-5 xl:[&>header]:col-span-2 xl:[&>div]:col-span-2">
      <header className="flex h-11 items-center gap-3">
        <Link to="/app/vendor" aria-label="Kembali ke daftar vendor" className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card hover:bg-muted">
          <ArrowLeft className="size-5" strokeWidth={1.8} />
        </Link>
        <span className="flex-1 text-[15px] font-semibold">Detail vendor</span>
        <button className="icon-btn border border-border bg-card" aria-label="Ubah vendor" onClick={() => setEditing(v)}>
          <Pencil className="size-[18px]" strokeWidth={1.8} />
        </button>
      </header>

      <section className="flex flex-col gap-3.5">
        <div className="flex items-center gap-3.5">
          <span className="grid size-14 shrink-0 place-items-center rounded-[18px] bg-muted font-serif text-[26px]">{initials(v.name)}</span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="text-[30px] leading-[1.05]">{v.name}</h1>
            <span className="text-[13px] text-muted-foreground">
              {category} · {STATUS_LABEL[v.status]}
              {payments.length > 0 && ` · ${payments.length} termin`}
            </span>
          </div>
        </div>
        {(v.contact || v.link) && (
          <div className="flex flex-wrap gap-2">
            {v.contact && (
              <a href={`tel:${v.contact}`} className="btn-outline btn-sm">
                <Phone className="size-4" aria-hidden /> {v.contact}
              </a>
            )}
            {v.link && (
              <a href={v.link.startsWith('http') ? v.link : `https://${v.link}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                <ExternalLink className="size-4" aria-hidden /> Tautan
              </a>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2.5 rounded-[20px] border border-border bg-card p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-muted-foreground">Sudah dibayar</span>
            <span className="text-[13px] text-muted-foreground">
              {v.agreedPrice ? 'Total kontrak' : 'Penawaran'} <span className="font-semibold text-ink tabular-nums">{rupiah(cost)}</span>
            </span>
          </div>
          <span className="text-[26px] font-semibold tracking-[-0.01em] tabular-nums">{rupiah(paid)}</span>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary transition-[width] duration-700 bar-grow" style={{ width: `${cost ? Math.min(100, (paid / cost) * 100) : 0}%` }} />
          </div>
        </div>
        {v.notes && <p className="whitespace-pre-line rounded-[18px] bg-muted p-4 text-sm text-body">{v.notes}</p>}
        {v.status !== 'booked' && <p className="text-xs text-muted-foreground">Ubah status ke <strong>Booked</strong> agar harga vendor ini masuk ke budget.</p>}
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-sans text-base font-semibold">Jadwal pembayaran</h2>
          <button className="btn-soft min-h-9 px-3 text-[13px]" onClick={() => setPayDraft({ label: payments.length ? `Termin ${payments.length + 1}` : 'DP', amount: 0, dueDate: todayISO() })}>
            <Plus className="size-4" aria-hidden /> Termin
          </button>
        </div>
        {scheduled !== cost && payments.length > 0 && (
          <p className="flex items-center gap-2 rounded-[14px] bg-warning-soft px-4 py-2.5 text-[13px] text-warning">
            <TriangleAlert className="size-4 shrink-0" aria-hidden /> Total termin {rupiah(scheduled)} belum sama dengan harga {rupiah(cost)}.
          </p>
        )}
        {uploadErr && <p className="text-sm text-destructive" role="alert">{uploadErr}</p>}

        {payments.length === 0 ? (
          <div className="rounded-[18px] border border-border bg-card p-4 text-sm text-body">
            Belum ada termin. Tambahkan DP, termin, dan pelunasan supaya ada pengingat sebelum jatuh tempo.
            {cost > 0 && (
              <button className="btn-outline btn-sm mt-3 flex" onClick={quickSplit}>
                Buat cepat: DP 30% + pelunasan H-14
              </button>
            )}
          </div>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {payments.map((p, i) => {
              const isCurrent = p.id === current?.id
              const d = daysUntil(p.dueDate)
              const late = !p.paidDate && d < 0
              return (
                <li key={p.id} className={cn('flex items-start gap-3 rounded-[18px] bg-card px-4 py-3.5', isCurrent ? (late ? 'border-2 border-destructive/60' : 'border-2 border-[#D9B77A]') : 'border border-border')}>
                  {p.paidDate ? (
                    <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-success-solid text-white">
                      <Check className="size-3.5" strokeWidth={2.6} aria-label="Lunas" />
                    </span>
                  ) : (
                    <span className={cn('grid size-[26px] shrink-0 place-items-center rounded-full text-xs font-bold', isCurrent ? 'bg-warning-soft text-warning' : 'border-[1.5px] border-[#A9A08C] text-muted-foreground')}>{i + 1}</span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex justify-between gap-3">
                      <button className="truncate text-left text-sm font-semibold hover:text-primary" onClick={() => setPayDraft(p)}>
                        {p.label}
                      </button>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">{rupiah(p.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {p.paidDate ? `Dibayar ${fmtDate(p.paidDate, 'd MMM yyyy')}` : `Jatuh tempo ${fmtDate(p.dueDate, isCurrent ? 'EEEE, d MMM' : 'd MMM yyyy')}${isCurrent ? '' : hMinus(p.dueDate)}`}
                      </span>
                      {p.paidDate && p.proof && (
                        <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary" onClick={() => setProofView(p.proof!)}>
                          <Receipt className="size-3.5" strokeWidth={1.8} aria-hidden /> Lihat bukti
                        </button>
                      )}
                      {isCurrent && (
                        <span className={cn('min-h-[22px] px-2 text-[11px]', late ? 'badge-danger' : d <= 7 ? 'badge-warning' : 'badge-neutral')}>
                          {late ? `Lewat ${-d} hari` : d === 0 ? 'Hari ini' : `${d} hari lagi`}
                        </span>
                      )}
                    </div>
                    {isCurrent && (
                      <div className="mt-1 flex gap-2">
                        <label className="btn-primary min-h-11 flex-1 px-3 text-[13px]">
                          Upload bukti
                          <input type="file" accept="image/*" className="sr-only" onChange={(e) => onProof(p, e.target.files?.[0])} />
                        </label>
                        <button className="btn-outline min-h-11 flex-1 px-3 text-[13px]" onClick={() => patchPay(p.id, { paidDate: todayISO() })}>
                          Tandai lunas
                        </button>
                      </div>
                    )}
                    {p.paidDate && (
                      <div className="flex gap-3 text-xs">
                        {!p.proof && (
                          <label className="cursor-pointer font-semibold text-primary">
                            Upload bukti
                            <input type="file" accept="image/*" className="sr-only" onChange={(e) => onProof(p, e.target.files?.[0])} />
                          </label>
                        )}
                        <button className="text-muted-foreground hover:text-ink" onClick={() => patchPay(p.id, { paidDate: undefined })}>
                          Batalkan lunas
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {/* PRD §7: pengingat lewat Google Calendar — bukan WhatsApp otomatis di MVP. */}
      {unpaid.length > 0 && (
        <div className="flex items-center gap-3 rounded-[18px] bg-primary-soft px-4 py-3">
          <CalendarPlus className="size-[22px] shrink-0 text-on-primary-soft" strokeWidth={1.8} aria-hidden />
          <span className="flex-1 text-[13px] leading-snug text-on-primary-soft">
            <span className="font-semibold">Pengingat kalender</span>
            <br />H-7 sebelum jatuh tempo · tanpa nominal
          </span>
          <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
            {current && (
              <a href={googleCalendarUrl(payEvent(v, current))} target="_blank" rel="noreferrer" className="btn min-h-9 bg-card px-3 text-xs text-ink hover:bg-muted">
                Google
              </a>
            )}
          </div>
        </div>
      )}

      <Modal
        open={!!payDraft}
        onClose={() => setPayDraft(null)}
        title={payDraft?.id ? 'Ubah termin' : 'Tambah termin'}
        footer={
          <>
            {payDraft?.id && (
              <ConfirmButton className="btn-ghost mr-auto text-destructive" onConfirm={() => { setPayments(v.payments.filter((x) => x.id !== payDraft.id)); setPayDraft(null) }}>
                <Trash2 className="size-4" aria-hidden /> Hapus
              </ConfirmButton>
            )}
            <button className="btn-ghost" onClick={() => setPayDraft(null)}>Batal</button>
            <button className="btn-primary" onClick={savePay} disabled={!payDraft?.label || !payDraft?.dueDate}>Simpan</button>
          </>
        }
      >
        <Field label="Nama termin" htmlFor="pl"><input id="pl" className="input" value={payDraft?.label ?? ''} onChange={(e) => setPayDraft({ ...payDraft, label: e.target.value })} placeholder="DP / Termin 2 / Pelunasan" /></Field>
        <Field label="Jumlah" htmlFor="pa"><MoneyInput id="pa" value={payDraft?.amount ?? 0} onChange={(n) => setPayDraft({ ...payDraft, amount: n })} /></Field>
        <Field label="Jatuh tempo" htmlFor="pd"><input id="pd" type="date" className="input" value={payDraft?.dueDate ?? ''} onChange={(e) => setPayDraft({ ...payDraft, dueDate: e.target.value })} /></Field>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Ubah vendor"
        footer={
          <>
            <ConfirmButton className="btn-ghost mr-auto text-destructive" onConfirm={() => { remove('vendors', v.id); navigate('/app/vendor') }}>
              <Trash2 className="size-4" aria-hidden /> Hapus
            </ConfirmButton>
            <button className="btn-ghost" onClick={() => setEditing(null)}>Batal</button>
            <button className="btn-primary" onClick={() => { update('vendors', v.id, editing!); setEditing(null) }}>Simpan</button>
          </>
        }
      >
        {editing && <VendorForm value={editing} onChange={setEditing} />}
      </Modal>

      <Modal open={!!proofView} onClose={() => setProofView(null)} title="Bukti transfer">
        {proofView && <img src={proofView} alt="Bukti transfer" className="w-full rounded-xl" />}
      </Modal>
    </div>
  )
}
