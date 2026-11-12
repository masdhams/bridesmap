import { AtSign, CalendarPlus, ChevronLeft, ChevronRight, Copy, MailOpen, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TAMAN_KLASIK_DEMO, type Invitation } from '../../data/invitations'
import { cn } from '../../lib/utils'
import bingkaiPenutup from '../../assets/taman-klasik/bingkai-ornamen-penutup.webp'
import buketOval from '../../assets/taman-klasik/buket-bingkai-oval.webp'
import bungaKanan from '../../assets/taman-klasik/bunga-sudut-kanan.webp'
import bungaKiri from '../../assets/taman-klasik/bunga-sudut-kiri.webp'
import danauAirMancur from '../../assets/taman-klasik/danau-air-mancur.webp'
import gapuraBatu from '../../assets/taman-klasik/gapura-batu.webp'
import heroIstana from '../../assets/taman-klasik/hero-istana.webp'
import lanskapDanau from '../../assets/taman-klasik/lanskap-danau-cemara.webp'
import latarKabut from '../../assets/taman-klasik/latar-rumah-kabut.webp'
import lorongTaman from '../../assets/taman-klasik/lorong-taman.webp'
import pemandanganBunga from '../../assets/taman-klasik/pemandangan-bunga-liar.webp'
import rumahUkiran from '../../assets/taman-klasik/rumah-taman-ukiran.webp'
import rumputDepan from '../../assets/taman-klasik/rumput-bunga-depan.webp'
import sampulGapura from '../../assets/taman-klasik/sampul-gapura-istana.webp'
import tamanPenutup from '../../assets/taman-klasik/taman-penutup.webp'
import pilarAirMancur from '../../assets/taman-klasik/taman-pilar-air-mancur.webp'
import { at, calendarLink, eventMapsHref, fmt, parseDay, useCountdown, useCopy, useGuestBook, useScrollLock, type GuestWish } from './shared'
import './taman-klasik.css'

/** Undangan digital template "Taman Klasik": ukiran taman Eropa, hijau sage dan kertas ivory (referensi Viding tema 206).
 *  Sampul = gapura batu di depan istana; dibuka pelan (zoom menembus gapura), lalu pembuka, mempelai, acara, galeri, dan penutup.
 *  Tamu dibuka lewat `/undangan/taman-klasik?to=Nama+Tamu`; `&langsung` melewati sampul.
 *  Gaya dan animasi dari style.css di folder undangan-taman-klasik (diberi awalan .inv-taman di taman-klasik.css). */

const SAMPLE_WISHES: GuestWish[] = [
  { name: 'Dinda', msg: 'Selamat ya Arga dan Kirana! Semoga jadi keluarga yang hangat dan selalu kompak.', date: '20 Apr' },
  { name: 'Om Hendra & Tante Mira', msg: 'Barakallah, semoga langgeng sampai tua dan dimudahkan segala urusannya.', date: '18 Apr' },
]

type Kind = 'scene' | 'decor' | 'photo'

/** Gambar dengan kelas gaya template. Tanpa `src` tampil kotak penanda berlabel (foto belum diisi). */
function Slot({ src, kind, label = '', className = '' }: { src?: string; kind: Kind; label?: string; className?: string }) {
  return (
    <figure className={cn('slot', kind, className, !src && 'missing')} data-label={label}>
      {src && <img src={src} alt="" loading="lazy" />}
    </figure>
  )
}

export default function TamanKlasikInvitation({ data = TAMAN_KLASIK_DEMO }: { data?: Invitation }) {
  const [params] = useSearchParams()
  const guest = params.get('to')?.trim() || ''
  const rootRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<'cover' | 'zoom' | 'open'>(params.has('langsung') ? 'open' : 'cover')
  const opened = phase === 'open'
  useScrollLock(!opened)

  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  // Buka pelan: tulisan sampul memudar, kamera maju menembus gapura, lalu bagian pembuka tampil bertahap.
  useEffect(() => {
    if (phase !== 'zoom') return
    const t = window.setTimeout(() => setPhase('open'), reduce ? 0 : 1900)
    return () => clearTimeout(t)
  }, [phase, reduce])

  // Animasi muncul saat masuk layar (sekali saja per elemen).
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
      { threshold: 0.12 },
    )
    el.querySelectorAll('[data-reveal], .anim').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  const { groom, bride, photos, quote, events } = data
  const gallery = photos.gallery
  const day = parseDay(data.date)
  const countdown = useCountdown(at(data, events[0]?.start ?? '08.00').getTime())
  const { copied, copy } = useCopy()
  const { wishes, addWish, rsvp, saveRsvp } = useGuestBook('taman-klasik', SAMPLE_WISHES)

  const [tab, setTab] = useState<'bank' | 'address'>('bank')
  const [cur, setCur] = useState(0)
  const [toast, setToast] = useState('')
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const longDate = fmt(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const shortDay = fmt(day, { day: 'numeric', month: 'long', year: 'numeric' })
  const deadline = fmt(parseDay(data.rsvpDeadline), { day: 'numeric', month: 'long', year: 'numeric' })
  const show = (i: number) => setCur(((i % gallery.length) + gallery.length) % gallery.length)

  return (
    <div ref={rootRef} className={cn('inv-taman', opened && 'opened')}>
      <title>{`Undangan Pernikahan ${groom.nick} & ${bride.nick}`}</title>

      {/* Sampul */}
      <div className={cn('cover', phase === 'zoom' && 'is-zooming', phase === 'open' && 'is-open')} id="cover">
        <div className="cover__stage">
          <Slot kind="scene" src={sampulGapura} label="sampul-gapura-istana.jpg" className="cover__bg" />
          <div className="cover__top">
            <p className="eyebrow">Kepada Yth.</p>
            <strong>{guest || 'Bapak/Ibu/Saudara/i'}</strong>
          </div>
          <div className="cover__text glow">
            <p className="cover__lead">Undangan pernikahan</p>
            <h1 className="script cover__names">
              {groom.nick} <span>&amp;</span> {bride.nick}
            </h1>
            <p className="cover__date">{shortDay}</p>
          </div>
          <button className="btn cover__btn" onClick={() => { window.scrollTo(0, 0); setPhase('zoom') }}>
            <MailOpen aria-hidden />
            Buka Undangan
          </button>
        </div>
      </div>

      <main className="page">
        {/* Pembuka: istana di balik gapura */}
        <section className="hero">
          <Slot kind="scene" src={heroIstana} label="hero-istana.jpg" className="hero__img" />
          <Slot kind="scene" src={latarKabut} className="hero__fog" />
          <div className="hero__haze" />
          <div className="hero__arch">
            <Slot kind="decor" src={gapuraBatu} className="hero__frame" />
            <div className="hero__text glow">
              <p className="script hero__lead">Kami akan menikah</p>
              <h2 className="script hero__names">
                {groom.nick}
                <span>&amp;</span>
                {bride.nick}
              </h2>
              <p className="hero__date">{longDate}</p>
            </div>
          </div>
          <Slot kind="decor" src={rumputDepan} className="hero__front" />
        </section>

        {/* Kutipan */}
        <section className="quote">
          <div className="oval" data-reveal>
            <Slot kind="photo" src={photos.hero} label="Foto pasangan" />
          </div>
          <Slot kind="decor" src={buketOval} className="quote__bouquet anim rise sway-hang" />
          <Slot kind="scene" src={danauAirMancur} className="quote__scene fade-both anim zoom" />
          <div className="quote__text" data-reveal>
            <p>“{quote.text}”</p>
            <cite>{quote.by}</cite>
          </div>
        </section>

        {/* Medali nama */}
        <section className="medal">
          <Slot kind="scene" src={rumahUkiran} className="fade-both anim zoom" />
          <div className="medal__oval" data-reveal>
            <p className="eyebrow">Pernikahan</p>
            <p className="script">
              {groom.nick}
              <span>&amp;</span>
              {bride.nick}
            </p>
          </div>
        </section>

        {/* Mempelai */}
        <section className="couple paper">
          <h2 className="script title" data-reveal>Kedua Mempelai</h2>
          <p className="center" data-reveal style={{ margin: '10px 32px 0' }}>
            Dengan penuh syukur, kami mengundang Anda hadir di hari pernikahan kami.
          </p>
          <Person person={bride} photo={photos.bride} label="Foto Mempelai Wanita" side="left" flower={bungaKiri} />
          <p className="script couple__and" data-reveal>dan</p>
          <Person person={groom} photo={photos.groom} label="Foto Mempelai Pria" side="right" flower={bungaKanan} />
        </section>

        {/* Simpan tanggal: hitung mundur di dalam gapura */}
        <section className="date">
          <div className="date__arch">
            <Slot kind="scene" src={lorongTaman} className="date__view anim zoom" />
            <Slot kind="decor" src={gapuraBatu} className="date__frame anim settle" />
            <div className="date__text glow" data-reveal>
              <p className="eyebrow">Hitung mundur</p>
              <h2 className="script title">Simpan Tanggalnya</h2>
              <p className="date__day">{shortDay}</p>
              <div className="count">
                {countdown.map((c) => (
                  <div key={c.l}>
                    <b>{c.v}</b>
                    <span>{c.l}</span>
                  </div>
                ))}
              </div>
              <a className="btn date__btn" target="_blank" rel="noopener noreferrer" href={calendarLink(data)}>
                <CalendarPlus aria-hidden />
                Simpan ke Kalender
              </a>
            </div>
          </div>
          <Slot kind="decor" src={rumputDepan} className="date__front anim rise sway-grass" />
        </section>

        {/* Acara */}
        <section className="events">
          {events.map((e) => {
            const d = at(data, e.start)
            return (
              <article className="event" key={`${e.name}-${e.start}`}>
                <div className="event__text glow">
                  <h2 className="script title" data-reveal>Waktu &amp; Tempat</h2>
                  <h3 className="script event__name" data-reveal>{e.name}</h3>
                  <p className="script event__day" data-reveal>
                    {fmt(d, { weekday: 'long' })}, {fmt(d, { day: 'numeric' })}
                  </p>
                  <p className="event__month" data-reveal>{fmt(d, { month: 'long', year: 'numeric' })}</p>
                  <p className="event__time" data-reveal>
                    {e.start} sampai {e.end} {data.timezone}
                  </p>
                  <p className="event__venue" data-reveal>{e.venue}</p>
                  <p className="event__addr" data-reveal>{e.address}</p>
                  <a className="btn" data-reveal href={eventMapsHref(e)} target="_blank" rel="noopener noreferrer">
                    <MapPin aria-hidden />
                    Lihat Lokasi
                  </a>
                </div>
                <Slot kind="decor" src={pilarAirMancur} className="event__scene anim zoom" />
              </article>
            )
          })}
        </section>

        {/* RSVP */}
        <section className="block paper" id="rsvp">
          <h2 className="script title" data-reveal>Konfirmasi Kehadiran</h2>
          <p className="note" data-reveal>Mohon isi sebelum {deadline} ya, biar kami bisa siapkan tempat untuk Anda.</p>
          {rsvp ? (
            <div className="done">
              <p className="script">Terima kasih, {rsvp.name}</p>
              <p>{rsvp.attend ? `Kami tunggu kehadiran Anda (${rsvp.count} orang).` : 'Sayang sekali belum bisa hadir. Terima kasih sudah mengabari.'}</p>
              <button className="btn btn--ghost" onClick={() => saveRsvp(null)}>Ubah jawaban</button>
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
              <div className="phone">
                <span>+62</span>
                <input className="field" name="phone" inputMode="tel" placeholder="Nomor WhatsApp" maxLength={15} />
              </div>
              <select className="field" name="attend" required defaultValue="">
                <option value="" disabled>Apakah Anda akan hadir?</option>
                <option value="yes">Ya, saya akan hadir</option>
                <option value="no">Maaf, belum bisa hadir</option>
              </select>
              <select className="field" name="count" defaultValue="1">
                <option value="1">1 orang</option>
                <option value="2">2 orang</option>
                <option value="3">3 orang</option>
                <option value="4">4 orang</option>
              </select>
              <button className="btn btn--block">Kirim Konfirmasi</button>
            </form>
          )}
        </section>

        {/* Ucapan */}
        <section className="block" id="wishes" style={{ paddingTop: 24 }}>
          <h2 className="script title" data-reveal>Ucapan &amp; Doa</h2>
          <form
            className="form"
            data-reveal
            onSubmit={(e) => {
              e.preventDefault()
              const f = e.currentTarget
              const v = Object.fromEntries(new FormData(f))
              addWish({ name: String(v.name).trim(), msg: String(v.msg).trim(), date: fmt(new Date(), { day: 'numeric', month: 'short' }) })
              f.reset()
              setToast('Ucapan terkirim, terima kasih!')
            }}
          >
            <input className="field" name="name" placeholder="Nama" required maxLength={60} defaultValue={guest} />
            <textarea className="field" name="msg" placeholder="Tulis ucapan dan doa untuk kami" required maxLength={500} />
            <button className="btn btn--block">Kirim Ucapan</button>
          </form>
          <p className="note">{wishes.length} ucapan dari tamu</p>
          <div className="wishes__list">
            {wishes.map((w, i) => (
              <div className="wish" key={`${w.name}-${i}`}>
                <b>{w.name}</b>
                <small>{w.date}</small>
                <p>{w.msg}</p>
              </div>
            ))}
          </div>
        </section>

        <Slot kind="scene" src={pemandanganBunga} className="divider-scene fade-both anim zoom" />

        {/* Kado digital */}
        <section className="block paper center" id="gift" style={{ paddingTop: 40 }}>
          <h2 className="script title" data-reveal>Kado Digital</h2>
          <div className="tabs" role="tablist" data-reveal>
            <button role="tab" aria-selected={tab === 'bank'} onClick={() => setTab('bank')}>Amplop Digital</button>
            <button role="tab" aria-selected={tab === 'address'} onClick={() => setTab('address')}>Kirim Kado</button>
          </div>
          {tab === 'bank' ? (
            <>
              <p className="gift__intro">Doa restu Anda sudah lebih dari cukup. Kalau ingin memberi tanda kasih, bisa lewat rekening di bawah ini.</p>
              {data.accounts.map((a) => (
                <div className="card" key={a.number}>
                  <p className="eyebrow">{a.bank}</p>
                  <p className="card__num">{a.number}</p>
                  <p className="card__holder">a.n. {a.holder}</p>
                  <button className="copy" onClick={() => copy(a.number.replace(/\s/g, ''))}>
                    <Copy aria-hidden />
                    Salin
                  </button>
                </div>
              ))}
            </>
          ) : (
            <>
              <p className="gift__intro">Ingin mengirim kado ke rumah? Silakan kirim ke alamat berikut.</p>
              <div className="card">
                <p className="eyebrow">Alamat pengiriman</p>
                <p className="card__holder" style={{ fontSize: 14, marginTop: 6 }}>{data.giftAddress}</p>
                <button className="copy" onClick={() => copy(data.giftAddress)}>
                  <Copy aria-hidden />
                  Salin
                </button>
              </div>
            </>
          )}
        </section>

        {/* Galeri */}
        <section className="gallery">
          <Slot kind="scene" src={lanskapDanau} className="divider-scene fade-both anim zoom" />
          <h2 className="script title" data-reveal>Galeri</h2>
          {gallery.length > 0 && (
            <>
              <div className="slider" data-reveal>
                <div className="slider__main">
                  <Slot kind="photo" src={gallery[cur]} label="Foto galeri" />
                </div>
                {gallery.length > 1 && (
                  <>
                    <button className="slider__nav slider__nav--prev" onClick={() => show(cur - 1)} aria-label="Foto sebelumnya">
                      <ChevronLeft aria-hidden />
                    </button>
                    <button className="slider__nav slider__nav--next" onClick={() => show(cur + 1)} aria-label="Foto berikutnya">
                      <ChevronRight aria-hidden />
                    </button>
                  </>
                )}
              </div>
              <div className="thumbs" data-reveal>
                {gallery.map((g, i) => (
                  <button key={`${g}-${i}`} aria-label={`Foto ${i + 1}`} aria-current={i === cur} onClick={() => show(i)}>
                    <Slot kind="photo" src={g} />
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Penutup */}
        <section className="closing paper">
          <div className="closing__text">
            <h2 className="script title" data-reveal>Terima Kasih</h2>
            <p data-reveal>Kehadiran dan doa restu Anda berarti banyak buat kami. Sampai bertemu di hari bahagia kami, ya.</p>
          </div>
          <div className="closing__frame" data-reveal>
            <Slot kind="photo" src={photos.closing} label="Foto penutup" />
            <Slot kind="decor" src={bingkaiPenutup} />
          </div>
          <p className="script closing__sign" data-reveal>
            {groom.nick} &amp; {bride.nick}
          </p>
          <Slot kind="scene" src={tamanPenutup} className="fade-both anim zoom" />
        </section>
        <footer className="footer">Undangan digital dibuat dengan <b>Bridesmap</b></footer>
      </main>

      <div className={cn('toast', (copied || toast) && 'show')} role="status" aria-live="polite">
        {toast || (copied ? 'Tersalin' : '')}
      </div>
    </div>
  )
}

function Person({ person, photo, label, side, flower }: { person: Invitation['groom']; photo?: string; label: string; side: 'left' | 'right'; flower: string }) {
  return (
    <article className="person">
      <div className="person__photo" data-reveal>
        <Slot kind="photo" src={photo} label={label} />
        <Slot kind="decor" src={flower} className={`person__flower person__flower--${side} anim rise sway-${side}`} />
      </div>
      <h3 className="script person__name" data-reveal>{person.full}</h3>
      <p className="person__parents" data-reveal>
        {person.childOf}
        <b>{person.parents}</b>
      </p>
      {person.instagram && (
        <a className="ig" data-reveal href={`https://instagram.com/${person.instagram}`} target="_blank" rel="noopener noreferrer">
          <AtSign aria-hidden />@{person.instagram}
        </a>
      )}
    </article>
  )
}
