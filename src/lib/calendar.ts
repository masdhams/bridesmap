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

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

export function buildIcs(events: CalEvent[]) {
  const stamp = format(new Date(), "yyyyMMdd'T'HHmmss")
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bridesmap//Wedding Planner//ID', 'CALSCALE:GREGORIAN']
  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@bridecanvas`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${nextDay(e.date)}`,
      `SUMMARY:${esc(e.title)}`,
      `DESCRIPTION:${esc(e.description ?? 'Pengingat dari Bridesmap')}`,
      'BEGIN:VALARM',
      e.alarmDays ? `TRIGGER:-P${e.alarmDays}D` : 'TRIGGER:-PT9H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(e.title)}`,
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
