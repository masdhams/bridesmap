import { google as googleapis } from 'googleapis'
import { loadConfig } from '../../server/config.js'
import { encrypt } from '../../server/crypto.js'
import { saveCalendarConnection } from '../../server/db-supabase.js'

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created'
const CALENDAR_NAME = 'Bridesmap'

// TODO: Use Redis or Supabase for production state management
const pendingStates = new Map()

const consumeState = (state) => {
  const exp = pendingStates.get(state)
  pendingStates.delete(state)
  return typeof exp === 'number' && exp >= Date.now()
}

const createCalendar = async (cal) => {
  const { data } = await cal.calendars.insert({
    requestBody: {
      summary: CALENDAR_NAME,
      description: 'Pengingat tugas pernikahan dari Bridesmap',
      timeZone: 'Asia/Jakarta',
    },
  })
  return data.id
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const config = loadConfig()
    const { code, state, error } = req.query
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const afterAuthPath = '/app/dashboard'

    // Handle user denied
    if (error) {
      return res.redirect(`${frontendUrl}${afterAuthPath}?kalender=ditolak`)
    }

    // Validate state
    if (typeof code !== 'string' || typeof state !== 'string' || !consumeState(state)) {
      return res.redirect(`${frontendUrl}${afterAuthPath}?kalender=gagal`)
    }

    // Exchange code for tokens
    const oauth2Client = new googleapis.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    )
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      return res.redirect(`${frontendUrl}${afterAuthPath}?kalender=gagal`)
    }

    // Create calendar
    oauth2Client.setCredentials(tokens)
    const calendarId = await createCalendar(googleapis.calendar({ version: 'v3', auth: oauth2Client }))

    // Save to Supabase
    await saveCalendarConnection(encrypt(tokens.refresh_token, config.key), calendarId)

    res.redirect(`${frontendUrl}${afterAuthPath}?kalender=terhubung`)
  } catch (error) {
    console.error('[callback]', error)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/app/dashboard?kalender=gagal`)
  }
}
