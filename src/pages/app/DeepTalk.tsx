import { differenceInCalendarDays, parseISO } from 'date-fns'
import { ArrowRight, ChevronRight, Lock, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BerduaTabs, RoseBackdrop, SplitTitle } from '../../components/berdua'
import { PartnerSwitch } from '../../components/AppLayout'
import { PartnerAvatar } from '../../components/ui'
import { DEEP_TALK } from '../../data/content'
import { usePlan, useSession } from '../../lib/store'
import type { Partner } from '../../lib/types'
import { daysUntil, fmtDate } from '../../lib/utils'

/** Satu pertanyaan per hari, dihitung dari tanggal rencana dibuat. */
export const deepTalkIndex = (createdAt: string) => (createdAt ? Math.max(0, differenceInCalendarDays(new Date(), parseISO(createdAt))) : 0)

/** Pertanyaan dengan bagian akhir dimiringkan & diberi warna mawar (gaya layar Deep Talk). */
function Question({ text }: { text: string }) {
  const words = text.replace(/\?$/, '').split(' ')
  const cut = Math.max(1, words.length - 2)
  return (
    <p className="font-serif text-[36px] leading-[1.05] text-ink sm:text-[42px]">
      {words.slice(0, cut).join(' ')} <span className="italic text-accent">{words.slice(cut).join(' ')}?</span>
    </p>
  )
}

export default function DeepTalk() {
  const { deepTalk, profile, capsules, answerDeepTalk } = usePlan()
  const me = useSession((s) => s.me)
  const today = deepTalkIndex(profile.createdAt)
  const [text, setText] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const other: Partner = me === 'A' ? 'B' : 'A'
  const name = (p: Partner) => (p === 'A' ? profile.partnerA : profile.partnerB)
  const q = DEEP_TALK[today % DEEP_TALK.length]
  const ans = deepTalk[today] ?? {}
  const mine = ans[me]
  const theirs = ans[other]
  const both = !!(mine && theirs)

  // Hari berturut-turut kamu menjawab (hari ini dihitung kalau sudah dijawab).
  let streak = 0
  for (let i = mine ? today : today - 1; i >= 0 && deepTalk[i]?.[me]; i--) streak++

  const locked = capsules.filter((c) => daysUntil(c.unlockDate) > 0)
  const nextUnlock = [...locked].sort((a, b) => a.unlockDate.localeCompare(b.unlockDate))[0]
  const history = Array.from({ length: today }, (_, i) => today - 1 - i).filter((i) => deepTalk[i])

  const submit = () => {
    if (!text.trim()) return
    answerDeepTalk(today, me, text.trim())
    setText('')
  }

  return (
    <RoseBackdrop>
      <div className="flex flex-col gap-4">
        <header className="flex h-11 items-center justify-between gap-3">
          <SplitTitle a="Deep " b="Talk" />
          {/* Di mobile tidak ada bar atas, jadi pengalih pengguna ditaruh di sini (Deep Talk butuh dua pengguna bergantian). */}
          <div className="lg:hidden">
            <PartnerSwitch />
          </div>
          {streak > 0 && <span className="hidden h-8 items-center gap-1.5 rounded-full bg-card px-3 text-xs font-semibold text-accent-ink lg:inline-flex">{streak} hari berturut-turut</span>}
        </header>
        <BerduaTabs tone="rose" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-7 items-center rounded-full border border-accent/30 px-3 text-xs font-semibold text-accent-ink">
            Hari ke-{today + 1} · {q.topic}
          </span>
          {streak > 0 && <span className="inline-flex h-7 items-center rounded-full bg-card px-3 text-xs font-semibold text-accent-ink lg:hidden">{streak} hari berturut-turut</span>}
        </div>
        <Question text={q.q} />

        <section className="flex flex-col gap-2">
          <label htmlFor="dt" className="text-sm font-semibold">
            Jawabanmu
          </label>
          {mine ? (
            <p className="whitespace-pre-line rounded-[20px] bg-card p-4 text-[15px] leading-relaxed">{mine.text}</p>
          ) : (
            <textarea
              id="dt"
              rows={4}
              className="w-full rounded-[20px] border border-transparent bg-card p-4 text-[15px] leading-relaxed outline-none transition-colors duration-150 placeholder:text-muted-foreground/70 focus:border-accent"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Ceritakan apa yang kamu pikirkan. ${name(other)} bisa membaca jawabanmu setelah ikut menjawab.`}
            />
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-[20px] bg-white/60 p-4">
          <div className="flex items-center gap-2.5">
            <PartnerAvatar who={other} name={name(other)} size={32} />
            <span className="text-sm font-semibold">{theirs ? `${name(other)} sudah menjawab` : `Menunggu jawaban ${name(other)}`}</span>
          </div>
          {both ? (
            <p className="whitespace-pre-line text-[15px] leading-relaxed">{theirs!.text}</p>
          ) : (
            <>
              <div aria-hidden className="flex flex-col gap-2">
                <span className="h-2.5 w-full rounded-full bg-accent/15" />
                <span className="h-2.5 w-4/5 rounded-full bg-accent/15" />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-accent-ink">
                <Lock className="size-3.5" strokeWidth={1.8} aria-hidden />
                {theirs ? 'Jawaban terbuka setelah kamu ikut menjawab.' : 'Kalian bisa saling membaca jawaban setelah keduanya menjawab.'}
              </p>
            </>
          )}
        </section>

        {!mine && (
          <button className="btn-accent w-full" onClick={submit} disabled={!text.trim()}>
            {theirs ? `Kirim jawaban & baca jawaban ${name(other)}` : 'Kirim jawaban'} <ArrowRight className="size-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
        )}

        <Link to="/app/surat" className="flex items-center gap-3 rounded-[20px] bg-card px-4 py-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white">
            <Mail className="size-5" strokeWidth={1.8} aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-semibold">Surat untuk Nanti</span>
            <span className="truncate text-xs text-muted-foreground">
              {locked.length ? `${locked.length} surat menunggu sampai ${fmtDate(nextUnlock.unlockDate, 'd MMM yyyy')}` : 'Ada sesuatu yang ingin kalian sampaikan untuk hari-H? Tulis surat untuk nanti.'}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-ink" strokeWidth={1.8} aria-hidden />
        </Link>

        {history.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <button className="btn-ghost btn-sm self-start" aria-expanded={showHistory} onClick={() => setShowHistory((v) => !v)}>
              {showHistory ? 'Tutup obrolan sebelumnya' : `Lihat obrolan sebelumnya (${history.length})`}
            </button>
            {showHistory && (
              <ul className="flex flex-col gap-2.5">
                {history.map((i) => {
                  const a = deepTalk[i]
                  const open = !!(a.A && a.B)
                  return (
                    <li key={i} className="rounded-[20px] bg-card p-4">
                      <p className="text-xs text-muted-foreground">Hari ke-{i + 1}</p>
                      <p className="mt-1 font-semibold">{DEEP_TALK[i % DEEP_TALK.length].q}</p>
                      {open ? (
                        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                          {(['A', 'B'] as Partner[]).map((p) => (
                            <p key={p} className="rounded-xl bg-accent-soft/60 p-3">
                              <span className="block text-xs font-semibold text-accent-ink">{name(p)}</span>
                              {a[p]!.text}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">Menunggu satu jawaban lagi</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    </RoseBackdrop>
  )
}
