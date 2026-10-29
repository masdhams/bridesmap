# Phase 2: Backend Refactor untuk Vercel — Detailed Guide

Migrate dari SQLite (better-sqlite3) ke Supabase + Vercel Functions.

**Timeline:** 2-3 hari kerja
**Complexity:** Medium (database & API refactoring)

---

## Overview: What's Changing

### Current Architecture (Development)
```
React Frontend → Express Server (localhost:3000) → SQLite (local)
```

### Target Architecture (Production)
```
React Frontend (Vercel) → Vercel Functions → Supabase PostgreSQL
```

### What Stays the Same
- ✅ React frontend code (mostly unchanged)
- ✅ Google Calendar integration logic
- ✅ API endpoints (same URLs, but serverless now)

### What Changes
- ❌ `server/app.js` — refactor to Vercel Functions format
- ❌ `server/db.js` — replace with `db-supabase.js`
- ❌ Database queries — SQLite → Supabase SQL
- ❌ Async model — callbacks → async/await

---

## Step 2.1: Update `app.js` to Use Supabase

### Current Pattern (SQLite)
```javascript
// OLD: SQLite synchronous
const getConnection = () => db.prepare('SELECT * FROM calendar_connections WHERE id = 1').get()
const saveConnection = (token, calId) => db.prepare('INSERT...').run(token, calId)
```

### New Pattern (Supabase)
```javascript
// NEW: Supabase async
import { getCalendarConnection, saveCalendarConnection } from './db-supabase.js'

const conn = await getCalendarConnection()
await saveCalendarConnection(tokenEnc, calendarId)
```

### Changes to Make in `app.js`

1. **Replace imports:**
```javascript
// OLD
import { openDb } from './db.js'

// NEW
import { 
  getCalendarConnection, 
  saveCalendarConnection, 
  clearCalendarConnection,
  saveCalendarEvent,
  deleteCalendarEvent,
  getAllCalendarEvents
} from './db-supabase.js'
```

2. **Remove db initialization:**
```javascript
// OLD
const db = openDb()

// NEW (delete this line - db passed differently)
```

3. **Update `createApp` function signature:**
```javascript
// OLD
export function createApp({ config, db, google = realGoogle }) {

// NEW
export function createApp({ config, google = realGoogle }) {
  // db-supabase is imported at top, don't pass as param
```

4. **Update all `getConnection()` calls:**
```javascript
// OLD
const getConnection = () => db.prepare('SELECT * FROM calendar_connections WHERE id = 1').get()
const conn = getConnection()

// NEW
const getConnection = async () => {
  return await getCalendarConnection()
}
const conn = await getConnection()
```

5. **Update all database mutations:**
```javascript
// OLD
db.prepare('DELETE FROM calendar_connections WHERE id = 1').run()
db.prepare('DELETE FROM calendar_events').run()

// NEW
await clearCalendarConnection()
```

### Specific Functions to Refactor

**In `/api/calendar/connect` route:**
- No changes needed (no database access)

**In `/auth/google/callback` route:**
```javascript
// OLD
saveConnection(tokens.refresh_token, calendarId)

// NEW
await saveCalendarConnection(
  encrypt(tokens.refresh_token, config.key),
  calendarId
)
```

**In `/api/calendar/sync` route:**
- Replace all SQLite queries with Supabase function calls
- Make all functions async

---

## Step 2.2: Create Vercel Functions Structure

### Current Structure
```
bridesmap/
├── server/
│   ├── app.js (Express app)
│   ├── index.js (starts server on port 3000)
│   ├── db.js
│   └── ...
└── src/
    └── (React app)
```

### Vercel Functions Structure
```
bridesmap/
├── api/
│   ├── calendar/
│   │   ├── connect.js (GET /api/calendar/connect)
│   │   ├── callback.js (GET /api/calendar/callback)
│   │   ├── status.js (GET /api/calendar/status)
│   │   └── sync.js (POST /api/calendar/sync)
│   └── (other routes here)
├── server/
│   ├── db-supabase.js
│   ├── config.js
│   ├── crypto.js
│   └── (shared utilities)
├── src/
│   └── (React app)
└── vercel.json
```

### Converting Express Routes to Vercel Functions

**Example: `/api/calendar/status`**

OLD (Express in `server/app.js`):
```javascript
app.get('/api/calendar/status', (_req, res) => {
  const conn = getConnection()
  res.json(conn ? { connected: true, calendarName: CALENDAR_NAME } : { connected: false })
})
```

NEW (`api/calendar/status.js` for Vercel):
```javascript
import { getCalendarConnection } from '../server/db-supabase.js'

const CALENDAR_NAME = 'Bridesmap'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })

  try {
    const conn = await getCalendarConnection()
    res.json(conn 
      ? { connected: true, calendarName: CALENDAR_NAME, connectedAt: conn.connected_at } 
      : { connected: false }
    )
  } catch (error) {
    console.error('[status]', error)
    res.status(500).json({ error: 'server_error' })
  }
}
```

---

## Step 2.3: Update Config & Environment

### Update `server/config.js`

```javascript
// OLD
export const SERVER_DIR = new URL('.', import.meta.url).pathname

// NEW - same, but also add
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL
export const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
```

### Verify `.env.local` has all needed vars
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ENCRYPTION_KEY=...
NODE_ENV=development
```

---

## Step 2.4: Update `server/index.js`

### Current (Express server on port 3000)
```javascript
import { createApp } from './app.js'
import { openDb } from './db.js'

const db = openDb()
const app = createApp({ config, db })
app.listen(PORT, () => console.log(`Server on :${PORT}`))
```

### New (for Vercel — won't use this in production)
```javascript
// For local development only
import { createApp } from './app.js'

const app = createApp({ config })
app.listen(PORT, () => console.log(`Server on :${PORT}`))
```

**Note:** In production (Vercel), each `api/*.js` is its own function. `index.js` only needed for local dev.

---

## Step 2.5: Create `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_key",
    "GOOGLE_CLIENT_ID": "@google_client_id",
    "GOOGLE_CLIENT_SECRET": "@google_client_secret",
    "ENCRYPTION_KEY": "@encryption_key"
  }
}
```

---

## Recommended Refactoring Order

1. ✅ Create `db-supabase.js` (done)
2. Create Vercel Functions directory structure (`api/calendar/*.js`)
3. Refactor simplest endpoint first: `/api/calendar/status`
4. Test locally: `npm run dev` should still work
5. Refactor complex endpoints: `/auth/google/callback`, `/api/calendar/sync`
6. Test all endpoints locally
7. Create `vercel.json`
8. Commit & prepare for Phase 3 (Vercel deployment)

---

## Testing Locally During Phase 2

Untuk test Vercel Functions locally, gunakan:

```bash
npm install -g vercel
vercel dev
```

Ini akan simulate Vercel environment locally.

---

## Common Pitfalls

| Issue | Solution |
|---|---|
| SQLite methods still called | Replace all `.prepare().run()` dengan Supabase async calls |
| Missing `await` on Supabase queries | All Supabase calls return promises — must `await` |
| `db` passed as parameter | Supabase imported at top — no parameter passing |
| `db.transaction()` not available | Supabase doesn't have transactions in free tier — will handle in Phase 2 refactoring |
| CORS errors on Vercel | Configure headers in vercel.json |

---

## Next Steps After Phase 2

- Phase 3: Deploy to Vercel
- Phase 4: Finalize Google Calendar on production
- Phase 5: MVP testing

---

**Questions?** Refer back to this doc or let me know blockers!
