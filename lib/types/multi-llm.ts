// Types for Multi-LLM Analysis System

export interface AIQuestionAnalysis {
  id: string;
  question_id: string;
  model_provider: 'openai' | 'anthropic' | 'google';
  model_id: string;
  model_name: string;
  suggested_answer: string;
  explanation?: string;
  confidence_score?: number;
  analysis_metadata?: {
    tokens_used?: number;
    response_time_ms?: number;
    temperature?: number;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface AIConsensusResult {
  question_id: string;
  consensus_answer?: string;
  agreement_percentage?: number;
  total_models_analyzed: number;
  models_in_agreement: string[];
  models_dissenting: string[];
  dissenting_answers: Record<string, string>; // model_id -> answer
  created_at: string;
  updated_at: string;
}

export interface QuestionWithConsensus {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  ai_consensus_answer?: string;
  ai_agreement_score?: number;
  ai_models_analyzed?: number;
  ai_last_analyzed_at?: string;
}

export interface ModelAnalysisRequest {
  examId: string;
  selectedModels: string[]; // Array of model IDs to use
  overwriteExisting?: boolean; // Whether to re-analyze if model already analyzed
}

export interface ModelAnalysisProgress {
  modelId: string;
  modelName: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  currentQuestion: number;
  totalQuestions: number;
  error?: string;
}

export interface ModelAnalysisResult {
  examId: string;
  totalQuestions: number;
  modelsUsed: string[];
  analysesCompleted: number;
  consensusReached: number; // Questions where all models agree
  partialAgreement: number; // Questions with partial agreement
  noConsensus: number; // Questions with no clear consensus
  modelPerformance: {
    [modelId: string]: {
      questionsAnalyzed: number;
      averageConfidence: number;
      processingTimeMs: number;
    };
  };
}

export interface ModelSelectionOption {
  modelId: string;
  modelName: string;
  provider: 'openai' | 'anthropic' | 'google';
  costPerMillion: number;
  selected: boolean;
  available: boolean;
  tier: 'flagship' | 'standard' | 'fast';
}

export interface ConsensusView {
  questionId: string;
  analyses: AIQuestionAnalysis[];
  consensus: AIConsensusResult;
  primarySuggestion: {
    answer: string;
    modelCount: number;
    models: string[];
    confidence: number;
  };
  alternativeSuggestions: Array<{
    answer: string;
    modelCount: number;
    models: string[];
    confidence: number;
  }>;
}

// Helper functions for consensus calculation
export function calculateConsensusStrength(agreementPercentage: number): 'strong' | 'moderate' | 'weak' | 'none' {
  if (agreementPercentage >= 75) return 'strong';
  if (agreementPercentage >= 50) return 'moderate';
  if (agreementPercentage >= 25) return 'weak';
  return 'none';
}

export function getConsensusColor(strength: 'strong' | 'moderate' | 'weak' | 'none'): string {
  switch (strength) {
    case 'strong': return 'text-green-600 dark:text-green-400';
    case 'moderate': return 'text-yellow-600 dark:text-yellow-400';
    case 'weak': return 'text-orange-600 dark:text-orange-400';
    case 'none': return 'text-red-600 dark:text-red-400';
  }
}

export function getConsensusIcon(strength: 'strong' | 'moderate' | 'weak' | 'none'): string {
  switch (strength) {
    case 'strong': return '✓✓✓';
    case 'moderate': return '✓✓';
    case 'weak': return '✓';
    case 'none': return '✗';
  }
}

// Cost calculation utilities
export function calculateAnalysisCost(models: ModelSelectionOption[], questionCount: number): number {
  // Estimate ~500 tokens per question (prompt + response)
  const tokensPerQuestion = 500;
  const totalTokens = tokensPerQuestion * questionCount;

  let totalCost = 0;
  models.forEach(model => {
    if (model.selected) {
      totalCost += (totalTokens / 1000000) * model.costPerMillion;
    }
  });

  return totalCost;
}

export function formatModelName(modelId: string): string {
  // Convert model IDs to display names
  const nameMap: Record<string, string> = {
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4': 'GPT-4',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
  };

  return nameMap[modelId] || modelId;
}