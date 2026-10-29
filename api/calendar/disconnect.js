import { clearCalendarConnection, userIdFromRequest } from '../../server/db-supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const userId = await userIdFromRequest(req)
    if (!userId) return res.status(401).json({ error: 'unauthorized' })

    await clearCalendarConnection(userId)
    res.json({ connected: false })
  } catch (error) {
    console.error('[disconnect]', error)
    res.status(500).json({ error: 'server_error' })
  }
}
