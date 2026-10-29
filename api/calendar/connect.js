import crypto from 'node:crypto'
import { google as googleapis } from 'googleapis'
import { loadConfig } from '../../server/config.js'

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created'
const STATE_TTL_MS = 10 * 60 * 1000

// OAuth state management (in-memory untuk dev, perlu Redis/DB untuk production)
const pendingStates = new Map()

const issueState = () => {
  const now = Date.now()
  // Cleanup expired states
  for (const [s, exp] of pendingStates) if (exp < now) pendingStates.delete(s)
  const state = crypto.randomBytes(24).toString('hex')
  pendingStates.set(state, now + STATE_TTL_MS)
  return state
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const config = loadConfig()
    const oauth2Client = new googleapis.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    )

    const state = issueState()
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [CALENDAR_SCOPE],
      state,
    })

    res.redirect(url)
  } catch (error) {
    console.error('[connect]', error)
    res.status(500).json({ error: 'oauth_error' })
  }
}
