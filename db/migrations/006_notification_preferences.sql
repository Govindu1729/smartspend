-- Notification Preferences Migration
-- Adds granular notification settings to profiles table

-- Add notification_settings column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "budget_alerts": true,
  "budget_exceeded": true,
  "weekly_summary": false,
  "monthly_report": true,
  "unusual_activity": true,
  "bill_reminders": true,
  "savings_goals": true,
  "category_spending_limits": false,
  "transaction_confirmations": false,
  "price_drop_alerts": false
}'::jsonb;

-- Add email preferences
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
  "marketing_emails": false,
  "product_updates": true,
  "security_alerts": true,
  "weekly_digest": false,
  "monthly_report": true
}'::jsonb;

-- Add push notification preferences
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS push_preferences JSONB DEFAULT '{
  "enabled": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "08:00",
  "timezone": "Asia/Kolkata"
}'::jsonb;

-- Create index for faster notification preference queries
CREATE INDEX IF NOT EXISTS idx_profiles_notification_settings 
ON profiles USING GIN (notification_settings);

-- Add validation constraint to ensure valid JSON structure
ALTER TABLE profiles 
ADD CONSTRAINT valid_notification_settings 
CHECK (
  jsonb_typeof(notification_settings) = 'object' AND
  (notification_settings->>'budget_alerts')::boolean IS NOT NULL AND
  (notification_settings->>'budget_exceeded')::boolean IS NOT NULL
);

-- Add comments for documentation
COMMENT ON COLUMN profiles.notification_settings IS 'User preferences for in-app notifications';
COMMENT ON COLUMN profiles.email_preferences IS 'User preferences for email communications';
COMMENT ON COLUMN profiles.push_preferences IS 'User preferences for push notifications including quiet hours';

-- Example update query for users to customize their preferences
-- UPDATE profiles SET notification_settings = jsonb_set(
--   notification_settings,
--   '{weekly_summary}',
--   'true'::jsonb
-- ) WHERE id = 'user-uuid';
