import { Check, Heart } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type BuildStep = { label: string; detail: string }

const STEP_MS = 1100
const GAP_MS = 180

/** Layar jeda setelah onboarding: tiap bagian rencana "disusun" bergiliran sebelum ringkasan tampil. */
export function PlanBuilder({ steps, initials, onDone }: { steps: BuildStep[]; initials: [string, string]; onDone: () => void }) {
  const [elapsed, setElapsed] = useState(0)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    const fast = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const total = steps.length * (STEP_MS + GAP_MS) + 500
    if (fast) {
      setElapsed(total)
      const t = window.setTimeout(() => done.current(), 600)
      return () => window.clearTimeout(t)
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const e = now - start
      setElapsed(e)
      if (e < total) raf = requestAnimationFrame(tick)
      else done.current()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [steps.length])

  // Persen tiap bagian: berjalan cepat di awal lalu melambat, seperti sedang menghitung.
  const pctOf = (i: number) => {
    const t = (elapsed - i * (STEP_MS + GAP_MS)) / STEP_MS
    if (t <= 0) return 0
    if (t >= 1) return 100
    return Math.round((1 - Math.pow(1 - t, 2.2)) * 100)
  }
  const active = steps.findIndex((_, i) => pctOf(i) < 100)
  const current = steps[active === -1 ? steps.length - 1 : active]

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-16" role="status" aria-live="polite">
        <h1 className="text-center text-[34px] leading-[1.05]">
          Menyusun rencana
          <br />
          <span className="italic text-accent">kalian berdua…</span>
        </h1>

        <ul className="mt-10 flex flex-col gap-6">
          {steps.map((s, i) => {
            const pct = pctOf(i)
            const finished = pct >= 100
            return (
              <li key={s.label} className={i > active && active !== -1 ? 'opacity-55 transition-opacity' : 'transition-opacity'}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold">{s.label}</span>
                  {finished ? (
                    <span className="animate-pop grid size-6 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3.5" strokeWidth={2.8} aria-label="selesai" />
                    </span>
                  ) : (
                    <span className="text-[13px] tabular-nums text-muted-foreground">{pct}%</span>
                  )}
                </div>
                <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>

        <p key={current.detail} className="animate-fade-up mt-8 min-h-12 text-center text-[14px] leading-relaxed text-body">
          {active === -1 ? 'Selesai. Rencana kalian sudah siap.' : current.detail}
        </p>

        <div aria-hidden className="mt-auto flex items-center justify-center pt-8">
          <span className="grid size-14 place-items-center rounded-full bg-primary-soft font-serif text-[22px] text-on-primary-soft">{initials[0]}</span>
          <span className="-mx-2 z-10 grid size-9 place-items-center rounded-full bg-accent text-white">
            <Heart className="size-4 animate-pulse" strokeWidth={1.8} fill="currentColor" />
          </span>
          <span className="grid size-14 place-items-center rounded-full bg-accent-soft font-serif text-[22px] text-accent-ink">{initials[1]}</span>
        </div>
      </div>
    </div>
  )
}
