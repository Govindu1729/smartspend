-- db/migrations/001_schema.sql
-- Schema scaffold for SmartSpend (Postgres / Supabase)

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (optional - Supabase Auth handles users separately)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  created_at timestamptz DEFAULT now()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text DEFAULT 'tag',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense')),
  category_id uuid,
  description text,
  date date NOT NULL DEFAULT (current_date),
  is_recurring boolean DEFAULT false,
  recurring_interval text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  month date NOT NULL,
  amount numeric NOT NULL,
  alert_threshold numeric DEFAULT 0.8,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- Push subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);

-- Function: check_budget_alerts
-- Returns rows for budgets where spending >= alert_threshold
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
$$ LANGUAGE plpgsql STABLE;

-- Notes:
-- - Adjust types if you prefer integer PKs or referencing auth.users.
-- - Run this SQL in your Supabase SQL editor or via migrations.
-- - Consider adding triggers or scheduled jobs to materialize recurring transactions and to run check_budget_alerts on a schedule.
