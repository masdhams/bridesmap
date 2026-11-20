import { ArrowRight, CalendarPlus, Copy, MapPin } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TEPI_LAUT_DEMO, type Invitation } from '../../data/invitations'
import { cn } from '../../lib/utils'
import desaTebing from '../../assets/tepi-laut/desa-tepi-tebing.webp'
import pesisir from '../../assets/tepi-laut/pesisir-cat-air.webp'
import pita1 from '../../assets/tepi-laut/pita-kain-1.webp'
import pita2 from '../../assets/tepi-laut/pita-kain-2.webp'
import pita3 from '../../assets/tepi-laut/pita-kain-3.webp'
import { calendarLink, eventMapsHref, fmt, mapsEmbed, parseDay, at, useCopy, useCountdown, useGuestBook } from './shared'
import './tepi-laut.css'

/** Undangan digital template "Tepi Laut" (Tema-4): editorial bertema pesisir, kertas hangat, foto bertepi sobek,
 *  ilustrasi cat air, pita kain, dan polaroid miring (referensi layout editorial pantai).
 *  Gaya dan animasi dari folder 04-PRODUCTS/templates/undangan-tepi-laut (diberi awalan .inv-tepi di tepi-laut.css).
 *  Tamu dibuka lewat `/undangan/tepi-laut?to=Nama+Tamu`. */

type Kind = 'photo' | 'art'

/** Gambar dengan kelas gaya template. Tanpa `src` tampil kotak penanda berlabel (foto belum diisi). */
function Slot({ src, kind, label = '', className = '', parallax }: { src?: string; kind: Kind; label?: string; className?: string; parallax?: number }) {
  return (
    <figure className={cn('slot', kind, className, !src && 'missing')} data-label={label} data-parallax={parallax}>
      {src && <img src={src} alt="" loading="lazy" />}
    </figure>
  )
}

const cv = (o: Record<string, string | number>) => o as CSSProperties
const delay = (i: number, step = 0.15) => cv({ '--d': `${i * step}s` })

/** Nama dipecah per huruf supaya masuk bergantian. */
function Letters({ text, from = 0 }: { text: string; from?: number }) {
  return [...text].map((ch, i) => (
    <span className="ch" aria-hidden key={i} style={cv({ '--i': from + i })}>
      {ch}
    </span>
  ))
}

const Wave = () => (
  <svg className="wave" viewBox="0 0 120 12" aria-hidden>
    <path pathLength={1} d="M2 6c7.5-8 15-8 22.5 0s15 8 22.5 0 15-8 22.5 0 15 8 22.5 0 15-8 22.5 0" />
  </svg>
)

const Gull = () => (
  <svg className="gull" viewBox="0 0 60 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
    <path d="M2 14c8-8 16-9 26 2 8-10 18-11 30-4" />
    <path d="M27 16l1 3" />
  </svg>
)

const Spark = () => (
  <svg className="spark" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 1c.8 6.2 4.8 10.2 11 11-6.2.8-10.2 4.8-11 11-.8-6.2-4.8-10.2-11-11C7.2 11.2 11.2 7.2 12 1z" fill="currentColor" />
  </svg>
)

/** Judul dua baris: dua kata pertama tegak, sisanya miring. */
function TwoLine({ text }: { text: string }) {
  const w = text.split(' ')
  return (
    <>
      {w.slice(0, 2).join(' ')}
      <br />
      <em>{w.slice(2).join(' ')}</em>
    </>
  )
}

/** Hitung mundur: angka berputar naik dari 0 saat pertama kali terlihat. */
function Count({ target, reduce }: { target: number; reduce: boolean }) {
  const parts = useCountdown(target)
  const ref = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(reduce ? 1 : 0)
  useEffect(() => {
    const el = ref.current
    if (!el || reduce) return
    let raf = 0
    const io = new IntersectionObserver(
      (en) => {
        if (!en[0].isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const step = (t: number) => {
          const x = Math.min(1, (t - t0) / 2200)
          setP(1 - Math.pow(1 - x, 3))
          if (x < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.6 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [reduce])
  return (
    <div className="count" ref={ref}>
      {parts.map((x, i) => {
        const n = Math.round(Number(x.v) * p)
        return (
          <div key={x.l}>
            <b>{i ? String(n).padStart(2, '0') : n}</b>
            <span>{x.l}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function TepiLautInvitation({ data = TEPI_LAUT_DEMO }: { data?: Invitation }) {
  const [params] = useSearchParams()
  const guest = params.get('to')?.trim() || ''
  const rootRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLElement>(null)
  const locRef = useRef<HTMLElement>(null)
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState('')
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  const { groom, bride, photos, quote, events, story } = data
  const first = events[0]
  const day = parseDay(data.date)
  const { copy } = useCopy()
  const { rsvp, saveRsvp } = useGuestBook('tepi-laut', [])

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(t)
  }, [toast])

  // Muncul pelan saat masuk layar (sekali per elemen). Elemen `.venue` memakai wipe pada gambar anaknya.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return
          en.target.classList.add('is-in')
          io.unobserve(en.target)
        }),
      { threshold: 0.15 },
    )
    el.querySelectorAll('[data-reveal]').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [story.length])

  // Progress scroll dan parallax dekor (parallax mati kalau pengguna memilih kurangi gerakan).
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const items = [...el.querySelectorAll<HTMLElement>('[data-parallax]')].map((n) => [n, Number(n.dataset.parallax)] as const)
    let queued = false
    const run = () => {
      queued = false
      const max = document.documentElement.scrollHeight - innerHeight
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`
      if (reduce) return
      for (const [n, k] of items) {
        const r = n.getBoundingClientRect()
        if (r.bottom < -200 || r.top > innerHeight + 200) continue
        const off = r.top + r.height / 2 - innerHeight / 2
        n.style.setProperty('--py', `${Math.max(-90, Math.min(90, -off * k)).toFixed(1)}px`)
      }
    }
    const onScroll = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(run)
    }
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    onScroll()
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
    }
  }, [reduce])

  const dateLine = fmt(day, { day: 'numeric', month: 'long', year: 'numeric' })
  const longDate = fmt(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const deadline = fmt(parseDay(data.rsvpDeadline), { day: 'numeric', month: 'long', year: 'numeric' })
  const venue = first?.venue || data.city
  const venueText = `${first?.venue ? `Seluruh rangkaian acara kami laksanakan di ${first.venue}. ` : ''}Semoga Anda berkenan hadir dan menjadi bagian dari kenangan indah kami.`
  const gallery = photos.gallery.length ? photos.gallery.slice(0, 6) : [undefined, undefined, undefined]
  const person = (p: Invitation['groom'], photo: string | undefined, label: string) => (
    <div className="couple__one" data-reveal="zoom" style={delay(p === bride ? 0 : 1, 0.25)} key={label}>
      <Slot kind="photo" src={photo} label={label} className="couple__photo" />
      <b>{p.full}</b>
      {p.parents && (
        <span>
          {p.childOf} {p.parents}
        </span>
      )}
      {p.instagram && (
        <a className="ig" href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noopener noreferrer">
          @{p.instagram}
        </a>
      )}
    </div>
  )

  return (
    <div ref={rootRef} className={cn('inv-tepi', ready && 'ready')}>
      <title>{`Undangan Pernikahan ${groom.nick} & ${bride.nick}`}</title>
      <div className="progress" aria-hidden>
        <i ref={barRef} />
      </div>

      <main className="page">
        {/* Hero */}
        <header className="hero">
          <div className="hero__text">
            <p className="hero__of rise">The Wedding Of</p>
            <h1 className="hero__names" aria-label={`${groom.nick} & ${bride.nick}`}>
              <Letters text={groom.nick} />
              <span className="amp ch" style={cv({ '--i': groom.nick.length })} aria-hidden>
                &amp;
              </span>
              <br />
              <Letters text={bride.nick} from={groom.nick.length + 1} />
            </h1>
            <p className="hero__date rise">
              {dateLine} <i>|</i> {data.city}
            </p>
            <button className="btn rise" onClick={() => locRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })}>
              Lihat Tempat Acara <ArrowRight aria-hidden />
            </button>
            <p className="hero__guest rise">
              Kepada Yth.
              <br />
              <b>{guest || 'Bapak/Ibu/Saudara/i'}</b>
            </p>
            <p className="hero__note rise">Kami akan menikah</p>
            <Gull />
          </div>
          <div className="hero__photo">
            <Slot kind="photo" src={photos.hero} label="Foto utama" className="torn torn--1" />
            <Slot kind="art" src={pita1} className="ribbon ribbon--hero" parallax={0.2} />
          </div>
          <Slot kind="art" src={pesisir} className="hero__coast" parallax={0.1} />
        </header>

        {/* Kedua mempelai */}
        <section className="story">
          <figure className="story__photo" data-reveal="left">
            <Slot kind="photo" src={photos.heroSmall} label="Foto pasangan" className="torn torn--2" />
            <figcaption>
              {groom.nick} &amp; {bride.nick}
            </figcaption>
          </figure>
          <div className="story__text" data-reveal="right">
            <h2 className="h2 h2--left">
              <TwoLine text="Kami akan menikah." />
            </h2>
            <p>Dengan penuh syukur, kami mengundang Anda hadir di hari pernikahan kami.</p>
            <div className="couple">
              {person(bride, photos.bride, 'Foto Mempelai Wanita')}
              {person(groom, photos.groom, 'Foto Mempelai Pria')}
            </div>
            {quote.text && <p className="quote" data-reveal="up">“{quote.text}”</p>}
          </div>
        </section>

        {/* Simpan tanggal */}
        <section className="count-sec" data-reveal>
          <Slot kind="art" src={pita2} className="ribbon ribbon--left" parallax={-0.16} />
          <Slot kind="art" src={desaTebing} className="count-sec__village" parallax={0.12} />
          <h2 className="h2">Simpan Tanggalnya</h2>
          <p className="small count-sec__day">{longDate}</p>
          <Count target={at(data, first?.start ?? '08.00').getTime()} reduce={reduce} />
          <a className="btn btn--ghost" href={calendarLink(data)} target="_blank" rel="noopener noreferrer">
            <CalendarPlus aria-hidden />
            Simpan ke Kalender
          </a>
        </section>

        {/* Tempat acara */}
        <section className="head" data-reveal>
          <h2 className="h2">Tempat Acara</h2>
          <Wave />
        </section>
        <section className="loc" id="lokasi" ref={locRef}>
          <div className="loc__map" data-reveal="right">
            <iframe title={`Peta ${data.mapsQuery}`} src={mapsEmbed(data.mapsQuery)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
          <div className="loc__card" data-reveal="left" style={delay(1, 0.3)}>
            <Spark />
            <p className="loc__name">{first?.name}</p>
            <p className="loc__venue">{venue}</p>
            {first?.address && <p className="loc__addr">{first.address}</p>}
            <a className="btn" href={first ? eventMapsHref(first) : '#'} target="_blank" rel="noopener noreferrer">
              <MapPin aria-hidden />
              Petunjuk arah
            </a>
          </div>
          <p className="loc__note" data-reveal="up">
            {venueText}
          </p>
        </section>

        {/* Kisah kita */}
        {story.length > 0 && (
          <>
            <section className="head" data-reveal>
              <h2 className="h2">Kisah Kita</h2>
              <Wave />
            </section>
            <ol className="kisah">
              {story.map((k, i) => (
                <li className="kisah__item" key={`${k.year}-${k.title}-${i}`} data-reveal={i % 2 ? 'right' : 'left'} style={delay(i, 0.2)}>
                  <Slot kind="photo" src={k.photo} label={`Foto ${k.title || 'momen'}`} className="kisah__photo" />
                  <div>
                    <p className="kisah__title">{k.title}</p>
                    <p className="kisah__text">{k.text}</p>
                    <p className="kisah__year">{k.year}</p>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}

        {/* Galeri */}
        <section className="head" data-reveal>
          <h2 className="h2">Galeri</h2>
          <Wave />
        </section>
        <section className="gallery">
          {gallery.map((g, i) => (
            <figure className={`polaroid polaroid--${(i % 3) + 1}`} key={i} data-reveal="drop" style={delay(i % 3, 0.25)}>
              <Slot kind="photo" src={g} label={`Foto galeri ${i + 1}`} />
              <figcaption>{['Berdua', 'Cincin kami', 'Di tepi pantai'][i % 3]}</figcaption>
            </figure>
          ))}
        </section>

        {/* RSVP, kado digital, penutup */}
        <section className="closing" id="rsvp">
          <Slot kind="art" src={pita3} className="ribbon ribbon--closing" parallax={0.18} />
          <div data-reveal>
            <h2 className="h2">Konfirmasi Kehadiran</h2>
            <p className="small">Mohon isi sebelum {deadline} ya, biar kami bisa siapkan tempat untuk Anda.</p>
          </div>
          <div className="rsvp" data-reveal>
            {rsvp ? (
              <div className="done">
                <p className="h3">Terima kasih, {rsvp.name}</p>
                <p className="small">{rsvp.attend ? `Kami tunggu kehadiran Anda (${rsvp.count} orang).` : 'Sayang sekali belum bisa hadir. Terima kasih sudah mengabari.'}</p>
                <button className="btn btn--ghost" onClick={() => saveRsvp(null)}>
                  Ubah jawaban
                </button>
              </div>
            ) : (
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault()
                  const v = Object.fromEntries(new FormData(e.currentTarget))
                  const attend = v.attend === 'yes'
                  saveRsvp({ name: String(v.name).trim(), attend, count: attend ? Number(v.count) : 0 })
                }}
              >
                <input className="field" name="name" placeholder="Nama" required maxLength={60} defaultValue={guest} />
                <select className="field" name="attend" required defaultValue="">
                  <option value="" disabled>
                    Apakah Anda akan hadir?
                  </option>
                  <option value="yes">Ya, saya akan hadir</option>
                  <option value="no">Maaf, belum bisa hadir</option>
                </select>
                <select className="field" name="count" defaultValue="1">
                  <option value="1">1 orang</option>
                  <option value="2">2 orang</option>
                  <option value="3">3 orang</option>
                  <option value="4">4 orang</option>
                </select>
                <button className="btn btn--block">
                  Kirim Konfirmasi <ArrowRight aria-hidden />
                </button>
              </form>
            )}
          </div>
          {data.accounts.length > 0 && (
            <div className="gift" data-reveal>
              <h2 className="h2">Kado Digital</h2>
              <p className="small">Doa restu Anda sudah lebih dari cukup. Kalau ingin memberi tanda kasih, bisa lewat rekening di bawah ini.</p>
              <div className="gift__cards">
                {data.accounts.map((a, i) => (
                  <div className="acc" key={a.number} data-reveal="zoom" style={delay(i, 0.2)}>
                    <p className="eyebrow">{a.bank}</p>
                    <p className="acc__num">{a.number}</p>
                    <p className="acc__holder">a.n. {a.holder}</p>
                    <button
                      className="copy"
                      onClick={() => {
                        copy(a.number.replace(/\s/g, ''))
                        setToast('Tersalin')
                      }}
                    >
                      <Copy aria-hidden />
                      Salin
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="thanks" data-reveal="zoom">
            <h2 className="h2">Terima Kasih</h2>
            <p className="small">Kehadiran dan doa restu Anda berarti banyak buat kami. Sampai bertemu di hari bahagia kami, ya.</p>
          </div>
        </section>
        <footer className="footer">
          <p className="footer__names">
            {groom.nick} &amp; {bride.nick}
          </p>
          <p>
            Undangan digital dibuat dengan <b>Bridesmap</b>
          </p>
        </footer>
      </main>
      <div className={cn('toast', toast && 'show')} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  )
}
