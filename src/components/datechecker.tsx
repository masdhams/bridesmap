// Pemeriksa tanggal nikah: kalender dengan tanggal Hijriah, hari libur nasional, dan catatan musim nikah.
// Dipakai di halaman memulai rencana (jendela kecil), tanpa pindah halaman.
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Info, TriangleAlert, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { dateNotes, HOLIDAYS, hijriLabel, hijriMonthDay } from '../data/calendar'
import { cn, daysUntil } from '../lib/utils'
import { Modal } from './ui'

const DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const iso = (d: Date) => format(d, 'yyyy-MM-dd')

export function DateChecker({ open, onClose, value, onPick }: { open: boolean; onClose: () => void; value: string; onPick: (iso: string) => void }) {
  const start = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : new Date()
  const [month, setMonth] = useState(() => startOfMonth(start))
  const [picked, setPicked] = useState<Date>(start)

  // Setiap dibuka: mulai dari tanggal yang sedang dipilih di formulir.
  useEffect(() => {
    if (!open) return
    const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : new Date()
    setMonth(startOfMonth(d))
    setPicked(d)
  }, [open, value])

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) })
  const notes = dateNotes(picked, iso(picked))
  const hijriMonthName = hijriLabel(month).replace(/^\d+\s/, '')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cek tanggal"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              onPick(iso(picked))
              onClose()
            }}
          >
            Pakai tanggal ini
          </button>
        </>
      }
    >
      <p className="text-sm text-body">Lihat tanggal Hijriah, hari libur nasional, dan pertimbangan musim nikah. Keputusan tanggal tetap milik kalian dan keluarga.</p>

      <div className="flex items-center justify-between">
        <button type="button" className="icon-btn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Bulan sebelumnya">
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <p className="font-serif text-2xl">{format(month, 'MMMM yyyy', { locale: localeId })}</p>
          <p className="text-xs text-muted-foreground">{hijriMonthName}</p>
        </div>
        <button type="button" className="icon-btn" onClick={() => setMonth(addMonths(month, 1))} aria-label="Bulan berikutnya">
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
          {DOW.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const k = iso(d)
            const hol = HOLIDAYS[k]
            const hm = hijriMonthDay(d)
            const weekend = d.getDay() === 0 || d.getDay() === 6
            const sel = isSameDay(d, picked)
            const ramadan = hm?.month === 9
            return (
              <button
                key={k}
                type="button"
                onClick={() => setPicked(d)}
                aria-pressed={sel}
                aria-label={`${format(d, 'EEEE d MMMM yyyy', { locale: localeId })}${hol ? `, ${hol}` : ''}`}
                className={cn(
                  'relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm',
                  !isSameMonth(d, month) && 'opacity-35',
                  sel ? 'bg-primary text-on-primary' : ramadan ? 'bg-warning-soft/70 hover:bg-warning-soft' : weekend ? 'bg-primary-soft/60 hover:bg-primary-soft' : 'hover:bg-muted',
                )}
              >
                <span className="font-semibold tabular-nums">{d.getDate()}</span>
                {hm && <span className={cn('text-[10px] tabular-nums', sel ? 'text-white/80' : 'text-muted-foreground')}>{hm.day}</span>}
                {hol && <span className={cn('absolute right-1 top-1 size-1.5 rounded-full', sel ? 'bg-white' : 'bg-destructive')} aria-hidden />}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-primary-soft" aria-hidden /> Akhir pekan
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-destructive" aria-hidden /> Libur nasional
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-warning-soft" aria-hidden /> Ramadan
          </span>
          <span>Angka kecil = tanggal Hijriah</span>
        </div>
      </div>

      <section aria-live="polite" className="flex flex-col gap-2 rounded-2xl bg-muted p-4">
        <p className="font-serif text-2xl">{format(picked, 'EEEE, d MMMM yyyy', { locale: localeId })}</p>
        <p className="text-sm text-muted-foreground">
          {hijriLabel(picked)} · {Math.max(0, daysUntil(iso(picked)))} hari dari sekarang
        </p>
        <ul className="mt-1 space-y-2">
          {notes.length === 0 && <li className="text-sm text-muted-foreground">Hari kerja biasa. Harga vendor cenderung lebih fleksibel, tapi tamu mungkin perlu cuti.</li>}
          {notes.map((n, i) => (
            <li key={i} className={cn('flex gap-2 rounded-xl p-3 text-sm', n.tone === 'warn' ? 'bg-warning-soft text-warning' : n.tone === 'good' ? 'bg-success-soft text-success' : 'bg-card text-ink')}>
              {n.tone === 'warn' ? <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> : n.tone === 'good' ? <Users className="mt-0.5 size-4 shrink-0" aria-hidden /> : <Info className="mt-0.5 size-4 shrink-0" aria-hidden />}
              {n.text}
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-muted-foreground">Tanggal Hijriah dihitung dengan kalender Umm al-Qura dan bisa berbeda ±1 hari dari penetapan resmi. Hari libur mengikuti perkiraan SKB 3 Menteri.</p>
    </Modal>
  )
}
