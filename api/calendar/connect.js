import { google as googleapis } from 'googleapis'
import { loadConfig } from '../../server/config.js'
import { userIdFromRequest } from '../../server/db-supabase.js'
import { signState } from '../../server/oauth-state.js'

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const userId = await userIdFromRequest(req)
    if (!userId) return res.status(401).json({ error: 'unauthorized' })

    const config = loadConfig()
    const oauth2Client = new googleapis.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri)
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [CALENDAR_SCOPE],
      state: signState(userId, config.key),
    })

    res.json({ url })
  } catch (error) {
    console.error('[connect]', error)
    res.status(500).json({ error: 'oauth_error' })
  }
}
