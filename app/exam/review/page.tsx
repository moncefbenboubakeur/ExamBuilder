'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Question } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import ModelAnswerViewer from '@/components/exam/ModelAnswerViewer';
import { ConsensusQuickView } from '@/components/exam/ConsensusIndicator';
import { ChevronLeft, ChevronRight, Home, BarChart3, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExamAnswer {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
}

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Map<string, ExamAnswer>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [examId, setExamId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{
    score: number;
    total_questions: number;
    correct_count: number;
    wrong_count: number;
  } | null>(null);

  useEffect(() => {
    const loadReviewData = async () => {
      if (!sessionId) {
        router.push('/');
        return;
      }

      try {
        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Load session info
        const { data: session, error: sessionError } = await supabase
          .from('exam_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError || !session) {
          console.error('Session not found:', sessionError);
          router.push('/');
          return;
        }

        setSessionInfo({
          score: session.score,
          total_questions: session.total_questions,
          correct_count: session.correct_count,
          wrong_count: session.wrong_count
        });
        setExamId(session.exam_id);

        // Load answers
        const { data: sessionAnswers, error: answersError } = await supabase
          .from('exam_answers')
          .select('*')
          .eq('session_id', sessionId);

        if (answersError) {
          console.error('Failed to load answers:', answersError);
          return;
        }

        const answerMap = new Map<string, ExamAnswer>();
        sessionAnswers?.forEach(answer => {
          answerMap.set(answer.question_id, answer);
        });
        setAnswers(answerMap);

        // Load questions
        const questionIds = sessionAnswers?.map(a => a.question_id) || [];
        if (questionIds.length === 0) {
          router.push('/');
          return;
        }

        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .in('id', questionIds);

        if (questionsError) {
          console.error('Failed to load questions:', questionsError);
          return;
        }

        // Sort questions to match the order they were answered
        const sortedQuestions = questionIds
          .map(id => questionsData?.find(q => q.id === id))
          .filter((q): q is Question => q !== undefined);

        setQuestions(sortedQuestions);
      } catch (error) {
        console.error('Error loading review data:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadReviewData();
  }, [router, sessionId]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-gray-400">Loading review...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-neutral-600 dark:text-gray-400 mb-4">No questions to review</p>
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
  const currentAnswer = answers.get(currentQuestion.id);
  const isMultipleChoice = currentQuestion.correct_answer.includes(',');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/exam/results?sessionId=${sessionId}`)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Results</span>
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                Review Mode
              </h1>
            </div>

            {sessionInfo && (
              <div className="flex items-center gap-4 text-sm">
                <span className={cn(
                  "font-semibold",
                  sessionInfo.score >= 70 ? "text-green-600" : "text-red-600"
                )}>
                  Score: {sessionInfo.score}%
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {sessionInfo.correct_count}/{sessionInfo.total_questions}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Consensus Overview */}
      {examId && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ConsensusQuickView examId={examId} />
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              currentAnswer?.is_correct
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            )}>
              {currentAnswer?.is_correct ? 'Correct' : 'Incorrect'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Question Card */}
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            selectedAnswer={isMultipleChoice ? undefined : currentAnswer?.selected_answer}
            selectedAnswers={isMultipleChoice ? currentAnswer?.selected_answer.split(',') : []}
            onAnswerSelect={() => {}} // No-op in review mode
            showCorrectAnswer={true}
            multipleChoice={isMultipleChoice}
          />

          {/* Model Answer Analysis */}
          {currentAnswer && sessionId && (
            <ModelAnswerViewer
              sessionId={sessionId}
              questionId={currentQuestion.id}
              correctAnswer={currentQuestion.correct_answer}
              userAnswer={currentAnswer.selected_answer}
            />
          )}
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

            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all duration-200',
                currentIndex === questions.length - 1
                  ? 'bg-neutral-100 dark:bg-gray-700 text-neutral-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md'
              )}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Spacing for fixed bottom nav */}
      <div className="h-20"></div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-gray-400">Loading review...</p>
        </div>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}