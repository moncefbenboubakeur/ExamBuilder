'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Brain, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIQuestionAnalysis, AIConsensusResult, calculateConsensusStrength, getConsensusColor } from '@/lib/types/multi-llm';
import { supabase } from '@/lib/supabaseClient';

interface ModelConsensusDisplayProps {
  questionId: string;
  currentAnswer?: string;
  onModelAnswerSelect?: (answer: string) => void;
}

export default function ModelConsensusDisplay({
  questionId,
  currentAnswer,
  onModelAnswerSelect
}: ModelConsensusDisplayProps) {
  const [analyses, setAnalyses] = useState<AIQuestionAnalysis[]>([]);
  const [consensus, setConsensus] = useState<AIConsensusResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedView, setSelectedView] = useState<'consensus' | string>('consensus');

  useEffect(() => {
    fetchAnalyses();
  }, [questionId]);

  async function fetchAnalyses() {
    try {
      // Fetch all AI analyses for this question
      const { data: analysisData, error: analysisError } = await supabase
        .from('ai_question_analyses')
        .select('*')
        .eq('question_id', questionId)
        .order('confidence_score', { ascending: false });

      if (analysisError) {
        console.error('Failed to fetch analyses:', analysisError);
        return;
      }

      // Fetch consensus data
      const { data: consensusData, error: consensusError } = await supabase
        .from('ai_consensus_results')
        .select('*')
        .eq('question_id', questionId)
        .single();

      if (!consensusError && consensusData) {
        setConsensus(consensusData);
      }

      setAnalyses(analysisData || []);
    } catch (error) {
      console.error('Error fetching model analyses:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || analyses.length === 0) {
    return null;
  }

  const consensusStrength = consensus?.agreement_percentage
    ? calculateConsensusStrength(consensus.agreement_percentage)
    : 'none';

  const consensusColorClass = getConsensusColor(consensusStrength);

  // Group analyses by answer
  const answerGroups = analyses.reduce((acc, analysis) => {
    const answer = analysis.suggested_answer;
    if (!acc[answer]) {
      acc[answer] = [];
    }
    acc[answer].push(analysis);
    return acc;
  }, {} as Record<string, AIQuestionAnalysis[]>);

  // Sort answers by number of models suggesting them
  const sortedAnswers = Object.entries(answerGroups)
    .sort((a, b) => b[1].length - a[1].length);

  const primarySuggestion = sortedAnswers[0];
  const hasConsensus = primarySuggestion && primarySuggestion[1].length > analyses.length / 2;

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      {/* Compact View */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Analysis
          </span>
          {consensus && (
            <span className={cn("text-sm font-semibold", consensusColorClass)}>
              {consensus.consensus_answer}
              ({Math.round(consensus.agreement_percentage || 0)}% agree)
            </span>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* View Selector */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedView('consensus')}
              className={cn(
                "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                selectedView === 'consensus'
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              Consensus View
            </button>
            {analyses.map((analysis) => (
              <button
                key={analysis.model_id}
                onClick={() => setSelectedView(analysis.model_id)}
                className={cn(
                  "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                  selectedView === analysis.model_id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                {analysis.model_name}
              </button>
            ))}
          </div>

          {/* Content based on selected view */}
          {selectedView === 'consensus' ? (
            <div className="space-y-3">
              {/* Answer Distribution */}
              {sortedAnswers.map(([answer, models]) => {
                const percentage = (models.length / analyses.length) * 100;
                const isCurrentAnswer = answer === currentAnswer;

                return (
                  <div
                    key={answer}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all cursor-pointer",
                      isCurrentAnswer
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    )}
                    onClick={() => onModelAnswerSelect?.(answer)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {answer}
                        </span>
                        {models.length === analyses.length && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {models.length} / {analyses.length} models
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          percentage >= 75 ? "bg-green-600" :
                          percentage >= 50 ? "bg-yellow-600" :
                          "bg-orange-600"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    {/* Models list */}
                    <div className="flex flex-wrap gap-1">
                      {models.map((model) => (
                        <span
                          key={model.model_id}
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                        >
                          {model.model_name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Individual Model View
            <div>
              {analyses
                .filter(a => a.model_id === selectedView)
                .map((analysis) => (
                  <div key={analysis.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {analysis.model_name} Analysis
                      </h4>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence: {Math.round((analysis.confidence_score || 0) * 100)}%
                      </span>
                    </div>

                    <div className={cn(
                      "p-3 rounded-lg border-2",
                      analysis.suggested_answer === currentAnswer
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-gray-200 dark:border-gray-600"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-lg">
                          Answer: {analysis.suggested_answer}
                        </span>
                        {analysis.confidence_score && analysis.confidence_score >= 0.8 && (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                        {analysis.confidence_score && analysis.confidence_score < 0.5 && (
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>

                      {analysis.explanation && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {analysis.explanation}
                        </p>
                      )}

                      {analysis.analysis_metadata?.reasoning_summary && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Summary:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {analysis.analysis_metadata.reasoning_summary}
                          </p>
                        </div>
                      )}

                      {analysis.analysis_metadata?.option_explanations && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                            Option Analysis:
                          </p>
                          <div className="space-y-2">
                            {Object.entries(analysis.analysis_metadata.option_explanations).map(([option, explanation]) => (
                              <div key={option} className="text-sm">
                                <span className="font-semibold">{option}:</span>{' '}
                                <span className="text-gray-700 dark:text-gray-300">
                                  {typeof explanation === 'object' && explanation !== null
                                    ? (explanation as { short?: string; detailed?: string }).short || ''
                                    : String(explanation || '')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}