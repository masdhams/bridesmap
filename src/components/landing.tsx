import { ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Link2, Send } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ALLOCATION_DEFAULTS, EVENT_KINDS } from '../data/content'
import { cn, rupiah } from '../lib/utils'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Pasang di elemen akar halaman. Semua turunan ber-`data-reveal` muncul pelan saat masuk layar (CSS di index.css). */
export function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          // Atribut, bukan class: className dikelola React dan bisa ditimpa saat render ulang.
          e.target.setAttribute('data-shown', '')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    root.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))
    root.classList.add('reveal-ready')
    return () => io.disconnect()
  }, [])
  return ref
}

/** `true` selama elemen terlihat di layar. */
function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setInView(true)
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, inView] as const
}

export function SectionHead({ eyebrow, title, italic, text, align = 'left', tone = 'light', className }: { eyebrow?: string; title: ReactNode; italic: ReactNode; text?: ReactNode; align?: 'left' | 'center'; tone?: 'light' | 'dark'; className?: string }) {
  const dark = tone === 'dark'
  return (
    <div data-reveal className={cn('flex flex-col gap-4', align === 'center' && 'items-center text-center', className)}>
      {eyebrow && <p className={cn('text-[11px] font-semibold uppercase tracking-[0.14em] sm:text-xs sm:tracking-[0.18em]', dark ? 'text-[#D5DCCB]' : 'text-muted-foreground')}>{eyebrow}</p>}
      <h2 className={cn('text-[30px] leading-[1.05] sm:text-[clamp(38px,5.2vw,60px)] sm:leading-[1]', dark && 'text-white')}>
        {title}
        <br />
        <span className="italic">{italic}</span>
      </h2>
      {text && <p className={cn('max-w-[520px] text-[17px] leading-relaxed', dark ? 'text-[#E3E8DA]' : 'text-body')}>{text}</p>}
    </div>
  )
}

/* ---------- Cara kerja: akordeon tiga langkah yang berganti otomatis ---------- */

const SAMPLE_TOTAL = 120_000_000

function StepVisual({ step }: { step: number }) {
  if (step === 0)
    return (
      <div className="flex w-full max-w-[400px] flex-col gap-3 rounded-[24px] bg-card p-6 text-ink shadow-[var(--shadow-lift)]">
        <span className="eyebrow">Rencana kalian</span>
        {[
          ['Hari-H', 'Sabtu, 20 Maret 2027'],
          ['Perkiraan tamu', '300 orang'],
          ['Total budget', rupiah(SAMPLE_TOTAL)],
        ].map(([l, v]) => (
          <div key={l} className="flex flex-col gap-1 rounded-[14px] border border-input px-4 py-2.5">
            <span className="text-xs text-muted-foreground">{l}</span>
            <span className="text-[15px] font-semibold tabular-nums">{v}</span>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          {EVENT_KINDS.slice(0, 3).map((e) => (
            <span key={e.kind} className="chip bg-primary-soft text-on-primary-soft">
              <Check className="size-3.5" strokeWidth={2.4} aria-hidden /> {e.label}
            </span>
          ))}
        </div>
      </div>
    )
  if (step === 1) {
    const events = EVENT_KINDS.slice(0, 3)
    const weight = events.reduce((s, e) => s + e.weight, 0)
    const resepsi = ALLOCATION_DEFAULTS.filter((c) => c.pct.resepsi >= 10).slice(0, 3)
    return (
      <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-[24px] bg-card p-6 text-ink shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Alokasi per acara</span>
          <span className="badge-warning min-h-6 px-2 text-[11px]">Estimasi</span>
        </div>
        {events.map((e, i) => {
          const pct = Math.round((e.weight / weight) * 100)
          return (
            <div key={e.kind} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{e.label}</span>
                <span className="tabular-nums text-muted-foreground">{rupiah(Math.round((SAMPLE_TOTAL * e.weight) / weight / 1e6) * 1e6)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: ['#A9B59A', '#6F7F5F', '#34432F'][i] }} />
              </div>
            </div>
          )
        })}
        <div className="flex flex-wrap gap-2 border-t border-divider pt-4">
          <span className="w-full text-xs text-muted-foreground">Di dalam resepsi</span>
          {resepsi.map((c) => (
            <span key={c.key} className="badge-neutral min-h-7 text-xs">
              {c.name} {c.pct.resepsi}%
            </span>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-[24px] bg-card p-6 text-ink shadow-[var(--shadow-lift)]">
      <span className="eyebrow">Undangan Raka & Nadia</span>
      <div className="flex items-center gap-3 rounded-[16px] bg-muted px-4 py-3">
        <Link2 className="size-5 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
        <span className="flex min-w-0 flex-col">
          <span className="text-xs text-muted-foreground">Tautan untuk Bu Sari</span>
          <span className="truncate text-sm font-semibold">/u/raka-nadia?to=Bu+Sari</span>
        </span>
      </div>
      <span className="btn-primary btn-sm self-start">
        <Send className="size-4" strokeWidth={1.8} aria-hidden /> Kirim lewat WhatsApp
      </span>
      <div className="grid grid-cols-3 gap-2 border-t border-divider pt-4 text-center">
        {[['218', 'Hadir'], ['84', 'Menunggu'], ['18', 'Berhalangan']].map(([n, l]) => (
          <span key={l} className="flex flex-col">
            <span className="font-serif text-[30px] leading-none">{n}</span>
            <span className="mt-1 text-xs text-muted-foreground">{l}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

const STEPS = [
  { title: 'Mulai dari gambaran wedding impian kalian', text: 'Mau intimate wedding atau undang banyak orang? Tentukan tanggal, jumlah tamu, dan budget yang kalian siapkan. Dari sini, kita mulai susun semuanya.' },
  { title: 'Bagi budget, tentukan prioritas', text: 'Bagi budget untuk lamaran, akad, dan resepsi. Checklist persiapan juga langsung menyesuaikan tanggal pernikahan kalian, jadi tahu apa yang harus dikerjakan lebih dulu.' },
  { title: 'Saatnya kabari orang-orang tersayang', text: 'Pilih undangan yang paling kalian suka, kirim ke keluarga dan teman lewat WhatsApp, lalu pantau siapa saja yang akan hadir.' },
]
const STEP_MS = 7000

export function HowItWorks({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const [ref, inView] = useInView<HTMLDivElement>()
  const bar = useRef<HTMLDivElement>(null)
  const elapsed = useRef(0)
  const id = useId()
  const motion = !reducedMotion()

  // Berganti langkah tiap STEP_MS selama bagian ini terlihat. Dijeda hanya saat kursor mouse di atas daftar;
  // klik langkah tidak menghentikan putaran, hanya mengulang hitungannya dari langkah itu.
  useEffect(() => {
    if (!motion || !inView || hover) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      elapsed.current += Math.min(now - last, 100) // tab yang tertidur tidak melompatkan langkah
      last = now
      if (elapsed.current >= STEP_MS) {
        elapsed.current = 0
        setActive((a) => (a + 1) % STEPS.length)
      }
      if (bar.current) bar.current.style.transform = `scaleX(${elapsed.current / STEP_MS})`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [motion, inView, hover])

  const pick = (i: number) => {
    elapsed.current = 0
    setActive(i)
  }

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
      <div
        ref={ref}
        data-reveal
        className="flex flex-col"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
        onPointerLeave={() => setHover(false)}
      >
        {STEPS.map((s, i) => {
          const open = active === i
          return (
            <div key={s.title} className="border-b border-border">
              <h3 className="font-sans">
                <button
                  id={`${id}-b${i}`}
                  aria-expanded={open}
                  aria-controls={`${id}-p${i}`}
                  onClick={() => pick(i)}
                  className={cn('flex min-h-16 w-full items-center gap-4 py-4 text-left text-[18px] transition-colors duration-200', open ? 'font-semibold text-ink' : 'text-muted-foreground hover:text-ink')}
                >
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-full border text-[13px] font-semibold tabular-nums', open ? 'border-primary bg-primary text-white' : 'border-line')}>{i + 1}</span>
                  <span>{s.title.replace(/ (\S+)$/, ' $1')}</span>
                </button>
              </h3>
              <div
                id={`${id}-p${i}`}
                role="region"
                aria-labelledby={`${id}-b${i}`}
                className={cn('grid transition-[grid-template-rows] duration-500 ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[440px] pb-5 pl-12 text-[15px] leading-relaxed text-body">{s.text}</p>
                </div>
              </div>
              <div className="h-0.5 overflow-hidden">
                {open && motion && <div ref={bar} className="h-full origin-left bg-primary" style={{ transform: `scaleX(${elapsed.current / STEP_MS})` }} />}
              </div>
            </div>
          )
        })}
        <a href={ctaHref} className="btn-primary mt-8 self-start">
          {ctaLabel}
        </a>
      </div>
      <div data-reveal style={{ ['--reveal-delay' as string]: '120ms' }} className="relative grid min-h-[440px] place-items-center overflow-hidden rounded-[28px] bg-muted p-6 sm:p-10">
        <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-primary-soft" />
        <div aria-hidden className="absolute -bottom-20 -left-10 size-56 rounded-full bg-accent-soft/70" />
        <div key={active} className="animate-fade-up relative grid w-full place-items-center">
          <StepVisual step={active} />
        </div>
      </div>
    </div>
  )
}

/* ---------- Koleksi undangan: halaman template asli, diperkecil ---------- */

const FRAME_W = 390
const FRAME_H = 780

/** Menampilkan rute undangan di iframe selebar ponsel lalu diskalakan ke lebar kartu. */
function ScaledFrame({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / FRAME_W))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className="relative aspect-[1/2] overflow-hidden rounded-[22px] bg-muted shadow-[var(--shadow-lift)] ring-1 ring-border">
      {scale > 0 && (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
          style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${scale})` }}
        />
      )}
    </div>
  )
}

const DESIGNS = [
  { name: 'Sage', mood: 'Amplop hijau, bunga melati', to: '/undangan/sage' },
  { name: 'Noir', mood: 'Hitam arang, mewah minimalis', to: '/undangan/noir' },
  { name: 'Red Retro', mood: 'Kliping koran, scrapbook', to: '/undangan/red-retro' },
]

export function InvitationCarousel() {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const onScroll = () => {
    const el = track.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    if (!card) return
    setIndex(Math.min(DESIGNS.length - 1, Math.round(el.scrollLeft / (card.offsetWidth + 16))))
  }
  const go = (d: number) => {
    const el = track.current
    const card = el?.children[Math.max(0, Math.min(DESIGNS.length - 1, index + d))] as HTMLElement | undefined
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: reducedMotion() ? 'auto' : 'smooth' })
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        ref={track}
        onScroll={onScroll}
        className="-mx-[clamp(20px,4vw,56px)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[clamp(20px,4vw,56px)] pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:gap-10 [&::-webkit-scrollbar]:hidden"
      >
        {DESIGNS.map((d, i) => (
          <figure key={d.name} data-reveal style={{ ['--reveal-delay' as string]: `${i * 110}ms` }} className="flex w-[72%] shrink-0 snap-center flex-col gap-4 sm:w-[46%] md:w-auto">
            <ScaledFrame src={d.to} title={`Pratinjau undangan ${d.name}`} />
            <figcaption className="flex items-end justify-between gap-3 px-1">
              <span className="flex flex-col">
                <span className="font-serif text-[26px] leading-none">{d.name}</span>
                <span className="mt-1.5 text-[13px] text-muted-foreground">{d.mood}</span>
              </span>
              <Link to={d.to} target="_blank" className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary hover:text-primary-hover">
                Lihat demo <ArrowUpRight className="size-4" strokeWidth={1.8} aria-hidden />
              </Link>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="flex items-center justify-between md:hidden">
        <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {index + 1} / {DESIGNS.length}
        </span>
        <div className="flex gap-2">
          <button onClick={() => go(-1)} disabled={index === 0} aria-label="Desain sebelumnya" className="grid size-11 place-items-center rounded-full border border-line bg-card disabled:opacity-40">
            <ChevronLeft className="size-5" strokeWidth={1.8} />
          </button>
          <button onClick={() => go(1)} disabled={index === DESIGNS.length - 1} aria-label="Desain berikutnya" className="grid size-11 place-items-center rounded-full border border-line bg-card disabled:opacity-40">
            <ChevronRight className="size-5" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- FAQ ---------- */

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)
  const id = useId()
  return (
    <div data-reveal className="flex flex-col border-t border-border">
      {items.map((f, i) => {
        const isOpen = open === i
        return (
          <div key={f.q} className="border-b border-border">
            <h3 className="font-sans">
              <button
                id={`${id}-b${i}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-p${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-16 w-full items-center justify-between gap-6 py-4 text-left text-[17px] font-semibold text-ink"
              >
                {f.q}
                <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform duration-300', isOpen && 'rotate-180')} strokeWidth={1.8} aria-hidden />
              </button>
            </h3>
            <div id={`${id}-p${i}`} role="region" aria-labelledby={`${id}-b${i}`} className={cn('grid transition-[grid-template-rows] duration-400 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
              <div className="overflow-hidden">
                <p className="max-w-[620px] pb-6 text-[15px] leading-relaxed text-body">{f.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
