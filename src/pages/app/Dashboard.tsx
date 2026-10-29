import { ArrowRight, CircleAlert, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BudgetCard, CountdownHero, DeepTalkCard, GuestPanel, VendorRow } from '../../components/cards'
import { Progress } from '../../components/ui'
import { budgetSummary, budgetTotals, taskDue, taskOffset, upcomingPayments } from '../../lib/selectors'
import { usePlan, useSession } from '../../lib/store'
import { cn, daysUntil, fmtDate, rupiah, todayISO } from '../../lib/utils'
import { deepTalkIndex } from './DeepTalk'
import MobileHome from './MobileHome'
import { celebrate } from '../../lib/celebrate'

export function dueBadge(dueDate: string) {
  const d = daysUntil(dueDate)
  if (d < 0) return <span className="badge-danger min-h-7 text-xs">Lewat tempo</span>
  if (d <= 7) return <span className="badge-warning min-h-7 text-xs">{d === 0 ? 'Hari ini' : `${d} hari lagi`}</span>
  return <span className="badge-neutral min-h-7 text-xs">{fmtDate(dueDate, 'd MMM')}</span>
}

export const hLabel = (offset: number) => (offset < 0 ? `H${offset}` : offset === 0 ? 'Hari-H' : `H+${offset}`)

function DesktopHome() {
  const s = usePlan()
  const me = useSession((x) => x.me)
  const { profile } = s
  const totals = budgetTotals(budgetSummary(s))
  const pays = upcomingPayments(s.vendors).slice(0, 3)
  const done = s.tasks.filter((t) => t.done).length
  const nextTasks = s.tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.offsetDays - b.offsetDays)
    .slice(0, 4)
  const saved = s.savings.entries.reduce((a, e) => a + e.amount, 0)
  const dtIndex = deepTalkIndex(profile.createdAt)
  const dt = s.deepTalk[dtIndex] ?? {}
  const other = me === 'A' ? 'B' : 'A'
  const hiddenCount = s.categories.filter((c) => c.hidden).length
  const termOf = (vendorId: string, payId: string) => {
    const v = s.vendors.find((x) => x.id === vendorId)
    if (!v) return ''
    const sorted = [...v.payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return `${sorted.findIndex((p) => p.id === payId) + 1} dari ${sorted.length}`
  }

  return (
    <div className="hidden space-y-8 lg:block">
      {/* Sapaan + hitung mundur, sama seperti Beranda mobile */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className="eyebrow">{fmtDate(todayISO(), 'EEEE, d MMMM')}</p>
          <h1 className="text-[44px] leading-[1.05]">
            Halo, {profile.partnerA} <span className="italic">&amp;</span> {profile.partnerB}
          </h1>
        </div>
        <CountdownHero large />
      </section>

      {s.vendors.length === 0 && s.guests.length === 0 && (
        <div className="card-flat flex flex-wrap items-center justify-between gap-3 border border-dashed border-line p-5">
          <p className="text-sm text-body">Ingin melihat app terisi dulu? Isi contoh vendor &amp; tamu (bisa dihapus).</p>
          <button className="btn-soft btn-sm" onClick={s.loadDemo}>
            <Sparkles className="size-4" aria-hidden /> Isi data contoh
          </button>
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2">
        <BudgetCard total={profile.totalBudget} committed={totals.committed} paid={totals.paid} />
        <GuestPanel guests={s.guests} />
        <div className="md:col-span-2">
          <DeepTalkCard day={dtIndex} answered={!!dt[me]} partnerAnswered={!!dt[other]} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[28px]">Pembayaran terdekat</h2>
            <span className="text-sm text-muted-foreground tabular-nums">{rupiah(totals.paid)} dibayar</span>
          </div>
          {pays.length === 0 ? (
            <p className="card p-5 text-sm text-body">Belum ada jadwal pembayaran. Tambahkan vendor dan termin DP/pelunasan supaya dapat pengingat.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pays.map((p) => (
                <li key={p.id}>
                  <VendorRow to={`/app/vendor/${p.vendorId}`} name={p.vendorName} sub={`${p.label} · ${termOf(p.vendorId, p.id)} · ${fmtDate(p.dueDate, 'd MMM')}`} amount={rupiah(p.amount)} badge={dueBadge(p.dueDate)} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/app/vendor" className="link-arrow mt-auto self-start">
            Lihat semua vendor <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
          </Link>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[28px]">Tugas berikutnya</h2>
            <span className="text-sm text-muted-foreground tabular-nums">{done}/{s.tasks.length}</span>
          </div>
          <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
            {nextTasks.map((t) => {
              const due = taskDue(profile.weddingDate, t.offsetDays, t.custom)
              const late = daysUntil(due) < 0
              return (
                <li key={t.id} className="border-b border-divider last:border-0">
                  <label className="flex min-h-14 cursor-pointer items-center gap-3.5 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={(e) => {
                        if (e.target.checked) celebrate(e.currentTarget)
                        s.update('tasks', t.id, { done: e.target.checked, doneBy: e.target.checked ? me : undefined })
                      }}
                    />
                    <span className="min-w-0 flex-1 text-[15px] font-medium">{t.title}</span>
                    <span className={cn('shrink-0 text-[13px]', late ? 'font-semibold text-destructive' : daysUntil(due) <= 30 ? 'font-semibold text-warning' : 'text-muted-foreground')}>{hLabel(taskOffset(profile.weddingDate, t.offsetDays, t.custom))}</span>
                  </label>
                </li>
              )
            })}
          </ul>
          <Link to="/app/checklist" className="link-arrow mt-auto self-start">
            Buka checklist <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
          </Link>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Link to="/app/budget" className="card-flat flex items-start gap-4 p-6 transition-colors duration-200 hover:bg-[#EDE6D9]">
          <div className="min-w-0 flex-1">
            <span className="badge-accent">
              <CircleAlert className="size-3.5" strokeWidth={2} aria-hidden /> Sering terlewat
            </span>
            <p className="mt-3 text-lg font-semibold text-ink">{hiddenCount} hidden cost sudah masuk budget</p>
            <p className="mt-1 text-sm text-body">Transport keluarga, konsumsi kru, overtime, dan pos lain yang sering bikin bengkak.</p>
          </div>
          <ArrowRight className="mt-1 size-5 shrink-0 text-ink" strokeWidth={1.8} aria-hidden />
        </Link>
        <Link to="/app/tabungan" className="card-flat flex flex-col gap-3 p-6 transition-colors duration-200 hover:bg-[#EDE6D9]">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold">Tabungan nikah</span>
            <span className="text-sm text-muted-foreground tabular-nums">{s.savings.target ? Math.round((saved / s.savings.target) * 100) : 0}%</span>
          </div>
          <p className="text-[26px] font-semibold tracking-tight tabular-nums">
            {rupiah(saved)} <span className="text-base font-medium text-muted-foreground">dari {rupiah(s.savings.target)}</span>
          </p>
          <Progress value={saved} max={s.savings.target} label="Progres tabungan" />
        </Link>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <>
      <MobileHome />
      <DesktopHome />
    </>
  )
}
