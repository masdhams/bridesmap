import { cn } from '../../lib/utils'
import { fmt } from './shared'

const HEART = 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.6.7-1.5 2.2-2.6 4.3-2.6 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z'

/** Warna kartu kalender per template undangan. */
const TONES = {
  sage: {
    card: 'border border-border bg-white shadow-[0_1px_2px_rgba(52,67,47,.06),0_18px_40px_-16px_rgba(52,67,47,.25)]',
    title: 'text-primary',
    label: 'text-muted-foreground',
    day: 'text-ink',
    faded: 'text-[#A39B8B]',
    heart: 'text-accent',
    onHeart: 'text-background',
    divider: 'border-[#CFC4B0]',
  },
  noir: {
    card: 'rounded-2xl bg-[#F4F1EC] shadow-[0_30px_60px_-30px_rgba(0,0,0,.9)]',
    title: 'text-[#1E1E1E]',
    label: 'text-[#5E5850]',
    day: 'text-[#1E1E1E]',
    faded: 'text-[#A39B8F]',
    heart: 'text-[#7E6450]',
    onHeart: 'text-[#F4F1EC]',
    divider: 'border-[#C9BFAF]',
  },
}

/** Kartu kalender bulan acara: tanggal pernikahan ditandai hati, ditutup "Save the Date". */
export default function CalendarCard({ day, tone = 'sage' }: { day: Date; tone?: keyof typeof TONES }) {
  const t = TONES[tone]
  const year = day.getFullYear()
  const month = day.getMonth()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7 // minggu dimulai Senin
  const days = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()
  const cells = [
    ...Array.from({ length: offset }, (_, i) => ({ d: prevDays - offset + 1 + i, muted: true })),
    ...Array.from({ length: days }, (_, i) => ({ d: i + 1, muted: false })),
  ]
  const dateDots = [day.getDate(), month + 1, year].map((n) => String(n).padStart(2, '0')).join('.')

  return (
    <div data-reveal className={cn('relative w-full max-w-[340px] px-5 pt-6 pb-7', t.card)}>
      <p className={cn('m-0 text-center text-[13px] font-semibold tracking-[.22em] uppercase', t.title)}>{fmt(day, { month: 'long', year: 'numeric' })}</p>
      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((w) => (
          <span key={w} className={cn('pb-2 text-[10px] font-semibold tracking-[.08em] uppercase', t.label)}>{w}</span>
        ))}
        {cells.map((c, i) => (
          <div key={i} className="grid h-9 place-items-center text-[14px] tabular-nums">
            {!c.muted && c.d === day.getDate() ? (
              <span className={cn('relative grid size-9 place-items-center font-semibold', t.onHeart)}>
                <svg viewBox="0 0 24 24" aria-hidden className={cn('absolute inset-0 size-full', t.heart)}>
                  <path d={HEART} fill="currentColor" />
                </svg>
                <span className="relative -mt-0.5">{c.d}</span>
              </span>
            ) : (
              <span className={c.muted ? t.faded : t.day}>{c.d}</span>
            )}
          </div>
        ))}
      </div>
      <div className={cn('mt-5 border-t border-dashed pt-5 text-center', t.divider)}>
        <p className={cn('m-0 text-[11px] font-semibold tracking-[.28em] uppercase', t.label)}>Save the date</p>
        <p className={cn('m-0 mt-1 font-serif text-[36px] leading-none tracking-[.02em] tabular-nums', t.title)}>{dateDots}</p>
        <svg viewBox="0 0 24 24" aria-hidden className={cn('mx-auto mt-2 size-3.5', t.heart)}>
          <path d={HEART} fill="currentColor" />
        </svg>
      </div>
    </div>
  )
}
