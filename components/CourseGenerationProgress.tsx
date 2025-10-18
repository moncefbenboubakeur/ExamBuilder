'use client';

import { Loader2 } from 'lucide-react';

interface GenerationStep {
  status: 'pending' | 'active' | 'completed';
  label: string;
  detail?: string;
}

interface CourseGenerationProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  topics?: Array<{ name: string; status: 'pending' | 'generating' | 'completed' }>;
}

export default function CourseGenerationProgress({
  currentStep,
  totalSteps,
  stepLabel,
  topics
}: CourseGenerationProgressProps) {
  const progress = Math.round((currentStep / totalSteps) * 100);

  // Define generation steps
  const steps: GenerationStep[] = [
    {
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'active' : 'pending',
      label: 'Initializing',
      detail: 'Setting up course generation...'
    },
    {
      status: currentStep > 2 ? 'completed' : currentStep >= 1 && currentStep <= 2 ? 'active' : 'pending',
      label: 'Analyzing Questions',
      detail: 'Processing exam questions in batches...'
    },
    {
      status: currentStep > 4 ? 'completed' : currentStep >= 3 && currentStep <= 4 ? 'active' : 'pending',
      label: 'Detecting Topics',
      detail: 'Identifying key topics and concepts...'
    },
    {
      status: currentStep > 6 ? 'completed' : currentStep >= 5 && currentStep <= 6 ? 'active' : 'pending',
      label: 'Generating Lessons',
      detail: 'Creating study materials for each topic...'
    },
    {
      status: currentStep >= 7 ? 'completed' : 'pending',
      label: 'Finalizing',
      detail: 'Saving your course...'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Generating Course</span>
          <span className="text-gray-600 dark:text-gray-400">{progress}%</span>
        </div>
        <div className="bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Action */}
      <div className="flex items-center justify-center gap-3 py-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="text-lg font-medium text-gray-900 dark:text-white">
          {stepLabel}
        </span>
      </div>

      {/* Step Progress */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              step.status === 'completed' ? 'opacity-60' : ''
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'completed' && (
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {step.status === 'active' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              )}
              {step.status === 'pending' && (
                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-medium ${
                step.status === 'active' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
              }`}>
                {step.label}
              </h3>
              {step.status === 'active' && step.detail && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {step.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Topics List (if available) */}
      {topics && topics.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Generating {topics.length} Lessons:
          </h3>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {topics.map((topic, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm"
              >
                {topic.status === 'completed' && (
                  <span className="text-green-600">✓</span>
                )}
                {topic.status === 'generating' && (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                )}
                {topic.status === 'pending' && (
                  <span className="text-gray-400">○</span>
                )}
                <span className={`truncate ${
                  topic.status === 'completed' ? 'text-green-700 dark:text-green-400' :
                  topic.status === 'generating' ? 'text-blue-700 dark:text-blue-400 font-medium' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {topic.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estimated Time */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        This may take 5-8 minutes for large exams. Please don&apos;t close this page.
      </div>
    </div>
  );
}