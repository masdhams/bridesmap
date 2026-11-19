import { Download } from 'lucide-react'
import { useState } from 'react'
import { downloadIcs, type CalEvent } from '../lib/calendar'
import { taskDue } from '../lib/selectors'
import { usePlan } from '../lib/store'
import { Select } from './select'

/** Kartu di Pengaturan: unduh tugas yang belum selesai sebagai file .ics, lalu impor ke kalender apa pun.
 *  Tidak butuh sambungan Google. Hanya judul dan tanggal yang dimasukkan, tanpa nominal budget. */
export function IcsExportCard() {
  const { tasks, profile } = usePlan()
  const [reminder, setReminder] = useState('1')

  const events: CalEvent[] = tasks
    .filter((t) => !t.done)
    .map((t) => ({ uid: t.id, title: t.title, date: taskDue(profile.weddingDate, t.offsetDays, t.custom), alarmDays: Number(reminder), description: 'Pengingat dari Bridesmap' }))
    .filter((e) => e.date)
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <section className="card mt-5 p-5" aria-labelledby="ics">
      <h2 id="ics" className="text-2xl font-semibold">
        Unduh ke kalender
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Unduh tugas yang belum selesai sebagai file kalender (.ics), lalu impor ke Google Calendar, Apple Calendar, atau aplikasi kalender lain. Tidak perlu menghubungkan akun Google.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
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
        <button className="btn-primary btn-sm" disabled={events.length === 0} onClick={() => downloadIcs('bridesmap-tugas.ics', events)}>
          <Download className="size-4" aria-hidden /> Unduh .ics
        </button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {events.length === 0 ? 'Tidak ada tugas yang belum selesai untuk diunduh.' : `${events.length} tugas belum selesai akan masuk ke file. Pengingat muncul pukul 09.00.`}
      </p>

      <details className="mt-3 text-sm text-body">
        <summary className="cursor-pointer font-semibold text-ink">Cara impor ke Google Calendar</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Buka calendar.google.com di komputer.</li>
          <li>Klik roda gigi, lalu pilih Pengaturan.</li>
          <li>Pilih Impor &amp; ekspor, lalu klik Pilih file dari komputer.</li>
          <li>Pilih file bridesmap-tugas.ics, pilih kalender tujuan, lalu klik Impor.</li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Impor ini satu kali. Kalau tugas berubah, unduh file baru dan impor lagi. Tugas yang sudah dicentang tidak ikut diunduh.</p>
      </details>
    </section>
  )
}
