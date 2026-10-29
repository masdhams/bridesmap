import { Mail, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BerduaTabs, SplitTitle } from '../../components/berdua'
import { countdown, Envelope, fromTo, isReady, letterPhotos, momentTag, namedMoment } from '../../components/letter'
import { ConfirmButton } from '../../components/ui'
import { usePlan } from '../../lib/store'
import type { TimeCapsule } from '../../lib/types'
import { cn, fmtDate } from '../../lib/utils'

type Namer = (p: 'A' | 'B') => string

/** Dialog khusus surat: latar gelap lembut, isinya kartu yang menyesuaikan tahap (terkunci / belum dibuka / dibaca). */
function LetterDialog({ onClose, label, children }: { onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto max-h-[94dvh] w-[min(94vw,32rem)] overflow-y-auto rounded-[28px] bg-transparent p-0 backdrop:bg-ink/60 backdrop:backdrop-blur-[3px] open:animate-fade-up"
    >
      {children}
    </dialog>
  )
}

const CloseX = ({ onClose, tone = 'light' }: { onClose: () => void; tone?: 'light' | 'dark' }) => (
  <button type="button" onClick={onClose} aria-label="Tutup" className={cn('absolute right-3 top-3 z-50 grid size-10 place-items-center rounded-full', tone === 'dark' ? 'text-ink hover:bg-black/5' : 'text-ink hover:bg-muted')}>
    <X className="size-5" strokeWidth={1.8} />
  </button>
)

/** Satu surat: terkunci → "coba buka" menolak halus; siap → animasi membuka; sudah dibuka → langsung dibaca. */
function LetterView({ c, name, wedding, onClose }: { c: TimeCapsule; name: Namer; wedding: string; onClose: () => void }) {
  const { update, remove } = usePlan()
  const ready = isReady(c)
  const [stage, setStage] = useState<'locked' | 'sealed' | 'opening' | 'read'>(!ready ? 'locked' : c.openedAt ? 'read' : 'sealed')
  const [shake, setShake] = useState(0)
  const timer = useRef<number>(0)
  const cd = countdown(c.unlockDate)
  const photos = letterPhotos(c)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const openIt = () => {
    if (stage !== 'sealed') return
    setStage('opening')
    // Urutan animasi amplop ±1,5 detik, lalu surat tampil dan ditandai sudah dibuka.
    timer.current = window.setTimeout(() => {
      setStage('read')
      update('capsules', c.id, { openedAt: new Date().toISOString() })
    }, 1600)
  }

  if (stage === 'read')
    return (
      <LetterDialog onClose={onClose} label={`Surat: ${c.title}`}>
        <article className="relative animate-fade-up rounded-[28px] bg-card p-6 shadow-[var(--shadow-lift)] sm:p-8">
          <CloseX onClose={onClose} />
          <p className="eyebrow pr-10 text-[11px] text-accent-ink">{momentTag(c.unlockDate, wedding)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{fromTo(c, name)}</p>
          <h2 className="mt-4 font-serif text-[32px] italic leading-[1.1] text-accent">{c.title}</h2>
          {photos.length > 0 && (
            <div className={cn('mt-5 grid gap-2', photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
              {photos.map((src, i) => (
                <img key={i} src={src} alt={`Foto ${i + 1} dalam surat`} className={cn('w-full rounded-xl object-cover', photos.length === 1 ? 'max-h-80' : 'aspect-square')} />
              ))}
            </div>
          )}
          <p className="mt-5 whitespace-pre-line text-[16px] leading-[1.8]">{c.message}</p>
          <p className="mt-6 text-right font-serif text-2xl">— {name(c.from)}</p>
          <p className="mt-5 border-t border-divider pt-3 text-xs text-muted-foreground">
            Ditulis {fmtDate(c.createdAt.slice(0, 10), 'd MMMM yyyy')} · dibuka {fmtDate((c.openedAt ?? new Date().toISOString()).slice(0, 10), 'd MMMM yyyy')}
          </p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <ConfirmButton className="btn-ghost btn-sm text-destructive" label="Hapus surat" onConfirm={() => { remove('capsules', c.id); onClose() }}>
              <Trash2 className="size-4" aria-hidden /> Hapus
            </ConfirmButton>
            <button className="btn-soft btn-sm" onClick={onClose}>
              Tutup
            </button>
          </div>
        </article>
      </LetterDialog>
    )

  if (stage === 'locked')
    return (
      <LetterDialog onClose={onClose} label="Surat terkunci">
        <section className="relative flex flex-col items-center gap-5 rounded-[28px] bg-[#F7F0E3] px-6 pb-6 pt-10 text-center shadow-[var(--shadow-lift)]">
          <CloseX onClose={onClose} tone="dark" />
          <button key={shake} type="button" onClick={() => setShake((s) => s + 1)} aria-label="Coba buka surat" className={cn('w-full max-w-[15rem]', shake > 0 && 'animate-wobble')}>
            <Envelope lock />
          </button>
          <div className="flex flex-col items-center gap-1.5">
            <p className="eyebrow text-[11px] text-accent-ink">Surat terkunci</p>
            <p className="font-serif text-[48px] leading-none tabular-nums">
              {cd.big} {cd.unit && <span className="italic">{cd.unit}</span>}
            </p>
            {cd.rough && <p className="text-sm text-body">{cd.rough}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-semibold">{fmtDate(c.unlockDate, 'EEEE, d MMMM yyyy')}</p>
            {namedMoment(c.unlockDate, wedding) && <p className="text-sm text-body">{namedMoment(c.unlockDate, wedding)}</p>}
          </div>
          <p role="status" className={cn('min-h-5 text-sm text-accent-ink transition-opacity duration-300', shake > 0 ? 'opacity-100' : 'opacity-0')}>
            Belum waktunya. Sabar ya, kejutannya akan lebih manis.
          </p>
          <p className="max-w-[20rem] text-xs leading-relaxed text-muted-foreground">
            {fromTo(c, name)}. Isinya tersimpan rapat sampai hari itu, tidak bisa dibaca siapa pun, termasuk penulisnya.
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Link to={`/app/surat/tulis?tanggal=${c.unlockDate}`} className="btn-outline flex-1">
              <Plus className="size-4" aria-hidden /> Tulis surat lain untuk hari itu
            </Link>
            <button className="btn-soft flex-1" onClick={onClose}>
              Tutup
            </button>
          </div>
        </section>
      </LetterDialog>
    )

  // 'sealed' dan 'opening': amplop besar; segel lepas, tutup terangkat, surat naik.
  const opening = stage === 'opening'
  return (
    <LetterDialog onClose={onClose} label="Buka surat">
      <section className="relative flex flex-col items-center gap-5 rounded-[28px] bg-[#F7F0E3] px-6 pb-7 pt-6 text-center shadow-[var(--shadow-lift)]">
        {!opening && <CloseX onClose={onClose} tone="dark" />}
        <button type="button" onClick={openIt} disabled={opening} aria-label="Buka surat" className="mt-6 w-full max-w-[16rem] disabled:cursor-default">
          <Envelope headroom open={opening} />
        </button>
        <div className="flex flex-col items-center gap-1.5">
          <p className="eyebrow text-[11px] text-accent-ink">{momentTag(c.unlockDate, wedding)}</p>
          <p className="font-serif text-[32px] leading-[1.1]">{opening ? <span className="italic">Membuka surat…</span> : <>Hari yang <span className="italic">ditunggu</span> sudah tiba</>}</p>
          <p className="text-sm text-body">{fromTo(c, name)}</p>
        </div>
        <button className="btn-accent w-full" onClick={openIt} disabled={opening}>
          <Mail className="size-4" strokeWidth={1.8} aria-hidden /> {opening ? 'Sebentar…' : 'Buka surat'}
        </button>
      </section>
    </LetterDialog>
  )
}

/** Baris surat di daftar. Surat yang belum dibuka tidak menampilkan judul, isi, atau jumlah foto. */
function LetterRow({ c, name, wedding, onOpen }: { c: TimeCapsule; name: Namer; wedding: string; onOpen: () => void }) {
  const ready = isReady(c)
  const fresh = ready && !c.openedAt
  const read = ready && !!c.openedAt
  const cd = countdown(c.unlockDate)
  return (
    <li>
      <button onClick={onOpen} className="flex w-full items-center gap-4 rounded-[20px] border border-border bg-card p-3.5 text-left transition-shadow duration-200 hover:shadow-[var(--shadow-soft)]">
        <span className={cn('w-[84px] shrink-0', read && 'opacity-60')}>
          <Envelope lock={!ready} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="eyebrow text-[10px] text-accent-ink">{momentTag(c.unlockDate, wedding)}</span>
          <span className="line-clamp-2 text-[15px] font-semibold leading-tight">{read ? c.title : fromTo(c, name)}</span>
          <span className="truncate text-xs text-muted-foreground">
            {read ? `${fromTo(c, name)} · dibuka ${fmtDate((c.openedAt ?? '').slice(0, 10), 'd MMM yyyy')}` : `Dibuka ${fmtDate(c.unlockDate, 'd MMMM yyyy')}`}
          </span>
        </span>
        {fresh ? (
          <span className="btn-accent animate-glow min-h-9 shrink-0 px-4 text-[13px]">Buka</span>
        ) : read ? (
          <span className="badge-neutral min-h-7 shrink-0 px-2.5 text-xs">Dibaca</span>
        ) : (
          <span className="flex shrink-0 flex-col items-end">
            <span className="font-serif text-[22px] leading-none tabular-nums">{cd.days > 1 ? cd.days : cd.big}</span>
            {cd.days > 1 && <span className="text-[11px] text-muted-foreground">hari lagi</span>}
          </span>
        )}
      </button>
    </li>
  )
}

export default function Letters() {
  const { capsules, profile } = usePlan()
  const [viewId, setViewId] = useState<string | null>(null)
  const name: Namer = (p) => (p === 'A' ? profile.partnerA : profile.partnerB)
  const wedding = profile.weddingDate

  const locked = capsules.filter((c) => !isReady(c)).sort((a, b) => a.unlockDate.localeCompare(b.unlockDate))
  const fresh = capsules.filter((c) => isReady(c) && !c.openedAt).sort((a, b) => a.unlockDate.localeCompare(b.unlockDate))
  const read = capsules.filter((c) => isReady(c) && c.openedAt).sort((a, b) => (b.openedAt ?? '').localeCompare(a.openedAt ?? ''))
  const next = locked[0]
  const restLocked = locked.slice(1)
  const view = capsules.find((c) => c.id === viewId)
  const nextCd = next ? countdown(next.unlockDate) : null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <header className="flex h-11 items-center justify-between gap-3">
        <SplitTitle a="Surat untuk " b="Nanti" />
        <Link to="/app/surat/tulis" aria-label="Tulis surat baru" className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white hover:bg-accent-hover">
          <Plus className="size-[18px]" strokeWidth={2} />
        </Link>
      </header>
      <BerduaTabs />
      <p className="text-sm leading-relaxed text-body">Tulis hari ini, buka di hari yang kalian pilih. Surat terkunci rapat sampai tanggalnya tiba, bahkan untuk penulisnya.</p>

      {capsules.length === 0 ? (
        <section className="flex flex-col items-center gap-5 rounded-[28px] border border-border bg-card px-6 py-10 text-center">
          <div className="w-full max-w-[13rem]">
            <Envelope />
          </div>
          <div className="flex flex-col gap-1.5">
            <h2 className="font-serif text-[30px] leading-[1.1]">
              Belum ada <span className="italic">surat</span>
            </h2>
            <p className="max-w-[22rem] text-sm leading-relaxed text-body">Mulai dengan satu surat untuk hari-H, atau untuk ulang tahun pernikahan pertama. Kalian akan berterima kasih pada diri sendiri nanti.</p>
          </div>
          <Link to="/app/surat/tulis" className="btn-accent">
            <Mail className="size-4" aria-hidden /> Tulis surat pertama
          </Link>
        </section>
      ) : (
        <>
          {fresh.length > 0 && (
            <section aria-label="Surat siap dibuka" className="flex items-center gap-4 rounded-[24px] bg-accent p-5 text-white">
              <div className="w-24 shrink-0 rounded-md">
                <Envelope />
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                <p className="font-serif text-[24px] leading-[1.1]">
                  {fresh.length === 1 ? 'Satu surat' : `${fresh.length} surat`} <span className="italic">siap dibuka</span>
                </p>
                <p className="text-[13px] text-white/80">Hari yang kalian tunggu sudah tiba.</p>
                <button className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-[13px] font-semibold text-accent-ink hover:bg-accent-soft" onClick={() => setViewId(fresh[0].id)}>
                  Buka sekarang
                </button>
              </div>
            </section>
          )}

          {next && nextCd && (
            <button onClick={() => setViewId(next.id)} className="flex flex-col items-center gap-4 rounded-[28px] bg-gradient-to-b from-accent-soft to-[#F7F0E3] px-6 pb-6 pt-8 text-center transition-shadow duration-200 hover:shadow-[var(--shadow-soft)]" aria-label="Lihat surat terkunci berikutnya">
              <div className="w-full max-w-[14rem]">
                <Envelope lock />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="eyebrow text-[11px] text-accent-ink">Surat berikutnya · terkunci</p>
                <p className="font-serif text-[46px] leading-none tabular-nums">
                  {nextCd.big} {nextCd.unit && <span className="italic">{nextCd.unit}</span>}
                </p>
                {nextCd.rough && <p className="text-sm text-body">{nextCd.rough}</p>}
              </div>
              <p className="text-sm">
                Dibuka <strong>{fmtDate(next.unlockDate, 'd MMMM yyyy')}</strong>
                {namedMoment(next.unlockDate, wedding) && ` · ${namedMoment(next.unlockDate, wedding)}`}
              </p>
              <p className="text-xs text-muted-foreground">{fromTo(next, name)}</p>
            </button>
          )}

          {restLocked.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <h2 className="font-sans text-[15px] font-semibold">
                Menunggu harinya <span className="font-normal text-muted-foreground">· {restLocked.length}</span>
              </h2>
              <ul className="flex flex-col gap-2.5">
                {restLocked.map((c) => (
                  <LetterRow key={c.id} c={c} name={name} wedding={wedding} onOpen={() => setViewId(c.id)} />
                ))}
              </ul>
            </section>
          )}

          {(fresh.length > 0 || read.length > 0) && (
            <section className="flex flex-col gap-2.5">
              <h2 className="font-sans text-[15px] font-semibold">
                Sudah bisa dibuka <span className="font-normal text-muted-foreground">· {fresh.length + read.length}</span>
              </h2>
              <ul className="flex flex-col gap-2.5">
                {[...fresh, ...read].map((c) => (
                  <LetterRow key={c.id} c={c} name={name} wedding={wedding} onOpen={() => setViewId(c.id)} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {view && <LetterView key={view.id} c={view} name={name} wedding={wedding} onClose={() => setViewId(null)} />}
    </div>
  )
}
