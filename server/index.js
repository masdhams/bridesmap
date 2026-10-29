// Titik masuk server. Hanya berjalan kalau environment variables sudah diisi lengkap.
import { createApp } from './app.js'
import { ConfigError, loadConfig, PORT } from './config.js'

let config
try {
  config = loadConfig()
} catch (e) {
  if (!(e instanceof ConfigError)) throw e
  console.error(`\n[server] ${e.message}\n[server] Verifikasi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local\n`)
  process.exit(1)
}

// Kalau server berhenti, katakan alasannya (jangan diam-diam kembali ke prompt).
process.on('exit', (code) => console.error(`[server] Berhenti (kode ${code}).`))
process.on('uncaughtException', (e) => {
  console.error(`[server] Galat tak tertangani: ${e?.name ?? 'Error'}: ${e?.message ?? e}`)
  process.exit(1)
})

const server = createApp({ config }).listen(PORT, '127.0.0.1', () => {
  console.log(`[server] Bridesmap berjalan di http://localhost:${PORT}`)
})
server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `[server] Port ${PORT} sudah dipakai program lain. Tutup program itu lalu coba lagi.` : `[server] Gagal mendengarkan di port ${PORT}: ${e.code ?? e.message}`)
  process.exit(1)
})
server.on('close', () => console.error('[server] Koneksi server ditutup.'))
