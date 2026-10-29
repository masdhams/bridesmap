-- Bride Canvas MVP: PostgreSQL schema migration from SQLite
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[your-project]/sql

-- 1. Authentication & User Management
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Google Calendar Integration (migrated from SQLite)
CREATE TABLE IF NOT EXISTS calendar_connections (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  refresh_token_enc TEXT NOT NULL,
  calendar_id TEXT NOT NULL UNIQUE,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  task_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Budget & Financial Data
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  budget_amount DECIMAL(15, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS budget_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS savings_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) DEFAULT 0,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Vendors & Contacts
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  quoted_price DECIMAL(15, 2),
  status TEXT DEFAULT 'inquiry',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  payment_type TEXT, -- 'dp' (down payment), 'pelunasan' (settlement), 'lainnya'
  due_date DATE,
  paid_date DATE,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Checklist & Tasks
CREATE TABLE IF NOT EXISTS checklist_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  category TEXT, -- 'persiapan', 'h-minggu', 'h-hari', 'hari-h', 'pasca-acara'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'done'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  assigned_to TEXT, -- 'pengantin1', 'pengantin2', 'keluarga'
  reminder_days_before INTEGER DEFAULT 1,
  synced_to_calendar BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Guest Management
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  group_name TEXT, -- 'keluarga', 'teman', 'kantor', etc.
  dietary_restriction TEXT,
  rsvp_status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'declined'
  number_of_guests INTEGER DEFAULT 1,
  plus_one_name TEXT,
  plus_one_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rsvp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  response TEXT NOT NULL, -- 'confirmed', 'declined'
  response_date TIMESTAMPTZ DEFAULT now(),
  message TEXT
);

-- 7. Seserahan & Gifts
CREATE TABLE IF NOT EXISTS seserahan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  pihak TEXT NOT NULL, -- 'pihak1', 'pihak2'
  item_name TEXT NOT NULL,
  quantity INTEGER,
  status TEXT DEFAULT 'pending', -- 'pending', 'ready', 'delivered'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Rundown & Timeline
CREATE TABLE IF NOT EXISTS rundown_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'akad', 'resepsi'
  time TEXT NOT NULL, -- HH:MM format
  activity TEXT NOT NULL,
  description TEXT,
  who_involved TEXT, -- comma-separated list
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  invitation_key TEXT UNIQUE NOT NULL,
  template_type TEXT NOT NULL, -- 'sage', 'noir', 'kliping'
  bride_name TEXT NOT NULL,
  groom_name TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  wedding_time TIME,
  location TEXT,
  custom_config JSONB, -- store template customization
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Deep Talk / Couple Notes
CREATE TABLE IF NOT EXISTS deep_talk_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  entry_text TEXT NOT NULL,
  written_by TEXT, -- 'pengantin1', 'pengantin2'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budget_categories_user_id ON budget_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_user_id ON budget_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_expenses_category_id ON budget_expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_user_id ON checklist_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_tasks_due_date ON checklist_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_guests_user_id ON guests(user_id);
CREATE INDEX IF NOT EXISTS idx_seserahan_user_id ON seserahan_items(user_id);
CREATE INDEX IF NOT EXISTS idx_rundown_user_id ON rundown_events(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_deep_talk_user_id ON deep_talk_entries(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE seserahan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rundown_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_talk_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can view their own data" ON auth_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view their own budget categories" ON budget_categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own expenses" ON budget_expenses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own vendors" ON vendors
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own tasks" ON checklist_tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own guests" ON guests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own seserahan" ON seserahan_items
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own rundown" ON rundown_events
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own invitations" ON invitations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own deep talk" ON deep_talk_entries
  FOR SELECT USING (user_id = auth.uid());
