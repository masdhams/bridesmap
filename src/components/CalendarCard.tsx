import { CalendarCheck, CalendarSync, Unplug } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { type CalendarStatus, calendarStatus, connectCalendar, disconnectCalendar, syncCalendar } from '../lib/calendarApi'
import { taskDue } from '../lib/selectors'
import { usePlan } from '../lib/store'
import { fmtDate } from '../lib/utils'
import { Select } from './select'
import { ConfirmButton } from './ui'

const FLASH: Record<string, { text: string; ok: boolean }> = {
  terhubung: { text: 'Google Calendar terhubung. Tekan "Sinkronkan sekarang" untuk mengirim tugas.', ok: true },
  ditolak: { text: 'Izin ke Google Calendar tidak diberikan, jadi belum terhubung.', ok: false },
  gagal: { text: 'Gagal menghubungkan Google Calendar. Coba lagi.', ok: false },
}

/** Kartu di Pengaturan: hubungkan Google Calendar dan kirim tugas yang belum selesai sebagai pengingat. */
export function CalendarCard() {
  const { tasks, profile } = usePlan()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState<CalendarStatus | 'offline' | null>(null)
  const [busy, setBusy] = useState(false)
  const [reminder, setReminder] = useState('1')
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const refresh = useCallback(async () => {
    try {
      setStatus(await calendarStatus())
    } catch {
      setStatus('offline')
    }
  }, [])
  useEffect(() => {
    refresh()
  }, [refresh])

  // Hasil dari Google kembali lewat ?kalender=…; tampilkan sekali lalu bersihkan dari alamat.
  useEffect(() => {
    const flag = params.get('kalender')
    if (!flag) return
    setMsg(FLASH[flag] ?? null)
    const next = new URLSearchParams(params)
    next.delete('kalender')
    setParams(next, { replace: true })
  }, [params, setParams])

  const sync = async () => {
    setBusy(true)
    setMsg(null)
    try {
      // Hanya tugas yang belum selesai: tugas yang dicentang akan hilang dari kalender. Tanpa nominal budget.
      const payload = tasks
        .filter((t) => !t.done)
        .map((t) => ({ id: t.id, title: t.title, dueDate: taskDue(profile.weddingDate, t.offsetDays, t.custom), reminderDaysBefore: Number(reminder) }))
        .filter((t) => t.dueDate)
      const r = await syncCalendar(payload)
      if (r.reconnect) {
        setStatus({ connected: false })
        setMsg({ text: 'Sambungan ke Google berakhir. Hubungkan ulang.', ok: false })
      } else if (r.result) {
        const x = r.result
        setMsg({
          text: `Selesai: ${x.created} dibuat, ${x.updated} diperbarui, ${x.unchanged} tetap, ${x.deleted} dihapus${x.failed.length ? `, ${x.failed.length} gagal` : ''}.`,
          ok: x.failed.length === 0,
        })
      } else setMsg({ text: 'Sinkronisasi gagal. Coba lagi sebentar lagi.', ok: false })
    } catch {
      setStatus('offline')
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    setBusy(true)
    try {
      await disconnectCalendar()
      setStatus({ connected: false })
      setMsg({ text: 'Terputus. Acara yang sudah terkirim tetap ada di kalender "Bridesmap" di Google.', ok: true })
    } catch {
      setStatus('offline')
    } finally {
      setBusy(false)
    }
  }

  const connected = typeof status === 'object' && status?.connected

  return (
    <section className="card mt-5 p-5" aria-labelledby="gcal">
      <h2 id="gcal" className="text-2xl font-semibold">
        Google Calendar
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Kirim tugas yang belum selesai sebagai pengingat ke kalender khusus bernama "Bridesmap". Hanya judul tugas dan tanggalnya yang dikirim, tanpa nominal budget. Kalender pribadimu tidak bisa dibaca.
      </p>

      {status === null && <p className="mt-3 text-sm text-muted-foreground">Memeriksa sambungan…</p>}

      {status === 'offline' && (
        <div className="mt-3 rounded-xl bg-muted/70 p-3 text-sm text-body" role="status">
          Server kalender belum berjalan. Isi <code>server/.env</code>, lalu jalankan <code>npm run dev:server</code> (lihat <code>server/README.md</code>).
          <button className="btn-ghost btn-sm ml-1 inline-flex" onClick={refresh}>
            Cek lagi
          </button>
        </div>
      )}

      {typeof status === 'object' && status && !status.connected && (
        <button className="btn-primary btn-sm mt-3" onClick={() => connectCalendar().catch(() => setStatus('offline'))}>
          <CalendarSync className="size-4" aria-hidden /> Hubungkan Google Calendar
        </button>
      )}

      {connected && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <CalendarCheck className="size-4" aria-hidden /> Terhubung
            {typeof status === 'object' && status?.connectedAt && <span className="font-normal text-muted-foreground">sejak {fmtDate(status.connectedAt.slice(0, 10), 'd MMM yyyy')}</span>}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-52">
              <Select
                label="Waktu pengingat"
                value={reminder}
                onChange={setReminder}
                compact
                options={[
                  { value: '0', label: 'Pada harinya' },
                  { value: '1', label: '1 hari sebelumnya' },
                  { value: '3', label: '3 hari sebelumnya' },
                  { value: '7', label: '1 minggu sebelumnya' },
                ]}
              />
            </div>
            <button className="btn-primary btn-sm" onClick={sync} disabled={busy}>
              <CalendarSync className="size-4" aria-hidden /> {busy ? 'Menyinkronkan…' : 'Sinkronkan sekarang'}
            </button>
            <ConfirmButton className="btn-ghost btn-sm text-destructive" label="Putuskan" onConfirm={disconnect}>
              <Unplug className="size-4" aria-hidden /> Putuskan
            </ConfirmButton>
          </div>
          <p className="text-xs text-muted-foreground">Pengingat muncul pukul 09.00. Tugas yang sudah dicentang selesai akan dihapus dari kalender saat sinkron berikutnya.</p>
        </div>
      )}

      {msg && (
        <p className={msg.ok ? 'mt-3 text-sm text-success' : 'mt-3 text-sm text-danger-ink'} role="status">
          {msg.text}
        </p>
      )}
    </section>
  )
}
