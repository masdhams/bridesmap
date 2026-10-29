import { addMonths, format } from 'date-fns'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Copy, Heart, ListChecks, MailOpen, MessageCircle, Store, Users, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AllocationEditor } from '../components/allocation'
import { DateChecker } from '../components/datechecker'
import { PlanBuilder } from '../components/PlanBuilder'
import { MoneyInput } from '../components/ui'
import * as alloc from '../lib/allocation'
import type { EventKind } from '../lib/types'
import { EVENT_KINDS, HIDDEN_COSTS } from '../data/content'
import { usePlan } from '../lib/store'
import { cn, daysUntil, fmtDate, rupiah } from '../lib/utils'

// Rentang jumlah tamu dari layar "Detail pernikahan" → angka perkiraan untuk perhitungan.
const GUEST_RANGES = [
  { label: '<100', value: 80 },
  { label: '100–300', value: 200 },
  { label: '300–500', value: 400 },
  { label: '500+', value: 600 },
]

const nearestRange = (n: number) => GUEST_RANGES.reduce((a, r) => (Math.abs(r.value - n) < Math.abs(a.value - n) ? r : a)).value

const WELCOME_FEATURES = [
  { icon: Wallet, label: 'Budget per acara', desc: 'Bagi budget ke akad, resepsi, dan adat, lengkap dengan biaya tersembunyi.' },
  { icon: Store, label: 'Vendor & pembayaran', desc: 'Catat DP, termin, dan pelunasan lengkap dengan bukti transfer.' },
  { icon: ListChecks, label: 'Checklist 12 bulan', desc: 'Tugas dari H-12 bulan sampai hari-H, bisa dikirim ke kalender.' },
  { icon: Users, label: 'Tamu & RSVP', desc: 'Impor daftar tamu, kirim undangan per orang, pantau konfirmasinya.' },
  { icon: MailOpen, label: 'Undangan digital', desc: 'Pilih desain, isi dengan foto dan cerita kalian, lalu bagikan.' },
  { icon: Heart, label: 'Momen berdua', desc: 'Deep talk harian, surat untuk nanti, dan vision board bersama.' },
]

const WELCOME_STEPS = [
  { title: 'Isi detail pernikahan', desc: 'Nama, tanggal, kota, budget, dan perkiraan jumlah tamu.' },
  { title: 'Atur alokasi budget', desc: 'Tentukan porsi budget untuk tiap acara. Bisa diubah kapan saja.' },
  { title: 'Undang pasangan', desc: 'Kirim tautan ke pasangan supaya kalian bisa mengatur rencana bersama.' },
]

/** Garis progres langkah 1/3 s.d. 3/3. */
function Steps({ at, onBack }: { at: 1 | 2 | 3; onBack: () => void }) {
  return (
    <div className="flex h-11 items-center gap-3">
      <button onClick={onBack} aria-label="Kembali" className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-card">
        <ArrowLeft className="size-5" strokeWidth={1.8} />
      </button>
      <div className="flex flex-1 gap-1.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn('h-1 flex-1 rounded-full', i <= at ? 'bg-ink' : 'bg-border')} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{at}/3</span>
    </div>
  )
}

/** Draf isian onboarding disimpan per tab, supaya tidak hilang saat halaman dimuat ulang atau pengguna
 *  berpindah halaman lalu kembali. Dihapus saat rencana selesai dibuat. */
const DRAFT_KEY = 'bridesmap-onboarding-draft'
interface Draft {
  step: number
  form: Record<string, unknown>
  picked: EventKind[]
  tentative: boolean
  phone: string
  plan: alloc.AllocState
  planKey: string
}
const readDraft = (): Partial<Draft> => {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}
const clearDraft = () => {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

// PRD #12: onboarding instan < 2 menit, tanpa menunggu admin.
export default function Onboarding() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { initPlan, setProfile, profile: existing, tasks, categories } = usePlan()
  const [draft] = useState(readDraft)
  const [checkDate, setCheckDate] = useState(false)
  const [step, setStep] = useState(() => (draft.step && draft.step > 0 ? draft.step : 0))
  // Alokasi budget per acara (PRD #39) — diatur dulu sebelum rencana lengkap dibuat.
  const [plan, setPlan] = useState<alloc.AllocState>(draft.plan ?? { events: [], categories: [] })
  const [planKey, setPlanKey] = useState(draft.planKey ?? '')
  const [tentative, setTentative] = useState(draft.tentative ?? false)
  const [phone, setPhone] = useState(draft.phone ?? '')
  const [copied, setCopied] = useState(false)
  // Layar "menyusun rencana" tampil sekali saat beralih dari langkah 3 ke ringkasan.
  const [building, setBuilding] = useState(false)
  const finish = () => {
    setBuilding(true)
    setStep(4)
  }
  const validKinds = EVENT_KINDS.map((k) => k.kind) as EventKind[]
  const fromQuery = (params.get('acara') ?? '').split(',').filter((k): k is EventKind => validKinds.includes(k as EventKind))
  const [picked, setPicked] = useState<EventKind[]>(fromQuery.length ? fromQuery : draft.picked?.length ? draft.picked : ['akad', 'resepsi'])
  const togglePick = (k: EventKind) => setPicked((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]))
  const [form, setForm] = useState(() => ({
    partnerA: '',
    partnerB: '',
    weddingDate: format(addMonths(new Date(), 9), 'yyyy-MM-dd'),
    city: '',
    totalBudget: 120_000_000,
    guestEstimate: nearestRange(400),
    ...(draft.form as object),
    // Parameter dari alat gratis (tanggal dari checklist, kalkulator budget) menimpa draf.
    ...(/^\d{4}-\d{2}-\d{2}$/.test(params.get('tanggal') ?? '') ? { weddingDate: params.get('tanggal')! } : {}),
    ...(Number(params.get('budget')) ? { totalBudget: Number(params.get('budget')) } : {}),
    ...(Number(params.get('tamu')) ? { guestEstimate: nearestRange(Number(params.get('tamu'))) } : {}),
  }))
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, form, picked, tentative, phone, plan, planKey }))
    } catch {
      /* penyimpanan tidak tersedia */
    }
  }, [step, form, picked, tentative, phone, plan, planKey])
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const detailsValid = form.partnerA.trim() && form.partnerB.trim() && form.weddingDate && form.totalBudget > 0 && picked.length > 0

  const invite = `${location.origin}/mulai?undangan=${encodeURIComponent(form.partnerA.trim())}`
  const message = `Hai ${form.partnerB.trim() || 'sayang'}! Aku sudah mulai rencana pernikahan kita di Bridesmap. Yuk gabung supaya kita bisa atur bareng: ${invite}`
  const waNumber = phone.replace(/[^\d]/g, '').replace(/^0/, '').replace(/^62/, '')

  const reserved = alloc.defaultReserved(form.totalBudget, form.guestEstimate)
  // Dari langkah detail: bagi budget ke acara yang dipilih. Dibuat ulang hanya kalau total/acara/tamu berubah, supaya edit tidak hilang saat pengguna kembali.
  const goAllocation = () => {
    const kinds = EVENT_KINDS.filter((k) => picked.includes(k.kind)).map((k) => k.kind)
    const key = `${form.totalBudget}|${form.guestEstimate}|${kinds.join(',')}`
    if (key !== planKey) {
      setPlan(alloc.buildAllocation(Math.max(0, form.totalBudget - reserved), kinds.map((kind) => ({ kind }))))
      setPlanKey(key)
    }
    setStep(2)
  }

  // Dari langkah alokasi: baru sekarang rencana lengkap dibuat, memakai alokasi yang sudah diatur.
  const createPlan = () => {
    initPlan({ ...form, partnerA: form.partnerA.trim(), partnerB: form.partnerB.trim(), allocation: plan })
    if (tentative) setProfile({ dateTentative: true })
    setStep(3)
  }

  const days = daysUntil(form.weddingDate)

  // Langkah 0 — Sambutan: apa yang bisa dilakukan di app, lalu cara mulainya, baru CTA.
  if (step === 0)
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        <section className="relative m-3 overflow-hidden rounded-[28px] bg-primary p-6 text-white">
          <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(201,212,186,0.22),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(154,78,59,0.25),transparent_50%)]" />
          <Link to="/" className="relative font-serif text-[22px]">
            Brides<span className="italic">map</span>
          </Link>
          <h1 className="relative mt-10 text-[38px] leading-[1.02] text-white">
            Satu rencana,
            <br />
            <span className="italic">untuk berdua.</span>
          </h1>
          <p className="relative mt-3 text-[15px] leading-relaxed text-[#E3E8DA]">
            Dari budget dan vendor sampai undangan digital, semuanya ada di satu tempat.
          </p>
        </section>

        <div className="flex flex-1 flex-col gap-7 px-5 pb-8 pt-4">
          {existing.onboarded && (
            <p className="rounded-2xl bg-warning-soft p-3.5 text-[13px] text-warning">
              Kalian sudah punya rencana untuk <strong>{existing.partnerA} &amp; {existing.partnerB}</strong>. Membuat rencana baru akan menggantinya.
            </p>
          )}

          <section className="grid gap-3">
            <h2 className="text-[22px] leading-tight">Yang bisa kalian lakukan</h2>
            <ul className="grid grid-cols-2 gap-2.5">
              {WELCOME_FEATURES.map((f) => (
                <li key={f.label} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5">
                  <f.icon className="size-5 text-primary" strokeWidth={1.7} aria-hidden />
                  <span className="text-[14px] font-semibold leading-snug">{f.label}</span>
                  <span className="text-[12px] leading-snug text-muted-foreground">{f.desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-3">
            <h2 className="text-[22px] leading-tight">Cara mulainya</h2>
            <ol className="grid gap-3">
              {WELCOME_STEPS.map((t, i) => (
                <li key={t.title} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft font-serif text-[16px] text-primary">{i + 1}</span>
                  <span className="grid gap-0.5 pt-0.5">
                    <span className="text-[15px] font-semibold">{t.title}</span>
                    <span className="text-[13px] leading-relaxed text-body">{t.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <button className="btn-primary w-full" onClick={() => setStep(1)}>
              Mulai rencana kita <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
            </button>
            <p className="m-0 text-center text-[12px] text-muted-foreground">Gratis. Butuh sekitar dua menit.</p>
            {existing.onboarded && (
              <Link to="/app" className="btn-outline w-full">
                Buka rencana yang ada
              </Link>
            )}
          </div>
        </div>
      </div>
    )

  // Langkah 1 — Detail pernikahan
  if (step === 1)
    return (
      <>
      <form
        className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-5 pb-8 pt-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (detailsValid) goAllocation()
        }}
      >
        <Steps at={1} onBack={() => setStep(0)} />
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">Detail pernikahan</p>
          <h1 className="text-[34px] leading-[1.05]">
            Ceritakan tentang
            <br />
            <span className="italic">hari kalian.</span>
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Namamu
            <input className="input font-normal" autoFocus autoComplete="given-name" value={form.partnerA} onChange={(e) => set('partnerA', e.target.value)} placeholder="Rani" required />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Nama pasangan
            <input className="input font-normal" value={form.partnerB} onChange={(e) => set('partnerB', e.target.value)} placeholder="Dimas" required />
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="od" className="text-sm font-semibold">
            {tentative ? 'Perkiraan bulan' : 'Tanggal hari-H'}
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} aria-hidden />
            {tentative ? (
              <input id="od" type="month" className="input pl-11" value={form.weddingDate.slice(0, 7)} onChange={(e) => e.target.value && set('weddingDate', `${e.target.value}-15`)} />
            ) : (
              <input id="od" type="date" className="input pl-11" value={form.weddingDate} onChange={(e) => set('weddingDate', e.target.value)} required />
            )}
          </div>
          <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-[13px] text-body">
            <input type="checkbox" className="check-square" checked={tentative} onChange={(e) => setTentative(e.target.checked)} />
            Belum pasti, pakai perkiraan bulan saja
          </label>
          {!tentative && Number.isFinite(days) && (
            <p className="text-xs text-muted-foreground">
              {fmtDate(form.weddingDate, 'EEEE, d MMMM yyyy')} · {days} hari lagi ·{' '}
              <button type="button" onClick={() => setCheckDate(true)} className="font-semibold text-primary underline-offset-4 hover:underline">
                cek Hijriah & libur
              </button>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Perkiraan jumlah tamu</p>
          <div role="radiogroup" aria-label="Perkiraan jumlah tamu" className="grid grid-cols-4 gap-1 rounded-full border border-border bg-muted p-1">
            {GUEST_RANGES.map((r) => (
              <button
                type="button"
                key={r.value}
                role="radio"
                aria-checked={form.guestEstimate === r.value}
                onClick={() => set('guestEstimate', r.value)}
                className={cn('min-h-10 rounded-full text-[13px]', form.guestEstimate === r.value ? 'bg-card font-semibold text-ink shadow-[var(--shadow-tab)]' : 'font-medium text-body')}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Acara yang direncanakan</p>
          <div role="group" aria-label="Acara yang direncanakan" className="grid grid-cols-2 gap-2">
            {EVENT_KINDS.map((k) => {
              const on = picked.includes(k.kind)
              return (
                <button
                  type="button"
                  key={k.kind}
                  aria-pressed={on}
                  onClick={() => togglePick(k.kind)}
                  className={cn('flex min-h-[52px] flex-col items-start justify-center rounded-2xl border px-3.5 py-2 text-left', on ? 'border-primary bg-primary-soft' : 'border-border bg-card')}
                >
                  <span className={cn('text-sm', on ? 'font-semibold text-on-primary-soft' : 'font-medium text-ink')}>{k.label}</span>
                  <span className="text-[11px] leading-tight text-muted-foreground">{k.hint}</span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">Budget otomatis dibagi per acara dan per kategori. Angkanya estimasi dan bisa kalian ubah (persen atau Rupiah).</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="ob" className="text-sm font-semibold">
            Total budget
          </label>
          <MoneyInput id="ob" value={form.totalBudget} onChange={(n) => set('totalBudget', n)} />
          <p className="text-xs text-muted-foreground">Belum yakin? Isi perkiraan dulu, bisa diubah kapan saja.</p>
        </div>

        <button type="submit" className="btn-primary mt-auto w-full" disabled={!detailsValid}>
          Lanjut <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
        </button>
      </form>
      {/* Di luar <form> supaya tombol di dalam jendela tidak ikut mengirim formulir. */}
      <DateChecker open={checkDate} onClose={() => setCheckDate(false)} value={form.weddingDate} onPick={(d) => set('weddingDate', d)} />
      </>
    )

  // Langkah 2 — Atur alokasi budget (kalkulator #39) sebelum rencana lengkap dibuat
  if (step === 2) {
    const t = alloc.allocTotals(form.totalBudget, plan.events, reserved)
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-5 pt-4">
        <Steps at={2} onBack={() => setStep(1)} />
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">Alokasi budget</p>
          <h1 className="text-[34px] leading-[1.05]">
            Atur pembagian
            <br />
            <span className="italic">budget kalian.</span>
          </h1>
        </div>
        <p className="text-[15px] leading-relaxed text-body">
          Kami bagi {rupiah(form.totalBudget)} ke {plan.events.length} acara dan tiap kategorinya. Angka ini estimasi awal — ubah dalam persen atau Rupiah, dan bisa diubah lagi kapan saja.
        </p>

        <AllocationEditor
          total={form.totalBudget}
          reserved={reserved}
          events={plan.events}
          categories={plan.categories}
          onEventBudget={(id, n) => setPlan((p) => alloc.setEventBudget(p, id, n))}
          onCategory={(id, n) => setPlan((p) => alloc.setCategoryAllocation(p, id, n))}
          onReset={(id) => setPlan((p) => alloc.resetEvent(p, id))}
          onRemove={(id) => {
            setPlan((p) => alloc.removeEvent(p, id))
            return true
          }}
          onAdd={(kind, name) => setPlan((p) => alloc.addEvent(p, kind, name, t.free).state)}
        />

        <div className="sticky bottom-0 -mx-5 mt-auto flex flex-col gap-2 border-t border-border bg-background/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          {t.free < 0 && <p className="text-center text-xs text-danger-ink">Alokasi melebihi budget {rupiah(-t.free)}. Boleh lanjut, tapi sebaiknya disesuaikan.</p>}
          <button className="btn-primary w-full" onClick={createPlan} disabled={plan.events.length === 0}>
            Buat rencana <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  // Langkah 3 — Undang pasangan (pesan dikirim sendiri lewat WhatsApp pengguna)
  if (step === 3)
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-5 pb-8 pt-4">
        <Steps at={3} onBack={() => setStep(2)} />
        <div className="flex flex-col gap-1.5">
          <p className="eyebrow">Undang pasangan</p>
          <h1 className="text-[34px] leading-[1.05]">
            Rencanakan
            <br />
            <span className="italic text-accent">berdua.</span>
          </h1>
        </div>
        <p className="text-[15px] leading-relaxed text-body">{form.partnerB} bisa ikut mengisi budget, checklist, dan tamu di rencana yang sama.</p>
        <div aria-hidden className="flex items-center justify-center gap-0 py-2">
          <span className="grid size-16 place-items-center rounded-full bg-primary-soft font-serif text-[26px] text-on-primary-soft">{form.partnerA.trim()[0]?.toUpperCase()}</span>
          <span className="-mx-2 z-10 grid size-10 place-items-center rounded-full bg-accent text-white">
            <Heart className="size-[18px]" strokeWidth={1.8} />
          </span>
          <span className="grid size-16 place-items-center rounded-full border-2 border-dashed border-accent/50 font-serif text-[26px] text-accent-ink">{form.partnerB.trim()[0]?.toUpperCase()}</span>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="ow" className="text-sm font-semibold">
            Nomor WhatsApp {form.partnerB}
          </label>
          <div className="flex min-h-[50px] items-center gap-2 rounded-[14px] border border-input bg-card px-4 focus-within:border-primary">
            <span className="text-[15px] text-muted-foreground">+62</span>
            <input id="ow" inputMode="tel" autoComplete="tel-national" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" placeholder="812 3456 7890" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="rounded-2xl bg-muted p-4">
          <p className="text-xs font-semibold text-muted-foreground">Preview pesan</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-body">{message}</p>
        </div>
        <p className="text-xs text-muted-foreground">Pesan dikirim dari WhatsApp-mu sendiri. Sinkronisasi dua akun aktif setelah login tersedia.</p>

        <div className="mt-auto flex flex-col gap-3">
          <a
            href={`https://wa.me/${waNumber ? `62${waNumber}` : ''}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full"
            onClick={() => {
              setProfile({ partnerInvited: true })
              finish()
            }}
          >
            <MessageCircle className="size-[18px]" strokeWidth={1.8} aria-hidden /> Kirim lewat WhatsApp
          </a>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="btn-outline"
              onClick={() =>
                navigator.clipboard.writeText(invite).then(() => {
                  setCopied(true)
                  setProfile({ partnerInvited: true })
                })
              }
            >
              <Copy className="size-4" aria-hidden /> {copied ? 'Tersalin' : 'Salin tautan'}
            </button>
            <button className="btn-ghost" onClick={finish}>
              Nanti saja
            </button>
          </div>
        </div>
      </div>
    )

  // Langkah 4 — Rencana siap
  const hiddenCount = categories.filter((c) => c.hidden).length
  if (building)
    return (
      <PlanBuilder
        initials={[(existing.partnerA || form.partnerA).trim()[0]?.toUpperCase() ?? '', (existing.partnerB || form.partnerB).trim()[0]?.toUpperCase() ?? '']}
        steps={[
          { label: 'Profil pernikahan', detail: `Mencatat tanggal ${fmtDate(form.weddingDate, 'd MMMM yyyy')}${form.city ? ` di ${form.city}` : ''}.` },
          { label: 'Alokasi budget', detail: `Membagi ${rupiah(form.totalBudget)} ke ${plan.events.length} acara dan kategorinya.` },
          { label: 'Checklist & timeline', detail: `Menyusun ${tasks.length} tugas dari H-12 bulan sampai hari-H.` },
          { label: 'Ruang berdua', detail: 'Menyiapkan deep talk, surat untuk nanti, dan vision board.' },
        ]}
        onDone={() => setBuilding(false)}
      />
    )
  return (
    <div className="min-h-dvh bg-primary text-white">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 pb-8 pt-5">
        <span className="font-serif text-[22px]">
          Brides<span className="italic">map</span>
        </span>
        <div className="mt-6 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D5DCCB]">Rencana kalian siap</p>
          <span className="font-serif text-[96px] leading-[0.9] tabular-nums">{Math.max(0, days)}</span>
          <p className="font-serif text-[34px] italic leading-[1.05]">
            hari lagi,
            <br />
            {existing.partnerA || form.partnerA} &amp; {existing.partnerB || form.partnerB}.
          </p>
        </div>
        <ul className="flex flex-col gap-3.5 text-[15px] leading-snug">
          {[
            { done: true, text: `${tasks.length} tugas sudah disusun per fase, mulai dari minggu ini` },
            { done: true, text: `Budget ${rupiah(form.totalBudget)} sudah dibagi ke ${plan.events.length} acara dan tiap kategorinya (estimasi, bisa kalian ubah)` },
            { done: true, text: `${hiddenCount} dari ${HIDDEN_COSTS.length} hidden cost sudah masuk budget, sisanya siap kalian cek` },
            existing.partnerInvited
              ? { done: false, text: `Undangan untuk ${form.partnerB} terkirim, menunggu dia bergabung` }
              : { done: false, text: `Undang ${form.partnerB} kapan saja dari Pengaturan` },
          ].map((x, i) => (
            <li key={x.text} className="animate-fade-up flex items-start gap-3" style={{ animationDelay: `${150 + i * 140}ms` }}>
              <span className={cn('mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full', x.done ? 'animate-pop bg-white/90 text-primary' : 'border-[1.5px] border-dashed border-white/60')} style={{ animationDelay: `${250 + i * 140}ms` }}>
                {x.done && <Check className="size-3.5" strokeWidth={2.6} aria-hidden />}
              </span>
              {x.text}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-3">
          <button className="btn w-full bg-white text-ink hover:bg-primary-soft" onClick={() => {
              clearDraft()
              navigate('/app', { replace: true })
            }}>
            Buka rencana kami <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
          <p className="text-center text-xs text-[#C9CFC0]">Semua bisa diubah nanti dari Pengaturan</p>
        </div>
      </div>
    </div>
  )
}
