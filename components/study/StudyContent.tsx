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
        flex-1 overflow-y-auto bg-gray-800 dark:bg-gray-800
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className={`${markdownClassName} study-content-mobile`}>
          <ReactMarkdown {...markdownOptions}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
