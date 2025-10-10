# Exam Sharing Feature - Setup Guide

This guide explains how to enable the true exam sharing functionality (approach #1) that allows users to share exams without duplication.

## Architecture Overview

The sharing system uses a **reference-based approach** where:
- Original exam remains owned by the creator
- Share records track who has access
- No data duplication
- RLS policies enforce access control

## Database Setup

### Step 1: Run Migration 001 (if not already done)

Execute `supabase/migrations/001_exam_sharing.sql` in your Supabase SQL Editor:

```sql
-- This creates:
-- 1. exam_shares table with RLS policies
-- 2. Updated RLS policy on exams table to include shared exams
```

### Step 2: Run Migration 002 (Required)

Execute `supabase/migrations/002_user_lookup_function.sql` in your Supabase SQL Editor:

```sql
-- This creates:
-- get_user_id_by_email() function
-- Allows authenticated users to lookup other users by email for sharing
```

**Important**: This function uses `SECURITY DEFINER` to access the `auth.users` table safely. It only returns user IDs, not sensitive data.

## Features Implemented

### 1. API Endpoints

#### Share an Exam
```
POST /api/share/exam
Body: { examId: string, targetUserEmail: string }
```
- Validates exam ownership
- Looks up target user by email
- Creates share record
- Prevents duplicate shares

#### Unshare an Exam
```
DELETE /api/share/exam?shareId=xxx
```
- Removes sharing access
- Only owner can unshare

#### List Shares
```
GET /api/share/list
```
Returns:
- `sharesGiven`: Exams you've shared with others
- `sharesReceived`: Exams shared with you

### 2. UI Components

#### ShareExamModal Component
Location: `components/share/ShareExamModal.tsx`

Features:
- Share exam by email input
- View current shares
- Remove share access
- Success/error notifications
- Loading states

#### Updated Home Page
Location: `app/page.tsx`

Features:
- Share button on owned exams
- "Shared" badge on received exams
- "Sample" badge for sample exams
- Modal integration

### 3. TypeScript Types

Added to `lib/supabaseClient.ts`:
- `ExamShare`: Share record type
- `ExamWithSharing`: Exam with sharing metadata

### 4. Updated Exam API

The `/api/exams` endpoint now:
- Includes sharing information in queries
- Adds `is_shared_with_me` flag to each exam
- RLS automatically includes shared exams

## Usage Flow

### Sharing an Exam

1. User goes to home page
2. Clicks share icon on their exam
3. Modal opens
4. Enters target user email
5. Clicks "Share Exam"
6. Target user now sees exam with "Shared" badge

### Receiving a Shared Exam

1. Exam appears in user's library automatically (thanks to RLS)
2. Shows "Shared" badge
3. User can take exam normally
4. Cannot modify or share it further (not the owner)

### Unsharing an Exam

1. Owner clicks share icon again
2. Sees list of current shares
3. Clicks trash icon next to share
4. Share is removed
5. Recipient loses access immediately

## Security Considerations

### Row Level Security (RLS)

1. **exam_shares table**:
   - Users can view shares involving them (as sharer or recipient)
   - Only sharers can create shares
   - Only sharers can delete their shares

2. **exams table**:
   - Users can view: own exams + sample exams + shared exams
   - Users can only modify/delete their own exams

3. **User Lookup Function**:
   - Uses `SECURITY DEFINER` to access auth.users
   - Only returns user ID (no sensitive data)
   - Available to authenticated users only

## Differences from Copying Approach

| Feature | Copying (Old) | Sharing (New) |
|---------|--------------|---------------|
| Data Storage | Duplicates entire exam | References original |
| Updates | Independent copies | Single source of truth |
| Ownership | Both users own separate copies | Original owner only |
| Who Can Use | Admin only | Any user |
| Database Impact | High (duplicate questions) | Low (one record per share) |

## Testing Checklist

- [ ] Run both migrations in Supabase
- [ ] Create exam as User A
- [ ] Share exam with User B's email
- [ ] Verify User B sees exam with "Shared" badge
- [ ] Verify User B can take the exam
- [ ] Verify User B cannot share or delete it
- [ ] Verify User A can unshare
- [ ] Verify User B loses access after unshare
- [ ] Test error: share with non-existent email
- [ ] Test error: duplicate share

## Troubleshooting

### "User not found" error
**Cause**: Target user hasn't registered yet.
**Solution**: They must create an account first.

### "Permission denied" on RPC call
**Cause**: Migration 002 not run.
**Solution**: Execute `002_user_lookup_function.sql` in SQL Editor.

### Shared exams not appearing
**Cause**: Migration 001 RLS policy not applied.
**Solution**: Verify the exam view policy includes the EXISTS clause for exam_shares.

### Cannot see share button
**Cause**: User doesn't own the exam or it's a sample.
**Solution**: Only exam owners see share buttons, and sample exams can't be shared.

## Future Enhancements

Potential additions:
- [ ] Email notifications when exam is shared
- [ ] Share with multiple users at once
- [ ] Share with expiration dates
- [ ] Share analytics (who took it, scores)
- [ ] Share groups/classes
- [ ] Public share links (with tokens)
- [ ] Permission levels (view-only vs can-edit)

## Migration from Copying to Sharing

If you have existing copied exams:
1. They will continue to work as separate exams
2. No automatic migration needed
3. Future shares will use the new system
4. Old copied exams remain independent

## API Reference

### POST /api/share/exam

**Request**:
```json
{
  "examId": "uuid-here",
  "targetUserEmail": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Exam 'My Exam' successfully shared with user@example.com",
  "share": {
    "id": "share-uuid",
    "exam_id": "exam-uuid",
    "shared_by": "user1-uuid",
    "shared_with": "user2-uuid",
    "created_at": "2025-10-10T..."
  }
}
```

**Error Responses**:
- 401: Unauthorized
- 403: Not exam owner
- 404: User or exam not found
- 400: Already shared / Missing parameters

### DELETE /api/share/exam

**Request**: `?shareId=uuid-here`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Share removed successfully"
}
```

### GET /api/share/list

**Success Response** (200):
```json
{
  "success": true,
  "sharesGiven": [
    {
      "id": "share-uuid",
      "exam_id": "exam-uuid",
      "shared_by": "your-uuid",
      "shared_with": "other-uuid",
      "created_at": "...",
      "exams": {
        "id": "exam-uuid",
        "name": "Exam Name",
        "description": "..."
      }
    }
  ],
  "sharesReceived": [/* similar structure */]
}
```
