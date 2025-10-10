'use client';

import { TopicData } from '@/lib/course/load';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface StudySidebarProps {
  topics: TopicData[];
  currentTopicIndex: number;
  onTopicSelect: (index: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function StudySidebar({
  topics,
  currentTopicIndex,
  onTopicSelect,
  isOpen = true,
  onClose
}: StudySidebarProps) {
  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTopicClick = (index: number) => {
    onTopicSelect(index);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fadeIn"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-full md:h-auto
          w-64 md:w-64
          border-r border-gray-700 bg-gray-900
          overflow-y-auto
          z-50 md:z-auto
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        aria-label="Study topics navigation"
      >
        {/* Header with close button (mobile only) */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Study Topics
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {topics.length} topics
            </p>
          </div>

          {/* Close button - visible only on mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topic list */}
        <nav className="p-2">
          <ul className="space-y-1">
            {topics.map((topic, index) => (
              <li key={index}>
                <button
                  onClick={() => handleTopicClick(index)}
                  className={`
                    w-full text-left px-3 py-3 md:py-2 rounded-lg
                    transition-colors
                    min-h-[44px] md:min-h-0
                    ${
                      currentTopicIndex === index
                        ? 'bg-blue-900 text-blue-100 font-medium'
                        : 'text-gray-300 hover:bg-gray-800'
                    }
                  `}
                  aria-current={currentTopicIndex === index ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 min-w-[1.5rem]">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-sm leading-snug">{topic.topic_name}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
