'use client';

import { CheckCircle, XCircle, Award, TrendingUp } from 'lucide-react';
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
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Award className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Exam Complete!</h2>
        <p className="text-gray-600">{getMessage()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Correct Answers</p>
              <p className="text-2xl font-bold text-green-900">{correctCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-red-600 font-medium">Wrong Answers</p>
              <p className="text-2xl font-bold text-red-900">{wrongCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-10 h-10 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Your Score</p>
              <div className="flex items-baseline gap-2">
                <p className={cn('text-4xl font-bold', getScoreColor())}>{score}%</p>
                <p className="text-lg text-gray-500">({correctCount}/{totalQuestions})</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Grade</p>
            <div className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
              score >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            )}>
              {getGrade()}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Total Questions: {totalQuestions}</p>
      </div>
    </div>
  );
}
