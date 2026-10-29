import { ArrowRight, CircleAlert, Heart, Lock, Menu, Receipt, X } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ring } from '../components/cards'
import { PublicFooter } from '../components/PublicLayout'
import { TASK_TEMPLATES, TESTIMONIALS } from '../data/content'
import { usePlan } from '../lib/store'
import { cn, fmtDate } from '../lib/utils'

const NAV = [
  { href: '#fitur', label: 'Fitur' },
  { href: '/alat', label: 'Alat gratis' },
  { href: '/tentang', label: 'Cerita kami' },
  { href: '/tentang#privasi', label: 'Privasi' },
]

const FEATURES = [
  { icon: CircleAlert, tone: 'bg-accent-soft text-accent', title: 'Hidden cost terlihat dari awal', text: 'Transportasi keluarga, konsumsi vendor, seragam, dana cadangan. Semua masuk ke budget sebelum jadi kejutan.' },
  { icon: Receipt, tone: 'bg-warning-soft text-warning', title: 'Jejak setiap pembayaran vendor', text: 'DP, termin, pelunasan, dan bukti transfer tersimpan rapi, dengan pengingat kalender sebelum jatuh tempo.' },
  { icon: Heart, tone: 'bg-primary-soft text-on-primary-soft', title: 'Dikerjakan berdua, bukan sendirian', text: 'Satu rencana untuk kalian berdua. Plus Deep Talk harian untuk obrolan yang sering tertunda.' },
]

const TABS = ['Seluruh rencana', 'Budget & pembayaran', 'Tamu & RSVP', 'Deep Talk & Surat untuk Nanti'] as const

const FAQ = [
  { q: 'Apakah Bridesmap menjamin vendor saya aman?', a: 'Tidak. Kami bukan rekening bersama/escrow dan tidak menjamin vendor. Yang kami bantu: jadwal pembayaran yang jelas, pengingat, dan jejak bukti transfer yang rapi.' },
]

const glass = 'rounded-[22px] border border-white/20 bg-white/12 p-5'

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

export default function Landing() {
  const onboarded = usePlan((s) => s.profile.onboarded)
  const [menu, setMenu] = useState(false)
  const [tab, setTab] = useState(0)
  const startTo = onboarded ? '/app' : '/mulai'
  const startLabel = onboarded ? 'Buka rencana' : 'Buat rencana gratis'

  return (
    <div className="min-h-dvh bg-background px-3 pt-3">
      {/* Hero gelap dengan navigasi di dalamnya (layar Landing di desain) */}
      <section className="relative flex flex-col gap-14 overflow-hidden rounded-[28px] bg-[#2B3627] px-5 pb-8 pt-6 text-white sm:px-[clamp(20px,4vw,48px)]">
        <nav aria-label="Navigasi situs" className="flex items-center justify-between gap-4">
          <Link to="/" className="font-serif text-[26px] tracking-[0.02em]">
            Brides<span className="italic">map</span>
          </Link>
          <div className="hidden items-center gap-7 text-[15px] md:flex">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} className="transition-opacity duration-200 hover:opacity-75">
                {n.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link to={startTo} className="btn hidden h-12 min-h-12 bg-white px-[22px] text-ink hover:bg-primary-soft sm:inline-flex">
              {startLabel} <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
            </Link>
            <button className="grid size-11 place-items-center rounded-full border border-white/25 md:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Menu">
              {menu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
        {menu && (
          <div className="-mt-10 flex flex-col rounded-2xl bg-white/10 p-2 md:hidden">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} onClick={() => setMenu(false)} className="flex min-h-11 items-center rounded-xl px-3 text-[15px] hover:bg-white/10">
                {n.label}
              </a>
            ))}
          </div>
        )}

        <div className="mx-auto mt-2 flex max-w-[860px] flex-col items-center gap-6 text-center sm:mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E3E8DA]">Perencana pernikahan gratis untuk berdua</p>
          <h1 className="text-[clamp(44px,7vw,96px)] leading-[0.98] tracking-[-0.015em] text-white">
            Rencanakan dengan sadar.
            <br />
            <span className="italic">Rayakan cerita kalian.</span>
          </h1>
          <p className="max-w-[560px] text-[17px] leading-relaxed text-[#E9ECE3] sm:text-lg">
            Budget, vendor, pembayaran, tamu, dan checklist dalam satu rencana. Mulai gratis, kerjakan berdua, tanpa biaya yang diam-diam membengkak.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <Link to={startTo} className="btn h-[54px] bg-white px-7 text-base text-ink hover:bg-primary-soft">
              {startLabel} <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
            </Link>
            <a href="#fitur" className="border-b border-white/60 pb-1 text-base font-semibold">
              Lihat cara kerjanya
            </a>
          </div>
        </div>

        <div aria-hidden className="flex flex-wrap items-end justify-between gap-5">
          <div className={cn(glass, 'flex flex-[0_1_300px] flex-col gap-3')}>
            <div className="flex justify-between text-sm">
              <span className="font-semibold">Tamu kalian</span>
              <span className="text-[#D5DCCB]">320 diundang</span>
            </div>
            {[['Hadir', '68%', '#C9D4BA', '218'], ['Menunggu', '26%', '#E7D8B8', '84']].map(([l, w, c, n]) => (
              <div key={l} className="flex items-center gap-2.5 text-[13px]">
                <span className="w-16">{l}</span>
                <div className="h-[5px] flex-1 rounded-full bg-white/15">
                  <div className="h-[5px] rounded-full" style={{ width: w, background: c }} />
                </div>
                <span>{n}</span>
              </div>
            ))}
          </div>
          <div className={cn(glass, 'flex flex-[0_1_300px] items-center gap-4')}>
            <div className="[&_circle:first-child]:stroke-white/20 [&_text]:fill-white">
              <Ring value={65} max={100} size={72} label="65 persen budget terpakai" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-[#D5DCCB]">Budget kalian</span>
              <span className="text-xl font-semibold tabular-nums">Rp 41.500.000</span>
              <span className="text-[13px] text-[#D5DCCB]">sisa untuk hal-hal baik</span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-[clamp(8px,2vw,24px)]">
        <section id="fitur" className="flex scroll-mt-6 flex-col gap-12 pb-24 pt-28">
          <div className="flex flex-col items-center gap-3 text-center">
            <h2 className="text-[clamp(36px,5vw,56px)] leading-[1.02]">
              Kendali penuh atas uang,
              <br />
              <span className="italic">tanpa drama di belakang.</span>
            </h2>
            <p className="max-w-[560px] text-[17px] leading-relaxed text-body">Dirancang untuk dua hal yang paling sering bikin pasangan pusing: budget yang bengkak dan vendor yang bermasalah.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-3.5 rounded-[24px] border border-border bg-card p-7">
                <span className={cn('grid size-12 place-items-center rounded-[14px]', f.tone)}>
                  <f.icon className="size-6" strokeWidth={1.8} aria-hidden />
                </span>
                <h3 className="font-sans text-[19px] font-semibold">{f.title}</h3>
                <p className="text-[15px] leading-relaxed text-body">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-8 rounded-[28px] bg-primary p-[clamp(24px,5vw,56px)] text-white">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D5DCCB]">Ruang kerja bersama</p>
              <h2 className="text-[clamp(32px,4.4vw,48px)] leading-[1.05] text-white">
                Dari rencana pertama
                <br />
                <span className="italic">sampai hari-H.</span>
              </h2>
            </div>
            <p className="max-w-[380px] text-base leading-relaxed text-[#E3E8DA]">Isi tanggal, jumlah tamu, dan budget. Bridesmap menyusun langkah berikutnya untuk kalian.</p>
          </div>
          <div role="tablist" aria-label="Contoh tampilan" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TABS.map((t, i) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === i}
                onClick={() => setTab(i)}
                className={cn('min-h-14 rounded-2xl px-5 text-left text-[15px]', tab === i ? 'bg-muted font-semibold text-ink' : 'border border-white/20 bg-white/5 font-medium hover:bg-white/10')}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="rounded-[20px] border border-white/15 bg-white/5 p-4 sm:p-6">
            <WorkspacePreview tab={tab} />
          </div>
          <p className="text-center text-xs text-[#D5DCCB]">Contoh tampilan dengan data fiktif. Angka di rencana kalian akan berbeda.</p>
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

        <section className="mx-auto flex max-w-3xl flex-col gap-3 border-t border-border py-16">
          <h2 className="mb-2 text-center text-[clamp(28px,3.6vw,40px)]">
            Pertanyaan <span className="italic">yang sering muncul</span>
          </h2>
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-[20px] border border-border bg-card px-5">
              <summary className="flex min-h-14 list-none items-center justify-between gap-3 font-semibold">
                {f.q}
                <span className="text-xl leading-none text-primary transition-transform duration-200 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-body">{f.a}</p>
            </details>
          ))}
        </section>
      </main>
      <PublicFooter />
    </div>
  )
}
