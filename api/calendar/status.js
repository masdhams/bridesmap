import { getCalendarConnection, userIdFromRequest } from '../../server/db-supabase.js'

const CALENDAR_NAME = 'Bridesmap'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const userId = await userIdFromRequest(req)
    if (!userId) return res.status(401).json({ error: 'unauthorized' })

    const conn = await getCalendarConnection(userId)
    res.json(
      conn
        ? {
            connected: true,
            calendarName: CALENDAR_NAME,
            connectedAt: conn.connected_at,
          }
        : { connected: false }
    )
  } catch (error) {
    console.error('[status]', error)
    res.status(500).json({ error: 'server_error' })
  }
}
