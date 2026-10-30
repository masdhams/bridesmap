import { BudgetTile, DeepTalkTile, GuestTile, HiddenCostTile, PaymentsTile, SavingsTile, TasksTile } from '../../components/bento'
import { CountdownHero } from '../../components/cards'
import { budgetSummary, budgetTotals, upcomingPayments } from '../../lib/selectors'
import { usePlan, useSession } from '../../lib/store'
import { daysUntil, fmtDate, todayISO } from '../../lib/utils'
import { deepTalkIndex } from './DeepTalk'
import MobileHome from './MobileHome'

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


  return (
    <div className="hidden flex-col gap-5 lg:flex">
      <section className="flex flex-col gap-1">
        <p className="eyebrow">{fmtDate(todayISO(), 'EEEE, d MMMM')}</p>
        <h1 className="text-[44px] leading-[1.05]">
          Halo, {profile.partnerA} <span className="italic">&amp;</span> {profile.partnerB}
        </h1>
      </section>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7 [&>section]:h-full [&>section]:rounded-[28px]">
          <CountdownHero large />
        </div>
        <div className="xl:col-span-5">
          <BudgetTile total={profile.totalBudget} committed={totals.committed} paid={totals.paid} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <GuestTile guests={s.guests} />
        <TasksTile tasks={nextTasks} done={done} total={s.tasks.length} />
        <div className="lg:col-span-2 xl:col-span-1">
          <PaymentsTile pays={pays} paidTotal={totals.paid} badge={dueBadge} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <div className="lg:col-span-2">
          <DeepTalkTile day={dtIndex} answered={!!dt[me]} partnerAnswered={!!dt[other]} />
        </div>
        <SavingsTile saved={saved} target={s.savings.target} />
        <HiddenCostTile count={hiddenCount} />
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
