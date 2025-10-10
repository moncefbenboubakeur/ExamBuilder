-- Migration: Add exam sharing functionality
-- This allows admins to share exams between users

-- Create exam_shares table for tracking shared exams
CREATE TABLE IF NOT EXISTS exam_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_id, shared_with)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exam_shares_exam ON exam_shares(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_shares_shared_by ON exam_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_exam_shares_shared_with ON exam_shares(shared_with);

-- Enable RLS
ALTER TABLE exam_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_shares
CREATE POLICY "Users can view shares involving them"
  ON exam_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can create shares from their exams"
  ON exam_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can delete shares they created"
  ON exam_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = shared_by);

-- Update exams RLS policy to include shared exams
DROP POLICY IF EXISTS "Users can view own exams and sample exams" ON exams;

CREATE POLICY "Users can view own exams, sample exams, and shared exams"
  ON exams FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR is_sample = true
    OR EXISTS (
      SELECT 1 FROM exam_shares
      WHERE exam_shares.exam_id = exams.id
      AND exam_shares.shared_with = auth.uid()
    )
  );
