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
          'fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-neutral-200 flex flex-col z-40 transition-transform duration-300 ease-in-out',
          'w-64 sm:w-72',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Build Steps</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-neutral-700" />
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
                      ? 'bg-indigo-50 border-2 border-indigo-500 shadow-sm'
                      : 'bg-white border-2 border-neutral-200 hover:border-indigo-200 hover:bg-indigo-50/50'
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
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                      )}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isActive
                          ? 'text-indigo-600'
                          : 'text-neutral-400'
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
                          ? 'text-neutral-900'
                          : 'text-neutral-700 group-hover:text-neutral-900'
                      )}
                    >
                      {step.label}
                    </h3>
                    <p
                      className={cn(
                        'text-xs sm:text-sm transition-colors',
                        isActive ? 'text-indigo-600' : 'text-neutral-500'
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
        <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50">
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <h4 className="text-sm font-semibold text-neutral-900 mb-2">
              Need Help?
            </h4>
            <p className="text-xs text-neutral-600 mb-3">
              Check our guide to build the perfect exam in minutes.
            </p>
            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              View Tutorial →
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
