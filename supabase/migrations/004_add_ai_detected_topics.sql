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
