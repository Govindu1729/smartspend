-- db/migrations/001_schema.sql
-- Schema scaffold for SmartSpend (Postgres / Supabase)
--
-- This migration is idempotent (safe to re-run) and includes:
--   1. Tables for profiles, categories, transactions, budgets, push_subscriptions
--   2. Foreign keys referencing auth.users(id) with ON DELETE CASCADE
--   3. Row Level Security policies — every table is locked to the owning user
--   4. A helper SQL function `check_budget_alerts()` for cron-style sweeps
--
-- Run this SQL in your Supabase SQL editor or via `supabase db push`.

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- 1. Profiles
-- =========================================================
-- One row per auth.users user. Created on signup.
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: users can see & edit only their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- =========================================================
-- 2. Categories
-- =========================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT 'tag',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_own" ON categories;
CREATE POLICY "categories_select_own" ON categories
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_insert_own" ON categories;
CREATE POLICY "categories_insert_own" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_update_own" ON categories;
CREATE POLICY "categories_update_own" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_delete_own" ON categories;
CREATE POLICY "categories_delete_own" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- 3. Transactions
-- =========================================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income','expense')),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  description text,
  date date NOT NULL DEFAULT (current_date),
  is_recurring boolean DEFAULT false,
  recurring_interval text CHECK (recurring_interval IS NULL OR recurring_interval IN ('daily','weekly','monthly','yearly')),
  last_recurred_at date,  -- Tracks progress of recurring instances (set by /api/cron/process-recurring)
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
CREATE POLICY "transactions_update_own" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_delete_own" ON transactions;
CREATE POLICY "transactions_delete_own" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- 4. Budgets
-- =========================================================
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  alert_threshold numeric DEFAULT 0.8 CHECK (alert_threshold > 0 AND alert_threshold <= 1),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select_own" ON budgets;
CREATE POLICY "budgets_select_own" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_insert_own" ON budgets;
CREATE POLICY "budgets_insert_own" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_update_own" ON budgets;
CREATE POLICY "budgets_update_own" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_delete_own" ON budgets;
CREATE POLICY "budgets_delete_own" ON budgets
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- 5. Push subscriptions
-- =========================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_select_own" ON push_subscriptions;
CREATE POLICY "push_select_own" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_insert_own" ON push_subscriptions;
CREATE POLICY "push_insert_own" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "push_delete_own" ON push_subscriptions;
CREATE POLICY "push_delete_own" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- 6. Function: check_budget_alerts
-- Returns rows for budgets where spending >= alert_threshold
-- SECURITY DEFINER so cron jobs (using service role) can call it.
-- =========================================================
CREATE OR REPLACE FUNCTION check_budget_alerts()
RETURNS TABLE(
  user_id uuid,
  category text,
  budget numeric,
  spent numeric,
  percent numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.user_id,
    c.name AS category,
    b.amount AS budget,
    COALESCE(SUM(t.amount), 0) AS spent,
    CASE WHEN b.amount > 0 THEN ROUND(COALESCE(SUM(t.amount), 0) / b.amount * 100, 2) ELSE 0 END AS percent
  FROM budgets b
  JOIN categories c ON c.id = b.category_id
  LEFT JOIN transactions t ON t.user_id = b.user_id
    AND t.type = 'expense'
    AND t.category_id = b.category_id
    AND t.date >= b.month
    AND t.date < (b.month + interval '1 month')
  GROUP BY b.id, b.user_id, c.name, b.amount, b.alert_threshold
  HAVING (COALESCE(SUM(t.amount), 0) / NULLIF(b.amount, 0)) >= b.alert_threshold;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =========================================================
-- 7. Auto-create profile on signup (Supabase Auth trigger)
-- =========================================================
-- Creates a profile row + default categories whenever a new auth.users row appears.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_cats text[] := ARRAY['Food','Travel','Entertainment','Education','Shopping','Utilities','Health','Other'];
  cat_name text;
BEGIN
  INSERT INTO profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  FOREACH cat_name IN ARRAY default_cats LOOP
    INSERT INTO categories (user_id, name, is_default) VALUES (NEW.id, cat_name, true);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Notes:
-- - All policies use auth.uid(), so they work transparently with the user-scoped
--   supabase client created in lib/supabase/server.ts → createClient().
-- - The service-role admin client (getSupabaseAdmin()) bypasses RLS by design
--   and should only be used in trusted server contexts (cron, migrations).
