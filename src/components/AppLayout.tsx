import { IcAllFeatures, IcBudget, IcGuests, IcHome, IcLove, IcVendor } from './icons'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { usePlan, useSession, useStorageStatus } from '../lib/store'
import { cn, daysUntil } from '../lib/utils'
import { NAV_GROUPS } from './nav'
import { Logo, PartnerAvatar } from './ui'

// Navigasi bawah mengikuti Komponen UI: Beranda · Budget · Vendor · Tamu · Momen.
const BOTTOM = [
  { to: '/app', label: 'Beranda', icon: IcHome, match: (p: string) => p === '/app' },
  { to: '/app/budget', label: 'Budget', icon: IcBudget, match: (p: string) => p.startsWith('/app/budget') || p.startsWith('/app/tabungan') || p.startsWith('/app/seserahan') },
  { to: '/app/vendor', label: 'Vendor', icon: IcVendor, match: (p: string) => p.startsWith('/app/vendor') },
  { to: '/app/tamu', label: 'Tamu', icon: IcGuests, match: (p: string) => p.startsWith('/app/tamu') || p.startsWith('/app/tempat-duduk') || p.startsWith('/app/undangan') },
  {
    to: '/app/berdua',
    label: 'Momen',
    icon: IcLove,
    match: (p: string) => ['/app/berdua', '/app/deep-talk', '/app/surat', '/app/vision-board', '/app/honeymoon'].some((x) => p.startsWith(x)),
  },
]

const FOCUS_ROUTES = ['/app/surat/tulis']

export function PartnerSwitch() {
  const { partnerA, partnerB } = usePlan((s) => s.profile)
  const { me, setMe } = useSession()
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted p-1 text-xs" role="radiogroup" aria-label="Kamu sedang memakai sebagai">
      {(['A', 'B'] as const).map((p) => (
        <button
          key={p}
          role="radio"
          aria-checked={me === p}
          onClick={() => setMe(p)}
          className={cn('flex min-h-8 max-w-[9rem] items-center gap-2 rounded-full py-1 pl-1 pr-3', me === p ? 'bg-card font-semibold text-ink shadow-[var(--shadow-tab)]' : 'font-medium text-body opacity-75 hover:text-ink hover:opacity-100')}
        >
          <PartnerAvatar who={p} name={(p === 'A' ? partnerA : partnerB) || '?'} size={24} />
          <span className="truncate">{p === 'A' ? partnerA : partnerB}</span>
        </button>
      ))}
    </div>
  )
}

/** Bar atas mobile yang tetap terlihat saat berpindah menu dan saat halaman di-scroll. */
function MobileTopBar() {
  const { partnerA, partnerB } = usePlan((x) => x.profile)
  const { me, setMe } = useSession()
  const other = me === 'A' ? 'B' : 'A'
  const name = (p: 'A' | 'B') => (p === 'A' ? partnerA : partnerB)
  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/95 px-5 backdrop-blur lg:hidden">
      <Link to="/app" className="font-serif text-[22px] tracking-[0.02em]">
        Brides<span className="italic">map</span>
      </Link>
      <div className="flex items-center gap-2">
        {/* Avatar pasangan = pengganti pengguna aktif di perangkat ini. */}
        <button type="button" onClick={() => setMe(other)} className="flex min-h-11 items-center" aria-label={`Sedang dipakai ${name(me)}. Ketuk untuk ganti ke ${name(other)}`}>
          {(['A', 'B'] as const).map((p, i) => (
            <span key={p} className={cn(i > 0 && '-ml-2.5', me === p ? 'relative z-10' : 'opacity-60')}>
              <PartnerAvatar who={p} name={name(p)} size={36} ring={cn('border-2', me === p ? 'border-primary' : 'border-background')} />
            </span>
          ))}
        </button>
        <Link to="/app/lainnya" aria-label="Semua fitur" className="grid size-11 place-items-center rounded-full border border-border bg-card text-ink">
          <IcAllFeatures className="size-5" />
        </Link>
      </div>
    </header>
  )
}

export default function AppLayout() {
  const profile = usePlan((s) => s.profile)
  const seedDocuments = usePlan((s) => s.seedDocuments)
  // Rencana lama (dibuat sebelum ada Administrasi) mendapat daftar dokumen awal satu kali.
  useEffect(() => {
    if (profile.onboarded && !profile.docsSeeded) seedDocuments()
  }, [profile.onboarded, profile.docsSeeded, seedDocuments])
  const { pathname } = useLocation()
  const days = daysUntil(profile.weddingDate)
  const storageFull = useStorageStatus((s) => s.full)

  return (
    <div className="min-h-dvh lg:flex">
      {/* Sidebar desktop */}
      <aside className="no-print sticky top-0 hidden h-dvh lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-background">
        <div className="px-6 pt-7 pb-4">
          <Link to="/app" aria-label="Beranda Bridesmap">
            <Logo className="text-xl" />
          </Link>
          <div className="mt-5 rounded-[18px] bg-muted px-4 py-3">
            <p className="text-sm font-semibold text-ink truncate">
              {profile.partnerA} &amp; {profile.partnerB}
            </p>
            {Number.isFinite(days) && days >= 0 && (
              <p className="font-serif text-2xl leading-tight text-ink">
                {days} <span className="italic text-primary">hari lagi</span>
              </p>
            )}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Navigasi utama">
          {NAV_GROUPS.map((g) => (
            <div key={g.title} className="mt-4">
              <p className="eyebrow px-3 pb-1.5 text-[11px]">{g.title}</p>
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === '/app'}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-full px-4 text-sm',
                      isActive ? 'bg-primary-soft font-semibold text-on-primary-soft' : 'font-medium text-body hover:bg-muted hover:text-ink',
                    )
                  }
                >
                  <it.icon className="size-[18px]" strokeWidth={1.8} aria-hidden />
                  {it.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {!FOCUS_ROUTES.includes(pathname) && <MobileTopBar />}
        {/* Bar atas desktop. */}
        <header className="no-print sticky top-0 z-30 hidden items-center justify-between gap-3 border-b border-border bg-background/90 px-10 py-2.5 backdrop-blur lg:flex">
          <span className="text-sm text-muted-foreground">{profile.city}</span>
          <PartnerSwitch />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 pt-4 pb-32 sm:px-6 lg:px-10 lg:pt-10 lg:pb-14">
          {storageFull && (
            <div role="alert" className="no-print mb-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger-ink">
              <strong>Penyimpanan di perangkat ini penuh</strong> — perubahan terbaru belum tersimpan. Hapus beberapa foto, atau{' '}
              <Link to="/app/pengaturan" className="font-semibold underline">ekspor data di Pengaturan</Link>.
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {/* Navigasi bawah mobile — disembunyikan di layar fokus seperti menulis surat */}
      <nav className={cn('no-print fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden', FOCUS_ROUTES.includes(pathname) && 'hidden')} aria-label="Navigasi bawah">
        <ul className="mx-auto flex max-w-md justify-between rounded-[24px] border border-border bg-card p-2 shadow-[var(--shadow-lift)]">
          {BOTTOM.map((b) => {
            const active = b.match(pathname)
            return (
              <li key={b.to} className="flex-1">
                <Link
                  to={b.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] text-[11px]',
                    active ? 'bg-primary-soft font-semibold text-on-primary-soft' : 'font-medium text-body',
                  )}
                >
                  <b.icon className="size-[22px]" strokeWidth={1.8} aria-hidden />
                  {b.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
