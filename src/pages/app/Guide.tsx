import { Check, Mail, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStartSteps } from '../../components/StartHere'
import { PageHeader } from '../../components/ui'
import { LEGAL } from '../../data/content'
import { GUIDE_CONTACT, GUIDE_FAQ, GUIDE_INTRO, GUIDE_TOPICS } from '../../data/guide'
import { NAV_GROUPS } from '../../components/nav'
import { usePlan } from '../../lib/store'
import { cn } from '../../lib/utils'
import { DEMO, exitDemo } from '../../lib/demo'

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
            {DEMO
              ? 'Kalian sedang melihat demo. Semua halaman bisa dibuka, tapi tidak ada yang bisa diubah.'
              : 'Ingin melihat Bridesmap yang sudah terisi penuh? Buka demo rencana pernikahan contoh di tab baru. Demo hanya untuk dilihat, rencana kalian tidak berubah.'}
          </p>
          {hasDemo && !DEMO && (
            <button className="mt-2 text-sm font-semibold text-primary underline-offset-4 hover:underline" onClick={s.clearDemo}>
              Hapus data contoh lama
            </button>
          )}
        </div>
        {DEMO ? (
          <button className="btn-outline btn-sm shrink-0 self-start sm:self-center" onClick={exitDemo}>
            Keluar demo
          </button>
        ) : (
          <a href="/demo" target="_blank" rel="noopener" className="btn-soft btn-sm shrink-0 self-start sm:self-center">
            <Sparkles className="size-4" aria-hidden /> Lihat demo
          </a>
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

      {GUIDE_TOPICS.map((t) => (
        <section key={t.id} id={t.id} aria-labelledby={`h-${t.id}`} className="flex scroll-mt-24 flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h2 id={`h-${t.id}`} className="text-[26px]">
                {t.title} <span className="italic">{t.italic}</span>
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-body">{t.intro}</p>
            </div>
            <Link to={t.to} className="btn-outline btn-sm shrink-0 self-start">
              {t.cta}
            </Link>
          </div>
          <div className="grid gap-3">
            {t.blocks.map((b) => {
              const List = b.ordered ? 'ol' : 'ul'
              return (
                <div key={b.heading} className="card p-4 sm:p-5">
                  <p className="eyebrow">{b.heading}</p>
                  <List className="mt-3 flex flex-col gap-2.5">
                    {b.items.map((it, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-body">
                        {b.ordered ? (
                          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-on-primary-soft">
                            {i + 1}
                          </span>
                        ) : (
                          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                        <span className="min-w-0">{it}</span>
                      </li>
                    ))}
                  </List>
                </div>
              )
            })}
          </div>
        </section>
      ))}

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
