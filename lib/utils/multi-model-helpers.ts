import { createClient } from '@/lib/supabaseClient';

interface ModelAnalysis {
  model_id: string;
  model_name: string;
  model_provider: string;
  suggested_answer: string;
  explanation: string;
  confidence_score: number;
  analysis_metadata: {
    reasoning_summary?: string;
    reasoning_detailed?: string;
    option_explanations?: Record<string, {
      short: string;
      detailed: string;
    }>;
  };
}

/**
 * Get the best model analysis for a question based on confidence score
 * This is used to display the detailed explanations in purple sections
 */
export async function getBestModelAnalysis(questionId: string): Promise<ModelAnalysis | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ai_question_analyses')
    .select('*')
    .eq('question_id', questionId)
    .order('confidence_score', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error fetching best model analysis:', error);
    return null;
  }

  return data as ModelAnalysis;
}

/**
 * Transform multi-model analysis data to match the old single-model format
 * This allows us to reuse existing UI components
 */
export function transformToLegacyFormat(analysis: ModelAnalysis | null) {
  if (!analysis || !analysis.analysis_metadata) {
    return null;
  }

  const metadata = analysis.analysis_metadata;

  // Extract short and long explanations for each option
  const shortExplanations: Record<string, string> = {};
  const longExplanations: Record<string, string> = {};

  if (metadata.option_explanations) {
    Object.entries(metadata.option_explanations).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        shortExplanations[key] = value.short || '';
        longExplanations[key] = value.detailed || '';
      }
    });
  }

  return {
    ai_recommended_answer: analysis.suggested_answer,
    ai_confidence_score: analysis.confidence_score,
    ai_explanation: analysis.explanation,
    reasoning_summary: metadata.reasoning_summary || '',
    reasoning_detailed: metadata.reasoning_detailed || '',
    option_short_explanations: shortExplanations,
    option_long_explanations: longExplanations,
    model_used: analysis.model_name, // Add this for transparency
    model_provider: analysis.model_provider
  };
}

/**
 * Get all model analyses for a question
 * Used in the consensus display component
 */
export async function getAllModelAnalyses(questionId: string): Promise<ModelAnalysis[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('ai_question_analyses')
    .select('*')
    .eq('question_id', questionId)
    .order('confidence_score', { ascending: false });

  if (error || !data) {
    console.error('Error fetching model analyses:', error);
    return [];
  }

  return data as ModelAnalysis[];
}