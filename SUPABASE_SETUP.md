# Supabase Setup Guide — Bride Canvas MVP

Step-by-step untuk setup Supabase PostgreSQL dan migrasi dari SQLite.

## Phase 1.2: Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up with email atau GitHub
3. Click **"New Project"**
   - Project name: `bride-canvas-mvp`
   - Password: Strong password (generate one)
   - Region: **Singapore** (closest to Indonesia, lowest latency)
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### Step 2: Get API Credentials

1. Open your project dashboard
2. Go to **Settings > API**
3. Copy these values to clipboard:
   - **Project URL** (under "API"): `https://xxxxx.supabase.co`
   - **Anon public key** (under "Project API keys"): starts with `eyJhb...`

### Step 3: Create `.env.local` file

In your project root (`bridesmap/`), create `.env.local`:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...xxxxx
```

**Important:** `.env.local` is in `.gitignore` — it won't be committed. This is correct for secrets.

### Step 4: Run Database Migration

1. Open Supabase dashboard
2. Go to **SQL Editor** (sidebar)
3. Click **"New Query"**
4. Open `server/supabase-migration.sql` (from this project)
5. Copy all SQL and paste into Supabase SQL Editor
6. Click **"Run"** (play button)
7. Wait for all tables to be created (should show green checkmark)

**Check:** Go to **Database > Tables** on sidebar → you should see:
- `auth_users`
- `budget_categories`
- `budget_expenses`
- `vendors`
- `checklist_tasks`
- `guests`
- `calendar_connections` (migrated from SQLite)
- `calendar_events` (migrated from SQLite)
- ... and more

### Step 5: Setup Supabase Auth

1. Go to **Authentication > Providers**
2. **Email** tab → Click **"Enable Email Provider"**
3. Stay on defaults (password authentication enabled)
4. Go to **Authentication > URL Configuration**
5. Under "Redirect URLs", add:
   - `http://localhost:3000/auth/callback` (development)
   - `https://bridescanvas.id/auth/callback` (production — add later after domain)

### Step 6: Create Storage Bucket (for uploads)

1. Go to **Storage** (sidebar)
2. Click **"New bucket"**
3. Bucket name: `wedding-uploads`
4. Check **"Public bucket"** (for public invitation templates)
5. Click **"Create bucket"**

### Step 7: Test Connection (Local Dev)

```bash
cd bridesmap
npm install  # if not done yet
npm run dev
```

Open http://localhost:5173 in browser.
If no red errors → Supabase connection works!

---

## Phase 1.3: Database Migration (SQLite → Supabase)

### Export Current Data from SQLite

Your current SQLite file: `server/bride-behavior.sqlite`

**Option A: Using SQLite CLI (if installed)**
```bash
sqlite3 server/bride-behavior.sqlite ".dump calendar_connections" > server/backup-calendar.sql
sqlite3 server/bride-behavior.sqlite ".dump calendar_events" > server/backup-events.sql
```

**Option B: Export from Supabase UI**
1. After creating tables in Supabase, data will be empty
2. For MVP, you can start fresh (no users yet)
3. Calendar connections table created but empty is fine

### Migrate Data (If You Have Existing Data)

If you have data in `bride-behavior.sqlite`:

1. Export to CSV/JSON
2. Import to Supabase via **Data > Tables > Import data**

For MVP: **Skip this** — your app is not live yet. Start with fresh Supabase database.

---

## Next Steps

✅ **Phase 1 Complete!**
- Git repository initialized
- Supabase project created
- Database schema migrated
- `.env.local` configured

👉 **Next: Phase 2 (Backend refactor for Vercel Functions)**
- See deployment plan in `BRIDE_CANVAS_DEPLOYMENT_PLAN.md`
