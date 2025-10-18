-- Migration: Multi-LLM Analysis System
-- This migration adds support for analyzing questions with multiple AI models
-- and tracking consensus between different models

-- 1. Create table for storing individual AI model analyses
CREATE TABLE IF NOT EXISTS ai_question_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  model_provider TEXT NOT NULL, -- 'openai', 'anthropic', 'google'
  model_id TEXT NOT NULL, -- 'gpt-4-turbo', 'claude-3-opus', etc.
  model_name TEXT NOT NULL, -- Display name for UI
  suggested_answer TEXT NOT NULL, -- 'A', 'B', 'C', 'D', etc.
  explanation TEXT, -- AI's reasoning for the answer
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1), -- 0-1 confidence
  analysis_metadata JSONB DEFAULT '{}', -- Additional data (tokens used, response time, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one analysis per model per question
  CONSTRAINT unique_question_model UNIQUE (question_id, model_id)
);

-- 2. Create table for tracking consensus between models
CREATE TABLE IF NOT EXISTS ai_consensus_results (
  question_id UUID PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  consensus_answer TEXT, -- Most agreed upon answer (null if no consensus)
  agreement_percentage FLOAT CHECK (agreement_percentage >= 0 AND agreement_percentage <= 100),
  total_models_analyzed INTEGER NOT NULL DEFAULT 0,
  models_in_agreement TEXT[] DEFAULT '{}', -- Array of model IDs that agree
  models_dissenting TEXT[] DEFAULT '{}', -- Array of model IDs that disagree
  dissenting_answers JSONB DEFAULT '{}', -- Map of model_id to their different answer
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Add consensus fields to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS ai_consensus_answer TEXT,
ADD COLUMN IF NOT EXISTS ai_agreement_score FLOAT CHECK (ai_agreement_score >= 0 AND ai_agreement_score <= 100),
ADD COLUMN IF NOT EXISTS ai_models_analyzed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_last_analyzed_at TIMESTAMPTZ;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_analyses_question ON ai_question_analyses(question_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_model ON ai_question_analyses(model_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_question_model ON ai_question_analyses(question_id, model_id);
CREATE INDEX IF NOT EXISTS idx_consensus_question ON ai_consensus_results(question_id);
CREATE INDEX IF NOT EXISTS idx_consensus_agreement ON ai_consensus_results(agreement_percentage);

-- 5. Enable Row Level Security
ALTER TABLE ai_question_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consensus_results ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for ai_question_analyses
-- All authenticated users can view analyses for questions they have access to
CREATE POLICY "Users can view AI analyses for accessible questions"
  ON ai_question_analyses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN exams e ON e.id = q.exam_id
      WHERE q.id = ai_question_analyses.question_id
      AND (
        e.user_id = auth.uid()
        OR e.is_sample = true
        OR EXISTS (
          SELECT 1 FROM exam_shares es
          WHERE es.exam_id = e.id
          AND es.shared_with = auth.uid()
        )
      )
    )
  );

-- Only admin can insert/update/delete analyses
CREATE POLICY "Admin can manage AI analyses"
  ON ai_question_analyses
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'monceftab@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'monceftab@gmail.com'
  );

-- 7. RLS Policies for ai_consensus_results
-- All authenticated users can view consensus for questions they have access to
CREATE POLICY "Users can view consensus results for accessible questions"
  ON ai_consensus_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN exams e ON e.id = q.exam_id
      WHERE q.id = ai_consensus_results.question_id
      AND (
        e.user_id = auth.uid()
        OR e.is_sample = true
        OR EXISTS (
          SELECT 1 FROM exam_shares es
          WHERE es.exam_id = e.id
          AND es.shared_with = auth.uid()
        )
      )
    )
  );

-- Only admin can insert/update/delete consensus results
CREATE POLICY "Admin can manage consensus results"
  ON ai_consensus_results
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'monceftab@gmail.com'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'monceftab@gmail.com'
  );

-- 8. Create function to calculate consensus
CREATE OR REPLACE FUNCTION calculate_consensus(p_question_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_models INTEGER;
  v_consensus_answer TEXT;
  v_max_agreement INTEGER;
  v_agreement_percentage FLOAT;
  v_models_in_agreement TEXT[];
  v_models_dissenting TEXT[];
  v_dissenting_answers JSONB;
BEGIN
  -- Count total models that analyzed this question
  SELECT COUNT(DISTINCT model_id) INTO v_total_models
  FROM ai_question_analyses
  WHERE question_id = p_question_id;

  IF v_total_models = 0 THEN
    RETURN;
  END IF;

  -- Find the most common answer and count agreements
  WITH answer_counts AS (
    SELECT
      suggested_answer,
      COUNT(*) as count,
      ARRAY_AGG(model_id) as models
    FROM ai_question_analyses
    WHERE question_id = p_question_id
    GROUP BY suggested_answer
    ORDER BY count DESC
  )
  SELECT
    suggested_answer,
    count,
    models
  INTO v_consensus_answer, v_max_agreement, v_models_in_agreement
  FROM answer_counts
  LIMIT 1;

  -- Calculate agreement percentage
  v_agreement_percentage := (v_max_agreement::FLOAT / v_total_models) * 100;

  -- Get dissenting models and their answers
  SELECT
    ARRAY_AGG(DISTINCT model_id),
    JSONB_OBJECT_AGG(model_id, suggested_answer)
  INTO v_models_dissenting, v_dissenting_answers
  FROM ai_question_analyses
  WHERE question_id = p_question_id
  AND suggested_answer != v_consensus_answer;

  -- Update or insert consensus results
  INSERT INTO ai_consensus_results (
    question_id,
    consensus_answer,
    agreement_percentage,
    total_models_analyzed,
    models_in_agreement,
    models_dissenting,
    dissenting_answers,
    updated_at
  ) VALUES (
    p_question_id,
    v_consensus_answer,
    v_agreement_percentage,
    v_total_models,
    v_models_in_agreement,
    COALESCE(v_models_dissenting, '{}'),
    COALESCE(v_dissenting_answers, '{}'),
    NOW()
  )
  ON CONFLICT (question_id) DO UPDATE SET
    consensus_answer = EXCLUDED.consensus_answer,
    agreement_percentage = EXCLUDED.agreement_percentage,
    total_models_analyzed = EXCLUDED.total_models_analyzed,
    models_in_agreement = EXCLUDED.models_in_agreement,
    models_dissenting = EXCLUDED.models_dissenting,
    dissenting_answers = EXCLUDED.dissenting_answers,
    updated_at = NOW();

  -- Update questions table with consensus data
  UPDATE questions SET
    ai_consensus_answer = v_consensus_answer,
    ai_agreement_score = v_agreement_percentage,
    ai_models_analyzed = v_total_models,
    ai_last_analyzed_at = NOW()
  WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to auto-calculate consensus when analyses are added/updated
CREATE OR REPLACE FUNCTION trigger_calculate_consensus()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_consensus(NEW.question_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_consensus
AFTER INSERT OR UPDATE ON ai_question_analyses
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_consensus();

-- 10. Add helpful comments
COMMENT ON TABLE ai_question_analyses IS 'Stores individual AI model analyses for each question';
COMMENT ON TABLE ai_consensus_results IS 'Tracks consensus and agreement between multiple AI models for each question';
COMMENT ON COLUMN ai_question_analyses.confidence_score IS 'Model confidence in the answer (0-1 scale)';
COMMENT ON COLUMN ai_consensus_results.agreement_percentage IS 'Percentage of models that agree on the consensus answer';
COMMENT ON FUNCTION calculate_consensus IS 'Calculates and updates consensus data based on all AI analyses for a question';