'use client';

import ReactMarkdown from 'react-markdown';
import { markdownOptions, markdownClassName } from '@/lib/markdown';

interface StudyContentProps {
  content: string;
  topicName: string;
}

export default function StudyContent({ content, topicName }: StudyContentProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className={markdownClassName}>
          <ReactMarkdown {...markdownOptions}>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
