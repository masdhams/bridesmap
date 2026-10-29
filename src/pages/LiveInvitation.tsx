import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { buildInvitation } from '../lib/invitation'
import { usePlan } from '../lib/store'
import type { InvitationTemplate } from '../lib/types'
import { fmtDate, uid } from '../lib/utils'
import NoirInvitation from './invitations/NoirInvitation'
import RedRetroInvitation from './invitations/RedRetroInvitation'
import SageInvitation from './invitations/SageInvitation'
import { GuestBookContext, type GuestBookHandlers } from './invitations/shared'

const COMPONENTS: Record<InvitationTemplate, typeof SageInvitation> = {
  sage: SageInvitation,
  noir: NoirInvitation,
  'red-retro': RedRetroInvitation,
}

/** Undangan digital milik pasangan: template pilihan + isi dari rencana.
 *  RSVP dan ucapan tamu langsung masuk ke daftar tamu. Tautan personal: `?to=Nama&g=idTamu`; `?tpl=` untuk pratinjau template lain.
 *  Saat ini hanya bisa dibuka di perangkat ini; versi publik butuh backend. */
export default function LiveInvitation() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const s = usePlan()
  const data = useMemo(() => buildInvitation(s), [s])
  const guestId = params.get('g')
  // Pratinjau template lain di editor (?tpl=noir) tanpa mengubah pilihan tersimpan.
  const tpl = params.get('tpl') as InvitationTemplate | null

  if (!s.profile.onboarded || s.website.slug !== slug) {
    return (
      <div className="grid min-h-dvh place-items-center px-4 text-center">
        <div>
          <p className="font-serif text-3xl">Undangan tidak ditemukan</p>
          <Link to="/" className="mt-3 inline-block text-primary underline">Ke Bridesmap</Link>
        </div>
      </div>
    )
  }

  const book: GuestBookHandlers = {
    key: `bc-inv-${slug}-rsvp`,
    wishes: [...s.wishes].reverse().map((w) => ({ name: w.name, msg: w.msg, city: w.city, attend: w.attend, date: fmtDate(w.at, 'd MMM') })),
    onWish: (w) => s.add('wishes', { id: uid(), name: w.name, msg: w.msg, city: w.city, attend: w.attend, at: new Date().toISOString() }),
    onRsvp: (r) => {
      s.add('rsvps', { id: uid(), name: r.name, attending: r.attend, pax: r.count, at: new Date().toISOString() })
      // Cocokkan ke tamu: lewat tautan personal dulu, lalu nama yang sama persis.
      const guest = s.guests.find((g) => g.id === guestId) ?? s.guests.find((g) => g.name.trim().toLowerCase() === r.name.trim().toLowerCase())
      if (guest) s.update('guests', guest.id, { rsvp: r.attend ? 'hadir' : 'tidak', pax: r.attend ? Math.max(1, r.count) : guest.pax })
    },
  }

  const Template = COMPONENTS[tpl && tpl in COMPONENTS ? tpl : s.invitation.template]
  return (
    <GuestBookContext.Provider value={book}>
      <Template data={data} />
    </GuestBookContext.Provider>
  )
}
