-- Migration: Add function to lookup user ID by email
-- This allows non-admin users to find other users by email for sharing

-- Create a function to get user ID by email
-- This is safe because it only returns the ID, not sensitive user data
CREATE OR REPLACE FUNCTION get_user_id_by_email(email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id
  FROM auth.users
  WHERE auth.users.email = get_user_id_by_email.email
  LIMIT 1;

  RETURN user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_user_id_by_email IS 'Returns user ID for a given email address. Used for exam sharing functionality.';
