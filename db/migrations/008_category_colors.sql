-- db/migrations/008_category_colors.sql
-- Add color support to categories for enhanced customization

-- Add color column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- Update existing categories with default colors based on their name
UPDATE categories 
SET color = CASE 
  WHEN name ILIKE '%food%' OR name ILIKE '%meal%' OR name ILIKE '%restaurant%' THEN '#ef4444'
  WHEN name ILIKE '%transport%' OR name ILIKE '%travel%' OR name ILIKE '%uber%' OR name ILIKE '%fuel%' THEN '#f97316'
  WHEN name ILIKE '%housing%' OR name ILIKE '%rent%' THEN '#f59e0b'
  WHEN name ILIKE '%utility%' OR name ILIKE '%electric%' OR name ILIKE '%water%' THEN '#84cc16'
  WHEN name ILIKE '%entertainment%' OR name ILIKE '%movie%' OR name ILIKE '%game%' THEN '#22c55e'
  WHEN name ILIKE '%shopping%' OR name ILIKE '%clothes%' THEN '#10b981'
  WHEN name ILIKE '%health%' OR name ILIKE '%medical%' OR name ILIKE '%pharmacy%' THEN '#14b8a6'
  WHEN name ILIKE '%education%' OR name ILIKE '%book%' OR name ILIKE '%course%' THEN '#06b6d4'
  WHEN name ILIKE '%income%' OR name ILIKE '%salary%' THEN '#3b82f6'
  WHEN name ILIKE '%saving%' OR name ILIKE '%investment%' THEN '#6366f1'
  WHEN name ILIKE '%technology%' OR name ILIKE '%software%' OR name ILIKE '%subscription%' THEN '#8b5cf6'
  WHEN name ILIKE '%gift%' OR name ILIKE '%donation%' THEN '#ec4899'
  WHEN name ILIKE '%fitness%' OR name ILIKE '%gym%' OR name ILIKE '%sport%' THEN '#f43f5e'
  ELSE '#64748b'
END
WHERE color IS NULL OR color = '#3b82f6';

-- Create index for faster color-based queries
CREATE INDEX IF NOT EXISTS idx_categories_color ON categories(color);

COMMENT ON COLUMN categories.color IS 'Hex color code for category visualization';
