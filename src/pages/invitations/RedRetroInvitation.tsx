import { Check, Copy, ImageIcon } from 'lucide-react'
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RED_RETRO_DEMO, type Invitation } from '../../data/invitations'
import { cn } from '../../lib/utils'
import { at, calendarLink, eventMapsHref, fmt, parseDay, useCopy, useCountdown, useGuestBook, useReveal, useScrollLock, type GuestWish } from './shared'
import coverNotebook from '../../assets/red-retro/cover-notebook.webp'
import coverTape from '../../assets/red-retro/cover-tape.webp'
import memoClip from '../../assets/red-retro/memo-clip.webp'
import oldBook from '../../assets/red-retro/old-book.webp'
import tearDown1 from '../../assets/red-retro/tear-down-1.webp'
import tearDown2 from '../../assets/red-retro/tear-down-2.webp'
import tearUp1 from '../../assets/red-retro/tear-up-1.webp'
import tearUp2 from '../../assets/red-retro/tear-up-2.webp'
import tearUp3 from '../../assets/red-retro/tear-up-3.webp'
import './red-retro.css'

/** Undangan digital template "Red Retro": scrapbook kliping koran vintage, merah bata dan kertas krem (PRD #33).
 *  Desain, font (Oswald, Caveat, PT Serif), dan animasi mengikuti referensi "Kliping Asmara".
 *  Tamu dibuka lewat `/undangan/red-retro?to=Nama+Tamu`; `&langsung` melewati sampul. */

const FONTS = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Oswald:wght@400;500;600&family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap'
const OSWALD = "'Oswald', 'Arial Narrow', sans-serif"
const CAVEAT = "'Caveat', cursive"
const SERIF = "'PT Serif', Georgia, serif"

const BUTTON =
  'inline-flex min-h-12 items-center justify-center bg-[#A8352A] px-7 text-[12px] font-bold uppercase tracking-[.2em] text-[#F6F1EA] no-underline shadow-[0_6px_14px_-6px_rgba(42,34,32,.6)] outline outline-1 -outline-offset-[5px] outline-[#F6F1EA]/70 transition-colors hover:bg-[#8F2B21] hover:text-[#F6F1EA]'
/* Kartu kertas buku tulis: semua isi mengikuti kisi 34px (satu baris = satu garis kertas).
   Teks memakai leading 34px; tombol setinggi dua baris; tautan kecil diperluas area sentuhnya tanpa mengubah tata letak. */
const NOTEBOOK = 'rr-notebook py-[34px] pr-5 pl-14 text-[14px] leading-[34px] text-[#2A2220] shadow-[0_18px_30px_-16px_rgba(0,0,0,.6)]'
const TWO_ROWS = 'my-[9px] h-[50px] min-h-0'
const ROW_LINK = 'relative inline-flex h-[34px] items-center text-[13px] font-bold text-[#2A2220] underline underline-offset-4 before:absolute before:-inset-x-2 before:-inset-y-[5px] hover:text-[#A8352A]'
const LINE_INPUT = 'block h-[34px] w-full border-0 bg-transparent px-1 text-[15px] leading-[34px] text-[#2A2220] outline-none placeholder:text-[#6B605A] focus:bg-[#A8352A]/[.07]'

/* Stiker foto potongan (kaset, bekas lipstik, koran, dll.) diambil dari src/assets/red-retro/.
   File yang belum ada tidak ditampilkan; cukup taruh file dengan nama yang sama untuk memunculkannya. */
const DECOR = import.meta.glob('../../assets/red-retro/*.{png,webp,jpg,jpeg,svg}', { eager: true, import: 'default' }) as Record<string, string>
const decorSrc = (name: string) => Object.entries(DECOR).find(([path]) => path.split('/').pop()?.replace(/\.\w+$/, '') === name)?.[1]

export default function RedRetroInvitation({ data = RED_RETRO_DEMO }: { data?: Invitation }) {
  const [params] = useSearchParams()
  const guest = params.get('to')?.trim() || 'Tamu Undangan'
  const [cover, setCover] = useState<'shown' | 'leaving' | 'gone'>(params.has('langsung') ? 'gone' : 'shown')
  const rootRef = useRef<HTMLDivElement>(null)
  useScrollLock(cover !== 'gone')
  useReveal(rootRef, cover !== 'shown', 0.12)

  const { groom, bride } = data
  const day = parseDay(data.date)
  const open = () => {
    if (cover !== 'shown') return
    window.scrollTo(0, 0)
    setCover('leaving')
    window.setTimeout(() => setCover('gone'), 1000)
  }

  return (
    <div ref={rootRef} className="inv-red-retro flex min-h-dvh justify-center bg-[#3A2A26] text-[#2A2220] antialiased" style={{ fontFamily: SERIF }}>
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <title>{`Undangan Pernikahan ${groom.nick} & ${bride.nick}`}</title>

      {cover !== 'gone' && <Cover data={data} guest={guest} leaving={cover === 'leaving'} onOpen={open} />}

      <main className="relative w-full max-w-[460px] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,.45)]">
        {/* Untuk kamu */}
        <Section tone="red">
          <Title kicker="dengan penuh cinta" title="Untuk Kamu" light arrow />
          <OpenBook data={data} />
          <div data-reveal className="grid justify-items-center gap-3 text-center text-[#F6F1EA]">
            <span className="text-[30px] leading-none font-bold" style={{ fontFamily: CAVEAT }}>
              Halo, kamu.
            </span>
            <p className="m-0 max-w-[34ch] text-[15px] leading-[1.7] text-pretty">
              Dengan memohon rahmat Tuhan Yang Maha Esa, kami bermaksud melangsungkan pernikahan. Merupakan kebahagiaan bagi kami apabila kamu berkenan hadir dan memberikan doa restu di hari istimewa kami.
            </p>
            <span className="mt-1 text-[13px] font-medium uppercase tracking-[.3em]" style={{ fontFamily: OSWALD }}>
              {data.groom.nick} &amp; {data.bride.nick}
            </span>
          </div>
        </Section>

        {/* Mempelai */}
        <Section tone="cream" tear={0}>
          <Title kicker="dua hati, satu cerita" title="Mempelai" />
          <Person person={groom} photo={data.photos.groom} rotate={-3} decor="cassette" />
          <span data-reveal="zoom" className="-my-4 block text-center text-[64px] leading-none text-[#A8352A]" style={{ fontFamily: OSWALD }}>
            &amp;
          </span>
          <Person person={bride} photo={data.photos.bride} rotate={3} decor="kiss" flip />
        </Section>

        {/* Kisah kami */}
        <Section tone="red" tear={0}>
          <Decor name="roller-skate" sway="r" className="-top-2 right-3 w-24" />
          <Decor name="mug" sway="l" className="bottom-5 left-4 w-24" />
          <Title kicker="cerita kecil kami" title="Kisah Kami" light />
          <div className="grid gap-12">
            {data.story.map((s, i) => (
              <div data-reveal key={s.year} className={cn('flex items-center gap-5', i % 2 === 1 && 'flex-row-reverse')}>
                <div className="w-[46%] flex-none">
                  <Polaroid src={s.photo} label={`Foto ${s.title.toLowerCase()}`} rotate={i % 2 ? 4 : -4} tape={i % 2 ? 'kraft' : 'gingham'} />
                </div>
                <div className={cn('grid gap-1.5 text-[#F6F1EA]', i % 2 === 1 ? 'text-right' : 'text-left')}>
                  <span className="text-[12px] font-medium tracking-[.3em]" style={{ fontFamily: OSWALD }}>
                    {s.year}
                  </span>
                  <span className="text-[32px] leading-none font-bold" style={{ fontFamily: CAVEAT }}>
                    {s.title}
                  </span>
                  <p className="m-0 text-[14px] leading-[1.6]">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Save the date */}
        <Section tone="cream" tear={1}>
          <Title kicker="menuju hari bahagia" title="Save the Date" />
          <CalendarPad day={day} />
          <CountdownTicket target={at(data, data.events[0].start).getTime()} />
          <a data-reveal href={calendarLink(data)} target="_blank" rel="noreferrer" className={cn(BUTTON, 'justify-self-center')}>
            Simpan ke kalender
          </a>
        </Section>

        {/* Acara */}
        <Section tone="red" tear={1}>
          <Decor name="gingham-hearts" sway="c" className="top-[51%] -right-2 w-20 rotate-6" />
          <Decor name="stamp-romance" sway="c" className="top-12 left-4 w-14 -rotate-[10deg]" />
          <Title kicker="catat tanggalnya, ya" title="Acara" light />
          {data.events.map((e, i) => (
            <EventNote key={e.name} data={data} event={e} labelRight={i % 2 === 0} />
          ))}
        </Section>

        {/* Galeri */}
        <Section tone="cream" tear={0}>
          <Decor name="taxi" sway="l" className="top-[38%] -left-6 w-32" />
          <Decor name="street-lamp" className="top-10 -right-2 w-16" />
          <Decor name="instant-camera" sway="r" className="right-4 bottom-8 w-20" />
          <Title kicker="potongan momen kami" title="Galeri" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-7">
            {GALLERY_TILTS.map((tilt, i) => (
              <div data-reveal="zoom" key={i} className={cn(i % 2 === 1 && 'translate-y-6')}>
                <Polaroid src={data.photos.gallery[i]} label={`Foto ${i + 1}`} rotate={tilt} tape={i % 3 === 0 ? 'gingham' : i % 3 === 1 ? 'kraft' : undefined} red={i % 2 === 1} />
              </div>
            ))}
          </div>
          <a data-reveal href="#ucapan" className={cn(BUTTON, 'mt-6 justify-self-center')}>
            Kirim doa &amp; ucapan
          </a>
        </Section>

        {/* RSVP */}
        <Section tone="red" tear={2}>
          <Decor name="envelope-cream" sway="c" className="top-14 left-3 w-20 -rotate-[10deg]" />
          <Title kicker="kabari kami, ya" title="RSVP" light />
          <RsvpNote deadline={parseDay(data.rsvpDeadline)} />
        </Section>

        {/* Ucapan & doa */}
        <Section tone="cream" tear={1} id="ucapan">
          <Decor name="telephone" sway="l" className="-top-3 right-2 w-24" />
          <Title kicker="tulis sesuatu untuk kami" title="Ucapan & Doa" />
          <Wishes />
        </Section>

        {/* Tanda kasih */}
        <Section tone="red" tear={0}>
          <Decor name="envelope-red" sway="l" className="top-4 right-3 w-20 rotate-[10deg]" />
          <Title kicker="dengan sepenuh hati" title="Tanda Kasih" light />
          <p data-reveal className="m-0 -mt-4 text-center text-[14px] leading-[1.6] text-[#F6F1EA]">
            Doa restu kamu sudah lebih dari cukup. Namun bila ingin memberi tanda kasih, dapat melalui:
          </p>
          <GiftNote data={data} />
        </Section>

        {/* Penutup */}
        <Section tone="cream" tear={0}>
          <div data-reveal className="relative mx-auto w-[64%]">
            <div className="rr-kraft relative rotate-[-3deg] p-3 pb-14 shadow-[0_18px_34px_-16px_rgba(42,34,32,.6)]">
              <Photo src={data.photos.closing} label="Foto penutup" className="aspect-[4/5] w-full" />
            </div>
            <HeartDoodle className="absolute -bottom-4 -left-8 w-14 text-[#A8352A]" />
            <Decor name="roses" sway="r" className="-right-14 -bottom-6 w-24 rotate-[8deg]" />
          </div>
          <div data-reveal className="grid justify-items-center gap-3 text-center">
            <span className="text-[40px] leading-none font-bold text-[#A8352A]" style={{ fontFamily: CAVEAT }}>
              terima kasih
            </span>
            <p className="m-0 max-w-[34ch] text-[14px] leading-[1.7] text-[#2A2220]">
              Merupakan suatu kebahagiaan bagi kami apabila kamu berkenan hadir dan memberikan doa restu.
            </p>
            <span className="mt-2 text-[40px] leading-none font-medium tracking-[.04em] text-[#2A2220] uppercase" style={{ fontFamily: OSWALD }}>
              {groom.nick} &amp; {bride.nick}
            </span>
          </div>
        </Section>
        <footer className="rr-cream relative px-6 pt-2 pb-8 text-center text-[12px] text-[#5C514B]">
          Dibuat dengan <b className="text-[#A8352A]">Bridesmap</b>
        </footer>
      </main>
    </div>
  )
}

const GALLERY_TILTS = [-3, 3, 2, -2.5, -2, 3]

/* ---------- Sampul ---------- */

/* Jendela foto di gambar sampul (bingkai 1298×1212), diukur dari garis lekukannya:
   (316,232) (872,187) (917,706) (361,751), buku miring ±4,8°. Foto diputar lalu dipotong tepat mengikuti
   keempat sudut itu; tanggal di tengah bagian kraft bawah (650,902). */
const COVER_WINDOW_CLIP = 'polygon(24.2% 18.95%, 67.3% 15.25%, 70.8% 58.4%, 27.65% 62.15%)'
const COVER_PHOTO: CSSProperties = { left: '47.5%', top: '38.7%', width: '45.5%', height: '46%', transform: 'translate(-50%, -50%) rotate(-4.8deg)' }
const COVER_DATE: CSSProperties = { left: '50.1%', top: '74.4%', transform: 'translate(-50%, -50%) rotate(-4.8deg)' }

function Cover({ data, guest, leaving, onOpen }: { data: Invitation; guest: string; leaving: boolean; onOpen: () => void }) {
  const day = parseDay(data.date)
  const dateShort = [day.getDate(), day.getMonth() + 1, day.getFullYear() % 100].map((n) => String(n).padStart(2, '0')).join(' . ')
  return (
    <div className={cn('rr-cream fixed inset-0 z-50 mx-auto flex w-full max-w-[460px] flex-col overflow-x-hidden overflow-y-auto', leaving && 'rr-cover-leave')}>
      <img src={tearDown2} alt="" aria-hidden draggable={false} className="pointer-events-none relative z-[1] mb-1 block w-full flex-none select-none" />
      <div className="flex flex-1 flex-col items-center justify-between gap-3 px-6 pb-5">
        <div className="grid w-full gap-1">
          <div className="grid w-full justify-items-start gap-0 pl-2">
            <span className="relative z-[2] text-[30px] leading-none font-bold text-[#A8352A]" style={{ fontFamily: CAVEAT }}>
              the wedding of
            </span>
            <span className="text-[46px] leading-[.95] font-medium text-[#A8352A] uppercase" style={{ fontFamily: OSWALD }}>
              {data.groom.nick}
            </span>
            <span className="text-[46px] leading-[.95] font-medium text-[#2A2220] uppercase" style={{ fontFamily: OSWALD }}>
              &amp; {data.bride.nick}
            </span>
          </div>
          <div className="relative -mx-6 w-[calc(100%+48px)]" style={{ aspectRatio: '1298 / 1212' }}>
            <img src={coverNotebook} alt="" aria-hidden draggable={false} className="pointer-events-none absolute inset-0 size-full select-none" />
            <div className="absolute inset-0 shadow-[inset_0_1px_3px_rgba(42,34,32,.35)]" style={{ clipPath: COVER_WINDOW_CLIP }}>
              <Photo src={data.photos.hero} label="Foto calon pengantin" className="absolute" style={COVER_PHOTO} />
            </div>
            <img src={coverTape} alt="" aria-hidden draggable={false} className="pointer-events-none absolute inset-0 size-full select-none" />
            <div className="absolute" style={COVER_DATE}>
              <DateCircle>{dateShort}</DateCircle>
            </div>
          </div>
        </div>
        <div className="grid justify-items-center gap-2 text-center">
          <span className="text-[12px] font-medium tracking-[.24em] text-[#2A2220] uppercase" style={{ fontFamily: OSWALD }}>
            Kepada Yth. Bapak/Ibu/Saudara/i
          </span>
          <span className="text-[20px] font-bold text-[#2A2220]">{guest}</span>
          <button type="button" onClick={onOpen} className={cn(BUTTON, 'mt-2')}>
            Buka Undangan
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Kerangka & ornamen ---------- */

const TONE = { red: 'rr-red', cream: 'rr-cream' }

/* Kertas sobek untuk pergantian bagian (PNG asli, tidak diubah). `seam` = letak garis pergantian bagian
   pada tinggi kertas, yaitu batas badan kertas merah dengan tepi sobeknya. Merah kertas = latar .rr-red (#992215);
   ujung badan kertas dipudarkan supaya menyatu dengan latar tanpa garis. */
const TEARS = {
  // tepi sobek di atas, badan merah di bawah: masuk ke bagian merah
  up: [
    { src: tearUp1, seam: 0.822 },
    { src: tearUp2, seam: 0.587 },
    { src: tearUp3, seam: 0.97 },
  ],
  // badan merah di atas, tepi sobek di bawah: masuk ke bagian krem
  down: [
    { src: tearDown1, seam: 0.441 },
    { src: tearDown2, seam: 0.317 },
  ],
}

/** Bagian halaman; `tear` memasang kertas sobek di garis pergantian dengan bagian sebelumnya. */
function Section({ tone, tear, id, className, children }: { tone: keyof typeof TONE; tear?: number; id?: string; className?: string; children: ReactNode }) {
  const dir = tone === 'red' ? 'up' : 'down'
  const edge = tear === undefined ? undefined : TEARS[dir][tear]
  // Pudarkan hanya badan kertas yang berada di dalam bagian ini (setelah garis sambungan), supaya tepi sobek tetap utuh.
  const body = edge ? (dir === 'up' ? 1 - edge.seam : edge.seam) * 100 : 0
  const fade = `linear-gradient(to ${dir === 'up' ? 'bottom' : 'top'}, #000 ${100 - body * 0.9}%, transparent)`
  return (
    <section id={id} className={cn('relative grid gap-10 px-6 pt-28 pb-28', TONE[tone], className)}>
      {edge && (
        <img
          src={edge.src}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute top-0 left-1/2 z-[1] w-[104%] max-w-none select-none"
          style={{ transform: `translate(-50%, -${edge.seam * 100}%)`, maskImage: fade, WebkitMaskImage: fade }}
        />
      )}
      {children}
    </section>
  )
}

function Title({ kicker, title, light, arrow }: { kicker: string; title: string; light?: boolean; arrow?: boolean }) {
  return (
    <div data-reveal className="relative grid justify-items-center text-center">
      <span className={cn('flex items-end gap-1 text-[26px] leading-none font-bold', light ? 'text-[#F6F1EA]' : 'text-[#A8352A]')} style={{ fontFamily: CAVEAT }}>
        {kicker}
        {arrow && <Arrow className="mb-2 w-10" />}
      </span>
      <h2 className={cn('m-0 font-sans text-[46px] leading-[1.05] font-medium tracking-[.02em] uppercase', light ? 'text-[#F6F1EA]' : 'text-[#A8352A]')} style={{ fontFamily: OSWALD }}>
        {title}
      </h2>
    </div>
  )
}

function Decor({ name, className, sway, back }: { name: string; className?: string; sway?: 'l' | 'r' | 'c'; back?: boolean }) {
  const src = decorSrc(name)
  if (!src) return null
  return <img src={src} alt="" aria-hidden draggable={false} className={cn('pointer-events-none absolute select-none', back ? 'z-0' : 'z-[2]', sway && `rr-sway-${sway}`, className)} />
}

function Photo({ src, label, className, style }: { src?: string; label: string; className?: string; style?: CSSProperties }) {
  if (src) return <img src={src} alt={label} className={cn('object-cover', className)} style={style} />
  return (
    <div role="img" aria-label={label} className={cn('grid place-items-center bg-[linear-gradient(135deg,#dcd2c5,#c4b8a6)] text-[#4E4540]', className)} style={style}>
      <span className="flex max-w-[80%] flex-col items-center gap-1 text-center text-[10px] font-bold uppercase leading-snug tracking-[.14em]">
        <ImageIcon className="size-5" strokeWidth={1.5} />
        {label}
      </span>
    </div>
  )
}

/** Foto cetak: bingkai putih (atau merah) dengan tepi bawah lebar, opsional selotip di atasnya. */
function Polaroid({ src, label, rotate = 0, tape, red }: { src?: string; label: string; rotate?: number; tape?: 'gingham' | 'kraft'; red?: boolean }) {
  return (
    <div className={cn('relative p-2 pb-9 shadow-[0_2px_4px_rgba(42,34,32,.2),0_18px_30px_-14px_rgba(42,34,32,.55)]', red ? 'bg-[#A8352A]' : 'bg-[#FBF9F5]')} style={{ rotate: `${rotate}deg` }}>
      <Photo src={src} label={label} className="aspect-[4/5] w-full" />
      {tape && <span className={cn('absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-4deg]', tape === 'gingham' ? 'rr-tape' : 'rr-tape-kraft')} />}
    </div>
  )
}

/** Tanggal dilingkari tinta merah seperti coretan tangan. */
function DateCircle({ children }: { children: ReactNode }) {
  return (
    <span className="relative grid h-16 w-36 place-items-center">
      <svg viewBox="0 0 150 66" aria-hidden className="absolute inset-0 size-full text-[#A8352A]">
        <path d="M78 6C36 3 6 16 6 34c0 18 30 28 70 27 40-1 68-13 68-30C144 15 116 5 70 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="relative text-[26px] font-bold tracking-[.06em] text-[#A8352A]" style={{ fontFamily: CAVEAT }}>
        {children}
      </span>
    </span>
  )
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18C17 5 34 4 54 11" />
      <path d="M46 5l8 6-9 4" />
    </svg>
  )
}

function HeartDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M32 50C14 37 4 27 6 16 8 6 22 2 31 14c8-13 24-10 27 1 3 12-8 23-26 35Z" />
    </svg>
  )
}

function PaperClip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 72" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M20 22V56a8 8 0 0 1-16 0V14a10 10 0 0 1 20 0v38a4 4 0 0 1-8 0V22" />
    </svg>
  )
}

/* ---------- Bagian isi ---------- */

/* Jendela foto polaroid di gambar buku tua (bingkai 1408×1117), diukur dari pikselnya:
   (667,335) (1066,279) (1126,695) (718,747). Foto diputar −7° lalu dipotong tepat mengikuti keempat sudut itu
   (dilebarkan ±1px supaya tepi gelap jendela tertutup). */
const BOOK_WINDOW_CLIP = 'polygon(47.2% 29.75%, 75.9% 24.7%, 80.15% 62.5%, 50.8% 67.15%)'
const BOOK_PHOTO: CSSProperties = { left: '63.6%', top: '45.95%', width: '31%', height: '41%', transform: 'translate(-50%, -50%) rotate(-7deg)' }

/** Buku tua terbuka dengan foto pasangan di polaroid halaman kanan. */
function OpenBook({ data }: { data: Invitation }) {
  return (
    <div data-reveal="zoom" className="relative -mx-4" style={{ aspectRatio: '1408 / 1117' }}>
      <img src={oldBook} alt="" aria-hidden draggable={false} className="pointer-events-none absolute inset-0 size-full select-none drop-shadow-[0_24px_24px_rgba(0,0,0,.35)]" />
      <div className="absolute inset-0" style={{ clipPath: BOOK_WINDOW_CLIP }}>
        <Photo src={data.photos.heroSmall} label="Foto pasangan" className="absolute" style={BOOK_PHOTO} />
      </div>
      <Decor name="love-letter" sway="c" className="-top-4 right-0 w-[19%] rotate-[10deg]" />
    </div>
  )
}

function Person({ person, photo, rotate, decor, flip }: { person: Invitation['groom']; photo?: string; rotate: number; decor: string; flip?: boolean }) {
  return (
    <div data-reveal className="relative grid justify-items-center gap-5 text-center">
      <div className="relative w-[64%]">
        <Polaroid src={photo} label={`Foto ${person.nick}`} rotate={rotate} tape={flip ? 'kraft' : 'gingham'} />
        <Decor name={decor} sway={flip ? 'r' : 'l'} className={cn('-bottom-4 w-24', flip ? '-right-14' : '-left-14')} />
      </div>
      <div className="grid gap-1">
        <h3 className="m-0 font-sans text-[30px] leading-[1.1] font-medium tracking-[.04em] text-[#A8352A] uppercase" style={{ fontFamily: OSWALD }}>
          {person.full}
        </h3>
        <span className="text-[13px] text-[#5C514B] italic">{person.childOf.toLowerCase()}</span>
        <span className="text-[14px] font-bold text-[#2A2220]">{person.parents}</span>
        {person.instagram && (
          <a href={`https://instagram.com/${person.instagram}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 items-center justify-center text-[13px] font-bold text-[#A8352A] underline underline-offset-4">
            @{person.instagram}
          </a>
        )}
      </div>
    </div>
  )
}

/** Halaman kalender sobek di buku kraft berspiral: bulan, tanggal besar, hari, dan tahun. */
/* Area kertas memo di gambar memo-clip (bingkai 1281×1208): x 295 sampai 960, y 290 sampai 1090. */
const MEMO_PAGE: CSSProperties = { left: '23%', top: '23.3%', width: '51.9%', height: '66.2%' }

/** Kertas memo dijepit klip merah: bulan, tanggal besar, hari, dan tahun. */
function CalendarPad({ day }: { day: Date }) {
  return (
    <div data-reveal="zoom" className="relative mx-auto w-[96%]" style={{ aspectRatio: '1281 / 1208', containerType: 'inline-size' }}>
      <img src={memoClip} alt="" aria-hidden draggable={false} className="pointer-events-none absolute inset-0 size-full select-none drop-shadow-[0_18px_22px_rgba(42,34,32,.3)]" />
      <div className="absolute flex flex-col items-center justify-center text-center" style={MEMO_PAGE}>
        <p className="m-0 text-[6.4cqw] leading-none font-medium tracking-[.14em] text-[#6E1E15] uppercase" style={{ fontFamily: OSWALD }}>
          {fmt(day, { month: 'long' })}
        </p>
        <p className="m-0 text-[30cqw] leading-[.95] font-medium text-[#2A2220]" style={{ fontFamily: OSWALD }}>
          {day.getDate()}
        </p>
        <p className="m-0 text-[8.6cqw] leading-none font-bold text-[#6E1E15]" style={{ fontFamily: CAVEAT }}>
          {fmt(day, { weekday: 'long' })}
        </p>
        <p className="m-0 mt-[2cqw] pl-[.4em] text-[4cqw] tracking-[.4em] text-[#2A2220]" style={{ fontFamily: OSWALD }}>
          {day.getFullYear()}
        </p>
      </div>
      <Decor name="red-book" sway="l" className="bottom-[4%] left-0 w-[19%]" />
    </div>
  )
}

const TICKET_MASK: CSSProperties = {
  WebkitMask:
    'radial-gradient(circle at 0 50%, transparent 11px, #000 11.5px) left / 51% 100% no-repeat, radial-gradient(circle at 100% 50%, transparent 11px, #000 11.5px) right / 51% 100% no-repeat',
  mask: 'radial-gradient(circle at 0 50%, transparent 11px, #000 11.5px) left / 51% 100% no-repeat, radial-gradient(circle at 100% 50%, transparent 11px, #000 11.5px) right / 51% 100% no-repeat',
}

/** Hitung mundur berbentuk tiket dengan lekukan di kedua sisi. */
function CountdownTicket({ target }: { target: number }) {
  const units = useCountdown(target)
  return (
    <div data-reveal className="rr-red px-6 py-4 text-[#F6F1EA] shadow-[0_10px_20px_-10px_rgba(42,34,32,.6)]" style={TICKET_MASK} role="timer" aria-label={`${units[0].v} hari menuju hari bahagia`}>
      <div className="flex items-start justify-center gap-2 border border-dashed border-[#F6F1EA]/55 px-3 py-3">
        {units.map((u, i) => (
          <div key={u.l} className="flex items-start gap-2">
            {i > 0 && <span className="text-[30px] leading-none" style={{ fontFamily: OSWALD }}>:</span>}
            <div className="grid justify-items-center">
              <span className="text-[34px] leading-none font-medium tabular-nums" style={{ fontFamily: OSWALD }}>
                {u.v}
              </span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-[.16em]">{u.l}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Kartu acara dari kertas buku tulis, ditempel selotip, dengan label tulisan tangan dan panah. */
function EventNote({ data, event: e, labelRight }: { data: Invitation; event: Invitation['events'][number]; labelRight: boolean }) {
  const day = parseDay(data.date)
  return (
    <div data-reveal className="grid gap-2">
      <span className={cn('flex items-center gap-2 text-[34px] leading-none font-bold text-[#F6F1EA]', labelRight ? 'justify-end' : 'justify-start')} style={{ fontFamily: CAVEAT }}>
        {labelRight && <Arrow className="w-12 -scale-x-100 rotate-[20deg]" />}
        {e.name}
        {!labelRight && <Arrow className="w-12 rotate-[20deg]" />}
      </span>
      <div className={cn('relative', labelRight ? 'mr-4' : 'ml-4')} style={{ rotate: labelRight ? '-1.5deg' : '1.5deg' }}>
        <span className="rr-tape-kraft absolute -top-3 left-1/2 z-[1] h-6 w-24 -translate-x-1/2 rotate-[3deg]" />
        <div className={NOTEBOOK}>
          <p className="m-0 font-bold">{fmt(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="m-0">
            Pukul {e.start} s.d. {e.end} {data.timezone}
          </p>
          <p className="m-0 font-bold">{e.venue}</p>
          <p className="m-0">{e.address}</p>
          <div className="flex h-[68px] items-end justify-between">
            <span className="text-[34px] leading-[60px] font-medium text-[#A8352A]" style={{ fontFamily: OSWALD }}>
              {e.start}
            </span>
            <a href={eventMapsHref(e)} target="_blank" rel="noreferrer" className={ROW_LINK}>
              Lihat lokasi
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Formulir ---------- */

const BOOK_KEY = 'bc-inv-red-retro'

function RsvpNote({ deadline }: { deadline: Date }) {
  const { rsvp: saved, saveRsvp, guestName } = useGuestBook(BOOK_KEY, [])
  const [name, setName] = useState(guestName)
  const [count, setCount] = useState(1)
  const [attend, setAttend] = useState<boolean | null>(null)
  const valid = name.trim() && attend !== null

  const submit = () => {
    if (!valid) return
    saveRsvp({ name: name.trim(), attend: !!attend, count: attend ? count : 0 })
  }

  return (
    <div data-reveal className="relative">
      <PaperClip className="absolute -top-6 right-6 z-[1] w-6 rotate-[8deg] text-[#9C9C9C]" />
      <div className={NOTEBOOK}>
        {saved ? (
          <div className="grid gap-0 text-center">
            <span className="text-[30px] leading-[68px] font-bold text-[#A8352A]" style={{ fontFamily: CAVEAT }}>
              Terima kasih, {saved.name}!
            </span>
            <p className="m-0">{saved.attend ? `Kehadiran ${saved.count} orang sudah kami catat.` : 'Doa kamu tetap kami nantikan.'}</p>
            <button type="button" onClick={() => saveRsvp(null)} className={cn(ROW_LINK, 'mx-auto text-[#A8352A]')}>
              Ubah konfirmasi
            </button>
          </div>
        ) : (
          <>
            <p className="m-0 text-center">Konfirmasi sebelum {fmt(deadline, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" aria-label="Nama" autoComplete="name" className={LINE_INPUT} />
            <fieldset className="m-0 border-0 p-0">
              <legend className="float-left w-full p-0 leading-[34px] font-bold">Kehadiran</legend>
              {[
                { v: true, l: 'Ya, saya akan hadir' },
                { v: false, l: 'Maaf, belum bisa hadir' },
              ].map((o) => (
                <label key={o.l} className="clear-left flex h-[34px] cursor-pointer items-center gap-3">
                  <input type="radio" name="rr-attend" checked={attend === o.v} onChange={() => setAttend(o.v)} className="size-4 accent-[#A8352A]" />
                  {o.l}
                </label>
              ))}
            </fieldset>
            {attend && (
              <label className="flex h-[34px] items-center justify-between gap-3">
                <span className="font-bold">Jumlah tamu</span>
                <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-[26px] border border-[#2A2220]/30 bg-transparent px-2 text-[14px] leading-none">
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} orang
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button type="button" onClick={submit} disabled={!valid} className={cn(BUTTON, TWO_ROWS, 'w-full disabled:cursor-not-allowed disabled:opacity-50')}>
              Kirim konfirmasi
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const SAMPLE_WISHES: GuestWish[] = [
  { name: 'Dina', city: 'Bogor', date: '2 Agu', msg: 'Selamat ya Bima dan Ayu! Ikut bahagia banget.' },
  { name: 'Rizky & Sasa', city: 'Bekasi', date: '1 Agu', msg: 'Semoga jadi keluarga yang hangat dan selalu saling menguatkan.' },
]

function Wishes() {
  const { wishes, addWish, guestName } = useGuestBook(BOOK_KEY, SAMPLE_WISHES)
  const [name, setName] = useState(guestName)
  const [city, setCity] = useState('')
  const [msg, setMsg] = useState('')
  const valid = name.trim() && msg.trim()

  const submit = () => {
    if (!valid) return
    addWish({ name: name.trim(), city: city.trim() || undefined, msg: msg.trim(), date: fmt(new Date(), { day: 'numeric', month: 'short' }) })
    setCity('')
    setMsg('')
  }

  const field = 'w-full border border-[#2A2220]/15 bg-[#F6F1EA] px-4 text-[15px] text-[#2A2220] outline-none placeholder:text-[#6B605A] focus:border-[#A8352A]'
  return (
    <>
      <div className="grid max-h-[440px] gap-4 overflow-auto pr-1">
        {wishes.map((w, i) => (
          <div data-reveal key={i} className="border-l-4 border-[#2A2220] bg-[#E6D5C4] px-4 py-3 shadow-[0_8px_16px_-10px_rgba(42,34,32,.5)]">
            <p className="m-0 text-[15px] font-bold">{w.name}</p>
            {w.city && <p className="m-0 text-[12px] text-[#5C514B]">dari {w.city}</p>}
            <p className="m-0 mt-1 text-[14px] leading-[1.55] italic">“{w.msg}”</p>
          </div>
        ))}
      </div>
      <div data-reveal className="grid gap-3">
        <span className="text-[15px] font-bold">Kirim ucapan:</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" aria-label="Nama" className={cn(field, 'h-12')} />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Kota asal" aria-label="Kota asal" className={cn(field, 'h-12')} />
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Tulis ucapan dan doa" aria-label="Ucapan dan doa" rows={4} className={cn(field, 'resize-y py-3')} />
        <button type="button" onClick={submit} disabled={!valid} className={cn(BUTTON, 'w-full disabled:cursor-not-allowed disabled:opacity-50')}>
          Kirim ucapan
        </button>
      </div>
    </>
  )
}

function GiftNote({ data }: { data: Invitation }) {
  const [picked, setTab] = useState<'transfer' | 'kado'>('transfer')
  // Tab hanya muncul bila keduanya diisi.
  const both = data.accounts.length > 0 && !!data.giftAddress
  const tab = both ? picked : data.accounts.length ? 'transfer' : 'kado'
  return (
    <div data-reveal className={NOTEBOOK}>
      {both && <div role="tablist" className="grid grid-cols-2 gap-2 pb-[34px]">
        {(
          [
            ['transfer', 'Transfer'],
            ['kado', 'Kirim kado'],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn('h-[50px] border-2 border-[#2A2220] text-[12px] leading-none font-bold uppercase tracking-[.14em] transition-colors', TWO_ROWS, tab === k ? 'border-[#A8352A] bg-[#A8352A] text-[#F6F1EA]' : 'bg-transparent text-[#2A2220] hover:border-[#A8352A]')}
          >
            {l}
          </button>
        ))}
      </div>}
      {tab === 'transfer' ? (
        <div className="grid gap-[34px]">
          {data.accounts.map((a) => (
            <BankRow key={a.bank + a.number} {...a} />
          ))}
        </div>
      ) : (
        <AddressRow names={`${data.groom.nick} & ${data.bride.nick}`} address={data.giftAddress} />
      )}
    </div>
  )
}

function BankRow({ bank, number, holder }: Invitation['accounts'][number]) {
  const { copied, copy } = useCopy()
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="grid min-w-0 leading-[34px]">
        <span className="text-[14px] font-medium tracking-[.16em] text-[#A8352A] uppercase" style={{ fontFamily: OSWALD }}>
          {bank}
        </span>
        <span className="text-[19px] font-bold tracking-[.04em] tabular-nums">{number}</span>
        <span className="text-[12px] text-[#5C514B]">a.n. {holder}</span>
      </div>
      <CopyButton copied={copied} onClick={() => copy(number.replace(/\s/g, ''))} />
    </div>
  )
}

function AddressRow({ names, address }: { names: string; address: string }) {
  const { copied, copy } = useCopy()
  return (
    <div className="grid justify-items-start">
      <p className="m-0">
        <b>{names}</b>
        <br />
        {address}
      </p>
      <CopyButton copied={copied} onClick={() => copy(address)} label="Salin alamat" />
    </div>
  )
}

function CopyButton({ copied, onClick, label = 'Salin' }: { copied: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex h-[34px] flex-none items-center justify-center gap-1.5 bg-[#2A2220] px-4 text-[12px] leading-none font-bold text-[#F6F1EA] transition-colors before:absolute before:-inset-y-[5px] before:inset-x-0 hover:bg-[#A8352A]"
    >
      {copied ? <Check className="size-3.5" strokeWidth={2.25} /> : <Copy className="size-3.5" strokeWidth={2} />}
      {copied ? 'Tersalin' : label}
    </button>
  )
}
