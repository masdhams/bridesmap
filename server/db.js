// SQLite lokal (server/bridesmap.sqlite, sudah di .gitignore).
// Aplikasi belum punya login, jadi hanya ada satu sambungan kalender (baris id = 1).
import Database from 'better-sqlite3'
import path from 'node:path'
import { SERVER_DIR } from './config.js'

export function openDb(file = path.join(SERVER_DIR, 'bridesmap.sqlite')) {
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_connections (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      refresh_token_enc TEXT NOT NULL,
      calendar_id TEXT NOT NULL,
      connected_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS calendar_events (
      task_id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      calendar_id TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      synced_at TEXT NOT NULL
    );
  `)
  return db
}
