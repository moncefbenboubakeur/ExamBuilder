# ExamBuilder.net - Setup Instructions

## Prerequisites
- Supabase account and project created
- Environment variables configured in `.env.local`

## Database Setup

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project (`toufoqynrjeczigyvzcj`)
3. Navigate to **SQL Editor** in the left sidebar
4. Copy and paste the contents of `supabase/schema.sql`
5. Click **Run** to execute the SQL

## Authentication Setup

### Option 1: Email Magic Link (Production)

1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Email** provider
3. Configure email templates if needed
4. Use the login page at `/login` to sign in with your email

### Option 2: Development Testing (Easier for Testing)

For quick testing without email setup, you can use Supabase's test users:

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click **Add User** → **Create new user**
3. Enter an email (e.g., `test@example.com`)
4. Set a password
5. Click **Create User**

Then, update the login page to support password login for testing, or use Supabase's **SQL Editor** to create a session:

```sql
-- Get user ID from auth.users table
SELECT id FROM auth.users WHERE email = 'test@example.com';
```

### Quick Test Method (Temporary)

For immediate testing without email configuration:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email: `test@example.com` and any password
4. The user will be automatically confirmed

5. To sign in directly, update your login to temporarily use password authentication:

Add this to `app/login/page.tsx` (temporary testing only):

```typescript
// Temporary password login for testing
const { error } = await supabase.auth.signInWithPassword({
  email,
  password: 'your-test-password', // Use the password you set
});
```

## Testing the App

Once authenticated:

1. **Upload Questions**: Use `sample-questions.md` file
2. **Start Exam**: Click "Start Exam" button
3. **Take Exam**: Answer questions, reveal answers, navigate
4. **View Results**: See your score and statistics
5. **Retry**: Try again with all questions or just wrong ones

## Troubleshooting

### 401 Unauthorized Errors

This means authentication isn't working. Check:

1. ✅ Database schema is created (run `supabase/schema.sql`)
2. ✅ User is logged in (check Supabase Dashboard → Authentication → Users)
3. ✅ Middleware is running (should redirect to `/login` if not authenticated)
4. ✅ Cookies are enabled in your browser

### RLS Policy Errors

If you see "row-level security policy" errors:

1. Make sure you ran the complete `supabase/schema.sql` file
2. Check that the user is authenticated
3. Verify RLS policies exist:

```sql
SELECT * FROM pg_policies WHERE tablename IN ('questions', 'exam_sessions', 'exam_answers');
```

### Email Not Sending

For development, the easiest approach is:

1. Go to Supabase Dashboard → Authentication → Configuration
2. Scroll to "Email Auth" section
3. Enable "Confirm email" toggle OFF for testing
4. This allows users to sign in without email confirmation

Or use the password method mentioned above for quick testing.

## Production Deployment

Before deploying to production:

1. ✅ Configure email templates in Supabase
2. ✅ Set up custom domain for email sender
3. ✅ Enable email confirmation
4. ✅ Review and test RLS policies
5. ✅ Update CORS settings if needed
6. ✅ Set proper environment variables
