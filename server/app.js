// Aplikasi Express: sambungan Google Calendar untuk Bridesmap.
// Scope hanya `calendar.app.created`: aplikasi membuat satu kalender sendiri bernama "Bridesmap" dan hanya bisa
// mengelola isinya. Kalender pribadi pengguna tidak bisa dibaca. Yang dikirim ke Google hanya judul tugas dan tanggal.
import crypto from 'node:crypto'
import express from 'express'
import { google as googleapis } from 'googleapis'
import { AFTER_AUTH_PATH, CALENDAR_SCOPE, FRONTEND_URL, PORT } from './config.js'
import { decrypt, encrypt } from './crypto.js'
import {
  getCalendarConnection,
  saveCalendarConnection,
  clearCalendarConnection,
  saveCalendarEvent,
  deleteCalendarEvent,
  getAllCalendarEvents,
  updateCalendarId,
} from './db-supabase.js'

const CALENDAR_NAME = 'Bridesmap'
const MAX_TASKS = 500
const STATE_TTL_MS = 10 * 60 * 1000

const realGoogle = {
  oauth: (c) => new googleapis.auth.OAuth2(c.clientId, c.clientSecret, c.redirectUri),
  calendar: (auth) => googleapis.calendar({ version: 'v3', auth }),
}

// ---------- util kecil ----------
const validDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s
const nextDay = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
const httpStatus = (e) => {
  const n = Number(e?.status ?? e?.response?.status ?? e?.code)
  return Number.isInteger(n) ? n : 0
}
const isGone = (e) => [404, 410].includes(httpStatus(e))
const isInvalidGrant = (e) => e?.response?.data?.error === 'invalid_grant' || /invalid_grant/.test(String(e?.message ?? ''))
/** Log tanpa detail permintaan/respons (bisa memuat token): hanya jenis dan status. */
const logError = (where, e) => console.error(`[server] ${where}: ${e?.name ?? 'Error'} (status ${httpStatus(e) || '-'})`)

/** Pengingat popup untuk acara seharian: tampil pukul 09.00, N hari sebelumnya (N = 0 → awal hari-H). */
const reminderMinutes = (daysBefore) => Math.min(40320, Math.max(0, daysBefore * 1440 - 9 * 60))

function buildEvent(t) {
  return {
    summary: t.title,
    description: 'Pengingat dari Bridesmap',
    start: { date: t.dueDate },
    end: { date: nextDay(t.dueDate) },
    transparency: 'transparent', // tidak menandai waktu pengguna sebagai sibuk
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: reminderMinutes(t.reminderDaysBefore) }] },
    extendedProperties: { private: { brideBehaviorTaskId: t.id } },
  }
}

/** Memeriksa daftar tugas dari frontend. Mengembalikan { tasks } atau { error }. */
function parseTasks(body) {
  const list = body?.tasks
  if (!Array.isArray(list)) return { error: 'tasks harus berupa array' }
  if (list.length > MAX_TASKS) return { error: `maksimal ${MAX_TASKS} tugas per sinkronisasi` }
  const byId = new Map()
  for (const [i, t] of list.entries()) {
    const id = typeof t?.id === 'string' ? t.id.trim() : ''
    const title = typeof t?.title === 'string' ? t.title.trim() : ''
    const days = t?.reminderDaysBefore === undefined ? 1 : t.reminderDaysBefore
    if (!id || id.length > 100) return { error: `tugas #${i + 1}: id tidak valid` }
    if (!title || title.length > 300) return { error: `tugas #${i + 1}: title tidak valid` }
    if (!validDate(t.dueDate)) return { error: `tugas #${i + 1}: dueDate harus yyyy-MM-dd` }
    if (!Number.isInteger(days) || days < 0 || days > 28) return { error: `tugas #${i + 1}: reminderDaysBefore harus 0–28` }
    byId.set(id, { id, title, dueDate: t.dueDate, reminderDaysBefore: days })
  }
  return { tasks: [...byId.values()] }
}

const hashOf = (t) => crypto.createHash('sha256').update(JSON.stringify([t.title, t.dueDate, t.reminderDaysBefore])).digest('hex')

export function createApp({ config, google = realGoogle }) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '200kb' }))
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Perlindungan CSRF sederhana: permintaan yang mengubah data hanya boleh datang dari frontend atau server ini.
  const allowedOrigins = new Set([FRONTEND_URL, `http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`])
  app.use('/api', (req, res, next) => {
    if (req.method !== 'GET' && req.headers.origin && !allowedOrigins.has(req.headers.origin)) return res.status(403).json({ error: 'origin_not_allowed' })
    next()
  })

  // ---------- Note: database operations now use Supabase (db-supabase.js) ----------
  // All database calls are async with getCalendarConnection(), saveCalendarConnection(), etc.

  // ---------- state OAuth (anti-CSRF), disimpan di memori ----------
  const pendingStates = new Map()
  const issueState = () => {
    const now = Date.now()
    for (const [s, exp] of pendingStates) if (exp < now) pendingStates.delete(s)
    const state = crypto.randomBytes(24).toString('hex')
    pendingStates.set(state, now + STATE_TTL_MS)
    return state
  }
  const consumeState = (state) => {
    const exp = pendingStates.get(state)
    pendingStates.delete(state)
    return typeof exp === 'number' && exp >= Date.now()
  }

  const createCalendar = async (cal) => {
    const { data } = await cal.calendars.insert({
      requestBody: { summary: CALENDAR_NAME, description: 'Pengingat tugas pernikahan dari Bridesmap', timeZone: 'Asia/Jakarta' },
    })
    return data.id
  }

  /** Klien Calendar dengan refresh token tersimpan (access token diperbarui otomatis oleh googleapis). */
  const calendarFor = (conn) => {
    const auth = google.oauth(config)
    auth.setCredentials({ refresh_token: decrypt(conn.refresh_token_enc, config.key) })
    return google.calendar(auth)
  }

  /** Token ditolak Google atau tidak bisa didekripsi: hapus sambungan dan minta pengguna menghubungkan ulang. */
  const needsReconnect = (e) => isInvalidGrant(e) || e?.message === 'Format token tersimpan tidak dikenali' || e?.code === 'ERR_OSSL_BAD_DECRYPT' || /unable to authenticate data/i.test(String(e?.message))

  const wrap = (fn) => async (req, res) => {
    try {
      await fn(req, res)
    } catch (e) {
      if (needsReconnect(e)) {
        clearConnection()
        return res.status(401).json({ error: 'reconnect_required' })
      }
      logError(`${req.method} ${req.path}`, e)
      res.status(502).json({ error: 'google_error' })
    }
  }

  // ---------- rute ----------
  // 1. Mulai OAuth
  app.get('/api/calendar/connect', (_req, res) => {
    const url = google.oauth(config).generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [CALENDAR_SCOPE],
      state: issueState(),
    })
    res.redirect(url)
  })

  // 2. Callback Google: tukar kode → token, simpan refresh token terenkripsi, buat kalender khusus
  app.get('/auth/google/callback', async (req, res) => {
    const back = (flag) => res.redirect(`${FRONTEND_URL}${AFTER_AUTH_PATH}?kalender=${flag}`)
    const { code, state, error } = req.query
    if (error) return back('ditolak')
    if (typeof code !== 'string' || typeof state !== 'string' || !consumeState(state)) return back('gagal')
    try {
      const auth = google.oauth(config)
      const { tokens } = await auth.getToken(code)
      if (!tokens.refresh_token) return back('gagal')
      auth.setCredentials(tokens)
      const calendarId = await createCalendar(google.calendar(auth))
      await saveCalendarConnection(encrypt(tokens.refresh_token, config.key), calendarId)
      back('terhubung')
    } catch (e) {
      logError('callback', e)
      back('gagal')
    }
  })

  // 3. Status (tidak pernah memuat token)
  app.get('/api/calendar/status', wrap(async (_req, res) => {
    const conn = await getCalendarConnection()
    res.json(conn ? { connected: true, calendarName: CALENDAR_NAME, connectedAt: conn.connected_at } : { connected: false })
  }))

  // 4. Sinkronisasi: insert / patch / delete mengikuti daftar tugas terbaru
  app.post(
    '/api/calendar/sync',
    wrap(async (req, res) => {
      const parsed = parseTasks(req.body)
      if (parsed.error) return res.status(400).json({ error: 'invalid_request', detail: parsed.error })
      let conn = await getCalendarConnection()
      if (!conn) return res.status(409).json({ error: 'not_connected' })
      const cal = calendarFor(conn)

      // Kalender bisa dihapus pengguna dari Google Calendar: buat ulang dan mulai dari pemetaan kosong.
      try {
        await cal.calendars.get({ calendarId: conn.calendar_id })
      } catch (e) {
        if (!isGone(e)) throw e
        const calendarId = await createCalendar(cal)
        await clearCalendarConnection()
        await updateCalendarId(calendarId)
        conn = { ...conn, calendar_id: calendarId }
      }
      const calendarId = conn.calendar_id
      const result = { created: 0, updated: 0, unchanged: 0, deleted: 0, failed: [] }
      const allEvents = await getAllCalendarEvents()
      const mapping = new Map(allEvents.map((r) => [r.task_id, r]))

      const insertEvent = async (t, hash) => {
        const { data } = await cal.events.insert({ calendarId, requestBody: buildEvent(t) })
        await saveCalendarEvent(t.id, data.id, calendarId, hash)
        result.created++
      }

      for (const t of parsed.tasks) {
        const hash = hashOf(t)
        const m = mapping.get(t.id)
        try {
          if (!m) {
            await insertEvent(t, hash)
          } else if (m.payload_hash === hash) {
            result.unchanged++
          } else {
            try {
              await cal.events.patch({ calendarId, eventId: m.event_id, requestBody: buildEvent(t) })
              await saveCalendarEvent(t.id, m.event_id, calendarId, hash)
              result.updated++
            } catch (e) {
              if (!isGone(e)) throw e
              await insertEvent(t, hash) // acara dihapus manual di Google: buat lagi
            }
          }
        } catch (e) {
          if (needsReconnect(e)) throw e
          logError(`sync task ${t.id}`, e)
          result.failed.push({ id: t.id, status: httpStatus(e) || null })
        }
      }

      // Tugas yang sudah tidak ada di daftar: hapus acaranya.
      const keep = new Set(parsed.tasks.map((t) => t.id))
      for (const m of mapping.values()) {
        if (keep.has(m.task_id)) continue
        try {
          await cal.events.delete({ calendarId, eventId: m.event_id })
        } catch (e) {
          if (!isGone(e)) {
            if (needsReconnect(e)) throw e
            logError(`delete task ${m.task_id}`, e)
            result.failed.push({ id: m.task_id, status: httpStatus(e) || null })
            continue
          }
        }
        await deleteCalendarEvent(m.task_id)
        result.deleted++
      }

      res.json(result)
    }),
  )

  // 5. Putuskan: hapus refresh token (dan pemetaan) dari database
  app.delete('/api/calendar/disconnect', wrap(async (_req, res) => {
    await clearCalendarConnection()
    res.json({ connected: false })
  }))

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }))
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    logError('request', err)
    res.status(err?.type === 'entity.parse.failed' ? 400 : 500).json({ error: err?.type === 'entity.parse.failed' ? 'invalid_json' : 'server_error' })
  })

  return app
}
