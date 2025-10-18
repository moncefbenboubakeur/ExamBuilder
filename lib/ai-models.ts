// AI Model configurations with pricing

export interface AIModel {
  id: string;
  provider: 'openai' | 'anthropic' | 'google';
  name: string;
  tier: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  combinedPrice: number;
}

export const AI_MODELS: AIModel[] = [
  // OpenAI Models (Official pricing from platform.openai.com/pricing)
  {
    id: 'gpt-5-nano',
    provider: 'openai',
    name: 'GPT-5 Nano',
    tier: 'Fast',
    inputPricePerMillion: 0.050,
    outputPricePerMillion: 0.40,
    combinedPrice: 0.45,
  },
  {
    id: 'gpt-4.1-nano',
    provider: 'openai',
    name: 'GPT-4.1 Nano',
    tier: 'Fast',
    inputPricePerMillion: 0.100,
    outputPricePerMillion: 0.40,
    combinedPrice: 0.50,
  },
  {
    id: 'gpt-5-mini',
    provider: 'openai',
    name: 'GPT-5 Mini',
    tier: 'Balanced',
    inputPricePerMillion: 0.250,
    outputPricePerMillion: 2.00,
    combinedPrice: 2.25,
  },
  {
    id: 'gpt-4.1-mini',
    provider: 'openai',
    name: 'GPT-4.1 Mini',
    tier: 'Balanced',
    inputPricePerMillion: 0.400,
    outputPricePerMillion: 1.60,
    combinedPrice: 2.00,
  },
  {
    id: 'gpt-5',
    provider: 'openai',
    name: 'GPT-5',
    tier: 'Flagship',
    inputPricePerMillion: 1.250,
    outputPricePerMillion: 10.00,
    combinedPrice: 11.25,
  },
  {
    id: 'gpt-4.1',
    provider: 'openai',
    name: 'GPT-4.1',
    tier: 'Advanced',
    inputPricePerMillion: 2.000,
    outputPricePerMillion: 8.00,
    combinedPrice: 10.00,
  },

  // Anthropic Models (Official API identifiers from docs.claude.com)
  {
    id: 'claude-3-haiku-20240307',
    provider: 'anthropic',
    name: 'Claude 3 Haiku',
    tier: 'Fast',
    inputPricePerMillion: 0.250,
    outputPricePerMillion: 1.25,
    combinedPrice: 1.50,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    name: 'Claude 3.5 Haiku',
    tier: 'Fast',
    inputPricePerMillion: 0.800,
    outputPricePerMillion: 4.00,
    combinedPrice: 4.80,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    name: 'Claude Haiku 4.5',
    tier: 'Fast',
    inputPricePerMillion: 1.000,
    outputPricePerMillion: 5.00,
    combinedPrice: 6.00,
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    tier: 'Balanced',
    inputPricePerMillion: 3.000,
    outputPricePerMillion: 15.00,
    combinedPrice: 18.00,
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic',
    name: 'Claude Sonnet 4.5',
    tier: 'Flagship',
    inputPricePerMillion: 3.000,
    outputPricePerMillion: 15.00,
    combinedPrice: 18.00,
  },
  {
    id: 'claude-opus-4-1-20250805',
    provider: 'anthropic',
    name: 'Claude Opus 4.1',
    tier: 'Most Capable',
    inputPricePerMillion: 15.000,
    outputPricePerMillion: 75.00,
    combinedPrice: 90.00,
  },

  // Google Models
  {
    id: 'gemini-2.0-flash-lite',
    provider: 'google',
    name: 'Gemini 2.0 Flash Lite',
    tier: 'Lightweight',
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.30,
    combinedPrice: 0.38,
  },
  {
    id: 'gemini-2.5-flash-lite',
    provider: 'google',
    name: 'Gemini 2.5 Flash Lite',
    tier: 'Lightweight',
    inputPricePerMillion: 0.100,
    outputPricePerMillion: 0.40,
    combinedPrice: 0.50,
  },
  {
    id: 'gemini-2.0-flash',
    provider: 'google',
    name: 'Gemini 2.0 Flash',
    tier: 'Fast',
    inputPricePerMillion: 0.150,
    outputPricePerMillion: 0.60,
    combinedPrice: 0.75,
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'google',
    name: 'Gemini 2.5 Flash',
    tier: 'Fast',
    inputPricePerMillion: 0.300,
    outputPricePerMillion: 2.50,
    combinedPrice: 2.80,
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'google',
    name: 'Gemini 2.5 Pro',
    tier: 'Flagship',
    inputPricePerMillion: 1.250,
    outputPricePerMillion: 10.00,
    combinedPrice: 11.25,
  },
  {
    id: 'gemini-2.5-pro-long',
    provider: 'google',
    name: 'Gemini 2.5 Pro (Long)',
    tier: 'Extended Context',
    inputPricePerMillion: 2.500,
    outputPricePerMillion: 15.00,
    combinedPrice: 17.50,
  },
];

export function getModelById(modelId: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === modelId);
}

export function getModelsByProvider(provider: 'openai' | 'anthropic' | 'google'): AIModel[] {
  return AI_MODELS.filter(m => m.provider === provider);
}
