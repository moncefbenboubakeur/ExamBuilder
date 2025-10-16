-- Migration: Add User Shuffle Preferences Feature
-- Description: Adds user_preferences table and shuffled data fields to exam_sessions
-- Date: 2025-10-13

-- =====================================================
-- 1. Create user_preferences table
-- =====================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- =====================================================
-- 2. Add shuffle columns to exam_sessions
-- =====================================================

-- Add columns to store shuffled data per session
ALTER TABLE exam_sessions
  ADD COLUMN IF NOT EXISTS shuffled_question_order JSONB,
  ADD COLUMN IF NOT EXISTS shuffled_options_map JSONB,
  ADD COLUMN IF NOT EXISTS elapsed_time INTEGER DEFAULT 0;

-- Create index for JSONB columns (optional, for future query optimization)
CREATE INDEX IF NOT EXISTS idx_exam_sessions_shuffled_questions ON exam_sessions USING GIN (shuffled_question_order);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_shuffled_options ON exam_sessions USING GIN (shuffled_options_map);

-- =====================================================
-- 3. Enable Row Level Security for user_preferences
-- =====================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own preferences (optional, for cleanup)
CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. Create function to auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_preferences
DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- =====================================================
-- 5. Comments for documentation
-- =====================================================

COMMENT ON TABLE user_preferences IS 'Stores per-user exam personalization settings including question and option shuffle preferences';
COMMENT ON COLUMN user_preferences.shuffle_questions IS 'When true, questions will be randomized in exam sessions';
COMMENT ON COLUMN user_preferences.shuffle_options IS 'When true, answer options will be randomized in exam sessions';

COMMENT ON COLUMN exam_sessions.shuffled_question_order IS 'Array of question IDs in shuffled order for this session (null if shuffle disabled)';
COMMENT ON COLUMN exam_sessions.shuffled_options_map IS 'Map of question_id to option key mappings (e.g., {"q1": {"A":"D", "B":"A"}}) (null if shuffle disabled)';
COMMENT ON COLUMN exam_sessions.elapsed_time IS 'Total time spent on exam in seconds';
