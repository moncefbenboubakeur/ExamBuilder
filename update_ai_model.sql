-- Update AI settings to use a real model (Claude 3.5 Sonnet)
UPDATE ai_settings 
SET 
  provider = 'anthropic',
  model_id = 'claude-3-5-sonnet-20241022',
  model_name = 'Claude 3.5 Sonnet',
  input_price_per_million = 3.000,
  output_price_per_million = 15.000,
  updated_by = 'system',
  updated_at = NOW()
WHERE id IS NOT NULL;
