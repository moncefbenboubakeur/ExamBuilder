-- Fix get_user_email function to handle varchar properly
CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email::TEXT INTO user_email
  FROM auth.users
  WHERE id = user_uuid;

  RETURN COALESCE(user_email, 'Unknown');
END;
$$;
