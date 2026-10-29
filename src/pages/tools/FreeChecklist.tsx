import { addMonths, format } from 'date-fns'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicPage } from '../../components/PublicLayout'
import { Field, Progress } from '../../components/ui'
import { PHASES, TASK_TEMPLATES } from '../../data/content'
import { taskDue } from '../../lib/selectors'
import { cn, daysUntil, fmtDate } from '../../lib/utils'

const KEY = 'bridesmap-free-checklist'

export default function FreeChecklist() {
  const [date, setDate] = useState(() => format(addMonths(new Date(), 9), 'yyyy-MM-dd'))
  const [done, setDone] = useState<Record<number, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? '{}')
    } catch {
      return {}
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(done))
    } catch {
      /* penyimpanan tidak tersedia */
    }
  }, [done])
  const count = Object.values(done).filter(Boolean).length

  return (
    <PublicPage>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link to="/alat" className="text-sm font-semibold text-primary hover:underline">← Alat gratis</Link>
        <h1 className="mt-2 text-5xl font-semibold">Checklist persiapan nikah</h1>
        <p className="mt-2 text-muted-foreground">{TASK_TEMPLATES.length} tugas dari H-12 bulan sampai setelah hari-H. Masukkan tanggal hari-H untuk melihat deadline tiap tugas.</p>

        <div className="card mt-6 flex flex-wrap items-end gap-4 p-5">
          <div className="flex-1 min-w-48"><Field label="Tanggal hari-H" htmlFor="d"><input id="d" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field></div>
          <div className="flex-1 min-w-48">
            <p className="text-sm font-semibold">{count}/{TASK_TEMPLATES.length} selesai</p>
            <div className="mt-2"><Progress value={count} max={TASK_TEMPLATES.length} label="Progres" /></div>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {PHASES.map((phase) => (
            <section key={phase}>
              <h2 className="mb-3 text-2xl">{phase}</h2>
              <ul className="card divide-y divide-border/60 px-4">
                {TASK_TEMPLATES.map((t, i) => ({ t, i })).filter(({ t }) => t.phase === phase).map(({ t, i }) => {
                  const due = date ? taskDue(date, t.offsetDays) : ''
                  const late = !done[i] && daysUntil(due) < 0
                  return (
                    <li key={i}>
                      <label className="flex min-h-12 cursor-pointer items-start gap-3 py-3">
                        <input type="checkbox" className="mt-0.5 shrink-0" checked={!!done[i]} onChange={(e) => setDone({ ...done, [i]: e.target.checked })} />
                        <span>
                          <span className={cn('block text-[15px]', done[i] && 'text-muted-foreground line-through')}>{t.title}</span>
                          {due && <span className={cn('block text-xs', late ? 'font-semibold text-destructive' : 'text-muted-foreground')}>{fmtDate(due, 'EEE, d MMM yyyy')}{late && ' · terlambat'}</span>}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="card mt-8 flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm"><strong>Mau pengingat Google Calendar &amp; kerja berdua?</strong> <span className="text-muted-foreground">Simpan ke rencana gratis.</span></p>
          <Link to={`/mulai?tanggal=${date}`} className="btn-primary">Buat rencana <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </section>
    </PublicPage>
  )
}
