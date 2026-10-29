import { ArrowRight, CalendarDays, Receipt, Sparkles } from 'lucide-react'
import { IcAllFeatures, IcChecklist, IcHoneymoon, IcRundown, IcSavings, IcLetter, IcSeserahan, IcVision } from '../../components/icons'
import { Link } from 'react-router-dom'
import { BudgetMini, CountdownHero, FeatureGrid, GuestMini, type FeatureTile } from '../../components/cards'
import { budgetSummary, budgetTotals, taskDue, upcomingPayments } from '../../lib/selectors'
import { usePlan, useSession } from '../../lib/store'
import { cn, daysUntil, fmtDate, rupiah, todayISO } from '../../lib/utils'
import { deepTalkIndex } from './DeepTalk'

/** Beranda mobile — mengikuti layar "Beranda" (390px) di HTML desain. */
export default function MobileHome() {
  const s = usePlan()
  const { me } = useSession()
  const { profile } = s
  const totals = budgetTotals(budgetSummary(s))
  const dtIndex = deepTalkIndex(profile.createdAt)
  const dt = s.deepTalk[dtIndex] ?? {}
  const other = me === 'A' ? 'B' : 'A'
  const name = (p: 'A' | 'B') => (p === 'A' ? profile.partnerA : profile.partnerB)

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

  // Menu pintasan fitur (di atas "Langkah berikutnya"). Checklist diberi penanda kalau ada yang lewat deadline.
  const tiles: FeatureTile[] = [
    { to: '/app/checklist', label: 'Checklist', icon: IcChecklist, badge: overdue.length ? { text: String(overdue.length), danger: true } : undefined },
    { to: '/app/rundown', label: 'Rundown', icon: IcRundown },
    { to: '/app/tabungan', label: 'Tabungan', icon: IcSavings },
    { to: '/app/seserahan', label: 'Seserahan', icon: IcSeserahan },
    { to: '/app/vision-board', label: 'Vision board', icon: IcVision, tone: 'rose' },
    { to: '/app/honeymoon', label: 'Honeymoon', icon: IcHoneymoon, tone: 'rose' },
    { to: '/app/undangan', label: 'Undangan digital', icon: IcLetter, tone: 'rose' },
    { to: '/app/lainnya', label: 'Lihat semua', icon: IcAllFeatures, tone: 'plain' },
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
    <div className="flex flex-col gap-4 lg:hidden">

      <div className="mt-1 flex flex-col gap-1">
        <p className="eyebrow">{fmtDate(todayISO(), 'EEEE, d MMMM')}</p>
        <h1 className="text-[34px] leading-[1.05]">
          Halo, {profile.partnerA} <span className="italic">&amp;</span> {profile.partnerB}
        </h1>
      </div>

      <CountdownHero />

      <div className="grid grid-cols-2 gap-3">
        <BudgetMini total={profile.totalBudget} committed={totals.committed} paid={totals.paid} />
        <GuestMini guests={s.guests} />
      </div>

      {s.vendors.length === 0 && s.guests.length === 0 && (
        <button className="btn-soft btn-sm self-start" onClick={s.loadDemo}>
          <Sparkles className="size-4" aria-hidden /> Isi data contoh
        </button>
      )}

      <FeatureGrid tiles={tiles} />

      <section className="mt-1 flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-sans text-base font-semibold">Langkah berikutnya</h2>
          <Link to="/app/checklist" className="text-[13px] font-semibold text-primary">
            Semua
          </Link>
        </div>
        <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
          {steps.map((x) => {
            const d = daysUntil(x.date)
            return (
              <li key={x.key} className="border-b border-divider last:border-0">
                <Link to={x.to} className="flex min-h-16 items-center gap-3 px-4 py-3">
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', x.kind === 'pay' ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-on-primary-soft')}>
                    {x.kind === 'pay' ? <Receipt className="size-5" strokeWidth={1.8} aria-hidden /> : <CalendarDays className="size-5" strokeWidth={1.8} aria-hidden />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">{x.title}</span>
                    <span className="truncate text-xs text-muted-foreground">{x.sub}</span>
                  </span>
                  <span className={cn('shrink-0 text-xs font-semibold', d < 0 ? 'text-destructive' : d <= 7 ? 'text-warning' : 'text-muted-foreground')}>
                    {d < 0 ? 'Terlambat' : d === 0 ? 'Hari ini' : `${d} hari`}
                  </span>
                </Link>
              </li>
            )
          })}
          {steps.length === 0 && <li className="px-4 py-5 text-sm text-muted-foreground">Semua beres untuk sekarang.</li>}
        </ul>
        {moreLate > 0 && (
          <Link to="/app/checklist" className="text-xs font-semibold text-destructive">
            +{moreLate} lainnya sudah lewat deadline — cek checklist
          </Link>
        )}
      </section>

      <Link to="/app/deep-talk" className="flex items-center gap-3.5 rounded-[20px] bg-accent-soft px-4 py-3.5">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="eyebrow text-[11px] text-accent-ink">Deep Talk hari ini</span>
          <span className="font-serif text-xl leading-[1.15]">{dtText}</span>
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-white">
          <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
        </span>
      </Link>
    </div>
  )
}
