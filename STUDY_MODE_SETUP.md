# AI Study Mode Setup Guide

This guide will help you set up the AI-Generated Study Course feature for ExamBuilder.

## Overview

The Study Mode feature automatically generates educational content from exam questions, creating a structured course with:
- 5-10 AI-detected topics based on question content
- Comprehensive lessons for each topic with markdown formatting
- Topic-based navigation with progress tracking
- Prev/Next navigation for sequential learning

## Prerequisites

- Supabase project with admin access
- AI API keys (already configured in `.env.local`):
  - `OPENAI_API_KEY` ✅
  - `ANTHROPIC_API_KEY` ✅

## Database Setup

### Step 1: Run the Migrations

You need to create two new tables in your Supabase database. Open the Supabase SQL Editor and run these migration files in order:

#### Migration 1: ai_detected_topics table

```sql
-- Run: supabase/migrations/004_add_ai_detected_topics.sql
```

This creates the `ai_detected_topics` table that stores AI-detected topics and their associated question IDs.

#### Migration 2: ai_generated_course_sections table

```sql
-- Run: supabase/migrations/005_add_ai_generated_course_sections.sql
```

This creates the `ai_generated_course_sections` table that stores the generated markdown lessons.

### Step 2: Verify Tables

After running the migrations, verify both tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ai_detected_topics', 'ai_generated_course_sections');
```

## Features

### For Users

1. **Study Button**: Every exam card now has a "Study" button next to "Take Exam"
2. **Auto-Generation**: First-time visit to study mode will show a "Generate Study Course" button
3. **Topic Navigation**: Sidebar with all detected topics
4. **Keyboard Navigation**: Use arrow keys (←/→) to navigate between topics
5. **Progress Tracking**: Visual progress bar showing course completion

### API Endpoints

- `POST /api/generate-course` - Generate course from exam questions
- `GET /api/courses/[exam_id]` - Fetch generated course data

## Usage

### Generating a Course

1. Upload an exam with at least 30 questions (recommended for 5-10 topics)
2. Click the "Study" button on the exam card
3. Click "Generate Study Course" (takes 20-60 seconds depending on exam size)
4. Navigate through topics using the sidebar or Prev/Next buttons

### Course Generation Process

1. **Topic Detection** (~20s):
   - AI analyzes all questions
   - Identifies 5-10 coherent topics
   - Maps questions to topics

2. **Lesson Generation** (~30s per topic):
   - Creates structured markdown lessons
   - Includes: Overview, Core Principles, Common Traps, Examples, Summary
   - Validates no exam text leakage

### Regeneration Policy

- Courses can be regenerated once every 10 minutes (configurable)
- Regeneration overwrites previous course data
- Useful for: exam updates, different AI models, improved prompts

## Architecture

### File Structure

```
app/
├── api/
│   ├── generate-course/route.ts    # Course generation endpoint
│   └── courses/[exam_id]/route.ts  # Course retrieval endpoint
├── study/[exam_id]/page.tsx        # Study mode page
components/
└── study/
    ├── StudySidebar.tsx            # Topic navigation
    ├── StudyContent.tsx            # Markdown lesson renderer
    └── StudyNav.tsx                # Prev/Next navigation
lib/
├── ai/
│   ├── callAi.ts                   # Provider-agnostic AI calls
│   └── prompts/
│       ├── topicDetection.ts       # Topic detection prompt
│       └── lessonGeneration.ts     # Lesson generation prompt
├── course/
│   ├── persist.ts                  # Database operations
│   ├── load.ts                     # Course loading
│   └── leakageDetection.ts         # Exam text leak prevention
└── markdown.ts                     # Safe markdown rendering config
```

### Security Features

1. **Markdown Sanitization**: Uses `rehype-sanitize` to prevent XSS
2. **Exam Text Leakage Detection**: Jaccard similarity check (30% threshold)
3. **RLS Policies**: Users can only access courses for their own exams or sample exams
4. **API Key Protection**: Server-side only, never exposed to client

## Monitoring

### Logs to Check

```bash
# Generation started
📚 Generating course for exam {exam_id} with {N} questions

# Topic detection
✅ Detected {N} topics

# Lesson generation
📝 Generating lesson {i}/{total}: {topic_name}

# Leakage warning
⚠️  Leakage detected in topic "{topic_name}": {details}

# Completion
✅ Course generation complete for exam {exam_id}
```

### Common Issues

**Problem**: "AI settings not configured"
- **Solution**: Ensure `ai_settings` table has at least one row with provider and model_id

**Problem**: "No course found for this exam"
- **Solution**: Click "Generate Study Course" to create the course

**Problem**: Course generation timeout
- **Solution**: Check exam size (very large exams >100 questions may timeout). Consider increasing timeout in `/api/generate-course/route.ts`

**Problem**: High leakage similarity
- **Solution**: This is logged but not blocked. Review the lesson content if >50% similarity detected

## Performance

- **Topic Detection**: ~20 seconds
- **Lesson Generation**: ~30 seconds per topic (5-10 topics = 2.5-5 minutes total)
- **Cache**: Courses are stored in database, instant loading after generation
- **Concurrent Requests**: Handled via async/await patterns

## Future Enhancements

- [ ] Personalized study plans based on user performance
- [ ] Spaced repetition scheduling
- [ ] Progress tracking per topic
- [ ] Adaptive difficulty based on quiz results
- [ ] Multi-language support
- [ ] Audio/video generation
- [ ] Practice quizzes after each topic
- [ ] Topic completion badges

## Troubleshooting

If you encounter issues, check:

1. Database tables created correctly
2. RLS policies enabled
3. AI API keys valid
4. Supabase connection stable
5. Browser console for errors
6. Next.js dev server logs

For development help, see the implementation notes in the PRD at the root of this project.
