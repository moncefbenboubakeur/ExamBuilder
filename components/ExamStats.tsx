'use client';

import { CheckCircle, XCircle, Award, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamStatsProps {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  score: number;
}

export default function ExamStats({
  totalQuestions,
  correctCount,
  wrongCount,
  score,
}: ExamStatsProps) {
  const getScoreColor = () => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-amber-600 dark:text-amber-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = () => {
    if (score >= 90) return 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-300 dark:border-green-700';
    if (score >= 80) return 'from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-300 dark:border-blue-700';
    if (score >= 70) return 'from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-300 dark:border-amber-700';
    if (score >= 60) return 'from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-300 dark:border-orange-700';
    return 'from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border-red-300 dark:border-red-700';
  };

  const getGrade = () => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getMessage = () => {
    if (score >= 90) return 'Excellent work!';
    if (score >= 80) return 'Great job!';
    if (score >= 70) return 'Good effort!';
    if (score >= 60) return 'You passed! Keep practicing.';
    return 'Keep studying and try again!';
  };

  const getIcon = () => {
    if (score >= 90) return <Sparkles className="w-16 h-16 mx-auto mb-4 text-amber-500" />;
    return <Award className="w-16 h-16 mx-auto mb-4 text-amber-500" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-neutral-200 dark:border-gray-700 shadow-lg p-6 sm:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        {getIcon()}
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-2">Exam Complete!</h2>
        <p className="text-lg text-neutral-600 dark:text-gray-300">{getMessage()}</p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Correct Answers */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 sm:p-6 border-2 border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Correct Answers</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-300">{correctCount}</p>
            </div>
          </div>
        </div>

        {/* Wrong Answers */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 sm:p-6 border-2 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Wrong Answers</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-300">{wrongCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className={cn(
        'bg-gradient-to-br rounded-2xl p-6 sm:p-8 border-2 mb-6',
        getScoreBgColor()
      )}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center',
              score >= 90 ? 'bg-green-100 dark:bg-green-900/40' : score >= 70 ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-red-100 dark:bg-red-900/40'
            )}>
              <TrendingUp className={cn(
                'w-8 h-8',
                score >= 90 ? 'text-green-600 dark:text-green-400' : score >= 70 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
              )} />
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-gray-400 font-semibold mb-1">Your Score</p>
              <div className="flex items-baseline gap-2">
                <p className={cn('text-4xl sm:text-5xl font-bold', getScoreColor())}>{score}%</p>
                <p className="text-lg text-neutral-500 dark:text-gray-400">({correctCount}/{totalQuestions})</p>
              </div>
            </div>
          </div>

          {/* Grade Badge */}
          <div className="text-center">
            <p className="text-sm text-neutral-600 dark:text-gray-400 font-semibold mb-2">Grade</p>
            <div className={cn(
              'w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-sm border-2',
              score >= 60
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700'
            )}>
              {getGrade()}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-center">
        <p className="text-sm text-neutral-500 dark:text-gray-400">
          Total Questions: <span className="font-semibold text-neutral-700 dark:text-gray-300">{totalQuestions}</span>
        </p>
      </div>
    </div>
  );
}
