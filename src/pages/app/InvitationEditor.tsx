import { Camera, Check, Copy, ExternalLink, ImagePlus, Palette, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Field, PageHeader, Segmented } from '../../components/ui'
import { cleanUrl, eventsFromRundown, GALLERY_MAX, invitationUrl, PHOTO_LABEL, TEMPLATE_PHOTOS, TEMPLATES, type PhotoSlot } from '../../lib/invitation'
import { storageUsageBytes, usePlan, useStorageStatus } from '../../lib/store'
import type { InvitationEventInput, InvitationPersonInput, InvitationSettings, InvitationTimezone } from '../../lib/types'
import { cn, compressImage, dueFromWedding, fmtDate, slugify, uid } from '../../lib/utils'

/** Ukuran foto undangan: cukup tajam di HP, tetap muat di penyimpanan perangkat. */
const compress = (f: File) => compressImage(f, 1000, 0.7)

/** Pengaturan undangan digital (PRD #33): template, isi, foto. Pratinjau di kanan ikut berubah saat diisi. */
export default function InvitationEditor() {
  const { invitation: inv, setInvitation, setInvitationPhotos, profile, rundown, website, setWebsite, guests, wishes } = usePlan()
  const storageFull = useStorageStatus((s) => s.full)
  const [cover, setCover] = useState(true)
  const [copied, setCopied] = useState(false)
  const url = invitationUrl(website.slug)
  const slots = TEMPLATE_PHOTOS[inv.template]
  const usesStoryPhoto = slots.includes('story')

  const setPerson = (who: 'A' | 'B', patch: Partial<InvitationPersonInput>) =>
    setInvitation(who === 'A' ? { personA: { ...inv.personA, ...patch } } : { personB: { ...inv.personB, ...patch } })

  const derivedEvents = useMemo(() => eventsFromRundown(rundown), [rundown])
  const events = inv.events ?? derivedEvents
  const setEvents = (list: InvitationEventInput[]) => setInvitation({ events: list })
  const patchEvent = (id: string, patch: Partial<InvitationEventInput>) => setEvents(events.map((e) => (e.id === id ? { ...e, ...patch } : e)))

  const missing = [
    !inv.personA.parents && `Nama orang tua ${profile.partnerA || 'mempelai pertama'}`,
    !inv.personB.parents && `Nama orang tua ${profile.partnerB || 'mempelai kedua'}`,
    events.some((e) => !e.venue) && 'Tempat acara',
    !inv.photos.hero && 'Foto utama',
    !inv.photos.personA && !inv.photos.personB && 'Foto mempelai',
    inv.photos.gallery.length === 0 && 'Foto galeri',
    inv.story.length === 0 && 'Cerita kalian (Love Story)',
    inv.accounts.length === 0 && !inv.giftAddress && 'Rekening atau alamat kado (opsional)',
  ].filter(Boolean) as string[]

  const copyLink = () =>
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })

  return (
    <div>
      <PageHeader back="/app"
        title="Undangan digital"
        subtitle="Pilih template, lengkapi isinya, lalu kirim tautan personal ke setiap tamu dari halaman Tamu."
      />
      <p className="mb-4 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
        Mode pratinjau: undangan saat ini hanya bisa dibuka di perangkat ini. Tamu bisa membukanya dari HP masing-masing setelah backend tersambung.
      </p>
      {storageFull && <p className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger-ink">Penyimpanan perangkat penuh, perubahan terakhir belum tersimpan. Hapus beberapa foto lalu coba lagi.</p>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
        <div className="space-y-5">
          {/* Template */}
          <Card title="Pilih desain" sub="Pratinjau memakai nama, tanggal, dan foto kalian. Ketuk desain untuk memakainya.">
            <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pt-1 pb-4" role="radiogroup" aria-label="Desain undangan">
              {TEMPLATES.map((t) => (
                <TemplateCard key={t.id} template={t} slug={website.slug} active={inv.template === t.id} onPick={() => setInvitation({ template: t.id })} />
              ))}
            </div>
            <Field label="Alamat undangan" htmlFor="inv-slug" hint={url}>
              <div className="flex gap-2">
                <input id="inv-slug" className="input" value={website.slug} onChange={(e) => setWebsite({ slug: slugify(e.target.value) })} />
                <button type="button" className="btn-outline shrink-0" onClick={copyLink}>
                  <Copy className="size-4" aria-hidden /> {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </Field>
          </Card>

          {missing.length > 0 && (
            <div className="rounded-2xl border border-[#D9B77A] bg-warning-soft px-4 py-3 text-sm text-warning">
              <p className="m-0 font-semibold">Belum diisi</p>
              <p className="m-0 mt-1">{missing.join(' · ')}</p>
            </div>
          )}

          {/* Mempelai */}
          <Card title="Mempelai" sub="Nama panggilan tampil besar di sampul. Kosongkan untuk memakai nama dari profil.">
            <div className="grid gap-5 sm:grid-cols-2">
              {(['A', 'B'] as const).map((who) => {
                const p = who === 'A' ? inv.personA : inv.personB
                const name = who === 'A' ? profile.partnerA : profile.partnerB
                const id = `inv-p${who}`
                return (
                  <div key={who} className="space-y-3">
                    <p className="eyebrow">{who === 'A' ? 'Mempelai pertama' : 'Mempelai kedua'}</p>
                    <Field label="Nama panggilan" htmlFor={`${id}-nick`}>
                      <input id={`${id}-nick`} className="input" value={p.nick ?? ''} placeholder={name.split(' ')[0]} onChange={(e) => setPerson(who, { nick: e.target.value })} />
                    </Field>
                    <Field label="Nama lengkap" htmlFor={`${id}-full`}>
                      <input id={`${id}-full`} className="input" value={p.full ?? ''} placeholder={name} onChange={(e) => setPerson(who, { full: e.target.value })} />
                    </Field>
                    <Field label="Keterangan" htmlFor={`${id}-child`}>
                      <input id={`${id}-child`} className="input" value={p.childOf ?? ''} placeholder="Putra pertama dari" onChange={(e) => setPerson(who, { childOf: e.target.value })} />
                    </Field>
                    <Field label="Nama orang tua" htmlFor={`${id}-par`}>
                      <input id={`${id}-par`} className="input" value={p.parents ?? ''} placeholder="Bapak … & Ibu …" onChange={(e) => setPerson(who, { parents: e.target.value })} />
                    </Field>
                    <Field label="Instagram (opsional)" htmlFor={`${id}-ig`}>
                      <input id={`${id}-ig`} className="input" value={p.instagram ?? ''} placeholder="@nama" onChange={(e) => setPerson(who, { instagram: e.target.value })} />
                    </Field>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Acara */}
          <Card title="Acara" sub={`Tanggal mengikuti hari-H: ${fmtDate(profile.weddingDate, 'EEEE, d MMMM yyyy')}.`} action={<Link to="/app/pengaturan" className="text-sm text-primary underline">Ubah tanggal</Link>}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented<InvitationTimezone>
                label="Zona waktu"
                value={inv.timezone}
                onChange={(v) => setInvitation({ timezone: v })}
                options={[
                  { value: 'WIB', label: 'WIB' },
                  { value: 'WITA', label: 'WITA' },
                  { value: 'WIT', label: 'WIT' },
                ]}
              />
              {inv.events ? (
                <button type="button" className="btn-ghost btn-sm" onClick={() => setInvitation({ events: undefined })}>
                  <RotateCcw className="size-4" aria-hidden /> Ikuti rundown lagi
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Disusun dari <Link to="/app/rundown" className="text-primary underline">rundown</Link>. Mengubah di bawah akan memisahkannya.
                </span>
              )}
            </div>
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="grid gap-3 rounded-2xl border border-border p-3 sm:grid-cols-2">
                  <Field label="Nama acara" htmlFor={`ev-n-${e.id}`}>
                    <input id={`ev-n-${e.id}`} className="input" value={e.name} onChange={(x) => patchEvent(e.id, { name: x.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Mulai" htmlFor={`ev-s-${e.id}`}>
                      <input id={`ev-s-${e.id}`} type="time" className="input" value={e.start} onChange={(x) => patchEvent(e.id, { start: x.target.value })} />
                    </Field>
                    <Field label="Selesai" htmlFor={`ev-e-${e.id}`}>
                      <input id={`ev-e-${e.id}`} type="time" className="input" value={e.end} onChange={(x) => patchEvent(e.id, { end: x.target.value })} />
                    </Field>
                  </div>
                  <Field label="Nama tempat" htmlFor={`ev-v-${e.id}`}>
                    <input id={`ev-v-${e.id}`} className="input" value={e.venue} placeholder="Gedung / masjid / rumah" onChange={(x) => patchEvent(e.id, { venue: x.target.value })} />
                  </Field>
                  <Field label="Alamat" htmlFor={`ev-a-${e.id}`}>
                    <input id={`ev-a-${e.id}`} className="input" value={e.address} placeholder="Jalan, kota" onChange={(x) => patchEvent(e.id, { address: x.target.value })} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field
                      label="Link Google Maps"
                      htmlFor={`ev-m-${e.id}`}
                      hint={
                        e.mapsUrl && !cleanUrl(e.mapsUrl)
                          ? 'Tautan harus diawali https://. Salin dari tombol "Bagikan" di Google Maps.'
                          : 'Buka Google Maps, cari lokasinya, ketuk "Bagikan", lalu tempel tautannya di sini. Kosongkan untuk mencari dari nama tempat & alamat.'
                      }
                    >
                      <input id={`ev-m-${e.id}`} type="url" inputMode="url" className="input" value={e.mapsUrl ?? ''} placeholder="https://maps.app.goo.gl/…" onChange={(x) => patchEvent(e.id, { mapsUrl: x.target.value })} />
                    </Field>
                  </div>
                  <button type="button" className="btn-ghost btn-sm justify-self-start text-destructive sm:col-span-2" onClick={() => setEvents(events.filter((x) => x.id !== e.id))}>
                    <Trash2 className="size-4" aria-hidden /> Hapus acara
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn-outline btn-sm" onClick={() => setEvents([...events, { id: uid(), name: 'Acara baru', start: '10:00', end: '12:00', venue: '', address: '' }])}>
              <Plus className="size-4" aria-hidden /> Tambah acara
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Lokasi untuk peta kecil" htmlFor="inv-maps" hint="Peta yang tampil di undangan Sage. Kosongkan untuk memakai tempat acara terakhir.">
                <input id="inv-maps" className="input" value={inv.mapsQuery ?? ''} placeholder="Nama gedung, alamat" onChange={(e) => setInvitation({ mapsQuery: e.target.value })} />
              </Field>
              <Field label="Batas konfirmasi RSVP" htmlFor="inv-dl">
                <input id="inv-dl" type="date" className="input" value={inv.rsvpDeadline ?? (profile.weddingDate ? dueFromWedding(profile.weddingDate, -10) : '')} onChange={(e) => setInvitation({ rsvpDeadline: e.target.value })} />
              </Field>
            </div>
          </Card>

          {/* Cerita */}
          <Card title="Kutipan & cerita" sub={usesStoryPhoto ? 'Template Red Retro menampilkan satu foto di setiap momen.' : undefined}>
            <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
              <Field label="Kutipan" htmlFor="inv-q">
                <textarea id="inv-q" rows={3} className="input" value={inv.quote.text} onChange={(e) => setInvitation({ quote: { ...inv.quote, text: e.target.value } })} />
              </Field>
              <Field label="Sumber kutipan" htmlFor="inv-qb">
                <input id="inv-qb" className="input" value={inv.quote.by} onChange={(e) => setInvitation({ quote: { ...inv.quote, by: e.target.value } })} />
              </Field>
            </div>
            <ul className="space-y-3">
              {inv.story.map((st) => {
                const patch = (p: Partial<typeof st>) => setInvitation({ story: inv.story.map((x) => (x.id === st.id ? { ...x, ...p } : x)) })
                return (
                  <li key={st.id} className="flex gap-3 rounded-2xl border border-border p-3">
                    {usesStoryPhoto && <PhotoPick src={st.photo} label={`Foto ${st.title || 'momen'}`} onChange={(photo) => patch({ photo })} className="w-24 shrink-0" />}
                    <div className="grid min-w-0 flex-1 gap-2">
                      <div className="grid grid-cols-[88px_1fr] gap-2">
                        <input className="input" aria-label="Tahun" placeholder="2022" value={st.year} onChange={(e) => patch({ year: e.target.value })} />
                        <input className="input" aria-label="Judul momen" placeholder="Pertama bertemu" value={st.title} onChange={(e) => patch({ title: e.target.value })} />
                      </div>
                      <textarea className="input" rows={2} aria-label="Cerita" placeholder="Ceritakan singkat" value={st.text} onChange={(e) => patch({ text: e.target.value })} />
                      <button type="button" className="btn-ghost btn-sm justify-self-start text-destructive" onClick={() => setInvitation({ story: inv.story.filter((x) => x.id !== st.id) })}>
                        <Trash2 className="size-4" aria-hidden /> Hapus
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            <button type="button" className="btn-outline btn-sm" onClick={() => setInvitation({ story: [...inv.story, { id: uid(), year: '', title: '', text: '' }] })}>
              <Plus className="size-4" aria-hidden /> Tambah momen
            </button>
          </Card>

          {/* Foto */}
          <Card title="Foto" sub={`Foto yang dipakai template ${TEMPLATES.find((t) => t.id === inv.template)?.name}. Foto dikompres otomatis supaya undangan tetap ringan.`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {slots
                .filter((x): x is Exclude<PhotoSlot, 'story' | 'gallery'> => x !== 'story' && x !== 'gallery')
                .map((slot) => (
                  <PhotoPick
                    key={slot}
                    src={inv.photos[slot]}
                    label={slotLabel(slot, inv.template, profile)}
                    onChange={(v) => setInvitationPhotos({ [slot]: v })}
                    caption
                  />
                ))}
            </div>
            <div>
              <p className="label">
                Galeri ({inv.photos.gallery.length}/{GALLERY_MAX})
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {inv.photos.gallery.map((g, i) => (
                  <PhotoPick
                    key={i}
                    src={g}
                    label={`Galeri ${i + 1}`}
                    onChange={(v) => setInvitationPhotos({ gallery: v ? inv.photos.gallery.map((x, j) => (j === i ? v : x)) : inv.photos.gallery.filter((_, j) => j !== i) })}
                  />
                ))}
                {inv.photos.gallery.length < GALLERY_MAX && (
                  <PhotoPick label="Tambah foto galeri" onChange={(v) => v && setInvitationPhotos({ gallery: [...inv.photos.gallery, v] })} multiple onMany={(list) => setInvitationPhotos({ gallery: [...inv.photos.gallery, ...list].slice(0, GALLERY_MAX) })} />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Penyimpanan terpakai ±{(storageUsageBytes() / 1024 / 1024).toFixed(1)} MB dari ±5 MB.</p>
          </Card>

          {/* Hadiah */}
          <Card title="Hadiah & penutup" sub="Rekening tampil dengan tombol salin. Alamat kado yang kosong tidak ditampilkan.">
            <ul className="space-y-2">
              {inv.accounts.map((a) => {
                const patch = (p: Partial<typeof a>) => setInvitation({ accounts: inv.accounts.map((x) => (x.id === a.id ? { ...x, ...p } : x)) })
                return (
                  <li key={a.id} className="grid grid-cols-[100px_1fr] gap-2 sm:grid-cols-[110px_1fr_1fr_auto]">
                    <input className="input" aria-label="Bank" placeholder="BCA" value={a.bank} onChange={(e) => patch({ bank: e.target.value })} />
                    <input className="input" aria-label="Nomor rekening" inputMode="numeric" placeholder="Nomor rekening" value={a.number} onChange={(e) => patch({ number: e.target.value })} />
                    <input className="input col-span-2 sm:col-span-1" aria-label="Atas nama" placeholder="Atas nama" value={a.holder} onChange={(e) => patch({ holder: e.target.value })} />
                    <button type="button" className="btn-ghost btn-sm text-destructive" aria-label="Hapus rekening" onClick={() => setInvitation({ accounts: inv.accounts.filter((x) => x.id !== a.id) })}>
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                )
              })}
            </ul>
            <button type="button" className="btn-outline btn-sm" onClick={() => setInvitation({ accounts: [...inv.accounts, { id: uid(), bank: '', number: '', holder: '' }] })}>
              <Plus className="size-4" aria-hidden /> Tambah rekening
            </button>
            <Field label="Alamat kirim kado" htmlFor="inv-gift">
              <textarea id="inv-gift" rows={2} className="input" value={inv.giftAddress} placeholder="Kosongkan bila tidak perlu" onChange={(e) => setInvitation({ giftAddress: e.target.value })} />
            </Field>
            {inv.template === 'sage' && (
              <Field label="Keluarga yang mengundang" htmlFor="inv-fam">
                <input id="inv-fam" className="input" value={inv.families} placeholder="Keluarga Besar …" onChange={(e) => setInvitation({ families: e.target.value })} />
              </Field>
            )}
          </Card>

          <Card title={`Ucapan dari tamu (${wishes.length})`} sub="Ucapan dan konfirmasi kehadiran dari undangan masuk ke sini dan ke halaman Tamu.">
            {wishes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada ucapan.</p>
            ) : (
              <ul className="max-h-72 divide-y divide-border/60 overflow-auto text-sm">
                {[...wishes].reverse().map((w) => (
                  <li key={w.id} className="py-2">
                    <p className="m-0 font-semibold">
                      {w.name} <span className="font-normal text-muted-foreground">· {fmtDate(w.at, 'd MMM')}</span>
                    </p>
                    <p className="m-0 text-body">{w.msg}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/app/tamu" className="btn-outline btn-sm justify-self-start">
              Kirim undangan ke {guests.length} tamu
            </Link>
          </Card>
        </div>

        {/* Pratinjau */}
        <aside className="hidden xl:sticky xl:top-6 xl:block">
          <div className="mb-2 flex items-center justify-between">
            <p className="label m-0">Pratinjau</p>
            <Segmented
              label="Tampilan pratinjau"
              value={cover ? 'cover' : 'isi'}
              onChange={(v) => setCover(v === 'cover')}
              options={[
                { value: 'cover', label: 'Sampul' },
                { value: 'isi', label: 'Isi' },
              ]}
            />
          </div>
          <div className="overflow-hidden rounded-[28px] border-[6px] border-ink bg-ink shadow-lift">
            <iframe key={`${inv.template}-${cover}`} title="Pratinjau undangan" src={cover ? `/u/${website.slug}` : `/u/${website.slug}?langsung`} className="block h-[700px] w-full border-0 bg-background" />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* Kartu desain: miniatur layar HP yang memuat sampul undangan asli (iframe diperkecil). */
const PHONE_W = 375
const PHONE_H = 760
const CARD_W = 172
const SCALE = CARD_W / PHONE_W

function TemplateCard({ template: t, slug, active, onPick }: { template: (typeof TEMPLATES)[number]; slug: string; active: boolean; onPick: () => void }) {
  return (
    <div className="grid w-[172px] shrink-0 snap-start gap-3.5">
      <button
        type="button"
        role="radio"
        aria-checked={active}
        aria-label={`Pakai desain ${t.name}`}
        onClick={onPick}
        className={cn(
          'relative overflow-hidden rounded-[22px] border bg-muted text-left shadow-soft transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-lift',
          active ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-card' : 'border-border',
        )}
        style={{ width: CARD_W, height: PHONE_H * SCALE }}
      >
        <iframe
          title={`Pratinjau desain ${t.name}`}
          src={`/u/${slug}?tpl=${t.id}`}
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${SCALE})` }}
        />
        <span
          className={cn(
            'absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm',
            active ? 'border-primary bg-primary text-on-primary' : 'border-border bg-card/95 text-body',
          )}
        >
          {active ? <Check className="size-3.5" aria-hidden /> : <Palette className="size-3.5" aria-hidden />}
          {active ? 'Dipakai' : 'Pilih'}
        </span>
      </button>
      <div className="px-3 pb-1">
        <p className="m-0 truncate font-semibold">{t.name}</p>
        <p className="m-0 mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
        <a href={`/u/${slug}?tpl=${t.id}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-primary">
          <ExternalLink className="size-3.5" aria-hidden /> Preview
        </a>
      </div>
    </div>
  )
}

const slotLabel = (slot: Exclude<PhotoSlot, 'story' | 'gallery'>, tpl: InvitationSettings['template'], p: { partnerA: string; partnerB: string }) => {
  if (slot === 'personA') return `Foto ${p.partnerA || 'mempelai pertama'}`
  if (slot === 'personB') return `Foto ${p.partnerB || 'mempelai kedua'}`
  return PHOTO_LABEL[slot][tpl] || PHOTO_LABEL[slot].default
}

function Card({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="m-0 text-2xl font-semibold">{title}</h2>
          {sub && <p className="m-0 mt-1 text-sm text-muted-foreground">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Kotak foto: klik untuk memilih, foto langsung dikompres. */
function PhotoPick({ src, label, onChange, onMany, multiple, caption, className }: { src?: string; label: string; onChange: (v: string | undefined) => void; onMany?: (list: string[]) => void; multiple?: boolean; caption?: boolean; className?: string }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className={cn('grid gap-1', className)}>
      <div className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
        {src ? (
          <img src={src} alt={label} className="size-full object-cover" />
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="grid size-full place-items-center text-muted-foreground hover:bg-primary-soft hover:text-primary" aria-label={label}>
            {busy ? <span className="text-xs">Memproses…</span> : multiple ? <ImagePlus className="size-6" aria-hidden /> : <Camera className="size-6" aria-hidden />}
          </button>
        )}
        {src && (
          <div className="absolute inset-x-1 bottom-1 flex gap-1">
            <button type="button" onClick={() => input.current?.click()} className="flex-1 rounded-lg bg-black/60 px-1 py-1 text-[11px] font-semibold text-white" aria-label={`Ganti ${label}`}>
              Ganti
            </button>
            <button type="button" onClick={() => onChange(undefined)} className="rounded-lg bg-black/60 px-2 py-1 text-white" aria-label={`Hapus ${label}`}>
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </div>
        )}
      </div>
      {caption && <span className="text-xs leading-snug text-muted-foreground">{label}</span>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-label={`Pilih ${label}`}
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])]
          e.target.value = ''
          if (!files.length) return
          setBusy(true)
          try {
            if (multiple && onMany) onMany(await Promise.all(files.map(compress)))
            else onChange(await compress(files[0]))
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}
