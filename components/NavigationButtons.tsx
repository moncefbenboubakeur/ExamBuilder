'use client';

import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationButtonsProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
  canFinish?: boolean;
}

export default function NavigationButtons({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onFinish,
  canFinish = false,
}: NavigationButtonsProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={onPrevious}
        disabled={isFirst}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
          isFirst
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        )}
      >
        <ChevronLeft className="w-5 h-5" />
        Previous
      </button>

      <div className="flex-1 text-center">
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {totalQuestions}
        </span>
      </div>

      {isLast ? (
        <button
          onClick={onFinish}
          disabled={!canFinish}
          className={cn(
            'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
            canFinish
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <Flag className="w-5 h-5" />
          Finish Exam
        </button>
      ) : (
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
