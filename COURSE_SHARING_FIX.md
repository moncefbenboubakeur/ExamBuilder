# Course Sharing Fix

## Problem
Users who had exams shared with them (via the exam sharing feature) were getting **403 Forbidden** errors when trying to access the study course for those shared exams.

## Root Cause
The course API endpoints (`/api/courses/[exam_id]` and `/api/generate-course`) only checked if users **owned** the exam or if it was a **sample exam**. They did NOT check the `exam_shares` table to see if the exam was shared with the user.

Additionally, the RLS policies on `ai_generated_course_sections` and `ai_detected_topics` tables also didn't consider shared exams.

## Solution

### 1. API Route Fixes
Updated both API routes to check for shared access:

**Files Modified:**
- `app/api/courses/[exam_id]/route.ts`
- `app/api/generate-course/route.ts`

**Changes:**
```typescript
// Added check for shared exams
const { data: sharedExam } = await supabase
  .from('exam_shares')
  .select('id')
  .eq('exam_id', exam_id)
  .eq('shared_with', user.id)
  .maybeSingle();

const isShared = !!sharedExam;

// Updated authorization check
if (!isOwner && !isSample && !isShared) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

### 2. Database RLS Policy Fixes
Created migration `008_fix_course_sections_rls_for_sharing.sql` to update RLS policies:

**Tables Updated:**
- `ai_generated_course_sections` - Course lesson content
- `ai_detected_topics` - AI-detected topics

**New Policy Logic:**
Users can view course data if ANY of these conditions are true:
1. They own the exam (`exams.user_id = auth.uid()`)
2. The exam is a sample (`exams.is_sample = true`)
3. **The exam is shared with them** (via `exam_shares` table)

## How Course Sharing Works

### Single Course Per Exam
- Course content is stored with `exam_id` as the foreign key
- **One course per exam** (not duplicated per user)
- When User A shares an exam with User B, User B sees the SAME course that User A generated

### Access Flow
```
User A creates exam → Generates course → Shares exam with User B
                           ↓
                    User B can now:
                    - Take the exam
                    - View the study course
                    - See all course sections/topics
```

### What Shared Users CAN Do
✅ View existing course content
✅ Navigate through course topics
✅ Read lesson markdown

### What Shared Users CANNOT Do
❌ Generate a new course (only owner can)
❌ Delete the course
❌ Modify course content

## Testing the Fix

### Prerequisites
1. Run the migration in Supabase SQL Editor:
   ```sql
   -- Run: supabase/migrations/008_fix_course_sections_rls_for_sharing.sql
   ```

2. Ensure exam sharing is set up (migration `001_exam_sharing.sql` already run)

### Test Steps
1. **User A**: Create an exam and generate a course for it
2. **User A**: Share the exam with User B (via email)
3. **User B**: Navigate to the exam in dashboard
4. **User B**: Click "Study" button
5. **Expected**: User B sees the course content without 403 error

### Verification
Check the browser console (should see):
```
📚 Fetching course for exam: {exam_id}
📚 Response status: 200
📚 Course data loaded: {...}
```

## Security Considerations

### RLS Still Enforced
- Users can only view courses for exams they have explicit access to
- Database-level security prevents unauthorized access
- No data leakage between unrelated users

### Course Generation Permissions
While shared users can VIEW courses, only exam owners can GENERATE new courses. This prevents:
- Unnecessary AI API costs from shared users
- Potential abuse/spam
- Confusion about course ownership

If you want to allow shared users to generate courses, add this to `/api/generate-course/route.ts`:
```typescript
// Allow course generation if user is owner OR has shared access
if (!isOwner && !isShared) {
  return NextResponse.json({
    error: 'Only exam owners and shared users can generate courses'
  }, { status: 403 });
}
```

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `app/api/courses/[exam_id]/route.ts` | Added `exam_shares` check | Allow shared users to fetch course |
| `app/api/generate-course/route.ts` | Added `exam_shares` check | Allow shared users to generate course (optional) |
| `008_fix_course_sections_rls_for_sharing.sql` | Updated RLS policies | Database-level permission for shared access |

## Migration Instructions

1. **Apply the migration** in Supabase SQL Editor:
   ```bash
   # Copy and run the contents of:
   supabase/migrations/008_fix_course_sections_rls_for_sharing.sql
   ```

2. **Verify RLS policies** are updated:
   ```sql
   SELECT tablename, policyname
   FROM pg_policies
   WHERE tablename IN ('ai_generated_course_sections', 'ai_detected_topics');
   ```

3. **Test with a shared exam** as described in "Testing the Fix" above.

## Future Enhancements

### Allow Shared Users to Generate Courses
Current behavior: Only exam owner can generate courses
Enhancement: Allow shared users to also generate courses

**Implementation:**
- Remove the owner-only restriction in `/api/generate-course/route.ts`
- Update regeneration logic to track who generated the course
- Add UI to show "Generated by [user]" attribution

### Per-User Course Preferences
Current behavior: Single course shared across all users
Enhancement: Allow users to have personalized course views

**Implementation:**
- Add `user_id` column to `ai_generated_course_sections`
- Store different course versions per user
- UI toggle to switch between "Original" and "My Version"

## Troubleshooting

### Still Getting 403 Error
1. Verify migration was applied successfully
2. Check `exam_shares` table has the sharing record
3. Verify user authentication is working
4. Check browser console for detailed error messages

### Course Not Loading
1. Ensure course was generated by the exam owner first
2. Check `ai_generated_course_sections` table has data for the exam
3. Verify exam_id matches between exam and course sections
