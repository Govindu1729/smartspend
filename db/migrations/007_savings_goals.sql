-- Savings Goals Migration
-- Adds savings goals tracking feature to help users achieve financial objectives

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#3b82f6',
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create goal contributions table to track progress
CREATE TABLE IF NOT EXISTS goal_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  note TEXT,
  contributed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_savings_goals_user 
ON savings_goals(user_id, is_active, priority);

CREATE INDEX IF NOT EXISTS idx_savings_goals_deadline 
ON savings_goals(user_id, deadline) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal 
ON goal_contributions(goal_id, contributed_at DESC);

-- Enable RLS
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- Policies for savings_goals
CREATE POLICY "Users can view their own savings goals"
ON savings_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own savings goals"
ON savings_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings goals"
ON savings_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings goals"
ON savings_goals FOR DELETE
USING (auth.uid() = user_id);

-- Policies for goal_contributions
CREATE POLICY "Users can view their own goal contributions"
ON goal_contributions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM savings_goals sg 
    WHERE sg.id = goal_contributions.goal_id 
    AND sg.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own goal contributions"
ON goal_contributions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM savings_goals sg 
    WHERE sg.id = goal_contributions.goal_id 
    AND sg.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own goal contributions"
ON goal_contributions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM savings_goals sg 
    WHERE sg.id = goal_contributions.goal_id 
    AND sg.user_id = auth.uid()
  )
);

-- Add comments for documentation
COMMENT ON TABLE savings_goals IS 'Tracks user savings goals with targets and deadlines';
COMMENT ON TABLE goal_contributions IS 'Records individual contributions toward savings goals';
COMMENT ON COLUMN savings_goals.priority IS 'Goal priority: 1=highest, 5=lowest';
COMMENT ON COLUMN savings_goals.is_active IS 'Whether the goal is currently being tracked';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_savings_goals_updated_at
BEFORE UPDATE ON savings_goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate goal progress percentage
CREATE OR REPLACE FUNCTION calculate_goal_progress(goal_id uuid)
RETURNS NUMERIC AS $$
DECLARE
  progress NUMERIC;
BEGIN
  SELECT 
    CASE 
      WHEN target_amount = 0 THEN 0
      ELSE (current_amount / target_amount) * 100
    END
  INTO progress
  FROM savings_goals
  WHERE id = goal_id;
  
  RETURN COALESCE(progress, 0);
END;
$$ LANGUAGE SQL STABLE;

-- Function to get goal summary with progress
CREATE OR REPLACE FUNCTION get_goal_summary(user_uuid uuid)
RETURNS TABLE (
  goal_id uuid,
  name TEXT,
  target_amount NUMERIC,
  current_amount NUMERIC,
  progress_percentage NUMERIC,
  remaining_amount NUMERIC,
  deadline DATE,
  days_remaining INTEGER,
  is_on_track BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sg.id,
    sg.name,
    sg.target_amount,
    sg.current_amount,
    calculate_goal_progress(sg.id) as progress_percentage,
    (sg.target_amount - sg.current_amount) as remaining_amount,
    sg.deadline,
    CASE 
      WHEN sg.deadline IS NOT NULL 
      THEN (sg.deadline - CURRENT_DATE)::INTEGER
      ELSE NULL
    END as days_remaining,
    CASE 
      WHEN sg.deadline IS NOT NULL AND sg.current_amount > 0 THEN
        -- Simple projection: are we on track based on time elapsed?
        (CURRENT_DATE - sg.created_at) <= 
        ((sg.deadline - sg.created_at) * (sg.current_amount / sg.target_amount))
      ELSE false
    END as is_on_track
  FROM savings_goals sg
  WHERE sg.user_id = user_uuid AND sg.is_active = true
  ORDER BY sg.priority, sg.deadline;
END;
$$ LANGUAGE plpgsql STABLE;
