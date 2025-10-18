'use client';

import { useEffect, useState } from 'react';
import { Brain, CheckCircle, AlertCircle, XCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { calculateConsensusStrength, getConsensusColor } from '@/lib/types/multi-llm';

interface ConsensusIndicatorProps {
  questionId: string;
  compact?: boolean;
  showDetails?: boolean;
}

export default function ConsensusIndicator({
  questionId,
  compact = false,
  showDetails = false
}: ConsensusIndicatorProps) {
  const [consensus, setConsensus] = useState<{
    consensus_answer?: string;
    agreement_percentage?: number;
    total_models_analyzed: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsensus();
  }, [questionId]);

  async function fetchConsensus() {
    try {
      const { data, error } = await supabase
        .from('ai_consensus_results')
        .select('consensus_answer, agreement_percentage, total_models_analyzed')
        .eq('question_id', questionId)
        .single();

      if (!error && data) {
        setConsensus(data);
      }
    } catch (error) {
      console.error('Error fetching consensus:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return compact ? null : (
      <div className="animate-pulse">
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    );
  }

  if (!consensus || consensus.total_models_analyzed === 0) {
    return compact ? null : (
      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
        <HelpCircle className="w-4 h-4" />
        {showDetails && <span className="text-xs">No AI analysis</span>}
      </div>
    );
  }

  const agreementPercentage = consensus.agreement_percentage || 0;
  const strength = calculateConsensusStrength(agreementPercentage);
  const colorClass = getConsensusColor(strength);

  // Choose icon based on consensus strength
  const getIcon = () => {
    if (strength === 'strong') return <CheckCircle className="w-4 h-4" />;
    if (strength === 'moderate') return <AlertCircle className="w-4 h-4" />;
    if (strength === 'weak') return <AlertCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  // Choose tooltip/label based on consensus strength
  const getLabel = () => {
    if (strength === 'strong') return 'Strong consensus';
    if (strength === 'moderate') return 'Moderate consensus';
    if (strength === 'weak') return 'Weak consensus';
    return 'No consensus';
  };

  if (compact) {
    // Compact view - just an icon with color
    return (
      <div
        className={cn("flex items-center", colorClass)}
        title={`${getLabel()}: ${Math.round(agreementPercentage)}% agreement (${consensus.total_models_analyzed} models)`}
      >
        {getIcon()}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1 rounded-lg",
      strength === 'strong' && "bg-green-50 dark:bg-green-900/20",
      strength === 'moderate' && "bg-yellow-50 dark:bg-yellow-900/20",
      strength === 'weak' && "bg-orange-50 dark:bg-orange-900/20",
      strength === 'none' && "bg-red-50 dark:bg-red-900/20"
    )}>
      <Brain className={cn("w-4 h-4", colorClass)} />

      <div className="flex items-center gap-1">
        {getIcon()}
        <span className={cn("text-sm font-medium", colorClass)}>
          {consensus.consensus_answer}
        </span>
      </div>

      {showDetails && (
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {Math.round(agreementPercentage)}% ({consensus.total_models_analyzed} models)
        </span>
      )}
    </div>
  );
}

interface ConsensusQuickViewProps {
  examId: string;
}

export function ConsensusQuickView({ examId }: ConsensusQuickViewProps) {
  const [stats, setStats] = useState<{
    totalQuestions: number;
    strongConsensus: number;
    moderateConsensus: number;
    weakConsensus: number;
    noConsensus: number;
    noAnalysis: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [examId]);

  async function fetchStats() {
    try {
      // Get all questions for the exam
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('exam_id', examId);

      if (questionsError || !questions) {
        console.error('Error fetching questions:', questionsError);
        return;
      }

      const questionIds = questions.map(q => q.id);

      // Get consensus results for all questions
      const { data: consensusResults, error: consensusError } = await supabase
        .from('ai_consensus_results')
        .select('agreement_percentage, total_models_analyzed')
        .in('question_id', questionIds);

      if (consensusError) {
        console.error('Error fetching consensus:', consensusError);
        return;
      }

      // Calculate statistics
      let strongConsensus = 0;
      let moderateConsensus = 0;
      let weakConsensus = 0;
      let noConsensus = 0;

      (consensusResults || []).forEach(result => {
        if (!result.agreement_percentage || result.total_models_analyzed === 0) {
          return;
        }

        const strength = calculateConsensusStrength(result.agreement_percentage);
        switch (strength) {
          case 'strong':
            strongConsensus++;
            break;
          case 'moderate':
            moderateConsensus++;
            break;
          case 'weak':
            weakConsensus++;
            break;
          case 'none':
            noConsensus++;
            break;
        }
      });

      const analyzed = consensusResults?.length || 0;
      const noAnalysis = questions.length - analyzed;

      setStats({
        totalQuestions: questions.length,
        strongConsensus,
        moderateConsensus,
        weakConsensus,
        noConsensus,
        noAnalysis
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const analyzedQuestions = stats.totalQuestions - stats.noAnalysis;
  const overallAgreement = analyzedQuestions > 0
    ? ((stats.strongConsensus + stats.moderateConsensus) / analyzedQuestions) * 100
    : 0;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI Consensus Overview
        </h3>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {analyzedQuestions}/{stats.totalQuestions} analyzed
        </span>
      </div>

      {analyzedQuestions > 0 ? (
        <>
          {/* Overall Agreement Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>Overall Agreement</span>
              <span>{Math.round(overallAgreement)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  overallAgreement >= 75 ? "bg-green-500" :
                  overallAgreement >= 50 ? "bg-yellow-500" :
                  "bg-orange-500"
                )}
                style={{ width: `${overallAgreement}%` }}
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {stats.strongConsensus > 0 && (
              <div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {stats.strongConsensus}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Strong</div>
              </div>
            )}
            {stats.moderateConsensus > 0 && (
              <div>
                <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.moderateConsensus}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Moderate</div>
              </div>
            )}
            {stats.weakConsensus > 0 && (
              <div>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {stats.weakConsensus}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Weak</div>
              </div>
            )}
            {stats.noConsensus > 0 && (
              <div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {stats.noConsensus}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">None</div>
              </div>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No AI analysis available for this exam yet.
        </p>
      )}
    </div>
  );
}