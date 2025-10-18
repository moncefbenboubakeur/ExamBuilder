'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/lib/supabaseClient';
import {
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Bot,
  ChevronDown,
  ChevronUp,
  BookOpen,
  X,
  FileText,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ModelConsensusDisplay from '@/components/exam/ModelConsensusDisplay';
import { getBestModelAnalysis, transformToLegacyFormat } from '@/lib/utils/multi-model-helpers';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  selectedAnswer?: string;
  selectedAnswers?: string[];
  onAnswerSelect: (answer: string) => void;
  showCorrectAnswer?: boolean;
  multipleChoice?: boolean;
}

export default function QuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  selectedAnswers = [],
  onAnswerSelect,
  showCorrectAnswer = false,
  multipleChoice = false,
}: QuestionCardProps) {
  const [revealed, setRevealed] = useState(showCorrectAnswer);
  const [showFullAIReasoning, setShowFullAIReasoning] = useState(false);
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());
  const [multiModelAnalysis, setMultiModelAnalysis] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Try to use multi-model analysis first, fall back to old single-model if not available
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Fetch multi-model analysis when question changes or when revealed
  useEffect(() => {
    const fetchMultiModelAnalysis = async () => {
      if (revealed && question.id) {
        setIsLoadingAnalysis(true);
        try {
          const bestAnalysis = await getBestModelAnalysis(question.id);
          const transformed = transformToLegacyFormat(bestAnalysis);

          if (transformed) {
            setMultiModelAnalysis(transformed);
            setAiAnalysis(transformed); // Use multi-model analysis
            console.log('🚀 Using multi-model analysis from:', transformed.model_used);
          } else {
            // Fall back to old single-model analysis
            const oldAnalysis = Array.isArray(question.ai_analysis)
              ? question.ai_analysis[0]
              : question.ai_analysis;
            setAiAnalysis(oldAnalysis);
            console.log('📌 Falling back to old single-model analysis');
          }
        } catch (error) {
          console.error('Error fetching multi-model analysis:', error);
          // Fall back to old analysis on error
          const oldAnalysis = Array.isArray(question.ai_analysis)
            ? question.ai_analysis[0]
            : question.ai_analysis;
          setAiAnalysis(oldAnalysis);
        } finally {
          setIsLoadingAnalysis(false);
        }
      }
    };

    fetchMultiModelAnalysis();
  }, [question.id, revealed, question.ai_analysis]);

  // Reset revealed state when question changes
  useEffect(() => {
    setRevealed(false);
    setShowFullAIReasoning(false);
    setExpandedOptions(new Set());
  }, [question.id]);

  // Get all available options dynamically from the question
  const options = Object.keys(question.options).sort();

  const isCorrect = (option: string) => {
    const correctAnswers = question.correct_answer.toUpperCase().split(',').map(a => a.trim());
    return correctAnswers.includes(option.toUpperCase());
  };

  const toggleOptionExpansion = (option: string) => {
    const newExpanded = new Set(expandedOptions);
    if (newExpanded.has(option)) {
      newExpanded.delete(option);
    } else {
      newExpanded.add(option);
    }
    setExpandedOptions(newExpanded);
  };

  const getOptionClassName = (option: string) => {
    const isSelected = multipleChoice
      ? selectedAnswers.includes(option)
      : selectedAnswer === option;
    const isCorrectOption = isCorrect(option);

    if (revealed) {
      if (isCorrectOption) {
        return 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/30 text-green-950 dark:text-green-100 font-medium';
      }
      if (isSelected && !isCorrectOption) {
        return 'border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-900/30 text-red-950 dark:text-red-100 font-medium';
      }
      return 'border-neutral-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-neutral-800 dark:text-gray-200';
    } else if (isSelected) {
      return 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-950 dark:text-indigo-100 font-medium';
    }

    return 'border-neutral-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-neutral-900 dark:text-gray-100 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20';
  };

  // Check if sources disagree - only between exam creator and community vote
  // (AI consensus is shown separately in ModelConsensusDisplay)
  // Extract just the letter from community vote (might be "A (92%)" format)
  const communityAnswer = question.community_vote?.split(' ')[0]?.trim();
  const sourcesDisagree = communityAnswer &&
    question.correct_answer &&
    communityAnswer !== question.correct_answer;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-3xl mx-auto border-2 border-neutral-100 dark:border-gray-700">
      {/* Question Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-gray-400">
              Question {questionNumber}
            </h3>
            {multipleChoice && (
              <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-full font-medium">
                Multiple Choice
              </span>
            )}
          </div>
          {question.has_illustration && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full">
              Has Illustration
            </span>
          )}
        </div>
        <p className="text-xl font-semibold text-neutral-950 dark:text-white leading-relaxed">
          {question.question_text}
        </p>
        {multipleChoice && (
          <p className="text-sm text-neutral-600 dark:text-gray-400 mt-2 italic">
            Select all answers that apply
          </p>
        )}
      </div>

      {/* Answer Summary - Three Sources of Truth (when revealed) */}
      {revealed && (
        <div className="bg-neutral-50 dark:bg-gray-700 rounded-2xl p-5 mb-6 border-2 border-neutral-200 dark:border-gray-600">
          <h4 className="text-xs font-bold text-neutral-600 dark:text-gray-300 mb-4 uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Expert Opinions
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {/* Exam Creator's Answer */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-3">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">📝 Exam Creator</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{question.correct_answer}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">From markdown file</div>
            </div>

            {/* Community Vote */}
            {question.community_vote && (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-3">
                <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">👥 Community</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-300">{question.community_vote}</div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">Crowd wisdom</div>
              </div>
            )}

            {/* AI Recommendation */}
            {aiAnalysis && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-3">
                <div className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">🤖 AI Analysis</div>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                  {aiAnalysis.ai_recommended_answer}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {Math.round(aiAnalysis.ai_confidence_score * 100)}% confidence
                </div>
              </div>
            )}
          </div>

          {/* Warning if exam creator and community disagree */}
          {sourcesDisagree && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-800 rounded-xl p-3 text-sm mb-3">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">Exam creator and community disagree!</p>
                  <p className="text-yellow-800 dark:text-yellow-400 text-xs">
                    The exam creator marked {question.correct_answer} but the community voted {question.community_vote}. This may indicate an error or ambiguity in the question.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show Full AI Reasoning button */}
          {aiAnalysis && (
            <button
              onClick={() => setShowFullAIReasoning(true)}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Show Full AI Reasoning
            </button>
          )}
        </div>
      )}

      {/* Multi-Model Consensus Display - Only show after revealing answer */}
      {revealed && (
        <ModelConsensusDisplay
          questionId={question.id}
          currentAnswer={multipleChoice ? selectedAnswers.join(',') : selectedAnswer}
          onModelAnswerSelect={(answer) => {
            if (!revealed) {
              onAnswerSelect(answer);
            }
          }}
        />
      )}

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option) => {
          const isCorrectOption = isCorrect(option);
          const shortExplanation = aiAnalysis?.option_short_explanations?.[option];
          const longExplanation = aiAnalysis?.option_long_explanations?.[option];
          const isExpanded = expandedOptions.has(option);

          return (
            <div key={option}>
              {/* Option Button */}
              <button
                onClick={() => !revealed && onAnswerSelect(option)}
                disabled={revealed}
                className={cn(
                  'w-full text-left p-4 border-2 rounded-xl transition-all duration-200',
                  getOptionClassName(option),
                  revealed ? 'cursor-default' : 'cursor-pointer'
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="font-bold min-w-[24px]">{option}.</span>
                  <span className="flex-1">
                    {question.options[option]}
                  </span>
                  {revealed && isCorrectOption && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  {revealed && (multipleChoice ? selectedAnswers.includes(option) : selectedAnswer === option) && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* AI Short Explanation (always visible when revealed) */}
              {revealed && shortExplanation && (
                <div className="mt-2 p-3 rounded-xl text-sm bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100">
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <div className="flex-1">
                      <p className="font-medium">{shortExplanation}</p>

                      {longExplanation && (
                        <button
                          onClick={() => toggleOptionExpansion(option)}
                          className="mt-2 text-xs font-semibold flex items-center gap-1 hover:underline text-purple-700 dark:text-purple-400"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              Learn More
                            </>
                          )}
                        </button>
                      )}

                      {/* Long Explanation (expandable) */}
                      {isExpanded && longExplanation && (
                        <div className="mt-3 pt-3 border-t border-purple-300/30 dark:border-purple-700/30">
                          <p className="font-semibold text-xs mb-2 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Detailed AI Analysis
                          </p>
                          <div className="whitespace-pre-line text-xs leading-relaxed">
                            {longExplanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show/Hide Answer Button */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-neutral-200 dark:border-gray-700">
        <button
          onClick={() => setRevealed(!revealed)}
          className="flex items-center gap-2 px-5 py-3 bg-neutral-100 dark:bg-gray-700 text-neutral-700 dark:text-gray-300 rounded-2xl hover:bg-neutral-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
        >
          {revealed ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Answer
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show Answer
            </>
          )}
        </button>
      </div>

      {/* Full AI Reasoning Modal */}
      {showFullAIReasoning && aiAnalysis && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b-2 border-neutral-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="text-lg font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                AI Full Reasoning
              </h3>
              <button
                onClick={() => setShowFullAIReasoning(false)}
                className="text-neutral-500 dark:text-gray-400 hover:text-neutral-700 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-neutral-900 dark:text-white">
                  <span className="text-lg">💡</span>
                  Summary
                </h4>
                <p className="text-sm leading-relaxed text-neutral-800 dark:text-gray-200">{aiAnalysis.reasoning_summary}</p>
              </div>

              {/* Detailed Analysis */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-neutral-900 dark:text-white">
                  <BookOpen className="w-4 h-4" />
                  Detailed Analysis
                </h4>
                <div className="text-sm whitespace-pre-line leading-relaxed bg-neutral-50 dark:bg-gray-700 rounded-xl p-4 border-2 border-neutral-200 dark:border-gray-600 text-neutral-800 dark:text-gray-200">
                  {aiAnalysis.reasoning_detailed}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
