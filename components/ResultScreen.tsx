'use client';

import { RotateCcw, XCircle, Home } from 'lucide-react';
import ExamStats from './ExamStats';

interface ResultScreenProps {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  onRetryAll: () => void;
  onRetryWrong: () => void;
  hasWrongAnswers: boolean;
}

export default function ResultScreen({
  totalQuestions,
  correctCount,
  wrongCount,
  score,
  onRetryAll,
  onRetryWrong,
  hasWrongAnswers,
}: ResultScreenProps) {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <ExamStats
        totalQuestions={totalQuestions}
        correctCount={correctCount}
        wrongCount={wrongCount}
        score={score}
      />

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onRetryAll}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <RotateCcw className="w-5 h-5" />
          Retry All Questions
        </button>

        {hasWrongAnswers && (
          <button
            onClick={onRetryWrong}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-2xl font-medium hover:bg-amber-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <XCircle className="w-5 h-5" />
            Retry Wrong Answers Only
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 text-neutral-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
