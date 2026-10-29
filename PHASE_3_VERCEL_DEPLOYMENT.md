# Phase 3: Vercel Functions Deployment Structure

Ubah dari Express server menjadi Vercel serverless functions.

**Timeline:** 1-2 hari
**Complexity:** Medium-High

---

## Phase 3 Steps

### Step 3.1: Create API Folder Structure

```
bridesmap/
├── api/
│   ├── calendar/
│   │   ├── connect.js (GET /api/calendar/connect)
│   │   ├── callback.js (GET /api/calendar/callback)
│   │   ├── status.js (GET /api/calendar/status)
│   │   ├── sync.js (POST /api/calendar/sync)
│   │   └── disconnect.js (DELETE /api/calendar/disconnect)
│   └── health.js (GET /api/health - untuk testing)
├── server/
│   ├── db-supabase.js
│   ├── config.js
│   ├── crypto.js
│   ├── app.js (untuk local dev - deprecated)
│   └── index.js (untuk local dev - deprecated)
├── src/
│   └── (React frontend)
├── vercel.json
└── package.json
```

### Step 3.2: Convert Express Routes to Vercel Functions

**Pattern untuk Vercel Function:**

```javascript
// OLD (Express in app.js)
app.get('/api/calendar/status', async (req, res) => {
  // handler code
  res.json({ result })
})

// NEW (Vercel Function in api/calendar/status.js)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  
  try {
    // handler code
    res.json({ result })
  } catch (error) {
    console.error('[status]', error)
    res.status(500).json({ error: 'server_error' })
  }
}
```

**Key differences:**
- No Express app - just a handler function
- Must check `req.method` manually
- Must handle all errors explicitly
- Each file = one endpoint

### Step 3.3: Create First Vercel Function

Mari buat yang paling mudah dulu - `/api/health` untuk testing:

**File:** `api/health.js`
```javascript
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
}
```

Test di browser: `http://localhost:3000/api/health`

### Step 3.4: Create vercel.json Config

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_key",
    "GOOGLE_CLIENT_ID": "@google_client_id",
    "GOOGLE_CLIENT_SECRET": "@google_client_secret",
    "ENCRYPTION_KEY": "@encryption_key"
  }
}
```

### Step 3.5: Test Locally with Vercel CLI

```bash
npm install -g vercel
vercel dev
```

Ini akan start server di port yang berbeda (biasanya 3000) dan simulate Vercel environment.

---

## Remaining Endpoints to Convert

Dari `server/app.js`, convert ini ke Vercel Functions:

1. ✅ `/api/health` - already done above
2. ❌ `/api/calendar/connect` - redirect to Google OAuth
3. ❌ `/api/calendar/callback` - handle Google OAuth callback
4. ❌ `/api/calendar/status` - check if calendar connected
5. ❌ `/api/calendar/sync` - sync tasks to Google Calendar
6. ❌ `/api/calendar/disconnect` - remove calendar connection

---

## Converting `/api/calendar/status.js`

Ini contoh untuk Vercel Function dari Express route:

```javascript
// api/calendar/status.js
import { getCalendarConnection } from '../server/db-supabase.js'

const CALENDAR_NAME = 'Bridesmap'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const conn = await getCalendarConnection()
    res.json(
      conn
        ? {
            connected: true,
            calendarName: CALENDAR_NAME,
            connectedAt: conn.connected_at,
          }
        : { connected: false }
    )
  } catch (error) {
    console.error('[status]', error)
    res.status(500).json({ error: 'server_error' })
  }
}
```

---

## Testing During Phase 3

**Local testing with Vercel CLI:**

```bash
vercel dev
```

Test endpoints:
- GET `http://localhost:3000/api/health` → should return { status: 'ok' }
- GET `http://localhost:3000/api/calendar/status` → should return { connected: false } or { connected: true }

**After deployment to Vercel:**

Test with production URL:
- GET `https://bride-canvas.vercel.app/api/health`
- GET `https://bride-canvas.vercel.app/api/calendar/status`

---

## Next After Phase 3

- Phase 4: Deploy to Vercel + test production
- Phase 5: Finalize Google Calendar on production
- Phase 6: MVP testing with real users

---

**Current status:**
- Phase 1: ✅ DONE
- Phase 2: ✅ DONE
- Phase 3: IN PROGRESS (struktur Vercel Functions)
- Phase 4-6: TBD
