import { Menu, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BRAND, LEGAL } from '../data/content'
import { usePlan } from '../lib/store'
import { cn } from '../lib/utils'
import { Logo } from './ui'

const LINKS = [
  { to: '/#fitur', label: 'Fitur' },
  { to: '/#penawaran', label: 'Penawaran' },
  { to: '/tentang', label: 'Tentang & kebijakan' },
]

export function PublicHeader() {
  const onboarded = usePlan((s) => s.profile.onboarded)
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Bridesmap — beranda">
          <Logo className="text-xl" />
        </Link>
        <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-primary-soft transition-colors duration-200">
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to={onboarded ? '/app' : '/#penawaran'} className="btn-primary btn-sm whitespace-nowrap sm:min-h-10 sm:px-4 sm:text-sm">
            {onboarded ? 'Buka rencana' : 'Lihat penawaran'}
          </Link>
          <button className="icon-btn md:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <nav className={cn('md:hidden border-t border-border/60 px-4 pb-3', open ? 'block' : 'hidden')} aria-label="Navigasi seluler">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="flex min-h-11 items-center text-[15px] font-medium text-ink">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

/** Footer ala layar Landing: logo + tagline di kiri, tautan kepercayaan di kanan. */
export function PublicFooter() {
  return (
    <footer className="mx-auto max-w-[1200px] border-t border-border px-[clamp(16px,2vw,24px)] pb-12 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-col gap-1">
          <span className="font-serif text-2xl">
            Brides<span className="italic">map</span>
          </span>
          <span className="text-sm text-muted-foreground">{BRAND.tagline}</span>
        </div>
        <nav aria-label="Tautan kaki" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-body">
          <Link className="hover:text-ink" to="/#fitur">Fitur</Link>
          <Link className="hover:text-ink" to="/#undangan">Undangan</Link>
          <Link className="hover:text-ink" to="/#penawaran">Penawaran</Link>
          <Link className="hover:text-ink" to="/tentang#privasi">Privasi</Link>
          <Link className="hover:text-ink" to="/tentang#pembuat">Our Story</Link>
          <a className="hover:text-ink" href={'mailto:' + LEGAL.contactEmail}>Contact Us</a>
        </nav>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">© {new Date().getFullYear()} {BRAND.product} · dibuat oleh {LEGAL.maker}</p>
    </footer>
  )
}

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
