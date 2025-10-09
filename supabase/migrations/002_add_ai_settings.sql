-- Migration: Add AI Settings Table
-- This table stores the selected AI model configuration (admin only)

-- Create AI Settings table (single row configuration)
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Model configuration
  provider TEXT NOT NULL DEFAULT 'anthropic', -- 'openai', 'anthropic', 'google'
  model_id TEXT NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
  model_name TEXT NOT NULL DEFAULT 'Claude Sonnet 3.5',

  -- Pricing information (per 1M tokens)
  input_price_per_million NUMERIC(10, 3) NOT NULL DEFAULT 3.000,
  output_price_per_million NUMERIC(10, 3) NOT NULL DEFAULT 15.000,

  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT, -- Admin email who made the change
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO ai_settings (
  provider,
  model_id,
  model_name,
  input_price_per_million,
  output_price_per_million,
  updated_by
) VALUES (
  'anthropic',
  'claude-3-5-sonnet-20241022',
  'Claude Sonnet 3.5',
  3.000,
  15.000,
  'system'
) ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (all authenticated users can view, but we'll control updates in API)
CREATE POLICY "AI settings viewable by authenticated users"
  ON ai_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "AI settings updatable by authenticated users"
  ON ai_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE ai_settings IS 'Stores the currently selected AI model configuration. Managed by admin console.';
