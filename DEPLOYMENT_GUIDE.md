# Deployment Guide - ExamBuilder.net

## Magic Link Email Redirect Fix

### Problem
Users receive magic link emails that redirect to `localhost:3003` instead of production URL.

### Solution

#### 1. Update Supabase Dashboard Settings (REQUIRED)

Go to your Supabase Dashboard: https://supabase.com/dashboard

**Navigate to:** Authentication → URL Configuration

**Update these settings:**

- **Site URL:** `https://exambuilder.net`

- **Redirect URLs** (add all of these):
  - `https://exambuilder.net/**`
  - `https://www.exambuilder.net/**`
  - `https://exambuilder.net/auth/callback`
  - `https://www.exambuilder.net/auth/callback`
  - `http://localhost:3003/**` (for local development)

**Save changes.**

#### 2. Update Vercel Environment Variables

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

**Add this variable:**
- Key: `NEXT_PUBLIC_SITE_URL`
- Value: `https://exambuilder.net`
- Environment: Production (and Preview if needed)

**Save and redeploy.**

#### 3. Code Changes (Already Done)

✅ Updated `.env.local` with `NEXT_PUBLIC_SITE_URL`
✅ Modified `app/login/page.tsx` to use environment variable

### Testing

1. **Production Test:**
   - Go to https://exambuilder.net/login
   - Enter an email
   - Click "Send Magic Link"
   - Check email - link should point to `https://exambuilder.net/auth/callback`

2. **Local Test:**
   - Go to http://localhost:3003/login
   - Should still work with localhost URLs

### Troubleshooting

**Problem:** Still getting localhost URLs in emails

**Solutions:**
1. Double-check Supabase Site URL is set to `https://exambuilder.net`
2. Wait 5-10 minutes for Supabase settings to propagate
3. Clear browser cache and cookies
4. Try in incognito/private browsing mode
5. Check Vercel environment variables are set correctly
6. Ensure latest code is deployed (check deployment logs)

**Problem:** Magic link says "Invalid link"

**Solutions:**
1. Verify the redirect URL is in Supabase's allowed list
2. Check that the link hasn't expired (links expire after 1 hour)
3. Ensure you're clicking the link in the same browser where you requested it

### Additional Notes

- Magic links expire after 1 hour
- Users can request a new link if the old one expires
- Password login is also available as an alternative
- Both www and non-www versions are supported
