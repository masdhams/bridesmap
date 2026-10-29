import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Check, ChevronDown, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { docProgress } from '../../lib/documents'
import { CalendarButtons, ConfirmButton, Field, FilterChips, Modal, PageHeader, PartnerAvatar, RoundButton, Segmented } from '../../components/ui'
import { PHASES } from '../../data/content'
import { taskDue, timelineCompressed } from '../../lib/selectors'
import { CATEGORIES, categoryOf, taskCategoryOf } from '../../lib/taskCategory'
import { Select } from '../../components/select'
import { usePlan, useSession } from '../../lib/store'
import type { Assignee, Task } from '../../lib/types'
import { cn, daysUntil, fmtDate, todayISO, uid } from '../../lib/utils'
import { celebrate } from '../../lib/celebrate'

// Label fase versi ringkas untuk tab (layar Checklist di desain).
const PHASE_SHORT: Record<string, string> = {
  [PHASES[0]]: 'H-12 s.d. 9 bln',
  [PHASES[1]]: 'H-9 s.d. 6 bln',
  [PHASES[2]]: 'H-6 s.d. 3 bln',
  [PHASES[3]]: 'H-3 s.d. 1 bln',
  [PHASES[4]]: 'Bulan terakhir',
  [PHASES[5]]: 'Minggu hari-H',
  [PHASES[6]]: 'Hari-H & setelahnya',
}

export function phaseFor(offset: number) {
  if (offset >= 0) return PHASES[6]
  if (offset >= -7) return PHASES[5]
  if (offset >= -30) return PHASES[4]
  if (offset >= -90) return PHASES[3]
  if (offset >= -180) return PHASES[2]
  if (offset >= -270) return PHASES[1]
  return PHASES[0]
}

function AssigneeBadge({ who }: { who?: Assignee }) {
  const { partnerA, partnerB } = usePlan((s) => s.profile)
  if (!who) return null
  if (who === 'both')
    return (
      <span className="flex shrink-0" aria-label="Ditugaskan ke berdua" title="Berdua">
        <PartnerAvatar who="A" name={partnerA} ring="border-2 border-card" />
        <span className="-ml-2">
          <PartnerAvatar who="B" name={partnerB} ring="border-2 border-card" />
        </span>
      </span>
    )
  return (
    <span aria-label={`Ditugaskan ke ${who === 'A' ? partnerA : partnerB}`} title={who === 'A' ? partnerA : partnerB}>
      <PartnerAvatar who={who} name={who === 'A' ? partnerA : partnerB} />
    </span>
  )
}

/** Tampilan per kategori: tiap kategori bisa dibuka, menampilkan progres dan tugas yang belum selesai lebih dulu. */
function CategoryView({ tasks, profile, Row, openCat, setOpenCat }: { tasks: Task[]; profile: { weddingDate: string }; Row: (p: { t: Task }) => ReactNode; openCat: string | null; setOpenCat: (k: string | null) => void }) {
  const groups = CATEGORIES.map((c) => {
    const list = tasks.filter((t) => taskCategoryOf(t) === c.key).sort((a, b) => Number(a.done) - Number(b.done) || a.offsetDays - b.offsetDays)
    return { ...c, list, done: list.filter((t) => t.done).length }
  }).filter((g) => g.list.length > 0)

  return (
    <div className="flex flex-col gap-2.5">
      {groups.map((g) => {
        const firstOpen = groups.find((x) => x.done < x.list.length)?.key
        const open = openCat === null ? g.key === firstOpen : openCat === g.key
        const late = g.list.filter((t) => !t.done && daysUntil(taskDue(profile.weddingDate, t.offsetDays, t.custom)) < 0).length
        return (
          <section key={g.key} className="overflow-hidden rounded-[20px] border border-border bg-card">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenCat(open ? '' : g.key)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold">{g.label}</span>
                  {g.done === g.list.length && <Check className="size-4 text-success-solid" strokeWidth={2.6} aria-label="selesai" />}
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <span className="block h-full rounded-full bg-primary transition-[width] duration-70 bar-grow0 bar-grow" style={{ width: `${(g.done / g.list.length) * 100}%` }} />
                </span>
                <span className={cn('text-xs', late ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
                  {g.done} dari {g.list.length} selesai{late ? ` · ${late} terlambat` : ''}
                </span>
              </span>
              <ChevronDown className={cn('size-[18px] shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.8} aria-hidden />
            </button>
            {open && (
              <ul className="border-t border-divider">
                {g.list.map((t) => (
                  <Row key={t.id} t={t} />
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

export default function Checklist() {
  const { tasks, profile, documents, update, add, remove } = usePlan()
  const me = useSession((s) => s.me)
  const done = tasks.filter((t) => t.done).length
  const late = tasks.filter((t) => !t.done && daysUntil(taskDue(profile.weddingDate, t.offsetDays, t.custom)) < 0).length
  // Tab awal: fase dari tugas terdekat yang belum selesai.
  const firstOpen = [...tasks].filter((t) => !t.done).sort((a, b) => a.offsetDays - b.offsetDays)[0]
  const [phase, setPhase] = useState<string>(firstOpen?.phase ?? PHASES[0])
  const [showDone, setShowDone] = useState(false)
  const [draft, setDraft] = useState<(Partial<Task> & { date: string; categoryTouched?: boolean }) | null>(null)
  const [view, setView] = useState<'timeline' | 'kategori'>('timeline')
  const [openCat, setOpenCat] = useState<string | null>(null)
  // Tugas yang baru dicentang tetap di tempatnya sebentar supaya animasi coret dan pitanya terlihat.
  const [justDone, setJustDone] = useState<string | null>(null)
  const toggle = (t: Task, checked: boolean, el: Element) => {
    if (!checked) return update('tasks', t.id, { done: false, doneBy: undefined, autoDone: false })
    const lastInPhase = tasks.filter((x) => x.phase === t.phase && !x.done).length === 1
    celebrate(el, { big: lastInPhase })
    setJustDone(t.id)
    window.setTimeout(() => {
      update('tasks', t.id, { done: true, doneBy: me, autoDone: false })
      setJustDone(null)
    }, 650)
  }

  const inPhase = tasks.filter((t) => t.phase === phase).sort((a, b) => a.offsetDays - b.offsetDays)
  const open = inPhase.filter((t) => !t.done)
  const finished = inPhase.filter((t) => t.done)
  const phaseDone = (p: string) => {
    const list = tasks.filter((t) => t.phase === p)
    return list.length > 0 && list.every((t) => t.done)
  }

  const save = () => {
    if (!draft?.title) return
    const offsetDays = differenceInCalendarDays(parseISO(draft.date), parseISO(profile.weddingDate))
    const patch = { title: draft.title, offsetDays, phase: phaseFor(offsetDays), assignee: draft.assignee, note: draft.note, category: draft.category, custom: true }
    if (draft.id) update('tasks', draft.id, patch)
    else add('tasks', { id: uid(), ...patch, done: false, custom: true })
    setDraft(null)
    setPhase(patch.phase)
  }

  const Row = ({ t }: { t: Task }) => {
    const due = taskDue(profile.weddingDate, t.offsetDays, t.custom)
    const d = daysUntil(due)
    const soon = !t.done && d >= 0 && d <= 7
    const prog = docProgress(t.id, documents)
    const pending = justDone === t.id
    return (
      <li className="flex min-h-16 items-center gap-3 border-b border-divider px-3.5 py-2.5 last:border-0">
        <input type="checkbox" className={cn(pending && 'animate-pop')} checked={t.done || pending} aria-label={`Tandai "${t.title}" selesai`} onChange={(e) => !pending && toggle(t, e.target.checked, e.currentTarget)} />
        <button className="flex min-w-0 flex-1 flex-col gap-[3px] text-left" onClick={() => setDraft({ ...t, date: due, category: taskCategoryOf(t), categoryTouched: !!t.category })}>
          <span className={cn('text-sm font-semibold', t.done && 'font-medium text-muted-foreground line-through', pending && 'text-muted-foreground')}>
            <span className={cn(pending && 'strike-draw')}>{t.title}</span>
          </span>
          <span className={cn('text-xs', !t.done && d < 0 ? 'font-semibold text-destructive' : soon ? 'font-semibold text-warning' : 'text-muted-foreground')}>
            {fmtDate(due, soon || d < 0 ? 'EEEE, d MMM' : 'd MMM yyyy')}
            {!t.done && d < 0 && ' · terlambat'}
            {soon && (d === 0 ? ' · hari ini' : ` · ${d} hari lagi`)}
            {t.note && ` · ${t.note}`}
            {t.done && t.doneBy && ` · selesai oleh ${t.doneBy === 'A' ? profile.partnerA : profile.partnerB}`}
          </span>
          {prog.total > 0 && (
            <span className="text-xs text-primary">
              {t.done && t.autoDone ? 'Selesai otomatis dari Administrasi' : `Dokumen: ${prog.ready} dari ${prog.total} sudah ada`}
            </span>
          )}
        </button>
        {prog.total > 0 && (
          <Link to="/app/administrasi" className="btn-soft btn-sm shrink-0 !px-3" aria-label={`Buka Administrasi untuk "${t.title}"`}>
            <FolderOpen className="size-4" aria-hidden />
            <span className="hidden sm:inline">{prog.ready}/{prog.total}</span>
          </Link>
        )}
        <AssigneeBadge who={t.assignee} />
      </li>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3.5">
      <PageHeader
        back="/app"
        title="Checklist"
        subtitle={timelineCompressed(profile.weddingDate) ? `Hari-H ${fmtDate(profile.weddingDate, 'd MMMM yyyy')} kurang dari 12 bulan lagi, jadi jadwal dipadatkan: tugas pertama mulai hari ini.` : `Timeline H-12 bulan s.d. hari-H. Tanggal menyesuaikan hari-H ${fmtDate(profile.weddingDate, 'd MMMM yyyy')}.`}
        actions={
          <>
            <RoundButton label="Tambah tugas" onClick={() => setDraft({ title: '', date: todayISO(), assignee: 'both', category: 'lainnya' })}>
              <Plus className="size-[18px]" strokeWidth={2} />
            </RoundButton>
          </>
        }
      />

      <section className="flex flex-col gap-2.5 rounded-[20px] border border-border bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            <span className="text-[22px] font-semibold text-ink tabular-nums">{done}</span> dari {tasks.length} tugas selesai
          </span>
          <span className={cn('text-[13px] font-semibold', late ? 'text-destructive' : 'text-success')}>{late ? `${late} terlambat` : 'Sesuai jadwal'}</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div className="h-2 rounded-full bg-primary transition-[width] duration-70 bar-grow0 bar-grow" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
        </div>
      </section>

      <Segmented
        label="Tampilan checklist"
        value={view}
        onChange={setView}
        options={[
          { value: 'timeline', label: 'Timeline' },
          { value: 'kategori', label: 'Kategori' },
        ]}
      />

      {view === 'kategori' ? (
        <CategoryView tasks={tasks} profile={profile} Row={Row} openCat={openCat} setOpenCat={setOpenCat} />
      ) : (
      <>
      <FilterChips
        label="Fase persiapan"
        value={phase}
        onChange={(p) => {
          setPhase(p)
          setShowDone(false)
        }}
        options={PHASES.map((p) => ({
          value: p,
          label: (
            <>
              {phaseDone(p) && <Check className="size-3.5 text-success-solid" strokeWidth={2.6} aria-label="selesai" />}
              {PHASE_SHORT[p]}
            </>
          ),
        }))}
      />

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-sans text-[15px] font-semibold">Belum selesai</h2>
          <span className="text-xs text-muted-foreground">{inPhase.length} tugas di fase ini</span>
        </div>
        {open.length === 0 ? (
          <p className="rounded-[20px] border border-border bg-card px-4 py-5 text-sm text-muted-foreground">Semua tugas di fase ini sudah selesai.</p>
        ) : (
          <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
            {open.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </ul>
        )}
      </section>

      {finished.length > 0 && (
        <section className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={showDone}
            onClick={() => setShowDone((v) => !v)}
            className="flex min-h-[52px] items-center justify-between rounded-2xl border border-border bg-muted px-4 text-sm font-semibold text-body"
          >
            Selesai di fase ini ({finished.length})
            <ChevronDown className={cn('size-[18px] transition-transform duration-200', showDone && 'rotate-180')} strokeWidth={1.8} aria-hidden />
          </button>
          {showDone && (
            <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
              {finished.map((t) => (
                <Row key={t.id} t={t} />
              ))}
            </ul>
          )}
        </section>
      )}

      </>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Ubah tugas' : 'Tugas baru'}
        footer={
          <>
            {draft?.id && draft.custom && (
              <ConfirmButton className="btn-ghost mr-auto text-destructive" onConfirm={() => { remove('tasks', draft.id!); setDraft(null) }}>
                <Trash2 className="size-4" aria-hidden /> Hapus
              </ConfirmButton>
            )}
            <button className="btn-ghost" onClick={() => setDraft(null)}>Batal</button>
            <button className="btn-primary" onClick={save} disabled={!draft?.title}>Simpan</button>
          </>
        }
      >
        <Field label="Tugas" htmlFor="tt"><input id="tt" className="input" value={draft?.title ?? ''} onChange={(e) => setDraft({ ...draft!, title: e.target.value, category: draft?.categoryTouched ? draft.category : categoryOf(e.target.value) })} placeholder="mis. Booking bus keluarga" /></Field>
        <Field label="Kategori" htmlFor="tc" hint="Ditebak dari judul. Ubah kalau kurang tepat.">
          <Select id="tc" value={draft?.category ?? 'lainnya'} onChange={(v) => setDraft({ ...draft!, category: v, categoryTouched: true })} options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} />
        </Field>
        <Field label="Deadline" htmlFor="td"><input id="td" type="date" className="input" value={draft?.date ?? ''} onChange={(e) => setDraft({ ...draft!, date: e.target.value })} /></Field>
        <div>
          <p className="label">Dikerjakan oleh</p>
          <Segmented
            label="Dikerjakan oleh"
            value={draft?.assignee ?? 'both'}
            onChange={(assignee) => setDraft({ ...draft!, assignee })}
            options={[{ value: 'both', label: 'Berdua' }, { value: 'A', label: profile.partnerA }, { value: 'B', label: profile.partnerB }]}
          />
        </div>
        <Field label="Catatan" htmlFor="tn"><input id="tn" className="input" value={draft?.note ?? ''} onChange={(e) => setDraft({ ...draft!, note: e.target.value })} placeholder="mis. siapkan berkas N1–N4" /></Field>
        {draft?.id && draft.date && (
          <div>
            <p className="label">Pengingat</p>
            <CalendarButtons event={{ uid: `task-${draft.id}`, title: draft.title ?? '', date: draft.date }} />
          </div>
        )}
      </Modal>
    </div>
  )
}
