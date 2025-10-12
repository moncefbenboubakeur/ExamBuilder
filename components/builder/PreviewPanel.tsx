'use client';

import { useState } from 'react';
import { Eye, EyeOff, Smartphone, Tablet, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuestionCard from '@/components/QuestionCard';
import { Question } from '@/lib/supabaseClient';

interface PreviewPanelProps {
  question: Question | null;
  questionNumber?: number;
  isVisible?: boolean;
  onToggle?: () => void;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export default function PreviewPanel({
  question,
  questionNumber = 1,
  isVisible = true,
  onToggle,
}: PreviewPanelProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  const deviceConfigs = {
    mobile: { width: 'max-w-sm', icon: Smartphone, label: 'Mobile' },
    tablet: { width: 'max-w-2xl', icon: Tablet, label: 'Tablet' },
    desktop: { width: 'max-w-4xl', icon: Monitor, label: 'Desktop' },
  };

  if (!isVisible) {
    return (
      <div className="hidden lg:flex fixed right-4 top-24 z-30">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-l-2xl shadow-lg hover:bg-indigo-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">Preview</span>
        </button>
      </div>
    );
  }

  return (
    <aside className="hidden lg:block w-full lg:w-[480px] xl:w-[560px] h-screen sticky top-0 bg-neutral-50 dark:bg-gray-900 border-l border-neutral-200 dark:border-gray-700 flex-shrink-0">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Live Preview</h3>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-gray-700 p-1 rounded-lg">
          {(Object.keys(deviceConfigs) as DeviceType[]).map((deviceType) => {
            const DeviceIcon = deviceConfigs[deviceType].icon;
            return (
              <button
                key={deviceType}
                onClick={() => setDevice(deviceType)}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  device === deviceType
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-gray-200'
                )}
                aria-label={`Preview on ${deviceConfigs[deviceType].label}`}
              >
                <DeviceIcon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-neutral-600 dark:text-gray-400 hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close preview"
        >
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Preview Area */}
      <div className="h-[calc(100vh-73px)] overflow-y-auto p-6 flex items-start justify-center">
        <div
          className={cn(
            'w-full transition-all duration-300',
            deviceConfigs[device].width
          )}
        >
          {question ? (
            <div className="space-y-4">
              {/* Device Frame Indicator */}
              <div className="text-center">
                <span className="inline-block text-xs font-medium text-neutral-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-neutral-200 dark:border-gray-700">
                  {deviceConfigs[device].label} View
                </span>
              </div>

              {/* Question Preview using existing QuestionCard */}
              <div className={cn(device === 'mobile' && 'text-sm')}>
                <QuestionCard
                  question={question}
                  questionNumber={questionNumber}
                  selectedAnswer={selectedAnswer}
                  onAnswerSelect={setSelectedAnswer}
                  showCorrectAnswer={false}
                  multipleChoice={question.correct_answer.includes(',')}
                />
              </div>

              {/* Preview Notes */}
              <div className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
                <p className="text-xs text-indigo-900 dark:text-indigo-300 font-medium mb-2">
                  📱 Preview Tips:
                </p>
                <ul className="text-xs text-neutral-700 dark:text-gray-300 space-y-1">
                  <li>• Switch between devices to test responsiveness</li>
                  <li>• Preview updates automatically as you edit</li>
                  <li>• Click answers to test interaction</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 bg-neutral-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Eye className="w-10 h-10 text-neutral-400 dark:text-gray-500" />
              </div>
              <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                No Question Selected
              </h4>
              <p className="text-sm text-neutral-600 dark:text-gray-400 max-w-xs">
                Select or create a question to see a live preview of how it will appear to students.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
