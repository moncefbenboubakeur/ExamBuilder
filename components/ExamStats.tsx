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
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-amber-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = () => {
    if (score >= 90) return 'from-green-50 to-emerald-50 border-green-300';
    if (score >= 80) return 'from-blue-50 to-indigo-50 border-blue-300';
    if (score >= 70) return 'from-amber-50 to-yellow-50 border-amber-300';
    if (score >= 60) return 'from-orange-50 to-amber-50 border-orange-300';
    return 'from-red-50 to-pink-50 border-red-300';
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
    <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-lg p-6 sm:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        {getIcon()}
        <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">Exam Complete!</h2>
        <p className="text-lg text-neutral-600">{getMessage()}</p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Correct Answers */}
        <div className="bg-green-50 rounded-xl p-4 sm:p-6 border-2 border-green-200 hover:border-green-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-semibold">Correct Answers</p>
              <p className="text-3xl font-bold text-green-900">{correctCount}</p>
            </div>
          </div>
        </div>

        {/* Wrong Answers */}
        <div className="bg-red-50 rounded-xl p-4 sm:p-6 border-2 border-red-200 hover:border-red-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-semibold">Wrong Answers</p>
              <p className="text-3xl font-bold text-red-900">{wrongCount}</p>
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
              score >= 90 ? 'bg-green-100' : score >= 70 ? 'bg-blue-100' : 'bg-red-100'
            )}>
              <TrendingUp className={cn(
                'w-8 h-8',
                score >= 90 ? 'text-green-600' : score >= 70 ? 'text-blue-600' : 'text-red-600'
              )} />
            </div>
            <div>
              <p className="text-sm text-neutral-600 font-semibold mb-1">Your Score</p>
              <div className="flex items-baseline gap-2">
                <p className={cn('text-4xl sm:text-5xl font-bold', getScoreColor())}>{score}%</p>
                <p className="text-lg text-neutral-500">({correctCount}/{totalQuestions})</p>
              </div>
            </div>
          </div>

          {/* Grade Badge */}
          <div className="text-center">
            <p className="text-sm text-neutral-600 font-semibold mb-2">Grade</p>
            <div className={cn(
              'w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-sm border-2',
              score >= 60
                ? 'bg-green-100 text-green-700 border-green-300'
                : 'bg-red-100 text-red-700 border-red-300'
            )}>
              {getGrade()}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-center">
        <p className="text-sm text-neutral-500">
          Total Questions: <span className="font-semibold text-neutral-700">{totalQuestions}</span>
        </p>
      </div>
    </div>
  );
}
