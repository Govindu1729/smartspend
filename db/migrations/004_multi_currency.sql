-- Multi-Currency Support Migration
-- Adds currency preferences to profiles and exchange rates table

-- Add currency preferences to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '₹';

-- Create exchange rates table for real-time currency conversion
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_currency)
);

-- Add index for faster currency lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_target 
ON exchange_rates(target_currency);

-- Insert default exchange rates (relative to USD)
INSERT INTO exchange_rates (base_currency, target_currency, rate) VALUES
  ('USD', 'USD', 1.0),
  ('USD', 'EUR', 0.85),
  ('USD', 'GBP', 0.73),
  ('USD', 'INR', 83.50),
  ('USD', 'JPY', 149.50),
  ('USD', 'AUD', 1.53),
  ('USD', 'CAD', 1.36),
  ('USD', 'SGD', 1.35),
  ('USD', 'AED', 3.67),
  ('USD', 'SAR', 3.75)
ON CONFLICT (target_currency) DO NOTHING;

-- Add RLS policies for exchange_rates (public read, admin write)
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to exchange rates"
ON exchange_rates FOR SELECT
USING (true);

-- Comment describing the migration
COMMENT ON TABLE exchange_rates IS 'Stores currency exchange rates relative to USD base currency';
