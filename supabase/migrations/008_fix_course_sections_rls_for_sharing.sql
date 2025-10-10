-- Fix RLS policy for ai_generated_course_sections to support shared exams
-- This ensures users who have exams shared with them can also view the course content

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view course sections for their own exams and sample exams" ON ai_generated_course_sections;

-- Recreate with shared exam support
CREATE POLICY "Users can view course sections for their own exams, sample exams, and shared exams"
  ON ai_generated_course_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = ai_generated_course_sections.exam_id
      AND (
        exams.user_id = auth.uid()
        OR exams.is_sample = true
        OR EXISTS (
          SELECT 1 FROM exam_shares
          WHERE exam_shares.exam_id = exams.id
          AND exam_shares.shared_with = auth.uid()
        )
      )
    )
  );

-- Also fix the topics table RLS policy
DROP POLICY IF EXISTS "Users can view topics for their own exams and sample exams" ON ai_detected_topics;

CREATE POLICY "Users can view topics for their own exams, sample exams, and shared exams"
  ON ai_detected_topics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = ai_detected_topics.exam_id
      AND (
        exams.user_id = auth.uid()
        OR exams.is_sample = true
        OR EXISTS (
          SELECT 1 FROM exam_shares
          WHERE exam_shares.exam_id = exams.id
          AND exam_shares.shared_with = auth.uid()
        )
      )
    )
  );

COMMENT ON POLICY "Users can view course sections for their own exams, sample exams, and shared exams" ON ai_generated_course_sections
  IS 'Allows users to view course content for exams they own, sample exams, or exams shared with them';

COMMENT ON POLICY "Users can view topics for their own exams, sample exams, and shared exams" ON ai_detected_topics
  IS 'Allows users to view detected topics for exams they own, sample exams, or exams shared with them';
