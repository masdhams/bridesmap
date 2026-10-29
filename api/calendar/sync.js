import crypto from 'node:crypto'
import { google as googleapis } from 'googleapis'
import { loadConfig } from '../../server/config.js'
import { decrypt } from '../../server/crypto.js'
import {
  getCalendarConnection,
  saveCalendarConnection,
  getAllCalendarEvents,
  saveCalendarEvent,
  deleteCalendarEvent,
  updateCalendarId,
} from '../../server/db-supabase.js'

const MAX_TASKS = 500

const validDate = (s) =>
  typeof s === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s

const nextDay = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

const reminderMinutes = (daysBefore) => Math.min(40320, Math.max(0, daysBefore * 1440 - 9 * 60))

const hashOf = (t) =>
  crypto.createHash('sha256').update(JSON.stringify([t.title, t.dueDate, t.reminderDaysBefore])).digest('hex')

function buildEvent(t) {
  return {
    summary: t.title,
    description: 'Pengingat dari Bridesmap',
    start: { date: t.dueDate },
    end: { date: nextDay(t.dueDate) },
    transparency: 'transparent',
    reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: reminderMinutes(t.reminderDaysBefore) }] },
    extendedProperties: { private: { brideBehaviorTaskId: t.id } },
  }
}

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const config = loadConfig()
    const parsed = parseTasks(req.body)
    if (parsed.error) return res.status(400).json({ error: 'invalid_request', detail: parsed.error })

    let conn = await getCalendarConnection()
    if (!conn) return res.status(409).json({ error: 'not_connected' })

    const oauth2Client = new googleapis.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri)
    oauth2Client.setCredentials({ refresh_token: decrypt(conn.refresh_token_enc, config.key) })
    const cal = googleapis.calendar({ version: 'v3', auth: oauth2Client })

    // Check if calendar still exists, recreate if deleted
    try {
      await cal.calendars.get({ calendarId: conn.calendar_id })
    } catch (e) {
      if ([404, 410].includes(e?.response?.status)) {
        const { data } = await cal.calendars.insert({
          requestBody: {
            summary: 'Bridesmap',
            description: 'Pengingat tugas pernikahan dari Bridesmap',
            timeZone: 'Asia/Jakarta',
          },
        })
        const newCalendarId = data.id
        await updateCalendarId(newCalendarId)
        conn = { ...conn, calendar_id: newCalendarId }
      } else {
        throw e
      }
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

    // Sync each task
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
            if ([404, 410].includes(e?.response?.status)) {
              await insertEvent(t, hash)
            } else {
              throw e
            }
          }
        }
      } catch (e) {
        console.error(`[sync task ${t.id}]`, e)
        result.failed.push({ id: t.id, status: e?.response?.status || null })
      }
    }

    // Delete tasks that no longer exist
    const keep = new Set(parsed.tasks.map((t) => t.id))
    for (const m of mapping.values()) {
      if (keep.has(m.task_id)) continue
      try {
        await cal.events.delete({ calendarId, eventId: m.event_id })
        await deleteCalendarEvent(m.task_id)
        result.deleted++
      } catch (e) {
        if (![404, 410].includes(e?.response?.status)) {
          console.error(`[delete task ${m.task_id}]`, e)
          result.failed.push({ id: m.task_id, status: e?.response?.status || null })
        }
      }
    }

    res.json(result)
  } catch (error) {
    console.error('[sync]', error)
    res.status(502).json({ error: 'google_error' })
  }
}
