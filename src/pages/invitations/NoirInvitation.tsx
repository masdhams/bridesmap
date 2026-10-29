import { AtSign, CalendarPlus, Check, ChevronsDown, Copy, ImageIcon, MailOpen, MapPin } from 'lucide-react'
import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { NOIR_DEMO, type Invitation } from '../../data/invitations'
import { cn } from '../../lib/utils'
import CalendarCard from './CalendarCard'
import Sparkle from './Sparkle'
import { at, calendarLink, eventMapsHref, fmt, parseDay, useCopy, useCountdown, useGuestBook, useReveal, useScrollLock, type GuestWish } from './shared'
import './noir.css'

/** Undangan digital template "Noir": minimalis mewah hitam arang dengan sorot lampu panggung (PRD #33).
 *  Warna mengikuti referensi "Minimalist Luxury"; font tetap font aplikasi (Instrument Serif + Plus Jakarta Sans).
 *  Tamu dibuka lewat `/undangan/noir?to=Nama+Tamu`; `&langsung` melewati sampul. */

const GLASS = 'border border-white/12 bg-white/[.05] backdrop-blur-[2px]'
const KICKER = 'text-[11px] font-semibold uppercase tracking-[.28em] text-[#CDB08A]'
const GOLD_BTN =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#D9C2A0,#A38872)] px-7 text-sm font-semibold text-[#1A1A1A] transition-[filter] hover:brightness-110'
const FIELD = 'h-12 w-full rounded-lg border border-white/15 bg-white/[.06] px-4 text-[15px] text-[#F4F1EC] outline-none placeholder:text-[#B9B3AA] focus:border-[#CDB08A]'

export default function NoirInvitation({ data = NOIR_DEMO }: { data?: Invitation }) {
  const [params] = useSearchParams()
  const guest = params.get('to')?.trim() || 'Tamu Undangan'
  const [coverShown, setCoverShown] = useState(!params.has('langsung'))
  const rootRef = useRef<HTMLDivElement>(null)
  useScrollLock(coverShown)
  useReveal(rootRef, !coverShown, 0.1)

  const { groom, bride } = data
  const day = parseDay(data.date)
  const dateDots = [day.getDate(), day.getMonth() + 1, day.getFullYear()].map((n) => String(n).padStart(2, '0')).join(' . ')
  const enter = () => {
    window.scrollTo(0, 0)
    setCoverShown(false)
  }

  return (
    <div ref={rootRef} className="inv-noir flex min-h-dvh justify-center bg-[#0E0E0E] font-sans text-[#F4F1EC] antialiased">
      <title>{`Undangan Pernikahan ${groom.nick} & ${bride.nick}`}</title>
      {/* Sorot lampu panggung, tetap di belakang seluruh halaman */}
      <div aria-hidden className="pointer-events-none fixed inset-y-0 left-1/2 w-full max-w-[460px] -translate-x-1/2 bg-[#141414]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(255,255,255,.16),transparent_70%)]" />
        <div className="absolute top-[38%] left-1/2 aspect-square w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.075),rgba(255,255,255,.035)_68%,transparent_70%)]" />
      </div>

      {coverShown && <Cover data={data} guest={guest} dateDots={dateDots} onEnter={enter} />}

      <main className="relative w-full max-w-[460px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,.6)]">
        {/* Pembuka */}
        <section className="relative grid min-h-[100svh] content-end overflow-hidden">
          <Photo src={data.photos.hero} label="Foto utama" className="absolute inset-0 size-full" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,14,.15)_0%,rgba(14,14,14,.2)_45%,#141414_96%)]" />
          <Lamp />
          <div className="relative grid justify-items-center gap-4 px-8 pb-14 text-center">
            <span data-reveal className={KICKER}>The Wedding of</span>
            <h1 data-reveal className="m-0 font-serif text-[54px] font-normal leading-[.95] text-[#F4F1EC]">
              {groom.nick}
              <span className="mx-3 text-[#CDB08A] italic">&amp;</span>
              {bride.nick}
            </h1>
            <DateRule data-reveal>{dateDots}</DateRule>
            <ChevronsDown aria-hidden className="mt-6 size-6 animate-bounce text-[#B9B3AA] motion-reduce:animate-none" strokeWidth={1.5} />
          </div>
        </section>

        {/* Kutipan */}
        <section className="relative grid justify-items-center gap-5 px-9 py-20 text-center">
          <span data-reveal aria-hidden className="font-serif text-[72px] leading-[.5] text-[#CDB08A]">“</span>
          <p data-reveal className="m-0 font-serif text-[24px] leading-[1.45] text-pretty italic">{data.quote.text}</p>
          <span data-reveal className="text-[11px] font-semibold uppercase tracking-[.24em] text-[#B9B3AA]">{data.quote.by}</span>
        </section>

        {/* Mempelai */}
        <section className="relative grid gap-14 px-7 pb-20">
          <Heading kicker="Bride & Groom" title="Kedua Mempelai" />
          <p data-reveal className="m-0 -mt-8 text-center text-sm leading-[1.75] text-[#B9B3AA]">
            Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari bahagia kami.
          </p>
          <Portrait person={groom} photo={data.photos.groom} role="Mempelai pria" rotate={-3} />
          <span data-reveal aria-hidden className="-my-6 text-center font-serif text-[64px] leading-none text-[#CDB08A] italic">&amp;</span>
          <Portrait person={bride} photo={data.photos.bride} role="Mempelai wanita" rotate={3} />
        </section>

        {/* Hitung mundur */}
        <section className="relative grid gap-8 px-6 pb-20">
          <Heading kicker="Save the date" title="Menuju Hari Bahagia" />
          <div className="grid justify-items-center">
            <CalendarCard day={day} tone="noir" />
          </div>
          <Countdown target={at(data, data.events[0].start).getTime()} />
          <a data-reveal href={calendarLink(data)} target="_blank" rel="noreferrer" className={cn(GOLD_BTN, 'justify-self-center no-underline')}>
            <CalendarPlus className="size-4" strokeWidth={2} />
            Simpan ke Kalender
          </a>
        </section>

        {/* Acara */}
        <section className="relative grid gap-6 px-6 pb-20">
          <Heading kicker="Wedding event" title="Rangkaian Acara" />
          <span data-reveal className="-mt-3 text-center text-[11px] font-semibold uppercase tracking-[.22em] text-[#B9B3AA]">
            {fmt(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <EventTimeline data={data} />
        </section>

        {/* Kisah */}
        <section className="relative grid gap-8 px-6 pb-20">
          <Heading kicker="Love story" title="Kisah Kami" />
          <div data-reveal className="overflow-hidden rounded-2xl ring-1 ring-white/12">
            <Photo src={data.photos.heroSmall} label="Foto kisah kami" className="aspect-[4/3] w-full" />
          </div>
          <ol className="m-0 grid list-none gap-9 p-0 text-center">
            {data.story.map((s) => (
              <li data-reveal key={s.year} className="grid justify-items-center gap-1.5">
                <span className={KICKER}>{s.year}</span>
                <span className="font-serif text-[26px] leading-[1.1]">{s.title}</span>
                <p className="m-0 max-w-[34ch] text-sm leading-[1.75] text-[#B9B3AA]">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Galeri */}
        <section className="relative grid gap-8 px-5 pb-20">
          <Heading kicker="Our moments" title="Galeri" />
          <div className="grid grid-cols-2 gap-3">
            {GALLERY.map((cls, i) => (
              <div data-reveal key={i} className={cn('overflow-hidden rounded-xl ring-1 ring-white/12', cls)}>
                <Photo src={data.photos.gallery[i]} label={`Foto ${i + 1}`} className="size-full" />
              </div>
            ))}
          </div>
        </section>

        {/* Amplop digital */}
        <section className="relative px-5 pb-20">
          <Gift data={data} />
        </section>

        {/* Ucapan & konfirmasi kehadiran */}
        <section className="relative grid gap-8 px-6 pb-20">
          <Heading kicker="RSVP & wishes" title="Ucapkan Sesuatu" />
          <WishesForm deadline={parseDay(data.rsvpDeadline)} />
        </section>

        {/* Penutup */}
        <section className="relative grid justify-items-center gap-7 px-8 pt-4 pb-20 text-center">
          <div data-reveal className="w-[62%]">
            <WhiteFrame rotate={-2}>
              <Photo src={data.photos.closing} label="Foto penutup" className="aspect-[4/5] w-full" />
            </WhiteFrame>
          </div>
          <p data-reveal className="m-0 max-w-[34ch] text-sm leading-[1.8] text-pretty text-[#B9B3AA]">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu. Atas kehadiran dan doanya, kami ucapkan terima kasih.
          </p>
          <div data-reveal className="grid gap-2">
            <span className={KICKER}>Kami yang berbahagia</span>
            <span className="font-serif text-[46px] leading-none">
              {groom.nick} <span className="text-[#CDB08A] italic">&amp;</span> {bride.nick}
            </span>
          </div>
        </section>
        <footer className="relative border-t border-white/10 p-6 text-center text-xs tracking-[.04em] text-[#B9B3AA]">
          Dibuat dengan <span className="font-serif text-[17px] text-[#F4F1EC]">Brides<i className="text-[#CDB08A]">map</i></span>
        </footer>
      </main>
    </div>
  )
}

/** Petak galeri: foto pertama melebar dua kolom, sisanya potret. */
const GALLERY = ['col-span-2 aspect-[4/3]', 'aspect-[3/4]', 'aspect-[3/4]', 'aspect-[3/4]', 'aspect-[3/4]', 'col-span-2 aspect-[16/10]']

/* ---------- Sampul ---------- */

function Cover({ data, guest, dateDots, onEnter }: { data: Invitation; guest: string; dateDots: string; onEnter: () => void }) {
  return (
    <div className="fixed inset-0 z-50 mx-auto grid w-full max-w-[460px] content-end overflow-hidden bg-[#141414] text-center">
      <Photo src={data.photos.hero} label="Foto sampul" className="absolute inset-0 size-full" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,14,.35)_0%,rgba(14,14,14,.1)_35%,rgba(14,14,14,.85)_75%,#141414_100%)]" />
      <Lamp />
      <div className="relative grid justify-items-center gap-4 px-8 pb-[max(48px,8vh)]">
        <span className={KICKER}>The Wedding of</span>
        <h1 className="m-0 font-serif text-[48px] font-normal leading-[.95] text-[#F4F1EC]">
          {data.groom.nick}
          <span className="mx-2.5 text-[#CDB08A] italic">&amp;</span>
          {data.bride.nick}
        </h1>
        <DateRule>{dateDots}</DateRule>
        <div className="mt-4 grid gap-1">
          <span className="text-xs text-[#B9B3AA]">Kepada Yth. Bapak/Ibu/Saudara/i</span>
          <span className="font-serif text-[28px] leading-tight">{guest}</span>
        </div>
        <button type="button" onClick={onEnter} className={cn(GOLD_BTN, 'mt-2')}>
          <MailOpen className="size-4" strokeWidth={2} />
          Buka Undangan
        </button>
      </div>
    </div>
  )
}

/* ---------- Komponen ---------- */

/** Lampu sorot di atas foto, seperti panggung foto studio. */
function Lamp() {
  return <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[radial-gradient(ellipse_55%_60%_at_50%_0%,rgba(255,255,255,.22),transparent_75%)]" />
}

function DateRule({ children, ...rest }: { children: ReactNode; 'data-reveal'?: boolean }) {
  return (
    <div {...rest} className="flex w-full max-w-[300px] items-center gap-4 text-[#F4F1EC]">
      <span className="h-px flex-1 bg-white/40" />
      <span className="font-serif text-[20px] tracking-[.08em] tabular-nums">{children}</span>
      <span className="h-px flex-1 bg-white/40" />
    </div>
  )
}

/** Judul bagian: bintang dan label kecil champagne, lalu judul serif besar. */
function Heading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div data-reveal className="grid justify-items-center gap-3 text-center">
      <Sparkle className="size-3.5 text-[#CDB08A]" />
      <span className={KICKER}>{kicker}</span>
      <h2 className="m-0 font-serif text-[40px] font-normal leading-[1.05] text-[#F4F1EC]">{title}</h2>
    </div>
  )
}

/** Foto; tanpa foto tampil sebagai panggung gelap bertanda. */
function Photo({ src, label, className, style }: { src?: string; label: string; className?: string; style?: CSSProperties }) {
  if (src) return <img src={src} alt={label} className={cn('object-cover', className)} style={style} />
  return (
    <div role="img" aria-label={label} className={cn('grid place-items-center bg-[radial-gradient(circle_at_50%_38%,#4A4846,#262524_55%,#1A1A1A)] text-[#B9B3AA]', className)} style={style}>
      <span className="flex max-w-[75%] flex-col items-center gap-1.5 text-center text-[10px] font-semibold uppercase leading-snug tracking-[.16em]">
        <ImageIcon className="size-5" strokeWidth={1.5} />
        {label}
      </span>
    </div>
  )
}

/** Bingkai cetak putih ala polaroid: tepi bawah lebih lebar dan sedikit dimiringkan. */
function WhiteFrame({ children, rotate = 0 }: { children: ReactNode; rotate?: number }) {
  return (
    <div className="relative bg-[#F4F1EC] p-2 pb-12 shadow-[0_2px_4px_rgba(0,0,0,.3),0_26px_50px_-22px_rgba(0,0,0,.85)]" style={{ rotate: `${rotate}deg` }}>
      {children}
    </div>
  )
}

function Portrait({ person, photo, role, rotate }: { person: Invitation['groom']; photo?: string; role: string; rotate: number }) {
  return (
    <div data-reveal className="grid justify-items-center gap-5 text-center">
      <div className="w-[68%]">
        <WhiteFrame rotate={rotate}>
          <div className="relative">
            <Photo src={photo} label={`Foto ${role.toLowerCase()}`} className="aspect-[3/4] w-full" />
            <span className="absolute bottom-2 left-3 font-serif text-[46px] leading-none text-[#F4F1EC] italic [text-shadow:0_2px_14px_rgba(0,0,0,.7)]">
              {person.nick}
            </span>
          </div>
        </WhiteFrame>
      </div>
      <div className="mt-3 grid gap-2">
        <span className={KICKER}>{role}</span>
        <h3 className="m-0 font-serif text-[32px] font-normal leading-[1.1] text-[#F4F1EC]">{person.full}</h3>
        <p className="m-0 text-sm leading-[1.65] text-[#B9B3AA]">
          {person.childOf}
          <br />
          <span className="font-semibold text-[#F4F1EC]">{person.parents}</span>
        </p>
      </div>
      {person.instagram && (
        <a
          href={`https://instagram.com/${person.instagram}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Instagram ${person.full}`}
          className="-mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/20 px-4 text-xs font-semibold text-[#F4F1EC] no-underline transition-colors hover:border-[#CDB08A] hover:text-[#CDB08A]"
        >
          <AtSign className="size-3.5" strokeWidth={2} />
          {person.instagram}
        </a>
      )}
    </div>
  )
}

/** Garis waktu acara seperti template Sage: jam di kiri, garis bergelombang berbintang, isi di kanan. */
function EventTimeline({ data }: { data: Invitation }) {
  return (
    <div className={cn('relative grid gap-9 rounded-2xl px-4 py-7', GLASS)}>
      <svg viewBox="0 0 20 100" preserveAspectRatio="none" aria-hidden className="pointer-events-none absolute top-10 bottom-10 left-[92px] h-[calc(100%-80px)] w-5 text-[#CDB08A]/45">
        <path d="M10 0C18 12 2 22 10 34S18 56 10 68 2 88 10 100" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {data.events.map((e) => (
        <div data-reveal key={e.name} className="relative grid grid-cols-[64px_20px_1fr] items-start gap-x-3">
          <span className="pt-0.5 text-right font-serif text-[26px] leading-none text-[#F4F1EC] tabular-nums">{e.start}</span>
          <Sparkle className="mt-1.5 size-3.5 justify-self-center text-[#CDB08A]" />
          <div className="grid justify-items-start gap-1">
            <h3 className="m-0 font-serif text-[26px] font-normal leading-[1.1] text-[#F4F1EC]">{e.name}</h3>
            <span className="text-[13px] font-semibold text-[#CDB08A]">
              Pukul {e.start} s.d. {e.end} {data.timezone}
            </span>
            <p className="m-0 text-[13px] leading-[1.65] text-[#B9B3AA]">
              <span className="font-semibold text-[#F4F1EC]">{e.venue}</span>
              <br />
              {e.address}
            </p>
            <a
              href={eventMapsHref(e)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#CDB08A]/60 px-4 text-[13px] font-semibold text-[#CDB08A] no-underline transition-colors hover:bg-[#CDB08A] hover:text-[#1A1A1A]"
            >
              <MapPin className="size-4" strokeWidth={2} />
              Lihat Lokasi
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}

function Countdown({ target }: { target: number }) {
  const units = useCountdown(target)
  return (
    <div data-reveal className="grid grid-cols-4 gap-2.5" role="timer" aria-label={`${units[0].v} hari menuju hari bahagia`}>
      {units.map((u) => (
        <div key={u.l} className={cn('grid justify-items-center gap-1 rounded-xl py-4', GLASS)}>
          <span className="font-serif text-[38px] leading-none tabular-nums">{u.v}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#B9B3AA]">{u.l}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------- Amplop digital ---------- */

function Gift({ data }: { data: Invitation }) {
  return (
    <div data-reveal className="relative grid gap-5 overflow-hidden rounded-2xl bg-[#DAD4CB] p-6 text-[#1E1E1E] shadow-[0_30px_60px_-30px_rgba(0,0,0,.9)]">
      <div className="grid gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#6B5641]">Wedding gift</span>
        <h2 className="m-0 font-serif text-[38px] font-normal leading-[1.05] text-[#1E1E1E]">Amplop Digital</h2>
        <p className="m-0 text-sm leading-[1.7] text-[#4A4540]">
          Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Jika ingin memberi tanda kasih, dapat melalui:
        </p>
      </div>
      {data.accounts.map((a) => (
        <BankRow key={a.bank + a.number} {...a} />
      ))}
      {data.giftAddress && (
        <div className="grid gap-1 rounded-xl border border-[#1E1E1E]/15 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#6B5641]">Kirim kado</span>
          <span className="text-sm leading-relaxed">
            {data.groom.nick} &amp; {data.bride.nick}
            <br />
            {data.giftAddress}
          </span>
        </div>
      )}
    </div>
  )
}

function BankRow({ bank, number, holder }: Invitation['accounts'][number]) {
  const { copied, copy } = useCopy()
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F4F1EC] p-4">
      <div className="grid min-w-0 gap-0.5">
        <span className="text-[11px] font-bold uppercase tracking-[.22em] text-[#6B5641]">{bank}</span>
        <span className="text-[19px] font-semibold tracking-[.06em] tabular-nums">{number}</span>
        <span className="text-xs text-[#4A4540]">a.n. {holder}</span>
      </div>
      <button
        type="button"
        onClick={() => copy(number.replace(/\s/g, ''))}
        className="inline-flex min-h-11 flex-none items-center gap-1.5 rounded-full bg-[#1E1E1E] px-4 text-xs font-semibold text-[#F4F1EC] transition-colors hover:bg-[#3A3A3A]"
      >
        {copied ? <Check className="size-3.5" strokeWidth={2.25} /> : <Copy className="size-3.5" strokeWidth={2} />}
        {copied ? 'Tersalin' : 'Salin'}
      </button>
    </div>
  )
}

/* ---------- Ucapan & RSVP ---------- */

const SAMPLE_WISHES: GuestWish[] = [
  { name: 'Rani & Bayu', date: '2 Jun', attend: true, msg: 'Selamat untuk kalian berdua! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.' },
  { name: 'Om Hendra', date: '30 Mei', attend: true, msg: 'Turut berbahagia. Semoga acaranya lancar sampai selesai.' },
  { name: 'Citra', date: '28 Mei', attend: false, msg: 'Maaf belum bisa hadir, doa terbaik dari jauh untuk kalian.' },
]

function WishesForm({ deadline }: { deadline: Date }) {
  const { wishes, addWish, saveRsvp, guestName } = useGuestBook('bc-inv-noir', SAMPLE_WISHES)
  const [name, setName] = useState(guestName)
  const [msg, setMsg] = useState('')
  const [attend, setAttend] = useState<boolean | null>(null)
  const [count, setCount] = useState(1)
  const [sent, setSent] = useState(false)
  const valid = name.trim() && msg.trim() && attend !== null

  const submit = () => {
    if (!valid) return
    addWish({ name: name.trim(), msg: msg.trim(), attend: attend ?? undefined, date: fmt(new Date(), { day: 'numeric', month: 'short' }) })
    saveRsvp({ name: name.trim(), attend: !!attend, count: attend ? count : 0 })
    setMsg('')
    setAttend(null)
    setCount(1)
    setSent(true)
  }

  return (
    <>
      <div data-reveal className={cn('grid gap-4 rounded-2xl p-5', GLASS)}>
        <p className="m-0 text-[13px] text-[#B9B3AA]">Mohon konfirmasi kehadiran sebelum {fmt(deadline, { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" aria-label="Nama" autoComplete="name" className={FIELD} />
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Tulis ucapan & doa"
          aria-label="Ucapan dan doa"
          rows={4}
          className={cn(FIELD, 'h-auto resize-y py-3')}
        />
        <fieldset className="m-0 grid gap-2 border-0 p-0">
          <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[.2em] text-[#B9B3AA]">Konfirmasi kehadiran</legend>
          <div className="grid grid-cols-2 gap-2">
            <Choice active={attend === true} onClick={() => setAttend(true)}>Hadir</Choice>
            <Choice active={attend === false} onClick={() => setAttend(false)}>Tidak hadir</Choice>
          </div>
        </fieldset>
        {attend && (
          <fieldset className="m-0 grid gap-2 border-0 p-0">
            <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[.2em] text-[#B9B3AA]">Jumlah tamu</legend>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => (
                <Choice key={n} active={count === n} onClick={() => setCount(n)}>{n}</Choice>
              ))}
            </div>
          </fieldset>
        )}
        <button type="button" onClick={submit} disabled={!valid} className={cn(GOLD_BTN, 'mt-1 w-full disabled:cursor-not-allowed disabled:opacity-45')}>
          Kirim
        </button>
        {sent && (
          <p role="status" className="m-0 text-center text-[13px] text-[#CDB08A]">
            Terima kasih! Ucapan dan konfirmasi Anda sudah kami terima.
          </p>
        )}
      </div>

      <div className="grid max-h-[480px] gap-3 overflow-auto pr-1">
        <span className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#B9B3AA]">{wishes.length} ucapan</span>
        {wishes.map((w, i) => (
          <div key={i} className={cn('grid gap-1.5 rounded-xl p-4', GLASS)}>
            <div className="flex items-center justify-between gap-3">
              <b className="font-serif text-[19px] font-normal">{w.name}</b>
              {w.attend !== undefined && (
                <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[.12em]', w.attend ? 'bg-[#CDB08A]/20 text-[#E4D2B6]' : 'bg-white/10 text-[#B9B3AA]')}>
                  {w.attend ? 'Hadir' : 'Tidak hadir'}
                </span>
              )}
            </div>
            <p className="m-0 text-sm leading-relaxed text-pretty text-[#D8D3CB]">{w.msg}</p>
            <span className="text-[11px] text-[#B9B3AA]">{w.date}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-11 rounded-full border text-sm font-semibold transition-colors',
        active ? 'border-[#CDB08A] bg-[#CDB08A] text-[#1A1A1A]' : 'border-white/20 bg-transparent text-[#F4F1EC] hover:border-[#CDB08A]',
      )}
    >
      {children}
    </button>
  )
}
