# Testing Authentication

## Quick Test Steps

1. **Clear browser data** (important!)
   - Open DevTools (F12)
   - Go to Application tab
   - Clear all cookies and storage for localhost:3000

2. **Create a test user in Supabase**
   - Go to: https://supabase.com/dashboard/project/toufoqynrjeczigyvzcj/auth/users
   - Click "Add user" → "Create new user"
   - Email: `test@example.com`
   - Password: `Test123456!`
   - Click "Create user"

3. **Run the database schema**
   - Go to: https://supabase.com/dashboard/project/toufoqynrjeczigyvzcj/sql/new
   - Copy the entire content of `supabase/schema.sql`
   - Paste and click "RUN"

4. **Test login**
   - Go to http://localhost:3000/login
   - Click "Password" tab
   - Enter:
     - Email: `test@example.com`
     - Password: `Test123456!`
   - Click "Sign In"
   - You should see "Successfully logged in!" and be redirected

5. **After redirect, check DevTools:**
   - Application → Cookies → localhost
   - You should see cookies starting with `sb-`

6. **Test upload:**
   - Upload the `sample-questions.md` file
   - If you get 401, check cookies are present

## Troubleshooting 401 Errors

If you're getting 401 errors after login:

### Option 1: Try a hard refresh
- After login, press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- This forces a full page reload with cache clear

### Option 2: Check cookies in DevTools
- F12 → Application → Cookies
- Look for `sb-toufoqynrjeczigyvzcj-auth-token`
- If missing, auth didn't work

### Option 3: Manual cookie check
Add this to the home page temporarily to debug:

```typescript
useEffect(() => {
  const checkCookies = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session);
    console.log('Cookies:', document.cookie);
  };
  checkCookies();
}, []);
```

### Option 4: Restart dev server
Sometimes the middleware needs a restart:
```bash
# Kill the dev server (Ctrl+C)
# Then restart:
npm run dev
```

## Expected Behavior

✅ After login → Cookies are set → Redirected to `/`
✅ Home page → Sees auth cookies → Fetches questions successfully
✅ Upload → Auth validated → Questions saved

❌ If getting 401 → Auth cookies not being read by server

## Common Issues

1. **Cookies not persisting**
   - Make sure you're not in incognito mode
   - Check browser cookie settings
   - Try different browser

2. **Server not reading cookies**
   - Restart dev server
   - Check middleware is running (should see it in terminal)
   - Verify `.env.local` has correct Supabase keys

3. **RLS blocking requests**
   - Make sure you ran the complete `supabase/schema.sql`
   - Check RLS policies exist: https://supabase.com/dashboard/project/toufoqynrjeczigyvzcj/auth/policies
