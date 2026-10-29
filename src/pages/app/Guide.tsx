import { Check, Mail } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStartSteps } from '../../components/StartHere'
import { PageHeader } from '../../components/ui'
import { LEGAL } from '../../data/content'
import { GUIDE_CONTACT, GUIDE_INTRO } from '../../data/guide'
import { cn } from '../../lib/utils'

/** Halaman Panduan: mulai cepat dan kontak. Semua teks ada di src/data/guide.ts (GUIDE_FAQ disimpan untuk nanti). */
export default function Guide() {
  const steps = useStartSteps()
  const { hash } = useLocation()

  // Tautan seperti /app/panduan#mulai langsung menggulir ke bagian itu.
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader back="/app" title="Panduan" subtitle={GUIDE_INTRO} />

      <section id="mulai" aria-labelledby="h-mulai" className="flex scroll-mt-24 flex-col gap-3">
        <h2 id="h-mulai" className="text-[26px]">
          Mulai <span className="italic">cepat</span>
        </h2>
        <ol className="flex flex-col gap-2.5">
          {steps.map((s, i) => (
            <li key={s.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
              <span
                aria-hidden
                className={cn('grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold', s.done ? 'bg-primary text-on-primary' : 'bg-primary-soft text-on-primary-soft')}
              >
                {s.done ? <Check className="size-4" strokeWidth={2.4} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold">
                  {s.title}
                  {s.done && <span className="ml-2 badge-success min-h-5 px-2 align-middle text-[11px]">Selesai</span>}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-body">{s.body}</p>
              </div>
              <Link to={s.to} className="btn-outline btn-sm shrink-0 self-start sm:self-center">
                {s.cta}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section id="kontak" aria-labelledby="h-kontak" className="scroll-mt-24">
        <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-accent-soft text-accent">
            <Mail className="size-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="h-kontak" className="font-sans text-[15px] font-semibold">
              {GUIDE_CONTACT.title}
            </h2>
            <p className="mt-0.5 text-sm text-body">{GUIDE_CONTACT.body}</p>
          </div>
          <a href={`mailto:${LEGAL.contactEmail}`} className="btn-primary btn-sm shrink-0 self-start break-all sm:self-center">
            {LEGAL.contactEmail}
          </a>
        </div>
      </section>
    </div>
  )
}
