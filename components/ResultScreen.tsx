'use client';

import { RotateCcw, XCircle } from 'lucide-react';
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
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Retry All Questions
        </button>

        {hasWrongAnswers && (
          <button
            onClick={onRetryWrong}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Retry Wrong Answers Only
          </button>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => window.location.href = '/'}
          className="text-blue-600 hover:text-blue-700 underline text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
