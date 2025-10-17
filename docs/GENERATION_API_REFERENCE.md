# Course Generation API Reference

Complete API documentation for the real-time course generation system.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
   - [POST /api/generation/start](#post-apigenerationstart)
   - [GET /api/generation/stream/[jobId]](#get-apigenerationstreamjobid)
   - [POST /api/generation/process](#post-apigenerationprocess)
   - [POST /api/generation/cancel](#post-apigenerationcancel)
   - [GET /api/generation/status/[jobId]](#get-apigenerationstatusjobid)
3. [Event Types](#event-types)
4. [Error Codes](#error-codes)
5. [Rate Limits](#rate-limits)
6. [Examples](#examples)

---

## Authentication

All endpoints require an authenticated user with a valid Supabase session.

### Authorization Header

```
Authorization: Bearer <supabase-access-token>
```

### Session Cookie

Alternatively, session is validated via Supabase cookie (Next.js middleware handles this automatically).

### Error Response (Unauthenticated)

```json
{
  "error": "Unauthorized"
}
```

**Status Code**: `401 Unauthorized`

---

## Endpoints

### POST /api/generation/start

Start a new course generation job.

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "examId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Body Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `examId` | string (UUID) | Yes | ID of the exam to generate course for |

#### Response

**Success (200 OK)**:
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "streamUrl": "/api/generation/stream/123e4567-e89b-12d3-a456-426614174000"
}
```

**Response Schema**:
| Field | Type | Description |
|-------|------|-------------|
| `jobId` | string (UUID) | Unique identifier for this generation job |
| `status` | string | Current job status: "pending" \| "running" |
| `streamUrl` | string | Relative URL to connect SSE stream |

**Existing Job (200 OK)**:
```json
{
  "jobId": "existing-job-uuid",
  "status": "running",
  "streamUrl": "/api/generation/stream/existing-job-uuid",
  "message": "Generation already in progress for this exam"
}
```

#### Error Responses

**Missing examId (400 Bad Request)**:
```json
{
  "error": "examId is required"
}
```

**Exam Not Found (404 Not Found)**:
```json
{
  "error": "Exam not found"
}
```

**Internal Error (500 Internal Server Error)**:
```json
{
  "error": "Failed to start generation"
}
```

#### Notes

- If a job already exists for this exam (status = pending/running), returns existing job instead of creating new one
- Job creation triggers background processing (fire-and-forget)
- Response returns immediately (does not wait for generation to complete)

---

### GET /api/generation/stream/[jobId]

Server-Sent Events (SSE) stream for real-time progress updates.

#### Request

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | string (UUID) | Yes | Job ID from /start endpoint |

**Example**:
```
GET /api/generation/stream/123e4567-e89b-12d3-a456-426614174000
```

#### Response

**Headers**:
```
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

**Body (SSE Format)**:
```
: Connected to job 123e4567-e89b-12d3-a456-426614174000

event: job_created
data: {"type":"job_created","timestamp":"2025-01-15T10:30:00.000Z","jobId":"123...","examId":"550...","estimatedDuration":60}

event: step_started
data: {"type":"step_started","timestamp":"2025-01-15T10:30:01.000Z","jobId":"123...","step":"fetch_settings","stepIndex":1,"totalSteps":7,"message":"Fetching AI settings..."}

event: step_progress
data: {"type":"step_progress","timestamp":"2025-01-15T10:30:15.000Z","jobId":"123...","step":"detect_topics","progress":35,"message":"Detecting topics with AI..."}

: heartbeat

event: job_completed
data: {"type":"job_completed","timestamp":"2025-01-15T10:31:30.000Z","jobId":"123...","courseId":"789...","totalDuration":90000,"topicsGenerated":5,"lessonsGenerated":15,"message":"Course generated successfully!"}
```

#### SSE Events

See [Event Types](#event-types) section for complete event reference.

#### Connection Management

- **Heartbeat**: Sent every 15 seconds as `: heartbeat\n\n`
- **Reconnection**: Client should reconnect on error (use EventSource built-in retry)
- **Closure**: Stream closes automatically when job completes/fails/cancelled

#### Error Responses

**Job Not Found (404 Not Found)**:
```
Job not found
```

**Forbidden (403 Forbidden)**:
```
Forbidden
```
*User does not own this job*

**Internal Error (500 Internal Server Error)**:
```
Internal Server Error
```

#### Notes

- Connection authenticated via Supabase session cookie
- Multiple clients can connect to same job (e.g., same user on multiple devices)
- Uses Supabase Realtime to efficiently broadcast database changes
- Stream automatically sends current job state on connection

---

### POST /api/generation/process

**Internal endpoint** - processes the actual course generation.

⚠️ **Not for direct client use** - called automatically by `/start` endpoint.

#### Request

**Headers**:
```
Content-Type: application/json
X-Internal-Request: true
```

**Body**:
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "examId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-uuid"
}
```

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "courseId": "789e4567-e89b-12d3-a456-426614174000",
  "jobId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Cancelled (200 OK)**:
```json
{
  "message": "Job cancelled"
}
```

**Error (500 Internal Server Error)**:
```json
{
  "error": "Error message here"
}
```

#### Processing Steps

1. Validate job exists
2. Update status to 'running'
3. Fetch AI settings
4. Fetch exam questions
5. Detect topics using AI (~20s)
6. Loop through topics:
   - Identify relevant questions
   - Generate lesson content (~30s per topic)
   - Check for cancellation
7. Save course and lessons to database
8. Update status to 'completed'

#### Error Handling

- All errors caught and job marked as 'failed'
- Error details stored in `error_details` JSONB field
- Failed step recorded in `current_step` field

#### Notes

- Maximum execution time: 300 seconds (Vercel Pro limit)
- Checks `isCancelled()` between each topic generation
- Updates database after each step (for progress tracking)

---

### POST /api/generation/cancel

Cancel an in-progress generation job.

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "reason": "User cancelled"
}
```

**Body Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobId` | string (UUID) | Yes | Job ID to cancel |
| `reason` | string | No | Optional reason for cancellation |

#### Response

**Success (200 OK)**:
```json
{
  "success": true,
  "message": "Job cancelled successfully"
}
```

**Cannot Cancel (200 OK)**:
```json
{
  "success": false,
  "message": "Cannot cancel job with status: completed"
}
```

#### Error Responses

**Missing jobId (400 Bad Request)**:
```json
{
  "error": "jobId is required"
}
```

**Job Not Found (404 Not Found)**:
```json
{
  "error": "Job not found"
}
```

**Forbidden (403 Forbidden)**:
```json
{
  "error": "Forbidden"
}
```
*User does not own this job*

**Internal Error (500 Internal Server Error)**:
```json
{
  "error": "Failed to cancel generation"
}
```

#### Notes

- Only jobs with status 'pending' or 'running' can be cancelled
- Cancellation updates database immediately
- Processing endpoint checks cancellation between steps
- SSE stream sends `job_cancelled` event to connected clients

---

### GET /api/generation/status/[jobId]

Get current status of a generation job (polling fallback).

#### Request

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `jobId` | string (UUID) | Yes | Job ID to query |

**Example**:
```
GET /api/generation/status/123e4567-e89b-12d3-a456-426614174000
```

#### Response

**Success (200 OK)**:
```json
{
  "job": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "user-uuid",
    "exam_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "running",
    "current_step": "generate_lessons",
    "current_step_index": 4,
    "total_steps": 7,
    "current_topic": "Authentication",
    "current_topic_index": 2,
    "total_topics": 5,
    "progress_data": {
      "topics": ["Networking", "Security", "Authentication", "Databases", "APIs"],
      "lessons_generated": 3
    },
    "error_message": null,
    "error_details": null,
    "course_id": null,
    "created_at": "2025-01-15T10:30:00.000Z",
    "started_at": "2025-01-15T10:30:01.000Z",
    "completed_at": null,
    "last_updated_at": "2025-01-15T10:30:45.000Z",
    "cancelled_at": null,
    "cancellation_reason": null
  },
  "canResume": false
}
```

**Response Schema**:
| Field | Type | Description |
|-------|------|-------------|
| `job` | object | Complete job record from database |
| `canResume` | boolean | Whether job can be resumed (if failed) |

#### Error Responses

**Job Not Found (404 Not Found)**:
```json
{
  "error": "Job not found"
}
```

**Forbidden (403 Forbidden)**:
```json
{
  "error": "Forbidden"
}
```

**Internal Error (500 Internal Server Error)**:
```json
{
  "error": "Failed to get job status"
}
```

#### Notes

- Use this for polling if SSE not available (mobile apps, etc.)
- Recommended polling interval: 2-5 seconds
- SSE stream is preferred for real-time updates
- `canResume` is `true` if status = 'failed' and not at final step

---

## Event Types

Complete reference of SSE events sent by `/stream/[jobId]` endpoint.

### job_created

**Sent when**: Job is initialized

**Data**:
```json
{
  "type": "job_created",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "examId": "550e8400-e29b-41d4-a716-446655440000",
  "estimatedDuration": 60
}
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `estimatedDuration` | number | Estimated completion time in seconds |

---

### step_started

**Sent when**: New generation step begins

**Data**:
```json
{
  "type": "step_started",
  "timestamp": "2025-01-15T10:30:01.000Z",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "step": "fetch_settings",
  "stepIndex": 1,
  "totalSteps": 7,
  "message": "Fetching AI settings..."
}
```

**Step Values**:
- `init` - Initializing
- `validation` - Validating data
- `fetch_settings` - Fetching AI settings
- `fetch_questions` - Loading questions
- `detect_topics` - Detecting topics with AI
- `generate_lessons` - Generating lesson content
- `save` - Saving to database
- `complete` - Finalization

---

### step_progress

**Sent when**: Progress update within current step

**Data**:
```json
{
  "type": "step_progress",
  "timestamp": "2025-01-15T10:30:15.000Z",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "step": "detect_topics",
  "progress": 35,
  "message": "Detecting topics with AI...",
  "data": {
    "ai_call_started": true
  }
}
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `progress` | number | Overall progress percentage (0-100) |
| `message` | string (optional) | Human-readable message |
| `data` | object (optional) | Additional step-specific data |

---

### step_completed

**Sent when**: Step finishes successfully

**Data**:
```json
{
  "type": "step_completed",
  "timestamp": "2025-01-15T10:30:20.000Z",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "step": "detect_topics",
  "stepIndex": 3,
  "totalSteps": 7,
  "duration": 5000,
  "message": "Topics detected successfully"
}
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `duration` | number | Step execution time in milliseconds |

---

### topic_started

**Sent when**: New topic generation begins

**Data**:
```json
{
  "type": "topic_started",
  "timestamp": "2025-01-15T10:30:25.000Z",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "topicName": "Authentication",
  "topicIndex": 2,
  "totalTopics": 5
}
```

---

### topic_progress

**Sent when**: Progress update on current topic

**Data**:
```json
{
  "type": "topic_progress",
  "timestamp": "2025-01-15T10:30:35.000Z",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "topicName": "Authentication",
  "topicIndex": 2,
  "totalTopics": 5,
  "progress": 45,
  "message": "Generating lesson content..."
}
```

---

### topic_completed

**Sent when**: Topic generation finishes

**Data**:
```json
{
  "type": "topic_completed",
  "timestamp": "2025-01-15T10:30:55.000Z",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "topicName": "Authentication",
  "topicIndex": 2,
  "totalTopics": 5,
  "lessonsGenerated": 1,
  "duration": 30000
}
```

---

### job_completed

**Sent when**: Entire generation succeeds

**Data**:
```json
{
  "type": "job_completed",
  "timestamp": "2025-01-15T10:31:30.000Z",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "courseId": "789e4567-e89b-12d3-a456-426614174000",
  "totalDuration": 90000,
  "topicsGenerated": 5,
  "lessonsGenerated": 15,
  "message": "Course generated successfully!"
}
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `courseId` | string (UUID) | ID of the generated course |
| `totalDuration` | number | Total generation time in milliseconds |

---

### job_failed

**Sent when**: Generation fails with error

**Data**:
```json
{
  "type": "job_failed",
  "timestamp": "2025-01-15T10:31:00.000Z",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "error": "AI API request failed",
  "errorDetails": {
    "status": 429,
    "message": "Rate limit exceeded"
  },
  "failedStep": "detect_topics"
}
```

---

### job_cancelled

**Sent when**: User cancels generation

**Data**:
```json
{
  "type": "job_cancelled",
  "timestamp": "2025-01-15T10:30:40.000Z",
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "reason": "User cancelled",
  "cancelledAt": "2025-01-15T10:30:40.000Z"
}
```

---

### heartbeat

**Sent every**: 15 seconds

**Format**:
```
: heartbeat
```

**Purpose**: Keeps SSE connection alive

---

## Error Codes

| HTTP Status | Error Message | Cause | Solution |
|-------------|---------------|-------|----------|
| 400 | "examId is required" | Missing examId in request body | Include examId in POST body |
| 400 | "jobId is required" | Missing jobId in request body | Include jobId in POST body |
| 401 | "Unauthorized" | No valid authentication | Login and ensure session is valid |
| 403 | "Forbidden" | User doesn't own job | Only access your own jobs |
| 404 | "Job not found" | Invalid job ID | Verify job ID is correct |
| 404 | "Exam not found" | Invalid exam ID | Verify exam exists and user owns it |
| 500 | "Failed to start generation" | Server error creating job | Check server logs, retry |
| 500 | "Failed to cancel generation" | Server error updating job | Check server logs, retry |
| 500 | "Internal Server Error" | Various server errors | Check server logs, contact support |

---

## Rate Limits

### Current Limits

- **No hard rate limits** currently enforced
- Relies on Vercel's default serverless limits:
  - 1000 concurrent executions (Pro plan)
  - 100 GB-hours compute time per month (Pro plan)

### Duplicate Prevention

- **One active job per exam**: Attempting to start generation for an exam with an existing pending/running job returns the existing job instead of creating a duplicate

### Future Rate Limiting (Planned)

- Per-user generation limits (e.g., 5 concurrent jobs max)
- Cooldown period between generations (e.g., 1 minute)
- Track in `ai_settings` table or separate rate_limits table

---

## Examples

### Example 1: Start Generation and Monitor Progress

**JavaScript (Browser)**:
```javascript
// Step 1: Start generation
const startResponse = await fetch('/api/generation/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ examId: 'exam-uuid-here' }),
});

const { jobId, streamUrl } = await startResponse.json();
console.log('Job started:', jobId);

// Step 2: Connect to SSE stream
const eventSource = new EventSource(streamUrl);

// Listen for progress updates
eventSource.addEventListener('step_progress', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Progress: ${data.progress}% - ${data.message}`);
  updateProgressBar(data.progress);
});

// Listen for completion
eventSource.addEventListener('job_completed', (event) => {
  const data = JSON.parse(event.data);
  console.log('Course generated:', data.courseId);
  eventSource.close();
  redirectToCourse(data.courseId);
});

// Listen for errors
eventSource.addEventListener('job_failed', (event) => {
  const data = JSON.parse(event.data);
  console.error('Generation failed:', data.error);
  eventSource.close();
  showErrorMessage(data.error);
});

// Handle connection errors
eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  // EventSource will auto-reconnect
};
```

---

### Example 2: Cancel Generation

**JavaScript (Browser)**:
```javascript
async function cancelGeneration(jobId) {
  const response = await fetch('/api/generation/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: jobId,
      reason: 'User clicked cancel button',
    }),
  });

  const result = await response.json();

  if (result.success) {
    console.log('Generation cancelled');
  } else {
    console.error('Failed to cancel:', result.message);
  }
}

// Usage
cancelGeneration('job-uuid-here');
```

---

### Example 3: React Hook Usage

**TypeScript (React)**:
```typescript
import { useGenerationProgress } from '@/lib/hooks/useGenerationProgress';
import { useRouter } from 'next/navigation';

function MyComponent({ jobId, examId }: { jobId: string; examId: string }) {
  const router = useRouter();

  const { progress, cancelJob } = useGenerationProgress({
    jobId,
    onComplete: (courseId) => {
      console.log('Generation complete:', courseId);
      router.push(`/study/${examId}?courseId=${courseId}`);
    },
    onError: (error) => {
      console.error('Generation failed:', error);
      alert(`Error: ${error}`);
    },
    onCancel: () => {
      console.log('Generation cancelled');
    },
  });

  return (
    <div>
      <h2>Generating Course...</h2>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress.progress}%` }}
        />
      </div>

      {/* Status */}
      <p>Status: {progress.status}</p>
      <p>Message: {progress.message}</p>

      {/* Current Step */}
      {progress.currentStep && (
        <p>
          Step: {progress.currentStepIndex + 1} / {progress.totalSteps}
        </p>
      )}

      {/* Current Topic */}
      {progress.currentTopic && (
        <p>
          Topic: {progress.currentTopic} ({progress.currentTopicIndex + 1} /{' '}
          {progress.totalTopics})
        </p>
      )}

      {/* Connection Status */}
      <p>
        Connection:{' '}
        <span style={{ color: progress.isConnected ? 'green' : 'red' }}>
          {progress.isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </p>

      {/* Cancel Button */}
      {(progress.status === 'pending' || progress.status === 'running') && (
        <button onClick={() => cancelJob('User clicked cancel')}>
          Cancel Generation
        </button>
      )}

      {/* Error Message */}
      {progress.error && (
        <div className="error">
          <strong>Error:</strong> {progress.error}
        </div>
      )}
    </div>
  );
}
```

---

### Example 4: Polling Status (Fallback)

**JavaScript (Browser)**:
```javascript
async function pollJobStatus(jobId) {
  let completed = false;

  while (!completed) {
    const response = await fetch(`/api/generation/status/${jobId}`);
    const { job } = await response.json();

    console.log(`Status: ${job.status}, Progress: ${job.current_step}`);

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      completed = true;

      if (job.status === 'completed') {
        console.log('Course ID:', job.course_id);
      } else if (job.status === 'failed') {
        console.error('Error:', job.error_message);
      } else {
        console.log('Cancelled:', job.cancellation_reason);
      }
    } else {
      // Wait 3 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

// Usage
pollJobStatus('job-uuid-here');
```

---

### Example 5: cURL Commands

**Start Generation**:
```bash
curl -X POST https://your-app.vercel.app/api/generation/start \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=your-supabase-token" \
  -d '{"examId": "550e8400-e29b-41d4-a716-446655440000"}'
```

**Connect to SSE Stream**:
```bash
curl -N https://your-app.vercel.app/api/generation/stream/123e4567-e89b-12d3-a456-426614174000 \
  -H "Cookie: sb-access-token=your-supabase-token"
```

**Cancel Generation**:
```bash
curl -X POST https://your-app.vercel.app/api/generation/cancel \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=your-supabase-token" \
  -d '{"jobId": "123e4567-e89b-12d3-a456-426614174000", "reason": "Testing"}'
```

**Get Job Status**:
```bash
curl https://your-app.vercel.app/api/generation/status/123e4567-e89b-12d3-a456-426614174000 \
  -H "Cookie: sb-access-token=your-supabase-token"
```

---

## Changelog

### Version 1.0.0 (2025-01-15)

- Initial release
- 5 API endpoints
- 10 SSE event types
- Real-time progress tracking
- Job cancellation support
- Automatic reconnection
- Database-backed job persistence

---

## Support

For API issues or questions:

1. Check [Error Codes](#error-codes) section
2. Review [Examples](#examples) for usage patterns
3. Check server logs (Vercel dashboard)
4. Verify Supabase connection and RLS policies
5. Open GitHub issue with reproduction steps

---

**API Version**: 1.0.0
**Last Updated**: 2025-01-15
**Status**: Production Ready
