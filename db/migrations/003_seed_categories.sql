-- Function to seed default categories for new users
CREATE OR REPLACE FUNCTION seed_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, is_default)
  VALUES
    (NEW.id, 'Food & Dining', 'utensils', true),
    (NEW.id, 'Transport', 'bus', true),
    (NEW.id, 'Entertainment', 'film', true),
    (NEW.id, 'Shopping', 'shopping-bag', true),
    (NEW.id, 'Bills & Recharges', 'phone', true),
    (NEW.id, 'Education', 'book', true),
    (NEW.id, 'Health', 'heart', true),
    (NEW.id, 'Other', 'tag', true);
  RETURN NEW;
END;
$$;

-- Trigger to run on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION seed_default_categories();
