import { createClient } from '@supabase/supabase-js'

let client

function admin() {
  if (!client) {
    const url = process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('VITE_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi')
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  }
  return client
}

/** Mengembalikan id akun dari token Supabase di header Authorization, atau null kalau tidak valid. */
export async function userIdFromRequest(req) {
  const token = req.headers.authorization?.replace(/^Bearer /, '')
  if (!token) return null
  const { data, error } = await admin().auth.getUser(token)
  return error ? null : data.user.id
}

export async function getCalendarConnection(userId) {
  const { data, error } = await admin().from('calendar_connections').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function saveCalendarConnection(userId, refreshTokenEnc, calendarId) {
  await admin().from('calendar_events').delete().eq('user_id', userId)
  const now = new Date().toISOString()
  const { error } = await admin()
    .from('calendar_connections')
    .upsert({ user_id: userId, refresh_token_enc: refreshTokenEnc, calendar_id: calendarId, connected_at: now, updated_at: now }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function clearCalendarConnection(userId) {
  await admin().from('calendar_events').delete().eq('user_id', userId)
  const { error } = await admin().from('calendar_connections').delete().eq('user_id', userId)
  if (error) throw error
}

export async function saveCalendarEvent(userId, taskId, eventId, calendarId, payloadHash) {
  const { error } = await admin()
    .from('calendar_events')
    .upsert({ user_id: userId, task_id: taskId, event_id: eventId, calendar_id: calendarId, payload_hash: payloadHash, synced_at: new Date().toISOString() }, { onConflict: 'user_id,task_id' })
  if (error) throw error
}

export async function deleteCalendarEvent(userId, taskId) {
  const { error } = await admin().from('calendar_events').delete().eq('user_id', userId).eq('task_id', taskId)
  if (error) throw error
}

export async function getAllCalendarEvents(userId) {
  const { data, error } = await admin().from('calendar_events').select('*').eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function updateCalendarId(userId, calendarId) {
  const { error } = await admin().from('calendar_connections').update({ calendar_id: calendarId, updated_at: new Date().toISOString() }).eq('user_id', userId)
  if (error) throw error
}
