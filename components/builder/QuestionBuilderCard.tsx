'use client';

import { useState } from 'react';
import { GripVertical, Trash2, Eye, Edit3, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Question } from '@/lib/supabaseClient';

interface QuestionBuilderCardProps {
  question: Question;
  index: number;
  onEdit?: (question: Question) => void;
  onDelete?: (questionId: string) => void;
  onPreview?: (question: Question) => void;
  isDragging?: boolean;
}

export default function QuestionBuilderCard({
  question,
  index,
  onEdit,
  onDelete,
  isDragging = false,
}: QuestionBuilderCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const optionKeys = Object.keys(question.options).sort();
  const correctAnswers = question.correct_answer.split(',').map(a => a.trim());
  const isMultipleChoice = correctAnswers.length > 1;

  return (
    <div
      className={cn(
        'bg-white border-2 border-neutral-200 rounded-xl shadow-sm transition-all duration-200 group',
        isDragging && 'opacity-50 scale-95',
        'hover:border-indigo-200 hover:shadow-md'
      )}
    >
      {/* Card Header */}
      <div className="flex items-start gap-3 p-4 border-b border-neutral-100">
        {/* Drag Handle */}
        <button
          className="mt-1 p-1 text-neutral-400 hover:text-neutral-600 cursor-move"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Question Number & Badge */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-neutral-500">
              Question {index + 1}
            </span>
            {isMultipleChoice && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                Multiple Choice
              </span>
            )}
            {question.has_illustration && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                Has Image
              </span>
            )}
          </div>

          {/* Question Text */}
          {showPreview ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {question.question_text}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-base text-neutral-900 font-medium line-clamp-2">
              {question.question_text}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-indigo-600 transition-colors"
            aria-label={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit?.(question)}
            className="p-2 rounded-lg text-neutral-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            aria-label="Edit question"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(question.id)}
            className="p-2 rounded-lg text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            aria-label="Delete question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Options Preview */}
      <div className="p-4">
        <div className="space-y-2">
          {optionKeys.map((key) => {
            const isCorrect = correctAnswers.includes(key);

            return (
              <div
                key={key}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-lg text-sm transition-colors',
                  isCorrect
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-neutral-50 border border-neutral-200'
                )}
              >
                <span
                  className={cn(
                    'font-semibold min-w-[24px]',
                    isCorrect ? 'text-green-700' : 'text-neutral-600'
                  )}
                >
                  {key}.
                </span>
                <span
                  className={cn(
                    'flex-1 line-clamp-1',
                    isCorrect ? 'text-green-900 font-medium' : 'text-neutral-700'
                  )}
                >
                  {showPreview ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {question.options[key]}
                    </ReactMarkdown>
                  ) : (
                    question.options[key]
                  )}
                </span>
                {isCorrect && (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Community Vote (if available) */}
        {question.community_vote && (
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <p className="text-xs text-neutral-600">
              Community Vote:{' '}
              <span className="font-semibold text-neutral-900">
                {question.community_vote}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
