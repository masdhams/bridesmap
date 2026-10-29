// Supabase client & database utilities
// Replaces better-sqlite3 with @supabase/supabase-js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Calendar connection operations (for Google Calendar sync)
export async function getCalendarConnection() {
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('*')
    .eq('id', 1)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data || null
}

export async function saveCalendarConnection(refreshTokenEnc, calendarId) {
  // Delete old events when saving new connection
  await supabase
    .from('calendar_events')
    .delete()
    .neq('task_id', '') // Delete all

  const { error } = await supabase
    .from('calendar_connections')
    .upsert({
      id: 1,
      refresh_token_enc: refreshTokenEnc,
      calendar_id: calendarId,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

  if (error) throw error
}

export async function clearCalendarConnection() {
  // Delete all calendar data
  await supabase.from('calendar_events').delete().neq('task_id', '')
  const { error } = await supabase
    .from('calendar_connections')
    .delete()
    .eq('id', 1)

  if (error) throw error
}

// Calendar events operations
export async function getCalendarEvent(taskId) {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('task_id', taskId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function saveCalendarEvent(taskId, eventId, calendarId, payloadHash) {
  const { error } = await supabase
    .from('calendar_events')
    .upsert({
      task_id: taskId,
      event_id: eventId,
      calendar_id: calendarId,
      payload_hash: payloadHash,
      synced_at: new Date().toISOString(),
    }, { onConflict: 'task_id' })

  if (error) throw error
}

export async function deleteCalendarEvent(taskId) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('task_id', taskId)

  if (error) throw error
}

// Helper: get all synced calendar events
export async function getAllCalendarEvents() {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')

  if (error) throw error
  return data || []
}

// Update calendar_id in calendar_connections
export async function updateCalendarId(calendarId) {
  const { error } = await supabase
    .from('calendar_connections')
    .update({ calendar_id: calendarId, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) throw error
}
