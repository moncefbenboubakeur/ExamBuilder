# Deployment Guide

## Deploying to Vercel

### Prerequisites
- GitHub account with this repository
- Vercel account (sign up at https://vercel.com)
- Supabase project already set up

### Step 1: Connect GitHub Repository

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select this repository from your GitHub account
4. Authorize Vercel to access your repository

### Step 2: Configure Environment Variables

In the Vercel project settings, add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** Copy these values from your `.env.local` file or from your Supabase project settings at:
`Settings > API > Project URL` and `Project API keys > anon public`

### Step 3: Configure Build Settings

Vercel should auto-detect Next.js settings, but verify:

- **Framework Preset:** Next.js
- **Build Command:** `next build` (no need for --turbopack flag in production)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install`

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 2-3 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

### Step 5: Update Supabase Authentication URLs

After deployment, update your Supabase authentication settings:

1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Add your Vercel URL to:
   - **Site URL:** `https://your-project-name.vercel.app`
   - **Redirect URLs:** Add `https://your-project-name.vercel.app/**`

### Automatic Deployments

Vercel automatically deploys:
- **Production:** Every push to `main` branch
- **Preview:** Every pull request gets a unique preview URL

### Custom Domain (Optional)

1. Go to Vercel project settings > Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update Supabase redirect URLs to include your custom domain

### Troubleshooting

**Build fails:**
- Check that all environment variables are set correctly
- Verify your Supabase schema is deployed (run `supabase/schema.sql`)

**Authentication not working:**
- Verify Supabase redirect URLs include your Vercel domain
- Check environment variables are prefixed with `NEXT_PUBLIC_`

**API routes returning 401:**
- Ensure Supabase RLS policies are properly configured
- Verify environment variables are accessible in serverless functions

### Monitoring

View your deployment logs and analytics in the Vercel dashboard:
- **Deployments:** See build logs and deployment history
- **Analytics:** Track page views and performance (requires upgrade)
- **Functions:** Monitor API route execution time

### Environment-Specific Configuration

For staging/production environments:
1. Create separate Supabase projects
2. Add environment-specific variables in Vercel
3. Use Vercel's environment settings to manage multiple environments
