-- Add elapsed_time column to exam_sessions table
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS elapsed_time INTEGER DEFAULT 0;

COMMENT ON COLUMN exam_sessions.elapsed_time IS 'Total elapsed time in seconds for the exam session';
