// Logika bersama untuk semua template undangan digital (PRD #33): tanggal, tautan kalender,
// penyimpanan RSVP/ucapan, hitung mundur, kunci scroll sampul, dan animasi muncul saat di-scroll.
import { createContext, useContext, useEffect, useState, type RefObject } from 'react'
import type { Invitation } from '../../data/invitations'

export const parseDay = (iso: string) => new Date(`${iso}T12:00:00`)
export const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('id-ID', o)
/** Waktu acara pada hari-H, jam "08.00" di zona waktu undangan. */
export const at = (data: Invitation, hm: string) => new Date(`${data.date}T${hm.replace('.', ':')}:00${data.utcOffset}`)
const gcalStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Tautan "tambah ke Google Calendar" dari acara pertama sampai acara terakhir. */
export function calendarLink(data: Invitation) {
  const first = data.events[0]
  const last = data.events[data.events.length - 1]
  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(`Pernikahan ${data.groom.nick} & ${data.bride.nick}`)}` +
    `&dates=${gcalStamp(at(data, first.start))}/${gcalStamp(at(data, last.end))}` +
    `&location=${encodeURIComponent(data.mapsQuery)}`
  )
}

export const mapsLink = (query: string) => `https://maps.google.com/?q=${encodeURIComponent(query)}`
/** Tombol lokasi acara: tautan Google Maps dari pasangan, atau pencarian nama tempat & alamat. */
export const eventMapsHref = (e: { venue: string; address: string; mapsUrl?: string }) => e.mapsUrl || mapsLink([e.venue, e.address].filter(Boolean).join(', '))
export const mapsEmbed = (query: string) => `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`

export function load<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null
  } catch {
    return null
  }
}
export function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* penyimpanan tidak tersedia, abaikan */
  }
}

/** Kunci scroll halaman selama sampul menutupi undangan. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}

/** Setiap blok [data-reveal] di dalam `root` diberi kelas `is-in` saat masuk layar, bertahap mengikuti urutannya. */
export function useReveal(root: RefObject<HTMLElement | null>, enabled: boolean, stagger = 0.12) {
  useEffect(() => {
    const el = root.current
    if (!enabled || !el) return
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const t = e.target as HTMLElement
          const sibs = [...(t.parentElement?.children ?? [])].filter((c) => c.hasAttribute('data-reveal'))
          t.style.transitionDelay = `${Math.min(sibs.indexOf(t), 5) * stagger}s`
          t.classList.add('is-in')
          io.unobserve(t)
        }),
      { threshold: 0.12 },
    )
    el.querySelectorAll('[data-reveal]').forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [root, enabled, stagger])
}

/** Sisa waktu menuju `target` (ms), diperbarui tiap detik. */
export function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const diff = Math.max(0, target - now)
  const pad = (n: number) => String(n).padStart(2, '0')
  return [
    { v: String(Math.floor(diff / 864e5)), l: 'hari' },
    { v: pad(Math.floor(diff / 36e5) % 24), l: 'jam' },
    { v: pad(Math.floor(diff / 6e4) % 60), l: 'menit' },
    { v: pad(Math.floor(diff / 1e3) % 60), l: 'detik' },
  ]
}

/** Salin teks ke clipboard; `copied` bernilai true selama ±1,8 detik setelahnya. */
export function useCopy() {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(t)
  }, [copied])
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
  }
  return { copied, copy }
}

/* ---------- Buku tamu: RSVP & ucapan ---------- */

export type GuestWish = { name: string; msg: string; date: string; city?: string; attend?: boolean }
export type RsvpAnswer = { name: string; attend: boolean; count: number }

/** Disediakan halaman undangan milik pasangan (/u/:slug) supaya RSVP & ucapan masuk ke rencana.
 *  Tanpa provider (halaman contoh /undangan/*), data disimpan di perangkat saja. */
export interface GuestBookHandlers {
  /** Kunci penyimpanan jawaban RSVP tamu di perangkatnya sendiri (supaya tampil "Terima kasih"). */
  key: string
  wishes: GuestWish[]
  onWish: (w: GuestWish) => void
  onRsvp: (r: RsvpAnswer) => void
}
export const GuestBookContext = createContext<GuestBookHandlers | null>(null)

/** RSVP & ucapan untuk komponen template. `key` dipakai bila tidak ada provider. */
export function useGuestBook(key: string, sample: GuestWish[]) {
  const ctx = useContext(GuestBookContext)
  const rsvpKey = ctx ? ctx.key : `${key}-rsvp`
  const [localWishes, setLocalWishes] = useState(() => (ctx ? [] : (load<GuestWish[]>(`${key}-wishes`) ?? sample)))
  const [rsvp, setRsvp] = useState(() => load<RsvpAnswer>(rsvpKey))
  // Nama tamu dari tautan personal (?to=) dipakai sebagai isian awal formulir.
  const guestName = typeof location === 'undefined' ? '' : (new URLSearchParams(location.search).get('to')?.trim() ?? '')
  return {
    guestName,
    wishes: ctx ? ctx.wishes : localWishes,
    addWish: (w: GuestWish) => {
      if (ctx) return ctx.onWish(w)
      const next = [w, ...localWishes]
      save(`${key}-wishes`, next)
      setLocalWishes(next)
    },
    rsvp,
    saveRsvp: (r: RsvpAnswer | null) => {
      save(rsvpKey, r)
      setRsvp(r)
      if (r && ctx) ctx.onRsvp(r)
    },
  }
}
