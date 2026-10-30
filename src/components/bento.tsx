// Kartu Beranda desktop bergaya bento: panel bulat besar, ikon dalam lingkaran, tombol panah bulat di pojok,
// angka besar Instrument Serif. Warna tetap token Melati/Kain/Sirih/Mawar; mobile memakai kartu di cards.tsx.
import { ArrowRight, ArrowUpRight, Check, CircleAlert, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DEEP_TALK } from '../data/content'
import { celebrate } from '../lib/celebrate'
import { guestStats, taskDue, taskOffset } from '../lib/selectors'
import { usePlan, useSession } from '../lib/store'
import type { Guest, Task } from '../lib/types'
import { cn, daysUntil, fmtDate, rupiah, rupiahShort } from '../lib/utils'
import { Ring } from './cards'
import { IcBudget, IcGuests, IcSavings, IcVendor, type AppIcon } from './icons'
import { PartnerAvatar } from './ui'

export function Tile({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('flex flex-col gap-5 rounded-[28px] border border-border bg-card p-6 shadow-[var(--shadow-soft)]', className)}>{children}</section>
}

/** Tombol panah bulat di pojok kartu (pola dari referensi dashboard). */
export function CornerLink({ to, label, dark }: { to: string; label: string; dark?: boolean }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        'group grid size-10 shrink-0 place-items-center rounded-full border transition-colors duration-200',
        dark ? 'border-white/20 text-white hover:bg-white/10' : 'border-border bg-card text-ink hover:bg-muted',
      )}
    >
      <ArrowUpRight className="size-[18px] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
    </Link>
  )
}

function TileHead({ icon: Icon, title, sub, right, chip = 'bg-muted text-ink', dark }: { icon: AppIcon; title: string; sub?: ReactNode; right?: ReactNode; chip?: string; dark?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn('grid size-11 shrink-0 place-items-center rounded-full', chip)}>
          <Icon className="size-5" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[17px] font-semibold leading-tight">{title}</span>
          {sub && <span className={cn('truncate text-xs tabular-nums', dark ? 'text-[#D5DCCB]' : 'text-muted-foreground')}>{sub}</span>}
        </span>
      </div>
      {right}
    </div>
  )
}

function budgetStatus(total: number, committed: number) {
  return committed > total ? { cls: 'badge-danger', text: 'Over budget' } : committed > total * 0.9 ? { cls: 'badge-warning', text: 'Mendekati batas' } : { cls: 'badge-success', text: 'Sesuai rencana' }
}

/** Budget: angka sisa besar + meter batang tipis (terbayar · belum dibayar · belum terpakai). */
export function BudgetTile({ total, committed, paid }: { total: number; committed: number; paid: number }) {
  const left = total - committed
  const status = budgetStatus(total, committed)
  const BARS = 40
  const scale = Math.max(total, committed, 1)
  const paidBars = Math.round((paid / scale) * BARS)
  const usedBars = Math.round((committed / scale) * BARS)
  const over = committed > total
  return (
    <Tile className="h-full">
      <TileHead icon={IcBudget} title="Budget kalian" sub={`dari ${rupiah(total)}`} chip="bg-primary-soft text-on-primary-soft" right={<CornerLink to="/app/budget" label="Buka budget" />} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="eyebrow text-[11px]">{left < 0 ? 'Melewati budget' : 'Sisa budget'}</span>
          <span className={cn('font-serif text-[48px] leading-none tabular-nums', left < 0 && 'text-destructive')}>
            {left < 0 && '−'}
            {rupiah(Math.abs(left))}
          </span>
        </div>
        <span className={cn(status.cls, 'min-h-7 text-xs')}>{status.text}</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
          <span>0</span>
          <span>{rupiahShort(total)}</span>
        </div>
        <div className="flex h-14 gap-[3px]" role="img" aria-label={`Terpakai ${total ? Math.round((committed / total) * 100) : 0}% dari budget`}>
          {Array.from({ length: BARS }, (_, i) => (
            <span
              key={i}
              className={cn('flex-1 rounded-full', i < paidBars ? (over ? 'bg-destructive' : 'bg-primary') : i < usedBars ? (over ? 'bg-[#E8B9AB]' : 'bg-sage') : 'bg-divider')}
            />
          ))}
        </div>
      </div>
      <dl className="mt-auto grid grid-cols-3 divide-x divide-divider border-t border-divider pt-4">
        {[
          { k: 'Terbayar', v: paid, dot: 'bg-primary' },
          { k: 'Belum dibayar', v: Math.max(0, committed - paid), dot: 'bg-sage' },
          { k: 'Belum terpakai', v: Math.max(0, left), dot: 'bg-border' },
        ].map((x) => (
          <div key={x.k} className="flex flex-col gap-0.5 px-4 first:pl-0">
            <dd className="text-[22px] font-semibold leading-tight tracking-tight tabular-nums">{rupiahShort(x.v)}</dd>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden className={cn('size-2 rounded-full', x.dot)} />
              {x.k}
            </dt>
          </div>
        ))}
      </dl>
    </Tile>
  )
}

/** Tamu: kisi kotak kecil — tiap kotak mewakili sebagian tamu, diwarnai sesuai status RSVP. */
export function GuestTile({ guests }: { guests: Guest[] }) {
  const g = guestStats(guests)
  const waiting = g.belum + g.ragu
  const CELLS = 32
  const share = (n: number) => (g.totalPax ? Math.round((n / g.totalPax) * CELLS) : 0)
  const hadir = share(g.hadir)
  const tidak = share(g.tidak)
  const wait = Math.max(0, Math.min(CELLS - hadir - tidak, share(waiting)))
  const cells = Array.from({ length: CELLS }, (_, i) => (i < hadir ? 'bg-primary' : i < hadir + wait ? 'bg-[#C9D4BA]' : i < hadir + wait + tidak ? 'bg-[#E8B9AB]' : 'bg-white/70'))
  return (
    <Tile className="border-transparent bg-primary-soft">
      <TileHead icon={IcGuests} title="Tamu & RSVP" sub={`${g.invited} undangan · ${g.totalPax} orang`} chip="bg-card text-on-primary-soft" right={<CornerLink to="/app/tamu" label="Buka tamu" />} />
      <div className="grid grid-cols-8 gap-1.5" role="img" aria-label={`${g.hadir} hadir, ${waiting} menunggu, ${g.tidak} tidak hadir`}>
        {cells.map((c, i) => (
          <span key={i} className={cn('h-7 rounded-[9px]', c)} />
        ))}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3">
        <ul className="flex flex-col gap-1 text-xs text-on-primary-soft">
          <li className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-primary" />Hadir {g.hadir}</li>
          <li className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-[#C9D4BA] ring-1 ring-primary/20" />Menunggu {waiting}</li>
          <li className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-[#E8B9AB]" />Tidak hadir {g.tidak}</li>
        </ul>
        <span className="text-right font-serif text-[52px] leading-[0.85] tabular-nums text-ink">
          {g.hadir}
          <span className="text-[24px] text-on-primary-soft">/{g.totalPax}</span>
          <span className="block font-sans text-xs text-on-primary-soft">konfirmasi hadir</span>
        </span>
      </div>
      {g.invited === 0 && <p className="-mt-2 text-xs text-on-primary-soft">Belum ada tamu. Tambahkan atau impor dari Excel.</p>}
    </Tile>
  )
}

/** Tugas berikutnya: panel gelap Sirih, tiap tugas punya tombol centang bulat. */
export function TasksTile({ tasks, done, total }: { tasks: Task[]; done: number; total: number }) {
  const { profile, update } = usePlan()
  const me = useSession((x) => x.me)
  return (
    <section className="flex flex-col gap-4 rounded-[28px] bg-primary p-6 text-white shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex flex-col">
          <span className="text-[17px] font-semibold">Tugas berikutnya</span>
          <span className="text-xs text-[#D5DCCB]">Centang yang sudah beres</span>
        </span>
        <span className="font-serif text-[40px] leading-[0.9] tabular-nums">
          {done}
          <span className="text-[22px] text-[#D5DCCB]">/{total}</span>
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-[18px] bg-white/[0.07] px-4 py-5 text-sm text-[#D5DCCB]">Semua tugas sudah selesai. Kalian hebat!</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((t) => {
            const due = taskDue(profile.weddingDate, t.offsetDays, t.custom)
            const d = daysUntil(due)
            const off = taskOffset(profile.weddingDate, t.offsetDays, t.custom)
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-[18px] bg-white/[0.07] px-3 py-2.5">
                <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-full bg-white leading-none text-primary">
                  <span className="text-[14px] font-semibold tabular-nums">{fmtDate(due, 'd')}</span>
                  <span className="text-[9px] font-semibold uppercase">{fmtDate(due, 'MMM')}</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-2 text-[13px] font-medium leading-snug">{t.title}</span>
                  <span className={cn('text-[11px] tabular-nums', d < 0 ? 'font-semibold text-[#F2B8A8]' : 'text-[#D5DCCB]')}>
                    {off < 0 ? `H${off}` : off === 0 ? 'Hari-H' : `H+${off}`}
                    {d < 0 && ' · terlambat'}
                  </span>
                </span>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={false}
                  aria-label={`Tandai "${t.title}" selesai`}
                  onClick={(e) => {
                    celebrate(e.currentTarget)
                    update('tasks', t.id, { done: true, doneBy: me, autoDone: false })
                  }}
                  className="group grid size-8 shrink-0 place-items-center rounded-full border border-white/30 transition-colors duration-200 hover:border-white hover:bg-white hover:text-primary"
                >
                  <Check className="size-4 opacity-40 group-hover:opacity-100" strokeWidth={2.4} aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <Link to="/app/checklist" className="mt-auto inline-flex min-h-10 items-center justify-between rounded-full bg-white px-4 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-[#EEF1E8]">
        Buka checklist
        <span className="grid size-7 place-items-center rounded-full bg-primary text-white">
          <ArrowRight className="size-4" strokeWidth={2} aria-hidden />
        </span>
      </Link>
    </section>
  )
}

export function PaymentsTile({ pays, paidTotal, badge }: { pays: { id: string; vendorId: string; vendorName: string; label: string; dueDate: string; amount: number }[]; paidTotal: number; badge: (due: string) => ReactNode }) {
  return (
    <Tile className="h-full">
      <TileHead icon={IcVendor} title="Pembayaran" sub={`Terdekat · ${rupiahShort(paidTotal)} dibayar`} right={<CornerLink to="/app/vendor" label="Buka vendor" />} />
      {pays.length === 0 ? (
        <p className="rounded-[18px] bg-muted px-4 py-5 text-sm text-body">Belum ada jadwal pembayaran. Tambahkan vendor dan termin DP/pelunasan supaya dapat pengingat.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-divider">
          {pays.map((p) => (
            <li key={p.id}>
              <Link to={`/app/vendor/${p.vendorId}`} className="flex items-center gap-3 py-3 first:pt-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted font-serif text-lg text-ink">{p.vendorName.replace(/\(.*?\)/g, '').trim().charAt(0).toUpperCase()}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">{p.vendorName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {p.label} · {fmtDate(p.dueDate, 'd MMM')}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums">{rupiahShort(p.amount)}</span>
                  {badge(p.dueDate)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Tile>
  )
}

export function DeepTalkTile({ day, answered, partnerAnswered }: { day: number; answered: boolean; partnerAnswered: boolean }) {
  const { partnerA, partnerB } = usePlan((s) => s.profile)
  const q = DEEP_TALK[day % DEEP_TALK.length]
  const words = q.q.replace(/\?$/, '').split(' ')
  const tail = words.pop()
  return (
    <Link to="/app/deep-talk" className="group flex h-full flex-col gap-4 rounded-[28px] bg-accent-soft p-6 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex">
          <PartnerAvatar who="A" name={partnerA} size={34} ring="border-2 border-accent-soft" />
          <span className="-ml-2.5">
            <PartnerAvatar who="B" name={partnerB} size={34} ring="border-2 border-accent-soft" />
          </span>
        </span>
        <span className="grid size-10 place-items-center rounded-full border border-[#E9CFC4] bg-card/60 text-accent-ink">
          <ArrowUpRight className="size-[18px] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
        </span>
      </div>
      <p className="font-serif text-[30px] leading-[1.1] text-ink">
        {words.join(' ')} <span className="italic">{tail}</span>?
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex min-h-8 items-center rounded-full bg-ink px-3.5 text-xs font-semibold text-white">Deep Talk · Hari ke-{day + 1}</span>
        <span className="flex items-center gap-2 text-[13px] text-[#6E3A2D]">
          <Lock className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
          {answered && partnerAnswered ? 'Jawaban kalian sudah terbuka' : answered ? 'Menunggu pasanganmu' : 'Terbuka setelah kamu menjawab'}
        </span>
      </div>
    </Link>
  )
}

export function SavingsTile({ saved, target }: { saved: number; target: number }) {
  return (
    <Link to="/app/tabungan" className="group flex h-full flex-col gap-4 rounded-[28px] border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]">
      <TileHead icon={IcSavings} title="Tabungan" sub={`target ${rupiahShort(target)}`} />
      <div className="mt-auto flex items-end justify-between gap-3">
        <span className="flex flex-col">
          <span className="font-serif text-[36px] leading-none tabular-nums">{rupiahShort(saved)}</span>
          <span className="mt-1 text-xs text-muted-foreground">terkumpul</span>
        </span>
        <Ring value={saved} max={target} size={84} label="Progres tabungan" />
      </div>
    </Link>
  )
}

export function HiddenCostTile({ count }: { count: number }) {
  return (
    <Link to="/app/budget" className="group flex h-full flex-col gap-3 rounded-[28px] bg-muted p-6 transition-colors duration-200 hover:bg-[#EDE6D9]">
      <div className="flex items-start justify-between gap-3">
        <span className="badge-accent">
          <CircleAlert className="size-3.5" strokeWidth={2} aria-hidden /> Sering terlewat
        </span>
        <span className="grid size-10 place-items-center rounded-full border border-border bg-card text-ink">
          <ArrowUpRight className="size-[18px] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
        </span>
      </div>
      <p className="mt-auto font-serif text-[44px] leading-none tabular-nums">{count}</p>
      <p className="text-sm font-semibold text-ink">hidden cost sudah masuk budget</p>
      <p className="text-xs leading-relaxed text-body">Transport keluarga, konsumsi kru, overtime, dan pos lain yang sering bikin bengkak.</p>
    </Link>
  )
}

/** Tata letak desktop lebar (xl): konten utama di kiri, panel ringkasan di kanan. Di bawah xl tetap satu kolom. */
export function WithPanel({ children, panel }: { children: ReactNode; panel: ReactNode }) {
  return (
    <div className="flex flex-col gap-3.5 xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:gap-6">
      <div className="flex min-w-0 flex-col gap-3.5">{children}</div>
      {panel}
    </div>
  )
}

/** Panel ringkasan gelap Sirih di kolom kanan (hanya xl), menempel saat halaman di-scroll. */
export function SidePanel({ title, sub, value, children }: { title: string; sub?: ReactNode; value?: ReactNode; children?: ReactNode }) {
  return (
    <aside className="sticky top-24 hidden flex-col gap-4 rounded-[28px] bg-primary p-6 text-white shadow-[var(--shadow-soft)] xl:flex">
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="text-[17px] font-semibold">{title}</span>
          {sub && <span className="text-xs text-[#D5DCCB]">{sub}</span>}
        </span>
        {value !== undefined && <span className="shrink-0 font-serif text-[44px] leading-[0.9] tabular-nums">{value}</span>}
      </div>
      {children}
    </aside>
  )
}

export function PanelBar({ value, max, tone = 'bg-[#C9D4BA]' }: { value: number; max: number; tone?: string }) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-white/15" aria-hidden>
      <span className={cn('block h-full rounded-full transition-[width] duration-700', tone)} style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
    </span>
  )
}

/** Baris angka di panel gelap: label kiri, nilai kanan. */
export function PanelStat({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] bg-white/[0.07] px-4 py-3 text-sm">
      <span className="text-[#D5DCCB]">{label}</span>
      <span className={cn('font-semibold tabular-nums', tone)}>{value}</span>
    </div>
  )
}
