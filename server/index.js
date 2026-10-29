// Titik masuk server. Hanya berjalan kalau server/.env sudah diisi lengkap.
import { createApp } from './app.js'
import { ConfigError, loadConfig, PORT } from './config.js'
import { openDb } from './db.js'

let config
try {
  config = loadConfig()
} catch (e) {
  if (!(e instanceof ConfigError)) throw e
  console.error(`\n[server] ${e.message}\n[server] Server belum dijalankan. Salin server/.env.example ke server/.env, isi nilainya, lalu jalankan ulang.\n`)
  process.exit(1)
}

// Kalau server berhenti, katakan alasannya (jangan diam-diam kembali ke prompt).
process.on('exit', (code) => console.error(`[server] Berhenti (kode ${code}).`))
process.on('uncaughtException', (e) => {
  console.error(`[server] Galat tak tertangani: ${e?.name ?? 'Error'}: ${e?.message ?? e}`)
  process.exit(1)
})

const db = openDb()
const server = createApp({ config, db }).listen(PORT, '127.0.0.1', () => {
  console.log(`[server] Bridesmap berjalan di http://localhost:${PORT}`)
})
server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `[server] Port ${PORT} sudah dipakai program lain. Tutup program itu lalu coba lagi.` : `[server] Gagal mendengarkan di port ${PORT}: ${e.code ?? e.message}`)
  process.exit(1)
})
server.on('close', () => console.error('[server] Koneksi server ditutup.'))
