-- Migration: Study Progress Tracking
-- Description: Create table and policies for tracking user progress through study topics
-- Created: 2025-10-10

-- Create study_progress table
CREATE TABLE IF NOT EXISTS study_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  topic_name text NOT NULL,
  completed boolean DEFAULT false,
  last_visited_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT study_progress_unique_user_exam_topic UNIQUE(user_id, exam_id, topic_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_progress_user_exam
  ON study_progress(user_id, exam_id);

CREATE INDEX IF NOT EXISTS idx_study_progress_exam
  ON study_progress(exam_id);

CREATE INDEX IF NOT EXISTS idx_study_progress_completed
  ON study_progress(user_id, exam_id, completed);

-- Enable Row Level Security
ALTER TABLE study_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own progress
CREATE POLICY "Users can view own progress"
  ON study_progress FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON study_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own progress
CREATE POLICY "Users can update own progress"
  ON study_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own progress
CREATE POLICY "Users can delete own progress"
  ON study_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE study_progress IS 'Tracks user progress through study mode topics';
COMMENT ON COLUMN study_progress.topic_name IS 'Name of the topic/section from course_sections';
COMMENT ON COLUMN study_progress.completed IS 'Whether user marked this topic as completed';
COMMENT ON COLUMN study_progress.last_visited_at IS 'Last time user accessed this topic';
