-- Performance Indexes Migration
-- Adds strategic indexes to improve query performance at scale

-- Transactions: Optimize common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date 
ON transactions(user_id, type, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_category_date 
ON transactions(user_id, category_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
ON transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_amount 
ON transactions(user_id, amount DESC);

-- Budgets: Optimize monthly budget queries
CREATE INDEX IF NOT EXISTS idx_budgets_user_category_month 
ON budgets(user_id, category_id, month DESC);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month 
ON budgets(user_id, month DESC);

-- Categories: Optimize category lookups
CREATE INDEX IF NOT EXISTS idx_categories_user_parent 
ON categories(user_id, parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_user_type 
ON categories(user_id, type);

-- Notifications: Optimize notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_type 
ON notifications(user_id, type);

-- Composite index for dashboard summary queries
CREATE INDEX IF NOT EXISTS idx_transactions_dashboard 
ON transactions(user_id, date DESC, type, category_id)
WHERE date >= NOW() - INTERVAL '6 months';

-- Partial index for recent transactions (most commonly accessed)
CREATE INDEX IF NOT EXISTS idx_transactions_recent 
ON transactions(user_id, date DESC)
WHERE date >= NOW() - INTERVAL '3 months';

-- Add comments to document the purpose of indexes
COMMENT ON INDEX idx_transactions_user_type_date IS 'Optimizes transaction filtering by type and date range';
COMMENT ON INDEX idx_transactions_user_category_date IS 'Optimizes category-wise transaction grouping';
COMMENT ON INDEX idx_budgets_user_category_month IS 'Optimizes monthly budget tracking per category';
COMMENT ON INDEX idx_transactions_dashboard IS 'Optimizes dashboard summary queries for last 6 months';
COMMENT ON INDEX idx_transactions_recent IS 'Fast access to recent transactions (last 3 months)';
