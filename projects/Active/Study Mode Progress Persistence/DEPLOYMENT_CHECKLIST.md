# Study Progress Persistence - Deployment Checklist

## Pre-Deployment Tasks

### 1. Database Migration ⏳
- [ ] **Apply SQL Migration to Supabase**
  - Location: `/supabase/migrations/009_study_progress.sql`
  - Method 1: Supabase Dashboard → SQL Editor → Paste and Execute
  - Method 2: `supabase db push` (if CLI configured)
  - **Verify**: Query `study_progress` table exists after migration

### 2. Environment Verification ✅
- [x] Supabase URL configured in `.env.local`
- [x] Supabase Anon Key configured in `.env.local`
- [x] TypeScript compilation passes (no errors)
- [x] API routes created and compiled

### 3. Code Review (Optional) ⏳
- [ ] Review API endpoint security
- [ ] Review RLS policies
- [ ] Review error handling

## Deployment Steps

### Step 1: Apply Database Migration
```sql
-- Execute this in Supabase SQL Editor:
-- Copy contents from: /supabase/migrations/009_study_progress.sql
```

**Expected Result**: Table `study_progress` created with indexes and RLS policies

**Verification Query**:
```sql
-- Check table exists
SELECT * FROM study_progress LIMIT 1;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'study_progress';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'study_progress';
```

### Step 2: Test API Endpoints Locally

#### Test 1: Health Check
```bash
# Start dev server
npm run dev -- --port 3001

# Should compile without errors
```

#### Test 2: POST /api/study/progress
```bash
# Login first, then test (requires valid session)
curl -X POST http://localhost:3001/api/study/progress \
  -H "Content-Type: application/json" \
  -d '{
    "exam_id": "YOUR_EXAM_ID",
    "topic_name": "Test Topic",
    "completed": false
  }'
```

**Expected**: `{"success": true, "data": {...}}`

#### Test 3: GET /api/study/progress/[exam_id]
```bash
curl http://localhost:3001/api/study/progress/YOUR_EXAM_ID
```

**Expected**: Progress data with statistics

#### Test 4: GET /api/courses/[exam_id]
```bash
curl http://localhost:3001/api/courses/YOUR_EXAM_ID
```

**Expected**: Course data now includes `progress` and `statistics` fields

### Step 3: Deploy to Production

#### Option A: Vercel Auto-Deploy
```bash
git add .
git commit -m "Add study progress persistence feature"
git push origin main
```

Vercel will automatically deploy. Monitor build logs for errors.

#### Option B: Manual Vercel Deploy
```bash
vercel --prod
```

### Step 4: Post-Deployment Verification

#### Check 1: Database Access
- [ ] Visit your app in production
- [ ] Open a study mode course
- [ ] Check browser DevTools → Network tab
- [ ] Should see successful calls to `/api/study/progress`

#### Check 2: Data Persistence
- [ ] Visit a topic
- [ ] Refresh the page
- [ ] Verify topic shows as visited
- [ ] Mark topic as complete
- [ ] Refresh and verify completion persists

#### Check 3: Statistics
- [ ] Load course page
- [ ] Check completion percentage displays
- [ ] Verify "last visited" shows correct topic

#### Check 4: Multi-User Isolation
- [ ] Login as User A → mark topics complete
- [ ] Logout and login as User B
- [ ] Verify User B sees no progress from User A
- [ ] Each user has independent progress

### Step 5: Error Monitoring

Monitor for these potential issues:

1. **RLS Policy Errors**
   - Symptom: 403 Forbidden or empty results
   - Fix: Verify RLS policies applied correctly

2. **Unique Constraint Violations**
   - Symptom: Duplicate key errors
   - Fix: Should not occur with UPSERT, but check migration

3. **Authentication Errors**
   - Symptom: 401 Unauthorized
   - Fix: Verify Supabase session cookie handling

4. **Topic Name Mismatches**
   - Symptom: Progress not linking to topics
   - Fix: Ensure topic names match exactly

## Rollback Plan

If issues occur in production:

### Immediate Rollback
```bash
# Revert to previous deployment
vercel rollback
```

### Database Rollback (if needed)
```sql
-- Drop table and all data
DROP TABLE IF EXISTS study_progress CASCADE;
```

**Warning**: This deletes all user progress data!

## Post-Deployment Tasks

### 1. Monitor Performance
- [ ] Check API response times in Vercel Analytics
- [ ] Monitor database query performance in Supabase Dashboard
- [ ] Watch for any error logs in Vercel Logs

### 2. User Acceptance Testing
- [ ] Test with real user accounts
- [ ] Verify progress persists across sessions
- [ ] Test on multiple devices (desktop, mobile)
- [ ] Test with shared exams

### 3. Documentation Updates
- [ ] Update user documentation (if applicable)
- [ ] Document any frontend integration patterns
- [ ] Share API reference with frontend team

## Success Criteria

Deployment is successful when:

- ✅ Database migration applied without errors
- ✅ All API endpoints return correct status codes
- ✅ Users can save progress (visible in database)
- ✅ Progress persists across sessions
- ✅ Statistics calculate correctly
- ✅ RLS policies enforce user isolation
- ✅ No errors in production logs
- ✅ TypeScript compilation successful
- ✅ Vercel build completes successfully

## Timeline Estimate

| Task | Time Required |
|------|---------------|
| Apply database migration | 5 minutes |
| Local API testing | 15 minutes |
| Deploy to production | 5 minutes |
| Post-deployment verification | 15 minutes |
| User acceptance testing | 30 minutes |
| **Total** | **~70 minutes** |

## Support & Troubleshooting

### Common Issues

**Issue**: "Table does not exist" error
- **Cause**: Migration not applied
- **Fix**: Execute SQL migration in Supabase

**Issue**: "Unauthorized" errors despite login
- **Cause**: Session cookie not passed
- **Fix**: Verify Supabase client configuration

**Issue**: Progress shows for wrong user
- **Cause**: RLS policies not applied
- **Fix**: Re-run RLS policy SQL from migration

**Issue**: Can't see progress data
- **Cause**: No progress created yet
- **Fix**: Visit topics first to generate progress

### Monitoring Queries

Check progress in production:
```sql
-- Count total progress records
SELECT COUNT(*) FROM study_progress;

-- Check recent progress updates
SELECT * FROM study_progress
ORDER BY last_visited_at DESC
LIMIT 10;

-- Progress by exam
SELECT exam_id, COUNT(*) as records,
       COUNT(CASE WHEN completed THEN 1 END) as completed
FROM study_progress
GROUP BY exam_id;

-- Progress by user
SELECT user_id, COUNT(*) as topics_visited,
       COUNT(CASE WHEN completed THEN 1 END) as topics_completed
FROM study_progress
GROUP BY user_id;
```

## Contact

For issues or questions:
- Check implementation docs: `IMPLEMENTATION_SUMMARY.md`
- API reference: `API_REFERENCE.md`
- Review code in: `/app/api/study/progress/`

---

**Status**: Ready for deployment
**Last Updated**: October 10, 2025
**Deployed**: ⏳ Pending
