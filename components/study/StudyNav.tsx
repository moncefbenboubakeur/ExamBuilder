'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StudyNavProps {
  currentIndex: number;
  totalTopics: number;
  onPrevious: () => void;
  onNext: () => void;
}

export default function StudyNav({
  currentIndex,
  totalTopics,
  onPrevious,
  onNext
}: StudyNavProps) {
  const progress = ((currentIndex + 1) / totalTopics) * 100;

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Topic {currentIndex + 1} of {totalTopics}
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex === totalTopics - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
