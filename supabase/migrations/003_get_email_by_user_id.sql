-- Migration: Add function to get email by user ID
-- This allows authenticated users to see emails of users they've shared with

-- Create a function to get email by user ID
CREATE OR REPLACE FUNCTION get_email_by_user_id(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE auth.users.id = get_email_by_user_id.user_id
  LIMIT 1;

  RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_email_by_user_id(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_email_by_user_id IS 'Returns email address for a given user ID. Used for displaying shared user emails in sharing UI.';
