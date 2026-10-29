// Status langkah "Mulai cepat" di halaman Panduan, diturunkan dari data yang sudah ada di store (tanpa state tersimpan baru).
// Pengecualian: sambungan Google Calendar ada di server, jadi statusnya ditanyakan ke /api/calendar/status.
import { useEffect, useState } from 'react'
import { GUIDE_STEPS, type GuideStep } from '../data/guide'
import { calendarStatus } from '../lib/calendarApi'
import { usePlan } from '../lib/store'

export function useStartSteps() {
  const { profile, events, vendors, guests } = usePlan()
  const [calendar, setCalendar] = useState(false)

  useEffect(() => {
    let alive = true
    // Server mati atau belum dikonfigurasi = belum terhubung.
    calendarStatus()
      .then((s) => alive && setCalendar(s.connected))
      .catch(() => alive && setCalendar(false))
    return () => {
      alive = false
    }
  }, [])

  const done: Record<GuideStep['id'], boolean> = {
    'tanggal-budget': !!profile.weddingDate && profile.totalBudget > 0,
    alokasi: events.some((e) => e.budget > 0),
    vendor: vendors.length > 0,
    pasangan: profile.partnerInvited,
    tamu: guests.length > 0,
    kalender: calendar,
  }
  return GUIDE_STEPS.map((s) => ({ ...s, done: done[s.id] }))
}
