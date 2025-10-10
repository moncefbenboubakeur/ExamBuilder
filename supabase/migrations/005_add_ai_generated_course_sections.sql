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
