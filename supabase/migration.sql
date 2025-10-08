-- Migration script to add exams table and update schema
-- This safely migrates existing data to the new structure

-- Step 1: Drop existing policies (so we can modify tables)
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON questions;
DROP POLICY IF EXISTS "Questions are insertable by authenticated users" ON questions;
DROP POLICY IF EXISTS "Users can view own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can insert own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can update own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can view own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Users can insert own exam answers" ON exam_answers;
DROP POLICY IF EXISTS "Users can update own exam answers" ON exam_answers;

-- Step 2: Create exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_name TEXT,
  description TEXT,
  is_sample BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add exam_id columns to existing tables
ALTER TABLE questions ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id) ON DELETE CASCADE;
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS exam_id UUID REFERENCES exams(id) ON DELETE CASCADE;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_exams_user ON exams(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam ON exam_sessions(exam_id);

-- Step 5: Enable RLS on exams table
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Step 6: Recreate all RLS policies

-- Exams policies
CREATE POLICY "Users can view own exams and sample exams"
  ON exams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_sample = true);

CREATE POLICY "Users can insert own exams"
  ON exams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exams"
  ON exams FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exams"
  ON exams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_sample = false);

-- Questions policies
CREATE POLICY "Questions are viewable by authenticated users"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Questions are insertable by authenticated users"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Exam sessions policies
CREATE POLICY "Users can view own exam sessions"
  ON exam_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam sessions"
  ON exam_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam sessions"
  ON exam_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Exam answers policies
CREATE POLICY "Users can view own exam answers"
  ON exam_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE exam_sessions.id = exam_answers.session_id
      AND exam_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own exam answers"
  ON exam_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE exam_sessions.id = exam_answers.session_id
      AND exam_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own exam answers"
  ON exam_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE exam_sessions.id = exam_answers.session_id
      AND exam_sessions.user_id = auth.uid()
    )
  );
