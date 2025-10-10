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
    <nav
      className="sticky bottom-0 border-t border-gray-700 bg-gray-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] z-10"
      aria-label="Study navigation"
    >
      {/* Progress bar */}
      <div className="h-1 bg-gray-700">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalTopics}
          aria-label={`Topic ${currentIndex + 1} of ${totalTopics}`}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 gap-2">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="
            flex items-center justify-center gap-1 sm:gap-2
            px-3 sm:px-4 py-2.5 sm:py-2
            rounded-lg border border-gray-600
            text-gray-300 hover:bg-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            min-w-[44px] min-h-[44px]
            text-sm sm:text-base
          "
          aria-label="Previous topic"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden xs:inline sm:inline">Previous</span>
        </button>

        <div className="text-xs sm:text-sm text-gray-400 text-center px-2">
          <span className="hidden sm:inline">Topic </span>
          {currentIndex + 1}
          <span className="mx-1">/</span>
          {totalTopics}
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex === totalTopics - 1}
          className="
            flex items-center justify-center gap-1 sm:gap-2
            px-3 sm:px-4 py-2.5 sm:py-2
            rounded-lg bg-blue-600 text-white
            hover:bg-blue-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
            min-w-[44px] min-h-[44px]
            text-sm sm:text-base
          "
          aria-label="Next topic"
        >
          <span className="hidden xs:inline sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </nav>
  );
}
