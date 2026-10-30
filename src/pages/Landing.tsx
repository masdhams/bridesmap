import { Armchair, ArrowRight, Check, ChevronDown, FileText, Images, LogIn, Lock, Mail, Menu, MessageCircleHeart, Plane, Store, Users, X } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Ring } from '../components/cards'
import { Faq, HowItWorks, InvitationCarousel, SectionHead, useReveal } from '../components/landing'
import { PublicFooter } from '../components/PublicLayout'
import { LANDING_FAQ, LEGAL, OFFER, TASK_TEMPLATES, TESTIMONIALS } from '../data/content'
import { usePlan } from '../lib/store'
import { cn, fmtDate, rupiah } from '../lib/utils'

const NAV = [
  { href: '#fitur', label: 'Fitur' },
  { href: '#undangan', label: 'Undangan' },
  { href: '#penawaran', label: 'Penawaran' },
  { href: '/alat', label: 'Alat gratis' },
  { href: '/tentang', label: 'Cerita kami' },
]

// Foto sampul homepage (1672x941 WebP). Ganti file di public/hero/ dengan nama yang sama, atau ubah path ini.
const HERO_PHOTO = '/hero/cover.webp'

const BELIEFS = ['Biar kalian bisa atur semuanya bareng', 'Nggak ada biaya yang tiba-tiba bikin kaget', 'Undangan digital? Sudah termasuk!']

const TABS = ['Semua persiapan', 'Budget & Vendor', 'Daftar tamu', 'Obrolan Berdua & Surat Cinta'] as const

const FEATURES: { icon: typeof Mail; title: string; text: string }[] = [
  { icon: Mail, title: 'Undangan digital', text: 'Pilih desain favorit, masukkan detail pernikahan, lalu bagikan undangan personal kepada setiap tamu.' },
  { icon: Users, title: 'Smart RSVP', text: 'Tahu siapa yang hadir, siapa yang membawa pasangan, dan kebutuhan khusus setiap tamu tanpa harus mencatat satu per satu.' },
  { icon: Armchair, title: 'Seating plan', text: 'Atur siapa duduk di meja mana. Biar nanti keluarga dan teman-teman punya tempat yang nyaman saat hari-H.' },
  { icon: Images, title: 'Vision board', text: 'Simpan semua inspirasi warna, dekorasi, bunga, dan detail wedding impian kalian. Tinggal tunjukkan ke vendor.' },
  { icon: Store, title: 'Vendor & pembayaran', text: 'Simpan kontak vendor, harga yang sudah disepakati, jadwal pembayaran, sampai bukti transfer. Nggak perlu cari-cari lagi saat dibutuhkan.' },
  { icon: FileText, title: 'Administrasi', text: 'Simpan dokumen penting seperti berkas KUA, KTP, dan kontrak vendor. Checklist akan ikut ter-update saat dokumen sudah lengkap.' },
  { icon: MessageCircleHeart, title: 'Deep Talk & Surat untuk Nanti', text: 'Ada pertanyaan yang mungkin belum sempat kalian bicarakan? Luangkan waktu untuk saling mengenal lebih dalam, dan simpan surat yang bisa kalian baca kembali di hari pernikahan.' },
  { icon: Plane, title: 'Honeymoon', text: 'Susun itinerary, catat booking, dan siapkan barang bawaan untuk perjalanan pertama kalian sebagai pasangan suami istri.' },
]

const glass = 'rounded-[22px] border border-white/20 bg-white/12 p-5 backdrop-blur-md'
const delay = (ms: number) => ({ ['--reveal-delay' as string]: `${ms}ms` })

// Contoh tampilan (pasangan fiktif). Satu sumber angka supaya antar-bagian konsisten, dan tanggal dihitung dari hari ini agar tidak basi.
const SAMPLE_DAYS = 128
const SAMPLE_DONE = 24
const inDays = (n: number, pattern = 'd MMM') => fmtDate(format(addDays(new Date(), n), 'yyyy-MM-dd'), pattern)

/** Pratinjau statis per tab di bagian "Ruang kerja bersama" (pengganti tangkapan layar). */
function WorkspacePreview({ tab }: { tab: number }) {
  if (tab === 0)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3.5 rounded-[24px] bg-primary-hover p-6">
          <span className="font-serif text-[56px] leading-[0.9]">{SAMPLE_DAYS}</span>
          <span className="font-serif text-[22px] italic text-[#D5DCCB]">hari lagi menuju hari-H</span>
          <div className="flex justify-between text-[13px]">
            <span>Persiapan</span>
            <span>{SAMPLE_DONE} / {TASK_TEMPLATES.length} tugas</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/15">
            <div className="h-1.5 rounded-full bg-[#C9D4BA]" style={{ width: `${(SAMPLE_DONE / TASK_TEMPLATES.length) * 100}%` }} />
          </div>
        </div>
        <ul className="overflow-hidden rounded-[20px] bg-card text-ink">
          {[
            ['Bayar termin 2 katering', `Rp 18.000.000 · ${inDays(5)}`, '5 hari'],
            ['Fitting kebaya & beskap', `${inDays(8, 'EEEE, d MMM')} · 10.00`, '8 hari'],
            ['Daftar nikah ke KUA', `${inDays(28)} · siapkan berkas N1–N4`, '28 hari'],
          ].map(([t, s, d]) => (
            <li key={t} className="flex items-center gap-3 border-b border-divider px-4 py-3.5 last:border-0">
              <span className="size-6 shrink-0 rounded-full border-[1.5px] border-[#A9A08C]" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{t}</span>
                <span className="truncate text-xs text-muted-foreground">{s}</span>
              </span>
              <span className="text-xs font-semibold text-warning">{d}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  if (tab === 1)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3.5 rounded-[24px] bg-card p-6 text-ink">
          <span className="text-[13px] text-muted-foreground">Sudah disepakati</span>
          <span className="text-[30px] font-semibold tracking-tight">Rp 78.500.000</span>
          <span className="text-[13px] text-muted-foreground">dari rencana Rp 120.000.000 · sisa Rp 41.500.000</span>
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
            {[['40%', '#34432F'], ['10%', '#6F7F5F'], ['8%', '#A9B59A'], ['5%', '#D3C29E'], ['2.5%', '#9A4E3B']].map(([w, c]) => (
              <div key={c} style={{ width: w, background: c }} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {[
            ['SR', 'Katering Sari Rasa', `Termin 2 dari 3 · ${inDays(5)}`, 'badge-warning', '5 hari lagi'],
            ['GM', 'Gedung Melati', `Pelunasan · ${inDays(SAMPLE_DAYS - 14)}`, 'badge-neutral', inDays(SAMPLE_DAYS - 14)],
            ['LK', 'Lensa Kita Photo', `DP 30% · dibayar ${inDays(-70)}`, 'badge-success', 'Lunas'],
          ].map(([i, n, s, b, l]) => (
            <div key={n} className="flex items-center gap-4 rounded-[20px] bg-card px-5 py-4 text-ink">
              <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-muted font-serif text-[22px]">{i}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{n}</span>
                <span className="truncate text-[13px] text-muted-foreground">{s}</span>
              </span>
              <span className={cn(b, 'min-h-7 text-xs')}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    )
  if (tab === 2)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-[24px] bg-primary-hover p-6">
          <span className="text-sm font-semibold">320 tamu · 142 undangan</span>
          <div className="grid grid-cols-3 gap-2">
            {[['218', 'Hadir', '#C9D4BA'], ['84', 'Menunggu', '#E7D8B8'], ['18', 'Tidak hadir', '#E8B9AB']].map(([n, l, c]) => (
              <div key={l}>
                <span className="font-serif text-[40px] leading-none">{n}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-[#D5DCCB]">
                  <span className="size-2 rounded-full" style={{ background: c }} />
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>
        <ul className="overflow-hidden rounded-[20px] bg-card text-ink">
          {[
            ['KH', 'Keluarga Bpk. Hartono', '4 orang · Keluarga Rani · 1 vegetarian', 'badge-success', 'Hadir'],
            ['SM', 'Sinta Maharani +1', 'Teman kuliah', 'badge-warning', 'Menunggu'],
            ['OB', 'Om Bagus & Tante Lia', '2 orang · Keluarga Dimas', 'badge-danger', 'Tidak hadir'],
          ].map(([i, n, s, b, l]) => (
            <li key={n} className="flex items-center gap-3 border-b border-divider px-4 py-3 last:border-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-[13px] font-semibold text-on-primary-soft">{i}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{n}</span>
                <span className="truncate text-xs text-muted-foreground">{s}</span>
              </span>
              <span className={cn(b, 'min-h-6 px-2 text-[11px]')}>{l}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-[24px] bg-accent-soft p-6 text-ink">
        <span className="eyebrow text-accent-ink">Deep Talk · Hari ke-24</span>
        <p className="font-serif text-[30px] leading-[1.1]">
          Setelah menikah, bagaimana kita mau mengatur <span className="italic text-accent">uang bersama?</span>
        </p>
        <span className="flex items-center gap-2 text-[13px] text-[#6E3A2D]">
          <Lock className="size-4" strokeWidth={1.8} aria-hidden /> Jawaban pasangan terbuka setelah kamu menjawab
        </span>
      </div>
      <div className="flex flex-col gap-3 rounded-[24px] bg-primary-hover p-6">
        <span className="inline-flex h-7 items-center gap-1.5 self-start rounded-full bg-white/15 px-2.5 text-xs font-semibold">
          <Lock className="size-3.5" aria-hidden /> Terkunci
        </span>
        <span className="font-serif text-[44px] leading-none">
          {SAMPLE_DAYS} <span className="italic">hari lagi</span>
        </span>
        <span className="text-[13px] text-[#D5DCCB]">Surat untuk Nanti · 2 surat · 3 foto · dibuka di hari-H</span>
      </div>
    </div>
  )
}

const OFFER_HREF = '#penawaran'
const CTA_LABEL = 'Mulai Rencanakan Pernikahan'

function OfferCard({ phase, index }: { phase: (typeof OFFER.phases)[number]; index: number }) {
  const ended = phase.status === 'ended'
  return (
    <div
      data-reveal
      style={delay(index * 120)}
      aria-disabled={ended || undefined}
      className={cn('relative flex min-w-0 flex-col gap-6 rounded-[24px] p-6 sm:p-8', ended ? 'border border-border bg-card' : 'bg-primary text-white shadow-[var(--shadow-lift)]')}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <span className={cn('font-serif text-[30px] leading-none', !ended && 'text-white')}>{phase.name}</span>
          <span className={cn('text-[15px]', ended ? 'text-body' : 'text-[#E3E8DA]')}>{ended ? 'Harga spesial untuk early buyers.' : 'Special Launch Price'}</span>
        </div>
        <span className={cn('chip shrink-0', ended ? 'bg-accent-soft text-accent-ink' : 'bg-white/15 text-white')}>{ended ? 'Promo sudah berakhir' : 'Available Now'}</span>
      </div>
      <div className={cn('flex flex-1 flex-col gap-6', ended && 'pointer-events-none select-none opacity-50 grayscale')}>
        <div className="flex flex-col gap-2">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
            <s className={cn('text-[17px] tabular-nums', ended ? 'text-muted-foreground' : 'text-[#D5DCCB]')}>{rupiah(OFFER.normalPrice)}</s>
            <span className={cn('chip min-h-6 whitespace-normal px-2.5 py-1 text-[11px]', ended ? 'bg-muted text-body' : 'bg-accent-soft text-accent-ink')}>Hemat {rupiah(OFFER.normalPrice - phase.price)} dari harga normal</span>
          </span>
          <span className="text-[40px] font-semibold leading-none tracking-tight tabular-nums sm:text-[48px]">{rupiah(phase.price)}</span>
        </div>
        <ul className={cn('flex flex-1 flex-col gap-3 border-t pt-6 text-[15px]', ended ? 'border-divider' : 'border-white/15')}>
          {OFFER.items.map((t) => (
            <li key={t} className="flex gap-3">
              <span
                aria-hidden
                className={cn('mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-[7px]', ended ? 'bg-muted text-primary' : 'bg-white/15 text-[#C9D4BA]')}
              >
                <Check className="size-3.5" strokeWidth={2.5} />
              </span>
              <span className="text-balance">{t}</span>
            </li>
          ))}
        </ul>
      </div>
      {ended ? (
        <button type="button" disabled className="btn">
          Tidak tersedia
        </button>
      ) : (
        <a href={OFFER.checkoutHref} className="btn bg-white text-ink hover:bg-primary-soft">
          Amankan Bridesmap Sekarang <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
        </a>
      )}
    </div>
  )
}

/** Kalender mini Maret 2027 dengan hati di tanggal contoh, seperti kartu kalender undangan Sage. */
function MiniCalendar() {
  return (
    <div className="w-full max-w-[250px] rounded-[18px] bg-card p-4 text-ink shadow-[var(--shadow-soft)]">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-serif text-xl">Maret 2027</span>
        <span className="text-xs text-muted-foreground">Hari kami</span>
      </div>
      <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs tabular-nums">
        {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
          <span key={i} className="font-semibold text-muted-foreground">{d}</span>
        ))}
        {Array.from({ length: 21 }, (_, i) => i + 1).map((d) => (
          <span key={d} className={cn('mx-auto grid size-7 place-items-center rounded-full', d === 20 && 'bg-accent text-white')}>
            {d === 20 ? '♥' : d}
          </span>
        ))}
      </div>
    </div>
  )
}

const TOOLS = [
  {
    eyebrow: 'Budget',
    title: 'Kira-kira, berapa budget yang perlu disiapkan?',
    text: `Atur budget pernikahan kalian dan temukan biaya-biaya kecil yang sering luput dari perhitungan.`,
    cta: 'Cek Estimasi Budget',
    to: '/alat/kalkulator-budget',
    visual: (
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="eyebrow">Budget pernikahan kalian</span>
        <span className="font-serif text-[44px] leading-none tabular-nums">{rupiah(120_000_000)}</span>
        <span className="font-serif text-lg italic text-muted-foreground">Ini baru perkiraan awal. Yuk, sesuaikan dengan wedding dream kalian.</span>
      </div>
    ),
  },
  {
    eyebrow: 'Checklist',
    title: 'Sekarang, apa dulu yang harus disiapkan?',
    text: 'Nggak perlu menebak-nebak harus mulai dari mana. Lihat checklist persiapan dari 12 bulan sebelum hari-H sampai hari pernikahan kalian.',
    cta: 'Buka Wedding Checklist',
    to: '/alat/checklist',
    visual: (
      <ul className="flex w-full max-w-[250px] flex-col gap-2.5 text-sm">
        {[['Tentukan hari-H', true], ['Sepakati total budget', true], ['Susun daftar tamu', false], ['Daftar nikah ke KUA', false]].map(([t, done]) => (
          <li key={t as string} className="flex items-center gap-3">
            <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border-[1.5px]', done ? 'border-primary bg-primary text-white' : 'border-[#A9A08C] bg-card')}>
              {done && <Check className="size-3.5" strokeWidth={2.6} aria-hidden />}
            </span>
            <span className={cn(done ? 'text-muted-foreground line-through' : 'font-semibold text-ink')}>{t}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    eyebrow: 'Undangan',
    title: 'Sudah kebayang undangan pernikahan kalian nanti?',
    text: 'Lihat langsung tiga pilihan desain undangan Bridesmap dari HP kalian. Gratis, tanpa perlu membuat akun.',
    cta: 'Lihat Desain Undangan',
    to: '/undangan/sage',
    visual: <MiniCalendar />,
  },
]

export default function Landing() {
  const onboarded = usePlan((s) => s.profile.onboarded)
  const [menu, setMenu] = useState(false)
  const [tab, setTab] = useState(0)
  const root = useReveal()
  const { hash } = useLocation()

  // Tautan "/#penawaran" dari halaman lain: router tidak menggulir ke anchor sendiri.
  useEffect(() => {
    if (hash) requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
  }, [hash])

  return (
    <div ref={root} className="landing-type min-h-dvh bg-background px-3 pt-3">
      {/* Hero foto penuh dengan navigasi di dalamnya */}
      <section className="relative isolate flex min-h-[min(calc(100svh-24px),920px)] flex-col overflow-hidden rounded-[28px] bg-[#2B3627] px-5 pb-6 pt-6 text-white sm:px-[clamp(20px,4vw,48px)]">
        <img
          src={HERO_PHOTO}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-10 size-full object-cover object-[64%_50%] sm:object-[52%_62%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(22_28_19/0.66)_0%,rgb(22_28_19/0.42)_40%,rgb(22_28_19/0.5)_68%,rgb(22_28_19/0.86)_100%)]" />

        <nav aria-label="Navigasi situs" className="flex items-center justify-between gap-4">
          <Link to="/" className="font-serif text-[26px] tracking-[0.02em]">
            Brides<span className="italic">map</span>
          </Link>
          <div className="hidden items-center gap-7 text-[15px] lg:flex">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} className="transition-opacity duration-200 hover:opacity-75">
                {n.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {onboarded ? (
              <Link to="/app" className="btn hidden h-12 min-h-12 bg-white px-[22px] text-ink hover:bg-primary-soft sm:inline-flex">
                Buka rencana <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
              </Link>
            ) : (
              <>
                <Link to="/masuk" className="inline-flex min-h-11 items-center gap-2 px-3 text-[15px] transition-opacity duration-200 hover:opacity-75">
                  <LogIn className="size-[18px]" strokeWidth={1.8} aria-hidden />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </>
            )}
            <button className="grid size-11 place-items-center rounded-full border border-white/25 lg:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Menu">
              {menu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
        {menu && (
          <div className="mt-4 flex flex-col rounded-2xl bg-[#1f281c]/90 p-2 backdrop-blur-md lg:hidden">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} onClick={() => setMenu(false)} className="flex min-h-11 items-center rounded-xl px-3 text-[15px] hover:bg-white/10">
                {n.label}
              </a>
            ))}
            <Link to={onboarded ? '/app' : '/masuk'} className="flex min-h-11 items-center rounded-xl px-3 text-[15px] hover:bg-white/10 sm:hidden">
              {onboarded ? 'Buka rencana' : 'Masuk'}
            </Link>
          </div>
        )}

        <div className="mx-auto mt-14 flex max-w-[880px] flex-col items-center gap-6 text-center sm:mt-20">
          <p className="hero-in text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E3E8DA] sm:text-xs sm:tracking-[0.18em]">Your Wedding Planner, Made for Two</p>
          <h1 className="hero-in text-[36px] leading-[1.02] tracking-[-0.03em] text-white sm:text-[clamp(44px,7vw,96px)] sm:leading-[0.98]" style={delay(120)}>
            Wujudkan wedding dream kalian.
            <br />
            <span className="italic">Tanpa bikin keuangan berantakan.</span>
          </h1>
          <p className="hero-in max-w-[580px] text-[17px] leading-relaxed text-[#EEF1E8] sm:text-lg" style={delay(240)}>
            Dari cari vendor sampai hitung budget, semua bisa kalian atur di satu tempat. Jadi, nggak perlu pusing sendiri atau takut ada biaya yang kelewat.
          </p>
          <div className="hero-in flex flex-wrap items-center justify-center gap-x-7 gap-y-4" style={delay(360)}>
            <a href={OFFER_HREF} className="btn h-[54px] bg-white px-7 text-base text-ink hover:bg-primary-soft">
              {CTA_LABEL} <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
            </a>
            <a href="#cara-kerja" className="inline-flex items-center gap-2 border-b border-white/60 pb-1 text-base font-semibold">
              Kenalan dengan Bridesmap <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
            </a>
          </div>
          <p className="hero-in text-sm text-[#E3E8DA]" style={delay(440)}>
            Biar persiapannya nggak bikin lupa menikmati masa-masa menuju hari bahagia.
          </p>
        </div>

        <div aria-hidden className="hero-in mt-auto flex flex-wrap items-end justify-between gap-5 pt-14" style={delay(560)}>
          <div className={cn(glass, 'flex flex-[1_1_260px] flex-col gap-3 sm:flex-[0_1_300px]')}>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Tamu kalian</span>
              <span className="text-[#D5DCCB]">320 diundang</span>
            </div>
            {[['Hadir', '68%', '#C9D4BA', '218'], ['Menunggu', '26%', '#E7D8B8', '84'], ['Berhalangan', '6%', '#E8B9AB', '18']].map(([l, w, c, n]) => (
              <div key={l} className="flex items-center gap-2.5 text-[13px]">
                <span className="w-[76px]">{l}</span>
                <div className="h-[5px] flex-1 rounded-full bg-white/15">
                  <div className="h-[5px] rounded-full" style={{ width: w, background: c }} />
                </div>
                <span className="w-7 text-right tabular-nums">{n}</span>
              </div>
            ))}
          </div>
          <div className="hidden flex-col items-center gap-2 pb-2 text-sm text-[#E3E8DA] lg:flex">
            <span>Less Wedding Stress. More Time Together.</span>
            <ChevronDown className="size-5 animate-bounce" strokeWidth={1.6} />
          </div>
          <div className={cn(glass, 'hidden flex-[0_1_300px] items-center gap-4 sm:flex')}>
            <div className="[&_circle:first-child]:stroke-white/20 [&_text]:fill-white">
              <Ring value={65} max={100} size={72} label="65 persen budget terpakai" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-[#D5DCCB]">Budget kalian</span>
              <span className="text-xl font-semibold tabular-nums">Rp 41.500.000</span>
              <span className="text-[13px] text-[#D5DCCB]">Masih ada ruang untuk hal-hal yang kalian impikan</span>
            </div>
          </div>
        </div>
      </section>

      <ul className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-x-10 gap-y-3 px-4 py-6 text-sm text-body">
        {BELIEFS.map((b) => (
          <li key={b} className="flex items-center gap-2">
            <Check className="size-4 text-primary" strokeWidth={2.2} aria-hidden /> {b}
          </li>
        ))}
      </ul>

      <main className="mx-auto flex max-w-[1200px] flex-col px-[clamp(8px,2vw,24px)]">
        {/* Cara kerja */}
        <section id="cara-kerja" className="flex scroll-mt-6 flex-col gap-14 pb-28 pt-20">
          <SectionHead
            align="center"
            eyebrow="Semudah ini, lho"
            title="Dari mulai menyusun mimpi,"
            italic="sampai akhirnya bilang “I do”."
            text="Tentukan tanggal, hitung budget, dan mulai susun daftar tamu. Semua keputusan dan persiapan kalian tersimpan rapi, jadi nggak perlu bolak-balik cari catatan."
          />
          <HowItWorks ctaHref={OFFER_HREF} ctaLabel={CTA_LABEL} />
        </section>

        {/* Ruang kerja bersama */}
        <section id="fitur" className="flex scroll-mt-6 flex-col gap-8 rounded-[28px] bg-primary p-[clamp(24px,5vw,56px)] text-white">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead tone="dark" eyebrow="Semua Persiapan, Satu Tempat" title="Nggak perlu buka banyak catatan." italic="Semuanya ada di sini." />
            <p data-reveal style={delay(100)} className="max-w-[380px] text-base leading-relaxed text-[#E3E8DA]">
              Mulai dari budget, daftar tamu, pembayaran vendor, sampai checklist. Kalian berdua bisa lihat semuanya tanpa harus saling tanya, “Yang kemarin sudah sampai mana?”
            </p>
          </div>
          <div role="tablist" aria-label="Contoh tampilan" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TABS.map((t, i) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === i}
                onClick={() => setTab(i)}
                className={cn('min-h-14 rounded-2xl px-5 text-left text-[15px] transition-colors duration-200', tab === i ? 'bg-muted font-semibold text-ink' : 'border border-white/20 bg-white/5 font-medium hover:bg-white/10')}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="rounded-[20px] border border-white/15 bg-white/5 p-4 sm:p-6">
            <div key={tab} className="animate-fade-up">
              <WorkspacePreview tab={tab} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[#D5DCCB]">Contoh tampilan dengan data fiktif. Angka di rencana kalian akan berbeda.</p>
            <a href={OFFER_HREF} className="btn h-auto min-h-12 max-w-full whitespace-normal bg-white px-6 py-3 text-center text-ink hover:bg-primary-soft">
              {CTA_LABEL} <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
            </a>
          </div>
        </section>

        {/* Koleksi undangan */}
        <section id="undangan" className="mt-28 flex scroll-mt-6 flex-col gap-12 overflow-hidden rounded-[28px] bg-muted px-[clamp(20px,4vw,56px)] py-[clamp(40px,6vw,72px)]">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHead
              eyebrow="Wedding Invitation"
              title="Undangan cantik yang bikin orang"
              italic="nggak sabar datang."
              text="Pilih desain favorit, masukkan foto dan cerita kalian, lalu kirim undangan personal ke orang-orang yang ingin kalian ajak merayakan hari istimewa ini."
            />
            <ul data-reveal style={delay(100)} className="flex flex-col gap-3 text-[15px] text-body">
              {['Setiap tamu punya link undangannya sendiri', 'Pantau konfirmasi kehadiran dan ucapan dari tamu', 'Detail acara langsung tersusun dari rundown'].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-primary" strokeWidth={2.2} aria-hidden /> {t}
                </li>
              ))}
              <li className="pt-1">
                <span className="badge-accent">Already Included</span>
              </li>
            </ul>
          </div>
          <InvitationCarousel />
        </section>

        {/* Fitur lain */}
        <section className="flex flex-col gap-12 pb-8 pt-28">
          <SectionHead
            eyebrow="Semua persiapan ada di sini"
            title="Dari urusan tamu"
            italic="sampai rencana honeymoon."
            text="Karena persiapan pernikahan di Indonesia bukan cuma soal venue dan dekorasi. Ada urusan KUA, seserahan, keluarga, akad, resepsi, sampai obrolan berdua."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} data-reveal style={delay((i % 4) * 80)} className="flex flex-col gap-3 rounded-[24px] border border-border bg-card p-6">
                <span className="grid size-11 place-items-center rounded-[14px] bg-primary-soft text-on-primary-soft">
                  <f.icon className="size-[22px]" strokeWidth={1.8} aria-hidden />
                </span>
                <h3 className="font-sans text-[17px] font-semibold">{f.title}</h3>
                <p className="text-[14px] leading-relaxed text-body">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRD #11: testimoni hanya tampil kalau sudah ada pasangan nyata yang tertaut akunnya. */}
        {TESTIMONIALS.length > 0 && (
          <section className="flex flex-col items-center gap-4 border-t border-border py-20 text-center">
            <p className="max-w-[760px] font-serif text-[clamp(28px,3.6vw,40px)] leading-[1.2]">“{TESTIMONIALS[0].quote}”</p>
            <a href={TESTIMONIALS[0].url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              {TESTIMONIALS[0].name} · {TESTIMONIALS[0].city}
            </a>
          </section>
        )}

        {/* Penawaran */}
        <section id="penawaran" className="mt-20 flex scroll-mt-6 flex-col gap-10 rounded-[28px] bg-primary-soft p-[clamp(24px,5vw,56px)]">
          <SectionHead
            eyebrow="Your Wedding Plan Starts Here"
            title="Semua yang kalian butuhkan"
            italic="untuk menuju hari-H."
            text="Nggak perlu beli banyak tools atau pakai aplikasi terpisah. Semua kebutuhan persiapan pernikahan sudah ada dalam satu paket, termasuk undangan digital."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {OFFER.phases.map((p, i) => (
              <OfferCard key={p.name} phase={p} index={i} />
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="grid scroll-mt-6 gap-10 pb-8 pt-28 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <SectionHead eyebrow="Sebelum mulai, mungkin kalian penasaran..." title="Masih ada yang bikin penasaran?" italic="Yuk, cari tahu." />
            <p data-reveal className="max-w-[360px] text-[15px] leading-relaxed text-body">
              Masih ada yang ingin ditanyakan? Jangan ragu hubungi kami. Kami siap bantu menjelaskan.
            </p>
            <a data-reveal href={'mailto:' + LEGAL.contactEmail} className="link-arrow self-start">
              Hubungi kami <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
            </a>
          </div>
          <Faq items={LANDING_FAQ} />
        </section>

        {/* Alat gratis */}
        <section className="flex flex-col gap-12 pt-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead eyebrow="Free Wedding Planning Tools" title="Mulai dari yang paling bikin" italic="penasaran." />
            <Link data-reveal to="/alat" className="link-arrow">
              Coba Semua Tools Gratis <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TOOLS.map((t, k) => (
              <Link key={t.to} to={t.to} data-reveal style={delay(k * 110)} className="group flex flex-col overflow-hidden rounded-[24px] border border-border bg-card transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]">
                <div className="grid min-h-[230px] place-items-center bg-muted p-6">{t.visual}</div>
                <div className="flex flex-1 flex-col gap-2 p-6">
                  <span className="eyebrow">{t.eyebrow}</span>
                  <h3 className="text-[28px] leading-[1.05]">{t.title}</h3>
                  <p className="flex-1 text-[15px] leading-relaxed text-body">{t.text}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primary">
                    {t.cta} <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={1.8} aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Cerita kami */}
        <section className="mt-28 grid gap-10 rounded-[28px] bg-muted p-[clamp(24px,5vw,64px)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-14">
          <SectionHead eyebrow="A Little Story Behind Bridesmap" title="Jangan sampai sibuk menyiapkan pernikahan," italic="sampai lupa menikmati masa-masa sebelum menikah." />
          <div data-reveal style={delay(120)} className="flex flex-col gap-5 text-[17px] leading-relaxed text-body lg:pt-8">
            <p>Dari lamaran sampai hari akad, ada banyak hal yang harus dipersiapkan. Memilih venue, mencari vendor, mengatur budget, sampai menghadapi keinginan keluarga. Tapi di tengah semua itu, jangan sampai kalian lupa kalau ini adalah salah satu masa paling spesial dalam perjalanan cinta kalian.</p>
            <p>Karena itu, Bridesmap hadir untuk membantu semua persiapan jadi lebih mudah diatur. Biar kalian nggak menghabiskan setiap waktu bersama hanya untuk membahas tagihan dan urusan pernikahan. Masih ada banyak cerita yang bisa kalian buat sebelum akhirnya mengucapkan janji sehidup semati.</p>
            <Link to="/tentang" className="link-arrow mt-2 self-start">
              Kenapa Bridesmap Ada <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden />
            </Link>
          </div>
        </section>

        {/* Penutup */}
        <section className="my-28 flex flex-col items-center gap-6 rounded-[28px] bg-[#2B3627] px-6 py-[clamp(56px,8vw,96px)] text-center text-white">
          <p data-reveal className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D5DCCB] sm:text-xs sm:tracking-[0.18em]">Your Wedding Journey Starts Here</p>
          <h2 data-reveal style={delay(100)} className="text-[32px] leading-[1.05] text-white sm:text-[clamp(38px,5.6vw,68px)] sm:leading-[1]">
            Fokus ke hari bahagianya.
            <br />
            <span className="italic">Biar urusan persiapannya, Bridesmap bantu.</span>
          </h2>
          <p data-reveal style={delay(200)} className="max-w-[460px] text-[17px] leading-relaxed text-[#E3E8DA]">
            Mulai persiapkan hari istimewa kalian tanpa harus mengorbankan waktu berharga bersama pasangan.
          </p>
          <a data-reveal style={delay(300)} href={OFFER_HREF} className="btn h-auto min-h-[54px] max-w-full whitespace-normal bg-white px-7 py-3 text-center text-base text-ink hover:bg-primary-soft">
            Yuk, Mulai Susun Wedding Dream Kalian <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
          </a>
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
