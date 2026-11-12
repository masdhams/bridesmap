import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarCheck,
  Award,
  Check,
  Clock,
  Crown,
  Flame,
  Gift,
  HeartHandshake,
  Lock,
  Mail,
  MessageCircleHeart,
  Minus,
  NotebookPen,
  Paperclip,
  PiggyBank,
  Plus,
  ReceiptText,
  ShieldCheck,
  MonitorSmartphone,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { addDays, format } from 'date-fns'
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { INVITATION_DESIGNS, SectionHead, useReveal } from '../components/landing'
import { Envelope } from '../components/letter'
import { HIDDEN_COSTS, OFFER, TASK_TEMPLATES } from '../data/content'
import { cn, fmtDate, rupiah } from '../lib/utils'

// Halaman jualan untuk trafik iklan & tautan bio. Anatomi dan keputusan copy: framework-sales-page.md
// Hook → Masalah → Solusi → Demo → Momen → Benefit → Offer → Proof → CTA. Semua tombol menggulir ke form checkout (#harga).

const CHECKOUT_ID = 'harga'
const LAUNCH = OFFER.phases.find((p) => p.status === 'active') ?? OFFER.phases[OFFER.phases.length - 1]
/** Keputusan user (2 Nov 2026): slot tampil statis 7/24 dan hitung mundur berulang tiap tengah malam. */
const SLOTS = { left: 7, total: 24 }
const SLOTS_TAKEN = SLOTS.total - SLOTS.left
/** Keputusan user (2 Nov 2026): harga setelah slot promo habis. */
const NEXT_PRICE = 199_000
/** Nilai undangan di platform lain: Wevitation Premium normal Rp100rb s.d. Pinvite normal Rp350rb (riset 22 Okt 2026). */
/** Keputusan user (2 Nov 2026): nilai coret undangan Rp247rb, masih di rentang harga pasar Rp100rb s.d. Rp350rb. */
const INVITE_VALUE = 247_000
/** Honeymoon planner Google Sheets (Templately) $9,95 ≈ Rp160rb; dibulatkan ke bawah (cek 2 Nov 2026). */
const HONEYMOON_VALUE = 150_000
const VENDOR_KIT_VALUE = 149_000
const SAVING_BOOK_VALUE = 129_000

const delay = (ms: number) => ({ ['--reveal-delay' as string]: `${ms}ms` })
const inDays = (n: number, pattern = 'd MMM') => fmtDate(format(addDays(new Date(), n), 'yyyy-MM-dd'), pattern)
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function scrollToCheckout(e: MouseEvent) {
  e.preventDefault()
  document.getElementById(CHECKOUT_ID)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

function Cta({ children, tone = 'dark', className }: { children: ReactNode; tone?: 'dark' | 'light'; className?: string }) {
  return (
    <a
      href={`#${CHECKOUT_ID}`}
      onClick={scrollToCheckout}
      className={cn(
        'sp-shine btn h-auto min-h-[56px] max-w-full whitespace-normal px-7 py-3 text-center text-base shadow-[var(--shadow-lift)] transition-transform duration-200 active:scale-[0.98]',
        tone === 'dark' ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-white text-ink hover:bg-primary-soft',
        className,
      )}
    >
      {children} <ArrowRight className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
    </a>
  )
}

/** `true` selama elemen terlihat di layar. */
function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setInView(true)
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

/** Angka yang naik pelan ke nilai baru (langsung tanpa animasi kalau reduced motion). */
function useCountUp(value: number, ms = 700) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (reducedMotion()) return setShown(value)
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(a + (value - a) * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      from.current = value
    }
  }, [value, ms])
  return shown
}

/** Sisa waktu sampai tengah malam, berulang tiap hari. */
function useMidnightCountdown() {
  const calc = () => {
    const now = new Date()
    const end = new Date(now)
    end.setHours(24, 0, 0, 0)
    const s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0'))
  }
  const [t, setT] = useState(calc)
  useEffect(() => {
    const id = window.setInterval(() => setT(calc()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return t
}

/* ================= 1. HOOK ================= */

function FloatCard({ className, floatDelay, revealDelay, tone = 'light', children }: { className: string; floatDelay: string; revealDelay: number; tone?: 'light' | 'dark'; children: ReactNode }) {
  return (
    <div aria-hidden className={cn('hero-in absolute z-10', className)} style={delay(revealDelay)}>
      <div
        className={cn(
          'sp-float rounded-[16px] p-3 shadow-[var(--shadow-lift)] sm:rounded-[18px] sm:p-3.5',
          tone === 'dark' ? 'bg-primary text-white ring-1 ring-white/10' : 'bg-card text-ink ring-1 ring-border/60',
        )}
        style={{ ['--float-delay' as string]: floatDelay }}
      >
        {children}
      </div>
    </div>
  )
}

/** Mockup paket (laptop, 2 HP, undangan & layar aplikasi) dari user, 4 Nov 2026: PNG transparan, rasio 16:9. */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[640px] pt-[66px] sm:pb-12 sm:pt-16 lg:max-w-none">
      {/* Gradasi samar hijau muda → mawar muda; diburamkan supaya tidak terlihat seperti kotak */}
      <div aria-hidden className="absolute inset-x-0 bottom-[8%] top-[12%] rounded-full bg-[radial-gradient(circle_at_28%_38%,#D3DEC2_0%,transparent_60%),radial-gradient(circle_at_76%_68%,#EFCCBE_0%,transparent_56%)] blur-3xl" />
      <img
        src="/lp/hero-bundle.webp"
        alt="Bridesmap di laptop dan HP: beranda, budget, checklist, vendor & pembayaran, plus undangan digital"
        width={1670}
        height={941}
        fetchPriority="high"
        decoding="async"
        className="hero-in relative w-full drop-shadow-[0_24px_40px_rgb(34_38_31/0.12)]"
        style={delay(250)}
      />
      {/* Kartu utama: posisi paling atas supaya terbaca lebih dulu */}
      <FloatCard tone="dark" className="left-0 top-0 sm:left-[2%] sm:top-2" floatDelay="-1s" revealDelay={500}>
        <span className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,#F5E6DF,#E2A592)] text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.6)]">
            <Award className="size-[18px]" strokeWidth={2.2} />
          </span>
          <span className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9D4BA]">Semua dalam 1 aplikasi</span>
            <span className="font-serif text-[19px] italic leading-tight sm:text-[22px]">Wedding Planner Terlengkap</span>
          </span>
        </span>
      </FloatCard>
      {/* 3 manfaat (copy user, 5 Nov 2026). Desktop: melayang di kanan atas, bawah tengah, kanan bawah */}
      {HERO_BENEFITS.map((b, i) => (
        <FloatCard key={b.label} className={cn('hidden sm:block sm:w-[200px]', b.place)} floatDelay={`${-2 * (i + 1)}s`} revealDelay={650 + i * 200}>
          <span className="flex items-center gap-3">
            <BenefitGlyph kind={b.glyph} className="size-11" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className={cn('text-[11px] font-semibold leading-tight', b.text)}>{b.label}</span>
              <span className="text-[15px] font-semibold leading-snug">{b.title}</span>
            </span>
          </span>
        </FloatCard>
      ))}
      {/* HP: satu baris grid di bawah gambar, isi rata atas dan tinggi ikut grid, jadi tidak ada ruang kosong */}
      <ul className="relative z-10 -mt-8 grid grid-cols-3 gap-2 sm:hidden">
        {HERO_BENEFITS.map((b, i) => (
          <li key={b.label} className="hero-in" style={delay(650 + i * 200)}>
            <div className="sp-float flex h-full flex-col gap-2 rounded-[16px] bg-card px-2.5 pb-3 pt-2.5 text-ink shadow-[var(--shadow-lift)] ring-1 ring-border/60" style={{ ['--float-delay' as string]: `${-1.5 * (i + 1)}s` }}>
              <BenefitGlyph kind={b.glyph} className="size-10" />
              <span className={cn('text-[10.5px] font-semibold leading-tight', b.text)}>{b.label}</span>
              <span className="text-[13px] font-semibold leading-[1.25]">{b.title}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const HERO_BENEFITS = [
  { glyph: 'compass', label: 'Budget Terkendali', title: 'Uang Terarah', text: 'text-primary', place: 'sm:right-0 sm:top-2 lg:top-6' },
  { glyph: 'calm', label: 'Persiapan Tenang', title: 'Minim Overthinking', text: 'text-warning', place: 'sm:bottom-0 sm:left-[28%]' },
  { glyph: 'rings', label: 'Cinta Terjaga', title: 'Cegah Pertengkaran', text: 'text-accent', place: 'sm:bottom-0 sm:right-[3%]' },
] as const

/**
 * Ikon gambar sendiri (bukan set ikon umum): koin-kompas = uang terarah, bulan sabit + bintang = tenang/tidur nyenyak,
 * dua cincin kawin = cinta terjaga. Ubin bergradien dengan kilau atas supaya berdimensi.
 */
const GLYPH_TONES = {
  compass: { tile: ['#EEF3E6', '#D5DFC7'], a: '#5E7550', b: '#2F3E2A' },
  calm: { tile: ['#FCF3E2', '#F2DDB4'], a: '#E7B566', b: '#A8701E' },
  rings: { tile: ['#FCEEE8', '#F2D0C2'], a: '#E8AE98', b: '#9A4E3B' },
}
function BenefitGlyph({ kind, className }: { kind: keyof typeof GLYPH_TONES; className?: string }) {
  const id = useId().replace(/:/g, '')
  const t = GLYPH_TONES[kind]
  return (
    <svg viewBox="0 0 44 44" className={cn('shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id={`t${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={t.tile[0]} />
          <stop offset="1" stopColor={t.tile[1]} />
        </linearGradient>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.a} />
          <stop offset="1" stopColor={t.b} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="42" height="42" rx="13" fill={`url(#t${id})`} />
      <rect x="1.75" y="1.75" width="40.5" height="40.5" rx="12.25" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" />
      <path d="M8 6h28a6 6 0 0 1 6 6v3c-8-4-26-4-40 0v-3a6 6 0 0 1 6-6z" fill="#fff" opacity="0.35" />
      {kind === 'compass' && (
        <g>
          <circle cx="22" cy="23" r="11.5" fill={`url(#f${id})`} />
          <circle cx="22" cy="23" r="8.6" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="1.2 2.4" />
          <g className="sp-swing" style={{ transformOrigin: '22px 23px' }}>
            <path d="M22 14.2l2.9 8.8h-5.8z" fill="#F4C7B5" />
            <path d="M19.1 23h5.8L22 31.8z" fill="#fff" opacity="0.92" />
          </g>
          <circle cx="22" cy="23" r="1.6" fill={t.b} stroke="#fff" strokeWidth="1" />
          <path d="M14.5 15.5a10 10 0 0 1 5-3.2" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>
      )}
      {kind === 'calm' && (
        <g>
          {/* Kepala menghadap kanan, mata terpejam & senyum tipis; jari memijat pelipis, gelombang = pikiran mereda */}
          <path d="M16.5 36v-4.2c-3.4-2.1-5.2-5.7-5.2-9.6 0-6.6 5-11.2 11.2-11.2 5.8 0 10.2 4 10.2 9.6 0 1.1.1 1.8.9 3l1.5 2.5c.4.7 0 1.3-.8 1.3h-1.6v3.1c0 1.6-1.3 2.9-2.9 2.9h-3V36z" fill={`url(#f${id})`} />
          <path d="M14.2 16.5a9.5 9.5 0 0 1 4.6-4.4" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M26 21.3q1.5 1.3 3 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M28.6 27.2q1.1.6 2.2-.1" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          {/* Dua ujung jari di pelipis + lingkaran gerak pijat */}
          <circle cx="22.4" cy="17.2" r="4.4" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 1.6" />
          <g className="sp-press" style={{ transformOrigin: '22.4px 17.2px' }}>
            <ellipse cx="21.2" cy="16.4" rx="1.9" ry="1.5" fill="#FFF7EC" stroke={t.b} strokeWidth="0.9" />
            <ellipse cx="23.7" cy="18.1" rx="1.9" ry="1.5" fill="#FFF7EC" stroke={t.b} strokeWidth="0.9" />
          </g>
          <g className="sp-calm" fill="none" stroke={t.b} strokeLinecap="round" strokeWidth="1.3">
            <path d="M8.6 14.2q-1.4 2.6 0 5.2" />
            <path d="M6 12.4q-2.3 4.4 0 8.8" opacity="0.55" />
          </g>
        </g>
      )}
      {kind === 'rings' && (
        <g fill="none" strokeLinecap="round">
          <circle cx="17.5" cy="25" r="7.6" stroke={`url(#f${id})`} strokeWidth="3.2" />
          <circle cx="26.5" cy="25" r="7.6" stroke={t.b} strokeWidth="3.2" />
          <path d="M22.3 31.2a7.6 7.6 0 0 0 2-12" stroke={`url(#f${id})`} strokeWidth="3.2" />
          <path className="sp-twinkle" style={{ transformOrigin: '26.5px 14px' }} d="M26.5 11.2l2.6 2.7-2.6 3-2.6-3z" fill="#fff" stroke={t.b} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M14 21.5a5 5 0 0 1 3-2" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" />
        </g>
      )}
    </svg>
  )
}

const STEPS = ['Isi tanggal & budget', 'Bridesmap susun rencananya', 'Tinggal ikuti sampai hari-H']

const BADGES = [
  { icon: ShieldCheck, label: 'Garansi 7 hari uang kembali' },
  { icon: Wallet, label: 'Sekali bayar' },
  { icon: Mail, label: 'Undangan digital termasuk' },
  { icon: MonitorSmartphone, label: 'Bisa di HP & laptop' },
]

/* ================= 2. MASALAH ================= */

const PROBLEMS: { icon: typeof Wallet; title: string; from: string; text: string; impact: string; mine?: boolean }[] = [
  {
    icon: BellRing,
    title: 'Jadwal bayar vendor nggak tercatat',
    from: 'Vendor katering',
    text: 'Kak, termin 2 jatuh tempo besok ya.',
    impact: 'Harus cari dana dadakan, karena nggak ada yang ingat kapan termin 1 dibayar dan berapa sisanya.',
  },
  {
    icon: ReceiptText,
    title: 'Hidden cost nggak masuk budget',
    from: 'Mama',
    text: 'Seragam keluarga udah masuk budget belum?',
    impact: 'Ternyata buat 20 orang, padahal belum ada di hitungan awal.',
  },
  {
    icon: Paperclip,
    title: 'Bukti bayar tercecer',
    from: 'Kalian, jam 11 malam',
    text: 'Bukti transfer DP fotografer di mana ya?',
    impact: 'Nyelip di antara ribuan foto di galeri. Repot kalau vendor minta konfirmasi.',
    mine: true,
  },
  {
    icon: Wallet,
    title: 'Tabungan kepakai sebelum hari-H',
    from: 'Mutasi rekening, H-14',
    text: 'Tarik dana tabungan',
    impact: 'Buat nutup biaya yang dari awal nggak pernah dihitung.',
    mine: true,
  },
]

const SHOWN_COSTS = 5
const BUDGETS = [50_000_000, 100_000_000, 150_000_000, 250_000_000]
const GUESTS = [100, 300, 500]

function HiddenCostCalculator() {
  const [budget, setBudget] = useState(BUDGETS[1])
  const [guests, setGuests] = useState(GUESTS[1])
  const rows = useMemo(
    () => HIDDEN_COSTS.map((c) => ({ key: c.key, name: c.name, missed: c.missed, value: Math.round(c.estimate({ budget, guests }) / 50_000) * 50_000 })).sort((a, b) => b.value - a.value),
    [budget, guests],
  )
  const total = rows.reduce((s, r) => s + r.value, 0)
  const shown = useCountUp(total)
  const pct = Math.round((total / budget) * 100)

  const pick = (label: string, values: number[], value: number, set: (n: number) => void, fmt: (n: number) => string) => (
    <fieldset>
      <legend className="mb-2.5 text-sm font-semibold text-[#E3E8DA]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => set(v)}
            className={cn('min-h-11 rounded-full px-4 text-sm font-semibold tabular-nums transition-colors duration-200', value === v ? 'bg-white text-ink' : 'border border-white/25 text-white hover:bg-white/10')}
          >
            {fmt(v)}
          </button>
        ))}
      </div>
    </fieldset>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
      <div className="flex flex-col gap-6">
        {pick('Total budget kalian', BUDGETS, budget, setBudget, (n) => `${n / 1_000_000} juta`)}
        {pick('Perkiraan tamu', GUESTS, guests, setGuests, (n) => `${n} orang`)}
        <div className="mt-auto flex flex-col gap-1 rounded-[20px] bg-white p-5 text-ink" aria-live="polite">
          <span className="text-[13px] text-muted-foreground">Perkiraan biaya yang sering lupa dianggarkan</span>
          <span className="text-[34px] font-semibold leading-tight tracking-tight tabular-nums sm:text-[40px]">{rupiah(shown)}</span>
          <span className="text-[13px] leading-relaxed text-body">
            Itu sekitar <strong className="text-ink">{pct}% dari budget {rupiah(budget)}</strong>. Tenang, ini bukan uang tambahan. Cukup disisihkan dari budget yang sama sejak awal, jadi menjelang hari-H nggak ada kejutan.
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <ul className="flex flex-col divide-y divide-white/10">
          {rows.slice(0, SHOWN_COSTS).map((r) => (
            <li key={r.key} className="flex items-center justify-between gap-4 py-3 text-[15px]">
              <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span>{r.name}</span>
                {r.missed && <span className="chip min-h-6 bg-[#E7D8B8] px-2 text-[11px] text-[#5C3E0E]">Sering terlewat</span>}
              </span>
              <span className="shrink-0 tabular-nums text-[#E3E8DA]">{rupiah(r.value)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-relaxed text-[#C9D0BC]">
          Rincian {SHOWN_COSTS} pos terbesar, plus {rows.length - SHOWN_COSTS} pos lain. Angka ini perkiraan kalau semua {rows.length} pos berlaku. Di aplikasi, kalian tinggal centang yang memang dipakai, dan nominalnya bisa diubah.
        </p>
      </div>
    </div>
  )
}

/* ================= 3. SOLUSI ================= */

/**
 * Data riset yang sudah dicek ke sumber aslinya (2 Nov 2026). Negara sumber wajib tetap disebut.
 * - wealthprofessional.ca/news/industry-news/canadian-couples-overspend-wedding-budgets-by-nearly-70/393335
 * - self.inc/info/average-wedding-costs
 * - scholarsarchive.byu.edu/facpub/4526
 */
const FACTS: { value: string; text: ReactNode; source: string }[] = [
  {
    value: '+67%',
    text: (
      <>
        Budget pernikahan bisa jauh lebih besar dari rencana awal. Pasangan yang awalnya menyiapkan sekitar <strong className="font-semibold">C$15.000</strong>, ternyata umumnya menghabiskan sekitar{' '}
        <strong className="font-semibold">C$25.000</strong>.
      </>
    ),
    source: 'Survei Wealthsimple terhadap 1.236 klien di Kanada, 2026.',
  },
  {
    value: '50,7%',
    text: 'Separuh lebih responden mengeluarkan biaya foto dan video melebihi budget. Bahkan, 38,3% responden menyesal telah mengeluarkan terlalu banyak uang untuk bagian ini.',
    source: 'Survei Self Financial terhadap 1.122 orang dewasa di Amerika Serikat, 2026.',
  },
  {
    value: 'PREDIKTOR TERKUAT',
    text: 'Perselisihan soal uang merupakan prediktor terkuat perceraian dibandingkan jenis perselisihan rumah tangga lainnya dalam penelitian ini.',
    source: 'Dew, Britt & Huston, jurnal Family Relations, 2012 (4.574 pasangan).',
  },
]

const PILLARS = [
  { icon: Wallet, title: 'Catat', text: `Semua biaya masuk ke budget per acara, termasuk ${HIDDEN_COSTS.length} pos hidden cost yang sering kelewat.` },
  { icon: BellRing, title: 'Ingatkan', text: 'Jadwal DP, termin, dan pelunasan bisa dimasukkan ke Google Calendar, lengkap dengan pengingat H-7.' },
  { icon: Check, title: 'Rapikan', text: 'Tamu, undangan digital, checklist, sampai berkas KUA ada di satu tempat.' },
]

/* ================= 4. DEMO (data fiktif) ================= */

const card = 'flex w-full max-w-[400px] flex-col gap-4 rounded-[24px] bg-card p-6 text-ink shadow-[var(--shadow-lift)]'

function BudgetVisual() {
  return (
    <div className={card}>
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Budget per acara</span>
        <span className="text-xs text-muted-foreground">Total {rupiah(120_000_000)}</span>
      </div>
      {[
        ['Lamaran', 11_000_000, 9_200_000],
        ['Akad', 24_000_000, 15_500_000],
        ['Resepsi', 85_000_000, 53_800_000],
      ].map(([l, plan, used]) => (
        <div key={l as string} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">{l}</span>
            <span className="tabular-nums text-muted-foreground">sisa {rupiah((plan as number) - (used as number))}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${((used as number) / (plan as number)) * 100}%` }} />
          </div>
        </div>
      ))}
      <span className="badge-warning min-h-6 self-start px-2 text-[11px]">Alokasi bisa diubah dalam persen atau rupiah</span>
    </div>
  )
}

function HiddenVisual() {
  return (
    <div className={card}>
      <span className="eyebrow">Hidden cost</span>
      {HIDDEN_COSTS.filter((c) => c.missed).map((c, i) => (
        <div key={c.key} className="flex items-center gap-3 text-sm">
          <span className={cn('grid size-6 shrink-0 place-items-center rounded-[7px] border-[1.5px]', i < 3 ? 'border-primary bg-primary text-white' : 'border-[#A9A08C]')}>
            {i < 3 && <Check className="size-3.5" strokeWidth={2.6} />}
          </span>
          <span className="flex-1">{c.name}</span>
        </div>
      ))}
      <span className="text-xs text-muted-foreground">Yang dicentang langsung masuk ke budget sebagai pos terpisah.</span>
    </div>
  )
}

function VendorVisual() {
  return (
    <div className={card}>
      <div className="flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-muted font-serif text-[22px]">SR</span>
        <span className="flex min-w-0 flex-col">
          <span className="font-semibold">Katering Sari Rasa</span>
          <span className="text-[13px] text-muted-foreground">Disepakati {rupiah(45_000_000)} · 300 porsi</span>
        </span>
      </div>
      <ol className="flex flex-col">
        {[
          ['DP 30%', rupiah(13_500_000), `Dibayar ${inDays(-60)}`, 'done'],
          ['Termin 2', rupiah(13_500_000), `Jatuh tempo ${inDays(5)}`, 'due'],
          ['Pelunasan', rupiah(18_000_000), `Jatuh tempo ${inDays(110)}`, 'later'],
        ].map(([t, a, s, st], i, arr) => (
          <li key={t} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border-[1.5px]', st === 'done' ? 'border-primary bg-primary text-white' : st === 'due' ? 'border-warning-solid bg-warning-soft' : 'border-[#A9A08C] bg-card')}>
                {st === 'done' && <Check className="size-3.5" strokeWidth={2.6} />}
              </span>
              {i < arr.length - 1 && <span className="w-px flex-1 bg-border" />}
            </span>
            <span className="flex flex-1 items-start justify-between gap-3 pb-4">
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{t}</span>
                <span className="text-xs text-muted-foreground">{s}</span>
              </span>
              <span className="text-sm tabular-nums">{a}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-2 rounded-[14px] bg-muted px-3 py-2.5 text-[13px]">
        <Paperclip className="size-4 text-primary" strokeWidth={1.8} /> bukti-transfer-dp-katering.jpg
      </div>
    </div>
  )
}

function ChecklistVisual() {
  return (
    <div className={card}>
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">Minggu ini</span>
        <span className="text-xs text-muted-foreground">24 / {TASK_TEMPLATES.length} beres</span>
      </div>
      {[
        ['Daftar nikah ke KUA', inDays(12)],
        ['Fitting kebaya & beskap', inDays(8)],
        ['Final jumlah porsi katering', inDays(20)],
        ['Kirim undangan digital', inDays(3)],
      ].map(([t, d]) => (
        <div key={t} className="flex items-center gap-3 border-b border-divider pb-3 last:border-0 last:pb-0">
          <span className="size-6 shrink-0 rounded-full border-[1.5px] border-[#A9A08C]" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">{t}</span>
            <span className="text-xs text-muted-foreground">{d}</span>
          </span>
          <span className="chip min-h-6 bg-primary-soft px-2 text-[11px] text-on-primary-soft">
            <CalendarCheck className="size-3" strokeWidth={2} /> Kalender
          </span>
        </div>
      ))}
    </div>
  )
}

function GuestVisual() {
  return (
    <div className={card}>
      <span className="eyebrow">320 tamu · 142 undangan terkirim</span>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[['218', 'Hadir', 'bg-primary-soft'], ['84', 'Menunggu', 'bg-warning-soft'], ['18', 'Berhalangan', 'bg-danger-soft']].map(([n, l, bg]) => (
          <span key={l} className={cn('flex flex-col rounded-[16px] py-3', bg)}>
            <span className="font-serif text-[32px] leading-none">{n}</span>
            <span className="mt-1 text-xs text-body">{l}</span>
          </span>
        ))}
      </div>
      {[
        ['Keluarga Bpk. Hartono', '4 orang · 1 vegetarian', 'badge-success', 'Hadir'],
        ['Sinta Maharani +1', 'Teman kuliah', 'badge-warning', 'Menunggu'],
      ].map(([n, s, b, l]) => (
        <div key={n} className="flex items-center justify-between gap-3 border-t border-divider pt-3">
          <span className="flex flex-col">
            <span className="text-sm font-semibold">{n}</span>
            <span className="text-xs text-muted-foreground">{s}</span>
          </span>
          <span className={cn(b, 'min-h-6 px-2 text-[11px]')}>{l}</span>
        </div>
      ))}
    </div>
  )
}

const DEMOS: { icon: typeof Wallet; tab: string; text: string; visual: ReactNode }[] = [
  { icon: Wallet, tab: 'Budget per acara', text: 'Masukkan total budget, Bridesmap membaginya ke lamaran, akad, dan resepsi. Sisa uang kalian selalu kelihatan.', visual: <BudgetVisual /> },
  { icon: ReceiptText, tab: 'Hidden cost', text: `${HIDDEN_COSTS.length} pos yang sering lupa dihitung, dari seragam keluarga sampai pajak venue. Tinggal centang.`, visual: <HiddenVisual /> },
  { icon: Store, tab: 'Bayar vendor', text: 'Harga yang disepakati, jadwal DP sampai pelunasan, dan foto bukti transfer tersimpan per vendor.', visual: <VendorVisual /> },
  { icon: CalendarCheck, tab: 'Checklist & kalender', text: `${TASK_TEMPLATES.length} tugas tersusun mengikuti tanggal hari-H, dan tenggatnya masuk Google Calendar.`, visual: <ChecklistVisual /> },
  { icon: Users, tab: 'Tamu & undangan', text: 'Tiap tamu dapat link undangan dengan namanya, dan konfirmasi hadirnya langsung masuk ke daftar.', visual: <GuestVisual /> },
]
const DEMO_MS = 6000

function DemoTabs() {
  const [active, setActive] = useState(0)
  const [touched, setTouched] = useState(false)
  const [ref, inView] = useInView<HTMLDivElement>()
  const motion = !reducedMotion()

  // Berganti otomatis selama terlihat, berhenti setelah pengunjung memilih tab sendiri.
  useEffect(() => {
    if (!motion || !inView || touched) return
    const id = window.setInterval(() => setActive((a) => (a + 1) % DEMOS.length), DEMO_MS)
    return () => window.clearInterval(id)
  }, [motion, inView, touched])

  const d = DEMOS[active]
  return (
    <div ref={ref} className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
      <div role="tablist" aria-label="Menu aplikasi" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {DEMOS.map((t, i) => {
          const on = active === i
          return (
            <button
              key={t.tab}
              role="tab"
              aria-selected={on}
              onClick={() => {
                setTouched(true)
                setActive(i)
              }}
              className={cn(
                'relative flex shrink-0 items-center gap-3 overflow-hidden rounded-full px-4 py-3 text-left transition-colors duration-200 lg:rounded-[20px] lg:px-5 lg:py-4',
                on ? 'bg-primary text-white' : 'bg-card text-body ring-1 ring-border hover:text-ink',
              )}
            >
              <t.icon className="size-5 shrink-0" strokeWidth={1.8} aria-hidden />
              <span className="flex flex-col">
                <span className="whitespace-nowrap text-[15px] font-semibold">{t.tab}</span>
                {on && <span className="hidden max-w-[340px] pt-1 text-[14px] leading-relaxed text-[#E3E8DA] lg:block">{t.text}</span>}
              </span>
              {on && motion && inView && !touched && <span key={active} aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[sp-progress_6s_linear] bg-white/60" />}
            </button>
          )
        })}
      </div>
      <div className="relative grid min-h-[440px] place-items-center overflow-hidden rounded-[32px] bg-muted p-5 sm:p-10">
        <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-primary-soft" />
        <div aria-hidden className="absolute -bottom-20 -left-10 size-56 rounded-full bg-accent-soft/70" />
        <div key={active} className="animate-fade-up relative grid w-full place-items-center gap-5">
          <p className="max-w-[400px] text-center text-[15px] leading-relaxed text-body lg:hidden">{d.text}</p>
          {d.visual}
        </div>
      </div>
    </div>
  )
}

/* ================= 4b. MOMEN (data fiktif) ================= */

// cn() tidak menggabungkan kelas yang bentrok, jadi warna latar dipisah dari bentuk panggungnya.
const momenShape = 'relative grid h-[230px] place-items-center overflow-hidden rounded-[20px] ring-1 ring-[#EAD7CD] sm:h-[270px]'
const momenStage = `${momenShape} bg-[#FBF3EE]`

/** Tangkapan layar aplikasi (dari user, 4 Nov 2026) utuh di dalam panggung, tampil seperti jendela aplikasi. */
function ScreenVisual({ src, alt }: { src: string; alt: string }) {
  return (
    <div className={momenStage}>
      <div className="absolute inset-3 flex items-center justify-center sm:inset-4">
        <img src={src} alt={alt} width={1080} height={780} loading="lazy" decoding="async" className="h-auto max-h-full w-auto max-w-full rounded-[12px] shadow-[0_10px_28px_rgb(34_38_31/0.14)] ring-1 ring-black/5" />
      </div>
    </div>
  )
}

function TalkVisual() {
  return (
    <div className={cn(momenStage, 'px-6')}>
      <div className="flex w-full max-w-[300px] flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">Deep Talk hari ini · Keuangan</span>
        <p className="font-serif text-[22px] leading-[1.1] text-ink">
          Mulai dari nominal berapa kita perlu <span className="italic text-accent">ngobrol dulu sebelum beli sesuatu?</span>
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-primary px-2.5 py-1 text-white">Raka sudah jawab</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-accent ring-1 ring-[#EAD7CD]">Giliran Nadia</span>
        </div>
      </div>
    </div>
  )
}

function LetterVisual() {
  const [ref, inView] = useInView<HTMLDivElement>(0.6)
  return (
    <div ref={ref} className={cn(momenShape, 'content-center gap-2 bg-[#EED8CC]')}>
      <div className="w-[170px]">
        <Envelope open={inView && !reducedMotion()} headroom />
      </div>
      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-accent ring-1 ring-[#EAD7CD]">Dibuka malam sebelum akad</span>
    </div>
  )
}

const MOMENTS = [
  { title: 'Kisah Kita', text: 'Simpan cerita perjalanan kalian, dari awal kenal sampai lamaran, lengkap dengan fotonya.', visual: <ScreenVisual src="/lp/momen-kisah-kita.webp" alt="Tampilan menu Momen: foto berdua, Deep Talk, Surat untuk Nanti, dan perjalanan kalian" /> },
  { title: 'Deep Talk', text: 'Satu pertanyaan tiap hari buat dijawab berdua, termasuk soal uang yang sering canggung dibahas.', visual: <TalkVisual /> },
  { title: 'Surat untuk Nanti', text: 'Tulis surat sekarang, kunci sampai tanggal yang kalian pilih. Misalnya dibuka malam sebelum akad.', visual: <LetterVisual /> },
  { title: 'Vision Board', text: 'Kumpulkan warna, bunga, dan referensi dekorasi impian. Tinggal tunjukkan ke vendor.', visual: <ScreenVisual src="/lp/momen-vision-board.webp" alt="Tampilan Vision Board: palet warna, catatan referensi, dan foto inspirasi" /> },
]

/* ================= 5. BENEFIT ================= */

const COMPARE: [string, string, string][] = [
  ['Budget per acara', 'Rumus sendiri', 'Otomatis'],
  ['Hidden cost', 'Ketahuan belakangan', `${HIDDEN_COSTS.length} pos siap dicentang`],
  ['Pengingat DP & pelunasan', 'Andalkan ingatan', 'Pengingat di Google Calendar'],
  ['Bukti transfer', 'Nyelip di galeri', 'Nempel di tiap vendor'],
  ['Konfirmasi tamu', 'Rekap manual dari WA', 'Smart RSVP'],
  ['Undangan digital', 'Beli terpisah', 'Sudah termasuk'],
  ['Ruang ngobrol berdua', 'Nggak ada', 'Deep Talk & Surat untuk Nanti'],
]
// Copy dari user (4 Nov 2026).
const FIT_YES = [
  'Ingin mengatur pernikahan sendiri tanpa terus‑terusan bingung harus mulai dari mana.',
  'Nggak mau baru sadar ada pengeluaran yang terlewat saat budget sudah menipis.',
  'Ingin menikmati persiapan berdua, bukan saling menyalahkan karena ada yang terlupakan.',
]
const FIT_NO = [
  'Merasa semua bisa diingat tanpa perlu dicatat.',
  'Nggak masalah kalau budget meleset dari rencana.',
  'Menjadikan persiapan pernikahan sebagai sumber pertengkaran.',
]

/** Lencana bulat berkilap (gradien + pantulan + bayangan), sengaja tidak flat. */
const BADGE_TONES = {
  yes: { light: '#9DB386', mid: '#4F6644', dark: '#26331F', glow: 'rgb(52 67 47 / 0.35)' },
  no: { light: '#F4CDBF', mid: '#D38B74', dark: '#8E4433', glow: 'rgb(154 78 59 / 0.3)' },
}
function Badge3D({ tone, className }: { tone: keyof typeof BADGE_TONES; className?: string }) {
  const id = useId().replace(/:/g, '')
  const c = BADGE_TONES[tone]
  return (
    <svg viewBox="0 0 48 48" className={cn('shrink-0', className)} aria-hidden style={{ filter: `drop-shadow(0 6px 8px ${c.glow})` }}>
      <defs>
        <radialGradient id={`b${id}`} cx="35%" cy="28%" r="78%">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.55" stopColor={c.mid} />
          <stop offset="1" stopColor={c.dark} />
        </radialGradient>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill={`url(#b${id})`} />
      <circle cx="24" cy="24" r="20.25" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" />
      <ellipse cx="21" cy="13.5" rx="12" ry="6.5" fill={`url(#g${id})`} />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.2">
        {tone === 'yes' ? (
          <>
            <path d="M15.5 25.5l6 6 11.5-13" stroke={c.dark} strokeOpacity="0.45" transform="translate(0 1.6)" />
            <path d="M15.5 25.5l6 6 11.5-13" stroke="#fff" />
          </>
        ) : (
          <>
            <path d="M17.5 17.5l13 13M30.5 17.5l-13 13" stroke={c.dark} strokeOpacity="0.45" transform="translate(0 1.6)" />
            <path d="M17.5 17.5l13 13M30.5 17.5l-13 13" stroke="#fff" />
          </>
        )}
      </g>
    </svg>
  )
}

/* ================= 6. OFFER ================= */

// Semua menu aplikasi kecuali yang jadi bonus (undangan digital, honeymoon), digabung per kelompok yang berkaitan.
// Nominal per kelompok keputusan user (2 Nov 2026); jumlahnya (Rp749rb) menjadi harga normal yang dicoret.
// Harga coret ini khusus halaman ini; homepage masih memakai OFFER.normalPrice.
const MODULES: { icon: typeof Wallet; label: string; value: number }[] = [
  { icon: Wallet, label: `Budget per acara + ${HIDDEN_COSTS.length} pos hidden cost`, value: 149_000 },
  { icon: Store, label: 'Vendor, jadwal bayar & bukti transfer', value: 109_000 },
  { icon: PiggyBank, label: 'Tabungan nikah & target', value: 49_000 },
  { icon: CalendarCheck, label: 'Checklist H-12 bulan + Google Calendar', value: 99_000 },
  { icon: NotebookPen, label: 'Rundown, seserahan & berkas KUA', value: 99_000 },
  { icon: Users, label: 'Daftar tamu, Smart RSVP & seating plan', value: 145_000 },
  { icon: MessageCircleHeart, label: 'Kisah Kita, Deep Talk, Surat untuk Nanti & Vision Board', value: 99_000 },
]
const NORMAL_PRICE = MODULES.reduce((a, m) => a + m.value, 0)
/** Dibulatkan ke bawah supaya klaim hemat tidak berlebihan (Rp129rb dari Rp749rb = 82,8%). */
const SAVE_PCT = Math.floor((1 - LAUNCH.price / NORMAL_PRICE) * 100)

// Gambar sampul tiap desain, urutannya sama dengan INVITATION_DESIGNS. Taman Klasik memakai gambar sampul aslinya.
const INVITE_SHOTS = ['/lp/undangan-taman-klasik.webp', '/lp/undangan-sage.webp', '/lp/undangan-noir.webp', '/lp/undangan-red-retro.webp']

/** Bonus utama: undangan digital, tampil lebih lebar dengan pratinjau desain yang bisa digeser. */
function FeaturedBonus() {
  return (
    <div data-reveal className="flex flex-col gap-5 rounded-[24px] bg-[linear-gradient(160deg,rgb(226_165_146/0.24)_0%,rgb(255_255_255/0.05)_60%)] p-5 ring-1 ring-[#E2A592]/55 sm:p-6">
      <span className={cn('inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink', pillGradient)}>
        <Crown className="size-3.5" strokeWidth={2.2} aria-hidden /> Bonus Utama
      </span>
      <div className="flex flex-col gap-2.5">
        <h3 className="font-serif text-[32px] italic leading-[1.05] text-white sm:text-[38px]">Digital Invitation Timeless</h3>
        <p className="text-[15px] leading-relaxed text-[#E3E8DA]">
          Nggak perlu beli-beli lagi undangan digital di luaran sana yang harganya ratusan ribu! Kami sediakan berbagai desain yang timeless siap pakai dan link personal untuk tiap tamu.
        </p>
        <span className="text-[14px]">
          <s className="mr-1.5 tabular-nums text-[#C9D0BC]">{rupiah(INVITE_VALUE)}</s>
          <strong className="text-[#C9D4BA]">GRATIS</strong>
        </span>
      </div>
      <ul className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        {INVITATION_DESIGNS.map((d, i) => (
          <li key={d.to} className="flex w-[112px] shrink-0 snap-start flex-col gap-1.5 sm:w-[128px]">
            <div className="relative aspect-[1/2] overflow-hidden rounded-[22px] bg-muted shadow-[var(--shadow-lift)] ring-1 ring-white/15">
              <img src={INVITE_SHOTS[i]} alt={`Pratinjau desain undangan ${i + 1}`} width={460} height={907} loading="lazy" decoding="async" className="size-full object-cover object-top" />
            </div>
            <a href={d.to} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 self-center text-[13px] font-semibold text-[#F2B8A6] transition-colors hover:text-white">
              Preview <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Urutan & gambar dari user (3 Nov 2026). Nilai coret ditentukan dengan batas bawah Rp100rb atas permintaan user.
// Isi kedua e-book: bonus/CATATAN-BONUS.md; isi Plan Honeymoon: pages/app/Honeymoon.tsx.
const BONUSES: { title: string; format: string; text: string; value: number; img: string }[] = [
  {
    title: 'Plan Honeymoon',
    format: 'Di aplikasi',
    text: 'Destinasi, budget, booking, itinerary per hari, sampai daftar packing. Budget-nya langsung nyambung ke Budget utama.',
    value: HONEYMOON_VALUE,
    img: '/bonus/honeymoon-plan.webp',
  },
  {
    title: 'Vendor Negotiation Toolkit',
    format: 'E-book PDF',
    text: '30 pertanyaan, 14 template chat WhatsApp, dan checklist sebelum DP, biar nggak kelewatan biaya tambahan waktu deal sama vendor.',
    value: VENDOR_KIT_VALUE,
    img: '/bonus/vendor-toolkit.webp',
  },
  {
    title: 'Wedding Budget Saving Playbook',
    format: 'E-book PDF',
    text: '30 cara hemat yang tetap menjaga bagian paling penting buat kalian, lengkap dengan worksheet prioritas, hitungan tamu, dan hidden cost.',
    value: SAVING_BOOK_VALUE,
    img: '/bonus/budget-playbook.webp',
  },
]
const BONUS_TOTAL = INVITE_VALUE + BONUSES.reduce((a, b) => a + b.value, 0)

const priceGradient = 'bg-[linear-gradient(95deg,#E6EBDD_0%,#F5E6DF_50%,#E2A592_100%)] bg-clip-text text-transparent'
const pillGradient = 'bg-[linear-gradient(95deg,#C9D4BA_0%,#F5E6DF_55%,#E2A592_100%)]'

function OfferCard() {
  const [h, m, sec] = useMidnightCountdown()
  const toForm = (e: MouseEvent) => {
    e.preventDefault()
    document.getElementById('checkout-form')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }
  return (
    <div className="flex w-full flex-col gap-7 rounded-[28px] bg-white/[0.04] p-5 ring-1 ring-white/10 sm:p-8">
      {/* Rincian isi paket, lalu harga normal yang dicoret */}
      <div data-reveal className="flex flex-col">
        <ul className="flex flex-col divide-y divide-white/10">
          {MODULES.map((it) => (
            <li key={it.label} className="flex items-center gap-3 py-3 text-[15px]">
              <it.icon className="size-[18px] shrink-0 text-[#C9D4BA]" strokeWidth={1.8} aria-hidden />
              <span className="flex-1 leading-snug">{it.label}</span>
              <span className="shrink-0 whitespace-nowrap text-[14px] tabular-nums text-[#D5DCCB]">{rupiah(it.value)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between gap-3 border-t border-white/20 pt-4">
          <span className="text-[16px] font-semibold">Harga normal</span>
          <s className="text-[20px] font-semibold tabular-nums text-[#C9D0BC]">{rupiah(NORMAL_PRICE)}</s>
        </div>
      </div>

      <div data-reveal className="flex flex-col items-center gap-3 text-center">
        <ArrowDown className="size-5 animate-bounce text-[#C9D0BC]" strokeWidth={1.8} aria-hidden />
        <p className="max-w-[380px] text-[15px] leading-relaxed text-[#E3E8DA]">
          Tapi tenang, semuanya udah jadi <strong className="text-white">satu paket Bridesmap</strong>, plus {BONUSES.length + 1} bonus di bawah.
        </p>
      </div>

      {/* Harga paket */}
      <div data-reveal className="flex flex-col items-center gap-5 text-center">
        <p className="text-[12px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-[#C9D0BC]">
          Harga paket hari ini
          <br />
          Sekali bayar, tanpa tagihan bulanan
        </p>
        <p className={cn('text-[50px] font-bold leading-none tracking-[-0.03em] tabular-nums min-[400px]:text-[58px] sm:text-[76px]', priceGradient)}>{rupiah(LAUNCH.price)}</p>
        {/* Keputusan user (4 Nov 2026): ganti info harga Pre Launching dengan kalimat hemat + urgensi. Persen dihitung dari harga coret. */}
        <span className="inline-flex max-w-[360px] items-start gap-2 rounded-[14px] bg-[#E2A592]/15 px-4 py-2.5 text-left text-[14px] leading-snug text-[#F5E6DF] ring-1 ring-[#E2A592]/40">
          <Flame className="mt-0.5 size-4 shrink-0 text-[#F2B8A6]" strokeWidth={2.2} aria-hidden />
          <span>
            <strong className="text-white">Hemat {SAVE_PCT}% hari ini</strong> &amp; budget nikah nggak bengkak sebelum hari-H.
          </span>
        </span>
      </div>

      <div aria-hidden className="border-t border-dashed border-white/20" />

      {/* Promo terbatas: hitung mundur ke tengah malam + slot (keputusan user) */}
      <div data-reveal className="flex flex-col items-center gap-5 rounded-[24px] bg-[#E2A592]/[0.12] p-5 text-center ring-1 ring-[#E2A592]/45 sm:p-6">
        <span className="flex items-center gap-2 rounded-full bg-[#E2A592] px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-ink">
          {/* Tanda seru khusus badge ini (api sudah dipakai di kotak hemat): cincin berdenyut + goyang singkat seperti alarm */}
          <span aria-hidden className="relative grid size-5 place-items-center">
            <span className="sp-ping absolute inset-0 rounded-full bg-ink/35" />
            <span className="sp-alert relative grid size-5 place-items-center rounded-full bg-ink text-[13px] font-black leading-none text-[#F2B8A6]">!</span>
          </span>
          Promo hampir habis
        </span>

        <p className="text-[24px] font-semibold leading-tight text-white sm:text-[28px]">
          Tinggal <span className="tabular-nums text-[#F2B8A6]">{SLOTS.left} slot</span> lagi
          <br />
          <span className="text-[16px] font-normal text-[#E3E8DA] sm:text-[18px]">untuk harga {rupiah(LAUNCH.price)} hari ini</span>
        </p>

        <div className="flex w-full flex-col gap-2">
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
            <div className="sp-fill h-full rounded-full bg-[linear-gradient(90deg,#E2A592_0%,#C8664C_100%)]" style={{ width: `${(SLOTS_TAKEN / SLOTS.total) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[12px] font-semibold tabular-nums text-[#E3E8DA]">
            <span>{SLOTS_TAKEN} dari {SLOTS.total} slot sudah diambil</span>
            <span className="text-[#F2B8A6]">{Math.round((SLOTS_TAKEN / SLOTS.total) * 100)}%</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2" role="timer" aria-label={`Promo berakhir dalam ${h} jam ${m} menit`}>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C9D0BC]">
            <Clock className="size-3.5" strokeWidth={2} aria-hidden /> Promo ditutup dalam
          </span>
          <div className="flex items-start gap-2 tabular-nums" aria-hidden>
            {[
              [h, 'Jam'],
              [m, 'Menit'],
              [sec, 'Detik'],
            ].map(([v, label], i) => (
              <span key={label} className="flex items-start gap-2">
                <span className="flex flex-col items-center gap-1">
                  <span key={i === 2 ? v : undefined} className={cn('grid h-[54px] w-[58px] place-items-center rounded-[12px] bg-black/30 text-[28px] font-bold text-white ring-1 ring-white/10', i === 2 && 'sp-tick text-[#F2B8A6]')}>
                    {v}
                  </span>
                  <span className="text-[11px] text-[#C9D0BC]">{label}</span>
                </span>
                {i < 2 && <span className="pt-3 text-[22px] font-bold text-white/40">:</span>}
              </span>
            ))}
          </div>
        </div>

        <a
          href="#checkout-form"
          onClick={toForm}
          className="sp-shine btn h-auto min-h-[52px] w-full max-w-[360px] whitespace-normal! bg-[#E2A592] px-6 py-3 text-center text-[16px] leading-snug text-ink shadow-[0_10px_30px_rgb(226_165_146/0.35)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Ambil Promo + Bonus Bridesmap <ArrowRight className="size-[18px]" strokeWidth={2} aria-hidden />
        </a>
        <p className="max-w-[340px] text-[14px] leading-relaxed text-[#E3E8DA]">
          Setelah {SLOTS.left} slot ini habis, harga naik jadi <strong className="tabular-nums text-white">{rupiah(NEXT_PRICE)}</strong>.
        </p>
      </div>

      {/* Bonus */}
      <FeaturedBonus />
      <ul className="flex flex-col gap-4">
        {BONUSES.map((b, i) => (
          <li key={b.title} data-reveal style={delay(i * 90)} className="flex flex-col overflow-hidden rounded-[22px] bg-white/[0.06] ring-1 ring-white/10 sm:flex-row sm:items-stretch">
            {/* Latar panel = warna latar gambar, jadi gambar persegi menyatu tanpa garis tepi */}
            <span className="relative block aspect-[4/3] bg-[#FDF7F0] sm:aspect-auto sm:min-h-[200px] sm:w-[200px] sm:shrink-0">
              <img src={b.img} alt={`Pratinjau ${b.title}`} width={1254} height={1254} loading="lazy" decoding="async" className="absolute inset-0 size-full object-contain" />
            </span>
            <span className="flex min-w-0 flex-col gap-2 p-4 sm:justify-center sm:p-5">
              <span className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink', pillGradient)}>Bonus {i + 1}</span>
                <span className="text-[12px] font-semibold text-[#C9D0BC]">{b.format}</span>
              </span>
              <span className="text-[18px] font-semibold leading-snug text-white">{b.title}</span>
              <span className="text-[14px] leading-snug">
                <s className="mr-1.5 tabular-nums text-[#C9D0BC]">{rupiah(b.value)}</s>
                <strong className="text-[#C9D4BA]">GRATIS</strong>
              </span>
              <span className="text-[13px] leading-relaxed text-[#E3E8DA]">{b.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <div data-reveal className="flex flex-col items-center gap-1 rounded-[20px] border border-dashed border-[#E2A592]/50 px-4 py-4 text-center">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#C9D0BC]">
          <Gift className="size-3.5 text-[#E2A592]" strokeWidth={2} aria-hidden /> Total nilai {BONUSES.length + 1} bonus
        </span>
        <span className="text-[15px] text-[#E3E8DA]">
          <s className="mr-2 text-[20px] font-semibold tabular-nums text-[#C9D0BC]">{rupiah(BONUS_TOTAL)}</s>
          <strong className="text-[20px] text-white">GRATIS</strong> untuk kalian
        </span>
      </div>
    </div>
  )
}

/* ================= 8. CTA: FAQ keberatan ================= */

// Jawaban pendek gaya obrolan (referensi: rupistacko.com & kuaze.lynk.id). Fakta mengikuti LANDING_FAQ di content.ts.
const FAQ_ITEMS = [
  { q: 'Ini aplikasi atau file?', a: 'Aplikasi web. Dibuka dari browser HP atau laptop, nggak perlu install dari Play Store. Bisa juga ditambahkan ke layar utama HP biar muncul kayak aplikasi biasa.' },
  { q: 'Perlu daftar akun?', a: 'Perlu, tapi gampang. Masuk pakai email yang sama dengan saat checkout, lalu bikin kata sandi. Biasanya akses aktif dalam beberapa menit.' },
  { q: 'Bayarnya sekali atau langganan?', a: `Sekali bayar ${rupiah(LAUNCH.price)}. Nggak ada tagihan bulanan.` },
  { q: 'Ribet nggak pakainya?', a: 'Nggak. Isi tanggal hari-H, total budget, dan acara yang mau digelar. Checklist, pembagian budget, dan jadwalnya langsung tersusun, tinggal diikuti.' },
  { q: 'Bisa dipakai bareng pasangan?', a: 'Bisa. Undang pasangan lewat WhatsApp dari menu Pengaturan. Untuk sekarang tiap akun masih nyimpan rencananya sendiri, jadi kalau mau satu rencana, pakai satu HP dan gantian lewat avatar pasangan di bagian atas.' },
  { q: 'Data aku aman nggak? Kalau ganti HP gimana?', a: 'Aman. Rencana, daftar tamu, vendor, dan foto tersimpan di akun kalian. Ganti HP tinggal masuk lagi, datanya langsung ada.' },
  { q: 'Daftar tamu udah ada di Excel, harus ketik ulang?', a: 'Nggak. Tinggal impor dari file CSV, Excel, atau kontak HP.' },
  { q: 'Kami pakai WO. Masih perlu Bridesmap?', a: 'Kalau WO-nya cuma untuk hari-H, urusan DP vendor lain, daftar tamu, seserahan, dan berkas KUA biasanya tetap kalian yang pegang. Bagian itu yang paling terbantu.' },
  { q: 'Gimana cara klaim garansi 7 hari?', a: 'Tinggal DM admin dalam 7 hari sejak pembelian. Uang kalian balik penuh, lalu akses Bridesmap dinonaktifkan.' },
  { q: 'Kalau ada kendala pas pakai?', a: 'Tinggal DM admin, kami bantuin sampai beres.' },
]

function FaqList() {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]))
  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(i)) next.add(i)
      return next
    })
  return (
    <ul className="mx-auto flex w-full max-w-[780px] flex-col gap-3">
      {FAQ_ITEMS.map((f, i) => {
        const isOpen = open.has(i)
        return (
          <li key={f.q} data-reveal style={delay(Math.min(i, 5) * 60)} className={cn('rounded-[22px] bg-card ring-1 transition-shadow duration-200', isOpen ? 'shadow-[var(--shadow-soft)] ring-primary/45' : 'ring-border')}>
            <button type="button" onClick={() => toggle(i)} aria-expanded={isOpen} className="flex min-h-[64px] w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6">
              <span className="text-[16px] font-semibold leading-snug text-ink sm:text-[17px]">{f.q}</span>
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-200', isOpen ? 'bg-primary text-white' : 'bg-primary-soft text-on-primary-soft')}>
                {isOpen ? <Minus className="size-4" strokeWidth={2.4} aria-hidden /> : <Plus className="size-4" strokeWidth={2.4} aria-hidden />}
              </span>
            </button>
            <div className={cn('grid transition-[grid-template-rows] duration-300 ease-out', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
              <p className="overflow-hidden px-5 text-[15px] leading-relaxed text-body sm:px-6">
                <span className="block pb-5">{f.a}</span>
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ================= 7. PROOF: lencana garansi ================= */

const SHIELD = 'M60 4 L112 20 V62 C112 98 90 122 60 136 C30 122 8 98 8 62 V20 Z'
const SHIELD_INNER = 'M60 13 L103 26 V62 C103 93 84 113 60 126 C36 113 17 93 17 62 V26 Z'

function GuaranteeShield() {
  return (
    <div className="relative mx-auto w-[150px] sm:w-[180px]">
      <svg viewBox="0 0 120 140" className="w-full drop-shadow-[0_14px_24px_rgb(34_38_31/0.28)]" aria-hidden>
        <path d={SHIELD} fill="#34432F" />
        <path d={SHIELD_INNER} fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth="1.2" strokeDasharray="3 3" />
      </svg>
      <div className="absolute inset-x-0 top-[13%] flex flex-col items-center leading-none text-white">
        <span className="grid size-6 place-items-center rounded-full bg-[#C9D4BA] text-primary sm:size-7">
          <Check className="size-4" strokeWidth={3} aria-hidden />
        </span>
        <span className="mt-1 font-serif text-[52px] sm:text-[64px]">7</span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-[12px]">Hari</span>
      </div>
      <span
        className="absolute bottom-[12%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#E2A592] px-5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink shadow-[0_6px_14px_rgb(34_38_31/0.2)] sm:text-[11px]"
        style={{ clipPath: 'polygon(0 0, 100% 0, 94% 50%, 100% 100%, 0 100%, 6% 50%)' }}
      >
        Uang kembali 100%
      </span>
    </div>
  )
}

/* ================= Halaman ================= */

export default function SalesPage() {
  const root = useReveal()

  return (
    <div ref={root} className="landing-type min-h-dvh overflow-x-clip bg-background">

      <main className="mx-auto flex max-w-[1200px] flex-col px-4 sm:px-6">
        {/* 1. HOOK */}
        <section className="grid items-center gap-8 pb-16 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 lg:pb-24 lg:pt-14">
          <div className="flex flex-col gap-6">
            <span className="hero-in inline-flex items-center gap-2 self-start rounded-full bg-primary-soft px-3.5 py-1.5 text-[13px] font-semibold text-on-primary-soft">
              <HeartHandshake className="size-4" strokeWidth={2} aria-hidden /> Your Wedding Planner, Made for Two
            </span>
            <h1 className="hero-in text-[38px] leading-[1.04] tracking-[-0.03em] sm:text-[clamp(46px,5vw,68px)] sm:leading-[1]" style={delay(100)}>
              <span className="block text-balance">Pernikahan belum tiba,</span>
              <span className="block text-balance italic text-primary">tapi kok budget sudah bikin pusing?</span>
            </h1>
            <p className="hero-in max-w-[540px] text-[18px] font-semibold leading-snug text-ink" style={delay(180)}>
              Jangan sampai persiapan yang seharusnya membahagiakan justru jadi beban.
            </p>
            <p className="hero-in max-w-[540px] text-[16px] leading-relaxed text-body sm:text-[17px]" style={delay(240)}>
              Atur budget per acara, catat biaya yang sering kelewat, pantau jadwal bayar vendor, sampai kirim undangan digital. Semua kebutuhan nikah kalian ada di satu tempat bersama Bridesmap.
            </p>
            <div className="hero-in flex flex-wrap items-center gap-x-6 gap-y-3" style={delay(320)}>
              <Cta>Mulai Atur Budget Nikah</Cta>
              <a href="#isi" className="link-arrow">
                Intip isi aplikasinya <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
              </a>
            </div>
            <ol className="hero-in flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0" style={delay(420)}>
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2.5 sm:gap-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[13px] font-semibold text-white">{i + 1}</span>
                  <span className="text-[14px] font-semibold text-ink">{s}</span>
                  {i < STEPS.length - 1 && <ArrowRight className="mx-2 hidden size-4 shrink-0 text-muted-foreground sm:block" strokeWidth={1.8} aria-hidden />}
                </li>
              ))}
            </ol>
            <ul className="hero-in grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border pt-5 sm:flex sm:flex-wrap sm:gap-x-6" style={delay(460)}>
              {BADGES.map((b) => (
                <li key={b.label} className="flex items-center gap-2 text-[13px] text-body sm:text-sm">
                  <b.icon className="size-4 shrink-0 text-primary" strokeWidth={2} aria-hidden /> {b.label}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </section>

        {/* 2. MASALAH */}
        <section className="flex flex-col gap-12 border-t border-border py-20 lg:py-24">
          <SectionHead
            align="center"
            eyebrow="Sering kejadian saat persiapan"
            title="4 hal yang bikin budget nikah"
            italic="diam-diam bengkak."
            text="Biasanya muncul satu per satu selama persiapan, dari chat yang kelihatannya sepele. Jangan sampai kejadian ke kalian juga."
            className="mx-auto"
          />
          <ol className="mx-auto grid w-full max-w-[980px] gap-4 md:grid-cols-2 md:gap-5">
            {PROBLEMS.map((p, i) => (
              <li key={p.title} data-reveal style={delay(i * 120)} className="flex flex-col gap-4 rounded-[26px] bg-card p-5 shadow-[var(--shadow-soft)] ring-1 ring-border sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#F5E6DF] text-accent">
                    <p.icon className="size-[22px]" strokeWidth={1.8} aria-hidden />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[12px] font-semibold tabular-nums tracking-[0.1em] text-accent">MASALAH {i + 1}</span>
                    <span className="text-[18px] font-semibold leading-snug text-ink">{p.title}</span>
                  </span>
                </div>
                <div className={cn('flex flex-col gap-1 rounded-[18px] bg-muted p-3', p.mine && 'items-end text-right')}>
                  <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{p.from}</span>
                  <span className={cn('max-w-[300px] rounded-[16px] px-3.5 py-2.5 text-[15px]', p.mine ? 'rounded-br-[5px] bg-primary text-white' : 'rounded-bl-[5px] bg-card text-ink ring-1 ring-border')}>{p.text}</span>
                </div>
                <p className="flex gap-2 text-[15px] leading-relaxed text-body">
                  <ArrowRight className="mt-[3px] size-4 shrink-0 text-accent" strokeWidth={2.2} aria-hidden />
                  <span>
                    <strong className="font-semibold text-ink">Kalau nggak dicatat:</strong> {p.impact}
                  </span>
                </p>
              </li>
            ))}
          </ol>
          <p data-reveal className="mx-auto max-w-[760px] text-center text-[30px] leading-[1.1] tracking-[-0.02em] sm:text-[44px]">
            Ini bukan soal boros.
            <br />
            <span className="font-serif italic text-primary">Catatannya aja yang belum ngumpul di satu tempat.</span>
          </p>
          <div data-reveal className="flex flex-col gap-6 rounded-[32px] bg-primary p-[clamp(20px,4vw,48px)] text-white">
            <div className="flex flex-col gap-2">
              <h3 className="text-[26px] leading-[1.1] text-white sm:text-[34px]">
                Berapa biaya yang sering <span className="italic">lupa dianggarkan?</span>
              </h3>
              <p className="max-w-[560px] text-[15px] leading-relaxed text-[#E3E8DA]">Pilih budget dan jumlah tamu kalian. Bridesmap memperkirakan biaya kecil yang sering lupa dimasukkan ke budget, seperti pajak venue, seragam keluarga, dan transport rombongan.</p>
            </div>
            <HiddenCostCalculator />
          </div>
        </section>

        {/* 3. SOLUSI */}
        <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div data-reveal className="flex flex-col gap-6 rounded-[32px] bg-[#F7F1E6] p-7 shadow-[var(--shadow-soft)] ring-1 ring-border sm:p-10">
            <h2 className="text-balance text-[26px] leading-[1.15] tracking-[-0.02em] text-ink sm:text-[30px]">
              Punya impian pernikahan boleh, <span className="font-serif italic text-accent">tapi budget-nya juga harus diperhitungkan!</span>
            </h2>
            <ul className="flex flex-col divide-y divide-border">
              {FACTS.map((f, i) => (
                <li key={f.value} data-reveal style={delay(i * 120)} className="flex flex-col gap-2 py-5 first:pt-0 last:pb-0">
                  <span className={cn('font-serif italic leading-none tracking-[-0.02em] text-primary', f.value.length > 6 ? 'text-[34px] sm:text-[40px]' : 'text-[48px] sm:text-[56px]')}>{f.value}</span>
                  <p className="text-[17px] leading-relaxed text-ink">{f.text}</p>
                  <span className="text-[12px] italic leading-relaxed text-muted-foreground">{f.source}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 border-t border-border pt-5">
              <p className="text-[19px] font-semibold leading-snug text-ink">Jangan sampai persiapan hari bahagia justru menjadi sumber masalah.</p>
              <p className="text-[16px] leading-relaxed text-body">Makanya, penting untuk mencatat setiap pengeluaran, mengatur budget, dan menyepakati prioritas bersama pasangan sejak awal.</p>
            </div>
          </div>
          <div className="flex flex-col gap-8 lg:pt-6">
            <SectionHead eyebrow="Kenalin, Bridesmap" title="Kalian isi angkanya," italic="Bridesmap yang hitung dan ingetin." text="Wedding planner di HP untuk pasangan yang ngurus nikahan sendiri." />
            <ul className="flex flex-col gap-3">
              {PILLARS.map((p, i) => (
                <li key={p.title} data-reveal style={delay(i * 100)} className="flex gap-4 rounded-[22px] bg-card p-5 ring-1 ring-border">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-primary-soft text-on-primary-soft">
                    <p.icon className="size-[22px]" strokeWidth={1.8} aria-hidden />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-[17px] font-semibold text-ink">{p.title}</span>
                    <span className="text-[15px] leading-relaxed text-body">{p.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. DEMO */}
        <section id="isi" className="flex scroll-mt-20 flex-col gap-10 py-20 lg:py-28">
          <SectionHead align="center" eyebrow="Lihat dalamnya" title="Lebih dari sekadar wedding planner," italic="inilah kenapa Bridesmap lebih unggul." className="mx-auto" />
          <DemoTabs />
        </section>

        {/* 4b. MOMEN */}
        <section className="mb-16 flex flex-col gap-10 rounded-[32px] bg-accent-soft p-[clamp(20px,5vw,56px)] lg:mb-20">
          <SectionHead
            align="center"
            eyebrow="Bukan cuma urusan teknis"
            title="Yang disiapkan bukan cuma acaranya,"
            italic="tapi juga kalian berdua."
            text="Budget, vendor, dan tamu udah rapi di menu tadi. Di luar itu, Bridesmap juga nyiapin ruang khusus buat kalian berdua, biar persiapan nikah tetap terasa manis, nggak cuma soal tagihan."
            className="mx-auto"
          />
          <ul className="grid gap-4 md:grid-cols-2 md:gap-5">
            {MOMENTS.map((mo, i) => (
              <li key={mo.title} data-reveal style={delay(i * 120)} className="flex flex-col gap-4 rounded-[28px] bg-card p-3 pb-5 shadow-[var(--shadow-soft)] ring-1 ring-[#EAD7CD]">
                {mo.visual}
                <div className="flex flex-col gap-1 px-2">
                  <h3 className="font-serif text-[26px] italic leading-tight text-accent">{mo.title}</h3>
                  <p className="text-[15px] leading-relaxed text-body">{mo.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p data-reveal className="mx-auto max-w-[560px] text-center font-serif text-[24px] italic leading-snug text-accent sm:text-[28px]">
            Biar pas hari-H tiba, yang kalian ingat bukan cuma capeknya.
          </p>
        </section>

        {/* 5. BENEFIT */}
        <section className="flex flex-col gap-12 rounded-[32px] bg-muted p-[clamp(20px,5vw,56px)]">
          <SectionHead eyebrow="Bedanya kerasa" title="Notes, Excel, dan chat WA" italic="atau satu tempat?" />
          <div data-reveal className="overflow-hidden rounded-[24px] bg-card ring-1 ring-border">
            <div className="grid grid-cols-2 border-b border-border bg-background/60 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:grid-cols-[1.1fr_1fr_1fr] sm:text-[13px]">
              <span className="hidden px-5 py-3 sm:block">Kebutuhan</span>
              <span className="px-3 py-3 sm:px-5">Cara lama</span>
              <span className="bg-primary px-3 py-3 text-white sm:px-5">Bridesmap</span>
            </div>
            {COMPARE.map(([need, old, now]) => (
              <div key={need} className="grid grid-cols-2 border-b border-divider text-[14px] last:border-0 sm:grid-cols-[1.1fr_1fr_1fr] sm:text-[15px]">
                <span className="col-span-2 px-3 pb-0 pt-3.5 font-semibold text-ink sm:col-span-1 sm:px-5 sm:pb-3.5">{need}</span>
                <span className="flex items-start gap-1.5 px-3 py-3.5 text-muted-foreground sm:px-5">
                  <X className="mt-0.5 size-4 shrink-0 text-destructive" strokeWidth={2} aria-hidden /> {old}
                </span>
                <span className="flex items-start gap-1.5 bg-primary-soft/60 px-3 py-3.5 font-semibold text-ink sm:px-5">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.4} aria-hidden /> {now}
                </span>
              </div>
            ))}
          </div>
          {/* Kartu "cocok" dibuat lebih berbobot (terang, terangkat); kartu "lewatin" sengaja lebih kalem */}
          <div className="grid items-stretch gap-4 md:grid-cols-[1.12fr_1fr] md:gap-5">
            <div data-reveal className="relative flex flex-col gap-6 overflow-hidden rounded-[28px] bg-card p-6 shadow-[var(--shadow-lift)] ring-1 ring-primary/15 sm:p-8">
              <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#34432F_0%,#9DB386_55%,#E2A592_100%)]" />
              <h3 className="font-sans text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink sm:text-[26px]">
                {/* inline! menimpa aturan global .landing-type yang menjadikan teks miring di judul sebagai blok */}
                Bridesmap <span className="inline! font-serif text-[1.2em] font-normal italic text-primary">cocok</span> buat kalian kalau:
              </h3>
              <ul className="flex flex-col">
                {FIT_YES.map((t) => (
                  <li key={t} className="flex items-start gap-4 border-t border-divider py-4 first:border-0 first:pt-0 last:pb-0">
                    <Badge3D tone="yes" className="size-10" />
                    <span className="pt-1.5 text-[16px] font-medium leading-relaxed text-ink sm:text-[17px]">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div data-reveal style={delay(120)} className="flex flex-col gap-6 rounded-[28px] border border-dashed border-[#D9C9BE] bg-background/70 p-6 sm:p-8">
              <h3 className="font-sans text-[20px] font-semibold leading-tight text-ink/80 sm:text-[22px]">
                <span className="inline! font-serif text-[1.2em] font-normal italic text-accent">Lewatin aja</span> kalau kalian:
              </h3>
              <ul className="flex flex-col">
                {FIT_NO.map((t) => (
                  <li key={t} className="flex items-start gap-4 border-t border-dashed border-[#E5D8CE] py-4 first:border-0 first:pt-0 last:pb-0">
                    <Badge3D tone="no" className="size-9" />
                    <span className="pt-1.5 text-[15px] leading-relaxed text-body sm:text-[16px]">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 6. OFFER + checkout di halaman */}
        <section id={CHECKOUT_ID} className="mt-20 flex scroll-mt-16 flex-col gap-10 rounded-[32px] bg-[#2B3627] p-[clamp(16px,4vw,48px)] text-white lg:mt-28">
          <SectionHead tone="dark" align="center" eyebrow="Penawaran" title="Coba bayangin kalau semua ini" italic="dibeli satu-satu..." text="Kalau semua yang kalian butuhkan buat persiapan nikah dihitung, nilainya segini." className="mx-auto pt-4" />
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
            <OfferCard />
            <div id="checkout-form" data-reveal style={delay(150)} className="flex scroll-mt-20 flex-col gap-3">
              <div className="overflow-hidden rounded-[24px] bg-white text-ink shadow-[var(--shadow-lift)]">
                <div className="flex items-center gap-2 border-b border-divider px-5 py-4">
                  <Lock className="size-4 text-primary" strokeWidth={2} aria-hidden />
                  <span className="text-[15px] font-semibold">Checkout aman</span>
                  <span className="ml-auto text-xs text-muted-foreground">Diproses OrderHero</span>
                </div>
                <iframe title="Form checkout Bridesmap" src={OFFER.checkoutHref} loading="lazy" className="block h-[1640px] w-full border-0 sm:h-[1560px]" />
              </div>
              <div className="flex items-center gap-3 rounded-[20px] bg-white/10 px-5 py-4">
                <ShieldCheck className="size-6 shrink-0 text-[#C9D4BA]" strokeWidth={1.8} aria-hidden />
                <span className="text-[14px] leading-snug">
                  <strong>Garansi 7 hari uang kembali.</strong> Nggak cocok? Uang kembali penuh, tanpa alasan.
                </span>
              </div>
              <a href={OFFER.checkoutHref} target="_blank" rel="noreferrer" className="text-center text-[13px] text-[#D5DCCB] underline underline-offset-4 hover:text-white">
                Form nggak muncul? Buka checkout di tab baru
              </a>
            </div>
          </div>
        </section>

        {/* 7. PROOF */}
        <section className="flex flex-col gap-14 py-20 lg:py-28">
          <div data-reveal className="grid items-center gap-8 rounded-[32px] bg-primary-soft p-[clamp(24px,5vw,56px)] md:grid-cols-[auto_minmax(0,1fr)] md:gap-12">
            <GuaranteeShield />
            <div className="flex flex-col gap-4 text-center md:text-left">
              <span className="eyebrow">Garansi uang kembali</span>
              <h2 className="text-[30px] leading-[1.05] sm:text-[44px]">
                Masih ragu?
                <br />
                <span className="italic text-primary">Ada garansi 7 hari.</span>
              </h2>
              <p className="max-w-[520px] text-[16px] leading-relaxed text-body">Pakai dulu 7 hari. Kalau ternyata nggak bermanfaat, DM kami dan uang kalian balik penuh.</p>
            </div>
          </div>
        </section>

        {/* 8. CTA */}
        <section id="faq" className="flex scroll-mt-20 flex-col gap-10 border-t border-border pt-20 lg:pt-24">
          <h2 data-reveal className="text-balance text-center text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[48px]">
            Masih ada <span className="bg-[linear-gradient(95deg,#34432F_0%,#7A8F6A_45%,#C8664C_100%)] bg-clip-text pr-1 font-serif italic font-normal text-transparent">pertanyaan?</span>
          </h2>
          <FaqList />
        </section>

        <section className="relative my-20 flex flex-col items-center gap-6 overflow-hidden rounded-[32px] bg-primary px-6 py-[clamp(56px,8vw,104px)] text-center text-white lg:my-28">
          <div aria-hidden className="absolute -left-20 -top-20 size-72 rounded-full bg-white/5" />
          <div aria-hidden className="absolute -bottom-24 -right-16 size-80 rounded-full bg-white/5" />
          <h2 data-reveal className="relative text-[32px] leading-[1.05] text-white sm:text-[clamp(40px,5.6vw,64px)] sm:leading-[1]">
            Tanggal hari-H nggak akan mundur.
            <br />
            <span className="italic">Mulai rapikan persiapannya hari ini.</span>
          </h2>
          <p data-reveal style={delay(100)} className="relative max-w-[480px] text-[17px] leading-relaxed text-[#E3E8DA]">
            Tiap minggu ditunda, ada DP baru yang ditransfer tanpa catatan.
          </p>
          <div data-reveal style={delay(200)} className="relative flex flex-col items-center gap-3">
            <Cta tone="light">Ambil Bridesmap {rupiah(LAUNCH.price)}</Cta>
            <span className="flex items-center gap-2 text-sm text-[#D5DCCB]">
              <ShieldCheck className="size-4" strokeWidth={2} aria-hidden /> Garansi 7 hari · sekali bayar
            </span>
          </div>
        </section>
      </main>

    </div>
  )
}
