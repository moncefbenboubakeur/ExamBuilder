-- Fix RLS policies to allow generating courses for sample exams
-- Sample exams should be accessible by all authenticated users

-- Fix ai_detected_topics policies
DROP POLICY IF EXISTS "Users can manage topics for their own exams" ON ai_detected_topics;

CREATE POLICY "Users can manage topics for their own exams and sample exams"
  ON ai_detected_topics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = ai_detected_topics.exam_id
      AND (exams.user_id = auth.uid() OR exams.is_sample = true)
    )
  );

-- Fix ai_generated_course_sections policies
DROP POLICY IF EXISTS "Users can manage course sections for their own exams" ON ai_generated_course_sections;

CREATE POLICY "Users can manage course sections for their own exams and sample exams"
  ON ai_generated_course_sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = ai_generated_course_sections.exam_id
      AND (exams.user_id = auth.uid() OR exams.is_sample = true)
    )
  );
