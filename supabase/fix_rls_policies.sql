-- Fix RLS policies for exam_sessions and exam_answers tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on exam_sessions if not already enabled
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can insert their own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can update their own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can delete their own exam sessions" ON exam_sessions;

-- Create new policies for exam_sessions
CREATE POLICY "Users can view their own exam sessions"
ON exam_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exam sessions"
ON exam_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exam sessions"
ON exam_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exam sessions"
ON exam_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on exam_answers if not already enabled
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Users can insert their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Users can update their own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Users can delete their own exam answers" ON exam_answers;

-- Create new policies for exam_answers
-- Note: exam_answers doesn't have user_id, so we need to join with exam_sessions
CREATE POLICY "Users can view their own exam answers"
ON exam_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exam_sessions
    WHERE exam_sessions.id = exam_answers.session_id
    AND exam_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own exam answers"
ON exam_answers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM exam_sessions
    WHERE exam_sessions.id = exam_answers.session_id
    AND exam_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own exam answers"
ON exam_answers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM exam_sessions
    WHERE exam_sessions.id = exam_answers.session_id
    AND exam_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own exam answers"
ON exam_answers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM exam_sessions
    WHERE exam_sessions.id = exam_answers.session_id
    AND exam_sessions.user_id = auth.uid()
  )
);
