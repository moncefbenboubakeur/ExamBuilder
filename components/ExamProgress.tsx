'use client';

import { CheckCircle } from 'lucide-react';

interface ExamProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
}

export default function ExamProgress({
  currentQuestion,
  totalQuestions,
  answeredCount,
}: ExamProgressProps) {
  const progress = totalQuestions > 0
    ? ((currentQuestion + 1) / totalQuestions) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Progress</span>
          <span className="text-xs text-gray-500">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-700">
            {answeredCount}/{totalQuestions} Answered
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 text-right">
        <span className="text-xs text-gray-500">{Math.round(progress)}% Complete</span>
      </div>
    </div>
  );
}
