# Study Progress API Reference

## Base URL
All endpoints are relative to your application base URL (e.g., `https://your-app.vercel.app`)

## Authentication
All endpoints require authentication via Supabase session cookie. Users must be logged in.

---

## Endpoints

### 1. Save/Update Study Progress

**Endpoint**: `POST /api/study/progress`

**Description**: Create or update progress for a specific topic. Automatically updates `last_visited_at` timestamp.

**Request Headers**:
```
Content-Type: application/json
Cookie: sb-<project>-auth-token (handled by Supabase client)
```

**Request Body**:
```json
{
  "exam_id": "uuid-of-exam",
  "topic_name": "Name of topic from course sections",
  "completed": false  // optional, defaults to false
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "exam_id": "uuid",
    "topic_name": "Introduction to React",
    "completed": false,
    "last_visited_at": "2025-10-10T12:00:00.000Z",
    "created_at": "2025-10-10T12:00:00.000Z"
  }
}
```

**Error Responses**:

401 Unauthorized:
```json
{
  "error": "Unauthorized"
}
```

400 Bad Request:
```json
{
  "error": "Missing required fields",
  "required": ["exam_id", "topic_name"]
}
```

403 Forbidden:
```json
{
  "error": "Unauthorized access to this exam"
}
```

404 Not Found:
```json
{
  "error": "Exam not found"
}
```

500 Internal Server Error:
```json
{
  "error": "Failed to save progress",
  "details": "Error message"
}
```

**Usage Example**:
```typescript
// Mark topic as visited
const response = await fetch('/api/study/progress', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    exam_id: examId,
    topic_name: 'Advanced React Patterns',
    completed: false
  })
});

const result = await response.json();
if (result.success) {
  console.log('Progress saved:', result.data);
}
```

```typescript
// Mark topic as complete
const response = await fetch('/api/study/progress', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    exam_id: examId,
    topic_name: 'Advanced React Patterns',
    completed: true
  })
});
```

---

### 2. Get Study Progress for Exam

**Endpoint**: `GET /api/study/progress/[exam_id]`

**Description**: Retrieve all progress records for a specific exam with calculated statistics.

**URL Parameters**:
- `exam_id` (required): UUID of the exam

**Request Headers**:
```
Cookie: sb-<project>-auth-token (handled by Supabase client)
```

**Success Response** (200 OK):
```json
{
  "exam_id": "uuid",
  "progress": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "exam_id": "uuid",
      "topic_name": "Advanced Hooks",
      "completed": true,
      "last_visited_at": "2025-10-10T14:30:00.000Z",
      "created_at": "2025-10-10T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "user_id": "uuid",
      "exam_id": "uuid",
      "topic_name": "Introduction to React",
      "completed": false,
      "last_visited_at": "2025-10-10T12:00:00.000Z",
      "created_at": "2025-10-10T11:00:00.000Z"
    }
  ],
  "statistics": {
    "total_topics": 2,
    "completed_topics": 1,
    "completion_percentage": 50,
    "last_visited_topic": {
      "topic_name": "Advanced Hooks",
      "visited_at": "2025-10-10T14:30:00.000Z"
    }
  }
}
```

**Error Responses**:

401 Unauthorized:
```json
{
  "error": "Unauthorized"
}
```

400 Bad Request:
```json
{
  "error": "Missing exam_id"
}
```

403 Forbidden:
```json
{
  "error": "Unauthorized access to this exam"
}
```

404 Not Found:
```json
{
  "error": "Exam not found"
}
```

500 Internal Server Error:
```json
{
  "error": "Failed to fetch progress",
  "details": "Error message"
}
```

**Usage Example**:
```typescript
const response = await fetch(`/api/study/progress/${examId}`);
const data = await response.json();

console.log(`You've completed ${data.statistics.completion_percentage}% of this course`);
console.log(`Last visited: ${data.statistics.last_visited_topic?.topic_name}`);

// Check if specific topic is completed
const topicProgress = data.progress.find(p => p.topic_name === 'Advanced Hooks');
if (topicProgress?.completed) {
  console.log('Topic completed!');
}
```

---

### 3. Get Course with Progress (Existing Endpoint)

**Endpoint**: `GET /api/courses/[exam_id]`

**Description**: Retrieve complete course data including sections and progress (now enhanced with progress tracking).

**URL Parameters**:
- `exam_id` (required): UUID of the exam

**Success Response** (200 OK):
```json
{
  "exam_id": "uuid",
  "topics": [
    {
      "topic_name": "Introduction to React",
      "order_index": 0
    },
    {
      "topic_name": "Advanced Hooks",
      "order_index": 1
    }
  ],
  "sections": [
    {
      "topic_name": "Introduction to React",
      "content_md": "# Introduction\n\nMarkdown content...",
      "order_index": 0
    },
    {
      "topic_name": "Advanced Hooks",
      "content_md": "# Advanced Hooks\n\nMarkdown content...",
      "order_index": 1
    }
  ],
  "progress": [
    {
      "topic_name": "Advanced Hooks",
      "completed": true,
      "last_visited_at": "2025-10-10T14:30:00.000Z"
    },
    {
      "topic_name": "Introduction to React",
      "completed": false,
      "last_visited_at": "2025-10-10T12:00:00.000Z"
    }
  ],
  "statistics": {
    "total_topics": 2,
    "completed_topics": 1,
    "completion_percentage": 50,
    "last_visited_topic": {
      "topic_name": "Advanced Hooks",
      "visited_at": "2025-10-10T14:30:00.000Z"
    }
  }
}
```

**Usage Example**:
```typescript
// Load course with automatic progress tracking
const response = await fetch(`/api/courses/${examId}`);
const courseData = await response.json();

// Render sections with progress indicators
courseData.sections.forEach(section => {
  const progress = courseData.progress?.find(
    p => p.topic_name === section.topic_name
  );

  console.log(`${section.topic_name}: ${progress?.completed ? '✓' : '○'}`);
});
```

---

## Common Workflows

### 1. Auto-track Topic Visit
```typescript
// When user opens a topic
async function trackTopicVisit(examId: string, topicName: string) {
  await fetch('/api/study/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exam_id: examId,
      topic_name: topicName,
      completed: false
    })
  });
}
```

### 2. Toggle Topic Completion
```typescript
async function toggleTopicCompletion(
  examId: string,
  topicName: string,
  completed: boolean
) {
  const response = await fetch('/api/study/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exam_id: examId,
      topic_name: topicName,
      completed
    })
  });

  return response.json();
}
```

### 3. Load Course with Progress
```typescript
async function loadCourseWithProgress(examId: string) {
  const response = await fetch(`/api/courses/${examId}`);
  const data = await response.json();

  return {
    sections: data.sections,
    progress: data.progress || [],
    stats: data.statistics
  };
}
```

### 4. Resume Last Topic
```typescript
async function getLastVisitedTopic(examId: string) {
  const response = await fetch(`/api/study/progress/${examId}`);
  const data = await response.json();

  return data.statistics.last_visited_topic?.topic_name;
}
```

### 5. Get Completion Status
```typescript
async function getCompletionStatus(examId: string) {
  const response = await fetch(`/api/study/progress/${examId}`);
  const data = await response.json();

  return {
    percentage: data.statistics.completion_percentage,
    completed: data.statistics.completed_topics,
    total: data.statistics.total_topics
  };
}
```

---

## Data Models

### StudyProgress
```typescript
type StudyProgress = {
  id: string;
  user_id: string;
  exam_id: string;
  topic_name: string;
  completed: boolean;
  last_visited_at: string;  // ISO 8601 timestamp
  created_at: string;        // ISO 8601 timestamp
};
```

### StudyProgressStatistics
```typescript
type StudyProgressStatistics = {
  total_topics: number;
  completed_topics: number;
  completion_percentage: number;  // 0-100
  last_visited_topic: {
    topic_name: string;
    visited_at: string;  // ISO 8601 timestamp
  } | null;
};
```

---

## Access Control

### User Access Rules
A user can access an exam's progress if:
1. **Owner**: User created the exam (`exam.user_id === user.id`)
2. **Sample**: Exam is a sample exam (`exam.is_sample === true`)
3. **Shared**: Exam has been shared with user (record in `exam_shares` table)

All API endpoints verify these access rules before allowing operations.

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding rate limiting middleware if abuse occurs:
- Recommended: 100 requests per minute per user
- Track progress updates should be throttled on frontend to avoid excessive writes

---

## Notes

1. **UPSERT Behavior**: The POST endpoint uses UPSERT, so it will:
   - Create a new record if none exists
   - Update existing record if one exists (based on unique constraint)
   - Always update `last_visited_at` timestamp

2. **Progress Calculation**: Statistics are calculated server-side based on progress records. If no progress exists, all statistics will be zero/null.

3. **Topic Names**: Must exactly match the `topic_name` from `ai_generated_course_sections` table for proper linking.

4. **Timestamps**: All timestamps are in ISO 8601 format (UTC).

5. **Cascading Deletes**: If an exam or user is deleted, all associated progress records are automatically deleted.
