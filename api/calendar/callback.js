import { google as googleapis } from 'googleapis'
import { loadConfig } from '../../server/config.js'
import { encrypt } from '../../server/crypto.js'
import { saveCalendarConnection } from '../../server/db-supabase.js'
import { verifyState } from '../../server/oauth-state.js'

const CALENDAR_NAME = 'Bridesmap'
const AFTER_AUTH = '/app/pengaturan'

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

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  try {
    const config = loadConfig()
    const { code, state, error } = req.query

    if (error) return res.redirect(`${frontendUrl}${AFTER_AUTH}?kalender=ditolak`)

    const userId = verifyState(state, config.key)
    if (typeof code !== 'string' || !userId) return res.redirect(`${frontendUrl}${AFTER_AUTH}?kalender=gagal`)

    const oauth2Client = new googleapis.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri)
    const { tokens } = await oauth2Client.getToken(code)
    if (!tokens.refresh_token) return res.redirect(`${frontendUrl}${AFTER_AUTH}?kalender=gagal`)

    oauth2Client.setCredentials(tokens)
    const calendarId = await createCalendar(googleapis.calendar({ version: 'v3', auth: oauth2Client }))

    await saveCalendarConnection(userId, encrypt(tokens.refresh_token, config.key), calendarId)

    res.redirect(`${frontendUrl}${AFTER_AUTH}?kalender=terhubung`)
  } catch (error) {
    console.error('[callback]', error)
    res.redirect(`${frontendUrl}${AFTER_AUTH}?kalender=gagal`)
  }
}
