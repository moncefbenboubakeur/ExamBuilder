'use client';

import { TopicData } from '@/lib/course/load';

interface StudySidebarProps {
  topics: TopicData[];
  currentTopicIndex: number;
  onTopicSelect: (index: number) => void;
}

export default function StudySidebar({
  topics,
  currentTopicIndex,
  onTopicSelect
}: StudySidebarProps) {
  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Study Topics
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {topics.length} topics
        </p>
      </div>

      <nav className="p-2">
        <ul className="space-y-1">
          {topics.map((topic, index) => (
            <li key={index}>
              <button
                onClick={() => onTopicSelect(index)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  currentTopicIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm">{topic.topic_name}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
