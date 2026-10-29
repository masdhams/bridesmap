import { Check, Mail, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStartSteps } from '../../components/StartHere'
import { PageHeader } from '../../components/ui'
import { LEGAL } from '../../data/content'
import { GUIDE_CONTACT, GUIDE_FAQ, GUIDE_INTRO } from '../../data/guide'
import { NAV_GROUPS } from '../../components/nav'
import { usePlan } from '../../lib/store'
import { cn } from '../../lib/utils'

/** Halaman Panduan: data contoh, mulai cepat, fitur, pertanyaan umum, dan kontak. Teks ada di src/data/guide.ts. */
export default function Guide() {
  const steps = useStartSteps()
  const { hash } = useLocation()
  const s = usePlan()
  const hasDemo = s.vendors.some((v) => v.name.endsWith('(contoh)')) || s.guests.some((g) => g.name.endsWith('(contoh)'))

  // Tautan seperti /app/panduan#mulai langsung menggulir ke bagian itu.
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader back="/app" title="Panduan" subtitle={GUIDE_INTRO} />

      <section aria-labelledby="h-contoh" className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <h2 id="h-contoh" className="font-sans text-[15px] font-semibold">
            Data contoh
          </h2>
          <p className="mt-0.5 text-sm text-body">
            {hasDemo
              ? 'Vendor dan tamu contoh masih ada. Hapus kalau sudah selesai melihat-lihat.'
              : 'Ingin melihat app terisi dulu? Isi contoh vendor dan tamu, lalu hapus kapan saja.'}
          </p>
        </div>
        {hasDemo ? (
          <button className="btn-outline btn-sm shrink-0 self-start sm:self-center" onClick={s.clearDemo}>
            Hapus data contoh
          </button>
        ) : (
          <button className="btn-soft btn-sm shrink-0 self-start sm:self-center" onClick={s.loadDemo}>
            <Sparkles className="size-4" aria-hidden /> Isi data contoh
          </button>
        )}
      </section>

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

      <section id="fitur" aria-labelledby="h-fitur" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="h-fitur" className="text-[26px]">
          Fitur <span className="italic">di Bridesmap</span>
        </h2>
        {NAV_GROUPS.map((g) => (
          <div key={g.title} className="flex flex-col gap-2">
            <p className="eyebrow">{g.title}</p>
            <ul className="card flex flex-col divide-y divide-line">
              {g.items
                .filter((item) => item.to !== '/app' && item.to !== '/app/panduan')
                .map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-muted">
                      <span className="text-[15px] font-semibold">{item.label}</span>
                      {item.desc && <span className="text-sm text-body">{item.desc}</span>}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </section>

      <section id="tanya" aria-labelledby="h-tanya" className="flex scroll-mt-24 flex-col gap-3">
        <h2 id="h-tanya" className="text-[26px]">
          Pertanyaan <span className="italic">umum</span>
        </h2>
        {GUIDE_FAQ.map((f) => (
          <details key={f.id} className="card p-4">
            <summary className="cursor-pointer list-none text-[15px] font-semibold">{f.q}</summary>
            <p className="mt-2 text-sm leading-relaxed text-body">{f.a}</p>
          </details>
        ))}
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
