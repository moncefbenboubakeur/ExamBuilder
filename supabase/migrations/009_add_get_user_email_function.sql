-- Create a function to get user email from auth.users
-- This requires security definer to access auth schema
CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;

  RETURN COALESCE(user_email, 'Unknown');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;
