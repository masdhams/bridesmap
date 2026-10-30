import { ArrowLeft, CalendarPlus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { googleCalendarUrl, type CalEvent } from '../lib/calendar'
import { usePlan } from '../lib/store'
import { cn, parseAmount, rupiah, rupiahShort } from '../lib/utils'

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-baseline gap-2 whitespace-nowrap text-foreground', className)}>
      <span className="font-serif text-[1.5em] leading-none">
        Brides<span className="italic text-primary">map</span>
      </span>
      {!compact && <span className="hidden sm:inline text-[0.55em] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Planner</span>}
    </span>
  )
}

/** Header halaman. Di mobile mengikuti layar desain: tombol kembali bulat, judul serif, aksi di kanan. */
export function PageHeader({ title, subtitle, actions, eyebrow, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: string; back?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 lg:mb-6 lg:items-end">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {back && (
          <button
            type="button"
            onClick={() => (location.key !== 'default' ? navigate(-1) : navigate(back))}
            aria-label="Kembali"
            className="no-print grid size-11 shrink-0 place-items-center rounded-full border border-transparent bg-card text-ink shadow-[var(--shadow-soft)] transition-colors duration-200 hover:bg-muted lg:border-border lg:shadow-none"
          >
            <ArrowLeft className="size-5" strokeWidth={1.8} />
          </button>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h1 className="text-[32px] leading-none sm:text-[40px] sm:leading-[1.1] lg:text-[46px]">{title}</h1>
          {subtitle && <p className="mt-2 hidden max-w-prose text-[15px] text-body sm:block">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

/** Tombol aksi bulat 44px (mis. "+" di header mobile). */
export function RoundButton({ onClick, label, children, to }: { onClick?: () => void; label: string; children: ReactNode; to?: string }) {
  const cls = 'grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition-colors duration-200 hover:bg-primary-hover'
  return to ? (
    <Link to={to} aria-label={label} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

/** Avatar inisial pasangan (R hijau, D mawar) seperti di layar desain. */
export function PartnerAvatar({ who, name, size = 26, ring }: { who: 'A' | 'B'; name: string; size?: number; ring?: string }) {
  const photo = usePlan((s) => (who === 'A' ? s.profile.photoA : s.profile.photoB))
  const box = { width: size, height: size }
  if (photo)
    return (
      <span aria-hidden className={cn('block shrink-0 overflow-hidden rounded-full', ring)} style={box}>
        <img src={photo} alt="" className="size-full object-cover" />
      </span>
    )
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-full font-semibold', who === 'A' ? 'bg-primary-soft text-on-primary-soft' : 'bg-accent-soft text-accent-ink', ring)}
      style={{ ...box, fontSize: Math.round(size * 0.42) }}
    >
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  )
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto sm:m-auto w-full max-w-none sm:max-w-lg max-h-[92dvh] rounded-t-[28px] sm:rounded-[28px] bg-card p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:animate-fade-up"
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-divider px-6 py-4">
            <h2 id={titleId} className="text-[28px]">
              {title}
            </h2>
            <button className="icon-btn" onClick={onClose} aria-label="Tutup">
              <X className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5 space-y-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-divider px-6 py-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

/** Input rupiah dengan pemisah ribuan. */
export function MoneyInput({ value, onChange, onBlur, id, placeholder, ariaLabel }: { value: number; onChange: (n: number) => void; onBlur?: () => void; id?: string; placeholder?: string; ariaLabel?: string }) {
  const [text, setText] = useState(value ? value.toLocaleString('id-ID') : '')
  useEffect(() => {
    if (parseAmount(text) !== value) setText(value ? value.toLocaleString('id-ID') : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground">Rp</span>
      <input
        id={id}
        aria-label={ariaLabel}
        inputMode="numeric"
        onBlur={onBlur}
        className="input pl-11 font-semibold tabular-nums"
        placeholder={placeholder ?? '0'}
        value={text}
        onChange={(e) => {
          const n = parseAmount(e.target.value)
          setText(n ? n.toLocaleString('id-ID') : '')
          onChange(n)
        }}
      />
    </div>
  )
}

export function Progress({ value, max, tone = 'primary', label }: { value: number; max: number; tone?: 'primary' | 'accent' | 'success' | 'danger'; label?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const color = { primary: 'bg-primary', accent: 'bg-accent', success: 'bg-success', danger: 'bg-destructive' }[tone]
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-soft" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}>
      <div className={cn('h-full rounded-full transition-[width] duration-500 bar-grow', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Empty({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-[18px] bg-muted text-primary">{icon}</div>
      <h3 className="text-[28px]">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'danger' | 'success' }) {
  return (
    <div className="card h-full p-5 min-w-0">
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-xl sm:text-2xl font-semibold tracking-tight tabular-nums truncate', tone === 'danger' ? 'text-destructive' : tone === 'success' ? 'text-success' : 'text-ink')}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function CalendarButtons({ event, compact }: { event: CalEvent; compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
        <CalendarPlus className="size-4" aria-hidden /> {compact ? 'Google' : 'Google Calendar'}
      </a>
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full overflow-x-auto whitespace-nowrap rounded-full border border-border bg-muted p-1 gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('rounded-full px-[18px] min-h-10 text-sm', value === o.value ? 'bg-primary font-semibold text-on-primary shadow-[var(--shadow-tab)] lg:bg-card lg:text-ink' : 'font-medium text-body hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Checkbox({ checked, onChange, label, sub, strike = true }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; sub?: ReactNode; strike?: boolean }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
      <input type="checkbox" className="mt-0.5 shrink-0 cursor-pointer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="min-w-0">
        <span className={cn('block text-[15px] leading-snug', checked && strike && 'text-muted-foreground line-through')}>{label}</span>
        {sub && <span className="block text-xs text-muted-foreground mt-0.5">{sub}</span>}
      </span>
    </label>
  )
}

export function ConfirmButton({ onConfirm, children, className, label = 'Hapus' }: { onConfirm: () => void; children: ReactNode; className?: string; label?: string }) {
  const [ask, setAsk] = useState(false)
  useEffect(() => {
    if (!ask) return
    const t = setTimeout(() => setAsk(false), 3000)
    return () => clearTimeout(t)
  }, [ask])
  return ask ? (
    <button className={cn('btn-danger btn-sm', className)} onClick={onConfirm}>
      Yakin {label.toLowerCase()}?
    </button>
  ) : (
    <button className={className ?? 'icon-btn text-muted-foreground'} onClick={() => setAsk(true)} aria-label={label}>
      {children}
    </button>
  )
}

/** Chip filter ala layar Tamu/Checklist: aktif = Arang solid, sisanya garis Pasir. Bisa digeser di mobile. */
export function FilterChips<T extends string>({ value, onChange, options, label, bleed = true }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string; bleed?: boolean }) {
  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-1.5 overflow-x-auto [scrollbar-width:none]', bleed && '-mx-5 px-5 sm:mx-0 sm:px-0')}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px]',
            value === o.value ? 'bg-primary font-semibold text-white lg:bg-ink' : 'border border-border bg-card font-medium text-body hover:border-line',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Nominal rupiah penuh (Rp 45.500.000). `compactOnMobile` = ringkas (Rp45,5 jt) hanya di layar kecil yang sempit. */
export function Amount({ value, compactOnMobile, bare }: { value: number; compactOnMobile?: boolean; bare?: boolean }) {
  const full = bare ? Math.round(value || 0).toLocaleString('id-ID') : rupiah(value)
  if (!compactOnMobile) return <>{full}</>
  const short = bare ? rupiahShort(value).replace('Rp', '') : rupiahShort(value)
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{full}</span>
    </>
  )
}
