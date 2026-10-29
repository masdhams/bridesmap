// Konfigurasi server. Semua nilai rahasia hanya dibaca dari server/.env saat runtime; tidak pernah ditulis di kode atau log.
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(SERVER_DIR, '.env'), quiet: true })

export const PORT = 3000
export const FRONTEND_URL = 'http://localhost:5173'
/** Halaman tujuan setelah Google selesai (masih di origin frontend di atas). */
export const AFTER_AUTH_PATH = '/app/pengaturan'
export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created'

const REQUIRED = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'TOKEN_ENCRYPTION_KEY']

export class ConfigError extends Error {}

/** Kunci enkripsi harus 32 byte: 64 karakter hex atau base64 dari 32 byte. */
function parseKey(raw) {
  const v = raw.trim()
  const key = /^[0-9a-fA-F]{64}$/.test(v) ? Buffer.from(v, 'hex') : Buffer.from(v, 'base64')
  if (key.length !== 32) throw new ConfigError('TOKEN_ENCRYPTION_KEY harus 32 byte (64 karakter hex, atau base64 dari 32 byte). Lihat server/README.md.')
  return key
}

/** Membaca dan memeriksa konfigurasi. Hanya NAMA variabel yang kosong yang disebut di pesan galat, tidak pernah nilainya. */
export function loadConfig() {
  const missing = REQUIRED.filter((k) => !process.env[k]?.trim())
  if (missing.length) throw new ConfigError(`server/.env belum lengkap. Isi: ${missing.join(', ')} (contoh: server/.env.example).`)
  return Object.freeze({
    clientId: process.env.GOOGLE_CLIENT_ID.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
    redirectUri: process.env.GOOGLE_REDIRECT_URI.trim(),
    key: parseKey(process.env.TOKEN_ENCRYPTION_KEY),
  })
}
