-- Course Generation Jobs Table
-- Tracks the progress of AI course generation requests

CREATE TABLE IF NOT EXISTS course_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,

  -- Job status
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),

  -- Progress tracking
  current_step TEXT, -- 'auth', 'validation', 'fetch_settings', 'fetch_questions', 'detect_topics', 'generate_lessons', 'save'
  current_step_index INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 7,

  -- Topic-specific progress
  current_topic TEXT,
  current_topic_index INTEGER DEFAULT 0,
  total_topics INTEGER DEFAULT 0,

  -- Detailed progress data (JSONB for flexibility)
  progress_data JSONB DEFAULT '{}'::jsonb,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Results
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- Indexes for performance
CREATE INDEX idx_generation_jobs_user_id ON course_generation_jobs(user_id);
CREATE INDEX idx_generation_jobs_exam_id ON course_generation_jobs(exam_id);
CREATE INDEX idx_generation_jobs_status ON course_generation_jobs(status);
CREATE INDEX idx_generation_jobs_created_at ON course_generation_jobs(created_at DESC);

-- RLS Policies
ALTER TABLE course_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view their own generation jobs"
  ON course_generation_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "Users can create their own generation jobs"
  ON course_generation_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs (for cancellation)
CREATE POLICY "Users can update their own generation jobs"
  ON course_generation_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Cleanup function: delete old completed/failed jobs after 24 hours
CREATE OR REPLACE FUNCTION cleanup_old_generation_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM course_generation_jobs
  WHERE status IN ('completed', 'failed', 'cancelled')
    AND completed_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Optional: Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-generation-jobs', '0 */6 * * *', 'SELECT cleanup_old_generation_jobs()');
