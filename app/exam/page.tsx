'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Question } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import ExamProgress from '@/components/ExamProgress';
import ExamTimer from '@/components/ExamTimer';
import { isAnswerCorrect } from '@/lib/examLogic';
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function ExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const retryIds = searchParams.get('retry');
  const examId = searchParams.get('exam_id');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [multiAnswers, setMultiAnswers] = useState<Map<string, string[]>>(new Map());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const initializeExam = useCallback(async () => {
    try {
      let url = '/api/questions';
      const params = new URLSearchParams();

      if (retryIds) {
        params.append('ids', retryIds);
      } else if (examId) {
        params.append('exam_id', examId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      console.log('📊 Fetched questions:', {
        count: data.questions?.length,
        firstQuestion: data.questions?.[0],
        hasAiAnalysis: data.questions?.[0]?.ai_analysis,
      });

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);

        const targetExamId = examId || data.questions[0]?.exam_id;
        const { data: existingSessions } = await supabase
          .from('exam_sessions')
          .select('id')
          .eq('exam_id', targetExamId)
          .eq('completed', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingSessions && existingSessions.length > 0) {
          setSessionId(existingSessions[0].id);
        } else {
          const sessionResponse = await fetch('/api/session/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              examId: targetExamId,
              questionIds: data.questions.map((q: Question) => q.id),
            }),
          });

          const sessionData = await sessionResponse.json();
          if (sessionData.success) {
            setSessionId(sessionData.session.id);
          }
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error initializing exam:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [examId, retryIds, router]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      if (!initialized) {
        setInitialized(true);
        initializeExam();
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMultipleChoice = (question: Question) => {
    return question.correct_answer.includes(',');
  };

  const handleAnswerSelect = async (answer: string) => {
    if (!sessionId || !questions[currentIndex]) return;

    const question = questions[currentIndex];
    const isMulti = isMultipleChoice(question);

    if (isMulti) {
      const currentMultiAnswers = multiAnswers.get(question.id) || [];
      const newMultiAnswers = new Map(multiAnswers);

      if (currentMultiAnswers.includes(answer)) {
        newMultiAnswers.set(
          question.id,
          currentMultiAnswers.filter((a) => a !== answer)
        );
      } else {
        newMultiAnswers.set(question.id, [...currentMultiAnswers, answer]);
      }
      setMultiAnswers(newMultiAnswers);

      const combinedAnswer = newMultiAnswers.get(question.id)?.sort().join(',') || '';
      const correct = combinedAnswer === question.correct_answer.split(',').map(a => a.trim()).sort().join(',');

      await fetch('/api/session/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          selectedAnswer: combinedAnswer,
          isCorrect: correct,
        }),
      });
    } else {
      const newAnswers = new Map(answers);
      newAnswers.set(question.id, answer);
      setAnswers(newAnswers);

      const correct = isAnswerCorrect(question, answer);
      await fetch('/api/session/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          selectedAnswer: answer,
          isCorrect: correct,
        }),
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && !transitioning) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setTransitioning(false);
      }, 50);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1 && !transitioning) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setTransitioning(false);
      }, 50);
    }
  };

  const handleFinish = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/session/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          elapsedTime
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/exam/results?sessionId=${sessionId}`);
      }
    } catch (error) {
      console.error('Error finishing exam:', error);
    }
  };

  const handleTimeUpdate = (seconds: number) => {
    setElapsedTime(seconds);
  };

  const handleExitExam = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = async () => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    await handleFinish();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-gray-400">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-neutral-600 dark:text-gray-400 mb-4">No questions available</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-medium transition-all duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isMulti = isMultipleChoice(currentQuestion);
  const selectedAnswer = answers.get(currentQuestion.id);
  const selectedAnswersForQuestion = multiAnswers.get(currentQuestion.id) || [];
  const totalAnswered = answers.size + multiAnswers.size;
  const canFinish = totalAnswered === questions.length;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleExitExam}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 border-2 border-red-200 dark:border-red-800"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Exit Exam</span>
            </button>

            <ExamTimer onTimeUpdate={handleTimeUpdate} />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ExamProgress
            currentQuestion={currentIndex}
            totalQuestions={questions.length}
            answeredCount={totalAnswered}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            selectedAnswer={selectedAnswer}
            selectedAnswers={selectedAnswersForQuestion}
            onAnswerSelect={handleAnswerSelect}
            multipleChoice={isMulti}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-neutral-200 dark:border-gray-700 shadow-lg z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all duration-200',
                currentIndex === 0
                  ? 'bg-neutral-100 dark:bg-gray-700 text-neutral-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 border-2 border-neutral-200 dark:border-gray-600 text-neutral-700 dark:text-gray-300 hover:border-neutral-300 dark:hover:border-gray-500 hover:bg-neutral-50 dark:hover:bg-gray-600'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-gray-400">
              <span className="font-semibold">{currentIndex + 1}</span>
              <span>/</span>
              <span>{questions.length}</span>
            </div>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleFinish}
                disabled={!canFinish}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all duration-200 shadow-sm',
                  canFinish
                    ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                    : 'bg-neutral-200 dark:bg-gray-700 text-neutral-400 dark:text-gray-500 cursor-not-allowed'
                )}
              >
                <CheckCircle className="w-5 h-5" />
                <span>Finish Exam</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spacing for fixed bottom nav */}
      <div className="h-20"></div>

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 animate-fadeIn">
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">Exit Exam?</h3>
            <p className="text-neutral-600 dark:text-gray-300 mb-6">
              Are you sure you want to exit the exam? Your progress will be saved and you will be redirected to the results page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 px-5 py-3 bg-white dark:bg-gray-700 border-2 border-neutral-200 dark:border-gray-600 text-neutral-700 dark:text-gray-300 rounded-2xl font-medium hover:border-neutral-300 dark:hover:border-gray-500 hover:bg-neutral-50 dark:hover:bg-gray-600 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 px-5 py-3 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Yes, Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-gray-400">Loading exam...</p>
        </div>
      </div>
    }>
      <ExamContent />
    </Suspense>
  );
}
