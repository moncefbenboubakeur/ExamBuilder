-- Fix RLS policies for ai_consensus_results and ai_question_analyses tables

-- Enable RLS on the tables if not already enabled
ALTER TABLE ai_question_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consensus_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view AI analyses" ON ai_question_analyses;
DROP POLICY IF EXISTS "Users can view consensus results" ON ai_consensus_results;

-- Create new policies that allow all authenticated users to read
-- ai_question_analyses: All authenticated users can view AI analyses
CREATE POLICY "Users can view AI analyses"
  ON ai_question_analyses
  FOR SELECT
  TO authenticated
  USING (true);

-- ai_consensus_results: All authenticated users can view consensus results
CREATE POLICY "Users can view consensus results"
  ON ai_consensus_results
  FOR SELECT
  TO authenticated
  USING (true);

-- Also allow anonymous users to read (for public exams if needed)
CREATE POLICY "Anonymous can view AI analyses"
  ON ai_question_analyses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous can view consensus results"
  ON ai_consensus_results
  FOR SELECT
  TO anon
  USING (true);

-- Admin policies for insert/update/delete (only for service role)
-- These are handled by the API routes which use service role