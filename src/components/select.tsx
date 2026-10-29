// Dropdown & kolom isian bersaran buatan sendiri.
// Popup <select>/<datalist> bawaan browser tidak selalu tampil (di dalam dialog, webview, atau layar sentuh tertentu),
// jadi daftarnya digambar sendiri: tampil di atas segalanya, membalik ke atas kalau ruang bawah sempit, bisa dioperasikan dengan keyboard.
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'

export interface SelectOption<T extends string = string> {
  value: T
  label: ReactNode
}

/** Posisi daftar mengikuti pemicunya. Di dalam <dialog> daftar harus ikut dirender di dalam dialog agar tidak tertutup lapisan modal. */
function useFloatingList(open: boolean, anchor: React.RefObject<HTMLElement | null>, list: React.RefObject<HTMLElement | null>, close: () => void) {
  const [style, setStyle] = useState<CSSProperties>()
  const [host, setHost] = useState<HTMLElement>()

  useLayoutEffect(() => {
    const el = anchor.current
    if (!open || !el) return
    const r = el.getBoundingClientRect()
    const below = window.innerHeight - r.bottom - 12
    const above = r.top - 12
    const up = below < 200 && above > below
    const fromRight = r.left > window.innerWidth / 2
    setHost((el.closest('dialog') as HTMLElement | null) ?? document.body)
    setStyle({
      position: 'fixed',
      minWidth: r.width,
      maxWidth: 'min(22rem, calc(100vw - 16px))',
      maxHeight: Math.max(120, Math.min(288, up ? above : below)),
      ...(fromRight ? { right: Math.max(8, window.innerWidth - r.right) } : { left: Math.max(8, r.left) }),
      ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    })
  }, [open, anchor])

  useEffect(() => {
    if (!open) return
    // Scroll yang terjadi sesaat setelah dibuka (fokus pemicu, dsb.) jangan menutup daftar.
    const openedAt = performance.now()
    const onScroll = (e: Event) => {
      if (performance.now() - openedAt < 250) return
      if (e.target instanceof Node && list.current?.contains(e.target)) return
      close()
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open, close, list])

  return { style, host }
}

const LIST_CLS = 'z-[60] overflow-y-auto rounded-[14px] border border-border bg-card p-1 shadow-[var(--shadow-lift)]'

export function Select<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = 'Pilih',
  className,
  label,
  compact,
}: {
  id?: string
  value: T | ''
  onChange: (v: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  className?: string
  /** Label untuk pembaca layar kalau tidak ada <label> di dekatnya. */
  label?: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const btn = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const listId = useId()
  const idx = options.findIndex((o) => o.value === value)
  const close = () => setOpen(false)
  const { style, host } = useFloatingList(open, btn, list, close)

  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => {
      const t = e.target as Node
      if (!btn.current?.contains(t) && !list.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('pointerdown', off)
    return () => document.removeEventListener('pointerdown', off)
  }, [open])

  // Hanya menggulir daftarnya sendiri (scrollIntoView akan ikut menggulir halaman).
  useEffect(() => {
    const ul = list.current
    const li = ul?.children[active] as HTMLElement | undefined
    if (!open || !ul || !li) return
    if (li.offsetTop < ul.scrollTop) ul.scrollTop = li.offsetTop - 4
    else if (li.offsetTop + li.offsetHeight > ul.scrollTop + ul.clientHeight) ul.scrollTop = li.offsetTop + li.offsetHeight - ul.clientHeight + 4
  }, [open, active, style])

  const show = () => {
    setActive(Math.max(0, idx))
    setOpen(true)
  }
  const pick = (v: T) => {
    onChange(v)
    setOpen(false)
    btn.current?.focus()
  }
  const onKey = (e: KeyboardEvent) => {
    if (!options.length) return
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        show()
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(options.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(options.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(options[active].value)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  const current = options[idx]
  return (
    <div className={cn('relative', className)}>
      <button
        ref={btn}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKey}
        className={cn('input flex items-center justify-between gap-2 text-left', compact && 'min-h-9 px-3 text-sm', !current && 'text-muted-foreground')}
      >
        <span className="min-w-0 flex-1 truncate">{current ? current.label : placeholder}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} aria-hidden />
      </button>
      {open &&
        host &&
        createPortal(
          <ul ref={list} id={listId} role="listbox" aria-label={label} style={style} className={LIST_CLS}>
            {options.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                onPointerDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(o.value)}
                className={cn('flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-sm', i === active && 'bg-muted', o.value === value && 'font-semibold')}
              >
                <span className="min-w-0 break-words">{o.label}</span>
                {o.value === value && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
              </li>
            ))}
          </ul>,
          host,
        )}
    </div>
  )
}

/** Kolom isian dengan saran (pengganti <datalist>): daftar muncul saat fokus dan menyempit sambil mengetik. */
export function ComboInput({ id, value, onChange, suggestions, placeholder, className }: { id?: string; value: string; onChange: (v: string) => void; suggestions: string[]; placeholder?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const listId = useId()
  const [typed, setTyped] = useState(false)
  const q = value.trim().toLowerCase()
  // Belum mengetik = tampilkan semua saran (isian bawaan tidak menyembunyikan pilihan lain).
  const matches = typed ? suggestions.filter((s) => s.toLowerCase() !== q && s.toLowerCase().includes(q)) : suggestions.filter((s) => s.toLowerCase() !== q)
  const showList = open && matches.length > 0
  const close = () => setOpen(false)
  const { style, host } = useFloatingList(showList, input, list, close)

  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => {
      const t = e.target as Node
      if (!input.current?.contains(t) && !list.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('pointerdown', off)
    return () => document.removeEventListener('pointerdown', off)
  }, [open])

  const pick = (v: string) => {
    onChange(v)
    setOpen(false)
    setActive(-1)
  }
  const onKey = (e: KeyboardEvent) => {
    if (!showList) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(matches.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(-1, a - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      pick(matches[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <input
        ref={input}
        id={id}
        className={cn('input', className)}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls={showList ? listId : undefined}
        onFocus={() => {
          setTyped(false)
          setOpen(true)
        }}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value)
          setTyped(true)
          setOpen(true)
          setActive(-1)
        }}
        onKeyDown={onKey}
      />
      {showList &&
        host &&
        createPortal(
          <ul ref={list} id={listId} role="listbox" style={style} className={LIST_CLS}>
            {matches.map((m, i) => (
              <li key={m} role="option" aria-selected={i === active} onPointerDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(m)} className={cn('flex min-h-10 cursor-pointer items-center rounded-[10px] px-3 py-2 text-sm', i === active && 'bg-muted')}>
                {m}
              </li>
            ))}
          </ul>,
          host,
        )}
    </div>
  )
}
