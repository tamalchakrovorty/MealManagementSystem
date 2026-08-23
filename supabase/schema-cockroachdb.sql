-- Mess Meal Management System - CockroachDB Schema
-- Created for migration from PostgreSQL (Neon/local) to CockroachDB Serverless
-- Differences from schema-local.sql:
--   1. No CREATE EXTENSION (gen_random_uuid() is built-in)
--   2. No PL/pgSQL create_mess function (app handles the transaction in code)
--   3. No GRANT ALL ON ALL SEQUENCES (UUID PKs need no sequences)
--   4. Dropped old role indexes where redundant (idx_users_email unique already covers)

CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mess_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'moderator', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'left')),
  moderator_from DATE,
  moderator_until DATE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mess_id)
);

CREATE TABLE IF NOT EXISTS public.meal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  date DATE NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'dinner')),
  quantity DECIMAL(6,2) NOT NULL CHECK (quantity >= 0),
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bazar_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bazar_duties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'group', 'individual')),
  target_user_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('meal_off', 'meal_on', 'guest_meal', 'join', 'stock_access', 'leave')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.freezer_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  item TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'kg',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  UNIQUE(mess_id, date)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  phone TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_mess_id ON public.memberships(mess_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_meal_entries_mess_id ON public.meal_entries(mess_id);
CREATE INDEX IF NOT EXISTS idx_meal_entries_user_id ON public.meal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_entries_date ON public.meal_entries(date);
CREATE INDEX IF NOT EXISTS idx_meal_entries_is_guest ON public.meal_entries(is_guest);
ALTER TABLE meal_entries ADD CONSTRAINT meal_entries_unique_per_day UNIQUE (mess_id, user_id, date, slot, is_guest);
CREATE INDEX IF NOT EXISTS idx_bazar_expenses_mess_id ON public.bazar_expenses(mess_id);
CREATE INDEX IF NOT EXISTS idx_deposits_mess_id ON public.deposits(mess_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_mess_id ON public.requests(mess_id);
CREATE INDEX IF NOT EXISTS idx_requests_type ON public.requests(type);
CREATE INDEX IF NOT EXISTS idx_requests_mess_type_status ON public.requests(mess_id, type, status);
CREATE INDEX IF NOT EXISTS idx_notices_mess_id ON public.notices(mess_id);
CREATE INDEX IF NOT EXISTS idx_notifications_mess_id ON public.notifications(mess_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, mess_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_freezer_stock_mess_id ON public.freezer_stock(mess_id);
CREATE INDEX IF NOT EXISTS idx_menus_mess_id ON public.menus(mess_id);
CREATE INDEX IF NOT EXISTS idx_contacts_mess_id ON public.contacts(mess_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_mess_status ON public.memberships(user_id, mess_id, status);
CREATE INDEX IF NOT EXISTS idx_meal_entries_mess_date ON public.meal_entries(mess_id, date);
CREATE INDEX IF NOT EXISTS idx_deposits_mess_date ON public.deposits(mess_id, date);
CREATE INDEX IF NOT EXISTS idx_bazar_expenses_mess_date ON public.bazar_expenses(mess_id, date);
CREATE INDEX IF NOT EXISTS idx_bazar_duties_mess_status ON public.bazar_duties(mess_id, status);
CREATE INDEX IF NOT EXISTS idx_deposits_mess_user ON public.deposits(mess_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messes_mess_code ON public.messes(mess_code);