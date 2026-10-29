import { ExternalLink, ImagePlus, Link2, Lock, Paperclip, Plus, Search, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IcDocs } from '../../components/icons'
import { Select } from '../../components/select'
import { ConfirmButton, Empty, Field, FilterChips, Modal, PageHeader, PartnerAvatar, Segmented } from '../../components/ui'
import { DOC_GROUPS } from '../../data/content'
import { docProgress } from '../../lib/documents'
import { usePlan, useSession } from '../../lib/store'
import type { Assignee, DocItem, DocStatus } from '../../lib/types'
import { cn, compressImage, fmtDate, uid } from '../../lib/utils'

const STATUS_LABEL: Record<DocStatus, string> = { belum: 'Belum ada', proses: 'Sedang diurus', ada: 'Sudah ada' }
const STATUS_DOT: Record<DocStatus, string> = { belum: 'bg-muted-foreground', proses: 'bg-warning', ada: 'bg-success' }
const STATUS_STYLE: Record<DocStatus, string> = {
  belum: 'bg-muted text-muted-foreground',
  proses: 'bg-warning-soft text-warning',
  ada: 'bg-success-soft text-success',
}

type Draft = Partial<DocItem> & { isNew?: boolean }

export default function Administration() {
  const { documents, tasks, profile, saveDocument, removeDocument } = usePlan()
  const me = useSession((s) => s.me)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'semua' | DocStatus>('semua')
  const [owner, setOwner] = useState<'semua' | Assignee>('semua')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [uploadErr, setUploadErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const nameOf = (a: Assignee) => (a === 'both' ? 'Berdua' : a === 'A' ? profile.partnerA : profile.partnerB)
  const ready = documents.filter((d) => d.status === 'ada').length
  const query = q.trim().toLowerCase()
  const taskTitle = (id?: string) => tasks.find((t) => t.id === id)?.title
  const list = documents.filter(
    (d) =>
      (status === 'semua' || d.status === status) &&
      (owner === 'semua' || d.owner === owner) &&
      (!query || [d.name, d.group, d.note, taskTitle(d.taskId)].some((x) => x?.toLowerCase().includes(query))),
  )
  const groups = [...new Set([...DOC_GROUPS, ...documents.map((d) => d.group)])].map((g) => ({ name: g, items: list.filter((d) => d.group === g) })).filter((g) => g.items.length > 0)
  const autoDoneTasks = tasks.filter((t) => t.done && t.autoDone).length
  const linkedTasks = new Set(documents.map((d) => d.taskId).filter(Boolean)).size

  const patch = (p: Partial<DocItem>) => setDraft((d) => {
    const next = { ...d, ...p }
    // Begitu ada tautan atau file, dokumen dianggap sudah ada (kecuali pengguna mengubah statusnya sendiri).
    if (('url' in p || 'file' in p) && (next.url || next.file) && (next.status ?? 'belum') === 'belum') next.status = 'ada'
    return next
  })

  const pickFile = async (f?: File) => {
    if (!f) return
    setUploadErr('')
    if (!f.type.startsWith('image/')) return setUploadErr('Untuk saat ini baru foto/scan (JPG, PNG). File PDF: tempel tautannya saja.')
    try {
      patch({ file: await compressImage(f, 1400, 0.75), fileName: f.name })
    } catch {
      setUploadErr('Gambar tidak bisa dibaca. Coba file lain.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const save = () => {
    if (!draft?.name?.trim()) return
    const doc: DocItem = {
      id: draft.id ?? uid(),
      name: draft.name.trim(),
      group: draft.group?.trim() || DOC_GROUPS[0],
      owner: draft.owner ?? 'both',
      status: draft.status ?? 'belum',
      url: draft.url?.trim() || undefined,
      file: draft.file,
      fileName: draft.fileName,
      note: draft.note?.trim() || undefined,
      taskId: draft.taskId,
    }
    saveDocument(doc, me)
    setDraft(null)
  }

  const sortedTasks = [...tasks].sort((a, b) => a.offsetDays - b.offsetDays)
  const newDoc = (): Draft => ({ isNew: true, name: '', group: DOC_GROUPS[0], owner: 'both', status: 'belum' })

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3.5">
      <PageHeader
        back="/app"
        title="Administrasi"
        subtitle="Kumpulkan dokumen penting pernikahan di satu tempat. Kalau dokumennya sudah ada, tugas di Checklist ikut selesai."
        actions={
          <button className="btn-primary btn-sm" onClick={() => setDraft(newDoc())}>
            <Plus className="size-4" aria-hidden /> Dokumen
          </button>
        }
      />

      <section className="flex flex-col gap-2.5 rounded-[20px] border border-border bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            <span className="text-[22px] font-semibold text-ink tabular-nums">{ready}</span> dari {documents.length} dokumen sudah ada
          </span>
          {linkedTasks > 0 && (
            <Link to="/app/checklist" className="text-[13px] font-semibold text-primary underline-offset-2 hover:underline">
              {autoDoneTasks} dari {linkedTasks} tugas checklist selesai
            </Link>
          )}
        </div>
        <div className="h-2 rounded-full bg-muted" role="progressbar" aria-label="Kelengkapan dokumen" aria-valuemin={0} aria-valuemax={documents.length} aria-valuenow={ready}>
          <div className="h-2 rounded-full bg-primary transition-[width] duration-700 bar-grow" style={{ width: `${documents.length ? (ready / documents.length) * 100 : 0}%` }} />
        </div>
      </section>

      <p className="flex gap-2.5 rounded-2xl bg-muted px-4 py-3 text-xs leading-relaxed text-body">
        <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>Dokumen disimpan di perangkat ini saja, tidak dikirim ke server. Kalau perangkatnya dipakai bersama, lebih aman tempel tautan dari Google Drive pribadi daripada mengunggah foto KTP.</span>
      </p>

      {documents.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="flex min-h-[50px] items-center gap-2.5 rounded-[14px] border border-input bg-card px-3.5 focus-within:border-primary sm:flex-1">
              <Search className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden />
              <input type="search" className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Cari dokumen, kelompok, atau tugas" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari dokumen" />
            </div>
            <div className="sm:w-56">
              <Select
                id="fo"
                value={owner}
                onChange={(v) => setOwner(v as 'semua' | Assignee)}
                options={[
                  { value: 'semua', label: 'Semua pemilik' },
                  { value: 'A', label: profile.partnerA },
                  { value: 'B', label: profile.partnerB },
                  { value: 'both', label: 'Berdua' },
                ]}
              />
            </div>
          </div>
          <FilterChips
            label="Filter status dokumen"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'semua', label: <>Semua <span className="tabular-nums opacity-70">{documents.length}</span></> },
              ...(Object.keys(STATUS_LABEL) as DocStatus[]).map((s) => ({
                value: s,
                label: (
                  <>
                    <span aria-hidden className={cn('size-2 rounded-full', STATUS_DOT[s])} />
                    {STATUS_LABEL[s]} <span className="tabular-nums opacity-70">{documents.filter((d) => d.status === s).length}</span>
                  </>
                ),
              })),
            ]}
          />
        </div>
      )}

      {documents.length === 0 ? (
        <Empty icon={<IcDocs className="size-6" />} title="Belum ada dokumen" action={<button className="btn-primary" onClick={() => setDraft(newDoc())}>Tambah dokumen pertama</button>}>
          Catat KTP, berkas nikah, sampai kontrak vendor. Tandai yang sudah ada, dan Checklist ikut menyesuaikan.
        </Empty>
      ) : groups.length === 0 ? (
        <div className="card flex flex-col items-start gap-3 p-5 text-sm text-body">
          <p>Tidak ada dokumen yang cocok dengan filter ini.</p>
          <button className="btn-soft btn-sm" onClick={() => { setQ(''); setStatus('semua'); setOwner('semua') }}>Tampilkan semua dokumen</button>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.name} className="flex flex-col gap-2">
            <h2 className="font-sans text-[15px] font-semibold">{g.name}</h2>
            <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
              {g.items.map((d) => {
                const prog = d.taskId ? docProgress(d.taskId, documents) : null
                const task = tasks.find((t) => t.id === d.taskId)
                return (
                  <li key={d.id} className="flex min-h-16 items-center gap-3 border-b border-divider px-3.5 py-2.5 last:border-0">
                    <input
                      type="checkbox"
                      checked={d.status === 'ada'}
                      aria-label={`Tandai "${d.name} ${d.owner === 'both' ? '' : nameOf(d.owner)}" sudah ada`}
                      onChange={(e) => saveDocument({ ...d, status: e.target.checked ? 'ada' : 'belum' }, me)}
                    />
                    <button className="flex min-w-0 flex-1 flex-col gap-[3px] text-left" onClick={() => setDraft({ ...d })}>
                      <span className={cn('flex items-center gap-1.5 text-sm font-semibold', d.status === 'ada' && 'font-medium text-muted-foreground')}>
                        <span className="truncate">{d.name}</span>
                        {d.url && <Link2 className="size-3.5 shrink-0 text-primary" aria-label="Ada tautan" />}
                        {d.file && <Paperclip className="size-3.5 shrink-0 text-primary" aria-label="Ada lampiran foto" />}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {d.owner === 'both' ? 'Berdua' : nameOf(d.owner)}
                        {d.updatedAt && d.status === 'ada' && ` · diubah ${fmtDate(d.updatedAt.slice(0, 10), 'd MMM yyyy')}`}
                        {d.note && ` · ${d.note}`}
                      </span>
                      {task && prog && (
                        <span className="truncate text-xs text-primary">
                          Checklist: {task.title} · {prog.ready}/{prog.total} dokumen{task.done ? ' · selesai' : ''}
                        </span>
                      )}
                    </button>
                    <span className="hidden shrink-0 sm:block">
                      <span className={cn('chip min-h-7 text-xs', STATUS_STYLE[d.status])}>{STATUS_LABEL[d.status]}</span>
                    </span>
                    {d.owner === 'both' ? (
                      <span className="flex shrink-0" aria-hidden>
                        <PartnerAvatar who="A" name={profile.partnerA} ring="border-2 border-card" />
                        <span className="-ml-2"><PartnerAvatar who="B" name={profile.partnerB} ring="border-2 border-card" /></span>
                      </span>
                    ) : (
                      <span className="shrink-0" aria-hidden><PartnerAvatar who={d.owner} name={nameOf(d.owner)} /></span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}

      <Modal
        open={!!draft}
        onClose={() => { setDraft(null); setUploadErr('') }}
        title={draft?.isNew ? 'Dokumen baru' : 'Ubah dokumen'}
        footer={
          <>
            {draft?.id && (
              <ConfirmButton className="btn-ghost mr-auto text-destructive" onConfirm={() => { removeDocument(draft.id!, me); setDraft(null) }}>
                <Trash2 className="size-4" aria-hidden /> Hapus
              </ConfirmButton>
            )}
            <button className="btn-ghost" onClick={() => setDraft(null)}>Batal</button>
            <button className="btn-primary" onClick={save} disabled={!draft?.name?.trim()}>Simpan</button>
          </>
        }
      >
        <Field label="Nama dokumen" htmlFor="dn"><input id="dn" className="input" value={draft?.name ?? ''} onChange={(e) => patch({ name: e.target.value })} placeholder="mis. Akta kelahiran" /></Field>
        <Field label="Kelompok" htmlFor="dg">
          <Select id="dg" value={draft?.group ?? DOC_GROUPS[0]} onChange={(v) => patch({ group: v })} options={[...new Set([...DOC_GROUPS, ...(draft?.group ? [draft.group] : [])])].map((g) => ({ value: g, label: g }))} />
        </Field>
        <div>
          <p className="label">Milik siapa</p>
          <Segmented label="Milik siapa" value={draft?.owner ?? 'both'} onChange={(o) => patch({ owner: o })} options={[{ value: 'both', label: 'Berdua' }, { value: 'A', label: profile.partnerA }, { value: 'B', label: profile.partnerB }]} />
        </div>
        <div>
          <p className="label">Status</p>
          <Segmented label="Status dokumen" value={draft?.status ?? 'belum'} onChange={(s) => patch({ status: s })} options={[{ value: 'belum', label: 'Belum' }, { value: 'proses', label: 'Diurus' }, { value: 'ada', label: 'Sudah ada' }]} />
        </div>
        <Field label="Tautan dokumen" htmlFor="du" hint="Tempel link Google Drive atau penyimpanan lain (cocok untuk PDF).">
          <div className="flex gap-2">
            <input id="du" className="input min-w-0 flex-1" inputMode="url" value={draft?.url ?? ''} onChange={(e) => patch({ url: e.target.value })} placeholder="https://" />
            {draft?.url && /^https?:\/\//i.test(draft.url) && (
              <a className="btn-outline btn-sm self-center" href={draft.url} target="_blank" rel="noreferrer" aria-label="Buka tautan">
                <ExternalLink className="size-4" aria-hidden />
              </a>
            )}
          </div>
        </Field>
        <div>
          <p className="label">Foto / scan</p>
          {draft?.file ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border p-2.5">
              <img src={draft.file} alt={`Lampiran ${draft.name ?? 'dokumen'}`} className="size-16 rounded-xl object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm text-body">{draft.fileName ?? 'Foto dokumen'}</span>
              <button type="button" className="btn-ghost btn-sm" onClick={() => patch({ file: undefined, fileName: undefined })} aria-label="Hapus lampiran">
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <button type="button" className="btn-outline w-full" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="size-4" aria-hidden /> Pilih foto dokumen
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pickFile(e.target.files?.[0])} />
          {uploadErr && <p role="alert" className="mt-1.5 text-xs text-destructive">{uploadErr}</p>}
        </div>
        <Field label="Terhubung ke tugas checklist" htmlFor="dt" hint="Kalau semua dokumen di tugas yang sama sudah ada, tugasnya otomatis selesai.">
          <Select id="dt" value={draft?.taskId ?? 'none'} onChange={(v) => patch({ taskId: v === 'none' ? undefined : v })} options={[{ value: 'none', label: 'Tidak terhubung' }, ...sortedTasks.map((t) => ({ value: t.id, label: t.title }))]} />
        </Field>
        <Field label="Catatan" htmlFor="dc"><input id="dc" className="input" value={draft?.note ?? ''} onChange={(e) => patch({ note: e.target.value })} placeholder="mis. berlaku sampai 2030, asli di lemari" /></Field>
      </Modal>
    </div>
  )
}
