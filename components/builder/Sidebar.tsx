'use client';

import { FileText, Plus, Award, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BuilderStep = 'info' | 'questions' | 'scoring' | 'publish';

interface SidebarProps {
  currentStep: BuilderStep;
  onStepChange: (step: BuilderStep) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface StepConfig {
  id: BuilderStep;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const steps: StepConfig[] = [
  {
    id: 'info',
    label: 'Exam Info',
    icon: <FileText className="w-5 h-5" />,
    description: 'Basic details',
  },
  {
    id: 'questions',
    label: 'Add Questions',
    icon: <Plus className="w-5 h-5" />,
    description: 'Build your exam',
  },
  {
    id: 'scoring',
    label: 'Scoring',
    icon: <Award className="w-5 h-5" />,
    description: 'Configure grading',
  },
  {
    id: 'publish',
    label: 'Publish',
    icon: <Send className="w-5 h-5" />,
    description: 'Share & deploy',
  },
];

export default function Sidebar({
  currentStep,
  onStepChange,
  isOpen = true,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-gray-800 border-r border-neutral-200 dark:border-gray-700 flex flex-col z-40 transition-transform duration-300 ease-in-out',
          'w-64 sm:w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-neutral-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Build Steps</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-neutral-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Steps Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isPast = steps.findIndex((s) => s.id === currentStep) > index;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    onStepChange(step.id);
                    onClose?.(); // Close mobile menu on step change
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 sm:p-4 rounded-xl transition-all duration-200 group',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-gray-700 border-2 border-neutral-200 dark:border-gray-600 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'
                  )}
                >
                  {/* Step Number & Icon */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200',
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : isPast
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400'
                          : 'bg-neutral-100 dark:bg-gray-600 text-neutral-600 dark:text-gray-300 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600'
                      )}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isActive
                          ? 'text-indigo-600'
                          : 'text-neutral-400 dark:text-gray-500'
                      )}
                    >
                      {index + 1}
                    </span>
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 text-left pt-1">
                    <h3
                      className={cn(
                        'text-sm sm:text-base font-semibold mb-0.5 transition-colors',
                        isActive
                          ? 'text-neutral-900 dark:text-white'
                          : 'text-neutral-700 dark:text-gray-300 group-hover:text-neutral-900 dark:group-hover:text-white'
                      )}
                    >
                      {step.label}
                    </h3>
                    <p
                      className={cn(
                        'text-xs sm:text-sm transition-colors',
                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-500 dark:text-gray-400'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="w-1 h-full bg-indigo-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Help Section */}
        <div className="p-4 sm:p-6 border-t border-neutral-200 dark:border-gray-700 bg-neutral-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-neutral-200 dark:border-gray-600">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
              Need Help?
            </h4>
            <p className="text-xs text-neutral-600 dark:text-gray-400 mb-3">
              Check our guide to build the perfect exam in minutes.
            </p>
            <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
              View Tutorial →
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
