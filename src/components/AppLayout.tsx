import { MapPin, Menu } from 'lucide-react'
import { IcBudget, IcGuests, IcHome, IcLove, IcVendor } from './icons'
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
    <header className="no-print sticky top-0 z-30 flex h-[68px] items-center justify-between gap-3 bg-background/80 px-5 backdrop-blur-md lg:hidden">
      <Link to="/app/lainnya" aria-label="Semua fitur" className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-ink shadow-[var(--shadow-soft)]">
        <Menu className="size-5" strokeWidth={1.8} aria-hidden />
      </Link>
      <Link to="/app" className="font-serif text-[22px] tracking-[0.02em]">
        Brides<span className="italic text-primary">map</span>
      </Link>
      {/* Avatar pasangan = pengganti pengguna aktif di perangkat ini. */}
      <button type="button" onClick={() => setMe(other)} className="flex min-h-11 shrink-0 items-center" aria-label={`Sedang dipakai ${name(me)}. Ketuk untuk ganti ke ${name(other)}`}>
        {(['A', 'B'] as const).map((p, i) => (
          <span key={p} className={cn('rounded-full shadow-[var(--shadow-soft)]', i > 0 && '-ml-3', me === p ? 'relative z-10' : 'opacity-60')}>
            <PartnerAvatar who={p} name={name(p)} size={38} ring={cn('border-2', me === p ? 'border-card' : 'border-background')} />
          </span>
        ))}
      </button>
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
    <div className="app-shell min-h-dvh lg:flex lg:gap-3 lg:bg-muted lg:p-3">
      {/* Sidebar desktop: panel bulat mengambang di atas latar Kain. */}
      <aside className="no-print hidden lg:sticky lg:top-3 lg:flex lg:h-[calc(100dvh-1.5rem)] lg:w-64 lg:shrink-0 lg:flex-col lg:rounded-[28px] lg:border lg:border-border lg:bg-card lg:shadow-[var(--shadow-soft)]">
        <div className="px-5 pt-6 pb-3">
          <Link to="/app" aria-label="Beranda Bridesmap" className="px-1">
            <Logo className="text-xl" />
          </Link>
          <div className="mt-5 rounded-[18px] bg-muted px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">
              {profile.partnerA} &amp; {profile.partnerB}
            </p>
            {Number.isFinite(days) && days >= 0 && (
              <p className="font-serif text-2xl leading-tight text-ink">
                {days} <span className="italic text-primary">hari lagi</span>
              </p>
            )}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-5" aria-label="Navigasi utama">
          {NAV_GROUPS.map((g) => (
            <div key={g.title} className="mt-3">
              <p className="eyebrow px-3 pb-1 text-[10.5px]">{g.title}</p>
              {g.items.map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === '/app'}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-10 items-center gap-3 rounded-full px-3.5 text-[13.5px]',
                      isActive ? 'bg-primary font-semibold text-on-primary shadow-[var(--shadow-tab)]' : 'font-medium text-body hover:bg-muted hover:text-ink',
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

      <div className="flex min-w-0 flex-1 flex-col lg:min-h-[calc(100dvh-1.5rem)] lg:rounded-[28px] lg:border lg:border-border lg:bg-background">
        {!FOCUS_ROUTES.includes(pathname) && <MobileTopBar />}
        {/* Bar atas desktop. */}
        <header className="no-print sticky top-3 z-30 hidden items-center justify-between gap-3 rounded-t-[28px] bg-background/90 px-10 py-3 shadow-[0_-12px_0_0_var(--color-muted)] backdrop-blur lg:flex">
          {profile.city ? (
            <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[13px] font-medium text-body">
              <MapPin className="size-4 text-primary" strokeWidth={1.8} aria-hidden />
              {profile.city}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <PartnerSwitch />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-4 pb-32 sm:px-6 lg:px-10 lg:pt-6 lg:pb-14">
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
        <ul className="mx-auto flex max-w-md justify-between rounded-[28px] bg-card px-2 py-2 shadow-[0_8px_32px_rgb(34_38_31/0.12)]">
          {BOTTOM.map((b) => {
            const active = b.match(pathname)
            return (
              <li key={b.to} className="flex-1">
                <Link
                  to={b.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]', active ? 'font-semibold text-primary' : 'font-medium text-muted-foreground')}
                >
                  <span className={cn('grid h-8 w-14 place-items-center rounded-full transition-colors duration-200', active && 'bg-primary-soft')}>
                    <b.icon className="size-[22px]" strokeWidth={1.8} aria-hidden />
                  </span>
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
