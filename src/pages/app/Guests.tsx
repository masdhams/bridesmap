import { Copy, Download, FileUp, MessageCircle, Plus, Search, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PanelStat, WithPanel } from '../../components/bento'
import { ComboInput, Select } from '../../components/select'
import { HelpHint } from '../../components/HelpHint'
import { ConfirmButton, Empty, Field, FilterChips, Modal, PageHeader, RoundButton } from '../../components/ui'
import { GUIDE_HINTS } from '../../data/guide'
import { parseGuestCsv, parseVcf, type ImportedGuest } from '../../lib/csv'
import { invitationUrl } from '../../lib/invitation'
import { guestStats } from '../../lib/selectors'
import { usePlan } from '../../lib/store'
import type { Guest, GuestSide, RsvpStatus } from '../../lib/types'
import { cn, uid } from '../../lib/utils'

export const RSVP_LABEL: Record<RsvpStatus, string> = { belum: 'Belum membalas', hadir: 'Hadir', tidak: 'Tidak hadir', ragu: 'Masih ragu' }
const RSVP_STYLE: Record<RsvpStatus, string> = { belum: 'bg-muted text-body', hadir: 'bg-success-soft text-success', tidak: 'bg-danger-soft text-danger-ink', ragu: 'bg-warning-soft text-warning' }
const RSVP_SHORT: Record<RsvpStatus, string> = { belum: 'Menunggu', hadir: 'Hadir', tidak: 'Tidak hadir', ragu: 'Ragu' }
const RSVP_DOT: Record<RsvpStatus, string> = { belum: 'bg-muted-foreground', hadir: 'bg-success', tidak: 'bg-destructive', ragu: 'bg-warning' }
const GroupLabel = ({ name, n }: { name: string; n: number }) => (
  <span className="flex items-center justify-between gap-4">
    <span>{name}</span>
    <span className="text-xs font-normal tabular-nums text-muted-foreground">{n}</span>
  </span>
)
const GROUPS = ['Keluarga', 'Teman', 'Kantor', 'Tetangga', 'VIP']

export default function Guests() {
  const { guests, profile, website, add, update, remove, replace } = usePlan()
  const [q, setQ] = useState('')
  const [rsvpFilter, setRsvpFilter] = useState<'semua' | RsvpStatus>('semua')
  const [draft, setDraft] = useState<Partial<Guest> | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [preview, setPreview] = useState<ImportedGuest[]>([])
  const [importErr, setImportErr] = useState('')
  const stats = guestStats(guests)
  const groups = useMemo(() => Array.from(new Set([...GROUPS, ...guests.map((g) => g.group)])), [guests])
  const sideName = (s: GuestSide) => (s === 'A' ? profile.partnerA : s === 'B' ? profile.partnerB : 'Bersama')

  const list = guests.filter((g) => (rsvpFilter === 'semua' || g.rsvp === rsvpFilter) && g.name.toLowerCase().includes(q.toLowerCase()))
  const catering = stats.hadir + stats.ragu + Math.ceil((stats.hadir + stats.ragu) * 0.1)

  const save = () => {
    if (!draft?.name) return
    if (draft.id) update('guests', draft.id, draft)
    else add('guests', { id: uid(), name: draft.name, group: draft.group || 'Keluarga', side: draft.side ?? 'A', phone: draft.phone, pax: draft.pax || 1, rsvp: draft.rsvp ?? 'belum', diet: draft.diet, household: draft.household })
    setDraft(null)
  }

  const onFile = async (file?: File) => {
    if (!file) return
    setImportErr('')
    const text = await file.text()
    const rows = /\.vcf$/i.test(file.name) ? parseVcf(text) : parseGuestCsv(text)
    if (!rows.length) setImportErr('Tidak ada tamu yang terbaca. Pastikan ada kolom "Nama".')
    setPreview(rows)
  }

  const doImport = () => {
    const rows = preview
    replace('guests', [...guests, ...rows.map((r) => ({ id: uid(), name: r.name, group: r.group || 'Keluarga', side: 'bersama' as GuestSide, phone: r.phone, pax: r.pax || 1, rsvp: 'belum' as RsvpStatus }))])
    setPreview([])
    setImportOpen(false)
  }

  // Tautan personal ke undangan digital: nama tamu tampil di sampul dan RSVP-nya tercatat ke tamu ini.
  const inviteLink = (g: Guest) => invitationUrl(website.slug, g)
  const waLink = (g: Guest) => {
    const phone = (g.phone ?? '').replace(/[^\d]/g, '').replace(/^0/, '62')
    const text = `Halo ${g.name},

Dengan penuh sukacita kami, ${profile.partnerA} & ${profile.partnerB}, mengundangmu ke hari pernikahan kami. Undangan dan konfirmasi kehadiran ada di tautan berikut:
${inviteLink(g)}

Terima kasih 🙏`
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }
  const [copiedId, setCopiedId] = useState('')
  const copyLink = (g: Guest) =>
    navigator.clipboard.writeText(inviteLink(g)).then(() => {
      setCopiedId(g.id)
      setTimeout(() => setCopiedId(''), 1800)
    })
  const [sendAll, setSendAll] = useState(false)
  const pending = guests.filter((g) => g.rsvp === 'belum')
  const sendList = sendAll ? guests : pending

  const [followOpen, setFollowOpen] = useState(false)
  const [group, setGroup] = useState('semua')
  const allGroups = Array.from(new Set(guests.map((g) => g.group)))
  const inGroup = guests.filter((g) => group === 'semua' || g.group === group)
  const shown = list.filter((g) => group === 'semua' || g.group === group)
  const totalPax = Math.max(1, stats.totalPax)
  const waiting = stats.belum + stats.ragu
  const initialsOf = (n: string) =>
    n
      .replace(/\(.*?\)/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('')
  const avatarTone = (s: GuestSide) => (s === 'A' ? 'bg-primary-soft text-on-primary-soft' : s === 'B' ? 'bg-accent-soft text-accent-ink' : 'bg-muted text-body')

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3.5 xl:max-w-none">
      <PageHeader
        title="Tamu"
        subtitle="Rekap kehadiran untuk katering."
        actions={
          <>
            <button className="btn-outline min-h-11 px-3.5 text-[13px]" onClick={() => setImportOpen(true)}>
              <Download className="size-4" strokeWidth={1.8} aria-hidden /> Impor CSV
            </button>
            <RoundButton label="Tambah tamu" onClick={() => setDraft({ side: 'A', pax: 1, rsvp: 'belum', group: 'Keluarga' })}>
              <Plus className="size-[18px]" strokeWidth={2} />
            </RoundButton>
          </>
        }
      />

      <WithPanel
        panel={
          <aside className="sticky top-24 hidden flex-col gap-4 rounded-[28px] bg-primary p-6 text-white shadow-[var(--shadow-soft)] xl:flex">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">
                {stats.totalPax} tamu · {stats.invited} undangan
              </span>
              <span className="text-xs text-[#D5DCCB]">±{catering} porsi katering</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { n: stats.hadir, label: 'Hadir', color: '#C9D4BA' },
                { n: waiting, label: 'Menunggu', color: '#E7D8B8' },
                { n: stats.tidak, label: 'Tidak hadir', color: '#E8B9AB' },
              ].map((x) => (
                <div key={x.label} className="flex flex-col gap-0.5">
                  <span className="font-serif text-[36px] leading-none tabular-nums">{x.n}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#D5DCCB]">
                    <span className="size-2 rounded-full" style={{ background: x.color }} />
                    {x.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-white/15">
              <div style={{ width: `${(stats.hadir / totalPax) * 100}%`, background: '#C9D4BA' }} />
              <div style={{ width: `${(waiting / totalPax) * 100}%`, background: '#E7D8B8' }} />
              <div style={{ width: `${(stats.tidak / totalPax) * 100}%`, background: '#E8B9AB' }} />
            </div>
            {pending.length > 0 && (
              // PRD #31: tautan RSVP dibagikan manual oleh pasangan — bukan pengingat WhatsApp otomatis.
              <button className="btn min-h-11 bg-white text-[13px] text-ink hover:bg-primary-soft" onClick={() => setFollowOpen(true)}>
                <MessageCircle className="size-4" strokeWidth={1.8} aria-hidden /> Kirim undangan ke {pending.length} tamu yang belum membalas
              </button>
            )}
                <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#D5DCCB]">Per pihak</span>
              {(["A", "B", "bersama"] as const).map((sd) => (
                <PanelStat key={sd} label={sideName(sd)} value={`${guests.filter((g) => g.side === sd).reduce((n, g) => n + g.pax, 0)} orang`} />
              ))}
            </div>
          </aside>
        }
      >
      <section className="flex flex-col gap-3.5 rounded-[24px] bg-primary px-5 py-[18px] text-white xl:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold">
            {stats.totalPax} tamu · {stats.invited} undangan
          </span>
          <span className="text-xs text-[#D5DCCB]">±{catering} porsi katering</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: stats.hadir, label: 'Hadir', color: '#C9D4BA' },
            { n: waiting, label: 'Menunggu', color: '#E7D8B8' },
            { n: stats.tidak, label: 'Tidak hadir', color: '#E8B9AB' },
          ].map((x) => (
            <div key={x.label} className="flex flex-col gap-0.5">
              <span className="font-serif text-[36px] leading-none tabular-nums">{x.n}</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[#D5DCCB]">
                <span className="size-2 rounded-full" style={{ background: x.color }} />
                {x.label}
              </span>
            </div>
          ))}
        </div>
        <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-white/15">
          <div style={{ width: `${(stats.hadir / totalPax) * 100}%`, background: '#C9D4BA' }} />
          <div style={{ width: `${(waiting / totalPax) * 100}%`, background: '#E7D8B8' }} />
          <div style={{ width: `${(stats.tidak / totalPax) * 100}%`, background: '#E8B9AB' }} />
        </div>
        {pending.length > 0 && (
          // PRD #31: tautan RSVP dibagikan manual oleh pasangan — bukan pengingat WhatsApp otomatis.
          <button className="btn min-h-11 bg-white text-[13px] text-ink hover:bg-primary-soft" onClick={() => setFollowOpen(true)}>
            <MessageCircle className="size-4" strokeWidth={1.8} aria-hidden /> Kirim undangan ke {pending.length} tamu yang belum membalas
          </button>
        )}
      </section>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="flex min-h-[50px] items-center gap-2.5 rounded-[14px] border border-input bg-card px-3.5 focus-within:border-primary sm:flex-1">
            <Search className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden />
            <input type="search" className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Cari nama atau keluarga" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari tamu" />
          </div>
          {/* Grup berupa dropdown (bisa banyak grup), status RSVP berupa chip berwarna. */}
          <Select
            className="sm:w-64"
            label="Filter grup"
            value={group}
            onChange={setGroup}
            options={[
              { value: 'semua', label: <GroupLabel name="Semua grup" n={guests.length} /> },
              ...allGroups.map((g) => ({ value: g, label: <GroupLabel name={g} n={guests.filter((x) => x.group === g).length} /> })),
            ]}
          />
        </div>
        <FilterChips
          label="Filter RSVP"
          value={rsvpFilter}
          onChange={setRsvpFilter}
          options={[
            { value: 'semua', label: <>Semua <span className="tabular-nums opacity-70">{inGroup.length}</span></> },
            ...(['hadir', 'belum', 'ragu', 'tidak'] as const).map((k) => ({
              value: k,
              label: (
                <>
                  <span aria-hidden className={cn('size-2 rounded-full', RSVP_DOT[k])} />
                  {RSVP_SHORT[k]} <span className="tabular-nums opacity-70">{inGroup.filter((g) => g.rsvp === k).length}</span>
                </>
              ),
            })),
          ]}
        />
      </div>

      {guests.length === 0 ? (
        <Empty icon={<Users className="size-6" />} title="Daftar tamu masih kosong" action={<div className="flex flex-col items-center gap-4"><button className="btn-primary" onClick={() => setImportOpen(true)}>Impor dari Excel / kontak HP</button><HelpHint>{GUIDE_HINTS.tamu}</HelpHint></div>}>
          Tambah satu per satu atau impor dari file CSV/Excel dan kontak HP (.vcf).
        </Empty>
      ) : (
        <ul className="overflow-hidden rounded-[20px] border border-border bg-card">
          {shown.map((g) => (
            <li key={g.id} className="flex min-h-[66px] items-center gap-3 border-b border-divider px-3.5 py-2.5 last:border-0">
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setDraft(g)}>
                <span aria-hidden className={cn('grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold', avatarTone(g.side))}>
                  {initialsOf(g.name)}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">
                    {g.name}
                    {g.pax > 1 && ` +${g.pax - 1}`}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {g.pax} orang · {g.group} · {sideName(g.side)}
                    {g.diet && ` · ${g.diet}`}
                  </span>
                </span>
              </button>
              {g.rsvp === 'belum' && g.phone ? (
                <a href={waLink(g)} target="_blank" rel="noreferrer" className="inline-flex min-h-8 shrink-0 items-center rounded-full border border-[#D9B77A] bg-warning-soft px-2.5 text-[11px] font-semibold text-warning">
                  Kirim
                </a>
              ) : (
                <span className={cn('chip min-h-6 shrink-0 px-2 text-[11px]', RSVP_STYLE[g.rsvp])}>{RSVP_SHORT[g.rsvp]}</span>
              )}
            </li>
          ))}
          {shown.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Tidak ada tamu yang cocok.</li>}
        </ul>
      )}
      </WithPanel>

      <Modal open={followOpen} onClose={() => setFollowOpen(false)} title="Kirim undangan">
          <p className="text-sm text-body">
            Setiap tamu mendapat tautan undangan dengan namanya sendiri. Kirim lewat WhatsApp kalian, satu per satu; konfirmasi kehadirannya otomatis tercatat di sini.{' '}
            <Link to="/app/undangan" className="text-primary underline">Atur undangan</Link>
          </p>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={sendAll} onChange={(e) => setSendAll(e.target.checked)} />
            Tampilkan semua tamu ({guests.length}), bukan hanya yang belum membalas
          </label>
          <ul className="divide-y divide-divider">
            {sendList.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{g.name}</span>
                <button type="button" className="btn-ghost btn-sm" onClick={() => copyLink(g)}>
                  <Copy className="size-4" aria-hidden /> {copiedId === g.id ? 'Tersalin' : 'Salin tautan'}
                </button>
                {g.phone ? (
                  <a className="btn-outline btn-sm" href={waLink(g)} target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" aria-hidden /> Kirim WA
                  </a>
                ) : (
                  <span className="w-[92px] text-right text-xs text-muted-foreground">tanpa nomor</span>
                )}
              </li>
            ))}
          </ul>
      </Modal>

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Ubah tamu' : 'Tambah tamu'}
        footer={
          <>
            {draft?.id && <ConfirmButton className="btn-ghost text-destructive mr-auto" onConfirm={() => { remove('guests', draft.id!); setDraft(null) }}><Trash2 className="size-4" aria-hidden /> Hapus</ConfirmButton>}
            <button className="btn-ghost" onClick={() => setDraft(null)}>Batal</button>
            <button className="btn-primary" onClick={save} disabled={!draft?.name}>Simpan</button>
          </>
        }>
        <Field label="Nama" htmlFor="gn"><input id="gn" className="input" value={draft?.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grup" htmlFor="gg">
            <ComboInput id="gg" value={draft?.group ?? ''} onChange={(v) => setDraft({ ...draft, group: v })} suggestions={groups} placeholder="mis. Keluarga, Teman kantor" />
          </Field>
          <Field label="Tamu dari" htmlFor="gs">
            <Select id="gs" value={draft?.side ?? 'A'} onChange={(v) => setDraft({ ...draft, side: v as GuestSide })} options={[{ value: 'A', label: profile.partnerA }, { value: 'B', label: profile.partnerB }, { value: 'bersama', label: 'Bersama' }]} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="No. HP / WA" htmlFor="gp"><input id="gp" className="input" inputMode="tel" value={draft?.phone ?? ''} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></Field>
          <Field label="Status RSVP" htmlFor="gr">
            <Select id="gr" value={draft?.rsvp ?? 'belum'} onChange={(v) => setDraft({ ...draft, rsvp: v as RsvpStatus })} options={Object.entries(RSVP_LABEL).map(([k, l]) => ({ value: k, label: l }))} />
          </Field>
        </div>
        <Field label="Jumlah orang (termasuk plus-one)" htmlFor="gx"><input id="gx" type="number" min={1} className="input" value={draft?.pax ?? 1} onChange={(e) => setDraft({ ...draft, pax: Math.max(1, Number(e.target.value)) })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rumah tangga / keluarga" htmlFor="gh"><input id="gh" className="input" value={draft?.household ?? ''} onChange={(e) => setDraft({ ...draft, household: e.target.value })} placeholder="mis. Keluarga Pak Darto" /></Field>
          <Field label="Pantangan makanan" htmlFor="gd"><input id="gd" className="input" value={draft?.diet ?? ''} onChange={(e) => setDraft({ ...draft, diet: e.target.value })} placeholder="mis. vegetarian, alergi udang" /></Field>
        </div>
      </Modal>

      <Modal open={importOpen} onClose={() => { setImportOpen(false); setPreview([]) }} title="Impor daftar tamu"
        footer={preview.length > 0 && <><button className="btn-ghost" onClick={() => setPreview([])}>Ganti file</button><button className="btn-primary" onClick={doImport}>Impor {preview.length} tamu</button></>}>
        <p className="text-sm text-muted-foreground">Dari Excel/Google Sheets: <em>File → Download → CSV</em>. Kolom yang dibaca: <strong>Nama</strong> (wajib), Grup, No HP, Jumlah. Kontak HP: ekspor sebagai .vcf.</p>
        <label className="card flex cursor-pointer flex-col items-center gap-2 border-dashed p-6 text-center hover:bg-primary-soft/40 transition-colors duration-200">
          <FileUp className="size-6 text-primary" aria-hidden />
          <span className="text-sm font-semibold">Pilih file .csv atau .vcf</span>
          <input type="file" accept=".csv,.vcf,text/csv,text/vcard" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {importErr && <p className="text-sm text-destructive" role="alert">{importErr}</p>}
        {preview.length > 0 && (
          <div>
            <p className="text-sm font-semibold">{preview.length} tamu terbaca</p>
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-muted/70 p-3 text-sm">
              {preview.slice(0, 50).map((r, i) => <li key={i} className="truncate">{r.name}{r.group && <span className="text-muted-foreground"> · {r.group}</span>}</li>)}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  )
}
