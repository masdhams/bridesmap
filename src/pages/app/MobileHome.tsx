import { ArrowRight, ArrowUpRight, CalendarDays, ChevronRight, Receipt, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CoverButton, DEFAULT_POS } from '../../components/cover'
import { IcAllFeatures, IcBudget, IcChecklist, IcDeepTalk, IcDocs, IcGuests, IcHoneymoon, IcLetter, IcRundown, IcSavings, IcSeserahan, IcVendor, IcVision, type AppIcon } from '../../components/icons'
import { NAV_GROUPS } from '../../components/nav'
import { PartnerAvatar } from '../../components/ui'
import { budgetSummary, budgetTotals, guestStats, taskDue, upcomingPayments } from '../../lib/selectors'
import { usePlan, useSession } from '../../lib/store'
import { cn, daysUntil, fmtDate, rupiah, rupiahShort, todayISO } from '../../lib/utils'
import { deepTalkIndex } from './DeepTalk'

const FEATURES = NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.to !== '/app')

/** Pill pencarian fitur: ketik nama fitur, pilih dari saran, atau tekan Enter untuk membuka hasil teratas. */
function FeatureSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const results = query ? FEATURES.filter((i) => `${i.label} ${i.desc ?? ''}`.toLowerCase().includes(query)).slice(0, 6) : []
  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault()
        if (results[0]) navigate(results[0].to)
      }}
    >
      <div className="flex min-h-[58px] items-center gap-3 rounded-full bg-card pl-5 pr-1.5 shadow-[0_8px_28px_rgb(34_38_31/0.09)] focus-within:ring-2 focus-within:ring-primary/30">
        <Search className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari fitur, mis. tamu" aria-label="Cari fitur" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/80" />
        <button type="submit" aria-label="Buka hasil pencarian" className="grid size-[46px] shrink-0 place-items-center rounded-full bg-primary text-on-primary transition-colors duration-200 hover:bg-primary-hover">
          <ArrowRight className="size-5" strokeWidth={1.8} aria-hidden />
        </button>
      </div>
      {query && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-[22px] bg-card shadow-[var(--shadow-lift)]">
          {results.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">Belum ada fitur dengan kata "{q.trim()}".</p>
          ) : (
            <ul>
              {results.map((i) => (
                <li key={i.to} className="border-b border-divider last:border-0">
                  <Link to={i.to} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-on-primary-soft">
                      <i.icon className="size-[18px]" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold">{i.label}</span>
                      {i.desc && <span className="truncate text-xs text-muted-foreground">{i.desc}</span>}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  )
}

interface SummaryCard {
  to: string
  label: string
  value: string
  sub: string
  icon: AppIcon
  tone: string
  chip: string
  muted: string
}

interface QuickAction {
  to: string
  label: string
  icon: AppIcon
  rose?: boolean
  badge?: number
}

/** Beranda mobile: hero serif besar, cari fitur, kartu ringkasan horizontal, aksi cepat, langkah berikutnya. */
export default function MobileHome() {
  const s = usePlan()
  const { me } = useSession()
  const { profile, setProfile } = s
  const totals = budgetTotals(budgetSummary(s))
  const g = guestStats(s.guests)
  const dtIndex = deepTalkIndex(profile.createdAt)
  const dt = s.deepTalk[dtIndex] ?? {}
  const other = me === 'A' ? 'B' : 'A'
  const name = (p: 'A' | 'B') => (p === 'A' ? profile.partnerA : profile.partnerB)
  const days = daysUntil(profile.weddingDate)
  const done = s.tasks.filter((t) => t.done).length
  const saved = s.savings.entries.reduce((a, e) => a + e.amount, 0)
  const left = profile.totalBudget - totals.committed

  // Langkah berikutnya: pembayaran yang belum lunas + tugas, yang akan datang diurutkan menurut tanggal.
  // Tugas/pembayaran yang sudah lewat cukup diwakili satu baris (yang paling baru) supaya tidak menutupi yang akan datang.
  const all = [
    ...upcomingPayments(s.vendors).map((p) => ({
      key: p.id,
      kind: 'pay' as const,
      to: `/app/vendor/${p.vendorId}`,
      title: `Bayar ${p.label} · ${p.vendorName}`,
      sub: `${rupiah(p.amount)} · ${fmtDate(p.dueDate, 'd MMM')}`,
      date: p.dueDate,
    })),
    ...s.tasks
      .filter((t) => !t.done)
      .map((t) => {
        const due = taskDue(profile.weddingDate, t.offsetDays, t.custom)
        return { key: t.id, kind: 'task' as const, to: '/app/checklist', title: t.title, sub: fmtDate(due, 'EEEE, d MMM'), date: due }
      }),
  ]
  const overdue = all.filter((x) => daysUntil(x.date) < 0).sort((a, b) => b.date.localeCompare(a.date))
  const upcoming = all.filter((x) => daysUntil(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))
  const steps = [...overdue.slice(0, 1), ...upcoming].slice(0, 3)
  const moreLate = overdue.length - 1
  const lateTasks = s.tasks.filter((t) => !t.done && daysUntil(taskDue(profile.weddingDate, t.offsetDays, t.custom)) < 0).length

  const cards: SummaryCard[] = [
    {
      to: '/app/budget',
      label: left < 0 ? 'Melewati budget' : 'Sisa budget',
      value: rupiahShort(Math.abs(left)),
      sub: left < 0 ? 'Cek alokasi' : `dari ${rupiahShort(profile.totalBudget)}`,
      icon: IcBudget,
      tone: 'bg-primary text-white',
      chip: 'bg-white/15 text-white',
      muted: 'text-[#D5DCCB]',
    },
    { to: '/app/tamu', label: 'RSVP hadir', value: `${g.hadir}/${g.totalPax}`, sub: `${g.belum + g.ragu} menunggu`, icon: IcGuests, tone: 'bg-primary-soft text-ink', chip: 'bg-card text-on-primary-soft', muted: 'text-on-primary-soft' },
    { to: '/app/checklist', label: 'Checklist', value: `${done}/${s.tasks.length}`, sub: lateTasks ? `${lateTasks} terlambat` : 'Sesuai jadwal', icon: IcChecklist, tone: 'border border-border bg-card text-ink', chip: 'bg-muted text-primary', muted: lateTasks ? 'font-semibold text-destructive' : 'text-muted-foreground' },
    {
      to: '/app/tabungan',
      label: 'Tabungan',
      value: `${s.savings.target ? Math.round((saved / s.savings.target) * 100) : 0}%`,
      sub: `${rupiahShort(saved)} terkumpul`,
      icon: IcSavings,
      tone: 'bg-accent-soft text-ink',
      chip: 'bg-card text-accent',
      muted: 'text-accent-ink',
    },
    {
      to: '/app/vendor',
      label: 'Vendor booked',
      value: `${s.vendors.filter((v) => v.status === 'booked').length}/${s.vendors.length}`,
      sub: `${upcomingPayments(s.vendors).length} pembayaran`,
      icon: IcVendor,
      tone: 'bg-muted text-ink',
      chip: 'bg-card text-primary',
      muted: 'text-muted-foreground',
    },
  ]

  const actions: QuickAction[] = [
    { to: '/app/checklist', label: 'Checklist', icon: IcChecklist, badge: overdue.length || undefined },
    { to: '/app/administrasi', label: 'Administrasi', icon: IcDocs },
    { to: '/app/rundown', label: 'Rundown', icon: IcRundown },
    { to: '/app/seserahan', label: 'Seserahan', icon: IcSeserahan },
    { to: '/app/vision-board', label: 'Vision board', icon: IcVision, rose: true },
    { to: '/app/honeymoon', label: 'Honeymoon', icon: IcHoneymoon, rose: true },
    { to: '/app/undangan', label: 'Undangan', icon: IcLetter, rose: true },
    { to: '/app/lainnya', label: 'Lihat semua', icon: IcAllFeatures },
  ]

  const dtText =
    dt[me] && dt[other] ? (
      <>
        Jawaban kalian <span className="italic">sudah terbuka.</span>
      </>
    ) : dt[other] ? (
      <>
        {name(other)} sudah menjawab. <span className="italic">Giliranmu.</span>
      </>
    ) : dt[me] ? (
      <>
        Kamu sudah menjawab. <span className="italic">Menunggu {name(other)}.</span>
      </>
    ) : (
      <>
        Pertanyaan baru <span className="italic">menunggu kalian.</span>
      </>
    )

  return (
    <div className="flex flex-col gap-6 lg:hidden">
      {/* Hero: headline serif besar; foto latar (opsional) memudar ke atas supaya teks tetap terbaca. */}
      <section className={cn('relative -mx-5 -mt-4 flex flex-col overflow-hidden px-5 pb-4 pt-3', profile.heroPhoto && 'min-h-[320px]')}>
        {profile.heroPhoto ? (
          <img
            src={profile.heroPhoto}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[80%] w-full object-cover [mask-image:linear-gradient(to_bottom,transparent,black_55%)]"
            style={{ objectPosition: `${(profile.heroPhotoPos ?? DEFAULT_POS).x}% ${(profile.heroPhotoPos ?? DEFAULT_POS).y}%` }}
          />
        ) : (
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[75%] bg-[radial-gradient(110%_75%_at_75%_100%,var(--color-primary-soft),transparent_72%)]" />
        )}
        <div className="relative flex flex-col gap-1.5">
          <p className="eyebrow">{fmtDate(todayISO(), 'EEEE, d MMMM')}</p>
          <h1 className="text-[40px] leading-[1.02]">
            Halo, {profile.partnerA} <span className="italic">&amp;</span> {profile.partnerB},
            <br />
            <span className="italic text-primary">{Number.isFinite(days) && days > 0 ? `${days} hari lagi.` : 'hari bahagia kalian.'}</span>
          </h1>
        </div>
        <div className="relative mt-auto flex items-center justify-between gap-2 pt-6">
          <span className="inline-flex h-9 items-center gap-2 rounded-full bg-card/90 px-3.5 text-[13px] font-semibold text-ink shadow-[var(--shadow-soft)] backdrop-blur-sm">
            <CalendarDays className="size-4 text-primary" strokeWidth={1.8} aria-hidden />
            {fmtDate(profile.weddingDate, profile.dateTentative ? 'MMMM yyyy' : 'd MMMM yyyy')}
          </span>
          <span className="rounded-full bg-primary shadow-[var(--shadow-soft)]">
            <CoverButton src={profile.heroPhoto} pos={profile.heroPhotoPos} onChange={(heroPhoto) => setProfile({ heroPhoto })} onPos={(heroPhotoPos) => setProfile({ heroPhotoPos })} label="foto latar" menuUp />
          </span>
        </div>
      </section>

      <div className="-mt-4">
        <FeatureSearch />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-sans text-[17px] font-semibold">Ringkasan kalian</h2>
          <Link to="/app/lainnya" className="text-[13px] font-semibold text-primary">
            Semua fitur
          </Link>
        </div>
        <ul className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
          {cards.map((c) => (
            <li key={c.to} className="shrink-0 snap-start">
              <Link to={c.to} className={cn('flex h-[184px] w-[150px] flex-col justify-between rounded-[24px] p-4 shadow-[var(--shadow-soft)]', c.tone)}>
                <span className="flex items-start justify-between">
                  <span className={cn('grid size-10 place-items-center rounded-full', c.chip)}>
                    <c.icon className="size-5" aria-hidden />
                  </span>
                  <span className={cn('grid size-8 place-items-center rounded-full', c.chip)}>
                    <ArrowUpRight className="size-4" strokeWidth={1.8} aria-hidden />
                  </span>
                </span>
                <span className="flex flex-col gap-1">
                  <span className={cn('text-xs', c.muted)}>{c.label}</span>
                  <span className="font-serif text-[28px] leading-none tabular-nums">{c.value}</span>
                  <span className={cn('truncate text-[11px]', c.muted)}>{c.sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-sans text-[17px] font-semibold">Aksi cepat</h2>
        <ul className="grid grid-cols-4 gap-x-2 gap-y-4">
          {actions.map((a) => (
            <li key={a.to}>
              <Link to={a.to} className="group flex flex-col items-center gap-2 text-center">
                <span className={cn('relative grid size-[60px] place-items-center rounded-[20px] bg-card shadow-[var(--shadow-soft)] transition-transform duration-200 group-active:scale-95', a.rose ? 'text-accent' : 'text-primary')}>
                  <a.icon className="size-6" aria-hidden />
                  {a.badge && <span className="absolute -right-1.5 -top-1.5 grid min-w-[20px] place-items-center rounded-full bg-destructive px-1.5 text-[10px] font-bold leading-5 text-white">{a.badge}</span>}
                </span>
                <span className="text-[11.5px] font-medium leading-tight text-body">{a.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-sans text-[17px] font-semibold">Langkah berikutnya</h2>
          <Link to="/app/checklist" className="text-[13px] font-semibold text-primary">
            Semua
          </Link>
        </div>
        {steps.length === 0 ? (
          <p className="rounded-[20px] bg-card px-4 py-5 text-sm text-muted-foreground shadow-[var(--shadow-soft)]">Semua beres untuk sekarang.</p>
        ) : (
          <ol className="flex flex-col">
            {steps.map((x, i) => {
              const d = daysUntil(x.date)
              return (
                <li key={x.key} className="flex gap-3">
                  <span className="flex flex-col items-center">
                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums text-white', d < 0 ? 'bg-destructive' : 'bg-primary')}>{i + 1}</span>
                    {i < steps.length - 1 && <span aria-hidden className="my-1 w-0 flex-1 border-l-2 border-dotted border-sage" />}
                  </span>
                  <Link to={x.to} className="mb-3 flex min-w-0 flex-1 items-center gap-3 rounded-[20px] bg-card p-3.5 shadow-[var(--shadow-soft)]">
                    <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', x.kind === 'pay' ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-on-primary-soft')}>
                      {x.kind === 'pay' ? <Receipt className="size-[18px]" strokeWidth={1.8} aria-hidden /> : <CalendarDays className="size-[18px]" strokeWidth={1.8} aria-hidden />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="line-clamp-2 text-sm font-semibold leading-snug">{x.title}</span>
                      <span className={cn('text-xs', d < 0 ? 'font-semibold text-destructive' : d <= 7 ? 'font-semibold text-warning' : 'text-muted-foreground')}>
                        {x.sub} · {d < 0 ? 'terlambat' : d === 0 ? 'hari ini' : `${d} hari lagi`}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
        {moreLate > 0 && (
          <Link to="/app/checklist" className="-mt-1 text-xs font-semibold text-destructive">
            +{moreLate} lainnya sudah lewat deadline. Cek checklist
          </Link>
        )}
      </section>

      <Link to="/app/deep-talk" className="flex items-center gap-3.5 rounded-[24px] bg-gradient-to-r from-accent-soft to-card px-4 py-4 shadow-[var(--shadow-soft)]">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-accent shadow-[var(--shadow-tab)]">
          <IcDeepTalk className="size-5" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="eyebrow text-[11px] text-accent-ink">Deep Talk hari ini</span>
          <span className="font-serif text-[19px] leading-[1.15]">{dtText}</span>
        </span>
        <span className="flex shrink-0">
          <PartnerAvatar who="A" name={profile.partnerA} size={30} ring="border-2 border-card" />
          <span className="-ml-2.5">
            <PartnerAvatar who="B" name={profile.partnerB} size={30} ring="border-2 border-card" />
          </span>
        </span>
      </Link>
    </div>
  )
}
