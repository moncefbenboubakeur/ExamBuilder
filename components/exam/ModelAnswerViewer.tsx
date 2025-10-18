'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Users, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIQuestionAnalysis, AIConsensusResult } from '@/lib/types/multi-llm';
import { supabase } from '@/lib/supabaseClient';
import { AI_MODELS } from '@/lib/ai-models';

interface ModelAnswerViewerProps {
  sessionId: string;
  questionId: string;
  correctAnswer: string;
  userAnswer: string;
}

export default function ModelAnswerViewer({
  sessionId,
  questionId,
  correctAnswer,
  userAnswer
}: ModelAnswerViewerProps) {
  const [analyses, setAnalyses] = useState<AIQuestionAnalysis[]>([]);
  const [consensus, setConsensus] = useState<AIConsensusResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelAnalyses();
  }, [questionId]);

  async function fetchModelAnalyses() {
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

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return null;
  }

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

  // Determine if user matched consensus
  const consensusAnswer = consensus?.consensus_answer || sortedAnswers[0]?.[0];
  const userMatchesConsensus = userAnswer === consensusAnswer;
  const userMatchesCorrect = userAnswer === correctAnswer;

  // Get model info for each analysis
  const getModelInfo = (modelId: string) => {
    return AI_MODELS.find(m => m.id === modelId);
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Model Analysis Comparison
        </h3>
        {consensus && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(consensus.agreement_percentage || 0)}% Agreement
          </span>
        )}
      </div>

      {/* User Answer Validation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* User vs Correct */}
        <div className={cn(
          "p-3 rounded-lg border-2",
          userMatchesCorrect
            ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
            : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
        )}>
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Your Answer vs Correct
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{userAnswer}</span>
            {userMatchesCorrect ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>

        {/* User vs Consensus */}
        {consensus && (
          <div className={cn(
            "p-3 rounded-lg border-2",
            userMatchesConsensus
              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
              : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700"
          )}>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Your Answer vs AI Consensus
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{consensusAnswer}</span>
              {userMatchesConsensus ? (
                <Users className="w-4 h-4 text-blue-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              )}
            </div>
          </div>
        )}

        {/* Consensus vs Correct */}
        {consensus && (
          <div className={cn(
            "p-3 rounded-lg border-2",
            consensusAnswer === correctAnswer
              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700"
              : "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
          )}>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              AI Consensus vs Correct
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{consensusAnswer}</span>
              {consensusAnswer === correctAnswer ? (
                <Bot className="w-4 h-4 text-purple-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Model Breakdown */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Individual Model Responses
        </h4>

        <div className="space-y-2">
          {sortedAnswers.map(([answer, models]) => {
            const percentage = (models.length / analyses.length) * 100;
            const isCorrect = answer === correctAnswer;

            return (
              <div key={answer} className="space-y-2">
                {/* Answer Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-lg font-bold",
                      isCorrect ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"
                    )}>
                      {answer}
                    </span>
                    {isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {models.length}/{analyses.length} models ({Math.round(percentage)}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      isCorrect ? "bg-green-500" :
                      percentage >= 50 ? "bg-yellow-500" :
                      "bg-orange-500"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Models List */}
                <div className="flex flex-wrap gap-2">
                  {models.map((model) => {
                    const modelInfo = getModelInfo(model.model_id);
                    return (
                      <div
                        key={model.model_id}
                        className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 rounded-lg text-xs border border-gray-200 dark:border-gray-600"
                      >
                        <span className={cn(
                          "font-semibold",
                          modelInfo?.provider === 'openai' && "text-green-600",
                          modelInfo?.provider === 'anthropic' && "text-blue-600",
                          modelInfo?.provider === 'google' && "text-red-600"
                        )}>
                          {model.model_name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          ({Math.round((model.confidence_score || 0) * 100)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Best Explanation */}
                {models[0].explanation && (
                  <div className="mt-2 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      {models[0].model_name} Explanation:
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {models[0].explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      {sortedAnswers.length > 1 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                Models Disagreed on This Question
              </p>
              <p className="text-yellow-800 dark:text-yellow-400 text-xs">
                {consensus && consensus.agreement_percentage && consensus.agreement_percentage < 50
                  ? "No clear consensus was reached. This may indicate an ambiguous or challenging question."
                  : consensus && consensus.agreement_percentage && consensus.agreement_percentage >= 75
                  ? "Strong consensus was reached among models."
                  : "Partial agreement was found among models."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}