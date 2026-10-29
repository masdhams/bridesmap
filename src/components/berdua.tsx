// Bagian "Momen" (Deep Talk · Surat untuk Nanti · Honeymoon) — tab bersama & latar penuh halaman.
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../lib/utils'

const TABS = [
  { to: '/app/berdua', label: 'Momen' },
  { to: '/app/deep-talk', label: 'Deep Talk' },
  { to: '/app/surat', label: 'Surat' },
  { to: '/app/honeymoon', label: 'Honeymoon' },
]

export function BerduaTabs({ tone = 'light' }: { tone?: 'light' | 'rose' }) {
  return (
    <nav aria-label="Fitur berdua" className={cn('grid grid-cols-4 gap-1 rounded-full border p-1', tone === 'rose' ? 'border-white/70 bg-white/55' : 'border-border bg-muted')}>
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            cn('flex min-h-10 items-center justify-center rounded-full px-2 text-[13px]', isActive ? 'bg-card font-semibold text-ink shadow-[var(--shadow-tab)]' : 'font-medium text-body hover:text-ink')
          }
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Latar Mawar Muda yang memenuhi layar di mobile; kartu membulat di desktop. */
export function RoseBackdrop({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="-mx-5 -mt-4 -mb-32 min-h-dvh bg-accent-soft px-5 pt-4 pb-32 sm:-mx-6 sm:px-6 lg:m-0 lg:min-h-0 lg:rounded-[28px] lg:p-8">
      <div className={cn('mx-auto', wide ? 'max-w-2xl lg:max-w-5xl' : 'max-w-2xl')}>{children}</div>
    </div>
  )
}

/** Judul serif dengan bagian kedua miring, mis. "Deep *Talk*". */
export function SplitTitle({ a, b, className }: { a: string; b: string; className?: string }) {
  return (
    <h1 className={cn('text-[26px] leading-none sm:text-[34px]', className)}>
      {a}
      <span className="italic">{b}</span>
    </h1>
  )
}
