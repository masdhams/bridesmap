// PRD #37: pengingat lewat Google Calendar (satu arah) + file .ics untuk Apple Calendar.
// Yang dikirim hanya judul & tanggal — tanpa nominal budget.
import { addDays, format, parseISO } from 'date-fns'

export interface CalEvent {
  uid: string
  title: string
  date: string // yyyy-MM-dd, event sepanjang hari
  description?: string
  /** Pengingat N hari sebelumnya (default: sore hari sebelumnya). */
  alarmDays?: number
}

const ymd = (iso: string) => iso.replaceAll('-', '')
const nextDay = (iso: string) => format(addDays(parseISO(iso), 1), 'yyyyMMdd')

export function googleCalendarUrl(e: CalEvent) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${ymd(e.date)}/${nextDay(e.date)}`,
    details: e.description ?? 'Pengingat dari Bridesmap Wedding Planner',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/** RFC 5545: baris dipotong maksimal 75 byte, sambungannya diawali spasi. */
function fold(line: string) {
  const enc = new TextEncoder()
  const out: string[] = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const b = enc.encode(ch).length
    const max = out.length ? 74 : 75
    if (bytes + b > max) {
      out.push(cur)
      cur = ''
      bytes = 0
    }
    cur += ch
    bytes += b
  }
  out.push(cur)
  return out.map((l, i) => (i ? ' ' + l : l)).join('\r\n')
}

/** Pemicu pengingat jam 09.00 sebelum tanggal acara (acara sepanjang hari mulai 00.00). */
function trigger(days: number) {
  if (days <= 0) return 'TRIGGER:PT9H'
  const d = days - 1
  return `TRIGGER:-P${d ? `${d}D` : ''}T15H`
}

/** File .ics yang bisa diimpor ke Google Calendar (Pengaturan → Impor & ekspor) dan Apple Calendar. */
export function buildIcs(events: CalEvent[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bridesmap//Wedding Planner//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Bridesmap',
  ]
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@bridesmap`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${nextDay(e.date)}`,
      `SUMMARY:${esc(e.title)}`,
      `DESCRIPTION:${esc(e.description ?? 'Pengingat dari Bridesmap')}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      trigger(e.alarmDays ?? 1),
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(e.title)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** Mengunduh file .ics ke perangkat. */
export function downloadIcs(filename: string, events: CalEvent[]) {
  const blob = new Blob([buildIcs(events)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
