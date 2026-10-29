// Menyusun isi undangan digital (PRD #33) dari rencana pasangan: nama & tanggal dari profil,
// acara dari rundown, sisanya dari pengaturan undangan. Isian yang kosong diganti nilai wajar.
import type { Invitation, InvitationEvent } from '../data/invitations'
import type { PlanState } from './store'
import type { InvitationEventInput, InvitationTemplate, InvitationTimezone, RundownEvent } from './types'
import { dueFromWedding, todayISO } from './utils'

export const TEMPLATES: { id: InvitationTemplate; name: string; desc: string; swatch: string[] }[] = [
  { id: 'sage', name: 'Sage', desc: 'Amplop sage, editorial ivory dan hijau sirih', swatch: ['#FBF8F2', '#34432F', '#9A4E3B'] },
  { id: 'noir', name: 'Noir', desc: 'Minimalis mewah hitam arang dengan sorot lampu', swatch: ['#141414', '#F4F1EC', '#CDB08A'] },
  { id: 'red-retro', name: 'Red Retro', desc: 'Scrapbook kliping koran merah dan krem', swatch: ['#992215', '#ECE5DC', '#C9A27A'] },
]

export const TZ_OFFSET: Record<InvitationTimezone, string> = { WIB: '+07:00', WITA: '+08:00', WIT: '+09:00' }

/** Slot foto yang dipakai tiap template, urut sesuai kemunculannya. */
export type PhotoSlot = 'envelope1' | 'envelope2' | 'hero' | 'heroSmall' | 'personA' | 'personB' | 'story' | 'gallery' | 'closing'
export const TEMPLATE_PHOTOS: Record<InvitationTemplate, PhotoSlot[]> = {
  sage: ['envelope1', 'envelope2', 'hero', 'heroSmall', 'personA', 'personB', 'gallery'],
  noir: ['hero', 'personA', 'personB', 'heroSmall', 'gallery', 'closing'],
  'red-retro': ['hero', 'heroSmall', 'personA', 'personB', 'story', 'gallery', 'closing'],
}
export const PHOTO_LABEL: Record<Exclude<PhotoSlot, 'story' | 'gallery'>, Record<InvitationTemplate | 'default', string>> = {
  envelope1: { default: 'Foto amplop 1', sage: 'Foto di amplop sampul (kiri)', noir: '', 'red-retro': '' },
  envelope2: { default: 'Foto amplop 2', sage: 'Foto di amplop sampul (kanan)', noir: '', 'red-retro': '' },
  hero: { default: 'Foto utama', sage: 'Foto pembuka (besar)', noir: 'Foto sampul & pembuka', 'red-retro': 'Foto di buku sampul' },
  heroSmall: { default: 'Foto kedua', sage: 'Foto pembuka (kecil)', noir: 'Foto Kisah Kami', 'red-retro': 'Foto di buku "Untuk Kamu"' },
  personA: { default: 'Foto mempelai pertama', sage: '', noir: '', 'red-retro': '' },
  personB: { default: 'Foto mempelai kedua', sage: '', noir: '', 'red-retro': '' },
  closing: { default: 'Foto penutup', sage: '', noir: '', 'red-retro': '' },
}
export const GALLERY_MAX = 6

/** "08:00" → "08.00" (format tampilan undangan). */
const dot = (t: string) => (t || '').replace(':', '.')

/** Hanya tautan http(s) yang dipakai; selain itu dianggap kosong. */
export const cleanUrl = (u?: string) => {
  const t = u?.trim()
  return t && /^https?:\/\//i.test(t) ? t : undefined
}

const firstWord = (s: string) => s.trim().split(/\s+/)[0] ?? ''

/** Acara dari rundown: jam mulai = kegiatan pertama, jam selesai = akhir kegiatan terakhir. */
export function eventsFromRundown(rundown: RundownEvent[]): InvitationEventInput[] {
  return rundown.map((r) => {
    const sorted = [...r.items].sort((a, b) => a.time.localeCompare(b.time))
    const last = sorted[sorted.length - 1]
    return {
      id: r.id,
      name: r.name,
      start: sorted[0]?.time ?? '08:00',
      end: last?.end || last?.time || sorted[0]?.time || '10:00',
      venue: r.location ?? '',
      address: '',
    }
  })
}

export function buildInvitation(s: Pick<PlanState, 'profile' | 'rundown' | 'invitation'>): Invitation {
  const { profile: p, invitation: inv } = s
  const person = (who: 'A' | 'B') => {
    const input = who === 'A' ? inv.personA : inv.personB
    const name = who === 'A' ? p.partnerA : p.partnerB
    return {
      nick: input.nick?.trim() || firstWord(name) || (who === 'A' ? 'Mempelai' : 'Pasangan'),
      full: input.full?.trim() || name,
      childOf: input.parents?.trim() ? input.childOf?.trim() || 'Putra/putri dari' : '',
      parents: input.parents?.trim() ?? '',
      instagram: input.instagram?.trim().replace(/^@/, '') || undefined,
    }
  }
  const date = p.weddingDate || todayISO()
  const events: InvitationEvent[] = (inv.events ?? eventsFromRundown(s.rundown)).map((e) => ({
    name: e.name,
    start: dot(e.start),
    end: dot(e.end),
    venue: e.venue,
    address: e.address,
    mapsUrl: cleanUrl(e.mapsUrl),
  }))
  const lastPlace = [...events].reverse().find((e) => e.venue || e.address)
  return {
    groom: person('A'),
    bride: person('B'),
    date,
    timezone: inv.timezone,
    utcOffset: TZ_OFFSET[inv.timezone],
    city: p.city,
    quote: inv.quote,
    story: inv.story.map(({ year, title, text, photo }) => ({ year, title, text, photo })),
    events: events.length ? events : [{ name: 'Resepsi', start: '11.00', end: '13.00', venue: '', address: p.city }],
    mapsQuery: inv.mapsQuery?.trim() || [lastPlace?.venue, lastPlace?.address].filter(Boolean).join(', ') || p.city,
    mapsUrl: [...events].reverse().find((e) => e.mapsUrl)?.mapsUrl,
    rsvpDeadline: inv.rsvpDeadline || dueFromWedding(date, -10),
    accounts: inv.accounts.map(({ bank, number, holder }) => ({ bank, number, holder })),
    giftAddress: inv.giftAddress,
    families: inv.families,
    photos: {
      envelope: [inv.photos.envelope1, inv.photos.envelope2],
      hero: inv.photos.hero,
      heroSmall: inv.photos.heroSmall,
      groom: inv.photos.personA,
      bride: inv.photos.personB,
      gallery: inv.photos.gallery,
      closing: inv.photos.closing,
    },
  }
}

/** Tautan undangan; `guestId` membuat tautan personal yang mencocokkan RSVP ke tamu tersebut. */
export function invitationUrl(slug: string, guest?: { id: string; name: string }) {
  const base = `${typeof location === 'undefined' ? '' : location.origin}/u/${slug}`
  if (!guest) return base
  return `${base}?to=${encodeURIComponent(guest.name).replace(/%20/g, '+')}&g=${guest.id}`
}
