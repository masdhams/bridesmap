import { AtSign, CalendarPlus, Check, Copy, ImageIcon, MapPin } from 'lucide-react'
import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SAGE_DEMO, type Invitation } from '../../data/invitations'
import { cn } from '../../lib/utils'
import CalendarCard from './CalendarCard'
import Sparkle from './Sparkle'
import { at, calendarLink, fmt, mapsEmbed, mapsLink, parseDay, useCopy, useCountdown, useGuestBook, useReveal, useScrollLock, type GuestWish } from './shared'
import './sage.css'

/** Undangan digital template "Sage" — sampul amplop terbuka berisi foto, tanggal, dan segel berinisial (PRD #33).
 *  Tamu dibuka lewat `/undangan/sage?to=Nama+Tamu`; `&langsung` melewati amplop. */

const ASSET = '/undangan/sage/'

const PAPER = 'bg-[url(/undangan/sage/paper-texture.svg)] bg-[length:220px]'
const EYEBROW = 'text-[11px] font-semibold uppercase tracking-[.24em] text-muted-foreground'
const PILL = 'min-h-12 rounded-full bg-primary px-6 text-sm font-semibold text-background transition-colors hover:bg-primary-hover'
const INPUT = 'h-12 border-0 border-b border-[#CFC4B0] bg-transparent px-1 text-[15px] font-normal tracking-normal normal-case text-ink outline-none placeholder:text-muted-foreground focus:border-primary'


export default function SageInvitation({ data = SAGE_DEMO }: { data?: Invitation }) {
  const [params] = useSearchParams()
  const guest = params.get('to')?.trim() || 'Tamu Undangan'
  const [coverShown, setCoverShown] = useState(!params.has('langsung'))
  const rootRef = useRef<HTMLDivElement>(null)

  useScrollLock(coverShown)
  useReveal(rootRef, !coverShown)

  const enter = () => {
    window.scrollTo(0, 0)
    setCoverShown(false)
  }

  const { groom, bride } = data
  const day = parseDay(data.date)
  const first = data.events[0]
  const gcal = calendarLink(data)
  const dayLong = fmt(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div ref={rootRef} className="inv-sage flex min-h-dvh justify-center bg-[#2B3727] font-sans text-ink antialiased">
      <title>{`Undangan Pernikahan ${groom.nick} & ${bride.nick}`}</title>

      {coverShown && <EnvelopeCover data={data} guest={guest} onEnter={enter} />}

      <main className={cn('relative w-full max-w-[460px] overflow-hidden bg-background shadow-[0_0_60px_rgba(0,0,0,.25)]', PAPER)}>
        {/* Pembuka */}
        <section className="relative px-7 pt-16 pb-16 text-center">
          <Swirl variant="top" className="top-0 h-[150px] text-primary/40" />
          <div className="relative grid justify-items-center gap-6">
            <div data-reveal className="grid justify-items-center gap-2">
              <Sparkle className="text-primary" />
              <span className="mt-3 font-serif text-[22px] leading-none text-accent italic">
                Undangan pernikahan
              </span>
              <h1 className="m-0 font-serif text-[46px] font-normal leading-none tracking-[.02em] text-primary uppercase">
                {groom.nick} <span className="font-serif normal-case text-accent italic">&amp;</span> {bride.nick}
              </h1>
            </div>
            <div data-reveal className="relative w-[min(330px,100%)] pb-10">
              <Polaroid src={data.photos.hero} label="Foto prewedding" rotate={-3} tape className="w-[78%]" caption={`${groom.nick[0]} & ${bride.nick[0]} · ${day.getFullYear()}`} />
              <div className="absolute right-0 bottom-0 w-[42%]">
                <Polaroid src={data.photos.heroSmall} label="Foto kedua" rotate={6} small />
              </div>
            </div>
            <div data-reveal className="grid max-w-[32ch] justify-items-center gap-3">
              <h2 className="m-0 font-serif text-[32px] font-normal leading-[1.1] text-primary">Hari yang kami nantikan</h2>
              <p className="m-0 text-sm leading-[1.75] text-muted-foreground">
                Dengan penuh sukacita, kami mengundang Bapak/Ibu/Saudara/i untuk berbagi kebahagiaan di hari pernikahan kami.
              </p>
            </div>
          </div>
        </section>

        {/* Kutipan */}
        <section className={cn('relative grid justify-items-center gap-5 bg-primary px-9 py-16 text-center text-background', PAPER)}>
          <Sparkle data-reveal className="text-[#E2A592]" />
          <p data-reveal className="m-0 font-serif text-[25px] leading-[1.4] text-pretty">“{data.quote.text}”</p>
          <span data-reveal className="text-[11px] font-semibold tracking-[.22em] text-[#C9D0BC] uppercase">
            {data.quote.by}
          </span>
        </section>

        {/* Mempelai */}
        <section className="relative grid gap-10 px-6 py-[72px]">
          <Swirl variant="right" className="top-8 h-[260px] text-primary/30" />
          <SectionTitle kicker="Kedua mempelai" title="Dua Hati, Satu Janji" />
          <Person person={groom} role="Mempelai pria" photo={data.photos.groom} />
          <span data-reveal className="-my-4 text-center font-serif text-[56px] leading-none text-accent italic">
            &amp;
          </span>
          <Person person={bride} role="Mempelai wanita" photo={data.photos.bride} flip />
        </section>

        {/* Love story */}
        <section className="relative grid gap-10 px-6 pt-6 pb-[72px]">
          <SectionTitle kicker="Perjalanan kami" title="Love Story" />
          <Timeline items={data.story.map((s) => ({ key: s.year, left: s.year, title: s.title, body: s.text }))} />
        </section>

        {/* Tanggal */}
        <section className="relative grid justify-items-center gap-8 px-6 pb-[72px]">
          <Swirl variant="left" className="-top-6 h-[240px] text-primary/30" />
          <div data-reveal className="relative grid justify-items-center gap-1 text-center">
            <Sparkle className="text-primary" />
            <span className="mt-3 font-serif text-[20px] leading-none text-accent italic">
              Tanggal pernikahan
            </span>
            <span className="font-serif text-[44px] leading-[1.1] tracking-[.02em] text-primary tabular-nums">
              {[day.getDate(), day.getMonth() + 1, day.getFullYear()].map((n) => String(n).padStart(2, '0')).join(' / ')}
            </span>
          </div>
          <CalendarCard day={day} />
          <a href={gcal} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-5 text-xs font-semibold uppercase tracking-[.12em] text-primary no-underline transition-colors hover:bg-primary hover:text-background">
            <CalendarPlus className="size-4" strokeWidth={1.75} />
            Simpan ke Kalender
          </a>
        </section>

        {/* Rangkaian acara */}
        <section className={cn('relative grid gap-10 bg-primary px-6 py-[72px] text-background', PAPER)}>
          <Sparkle className="absolute top-7 right-8 size-5 text-[#E2A592]" />
          <div data-reveal className="grid justify-items-center gap-1 text-center">
            <h2 className="m-0 font-serif text-[40px] font-normal leading-[1.05] text-background">Rangkaian Acara</h2>
            <span className="font-serif text-[20px] leading-none text-[#C9D0BC] italic">
              Kami menanti Anda
            </span>
            <span className="mt-4 text-[11px] font-semibold uppercase tracking-[.22em] text-[#C9D0BC]">{dayLong}</span>
          </div>
          <Timeline
            light
            items={data.events.map((e) => ({
              key: e.name,
              left: e.start,
              title: e.name,
              body: (
                <>
                  <span className="font-semibold text-background">
                    {e.start} – {e.end} {data.timezone}
                  </span>
                  <br />
                  {e.venue}, {e.address}
                </>
              ),
            }))}
          />
        </section>

        {/* Lokasi */}
        <section className="relative grid gap-8 px-6 py-[72px]">
          <SectionTitle kicker="Tempat acara" title="Lokasi" />
          <div data-reveal className="relative">
            <div className="ml-auto w-[88%] rotate-[2deg] bg-white p-2 shadow-[0_2px_4px_rgba(34,38,31,.08),0_22px_40px_-16px_rgba(34,38,31,.35)]">
              <iframe
                title={`Peta ${data.mapsQuery}`}
                src={mapsEmbed(data.mapsQuery)}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-[230px] w-full border-0 bg-muted"
              />
            </div>
            <div className="relative -mt-14 w-[82%] -rotate-[1.5deg] border border-border bg-background p-5 shadow-[0_2px_4px_rgba(34,38,31,.08),0_18px_34px_-14px_rgba(34,38,31,.35)]">
              <Sparkle className="absolute top-4 left-4 size-3 text-primary" />
              <div className="grid justify-items-center gap-1 text-center">
                <span className="font-serif text-[18px] leading-none text-accent italic">
                  {first.name}
                </span>
                <span className="font-serif text-[26px] leading-[1.1] text-primary uppercase">{first.venue}</span>
                <span className="mt-1 text-[13px] leading-snug text-muted-foreground">{first.address}</span>
                <a
                  href={data.mapsUrl || mapsLink(data.mapsQuery)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 bg-primary px-5 text-[13px] font-semibold text-background no-underline transition-colors hover:bg-primary-hover hover:text-background"
                >
                  <MapPin className="size-4" strokeWidth={1.75} />
                  Petunjuk arah
                </a>
              </div>
            </div>
          </div>
          <p data-reveal className="m-0 mx-auto max-w-[34ch] text-center text-sm leading-[1.75] text-muted-foreground">
            Kami memilih tempat ini karena suasananya yang hangat — semoga menjadi bagian dari kenangan indah kita bersama.
          </p>
        </section>

        {/* Hitung mundur */}
        <section className="relative grid gap-6 px-6 pb-[72px]">
          <SectionTitle kicker="Menuju hari bahagia" title="Sebentar Lagi" />
          <Countdown target={at(data, first.start).getTime()} />
        </section>

        {/* Galeri */}
        <section className={cn('relative grid gap-10 bg-muted px-5 py-[72px]', PAPER)}>
          <SectionTitle kicker="Momen kami" title="Galeri" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            {GALLERY_TILTS.map((tilt, i) => (
              <div data-reveal key={i} className={cn(i % 2 === 1 && 'translate-y-6')}>
                <Polaroid src={data.photos.gallery[i]} label={`Foto ${i + 1}`} rotate={tilt} small />
              </div>
            ))}
          </div>
        </section>

        <Rsvp deadline={parseDay(data.rsvpDeadline)} />
        <Wishes />

        {/* Hadiah */}
        <section className={cn('relative grid gap-6 bg-muted px-6 py-[72px]', PAPER)}>
          <SectionTitle kicker="Tanda kasih" title="Wedding Gift" />
          <p data-reveal className="mx-auto my-0 max-w-[34ch] text-center text-sm leading-[1.75] text-muted-foreground">
            Doa restu Anda sudah lebih dari cukup. Bila ingin memberi tanda kasih, dapat melalui:
          </p>
          {data.accounts.map((a) => (
            <BankCard key={a.bank + a.number} {...a} />
          ))}
          {data.giftAddress && (
            <div data-reveal className="relative grid justify-items-center gap-1 border border-dashed border-[#CFC4B0] bg-background/70 p-5 text-center">
              <span className="font-serif text-[18px] leading-none text-accent italic">
                Kirim kado
              </span>
              <span className="text-sm leading-relaxed text-ink">
                {groom.nick} &amp; {bride.nick}
                <br />
                {data.giftAddress}
              </span>
            </div>
          )}
        </section>

        {/* Penutup */}
        <section className="relative grid justify-items-center gap-6 px-8 pt-20 pb-20 text-center">
          <Swirl variant="top" className="top-0 h-[150px] rotate-180 text-primary/30" />
          <Sparkle data-reveal className="text-primary" />
          <p data-reveal className="m-0 max-w-[34ch] text-sm leading-[1.8] text-pretty text-muted-foreground">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.
          </p>
          <span data-reveal className="font-serif text-[24px] leading-[1.2] text-balance text-accent italic">
            Sampai jumpa di hari bahagia kami
          </span>
          <div data-reveal className="grid gap-2">
            <span className={EYEBROW}>Kami yang berbahagia</span>
            <span className="font-serif text-[44px] leading-none text-primary uppercase">
              {groom.nick} <span className="font-serif normal-case text-accent italic">&amp;</span> {bride.nick}
            </span>
            {data.families && <span className="text-[13px] text-muted-foreground">{data.families}</span>}
          </div>
        </section>
        <footer className="bg-primary p-[22px] text-center text-xs tracking-[.04em] text-[#C9D0BC]">
          Dibuat dengan{' '}
          <span className="font-serif text-[17px] text-background">
            Brides<i className="text-[#C9D0BC]">map</i>
          </span>
        </footer>
      </main>
    </div>
  )
}

/** Kemiringan foto galeri, bergantian kiri-kanan supaya terasa seperti foto yang diletakkan tangan. */
const GALLERY_TILTS = [-3, 2.5, 2, -2.5, -1.5, 3]

/* ---------- Sampul amplop ---------- */

/* Posisi di gambar amplop terbuka (persen dari bingkai 1131×1391). Jendela foto di gambar transparan,
   jadi foto diletakkan di belakang gambar dan bunga di depannya tetap terlihat. */
const PHOTO_SLOTS: CSSProperties[] = [
  { left: '8.13%', top: '17.33%', width: '32.71%', height: '37.4%', transform: 'rotate(-7.88deg)' },
  { left: '45.27%', top: '2.37%', width: '32.54%', height: '37.4%', transform: 'rotate(9.85deg)' },
]

function EnvelopeCover({ data, guest, onEnter }: { data: Invitation; guest: string; onEnter: () => void }) {
  const { groom, bride } = data
  const day = parseDay(data.date)
  const dateShort = [day.getDate(), day.getMonth() + 1, day.getFullYear()].map((n) => String(n).padStart(2, '0')).join(' · ')
  // Ukuran nama menyesuaikan panjangnya supaya tetap satu baris.
  const nameSize = Math.min(13, 190 / (groom.nick.length + bride.nick.length + 3))
  const dateLong = fmt(day, { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()

  return (
    <div className={cn('fixed inset-0 z-50 mx-auto w-full max-w-[460px] bg-background text-center', PAPER)}>
      <div className="pointer-events-none absolute inset-3.5 rounded border border-border" />
      <div className="absolute inset-0 overflow-x-hidden overflow-y-auto">
        <div className="flex min-h-full flex-col items-center justify-center gap-[clamp(10px,2.2vh,20px)] px-6 pt-[clamp(28px,5vh,48px)] pb-[clamp(32px,5vh,56px)]">
          <div className="grid justify-items-center gap-2" style={{ containerType: 'inline-size', width: 'min(400px, 88vw)' }}>
            <span className="font-semibold uppercase tracking-[.26em] text-muted-foreground" style={{ fontSize: 'max(11px, 2.8cqw)' }}>
              Undangan Pernikahan
            </span>
            <span className="font-serif whitespace-nowrap leading-none text-primary" style={{ fontSize: `${nameSize}cqw` }}>
              {groom.nick} <span className="text-accent italic">&amp;</span> {bride.nick}
            </span>
            <span className="font-serif tracking-[.12em] text-[#59634A] tabular-nums" style={{ fontSize: '4.6cqw' }}>
              {dateShort}
            </span>
          </div>

          <div className="relative flex-none" style={{ width: 'min(400px, 88vw, calc((100svh - 330px) * .813))', aspectRatio: '1131 / 1391', containerType: 'inline-size' }}>
            {PHOTO_SLOTS.map((slot, i) => (
              <Photo key={i} src={data.photos.envelope[i]} label="Foto mempelai" className="absolute origin-top-left" style={slot} />
            ))}
            <img src={`${ASSET}open-scene.webp`} alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full select-none" />

            {/* Tanggal acara di kartu bundar */}
            <div className="absolute inset-x-[30%] top-[51%] grid justify-items-center leading-none text-[#4F5A43]">
              <span className="pl-[.3em] font-semibold tracking-[.3em] uppercase" style={{ fontSize: '2cqw' }}>
                {fmt(day, { weekday: 'long' })}
              </span>
              <span className="mt-[1.4cqw] font-serif whitespace-nowrap tabular-nums" style={{ fontSize: `${Math.min(4.6, 58 / dateLong.length)}cqw` }}>
                {dateLong}
              </span>
              <span className="mt-[1.6cqw] pl-[.14em] font-semibold tracking-[.14em] uppercase" style={{ fontSize: '1.9cqw' }}>
                Pukul {data.events[0].start} {data.timezone}
              </span>
            </div>

            {/* Inisial di segel lilin (segel di gambar polos), diameter segel 12.64% lebar gambar */}
            <div className="absolute top-[75.1%] left-[49.65%] aspect-square w-[12.64%] -translate-x-1/2 -translate-y-1/2" style={{ containerType: 'inline-size' }}>
              <SealMark first={groom.nick[0]} second={bride.nick[0]} />
            </div>
          </div>

          <div className="grid flex-none gap-1.5">
            <span className="text-xs text-muted-foreground">Kepada Yth. Bapak/Ibu/Saudara/i</span>
            <span className="font-serif text-[30px] leading-tight text-ink">{guest}</span>
          </div>
          <button type="button" onClick={onEnter} className={cn(PILL, 'px-[30px] tracking-[.04em]')}>
            Buka Undangan
          </button>
        </div>
      </div>
    </div>
  )
}

/** Inisial timbul di segel. Ukurannya dikecilkan otomatis supaya selalu muat di bidang datar segel. */
function SealMark({ first, second }: { first: string; second: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [fit, setFit] = useState(1)
  useLayoutEffect(() => {
    let cancelled = false
    document.fonts.ready.then(() => {
      const el = ref.current
      const seal = el?.parentElement
      if (cancelled || !el || !seal) return
      setFit(Math.min(1, (seal.clientWidth * 0.5) / el.offsetWidth))
    })
    return () => {
      cancelled = true
    }
  }, [first, second])
  return (
    <span
      ref={ref}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[50%] whitespace-nowrap font-serif leading-none text-[#7A6A4B] italic [text-shadow:0_1px_0_rgba(255,255,255,.75)]"
      style={{ fontSize: `${32 * fit}cqi` }}
    >
      {first}
      <span className="mx-[.03em] text-[.6em]">&amp;</span>
      {second}
    </span>
  )
}

/* ---------- Bagian isi ---------- */

/** Foto pasangan; tanpa foto tampil sebagai bingkai kosong bertanda. */
function Photo({ src, label, className, style, compact }: { src?: string; label: string; className?: string; style?: CSSProperties; compact?: boolean }) {
  if (src) return <img src={src} alt={label} className={cn('object-cover', className)} style={style} />
  return (
    <div role="img" aria-label={label} className={cn('grid place-items-center bg-[linear-gradient(135deg,#E6EBDD,#D3DBC5)] text-[#59634A]', className)} style={style}>
      <span className="flex max-w-[75%] flex-col items-center gap-1 text-center text-[10px] font-semibold uppercase leading-snug tracking-[.14em] opacity-70">
        <ImageIcon className={compact ? 'size-4' : 'size-5'} strokeWidth={1.5} />
        {!compact && label}
      </span>
    </div>
  )
}

const SWIRLS = {
  top: 'M-10 70C60 20 120 120 200 70S330 0 410 50',
  right: 'M410 10C330 40 380 120 310 150C250 175 240 110 300 115C360 120 350 210 410 250',
  left: 'M-10 10C70 40 20 120 90 150C150 175 160 110 100 115C40 120 50 210 -10 250',
}

/** Garis lengkung tipis seperti goresan pena; warna mengikuti `text-*`. */
function Swirl({ variant, className }: { variant: keyof typeof SWIRLS; className?: string }) {
  return (
    <svg viewBox={variant === 'top' ? '0 0 400 140' : '0 0 400 260'} preserveAspectRatio="none" aria-hidden className={cn('pointer-events-none absolute inset-x-0 w-full', className)}>
      <path d={SWIRLS[variant]} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div data-reveal className="relative grid justify-items-center gap-1 text-center">
      <Sparkle className="text-primary" />
      <span className="mt-3 font-serif text-[20px] leading-none text-accent italic">
        {kicker}
      </span>
      <h2 className="m-0 font-serif text-[40px] font-normal leading-[1.05] text-primary">{title}</h2>
    </div>
  )
}

/** Foto berbingkai putih ala polaroid, sedikit dimiringkan. */
function Polaroid({ src, label, rotate = 0, caption, tape, small, className }: { src?: string; label: string; rotate?: number; caption?: string; tape?: boolean; small?: boolean; className?: string }) {
  return (
    <figure
      className={cn('relative m-0 bg-white shadow-[0_2px_4px_rgba(34,38,31,.08),0_22px_40px_-16px_rgba(34,38,31,.35)]', small ? 'p-2 pb-6' : 'p-3 pb-12', className)}
      style={{ rotate: `${rotate}deg` }}
    >
      <Photo src={src} label={label} className="aspect-[4/5] w-full" />
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-3.5 text-center font-serif text-[17px] leading-none text-muted-foreground italic">
          {caption}
        </figcaption>
      )}
      {tape && <span className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-3 bg-[rgba(226,214,191,.75)] shadow-[0_1px_2px_rgba(34,38,31,.1)]" />}
    </figure>
  )
}

/** Mempelai: foto polaroid di satu sisi, nama & orang tua di sisi lain; `flip` menukar sisi. */
function Person({ person, role, photo, flip }: { person: Invitation['groom']; role: string; photo?: string; flip?: boolean }) {
  return (
    <div data-reveal className={cn('relative flex items-center gap-5', flip && 'flex-row-reverse')}>
      <Polaroid src={photo} label={`Foto ${role.toLowerCase()}`} rotate={flip ? 4 : -4} small className="w-[44%] flex-none" />
      <div className={cn('grid min-w-0 gap-1.5', flip ? 'text-right' : 'text-left')}>
        <span className="font-serif text-[18px] leading-none text-accent italic">
          {role}
        </span>
        <h3 className="m-0 font-serif text-[27px] font-normal leading-[1.1] text-primary">{person.full}</h3>
        <p className="m-0 text-[13px] leading-[1.6] text-muted-foreground">
          {person.childOf}
          <br />
          <span className="font-semibold text-ink">{person.parents}</span>
        </p>
        {person.instagram && (
          <a
            href={`https://instagram.com/${person.instagram}`}
            target="_blank"
            rel="noreferrer"
            className={cn('inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-accent no-underline hover:text-primary', flip && 'justify-end')}
          >
            <AtSign className="size-3.5" strokeWidth={2} />
            {person.instagram}
          </a>
        )}
      </div>
    </div>
  )
}

/** Garis waktu: label kiri (tahun/jam), garis bergelombang dengan bintang, isi di kanan. */
function Timeline({ items, light }: { items: { key: string; left: string; title: string; body: ReactNode }[]; light?: boolean }) {
  return (
    <div className="relative grid gap-9">
      <svg viewBox="0 0 20 100" preserveAspectRatio="none" aria-hidden className={cn('pointer-events-none absolute top-3 bottom-3 left-[76px] h-[calc(100%-24px)] w-5', light ? 'text-[#C9D0BC]/50' : 'text-primary/35')}>
        <path d="M10 0C18 12 2 22 10 34S18 56 10 68 2 88 10 100" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {items.map((it) => (
        <div data-reveal key={it.key} className="relative grid grid-cols-[64px_20px_1fr] items-start gap-x-3">
          <span className={cn('pt-0.5 text-right font-serif text-[24px] leading-none tabular-nums', light ? 'text-background' : 'text-primary')}>
            {it.left}
          </span>
          <Sparkle className={cn('mt-1.5 size-3.5 justify-self-center', light ? 'text-[#E2A592]' : 'text-accent')} />
          <div className="grid gap-1">
            <span className={cn('font-serif text-[24px] leading-[1.1]', light ? 'text-background' : 'text-primary')}>{it.title}</span>
            <p className={cn('m-0 text-[13px] leading-[1.65]', light ? 'text-[#C9D0BC]' : 'text-muted-foreground')}>{it.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function Countdown({ target }: { target: number }) {
  const units = useCountdown(target)
  return (
    <div data-reveal className="flex items-start justify-center gap-2.5" role="timer" aria-label={`${units[0].v} hari menuju hari bahagia`}>
      {units.map((u, i) => (
        <Fragment key={u.l}>
          {i > 0 && <span className="pt-3 text-[22px] leading-none text-accent">·</span>}
          <div className="grid min-w-[52px] justify-items-center gap-1">
            <span className="font-serif text-[44px] leading-none text-primary tabular-nums">
              {u.v}
            </span>
            <span className="text-[10px] font-semibold tracking-[.18em] text-muted-foreground uppercase">
              {u.l}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

const BOOK_KEY = 'bc-inv-sage'


function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn('h-11 rounded-full border text-sm font-semibold tracking-normal normal-case transition-colors', active ? 'border-primary bg-primary text-background' : 'border-[#CFC4B0] bg-transparent text-primary hover:border-primary')}
    >
      {children}
    </button>
  )
}

function Rsvp({ deadline }: { deadline: Date }) {
  const { rsvp: saved, saveRsvp, guestName } = useGuestBook(BOOK_KEY, [])
  const [name, setName] = useState(guestName)
  const [attend, setAttend] = useState(true)
  const [count, setCount] = useState(1)
  const valid = name.trim().length > 0

  const submit = () => {
    if (!valid) return
    saveRsvp({ name: name.trim(), attend, count })
  }

  return (
    <section className="relative grid gap-8 px-6 py-[72px]">
      <Swirl variant="right" className="top-6 h-[220px] text-primary/30" />
      <SectionTitle kicker="Konfirmasi kehadiran" title="RSVP" />
      <p data-reveal className="m-0 -mt-4 text-center text-sm text-muted-foreground">
        Mohon konfirmasi sebelum {fmt(deadline, { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <div data-reveal className="relative grid gap-5 border border-border bg-white p-6 shadow-[0_1px_2px_rgba(52,67,47,.06),0_18px_40px_-16px_rgba(52,67,47,.25)]">
        {saved ? (
          <div className="grid justify-items-center gap-2 py-3 text-center">
            <Sparkle className="text-accent" />
            <span className="font-serif text-[28px] leading-tight text-primary">Terima kasih, {saved.name}</span>
            <p className="m-0 text-sm text-muted-foreground">{saved.attend ? `Kehadiran ${saved.count} orang sudah kami catat.` : 'Doa Anda tetap kami nantikan.'}</p>
            <button
              type="button"
              onClick={() => {
                setName(saved.name)
                setAttend(saved.attend)
                setCount(saved.count || 1)
                saveRsvp(null)
              }}
              className="min-h-11 px-3 text-[13px] font-semibold text-accent underline underline-offset-4"
            >
              Ubah konfirmasi
            </button>
          </div>
        ) : (
          <>
            <label className="grid gap-1.5 text-[11px] font-semibold tracking-[.14em] text-muted-foreground uppercase">
              Nama
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" autoComplete="name" className={INPUT} />
            </label>
            <div className="grid gap-2 text-[11px] font-semibold tracking-[.14em] text-muted-foreground uppercase">
              Kehadiran
              <div className="grid grid-cols-2 gap-2">
                <Choice active={attend} onClick={() => setAttend(true)}>Hadir</Choice>
                <Choice active={!attend} onClick={() => setAttend(false)}>Berhalangan</Choice>
              </div>
            </div>
            {attend && (
              <div className="grid gap-2 text-[11px] font-semibold tracking-[.14em] text-muted-foreground uppercase">
                Jumlah tamu
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <Choice key={n} active={count === n} onClick={() => setCount(n)}>{n}</Choice>
                  ))}
                </div>
              </div>
            )}
            <button type="button" onClick={submit} disabled={!valid} className={cn(PILL, 'mt-1 h-[50px] disabled:opacity-50')}>
              Kirim Konfirmasi
            </button>
          </>
        )}
      </div>
    </section>
  )
}

const SAMPLE_WISHES: GuestWish[] = [
  { name: 'Sekar & Dimas', date: '24 Okt', msg: 'Selamat menempuh hidup baru! Semoga selalu bahagia dan saling menguatkan.' },
  { name: 'Tante Wulan', date: '22 Okt', msg: 'Bahagia sekali mendengar kabar ini. Semoga lancar sampai hari H.' },
  { name: 'Arif', date: '20 Okt', msg: 'Akhirnya! Ditunggu di Jogja, bro.' },
]

function Wishes() {
  const { wishes, addWish, guestName } = useGuestBook(BOOK_KEY, SAMPLE_WISHES)
  const [name, setName] = useState(guestName)
  const [msg, setMsg] = useState('')
  const valid = name.trim() && msg.trim()

  const submit = () => {
    if (!valid) return
    addWish({ name: name.trim(), msg: msg.trim(), date: fmt(new Date(), { day: 'numeric', month: 'short' }) })
    setMsg('')
  }

  return (
    <section className={cn('relative grid gap-8 bg-muted px-6 py-[72px]', PAPER)}>
      <SectionTitle kicker="Untuk kedua mempelai" title="Ucapan & Doa" />
      <p data-reveal className="m-0 -mt-4 text-center text-sm text-muted-foreground">{wishes.length} ucapan dari tamu</p>
      <div data-reveal className="grid gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" aria-label="Nama" className={INPUT} />
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Tulis ucapan dan doa untuk kedua mempelai"
          aria-label="Ucapan dan doa"
          rows={3}
          className="resize-y border-0 border-b border-[#CFC4B0] bg-transparent px-1 py-3 text-[15px] text-ink outline-none placeholder:text-muted-foreground focus:border-primary"
        />
        <button type="button" onClick={submit} disabled={!valid} className={cn(PILL, 'mt-1 h-[50px] disabled:opacity-50')}>
          Kirim Ucapan
        </button>
      </div>
      <div className="-mx-2 grid max-h-[460px] gap-4 overflow-auto px-3 py-2">
        {wishes.map((w, i) => (
          <div
            key={i}
            className="relative grid gap-1.5 bg-white p-4 pl-11 shadow-[0_1px_2px_rgba(52,67,47,.06),0_12px_24px_-14px_rgba(52,67,47,.3)]"
            style={{ rotate: `${i % 2 ? 0.6 : -0.6}deg` }}
          >
            <span aria-hidden className="absolute top-2 left-3 font-serif text-[44px] leading-none text-accent/40">“</span>
            <div className="flex items-baseline justify-between gap-3">
              <b className="font-serif text-[19px] font-normal text-primary">{w.name}</b>
              <span className="text-[11px] whitespace-nowrap text-muted-foreground">{w.date}</span>
            </div>
            <p className="m-0 text-sm leading-relaxed text-pretty text-ink">{w.msg}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function BankCard({ bank, number, holder }: Invitation['accounts'][number]) {
  const { copied, copy } = useCopy()
  return (
    <div data-reveal className="relative bg-white p-1.5 shadow-[0_1px_2px_rgba(52,67,47,.06),0_18px_34px_-16px_rgba(52,67,47,.3)]">
      <div className="flex items-center justify-between gap-3 border border-dashed border-[#CFC4B0] p-4">
        <div className="grid min-w-0 gap-0.5">
          <span className="text-[11px] font-bold uppercase tracking-[.22em] text-accent">{bank}</span>
          <span className="text-[20px] font-semibold tracking-[.06em] text-ink tabular-nums">
            {number}
          </span>
          <span className="text-xs text-muted-foreground">a.n. {holder}</span>
        </div>
        <button
          type="button"
          onClick={() => copy(number.replace(/\s/g, ''))}
          className={cn('inline-flex min-h-11 flex-none items-center gap-1.5 rounded-full border border-primary px-4 text-xs font-semibold transition-colors', copied ? 'bg-primary text-background' : 'bg-white text-primary hover:bg-primary-soft')}
        >
          {copied ? <Check className="size-3.5" strokeWidth={2.25} /> : <Copy className="size-3.5" strokeWidth={2} />}
          {copied ? 'Tersalin' : 'Salin'}
        </button>
      </div>
    </div>
  )
}
