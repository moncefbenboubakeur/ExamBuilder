# Real-Time Course Generation Architecture

## Overview

This document describes the architecture for real-time progress tracking of AI course generation in the ExamBuilder.net platform. The system provides users with live updates during the 20-60 second generation process, handles connection drops gracefully, supports cancellation, and scales with Vercel's serverless infrastructure.

## Architecture Decision: Server-Sent Events (SSE)

### Why SSE?

We chose Server-Sent Events over WebSockets and polling for the following reasons:

1. **Vercel Compatibility**: Works perfectly with Vercel's serverless functions (WebSockets require persistent connections)
2. **Simplicity**: Native browser support with automatic reconnection
3. **One-way Communication**: Perfect for progress updates (server → client)
4. **HTTP-based**: Works through firewalls and proxies
5. **No Additional Infrastructure**: No Redis or message queue needed
6. **Built-in Features**: Automatic reconnection, event types, last-event-id support

### Alternatives Considered

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **WebSocket** | Bi-directional, real-time | Requires persistent connections, complex on serverless | ❌ Not suitable for Vercel |
| **Polling** | Simple, universal support | Inefficient, high latency, database load | ❌ Poor user experience |
| **Next.js Streaming** | Built-in to Next.js | Complex to implement progress updates | ❌ Harder to maintain |
| **SSE** | Simple, efficient, Vercel-compatible | One-way only (sufficient for our use case) | ✅ **Selected** |

## System Components

### 1. Database Schema

**Table: `course_generation_jobs`**

```sql
CREATE TABLE course_generation_jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  exam_id UUID REFERENCES exams(id),

  -- Status tracking
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),

  -- Progress tracking
  current_step TEXT,
  current_step_index INTEGER,
  total_steps INTEGER,
  current_topic TEXT,
  current_topic_index INTEGER,
  total_topics INTEGER,

  -- Flexible progress data (JSONB)
  progress_data JSONB,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Results
  course_id UUID REFERENCES courses(id),

  -- Timestamps
  created_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);
```

**Key Features:**
- ✅ Tracks granular progress (steps, topics)
- ✅ Stores flexible progress data in JSONB
- ✅ Supports job resumption (failed jobs can be retried)
- ✅ Automatic cleanup of old jobs (24-hour retention)
- ✅ Row Level Security policies for user isolation

### 2. API Endpoints

#### POST `/api/generation/start`
**Purpose**: Create a generation job and trigger background processing

**Request**:
```json
{
  "examId": "uuid"
}
```

**Response**:
```json
{
  "jobId": "uuid",
  "status": "pending",
  "streamUrl": "/api/generation/stream/{jobId}"
}
```

**Behavior**:
1. Authenticates user
2. Validates exam exists
3. Checks for existing active jobs
4. Creates new job record
5. Triggers background generation (fire-and-forget)
6. Returns immediately with job ID

---

#### GET `/api/generation/stream/[jobId]`
**Purpose**: SSE stream for real-time progress updates

**Headers**:
```
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
```

**Event Types**:
- `job_created`: Job initialized
- `step_started`: New step started
- `step_progress`: Progress within current step
- `step_completed`: Step finished
- `topic_started`: New topic generation started
- `topic_progress`: Progress on current topic
- `topic_completed`: Topic finished
- `job_completed`: Entire job finished successfully
- `job_failed`: Job failed with error
- `job_cancelled`: Job cancelled by user

**Example Event**:
```
event: step_progress
data: {"type":"step_progress","jobId":"...","step":"generate_lessons","progress":45,"message":"Generating lessons for: Authentication (2/5)"}

event: job_completed
data: {"type":"job_completed","jobId":"...","courseId":"...","totalDuration":45000,"topicsGenerated":5,"lessonsGenerated":15}
```

**Connection Management**:
- Heartbeat every 15 seconds to keep connection alive
- Uses Supabase Realtime to watch database changes
- Automatically closes when job completes/fails/cancelled
- Client auto-reconnects on connection loss (with exponential backoff)

---

#### POST `/api/generation/process`
**Purpose**: Internal endpoint that performs the actual generation

**Security**: Only accepts requests with `X-Internal-Request: true` header

**Process Flow**:
1. Validates job exists
2. Updates status to 'running'
3. Executes generation steps sequentially:
   - Fetch AI settings
   - Fetch questions
   - Detect topics (AI call ~20s)
   - Generate lessons for each topic (AI calls ~30s per topic)
   - Save to database
4. Updates database after each step
5. Checks for cancellation between steps
6. Handles errors and updates job status

**Error Handling**:
- Catches all errors and marks job as 'failed'
- Stores error details in `error_details` JSONB
- Records which step failed in `current_step`

---

#### POST `/api/generation/cancel`
**Purpose**: Cancel an in-progress generation

**Request**:
```json
{
  "jobId": "uuid",
  "reason": "User cancelled" // optional
}
```

**Response**:
```json
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

**Behavior**:
- Updates job status to 'cancelled'
- Process endpoint checks `isCancelled()` between steps
- SSE stream sends cancellation event to client

---

#### GET `/api/generation/status/[jobId]`
**Purpose**: Get current job status (polling fallback)

**Response**:
```json
{
  "job": { /* CourseGenerationJob object */ },
  "canResume": false
}
```

### 3. Frontend Components

#### Hook: `useGenerationProgress`

Custom React hook that manages SSE connection and state.

**Features**:
- Connects to SSE stream automatically
- Manages connection state and reconnection
- Parses and processes all event types
- Provides callbacks for completion/error/cancellation
- Auto-reconnects with exponential backoff (max 3 attempts)
- Handles connection cleanup on unmount

**Usage**:
```typescript
const { progress, cancelJob, reconnect, disconnect } = useGenerationProgress({
  jobId,
  onComplete: (courseId) => router.push(`/study/${examId}?courseId=${courseId}`),
  onError: (error) => console.error(error),
  onCancel: () => console.log('Cancelled'),
  autoReconnect: true,
  maxReconnectAttempts: 3,
});
```

**State**:
```typescript
{
  jobId: string | null,
  status: JobStatus,
  currentStep: string | null,
  currentStepIndex: number,
  totalSteps: number,
  currentTopic: string | null,
  currentTopicIndex: number,
  totalTopics: number,
  progress: number, // 0-100
  message: string,
  error: string | null,
  courseId: string | null,
  isConnected: boolean,
  events: GenerationProgressEvent[]
}
```

---

#### Component: `GenerationProgressModal`

Modal UI that displays generation progress to the user.

**Features**:
- Real-time progress bar (0-100%)
- Current step/topic indicator
- Step-by-step progress visualization
- Connection status indicator
- Cancel button (with confirmation)
- Error display
- Auto-redirect on completion
- Handles connection loss gracefully

**UI Elements**:
1. **Progress Bar**: Overall percentage completion
2. **Status Message**: Human-readable current action
3. **Step List**: Visual checklist of all steps (pending/in-progress/completed)
4. **Topic Progress**: Shows current topic being generated
5. **Connection Indicator**: Green dot when connected
6. **Action Buttons**: Cancel (during generation), Close (after completion)

## Data Flow

### Sequence Diagram: Successful Generation

```
User → Frontend: Click "Generate Course"
Frontend → /api/generation/start: POST { examId }
/api/generation/start → Database: Create job record
/api/generation/start → /api/generation/process: Trigger async (fire-and-forget)
/api/generation/start → Frontend: Return { jobId, streamUrl }

Frontend → /api/generation/stream/[jobId]: Connect SSE
/api/generation/stream → Supabase Realtime: Subscribe to job updates
/api/generation/stream → Frontend: Send current state

/api/generation/process → Database: Update status = 'running'
Database → Supabase Realtime: Broadcast change
Supabase Realtime → /api/generation/stream: Notify
/api/generation/stream → Frontend: event: step_progress

/api/generation/process: Execute steps (fetch settings, questions, etc.)
... (repeat for each step)

/api/generation/process → Anthropic API: Detect topics
/api/generation/process → Database: Update progress (topics detected)
Database → Supabase Realtime → Frontend: event: step_progress

/api/generation/process: Loop through topics
  For each topic:
    /api/generation/process → Database: Update current_topic
    Database → Supabase Realtime → Frontend: event: topic_started
    /api/generation/process → Anthropic API: Generate lesson
    /api/generation/process → Database: Update progress
    Database → Supabase Realtime → Frontend: event: topic_progress

/api/generation/process → Database: Save course & lessons
/api/generation/process → Database: Update status = 'completed', course_id
Database → Supabase Realtime → Frontend: event: job_completed

Frontend: Redirect to course page
```

### Sequence Diagram: Cancellation

```
User → Frontend: Click "Cancel"
Frontend → /api/generation/cancel: POST { jobId, reason }
/api/generation/cancel → Database: Update status = 'cancelled'
Database → Supabase Realtime → Frontend: event: job_cancelled

/api/generation/process: Check isCancelled() → true
/api/generation/process: Stop execution, exit cleanly
```

### Sequence Diagram: Error Handling

```
/api/generation/process: Execute step
/api/generation/process: Error occurs (e.g., AI API fails)
/api/generation/process: Catch error
/api/generation/process → Database: Update status = 'failed', error details
Database → Supabase Realtime → Frontend: event: job_failed

Frontend: Display error message
Frontend: Allow retry or close
```

## Scalability Considerations

### Concurrent Requests

**Challenge**: Multiple users generating courses simultaneously

**Solution**:
- Each job is independent (isolated by user_id via RLS)
- Supabase handles concurrent database writes
- Each SSE connection is a separate serverless function instance
- No shared state between jobs
- Database indexes on `user_id`, `exam_id`, `status` for fast queries

**Limits**:
- Vercel function concurrency: 1000 concurrent executions (Pro plan)
- Supabase Realtime: 500 concurrent connections (Pro plan)
- Can scale horizontally by adding more Vercel regions

### Long-Running Jobs

**Challenge**: Generation can take 20-60 seconds

**Solution**:
- Async processing pattern (start endpoint returns immediately)
- SSE stream keeps connection alive with heartbeats
- `maxDuration = 300` seconds (5 minutes) for process endpoint
- Vercel Pro supports up to 300s execution time
- Progress persisted in database (survives function restarts)

### Connection Reliability

**Challenge**: Network issues, tab switching, mobile backgrounds

**Solution**:
- SSE auto-reconnects on connection loss
- Client-side reconnection logic with exponential backoff
- Server sends heartbeat every 15 seconds
- Progress state stored in database (reconnect picks up from current state)
- User can close modal and reconnect later (job continues)

### Database Load

**Challenge**: Frequent progress updates hit database

**Solution**:
- Updates only write changed fields (not full record)
- `last_updated_at` uses database timestamp (no round-trip)
- Supabase Realtime efficiently broadcasts changes
- Indexes on frequently queried fields (`status`, `user_id`)
- Old jobs cleaned up after 24 hours (reduce table size)

## Error Handling & Edge Cases

### Network Disconnection

**Frontend**:
1. Detects disconnection via SSE `onerror`
2. Shows "Connection Lost" warning
3. Attempts auto-reconnection (up to 3 times, exponential backoff)
4. Allows manual "Retry Now" button
5. Reconnects to same job (state preserved in database)

**Backend**:
- Job continues processing regardless of client connection
- Progress updates written to database
- When client reconnects, SSE sends current state immediately

### Server Restart

**Scenario**: Vercel function restarts mid-generation

**Mitigation**:
- Job status remains in database
- Frontend shows "Connection Lost"
- New function instance picks up job on reconnection
- **Limitation**: Current step may need to retry (AI calls are not idempotent)
- **Future Enhancement**: Implement resumable generation from last completed step

### User Closes Browser

**Behavior**:
- SSE connection closes
- Job continues processing in background
- User can return later and check job status via `/api/generation/status/[jobId]`
- **Future Enhancement**: Add "Resume" button in UI for incomplete jobs

### Duplicate Job Prevention

**Check**: Before creating new job
**Logic**: Query for existing jobs with same `exam_id` + `user_id` + `status IN ('pending', 'running')`
**Action**: If found, return existing job ID (don't create duplicate)

### AI API Failures

**Detection**: Catch errors from Anthropic API calls
**Action**:
1. Mark job as 'failed'
2. Store error details in `error_details` JSONB
3. Record failed step in `current_step`
4. Send `job_failed` event to client

**User Experience**:
- Error message displayed in modal
- "Close" button to dismiss
- **Future Enhancement**: "Retry" button to restart from failed step

### Timeout Handling

**Vercel Limits**:
- Pro plan: 300 seconds max execution time
- If exceeded, function terminates

**Mitigation**:
- Estimated generation time: 20-60 seconds (well under limit)
- If topic count is very high, consider batch processing
- **Future Enhancement**: Add timeout warning if approaching limit

## Performance Optimizations

### Database Queries

1. **Indexes**: Created on `user_id`, `exam_id`, `status`, `created_at`
2. **RLS Policies**: Use indexed columns in WHERE clauses
3. **Select Specific Fields**: Don't SELECT * unnecessarily
4. **Batch Inserts**: Insert all lessons in single query

### AI API Calls

1. **Parallel Topic Detection**: Single AI call for all topics
2. **Streaming Responses**: (Future) Use Anthropic streaming for real-time token updates
3. **Caching**: (Future) Cache topic detection for similar exams
4. **Rate Limiting**: (Future) Queue jobs if AI API rate limit reached

### Frontend

1. **Event Batching**: Group rapid progress updates (debounce 100ms)
2. **Component Memoization**: Use React.memo for static UI elements
3. **Lazy Loading**: Modal only renders when jobId is set
4. **SSE Cleanup**: Properly close connections on unmount

### Network

1. **SSE Compression**: Enable gzip for event stream (automatic via Vercel)
2. **Heartbeat Interval**: 15 seconds (balance between keep-alive and bandwidth)
3. **Event Size**: Keep event payloads small (< 1KB)

## Security Considerations

### Authentication

- All endpoints require authenticated user (`supabase.auth.getUser()`)
- SSE stream validates user owns job before streaming
- RLS policies enforce user isolation in database

### Authorization

- Users can only view/cancel their own jobs
- `/api/generation/process` is internal-only (`X-Internal-Request` header)
- Job creation validates exam ownership

### Input Validation

- `examId` validated against user's exams
- `jobId` validated as UUID format
- SQL injection prevented via Supabase parameterized queries

### Rate Limiting

**Current**: None (trust Vercel's default limits)

**Future Enhancements**:
- Per-user generation limits (e.g., 5 concurrent jobs max)
- Cooldown period between generations (e.g., 1 minute)
- Track in `ai_settings` table or separate `rate_limits` table

### Data Privacy

- Job data isolated per user via RLS
- Error details sanitized before returning to client
- Old jobs auto-deleted after 24 hours (GDPR compliance)

## Monitoring & Observability

### Logging

**Current**:
- Console logs in API routes
- Client-side SSE event logging (development mode)

**Recommended**:
- Structured logging with correlation IDs (job_id)
- Error tracking with Sentry or similar
- Log aggregation for debugging (Vercel logs, Datadog, etc.)

### Metrics

**Suggested Metrics**:
- Generation duration (P50, P95, P99)
- Failure rate by step
- Cancellation rate
- SSE connection duration
- Reconnection attempts

### Alerting

**Suggested Alerts**:
- Failure rate > 10% (AI API issues)
- Average duration > 90 seconds (performance degradation)
- Database query time > 1 second (index issues)

## Future Enhancements

### 1. Job Resumption

**Feature**: Retry failed jobs from last completed step

**Implementation**:
- Store completed steps in `progress_data` JSONB
- Add `/api/generation/resume` endpoint
- Skip completed steps, start from failed step
- Reuse detected topics/questions from previous attempt

### 2. Job Queue

**Feature**: Handle high concurrent load with queue

**Implementation**:
- Add `queued_at` timestamp to jobs
- Process jobs FIFO when AI API rate limit reached
- Show queue position to user ("Position: 3 in queue")
- Use database-backed queue (no external dependencies)

### 3. Progress Estimation

**Feature**: More accurate time estimates

**Implementation**:
- Track historical generation times per topic count
- Store in `ai_settings` or separate `generation_stats` table
- Display "Estimated: 45 seconds" based on similar jobs
- Update estimate in real-time as steps complete

### 4. Partial Results

**Feature**: Show generated lessons as they complete

**Implementation**:
- Add `lessons` relation to job record
- Insert lessons immediately after generation (not at end)
- Frontend polls or subscribes to lessons table
- Display "3 of 5 lessons completed" with preview

### 5. Background Jobs

**Feature**: Continue generation after user closes page

**Implementation**:
- Add "background mode" flag to job
- Send email/notification when complete
- Show "Resume watching" button in dashboard for background jobs

### 6. Streaming AI Responses

**Feature**: Show AI-generated content token-by-token

**Implementation**:
- Use Anthropic streaming API
- Stream tokens via SSE to frontend
- Render lesson content in real-time (typewriter effect)
- Improved perceived performance

## Testing Strategy

### Unit Tests

- `ProgressTracker` class methods
- Event type parsing and validation
- Progress calculation logic
- Step duration tracking

### Integration Tests

- API endpoint authentication/authorization
- Database CRUD operations
- SSE event emission
- Job lifecycle (create → process → complete)

### End-to-End Tests

- Full generation flow (Playwright/Cypress)
- SSE connection and reconnection
- Cancellation during various steps
- Error scenarios (AI API failure, network loss)

### Load Tests

- Concurrent generation requests (Artillery, k6)
- SSE connection limits
- Database query performance under load
- Vercel function scaling behavior

## Deployment Checklist

- [ ] Run database migration (`002_course_generation_jobs.sql`)
- [ ] Verify RLS policies are enabled
- [ ] Test SSE in production environment (Vercel limits differ from local)
- [ ] Configure Vercel function timeout (`maxDuration = 300`)
- [ ] Set up error tracking (Sentry DSN in environment variables)
- [ ] Enable database connection pooling (Supabase settings)
- [ ] Test on mobile devices (connection reliability)
- [ ] Verify cleanup function runs (24-hour job retention)
- [ ] Load test with expected concurrent users
- [ ] Monitor Vercel function metrics for first week

## Conclusion

This architecture provides a robust, scalable, and user-friendly real-time progress tracking system for AI course generation. By leveraging Server-Sent Events, Supabase Realtime, and Next.js serverless functions, we achieve:

✅ **Real-time updates** with low latency (< 1 second)
✅ **Graceful degradation** when connections fail
✅ **Scalability** to handle concurrent users
✅ **No additional infrastructure** (uses existing Supabase + Vercel)
✅ **Clean separation** of concerns (UI, API, database)
✅ **Extensible** for future enhancements (queuing, resumption, etc.)

The system is production-ready with clear paths for monitoring, testing, and future improvements.
