-- Migration: Add AI Analysis Support
-- This migration adds the question_ai_analysis table for storing AI-generated explanations
-- Run this in Supabase SQL Editor

-- Create AI Analysis table
CREATE TABLE IF NOT EXISTS question_ai_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,

  -- AI's independent answer (may differ from exam creator's answer)
  ai_recommended_answer TEXT NOT NULL,
  ai_confidence_score FLOAT CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),

  -- Two-tier explanations per option
  option_short_explanations JSONB NOT NULL,  -- {"A": "Quick verdict", "B": "..."}
  option_long_explanations JSONB NOT NULL,   -- {"A": "Detailed explanation", "B": "..."}

  -- Overall reasoning (two levels)
  reasoning_summary TEXT,      -- 2-3 sentence summary
  reasoning_detailed TEXT,     -- Full comprehensive explanation

  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_analysis_question ON question_ai_analysis(question_id);

-- Enable Row Level Security
ALTER TABLE question_ai_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies (all authenticated users can view AI analysis)
CREATE POLICY "AI analysis viewable by authenticated users"
  ON question_ai_analysis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "AI analysis insertable by authenticated users"
  ON question_ai_analysis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE question_ai_analysis IS 'Stores pre-computed AI analysis of exam questions. AI analyzes questions independently without seeing exam creator answers.';
COMMENT ON COLUMN question_ai_analysis.ai_recommended_answer IS 'AI''s independent determination of the best answer (may differ from exam creator or community vote)';
COMMENT ON COLUMN question_ai_analysis.ai_confidence_score IS 'AI confidence in its answer (0.0 to 1.0)';
COMMENT ON COLUMN question_ai_analysis.option_short_explanations IS 'JSONB object with short (1-line) explanations for each option';
COMMENT ON COLUMN question_ai_analysis.option_long_explanations IS 'JSONB object with detailed (3-5 sentence) explanations for each option';
