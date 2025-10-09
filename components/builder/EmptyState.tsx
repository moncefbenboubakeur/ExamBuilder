'use client';

import { Plus, FileText, Upload, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'questions' | 'exams' | 'generic';
}

export default function EmptyState({
  title = 'No questions yet',
  description = 'Click the button below to add your first question',
  actionLabel = 'Add Question',
  onAction,
  type = 'questions',
}: EmptyStateProps) {
  // Choose icon based on type
  const getIllustration = () => {
    switch (type) {
      case 'questions':
        return (
          <div className="relative">
            <div className="w-24 h-24 bg-indigo-100 rounded-2xl flex items-center justify-center transform rotate-3">
              <FileText className="w-12 h-12 text-indigo-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-sky-400 rounded-full flex items-center justify-center shadow-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
          </div>
        );
      case 'exams':
        return (
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-100 rounded-2xl flex items-center justify-center transform -rotate-3">
              <Upload className="w-12 h-12 text-emerald-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
        );
      default:
        return (
          <div className="w-24 h-24 bg-neutral-100 rounded-2xl flex items-center justify-center">
            <FileText className="w-12 h-12 text-neutral-400" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration */}
      <div className="mb-6">{getIllustration()}</div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm sm:text-base text-neutral-600 max-w-md mb-8">
        {description}
      </p>

      {/* Action Button */}
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          {actionLabel}
        </button>
      )}

      {/* Helper Tips */}
      <div className="mt-12 max-w-2xl">
        <div className="bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-sm font-semibold text-indigo-900 mb-2">
                Pro Tips to Get Started
              </h4>
              {type === 'questions' ? (
                <ul className="text-xs text-indigo-800 space-y-1.5">
                  <li>• Upload a markdown file to import questions in bulk</li>
                  <li>• Use drag & drop to reorder questions easily</li>
                  <li>• Add multiple correct answers for advanced testing</li>
                  <li>• Preview questions in real-time as you build</li>
                </ul>
              ) : (
                <ul className="text-xs text-indigo-800 space-y-1.5">
                  <li>• Start by creating your first exam</li>
                  <li>• Upload questions in markdown table format</li>
                  <li>• Track student performance with built-in analytics</li>
                  <li>• Share exams via secure links</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
