-- Mess Meal Management System - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SECTION 1: CREATE ALL TABLES
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MESSES
CREATE TABLE IF NOT EXISTS public.messes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mess_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEMBERSHIPS
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'moderator', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'left')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mess_id)
);

-- 4. MEAL ENTRIES
CREATE TABLE IF NOT EXISTS public.meal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  date DATE NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'dinner')),
  quantity DECIMAL(6,2) NOT NULL CHECK (quantity >= 0),
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BAZAR EXPENSES
CREATE TABLE IF NOT EXISTS public.bazar_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DEPOSITS
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NOTICES
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REQUESTS
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('meal_off', 'meal_on', 'guest_meal', 'join', 'stock_access')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. FREEZER STOCK
CREATE TABLE IF NOT EXISTS public.freezer_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  item TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'kg',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. MENUS
CREATE TABLE IF NOT EXISTS public.menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  UNIQUE(mess_id, date)
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bazar_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freezer_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 2.7: DATABASE INDEXES (query performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_mess_id ON public.memberships(mess_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_meal_entries_mess_id ON public.meal_entries(mess_id);
CREATE INDEX IF NOT EXISTS idx_meal_entries_user_id ON public.meal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_entries_date ON public.meal_entries(date);
CREATE INDEX IF NOT EXISTS idx_meal_entries_is_guest ON public.meal_entries(is_guest);
ALTER TABLE meal_entries ADD CONSTRAINT meal_entries_unique_per_day UNIQUE (mess_id, user_id, date, slot, is_guest);
CREATE INDEX IF NOT EXISTS idx_bazar_expenses_mess_id ON public.bazar_expenses(mess_id);
CREATE INDEX IF NOT EXISTS idx_bazar_expenses_mess_date ON public.bazar_expenses(mess_id, date);
CREATE INDEX IF NOT EXISTS idx_deposits_mess_id ON public.deposits(mess_id);
CREATE INDEX IF NOT EXISTS idx_deposits_mess_date ON public.deposits(mess_id, date);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_bazar_duties_mess_status ON public.bazar_duties(mess_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_mess_id ON public.requests(mess_id);
CREATE INDEX IF NOT EXISTS idx_requests_type ON public.requests(type);
CREATE INDEX IF NOT EXISTS idx_notices_mess_id ON public.notices(mess_id);
CREATE INDEX IF NOT EXISTS idx_notifications_mess_id ON public.notifications(mess_id);
CREATE INDEX IF NOT EXISTS idx_freezer_stock_mess_id ON public.freezer_stock(mess_id);
CREATE INDEX IF NOT EXISTS idx_menus_mess_id ON public.menus(mess_id);
CREATE INDEX IF NOT EXISTS idx_messes_mess_code ON public.messes(mess_code);

-- ============================================================
-- SECTION 2.5: HELPER FUNCTIONS (bypass RLS to avoid recursion)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_mess_member(p_mess_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE mess_id = p_mess_id AND user_id = p_user_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_mess_admin(p_mess_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE mess_id = p_mess_id AND user_id = p_user_id
    AND role IN ('manager', 'moderator') AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_any_mess_member(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = p_user_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_mess_creator(p_mess_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.messes
    WHERE id = p_mess_id AND created_by = p_user_id
  );
$$;

-- ============================================================
-- SECTION 3: CREATE ALL RLS POLICIES
-- ============================================================

-- PROFILES policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Members can view profiles in their mess" ON public.profiles;
CREATE POLICY "Members can view profiles in their mess"
  ON public.profiles FOR SELECT
  USING (
    public.is_any_mess_member(auth.uid())
  );

-- MESSES policies
DROP POLICY IF EXISTS "Users can create messes" ON public.messes;
CREATE POLICY "Users can create messes"
  ON public.messes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can look up messes" ON public.messes;
CREATE POLICY "Authenticated users can look up messes"
  ON public.messes FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Members can view their mess" ON public.messes;
CREATE POLICY "Members can view their mess"
  ON public.messes FOR SELECT
  USING (
    public.is_mess_member(messes.id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can update their mess" ON public.messes;
CREATE POLICY "Manager can update their mess"
  ON public.messes FOR UPDATE
  USING (
    public.is_mess_admin(messes.id, auth.uid())
  );

-- MEMBERSHIPS policies
DROP POLICY IF EXISTS "Users can join a mess" ON public.memberships;
CREATE POLICY "Users can join a mess"
  ON public.memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'member');

DROP POLICY IF EXISTS "Creator becomes manager" ON public.memberships;
CREATE POLICY "Creator becomes manager"
  ON public.memberships FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'manager'
    AND public.is_mess_creator(mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can add members" ON public.memberships;
CREATE POLICY "Manager can add members"
  ON public.memberships FOR INSERT
  WITH CHECK (
    public.is_mess_admin(memberships.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Members can view memberships in their mess" ON public.memberships;
CREATE POLICY "Members can view memberships in their mess"
  ON public.memberships FOR SELECT
  USING (
    public.is_mess_member(memberships.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can update memberships" ON public.memberships;
CREATE POLICY "Manager can update memberships"
  ON public.memberships FOR UPDATE
  USING (
    public.is_mess_admin(memberships.mess_id, auth.uid())
  );

-- MEAL ENTRIES policies
DROP POLICY IF EXISTS "Members can view meals in their mess" ON public.meal_entries;
CREATE POLICY "Members can view meals in their mess"
  ON public.meal_entries FOR SELECT
  USING (
    public.is_mess_member(meal_entries.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can insert meals" ON public.meal_entries;
CREATE POLICY "Manager can insert meals"
  ON public.meal_entries FOR INSERT
  WITH CHECK (
    public.is_mess_admin(meal_entries.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can update meals" ON public.meal_entries;
CREATE POLICY "Manager can update meals"
  ON public.meal_entries FOR UPDATE
  USING (
    public.is_mess_admin(meal_entries.mess_id, auth.uid())
  );

-- BAZAR EXPENSES policies
DROP POLICY IF EXISTS "Members can view bazar expenses" ON public.bazar_expenses;
CREATE POLICY "Members can view bazar expenses"
  ON public.bazar_expenses FOR SELECT
  USING (
    public.is_mess_member(bazar_expenses.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can insert bazar expenses" ON public.bazar_expenses;
CREATE POLICY "Manager can insert bazar expenses"
  ON public.bazar_expenses FOR INSERT
  WITH CHECK (
    public.is_mess_admin(bazar_expenses.mess_id, auth.uid())
  );

-- DEPOSITS policies
DROP POLICY IF EXISTS "Members can view deposits" ON public.deposits;
CREATE POLICY "Members can view deposits"
  ON public.deposits FOR SELECT
  USING (
    public.is_mess_member(deposits.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can insert deposits" ON public.deposits;
CREATE POLICY "Manager can insert deposits"
  ON public.deposits FOR INSERT
  WITH CHECK (
    public.is_mess_admin(deposits.mess_id, auth.uid())
  );

-- NOTICES policies
DROP POLICY IF EXISTS "Members can view notices" ON public.notices;
CREATE POLICY "Members can view notices"
  ON public.notices FOR SELECT
  USING (
    public.is_mess_member(notices.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can insert notices" ON public.notices;
CREATE POLICY "Manager can insert notices"
  ON public.notices FOR INSERT
  WITH CHECK (
    public.is_mess_admin(notices.mess_id, auth.uid())
  );

-- REQUESTS policies
DROP POLICY IF EXISTS "Members can view requests in their mess" ON public.requests;
CREATE POLICY "Members can view requests in their mess"
  ON public.requests FOR SELECT
  USING (
    public.is_mess_member(requests.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can create their own requests" ON public.requests;
CREATE POLICY "Users can create their own requests"
  ON public.requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manager can update requests" ON public.requests;
CREATE POLICY "Manager can update requests"
  ON public.requests FOR UPDATE
  USING (
    public.is_mess_admin(requests.mess_id, auth.uid())
  );

-- FREEZER STOCK policies
DROP POLICY IF EXISTS "Members can view freezer stock" ON public.freezer_stock;
CREATE POLICY "Members can view freezer stock"
  ON public.freezer_stock FOR SELECT
  USING (
    public.is_mess_member(freezer_stock.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can insert freezer stock" ON public.freezer_stock;
CREATE POLICY "Manager can insert freezer stock"
  ON public.freezer_stock FOR INSERT
  WITH CHECK (
    public.is_mess_admin(freezer_stock.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can update freezer stock" ON public.freezer_stock;
CREATE POLICY "Manager can update freezer stock"
  ON public.freezer_stock FOR UPDATE
  USING (
    public.is_mess_admin(freezer_stock.mess_id, auth.uid())
  );

-- MENUS policies
DROP POLICY IF EXISTS "Members can view menus" ON public.menus;
CREATE POLICY "Members can view menus"
  ON public.menus FOR SELECT
  USING (
    public.is_mess_member(menus.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can insert menus" ON public.menus;
CREATE POLICY "Manager can insert menus"
  ON public.menus FOR INSERT
  WITH CHECK (
    public.is_mess_admin(menus.mess_id, auth.uid())
  );

DROP POLICY IF EXISTS "Manager can update menus" ON public.menus;
CREATE POLICY "Manager can update menus"
  ON public.menus FOR UPDATE
  USING (
    public.is_mess_admin(menus.mess_id, auth.uid())
  );

-- NOTIFICATIONS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Manager can create notifications" ON public.notifications;
CREATE POLICY "Manager can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_mess_admin(notifications.mess_id, auth.uid()));

-- ============================================================
-- SECTION 4: FUNCTIONS & TRIGGERS
-- ============================================================

-- Create mess + add creator as manager (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_mess(
  p_name TEXT,
  p_mess_code TEXT,
  p_user_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_mess JSONB;
BEGIN
  INSERT INTO public.messes (name, mess_code, created_by)
  VALUES (p_name, p_mess_code, p_user_id)
  RETURNING to_jsonb(messes.*) INTO v_mess;

  INSERT INTO public.memberships (user_id, mess_id, role, status)
  VALUES (p_user_id, (v_mess->>'id')::UUID, 'manager', 'active');

  RETURN v_mess;
END;
$$;

-- Auto-create profile on signup

DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECTION 5: ONE-TIME FIX for users who registered BEFORE the trigger
-- ============================================================
INSERT INTO public.profiles (id, name, phone)
SELECT id, COALESCE(raw_user_meta_data->>'name', email), raw_user_meta_data->>'phone'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
