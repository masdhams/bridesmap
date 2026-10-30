import { Camera, Heart, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RoseBackdrop } from '../../components/berdua'
import { IcDeepTalk, IcHoneymoon, IcLetter } from '../../components/icons'
import { ConfirmButton, Field, Modal } from '../../components/ui'
import { usePlan, useSession } from '../../lib/store'
import type { Moment } from '../../lib/types'
import { cn, compressImage, daysUntil, fmtDate, todayISO, uid } from '../../lib/utils'
import { deepTalkIndex } from './DeepTalk'

const tilt = (i: number) => (i % 2 === 0 ? '-rotate-[1.5deg]' : 'rotate-[1.5deg]')

/** Pita perekat dekoratif di atas kartu. */
const Tape = ({ className }: { className?: string }) => <span aria-hidden className={cn('absolute h-6 w-20 rounded-[3px] opacity-80', className)} />

/** Halaman "Momen": foto pasangan, status Deep Talk, pintasan fitur, dan perjalanan kita. */
export default function Berdua() {
  const { profile, setProfile, deepTalk, moments, capsules, honeymoon, add, update, remove } = usePlan()
  const me = useSession((s) => s.me)
  const [draft, setDraft] = useState<Partial<Moment> | null>(null)
  const name = (p: 'A' | 'B') => (p === 'A' ? profile.partnerA : profile.partnerB)
  const other = me === 'A' ? 'B' : 'A'
  const dt = deepTalk[deepTalkIndex(profile.createdAt)] ?? {}
  const list = [...(moments ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const daysToWedding = daysUntil(profile.weddingDate)

  const status =
    dt[me] && dt[other]
      ? { title: 'Kalian sudah saling bercerita', body: 'Yuk, baca jawaban satu sama lain dan lanjutkan obrolannya.' }
      : dt[other]
        ? { title: `${name(other)} sudah bercerita`, body: 'Sekarang giliranmu. Jawab pertanyaan hari ini untuk membuka cerita kalian.' }
        : dt[me]
          ? { title: 'Jawabanmu sudah tersimpan', body: `Tinggal menunggu ${name(other)} ikut menjawab.` }
          : { title: 'Ada obrolan baru untuk kalian', body: 'Satu pertanyaan kecil setiap hari, untuk saling mengenal lebih dalam.' }

  const unlocked = capsules.filter((c) => daysUntil(c.unlockDate) <= 0).length
  const shortcuts = [
    { to: '/app/deep-talk', label: 'Deep Talk', sub: 'Satu pertanyaan untuk dibahas setiap hari', icon: IcDeepTalk },
    { to: '/app/surat', label: 'Surat untuk Nanti', sub: capsules.length ? `${capsules.length} surat menunggu${unlocked ? ` · ${unlocked} siap dibaca` : ''}` : 'Tulis surat untuk dibaca di hari yang kalian pilih', icon: IcLetter },
    { to: '/app/honeymoon', label: 'Honeymoon', sub: honeymoon.destination || 'Rencanakan honeymoon', icon: IcHoneymoon },
  ]

  const saveMoment = () => {
    if (!draft?.title?.trim() || !draft.date) return
    const m = { title: draft.title.trim(), date: draft.date, photo: draft.photo }
    if (draft.id) update('moments', draft.id, m)
    else add('moments', { id: uid(), ...m })
    setDraft(null)
  }

  return (
    <RoseBackdrop wide>
      <div className="grid gap-6 lg:grid-cols-[19rem_1fr] lg:gap-x-12 lg:gap-y-8">
        <header className="pt-2 text-center lg:col-span-2">
          <h1 className="text-[48px] leading-none text-accent">Momen</h1>
          <p className="mt-2 text-sm italic text-accent-ink">Setiap perjalanan punya cerita yang layak dikenang.</p>
          <p className="mt-1 text-sm text-ink">
            Selamat merayakan cinta, <strong>{profile.partnerA}</strong> &amp; <strong>{profile.partnerB}</strong>
          </p>
        </header>

        <div className="flex flex-col gap-6 lg:self-start">
        {/* Foto pasangan ala polaroid */}
        <div className="relative mx-auto w-full max-w-[17rem] pt-4">
          <Tape className="left-1/2 top-0 z-10 -translate-x-1/2 -rotate-2 bg-[#EBD9A8]" />
          <label className="group block cursor-pointer rotate-[1deg] rounded-[6px] bg-card p-3 pb-4 shadow-[var(--shadow-lift)] focus-within:ring-2 focus-within:ring-accent">
            <span className="relative grid aspect-square place-items-center overflow-hidden rounded-[4px] bg-muted">
              {profile.couplePhoto ? (
                <img src={profile.couplePhoto} alt={`Foto ${profile.partnerA} & ${profile.partnerB}`} className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Camera className="size-7" strokeWidth={1.6} aria-hidden />
                  <span className="text-sm">Tambahkan foto kalian</span>
                </span>
              )}
              {profile.couplePhoto && (
                <span className="absolute bottom-2 right-2 grid size-9 place-items-center rounded-full bg-card/90 text-ink shadow">
                  <Pencil className="size-4" aria-hidden />
                </span>
              )}
            </span>
            <span className="mt-3 block text-center font-serif text-2xl text-ink">Kita, hari ini</span>
            <input type="file" accept="image/*" className="sr-only" aria-label="Ganti foto kalian" onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) setProfile({ couplePhoto: await compressImage(f, 700, 0.7) })
              e.target.value = ''
            }} />
          </label>
        </div>

        {/* Status Deep Talk */}
        <Link to="/app/deep-talk" className="relative block rounded-[10px] bg-[#F2D5D8] px-5 pb-4 pt-5 text-[#6B2F3F] shadow-[var(--shadow-soft)] transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]">
          <Tape className="-top-2.5 right-6 rotate-3 bg-[#E3B9C0]" />
          <p className="text-[17px] font-semibold">{status.title}</p>
          <p className="mt-1 text-sm leading-relaxed">{status.body}</p>
          <p className="mt-2 text-xs font-semibold underline underline-offset-4">Lanjutkan Deep Talk</p>
        </Link>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
        {/* Pintasan fitur */}
        <nav aria-label="Fitur berdua" className="grid gap-2.5">
          {shortcuts.map((s) => (
            <Link key={s.to} to={s.to} className="flex min-h-[68px] items-center gap-3.5 rounded-[18px] border border-white/70 bg-white/60 px-4 py-3 transition-colors duration-200 hover:bg-white/90">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white">
                <s.icon className="size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-semibold">{s.label}</span>
                <span className="truncate text-xs text-body">{s.sub}</span>
              </span>
            </Link>
          ))}
        </nav>

        {/* Perjalanan kita */}
        <section aria-labelledby="timeline">
          <div className="flex items-center justify-between">
            <h2 id="timeline" className="font-sans text-base font-semibold">Perjalanan kita</h2>
            <button className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-accent" onClick={() => setDraft({ title: '', date: todayISO() })}>
              <Plus className="size-4" aria-hidden /> Tambah momen
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-x-3.5 gap-y-5 px-1 pb-4 pt-3 sm:grid-cols-3">
            {list.map((m, i) => (
              <li key={m.id}>
                <button onClick={() => setDraft(m)} className={cn('w-full rounded-[6px] bg-card p-2 pb-3 text-left shadow-[var(--shadow-soft)] transition-transform duration-200 hover:rotate-0', tilt(i))} aria-label={`Ubah momen ${m.title}`}>
                  <span className="grid aspect-square place-items-center overflow-hidden rounded-[3px] bg-accent-soft text-accent">
                    {m.photo ? <img src={m.photo} alt="" className="size-full object-cover" /> : <Heart className="size-7" strokeWidth={1.6} aria-hidden />}
                  </span>
                  <span className="mt-2 block text-sm font-semibold leading-tight">{m.title}</span>
                  <span className="block text-xs text-muted-foreground">{fmtDate(m.date, 'd MMMM yyyy')}</span>
                </button>
              </li>
            ))}
            {profile.weddingDate && (
              <li>
                <div className={cn('rounded-[6px] bg-primary p-2 pb-3 text-white shadow-[var(--shadow-soft)]', tilt(list.length))}>
                  <span className="grid aspect-square place-items-center rounded-[3px] bg-white/10">
                    <Heart className="size-7 fill-white" strokeWidth={1.6} aria-hidden />
                  </span>
                  <span className="mt-2 block text-sm font-semibold leading-tight">Hari-H</span>
                  <span className="block text-xs text-[#D5DCCB]">{fmtDate(profile.weddingDate, profile.dateTentative ? 'MMMM yyyy' : 'd MMMM yyyy')}{daysToWedding > 0 && ` · ${daysToWedding} hari lagi`}</span>
                </div>
              </li>
            )}
          </ul>
          {list.length === 0 && <p className="text-sm text-body">Ada momen yang ingin kalian kenang? Simpan di sini, mulai dari pertama bertemu, hari jadian, sampai lamaran.</p>}
        </section>
        </div>
      </div>

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Ubah momen' : 'Momen baru'}
        footer={<>
          {draft?.id && <ConfirmButton className="btn-ghost text-destructive" onConfirm={() => { remove('moments', draft.id!); setDraft(null) }}><Trash2 className="size-4" aria-hidden /> Hapus</ConfirmButton>}
          <button className="btn-ghost" onClick={() => setDraft(null)}>Batal</button>
          <button className="btn-accent" onClick={saveMoment} disabled={!draft?.title?.trim() || !draft?.date}>Simpan</button>
        </>}>
        <Field label="Nama momen" htmlFor="mt"><input id="mt" className="input" value={draft?.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="mis. Pertama kali bertemu" /></Field>
        <Field label="Tanggal" htmlFor="md"><input id="md" type="date" className="input" value={draft?.date ?? ''} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
        <div>
          <span className="label">Foto (opsional)</span>
          <div className="flex items-center gap-3">
            {draft?.photo && <img src={draft.photo} alt="" className="size-16 rounded-xl object-cover" />}
            <label className="btn-outline btn-sm">
              <Camera className="size-4" aria-hidden /> {draft?.photo ? 'Ganti foto' : 'Pilih foto'}
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) setDraft({ ...draft, photo: await compressImage(f, 500, 0.65) })
                e.target.value = ''
              }} />
            </label>
            {draft?.photo && <button className="btn-ghost btn-sm" onClick={() => setDraft({ ...draft, photo: undefined })}>Hapus foto</button>}
          </div>
        </div>
      </Modal>
    </RoseBackdrop>
  )
}
