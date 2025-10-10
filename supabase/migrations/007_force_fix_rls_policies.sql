-- Force fix RLS policies by dropping and recreating with correct logic

-- Fix ai_detected_topics table
DROP POLICY IF EXISTS "Users can view topics for their own exams and sample exams" ON ai_detected_topics;
DROP POLICY IF EXISTS "Users can manage topics for their own exams" ON ai_detected_topics;
DROP POLICY IF EXISTS "Users can manage topics for their own exams and sample exams" ON ai_detected_topics;

-- Create SELECT policy (viewing)
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

-- Create ALL policy (insert/update/delete)
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

-- Fix ai_generated_course_sections table
DROP POLICY IF EXISTS "Users can view course sections for their own exams and sample exams" ON ai_generated_course_sections;
DROP POLICY IF EXISTS "Users can manage course sections for their own exams" ON ai_generated_course_sections;
DROP POLICY IF EXISTS "Users can manage course sections for their own exams and sample exams" ON ai_generated_course_sections;

-- Create SELECT policy (viewing)
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

-- Create ALL policy (insert/update/delete)
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
