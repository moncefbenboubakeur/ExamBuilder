# Real-Time Course Generation - Quick Start Guide

## Overview

This guide helps you implement and use the real-time progress tracking system for AI course generation.

## 📁 File Structure

```
exam-simulator/
├── supabase/
│   └── migrations/
│       └── 002_course_generation_jobs.sql          # Database schema
│
├── lib/
│   ├── types/
│   │   └── generation.ts                           # TypeScript types
│   ├── utils/
│   │   └── progress-tracker.ts                     # Progress tracking utility
│   └── hooks/
│       └── useGenerationProgress.ts                # React hook for SSE
│
├── app/api/generation/
│   ├── start/route.ts                              # POST - Start generation
│   ├── process/route.ts                            # POST - Internal processing
│   ├── stream/[jobId]/route.ts                     # GET - SSE stream
│   ├── cancel/route.ts                             # POST - Cancel job
│   └── status/[jobId]/route.ts                     # GET - Job status
│
├── components/
│   └── GenerationProgressModal.tsx                 # UI component
│
└── docs/
    ├── REAL_TIME_GENERATION_ARCHITECTURE.md        # Full architecture docs
    ├── generation-integration-example.tsx          # Integration example
    └── GENERATION_QUICK_START.md                   # This file
```

## 🚀 Quick Setup (5 Steps)

### 1. Run Database Migration

Execute in Supabase SQL Editor:

```bash
# Copy contents of supabase/migrations/002_course_generation_jobs.sql
# Paste into Supabase SQL Editor and run
```

This creates:
- `course_generation_jobs` table
- Indexes for performance
- RLS policies for security
- Cleanup function for old jobs

### 2. Update Frontend Page

Replace the old synchronous generation in `app/study/[exam_id]/page.tsx`:

```typescript
// Add import
import { GenerationProgressModal } from '@/components/GenerationProgressModal';

// Add state
const [generationJobId, setGenerationJobId] = useState<string | null>(null);

// Replace handleGenerateCourse
const handleGenerateCourse = async () => {
  try {
    const response = await fetch('/api/generation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: params.exam_id }),
    });

    if (!response.ok) throw new Error('Failed to start generation');

    const data = await response.json();
    setGenerationJobId(data.jobId); // This opens the progress modal
  } catch (error) {
    console.error('Failed to start generation:', error);
    alert('Failed to start course generation');
  }
};

// Add modal to JSX
{generationJobId && (
  <GenerationProgressModal
    jobId={generationJobId}
    examId={params.exam_id}
    onClose={() => setGenerationJobId(null)}
  />
)}
```

### 3. Test Locally

```bash
# Start dev server
npm run dev

# Navigate to study page
open http://localhost:3003/study/[exam_id]

# Click "Generate Course"
# You should see the progress modal with real-time updates
```

### 4. Deploy to Vercel

```bash
git add .
git commit -m "Add real-time course generation progress tracking"
git push origin main
```

Vercel will auto-deploy. Ensure:
- ✅ Database migration ran in production Supabase
- ✅ Environment variables are set (`ANTHROPIC_API_KEY`, etc.)

### 5. Verify Production

1. Open production app
2. Navigate to study page
3. Click "Generate Course"
4. Verify:
   - ✅ Progress modal appears
   - ✅ Real-time updates show
   - ✅ Connection indicator is green
   - ✅ Steps complete in order
   - ✅ Redirects to course on completion

## 🔧 API Usage

### Start Generation

```typescript
const response = await fetch('/api/generation/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ examId: 'uuid' }),
});

const { jobId, streamUrl } = await response.json();
// jobId: Use to connect SSE
// streamUrl: /api/generation/stream/{jobId}
```

### Connect to SSE Stream

```typescript
const eventSource = new EventSource(`/api/generation/stream/${jobId}`);

eventSource.addEventListener('step_progress', (event) => {
  const data = JSON.parse(event.data);
  console.log('Progress:', data.progress, '%');
});

eventSource.addEventListener('job_completed', (event) => {
  const data = JSON.parse(event.data);
  console.log('Course ID:', data.courseId);
  eventSource.close();
});

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // Handle reconnection
};
```

### Cancel Generation

```typescript
await fetch('/api/generation/cancel', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jobId: 'uuid', reason: 'User cancelled' }),
});
```

### Get Job Status

```typescript
const response = await fetch(`/api/generation/status/${jobId}`);
const { job, canResume } = await response.json();

console.log('Status:', job.status);
console.log('Progress:', job.current_step_index, '/', job.total_steps);
```

## 🎨 UI Integration

### Using the Hook

```typescript
import { useGenerationProgress } from '@/lib/hooks/useGenerationProgress';

function MyComponent({ jobId }: { jobId: string }) {
  const { progress, cancelJob } = useGenerationProgress({
    jobId,
    onComplete: (courseId) => {
      router.push(`/study/${examId}?courseId=${courseId}`);
    },
    onError: (error) => {
      alert(`Generation failed: ${error}`);
    },
  });

  return (
    <div>
      <p>Status: {progress.status}</p>
      <p>Progress: {progress.progress}%</p>
      <p>Message: {progress.message}</p>
      <button onClick={() => cancelJob()}>Cancel</button>
    </div>
  );
}
```

### Using the Modal

```typescript
import { GenerationProgressModal } from '@/components/GenerationProgressModal';

function MyComponent() {
  const [jobId, setJobId] = useState<string | null>(null);

  const startGeneration = async () => {
    const response = await fetch('/api/generation/start', {
      method: 'POST',
      body: JSON.stringify({ examId }),
    });
    const data = await response.json();
    setJobId(data.jobId); // Opens modal
  };

  return (
    <>
      <button onClick={startGeneration}>Generate</button>

      {jobId && (
        <GenerationProgressModal
          jobId={jobId}
          examId={examId}
          onClose={() => setJobId(null)}
        />
      )}
    </>
  );
}
```

## 📊 Event Types Reference

| Event Type | When Fired | Key Fields |
|------------|------------|------------|
| `job_created` | Job initialized | `estimatedDuration` |
| `step_started` | New step begins | `step`, `stepIndex`, `message` |
| `step_progress` | Progress update | `progress` (0-100), `message` |
| `step_completed` | Step finishes | `duration`, `message` |
| `topic_started` | New topic starts | `topicName`, `topicIndex` |
| `topic_progress` | Topic update | `topicName`, `progress` |
| `topic_completed` | Topic finishes | `lessonsGenerated`, `duration` |
| `job_completed` | Job successful | `courseId`, `totalDuration` |
| `job_failed` | Job failed | `error`, `failedStep` |
| `job_cancelled` | Job cancelled | `reason`, `cancelledAt` |

## 🔍 Debugging

### Check Job in Database

```sql
SELECT * FROM course_generation_jobs
WHERE id = 'job-uuid'
ORDER BY created_at DESC;
```

### View SSE Events in Browser

```javascript
// Open browser console
const es = new EventSource('/api/generation/stream/job-uuid');
es.onmessage = (e) => console.log('Event:', e);
es.onerror = (e) => console.error('Error:', e);
```

### Check API Logs

```bash
# Vercel CLI
vercel logs --follow

# Or in Vercel dashboard: Deployments → Logs
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Job not found" | Job ID invalid | Verify job created in DB |
| "Unauthorized" | Not logged in | Check auth session |
| SSE disconnects | Network timeout | Auto-reconnects after 15s |
| No progress updates | Supabase Realtime off | Enable in Supabase dashboard |
| "Internal Server Error" | AI API key missing | Set `ANTHROPIC_API_KEY` env var |

## 📈 Monitoring

### Key Metrics to Track

1. **Generation Duration**: Time from start to completion
2. **Failure Rate**: Percentage of failed jobs
3. **Cancellation Rate**: User-initiated cancellations
4. **Step Durations**: Which steps take longest
5. **Connection Stability**: SSE reconnection frequency

### Database Queries

```sql
-- Average generation time
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_seconds
FROM course_generation_jobs
WHERE status = 'completed'
  AND completed_at > NOW() - INTERVAL '7 days';

-- Failure rate by step
SELECT current_step, COUNT(*) as failures
FROM course_generation_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY current_step
ORDER BY failures DESC;

-- Recent jobs
SELECT id, status, current_step, created_at, completed_at
FROM course_generation_jobs
ORDER BY created_at DESC
LIMIT 20;
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Start generation and see progress modal
- [ ] Verify all steps complete in order
- [ ] Cancel mid-generation
- [ ] Close modal and reopen (job continues)
- [ ] Disconnect network and reconnect
- [ ] Complete generation and verify redirect
- [ ] Trigger error (invalid AI key) and see error message
- [ ] Start multiple concurrent generations
- [ ] Test on mobile device

### Automated Testing

```typescript
// Example: Jest test for ProgressTracker
import { ProgressTracker } from '@/lib/utils/progress-tracker';

test('creates job and updates progress', async () => {
  const job = await ProgressTracker.createJob('user-id', 'exam-id');
  expect(job.status).toBe('pending');

  const tracker = new ProgressTracker(job.id);
  await tracker.updateStatus('running');
  await tracker.updateStep('fetch_questions', 1);

  const updated = await getJobById(job.id);
  expect(updated.status).toBe('running');
  expect(updated.current_step).toBe('fetch_questions');
});
```

## 🚨 Troubleshooting

### SSE Connection Issues

```typescript
// Enable debug logging
const eventSource = new EventSource('/api/generation/stream/job-id');

eventSource.onopen = () => console.log('✅ SSE connected');
eventSource.onerror = (e) => console.error('❌ SSE error:', e);
eventSource.onmessage = (e) => console.log('📨 Message:', e.data);

// Check connection state
console.log('ReadyState:', eventSource.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
```

### Database Permission Issues

```sql
-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'course_generation_jobs';

-- Test as specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = 'user-uuid';
SELECT * FROM course_generation_jobs;
```

### Vercel Function Timeout

If generation exceeds 300 seconds:

1. Check Vercel plan limits (Pro = 300s max)
2. Reduce topic count in AI prompt
3. Implement job queuing for large exams
4. Consider breaking into smaller chunks

## 📚 Additional Resources

- [Full Architecture Documentation](./REAL_TIME_GENERATION_ARCHITECTURE.md)
- [Integration Example](./generation-integration-example.tsx)
- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Vercel Function Limits](https://vercel.com/docs/functions/serverless-functions/runtimes#max-duration)

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Integrate modal into study page
3. ✅ Test locally with real AI generation
4. ✅ Deploy to production
5. ✅ Monitor first week of usage
6. 📋 Implement job queue (if needed)
7. 📋 Add generation analytics dashboard
8. 📋 Implement job resumption for failed jobs

## 🤝 Support

For questions or issues:
1. Check [Troubleshooting](#-troubleshooting) section
2. Review [Architecture Documentation](./REAL_TIME_GENERATION_ARCHITECTURE.md)
3. Check Vercel and Supabase logs
4. Open GitHub issue with reproduction steps
