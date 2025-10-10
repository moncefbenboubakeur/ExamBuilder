# Study Progress Persistence - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Study Mode Component                                         │  │
│  │  - Displays topics with progress indicators                   │  │
│  │  - Shows completion percentage                                │  │
│  │  - "Resume where left off" button                             │  │
│  │  - "Mark as complete" toggles                                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │ │ │                                   │
│                              │ │ │                                   │
│                              ▼ ▼ ▼                                   │
└─────────────────────────────────────────────────────────────────────┘
                               │ │ │
                    ┌──────────┘ │ └──────────┐
                    │            │            │
                    ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ POST         │  │ GET          │  │ GET (enhanced)           │  │
│  │ /api/study/  │  │ /api/study/  │  │ /api/courses/            │  │
│  │ progress     │  │ progress/    │  │ [exam_id]                │  │
│  │              │  │ [exam_id]    │  │                          │  │
│  │ - Validates  │  │ - Gets all   │  │ - Loads course           │  │
│  │   auth       │  │   progress   │  │ - Loads progress         │  │
│  │ - Verifies   │  │ - Calculates │  │ - Merges data            │  │
│  │   access     │  │   statistics │  │ - Returns combined       │  │
│  │ - UPSERT     │  │ - Returns    │  │                          │  │
│  │   progress   │  │   with stats │  │                          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│         │                  │                      │                  │
│         └──────────────────┼──────────────────────┘                  │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE CLIENT LAYER                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  createClient() from @/lib/supabase-server.ts                │   │
│  │  - Server-side Supabase client                               │   │
│  │  - Handles authentication via cookies                        │   │
│  │  - Provides type-safe database access                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  study_progress table                                         │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │ id              uuid PRIMARY KEY                         │ │  │
│  │  │ user_id         uuid → auth.users(id)                    │ │  │
│  │  │ exam_id         uuid → exams(id)                         │ │  │
│  │  │ topic_name      text                                     │ │  │
│  │  │ completed       boolean                                  │ │  │
│  │  │ last_visited_at timestamptz                              │ │  │
│  │  │ created_at      timestamptz                              │ │  │
│  │  │                                                           │ │  │
│  │  │ UNIQUE(user_id, exam_id, topic_name)                     │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │  Indexes:                                                     │  │
│  │  - idx_study_progress_user_exam (user_id, exam_id)           │  │
│  │  - idx_study_progress_exam (exam_id)                         │  │
│  │  - idx_study_progress_completed (user_id, exam_id, completed)│  │
│  │                                                               │  │
│  │  RLS Policies:                                                │  │
│  │  - SELECT: auth.uid() = user_id                              │  │
│  │  - INSERT: auth.uid() = user_id                              │  │
│  │  - UPDATE: auth.uid() = user_id                              │  │
│  │  - DELETE: auth.uid() = user_id                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Related Tables:                                                     │
│  ┌────────────┐  ┌─────────────────────┐  ┌──────────────────────┐ │
│  │ auth.users │  │ exams               │  │ ai_generated_        │ │
│  │            │  │                     │  │ course_sections      │ │
│  │ ← user_id  │  │ ← exam_id           │  │                      │ │
│  └────────────┘  └─────────────────────┘  │ - topic_name matches │ │
│                                            │   for linking        │ │
│                                            └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequences

### 1. User Visits Topic (Auto-tracking)

```
User opens topic
      │
      ▼
Frontend detects topic view
      │
      ▼
POST /api/study/progress
  { exam_id, topic_name, completed: false }
      │
      ▼
API validates auth & access
      │
      ▼
UPSERT to study_progress
  - Creates if new
  - Updates last_visited_at if exists
      │
      ▼
Returns success { data: {...} }
      │
      ▼
Frontend updates UI (optional visual feedback)
```

### 2. User Marks Topic Complete

```
User clicks "Mark Complete"
      │
      ▼
Frontend toggles state
      │
      ▼
POST /api/study/progress
  { exam_id, topic_name, completed: true }
      │
      ▼
API validates auth & access
      │
      ▼
UPSERT to study_progress
  - Updates completed = true
  - Updates last_visited_at
      │
      ▼
Returns success { data: {...} }
      │
      ▼
Frontend shows checkmark/badge
Frontend updates completion percentage
```

### 3. Load Course with Progress

```
User navigates to course page
      │
      ▼
GET /api/courses/[exam_id]
      │
      ▼
API validates auth & access
      │
      ├─────────────────────┬──────────────────────┐
      │                     │                      │
      ▼                     ▼                      ▼
Load course sections    Load progress        Calculate stats
      │                     │                      │
      ▼                     ▼                      ▼
FROM course_sections  FROM study_progress   COUNT completed
ORDER BY order_index  WHERE user & exam     COUNT total
      │                     │                 CALC percentage
      │                     │                      │
      └─────────────────────┴──────────────────────┘
                            │
                            ▼
      Merge data: { sections, progress, statistics }
                            │
                            ▼
      Frontend renders course with progress indicators
```

### 4. Resume Study Session

```
User clicks "Resume"
      │
      ▼
GET /api/study/progress/[exam_id]
      │
      ▼
API validates auth & access
      │
      ▼
Query study_progress
  WHERE user_id & exam_id
  ORDER BY last_visited_at DESC
      │
      ▼
Calculate statistics
  - total_topics
  - completed_topics
  - completion_percentage
  - last_visited_topic (first in list)
      │
      ▼
Return { progress[], statistics }
      │
      ▼
Frontend navigates to last_visited_topic
```

## Security Architecture

### Authentication Flow

```
┌─────────────┐
│   Browser   │
│   Cookie:   │
│ sb-auth-... │
└──────┬──────┘
       │
       ▼
┌────────────────────────────┐
│  Next.js Middleware        │
│  - Validates session       │
│  - Sets user context       │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│  API Route Handler         │
│  - Gets user from session  │
│  - Returns 401 if invalid  │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│  Authorization Check       │
│  - Is owner?               │
│  - Is sample?              │
│  - Is shared?              │
│  - Returns 403 if denied   │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│  Supabase Query            │
│  - RLS automatically       │
│    filters by auth.uid()   │
│  - Only user's data        │
│    returned/modified       │
└────────────────────────────┘
```

### Row Level Security (RLS)

```sql
-- Automatic enforcement at database level

SELECT * FROM study_progress;
-- Implicitly becomes:
SELECT * FROM study_progress
WHERE user_id = auth.uid();

INSERT INTO study_progress (...);
-- Checked:
IF auth.uid() = inserted_user_id THEN
  ALLOW
ELSE
  DENY
END IF;
```

## Performance Optimizations

### Database Indexes

```
study_progress table
├── idx_study_progress_user_exam (user_id, exam_id)
│   └── Optimizes: Loading all progress for user's exam
├── idx_study_progress_exam (exam_id)
│   └── Optimizes: Counting topics per exam
└── idx_study_progress_completed (user_id, exam_id, completed)
    └── Optimizes: Filtering completed topics
```

### Query Patterns

**Efficient** ✅:
```sql
-- Single query with compound index
SELECT * FROM study_progress
WHERE user_id = $1 AND exam_id = $2;
```

**Inefficient** ❌ (avoided):
```sql
-- Multiple separate queries
SELECT * FROM study_progress WHERE user_id = $1;
-- Then filter by exam_id in application code
```

### UPSERT Optimization

**Single Operation** instead of:
```sql
-- ❌ Old approach: SELECT then INSERT or UPDATE
SELECT * FROM study_progress WHERE ...;
IF found THEN
  UPDATE ...;
ELSE
  INSERT ...;
END IF;
```

**✅ Optimized with UPSERT**:
```sql
INSERT INTO study_progress (...)
VALUES (...)
ON CONFLICT (user_id, exam_id, topic_name)
DO UPDATE SET
  last_visited_at = EXCLUDED.last_visited_at,
  completed = EXCLUDED.completed;
```

## Type Safety Architecture

### Type Definitions Flow

```
Database Schema (PostgreSQL)
      │
      ▼
TypeScript Types (lib/supabaseClient.ts)
      │
      ├─────────────────────┬──────────────────┐
      │                     │                  │
      ▼                     ▼                  ▼
API Routes            Components         Utility Functions
(compile-time types)  (props typing)    (param typing)
```

### Type Hierarchy

```typescript
// Base types
StudyProgress → database table structure

// Derived types
TopicProgress → subset for UI (topic_name, completed, last_visited_at)

// Computed types
StudyProgressStatistics → calculated from StudyProgress[]

// Composite types
CourseData {
  topics: TopicData[]
  sections: SectionData[]
  progress?: TopicProgress[]      // ← integrated
  statistics?: Statistics          // ← integrated
}
```

## Scalability Considerations

### Current Capacity

- **Records per user**: Unlimited (one per topic per exam)
- **Concurrent users**: Limited by Supabase plan
- **Query performance**: O(log n) with indexes
- **Storage**: Minimal (~500 bytes per progress record)

### Bottlenecks to Watch

1. **Write-heavy workload**
   - Each topic visit = 1 write
   - Solution: Client-side throttling (don't write on every scroll)

2. **Large course catalogs**
   - 1000+ topics per exam = 1000+ progress records
   - Solution: Pagination if displaying all progress

3. **Statistics calculation**
   - Currently done per request
   - Solution: Cache statistics or use materialized view

### Recommended Limits

- **Topics per exam**: < 1000 (performance remains good)
- **Progress updates**: < 10 per minute per user (throttle on frontend)
- **Concurrent API calls**: No specific limit (handled by Vercel/Supabase)

## Error Handling Strategy

```
┌─────────────────┐
│  API Request    │
└────────┬────────┘
         │
         ▼
    ┌────────────┐      ┌──────────────┐
    │ Auth Check │─NO──→│ 401 Response │
    └────┬───────┘      └──────────────┘
         │YES
         ▼
    ┌────────────┐      ┌──────────────┐
    │Input Valid?│─NO──→│ 400 Response │
    └────┬───────┘      └──────────────┘
         │YES
         ▼
    ┌────────────┐      ┌──────────────┐
    │Exam Exists?│─NO──→│ 404 Response │
    └────┬───────┘      └──────────────┘
         │YES
         ▼
    ┌────────────┐      ┌──────────────┐
    │Has Access? │─NO──→│ 403 Response │
    └────┬───────┘      └──────────────┘
         │YES
         ▼
    ┌────────────┐      ┌──────────────┐
    │ DB Query   │─ERR─→│ 500 Response │
    └────┬───────┘      │  + Log error │
         │OK            └──────────────┘
         ▼
    ┌────────────┐
    │200 Response│
    │  + Data    │
    └────────────┘
```

## Integration Points

### Existing Systems

```
Study Progress System
      ├── Integrates with: Exam System (exam_id foreign key)
      ├── Integrates with: Auth System (user_id foreign key)
      ├── Integrates with: Course System (topic_name linking)
      └── Integrates with: Sharing System (checks exam_shares)
```

### Future Extensions

Possible enhancements:

1. **Time Tracking**
   ```sql
   ALTER TABLE study_progress
   ADD COLUMN time_spent_seconds INTEGER DEFAULT 0;
   ```

2. **Notes/Bookmarks**
   ```sql
   ALTER TABLE study_progress
   ADD COLUMN notes TEXT,
   ADD COLUMN bookmarked BOOLEAN DEFAULT false;
   ```

3. **Quiz Results**
   ```sql
   CREATE TABLE topic_quiz_results (
     id uuid PRIMARY KEY,
     progress_id uuid REFERENCES study_progress(id),
     score INTEGER,
     ...
   );
   ```

## Summary

This architecture provides:

✅ **Scalable**: Indexed queries, efficient UPSERT operations
✅ **Secure**: Multi-layer security (RLS + API checks)
✅ **Type-Safe**: End-to-end TypeScript typing
✅ **Maintainable**: Clear separation of concerns
✅ **Performant**: Optimized queries and caching strategy
✅ **Extensible**: Easy to add features without breaking changes

**Status**: Production-ready backend infrastructure
