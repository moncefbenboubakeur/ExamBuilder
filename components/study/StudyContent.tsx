'use client';

import ReactMarkdown from 'react-markdown';
import { markdownOptions, markdownClassName } from '@/lib/markdown';
import { useSwipeable } from 'react-swipeable';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StudyContentProps {
  content: string;
  topicName: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export default function StudyContent({
  content,
  onPrevious = () => {},
  onNext = () => {},
  hasPrevious = false,
  hasNext = false
}: StudyContentProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (hasNext) {
        setSwipeDirection('left');
        setTimeout(() => {
          onNext();
          setSwipeDirection(null);
        }, 150);
      }
    },
    onSwipedRight: () => {
      if (hasPrevious) {
        setSwipeDirection('right');
        setTimeout(() => {
          onPrevious();
          setSwipeDirection(null);
        }, 150);
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 50, // Minimum distance for swipe detection
  });

  return (
    <div
      {...handlers}
      className={`
        flex-1 overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950
        relative transition-transform duration-150
        ${swipeDirection === 'left' ? '-translate-x-2' : ''}
        ${swipeDirection === 'right' ? 'translate-x-2' : ''}
      `}
    >
      {/* Swipe hint indicators - visible only on mobile */}
      {hasPrevious && (
        <div className="md:hidden fixed left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className={`
            bg-blue-600/20 backdrop-blur-sm p-3 rounded-full
            transition-all duration-300
            ${swipeDirection === 'right' ? 'scale-125 bg-blue-600/40' : 'scale-100'}
          `}>
            <ChevronLeft className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      )}

      {hasNext && (
        <div className="md:hidden fixed right-2 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className={`
            bg-blue-600/20 backdrop-blur-sm p-3 rounded-full
            transition-all duration-300
            ${swipeDirection === 'left' ? 'scale-125 bg-blue-600/40' : 'scale-100'}
          `}>
            <ChevronRight className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      )}

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8">
        <div className="bg-gray-800/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 dark:border-gray-800/50 p-6 sm:p-8 lg:p-10 xl:p-12 2xl:p-16">
          <div className={`${markdownClassName} study-content-mobile prose-wide w-full`}>
            <ReactMarkdown {...markdownOptions}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
