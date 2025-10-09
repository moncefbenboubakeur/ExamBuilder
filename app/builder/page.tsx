'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Topbar from '@/components/builder/Topbar';
import Sidebar, { BuilderStep } from '@/components/builder/Sidebar';
import PreviewPanel from '@/components/builder/PreviewPanel';
import EmptyState from '@/components/builder/EmptyState';
import QuestionBuilderCard from '@/components/builder/QuestionBuilderCard';
import { ToastContainer, useToast } from '@/components/builder/Toast';
import { Plus, Upload, Settings, Share2 } from 'lucide-react';
import { Question } from '@/lib/supabaseClient';

/**
 * ExamBuilder Page - Typeform-inspired exam creation interface
 *
 * Architecture:
 * - Uses Zustand for state management (to be integrated)
 * - Supabase for backend data persistence
 * - Responsive design with mobile-first approach
 *
 * Layout:
 * - Topbar: Branding, save actions, user menu
 * - Sidebar: Step-by-step navigation (collapsible on mobile)
 * - Main Area: Content based on current step
 * - Preview Panel: Live preview of questions (desktop only)
 */

export default function ExamBuilderPage() {
  const router = useRouter();
  const { toasts, showToast, removeToast } = useToast();

  // State management
  const [currentStep, setCurrentStep] = useState<BuilderStep>('info');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  // Exam data state (TODO: Move to Zustand)
  const [examName, setExamName] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
    };
    checkAuth();
  }, [router]);

  // Handle save action
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement actual save logic with Supabase
      // Example: await saveExamToSupabase({ name: examName, description: examDescription, questions })

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      setLastSaved(new Date());
      showToast('Exam saved successfully! ✅', 'success');
    } catch (error) {
      showToast('Failed to save exam. Please try again.', 'error');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle adding new question
  const handleAddQuestion = () => {
    showToast('Question editor opening...', 'info');
    // TODO: Open question editor modal
  };

  // Handle question edit
  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    showToast('Editing question...', 'info');
    // TODO: Open question editor with pre-filled data
  };

  // Handle question delete
  const handleDeleteQuestion = (questionId: string) => {
    // TODO: Add confirmation dialog
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    showToast('Question deleted', 'warning');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Topbar */}
      <Topbar
        onSave={handleSave}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <Sidebar
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Step Content */}
            {currentStep === 'info' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                    Exam Information
                  </h2>
                  <p className="text-neutral-600">
                    Let's start with the basics about your exam
                  </p>
                </div>

                {/* Exam Name */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Exam Name *
                  </label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g., AWS Solutions Architect Practice Exam"
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                  />
                </div>

                {/* Exam Description */}
                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    placeholder="Briefly describe what this exam covers..."
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Next Step Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep('questions')}
                    disabled={!examName.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Continue to Questions →
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'questions' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                      Build Your Questions
                    </h2>
                    <p className="text-neutral-600">
                      Add, edit, and organize your exam questions
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleAddQuestion}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="hidden sm:inline">Add Question</span>
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-neutral-200 text-neutral-700 rounded-2xl font-medium hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-200">
                      <Upload className="w-5 h-5" />
                      <span className="hidden sm:inline">Import</span>
                    </button>
                  </div>
                </div>

                {/* Questions List or Empty State */}
                {questions.length === 0 ? (
                  <EmptyState
                    title="No questions yet"
                    description="Click '+ Add Question' to create your first question, or import questions from a markdown file"
                    actionLabel="Add Question"
                    onAction={handleAddQuestion}
                    type="questions"
                  />
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <QuestionBuilderCard
                        key={question.id}
                        question={question}
                        index={index}
                        onEdit={handleEditQuestion}
                        onDelete={handleDeleteQuestion}
                        onPreview={(q) => setSelectedQuestion(q)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 'scoring' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                    Scoring Settings
                  </h2>
                  <p className="text-neutral-600">
                    Configure how your exam is graded
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-neutral-900">
                      Grading Configuration
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Scoring settings will be configured here. Features include pass/fail thresholds,
                    weighted scoring, and more.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 'publish' && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <h2 className="text-3xl font-bold text-neutral-900 mb-2">
                    Publish & Share
                  </h2>
                  <p className="text-neutral-600">
                    Make your exam available to students
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Share2 className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-neutral-900">
                      Share Options
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Publishing options will be configured here. Generate shareable links,
                    set access permissions, and track exam sessions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Preview Panel - Desktop Only */}
        <PreviewPanel
          question={selectedQuestion || questions[0]}
          questionNumber={questions.findIndex(q => q.id === selectedQuestion?.id) + 1 || 1}
          isVisible={isPreviewVisible}
          onToggle={() => setIsPreviewVisible(!isPreviewVisible)}
        />
      </div>
    </div>
  );
}
