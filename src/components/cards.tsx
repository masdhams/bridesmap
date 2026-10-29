// Kartu-kartu dari Komponen UI: budget (cincin progres), tamu (panel gelap Sirih),
// Deep Talk (Mawar Muda), dan baris vendor.
import { ArrowUpRight, Lock } from 'lucide-react'
import { IcBudget, IcGuests, type AppIcon } from './icons'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DEEP_TALK } from '../data/content'
import { guestStats } from '../lib/selectors'
import { usePlan } from '../lib/store'
import type { Guest, Partner } from '../lib/types'
import { cn, daysUntil, fmtDate, rupiah } from '../lib/utils'
import { CoverButton, CoverLayer } from './cover'

/** Kartu hitung mundur hari-H (Beranda mobile & desktop), dengan foto latar transparan opsional. */
export function CountdownHero({ large }: { large?: boolean }) {
  const { profile, tasks, setProfile } = usePlan()
  const days = daysUntil(profile.weddingDate)
  const done = tasks.filter((t) => t.done).length
  return (
    <section className={cn('relative flex flex-col justify-between overflow-hidden bg-primary text-white', large ? 'min-h-[260px] gap-8 rounded-[28px] p-8' : 'gap-3.5 rounded-[24px] px-[22px] py-5')}>
      <CoverLayer src={profile.heroPhoto} pos={profile.heroPhotoPos} />
      <div className="relative flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className={cn('font-serif leading-[0.9] tabular-nums', large ? 'text-[88px]' : 'text-[56px]')}>{Number.isFinite(days) ? Math.max(0, days) : '–'}</span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full bg-white/15 px-2.5 text-xs font-semibold backdrop-blur-sm">{fmtDate(profile.weddingDate, profile.dateTentative ? 'MMM yyyy' : 'd MMM yyyy')}</span>
            <CoverButton src={profile.heroPhoto} pos={profile.heroPhotoPos} onChange={(heroPhoto) => setProfile({ heroPhoto })} onPos={(heroPhotoPos) => setProfile({ heroPhotoPos })} label="foto latar" />
          </div>
        </div>
        <span className={cn('font-serif italic text-[#D5DCCB]', large ? 'mt-1 text-[28px]' : 'text-[22px]')}>{days > 0 ? 'hari lagi menuju hari-H' : 'hari bahagia kalian'}</span>
        {large && profile.city && <span className="mt-2 text-sm text-[#D5DCCB]">{profile.city}</span>}
      </div>
      <div className="relative flex flex-col gap-2">
        <div className="flex justify-between text-[13px]">
          <span>Persiapan</span>
          <span className="tabular-nums">{done} / {tasks.length} tugas</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/20">
          <div className="h-1.5 rounded-full bg-[#C9D4BA] transition-[width] duration-700 bar-grow" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
        </div>
      </div>
    </section>
  )
}

export function Ring({ value, max, size = 104, label }: { value: number; max: number; size?: number; label: string }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0
  const r = 44
  const c = 2 * Math.PI * r
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox="0 0 104 104" className="shrink-0">
      <circle cx="52" cy="52" r={r} fill="none" stroke="var(--color-primary-soft)" strokeWidth="10" />
      <circle
        cx="52"
        cy="52"
        r={r}
        fill="none"
        stroke={value > max ? 'var(--color-destructive)' : 'var(--color-primary)'}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${pct * c} ${c}`}
        transform="rotate(-90 52 52)"
        className="transition-[stroke-dasharray] duration-700"
      />
      <text x="52" y="58" textAnchor="middle" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="18" fontWeight="600" fill="var(--color-ink)">
        {Math.round((max > 0 ? value / max : 0) * 100)}%
      </text>
    </svg>
  )
}

// Warna segmen ringkasan budget & tamu (dipakai bersama oleh kartu besar dan kartu mini).
const SEG = { paid: 'var(--color-primary)', due: '#A9B59A', hadir: '#C9D4BA', wait: '#E7D8B8', tidak: '#E8B9AB' }

function budgetStatus(total: number, committed: number) {
  return committed > total
    ? { cls: 'badge-danger', text: 'Over budget' }
    : committed > total * 0.9
      ? { cls: 'badge-warning', text: 'Mendekati batas' }
      : { cls: 'badge-success', text: 'Sesuai rencana' }
}

/** Batang bersegmen; lebar tiap segmen relatif terhadap `max`. */
function SegBar({ parts, max, track, className }: { parts: { n: number; color: string }[]; max: number; track: string; className?: string }) {
  return (
    <div className={cn('flex gap-[3px] overflow-hidden rounded-full', className)} style={{ background: track }}>
      {parts.map((p, i) =>
        p.n > 0 ? <div key={i} className="h-full rounded-full transition-[width] duration-700 bar-grow" style={{ width: `${(p.n / Math.max(1, max)) * 100}%`, background: p.color }} /> : null,
      )}
    </div>
  )
}

const Legend = ({ color, label, value, dark }: { color: string; label: string; value: ReactNode; dark?: boolean }) => (
  <div className="flex min-w-0 flex-col justify-between gap-1">
    <span className={cn('inline-flex items-start gap-1.5 text-xs leading-tight', dark ? 'text-[#D5DCCB]' : 'text-muted-foreground')}>
      <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full" style={{ background: color }} />
      {label}
    </span>
    <span className="break-words text-[13px] font-semibold leading-tight tabular-nums xl:text-sm">{value}</span>
  </div>
)

export function BudgetCard({ total, committed, paid }: { total: number; committed: number; paid: number }) {
  const left = total - committed
  const status = budgetStatus(total, committed)
  const scale = Math.max(total, committed)
  const used = total > 0 ? Math.round((committed / total) * 100) : 0
  return (
    <Link to="/app/budget" className="card group flex flex-col gap-5 p-5 transition-shadow sm:gap-6 sm:p-7 duration-200 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[12px] bg-primary-soft text-on-primary-soft">
            <IcBudget className="size-5" strokeWidth={1.8} aria-hidden />
          </span>
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold">Budget kalian</span>
            <span className="text-xs text-muted-foreground tabular-nums">dari {rupiah(total)}</span>
          </div>
        </div>
        <span className={cn(status.cls, 'min-h-[26px] shrink-0 text-xs')}>{status.text}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="eyebrow text-[11px]">{left < 0 ? 'Melewati budget' : 'Sisa budget'}</span>
        <span className={cn('font-serif text-[44px] leading-none tabular-nums', left < 0 && 'text-destructive')}>
          {left < 0 && '−'}
          {rupiah(Math.abs(left))}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>Terpakai</span>
          <span className={cn('font-semibold tabular-nums', used > 100 ? 'text-destructive' : 'text-ink')}>{used}%</span>
        </div>
        <SegBar
          className="h-2.5"
          track="#EFE9DE"
          max={scale}
          parts={[
            { n: paid, color: committed > total ? 'var(--color-destructive)' : SEG.paid },
            { n: Math.max(0, committed - paid), color: committed > total ? '#E8B9AB' : SEG.due },
          ]}
        />
        <div className="grid grid-cols-3 gap-3 border-t border-divider pt-3">
          <Legend color={SEG.paid} label="Terbayar" value={rupiah(paid)} />
          <Legend color={SEG.due} label="Belum dibayar" value={rupiah(Math.max(0, committed - paid))} />
          <Legend color="#E5DCCB" label="Belum terpakai" value={rupiah(Math.max(0, left))} />
        </div>
      </div>
    </Link>
  )
}

export function GuestPanel({ guests }: { guests: Guest[] }) {
  const g = guestStats(guests)
  const waiting = g.belum + g.ragu
  const replied = g.hadir + g.tidak
  const pct = g.totalPax ? Math.round((replied / g.totalPax) * 100) : 0
  return (
    <Link to="/app/tamu" className="group relative flex flex-col gap-6 overflow-hidden rounded-[24px] bg-primary p-5 text-white sm:p-7 transition-colors duration-200 hover:bg-primary-hover">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-white/[0.06]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[12px] bg-white/10">
            <IcGuests className="size-5" strokeWidth={1.8} aria-hidden />
          </span>
          <div className="flex flex-col">
            <span className="text-[15px] font-semibold">Tamu kalian</span>
            <span className="text-xs text-[#D5DCCB] tabular-nums">{g.invited} undangan · {g.totalPax} orang</span>
          </div>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-[#D5DCCB] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
      </div>

      <div className="relative flex flex-col gap-1">
        <span className="eyebrow text-[11px] text-[#D5DCCB]">Konfirmasi hadir</span>
        <span className="font-serif text-[44px] leading-none tabular-nums">
          {g.hadir}
          <span className="text-[24px] text-[#D5DCCB]"> / {g.totalPax}</span>
        </span>
      </div>

      <div className="relative flex flex-col gap-3">
        <div className="flex items-baseline justify-between text-xs text-[#D5DCCB]">
          <span>Sudah membalas</span>
          <span className="font-semibold tabular-nums text-white">{pct}%</span>
        </div>
        <SegBar
          className="h-2.5"
          track="rgb(255 255 255 / 0.12)"
          max={g.totalPax}
          parts={[
            { n: g.hadir, color: SEG.hadir },
            { n: waiting, color: SEG.wait },
            { n: g.tidak, color: SEG.tidak },
          ]}
        />
        <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
          <Legend dark color={SEG.hadir} label="Hadir" value={g.hadir} />
          <Legend dark color={SEG.wait} label="Menunggu" value={waiting} />
          <Legend dark color={SEG.tidak} label="Tidak hadir" value={g.tidak} />
        </div>
      </div>
      {g.invited === 0 && <p className="relative text-xs text-[#C9CFC0]">Belum ada tamu — tambahkan atau impor dari Excel.</p>}
    </Link>
  )
}


/** Kartu ringkas Beranda mobile: dua kartu berdampingan, dengan gaya yang sama seperti kartu desktop. */
export function BudgetMini({ total, committed, paid }: { total: number; committed: number; paid: number }) {
  const left = total - committed
  const status = budgetStatus(total, committed)
  const used = total > 0 ? Math.round((committed / total) * 100) : 0
  return (
    <Link to="/app/budget" className="card group flex flex-col gap-3 p-4">
      <span className="flex items-center justify-between gap-2">
        <span className="grid size-9 place-items-center rounded-[11px] bg-primary-soft text-on-primary-soft">
          <IcBudget className="size-[18px]" strokeWidth={1.8} aria-hidden />
        </span>
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{left < 0 ? 'Melewati budget' : 'Sisa budget'}</span>
        <span className={cn('font-serif text-[22px] leading-none tabular-nums min-[400px]:text-[24px]', left < 0 && 'text-destructive')}>{rupiah(Math.abs(left))}</span>
      </span>
      <SegBar
        className="h-1.5"
        track="#EFE9DE"
        max={Math.max(total, committed)}
        parts={[
          { n: paid, color: left < 0 ? 'var(--color-destructive)' : SEG.paid },
          { n: Math.max(0, committed - paid), color: left < 0 ? '#E8B9AB' : SEG.due },
        ]}
      />
      <span className="mt-auto flex items-center justify-between gap-2">
        <span className={cn(status.cls, 'min-h-6 px-2 text-[11px]')}>{status.text}</span>
        <span className="text-[11px] font-semibold tabular-nums text-body">{used}%</span>
      </span>
    </Link>
  )
}

export function GuestMini({ guests }: { guests: Guest[] }) {
  const g = guestStats(guests)
  const waiting = g.belum + g.ragu
  return (
    <Link to="/app/tamu" className="group relative flex flex-col gap-3 overflow-hidden rounded-[20px] bg-primary p-4 text-white">
      <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-white/[0.07]" />
      <span className="relative flex items-center justify-between gap-2">
        <span className="grid size-9 place-items-center rounded-[11px] bg-white/10">
          <IcGuests className="size-[18px]" strokeWidth={1.8} aria-hidden />
        </span>
        <ArrowUpRight className="size-4 text-[#D5DCCB] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} aria-hidden />
      </span>
      <span className="relative flex flex-col gap-1">
        <span className="text-xs text-[#D5DCCB]">RSVP hadir</span>
        <span className="font-serif text-[24px] leading-none tabular-nums">
          {g.hadir}
          <span className="text-[15px] text-[#D5DCCB]"> / {g.totalPax}</span>
        </span>
      </span>
      <SegBar
        className="relative h-1.5"
        track="rgb(255 255 255 / 0.14)"
        max={g.totalPax}
        parts={[
          { n: g.hadir, color: SEG.hadir },
          { n: waiting, color: SEG.wait },
          { n: g.tidak, color: SEG.tidak },
        ]}
      />
      <span className="relative mt-auto text-[11px] tabular-nums text-[#D5DCCB]">
        {waiting} menunggu · {g.tidak} tidak
      </span>
    </Link>
  )
}

export function DeepTalkCard({ day, answered, partnerAnswered, me }: { day: number; answered: boolean; partnerAnswered: boolean; me?: Partner }) {
  const q = DEEP_TALK[day % DEEP_TALK.length]
  // Kata terakhir pertanyaan diberi italic, mengikuti gaya penekanan Instrument Serif.
  const words = q.q.replace(/\?$/, '').split(' ')
  const tail = words.pop()
  return (
    <Link to="/app/deep-talk" className="flex flex-col gap-4 rounded-[24px] bg-accent-soft p-7 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]" data-me={me}>
      <span className="eyebrow text-accent-ink">Deep Talk · Hari ke-{day + 1}</span>
      <p className="font-serif text-[28px] leading-[1.12] text-ink sm:text-[30px]">
        {words.join(' ')} <span className="italic">{tail}</span>?
      </p>
      <p className="flex items-center gap-2.5 text-[13px] text-[#6E3A2D]">
        <Lock className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
        {answered && partnerAnswered ? 'Kalian berdua sudah menjawab — buka jawabannya' : answered ? 'Menunggu pasanganmu menjawab' : 'Jawaban pasangan terbuka setelah kamu menjawab'}
      </p>
    </Link>
  )
}

export const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

export function VendorRow({ to, name, sub, amount, badge }: { to: string; name: string; sub: ReactNode; amount: string; badge?: ReactNode }) {
  return (
    <Link to={to} className="card flex items-center gap-4 rounded-[20px] px-5 py-4 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]">
      <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-muted font-serif text-[22px] text-ink">{initials(name)}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base font-semibold">{name}</span>
        <span className="truncate text-[13px] text-muted-foreground">{sub}</span>
        <span className="text-[14px] font-semibold tabular-nums text-ink sm:hidden">{amount}</span>
      </span>
      <span className="hidden text-[15px] font-semibold tabular-nums sm:block">{amount}</span>
      {badge}
    </Link>
  )
}

export interface FeatureTile {
  to: string
  label: string
  icon: AppIcon
  /** Nada warna ikon: money/plan = sage, berdua = mawar muda. */
  tone?: 'sage' | 'rose' | 'plain'
  badge?: { text: string; danger?: boolean }
}

/** Grid menu fitur 4 kolom ala beranda aplikasi dompet digital: ikon di atas, label di bawah. */
export function FeatureGrid({ tiles, label = 'Menu fitur' }: { tiles: FeatureTile[]; label?: string }) {
  const tone = { sage: 'bg-primary-soft text-on-primary-soft', rose: 'bg-accent-soft text-accent', plain: 'bg-muted text-body' }
  return (
    <nav aria-label={label} className="rounded-[24px] border border-border bg-card px-2 py-4 shadow-[var(--shadow-soft)]">
      <ul className="grid grid-cols-4 gap-y-4">
        {tiles.map((t) => (
          <li key={t.to + t.label}>
            <Link to={t.to} className="group flex min-h-[88px] flex-col items-center gap-1.5 rounded-2xl px-1 py-1 text-center">
              <span className={cn('relative grid size-14 place-items-center rounded-[18px] transition-transform duration-200 group-active:scale-95', tone[t.tone ?? 'sage'])}>
                <t.icon className="size-6" strokeWidth={1.7} aria-hidden />
                {t.badge && (
                  <span className={cn('absolute -right-1.5 -top-1.5 grid min-w-[20px] place-items-center rounded-full px-1.5 text-[10px] font-bold leading-5 text-white', t.badge.danger ? 'bg-destructive' : 'bg-primary')}>{t.badge.text}</span>
                )}
              </span>
              <span className="text-[12px] font-medium leading-tight text-body group-hover:text-ink">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
