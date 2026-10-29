import { addDays, addYears, format, parseISO } from 'date-fns'
import { CalendarDays, Image, Lock, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RoseBackdrop } from '../../components/berdua'
import { countdown, Envelope, namedMoment } from '../../components/letter'
import { usePlan, useSession } from '../../lib/store'
import type { Assignee } from '../../lib/types'
import { cn, compressImage, fmtDate, todayISO, uid } from '../../lib/utils'

const MAX_PHOTOS = 5
const PAPER_LINES = 'repeating-linear-gradient(transparent 0 31px, rgb(154 78 59 / 0.13) 31px 32px)'

/** Layar "Surat baru": tulis, pilih hari buka, lalu surat dimasukkan ke amplop dan disegel. */
export default function LetterWrite() {
  const { profile, add } = usePlan()
  const me = useSession((s) => s.me)
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const other = me === 'A' ? 'B' : 'A'
  const name = (p: 'A' | 'B') => (p === 'A' ? profile.partnerA : profile.partnerB)

  const today = todayISO()
  const wedding = profile.weddingDate
  const eve = wedding ? format(addDays(parseISO(wedding), -1), 'yyyy-MM-dd') : ''
  const anniv = format(addYears(wedding ? parseISO(wedding) : new Date(), 1), 'yyyy-MM-dd')
  const presets = [
    wedding && wedding > today && { id: 'hari-h', label: 'Hari-H', date: wedding },
    eve && eve > today && { id: 'malam', label: 'Malam sebelum akad', date: eve },
    { id: 'anniv', label: 'Ulang tahun pertama', date: anniv },
  ].filter(Boolean) as { id: string; label: string; date: string }[]

  const fromQuery = params.get('tanggal')
  const initial = fromQuery && fromQuery > today ? fromQuery : presets[0].date
  const [date, setDate] = useState(initial)
  const [custom, setCustom] = useState(!presets.some((p) => p.date === initial))
  const [to, setTo] = useState<Assignee>('both')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [err, setErr] = useState('')
  const [sealing, setSealing] = useState(false)
  const [envOpen, setEnvOpen] = useState(true)

  const valid = date > today
  const cd = countdown(date)
  // Momen bernama (Hari-H, malam sebelum akad, anniversary); tanggal biasa tidak perlu diulang.
  const moment = namedMoment(date, wedding)
  const target = to === 'both' ? 'kita' : to === me ? 'diriku' : name(other)
  const defaultTitle = `Untuk ${target}, ${date === wedding ? 'di hari-H' : date === anniv ? 'di tahun pertama' : `di ${fmtDate(date, 'd MMMM yyyy')}`}`

  const addPhotos = async (files: FileList | null) => {
    if (!files) return
    setErr('')
    try {
      const room = MAX_PHOTOS - photos.length
      const imgs = await Promise.all(Array.from(files).slice(0, room).map((f) => compressImage(f, 900, 0.65)))
      setPhotos([...photos, ...imgs])
    } catch {
      setErr('Ada foto yang tidak bisa dibaca. Coba foto lain.')
    }
  }

  const save = () => {
    if (!message.trim() || !valid) return
    add('capsules', { id: uid(), from: me, to, title: title.trim() || defaultTitle, message: message.trim(), photos, unlockDate: date, createdAt: new Date().toISOString() })
    setSealing(true)
  }

  // Animasi penyegelan: amplop mulai terbuka (surat di luar), lalu menutup; setelah itu kembali ke daftar.
  useEffect(() => {
    if (!sealing) return
    const t1 = window.setTimeout(() => setEnvOpen(false), 120)
    const t2 = window.setTimeout(() => navigate('/app/surat', { replace: true }), 3400)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [sealing, navigate])

  const label = 'text-sm font-semibold'

  return (
    <RoseBackdrop>
      <div className="flex flex-col gap-6">
        <header className="flex h-11 items-center gap-3">
          <Link to="/app/surat" aria-label="Tutup, kembali ke daftar surat" className="grid size-11 shrink-0 place-items-center rounded-full bg-card">
            <X className="size-5" strokeWidth={1.8} />
          </Link>
          <div className="flex flex-1 flex-col">
            <h1 className="font-sans text-[15px] font-semibold leading-tight">Surat baru</h1>
            <span className="text-xs text-accent-ink">Ditulis hari ini, dibuka nanti</span>
          </div>
        </header>

        {/* 1. Untuk siapa */}
        <section className="flex flex-col gap-2" aria-labelledby="w-untuk">
          <p id="w-untuk" className={label}>Surat ini untuk</p>
          <div role="radiogroup" aria-labelledby="w-untuk" className="grid grid-cols-3 gap-1 rounded-full bg-white/60 p-1">
            {([
              { v: 'both', label: 'Kita berdua' },
              { v: other, label: name(other) },
              { v: me, label: 'Diriku' },
            ] as { v: Assignee; label: string }[]).map((o) => (
              <button key={o.v} role="radio" aria-checked={to === o.v} onClick={() => setTo(o.v)} className={cn('min-h-10 truncate rounded-full px-2 text-[13px]', to === o.v ? 'bg-accent font-semibold text-white' : 'font-medium text-body')}>
                {o.label}
              </button>
            ))}
          </div>
        </section>

        {/* 2. Kapan dibuka */}
        <section className="flex flex-col gap-2.5" aria-labelledby="w-buka">
          <p id="w-buka" className={label}>Baru bisa dibuka pada</p>
          <div role="radiogroup" aria-labelledby="w-buka" className="grid gap-2 sm:grid-cols-2">
            {presets.map((p) => {
              const on = !custom && date === p.date
              return (
                <button key={p.id} role="radio" aria-checked={on} onClick={() => { setCustom(false); setDate(p.date) }} className={cn('flex min-h-[60px] flex-col items-start justify-center rounded-2xl border px-4 py-2 text-left', on ? 'border-accent bg-card' : 'border-white/70 bg-white/55')}>
                  <span className={cn('text-sm', on ? 'font-semibold text-accent-ink' : 'font-medium')}>{p.label}</span>
                  <span className="text-xs text-muted-foreground">{fmtDate(p.date, 'd MMMM yyyy')}</span>
                </button>
              )
            })}
            <button role="radio" aria-checked={custom} onClick={() => setCustom(true)} className={cn('flex min-h-[60px] items-center gap-3 rounded-2xl border px-4 py-2 text-left', custom ? 'border-accent bg-card' : 'border-white/70 bg-white/55')}>
              <CalendarDays className="size-5 shrink-0 text-accent" strokeWidth={1.8} aria-hidden />
              <span className={cn('text-sm', custom ? 'font-semibold text-accent-ink' : 'font-medium')}>Pilih tanggal lain</span>
            </button>
          </div>
          {custom && <input type="date" aria-label="Tanggal surat boleh dibuka" className="input" min={format(addDays(new Date(), 1), 'yyyy-MM-dd')} value={date} onChange={(e) => setDate(e.target.value)} />}
          <p role="status" className={cn('text-[13px]', valid ? 'text-accent-ink' : 'font-semibold text-destructive')}>
            {valid ? (
              <>
                Terkunci <strong>{cd.big} {cd.unit}</strong> · dibuka {fmtDate(date, 'EEEE, d MMMM yyyy')}
                {moment && ` (${moment})`}
              </>
            ) : (
              'Pilih tanggal setelah hari ini.'
            )}
          </p>
        </section>

        {/* 3. Kertas surat */}
        <section className="flex flex-col gap-3 rounded-[24px] bg-card p-5 shadow-[var(--shadow-soft)]" aria-label="Isi surat">
          <p className="self-end text-xs text-muted-foreground">{fmtDate(today, 'd MMMM yyyy')}</p>
          <textarea
            aria-label="Judul surat"
            rows={2}
            maxLength={80}
            className="w-full resize-none bg-transparent font-serif text-[26px] italic leading-[1.15] text-accent outline-none placeholder:text-accent/50"
            placeholder={defaultTitle}
            value={title}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, ' '))}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          />
          <textarea
            aria-label="Isi surat"
            rows={9}
            className="w-full resize-none bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/70"
            style={{ lineHeight: '32px', backgroundImage: PAPER_LINES, backgroundAttachment: 'local', backgroundPosition: '0 -1px' }}
            placeholder="Kalau kamu membaca ini, berarti semua rapat keluarga, revisi budget, dan drama seragam sudah lewat…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="self-end font-serif text-2xl">— {name(me)}</p>
        </section>

        {/* 4. Foto */}
        <section className="flex flex-col gap-2" aria-labelledby="w-foto">
          <p id="w-foto" className={label}>
            Foto <span className="font-normal text-muted-foreground">(opsional, maksimal {MAX_PHOTOS})</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {photos.map((src, i) => (
              <div key={i} className={cn('relative rounded-[4px] bg-card p-1 pb-3 shadow-[var(--shadow-soft)]', i % 2 ? 'rotate-[2deg]' : '-rotate-[2deg]')}>
                <img src={src} alt={`Foto ${i + 1}`} className="size-[76px] rounded-[2px] object-cover" />
                <button className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-card shadow" aria-label={`Hapus foto ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}>
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="grid size-[84px] cursor-pointer place-items-center rounded-[10px] border border-dashed border-accent/50 bg-white/55 text-accent-ink hover:bg-white/80" aria-label="Tambah foto ke surat">
                <span className="flex flex-col items-center gap-1 text-[11px] font-medium">
                  {photos.length === 0 ? <Image className="size-5" strokeWidth={1.8} aria-hidden /> : <Plus className="size-5" strokeWidth={1.8} aria-hidden />}
                  Tambah foto
                </span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }} />
              </label>
            )}
          </div>
          {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
        </section>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-accent-ink">
          <Lock className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} aria-hidden />
          Setelah disegel, surat tidak bisa dibaca atau diubah oleh siapa pun sampai {valid ? fmtDate(date, 'd MMMM yyyy') : 'tanggal yang dipilih'}.
        </p>

        <div className="sticky bottom-0 -mx-5 bg-gradient-to-t from-accent-soft via-accent-soft/95 to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:mx-0 sm:px-0">
          <button className="btn-accent w-full" onClick={save} disabled={!message.trim() || !valid}>
            <Lock className="size-4" strokeWidth={1.8} aria-hidden /> Simpan &amp; segel surat
          </button>
          {!message.trim() && <p className="mt-2 text-center text-xs text-muted-foreground">Tulis isi suratnya dulu ya.</p>}
        </div>
      </div>

      {/* Penyegelan: surat masuk ke amplop, tutup menutup, segel menempel. */}
      {sealing && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-[70] grid animate-fade-up place-items-center overflow-y-auto bg-[#F7F0E3] px-6" onClick={() => navigate('/app/surat', { replace: true })}>
          <div className="flex w-full max-w-sm flex-col items-center gap-6 py-10 text-center">
            <div className="w-full max-w-[17rem]">
              <Envelope headroom open={envOpen} lock />
            </div>
            <div className={cn('flex flex-col gap-1.5 transition-opacity duration-500', envOpen ? 'opacity-0' : 'opacity-100')} style={{ transitionDelay: envOpen ? '0ms' : '1500ms' }}>
              <p className="font-serif text-[34px] leading-[1.1]">
                Surat <span className="italic">tersegel</span>
              </p>
              <p className="text-sm text-body">Baru bisa dibuka {fmtDate(date, 'd MMMM yyyy')}.</p>
              <p className="text-xs text-muted-foreground">Mengantar ke daftar surat…</p>
            </div>
          </div>
        </div>
      )}
    </RoseBackdrop>
  )
}
