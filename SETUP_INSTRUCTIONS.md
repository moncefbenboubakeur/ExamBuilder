# 🚀 Study Mode Setup Instructions

## ⚠️ IMPORTANT: Database Migrations Required

The Study Mode feature is **fully implemented** but requires database setup before it can work.

### Current Status
- ✅ All code is complete and deployed
- ✅ Frontend UI is ready (Study button appears on exam cards)
- ✅ API endpoints are implemented
- ❌ **Database tables are NOT created yet** ← This is why you're seeing errors

### Error You're Seeing
When clicking the Study button, you'll see:
- 404 error on `/api/courses/[exam_id]`
- 500 error on `/api/generate-course`

This is because the required database tables don't exist yet.

---

## 📋 Step-by-Step Setup

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project: https://supabase.com/dashboard/project/toufoqynrjeczigyvzcj
2. Click **SQL Editor** in the left sidebar
3. Click **+ New query**

### Step 2: Run Migration 1 - Create ai_detected_topics Table

Copy and paste this entire SQL script, then click **Run**:

```sql
-- Create ai_detected_topics table
CREATE TABLE IF NOT EXISTS ai_detected_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique topic per exam
  CONSTRAINT unique_exam_topic UNIQUE (exam_id, topic_name)
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_ai_detected_topics_exam_id ON ai_detected_topics(exam_id);
CREATE INDEX IF NOT EXISTS idx_ai_detected_topics_topic_name ON ai_detected_topics(topic_name);

-- Enable RLS
ALTER TABLE ai_detected_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view topics for their own exams + sample exams
CREATE POLICY "Users can view topics for their own exams and sample exams"
  ON ai_detected_topics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = ai_detected_topics.exam_id
      AND (exams.user_id = auth.uid() OR exams.is_sample = true)
    )
  );

-- RLS Policy: Users can insert/update topics for their own exams
CREATE POLICY "Users can manage topics for their own exams"
  ON ai_detected_topics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = ai_detected_topics.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- Add helpful comment
COMMENT ON TABLE ai_detected_topics IS 'AI-detected topics from exam questions for study course generation';
```

### Step 3: Run Migration 2 - Create ai_generated_course_sections Table

Create another new query and run this SQL:

```sql
-- Create ai_generated_course_sections table
CREATE TABLE IF NOT EXISTS ai_generated_course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  content_md TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique section per exam topic
  CONSTRAINT unique_exam_section UNIQUE (exam_id, topic_name)
);

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_ai_course_sections_exam_id ON ai_generated_course_sections(exam_id);
CREATE INDEX IF NOT EXISTS idx_ai_course_sections_order_index ON ai_generated_course_sections(exam_id, order_index);

-- Enable RLS
ALTER TABLE ai_generated_course_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view course sections for their own exams + sample exams
CREATE POLICY "Users can view course sections for their own exams and sample exams"
  ON ai_generated_course_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = ai_generated_course_sections.exam_id
      AND (exams.user_id = auth.uid() OR exams.is_sample = true)
    )
  );

-- RLS Policy: Users can insert/update course sections for their own exams
CREATE POLICY "Users can manage course sections for their own exams"
  ON ai_generated_course_sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = ai_generated_course_sections.exam_id
      AND exams.user_id = auth.uid()
    )
  );

-- Add helpful comment
COMMENT ON TABLE ai_generated_course_sections IS 'AI-generated course content (lessons) organized by topic for study mode';
```

### Step 4: Verify Tables Were Created

Run this query to confirm:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ai_detected_topics', 'ai_generated_course_sections');
```

You should see both tables listed.

---

## ✅ Testing the Feature

After running the migrations:

1. **Reload your app** in the browser (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
2. Go to the home page
3. You'll see each exam has two buttons: **Study** and **Take Exam**
4. Click the **Study** button
5. Click **"Generate Study Course"** (first time only)
6. Wait 20-60 seconds for the AI to:
   - Detect 5-10 topics
   - Generate lessons for each topic
7. Explore the generated course!

---

## 🎯 What to Expect

### Course Generation
- **Time**: 20-60 seconds depending on exam size
- **Topics**: 5-10 topics automatically detected
- **Lessons**: Each topic gets a structured lesson with:
  - Overview
  - Core Principles
  - Common Traps & Misconceptions
  - Example or Analogy
  - Summary / Quick Takeaways

### Navigation
- **Sidebar**: Lists all topics, click to jump to any topic
- **Prev/Next Buttons**: Navigate sequentially through topics
- **Keyboard Shortcuts**: Use ← and → arrow keys
- **Progress Bar**: Visual indicator of course progress

---

## 🔧 Troubleshooting

### Problem: Still Getting 404/500 Errors
**Solution**: Make sure you:
1. Ran BOTH SQL migrations
2. Hard-refreshed the browser (Cmd+Shift+R)
3. Check the browser console for specific errors

### Problem: "AI settings not configured"
**Solution**: Make sure your `ai_settings` table has a record. Check with:
```sql
SELECT * FROM ai_settings LIMIT 1;
```

### Problem: Course generation takes too long
**Solution**: This is normal for the first time. The AI needs to:
1. Analyze all questions (~20s)
2. Generate 5-10 lessons (~30s each)
Total: 2.5-5 minutes for an 8-topic course

### Problem: No topics generated
**Solution**: Exam needs at least 15-20 questions for good topic detection

---

## 📚 Additional Documentation

For more detailed information, see:
- `STUDY_MODE_SETUP.md` - Full technical documentation
- `supabase/migrations/004_add_ai_detected_topics.sql` - Migration file 1
- `supabase/migrations/005_add_ai_generated_course_sections.sql` - Migration file 2

---

## 🎉 You're All Set!

Once the migrations are run, the Study Mode feature is fully functional. Users can:
- Generate AI courses from any exam
- Study topics in any order
- Review common misconceptions
- Learn underlying concepts without seeing exam questions

Enjoy your new AI-powered study mode! 🚀
