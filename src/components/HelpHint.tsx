// Bantuan kontekstual singkat: satu-dua kalimat + tautan ke halaman Panduan.
import { Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

export function HelpHint({ children, to = '/app/panduan#mulai', className }: { children: ReactNode; to?: string; className?: string }) {
  return (
    <p className={cn('flex max-w-sm items-start gap-2 rounded-2xl bg-muted/70 px-4 py-3 text-left text-sm leading-relaxed text-body', className)}>
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.8} aria-hidden />
      <span>
        {children}{' '}
        <Link to={to} className="font-semibold text-primary underline-offset-4 hover:underline">
          Baca panduan
        </Link>
      </span>
    </p>
  )
}
