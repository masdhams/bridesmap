import { Camera, Copy, Download, FileUp, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCard } from '../../components/CalendarCard'
import { ConfirmButton, Field, MoneyInput, PageHeader, PartnerAvatar } from '../../components/ui'
import { exportData, storageUsageBytes, usePlan } from '../../lib/store'
import { compressImage, downloadFile, todayISO } from '../../lib/utils'

export default function Settings() {
  const { profile, setProfile, setTotalBudget, importData, reset } = usePlan()
  const [totalDraft, setTotalDraft] = useState(profile.totalBudget)
  const navigate = useNavigate()
  const [msg, setMsg] = useState('')
  const invite = `${location.origin}/mulai?undangan=${encodeURIComponent(profile.partnerA)}`

  return (
    <div className="max-w-2xl">
      <PageHeader title="Pengaturan & pasangan" />

      <section className="card p-5 space-y-4">
        <h2 className="text-2xl font-semibold">Rencana kalian</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama kamu" htmlFor="pa"><input id="pa" className="input" value={profile.partnerA} onChange={(e) => setProfile({ partnerA: e.target.value })} /></Field>
          <Field label="Nama pasangan" htmlFor="pb"><input id="pb" className="input" value={profile.partnerB} onChange={(e) => setProfile({ partnerB: e.target.value })} /></Field>
          <Field label="Tanggal hari-H" htmlFor="pd" hint="Tanggal checklist ikut bergeser otomatis."><input id="pd" type="date" className="input" value={profile.weddingDate} onChange={(e) => setProfile({ weddingDate: e.target.value })} /></Field>
          <Field label="Kota" htmlFor="pc"><input id="pc" className="input" value={profile.city} onChange={(e) => setProfile({ city: e.target.value })} /></Field>
          <Field label="Total budget" htmlFor="pt" hint="Alokasi per acara & kategori ikut menyesuaikan dengan persentase yang sama."><MoneyInput id="pt" value={totalDraft} onChange={setTotalDraft} onBlur={() => totalDraft > 0 && totalDraft !== profile.totalBudget && setTotalBudget(totalDraft)} /></Field>
          <Field label="Perkiraan tamu" htmlFor="pg"><input id="pg" type="number" min={1} className="input" value={profile.guestEstimate} onChange={(e) => setProfile({ guestEstimate: Number(e.target.value) })} /></Field>
        </div>
      </section>

      <section className="card mt-5 p-5" aria-labelledby="foto-profil">
        <h2 id="foto-profil" className="text-2xl font-semibold">Foto profil</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tampil di avatar dan menu pasangan. Kalau belum diisi, yang tampil inisial nama.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(['A', 'B'] as const).map((p) => {
            const name = p === 'A' ? profile.partnerA : profile.partnerB
            const photo = p === 'A' ? profile.photoA : profile.photoB
            const key = p === 'A' ? 'photoA' : 'photoB'
            return (
              <div key={p} className="flex items-center gap-4 rounded-2xl bg-muted/60 p-4">
                <PartnerAvatar who={p} name={name || '?'} size={64} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="truncate text-sm font-semibold">{name || (p === 'A' ? 'Kamu' : 'Pasangan')}</span>
                  <div className="flex flex-wrap gap-2">
                    <label className="btn-outline btn-sm cursor-pointer">
                      <Camera className="size-4" aria-hidden /> {photo ? 'Ganti' : 'Upload foto'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        aria-label={`Upload foto profil ${name || p}`}
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          e.target.value = ''
                          if (!f) return
                          try {
                            setProfile({ [key]: await compressImage(f, 400, 0.8) })
                            setMsg('Foto profil diperbarui.')
                          } catch {
                            setMsg('Foto itu tidak bisa dibaca. Coba foto lain.')
                          }
                        }}
                      />
                    </label>
                    {photo && (
                      <button className="btn-ghost btn-sm text-destructive" onClick={() => setProfile({ [key]: undefined })}>
                        <Trash2 className="size-4" aria-hidden /> Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card mt-5 p-5">
        <h2 className="text-2xl font-semibold">Undang pasangan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Kalian berdua bisa mengisi rencana yang sama. Setiap centang tercatat siapa yang menyelesaikannya.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="btn-primary btn-sm" href={`https://wa.me/?text=${encodeURIComponent(`Yuk rencanakan pernikahan kita bareng di Bridesmap: ${invite}`)}`} target="_blank" rel="noreferrer" onClick={() => setProfile({ partnerInvited: true })}>
            <Send className="size-4" aria-hidden /> Kirim lewat WhatsApp
          </a>
          <button className="btn-outline btn-sm" onClick={() => navigator.clipboard.writeText(invite).then(() => setMsg('Tautan undangan disalin.'))}><Copy className="size-4" aria-hidden /> Salin tautan</button>
        </div>
        <p className="mt-3 rounded-xl bg-muted/70 p-3 text-xs text-muted-foreground">
          Versi ini menyimpan data di perangkat ini dan menyinkronkan antar-tab secara langsung. Sinkronisasi real-time antar dua akun berbeda aktif setelah backend (login &amp; database) tersambung. Untuk sementara, bergantian lewat avatar R/D di Beranda (atau tombol nama di halaman Deep Talk).
        </p>
      </section>

      <CalendarCard />

      <section className="card mt-5 p-5">
        <h2 className="text-2xl font-semibold">Data kalian</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ekspor semua data (budget, vendor, bukti transfer, tamu) sebagai cadangan, atau pindahkan ke perangkat lain.</p>
        {(() => {
          const mb = storageUsageBytes() / 1024 / 1024
          const pct = Math.min(100, (mb / 5) * 100)
          return (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Penyimpanan di perangkat ini</span>
                <span className="tabular-nums">{mb.toFixed(2).replace('.', ',')} MB dari ±5 MB</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Pemakaian penyimpanan">
                <div className={pct > 80 ? 'h-1.5 rounded-full bg-destructive' : 'h-1.5 rounded-full bg-primary'} style={{ width: `${pct}%` }} />
              </div>
              {pct > 80 && <p className="mt-1.5 text-xs text-danger-ink">Hampir penuh. Foto (bukti transfer, vision board, Surat untuk Nanti) paling banyak memakan tempat.</p>}
            </div>
          )
        })()}
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-outline btn-sm" onClick={() => downloadFile(`bridesmap-${todayISO()}.json`, exportData(), 'application/json')}><Download className="size-4" aria-hidden /> Ekspor data</button>
          <label className="btn-outline btn-sm">
            <FileUp className="size-4" aria-hidden /> Impor data
            <input type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setMsg(importData(await f.text()) ? 'Data berhasil diimpor.' : 'File tidak valid.') }} />
          </label>
          <ConfirmButton className="btn-ghost btn-sm text-destructive" label="Hapus semua" onConfirm={() => { reset(); navigate('/', { replace: true }) }}>
            <Trash2 className="size-4" aria-hidden /> Hapus semua data
          </ConfirmButton>
        </div>
        {msg && <p className="mt-3 text-sm text-success" role="status">{msg}</p>}
      </section>
    </div>
  )
}
