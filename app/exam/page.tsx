'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Question } from '@/lib/supabaseClient';
import QuestionCard from '@/components/QuestionCard';
import ExamProgress from '@/components/ExamProgress';
import NavigationButtons from '@/components/NavigationButtons';
import ExamTimer from '@/components/ExamTimer';
import { isAnswerCorrect } from '@/lib/examLogic';
import { X } from 'lucide-react';

export default function ExamPage() {
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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Prevent double initialization in React Strict Mode
      if (!initialized) {
        setInitialized(true);
        initializeExam(user.id);
      }
    };

    checkAuth();
  }, [router, initialized, initializeExam]);

  const initializeExam = useCallback(async (userId: string) => {
    try {
      // Fetch questions
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

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);

        // Create exam session
        const sessionResponse = await fetch('/api/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId: examId || data.questions[0]?.exam_id,
            questionIds: data.questions.map((q: Question) => q.id),
          }),
        });

        const sessionData = await sessionResponse.json();
        if (sessionData.success) {
          setSessionId(sessionData.session.id);
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

  const isMultipleChoice = (question: Question) => {
    return question.correct_answer.includes(',');
  };

  const handleAnswerSelect = async (answer: string) => {
    if (!sessionId || !questions[currentIndex]) return;

    const question = questions[currentIndex];
    const isMulti = isMultipleChoice(question);

    if (isMulti) {
      // Handle multiple choice
      const currentMultiAnswers = multiAnswers.get(question.id) || [];
      const newMultiAnswers = new Map(multiAnswers);

      if (currentMultiAnswers.includes(answer)) {
        // Deselect if already selected
        newMultiAnswers.set(
          question.id,
          currentMultiAnswers.filter((a) => a !== answer)
        );
      } else {
        // Add to selections
        newMultiAnswers.set(question.id, [...currentMultiAnswers, answer]);
      }
      setMultiAnswers(newMultiAnswers);

      // Save combined answer
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
      // Handle single choice
      const newAnswers = new Map(answers);
      newAnswers.set(question.id, answer);
      setAnswers(newAnswers);

      // Save answer to backend
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
      // Small delay to allow answer to hide before changing question
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setTransitioning(false);
      }, 50);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1 && !transitioning) {
      setTransitioning(true);
      // Small delay to allow answer to hide before changing question
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

    // Finish the exam session and redirect to results
    await handleFinish();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No questions available</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto">
        {/* Top bar with Exit button and Timer */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleExitExam}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
          >
            <X className="w-4 h-4" />
            Exit Exam
          </button>

          <ExamTimer onTimeUpdate={handleTimeUpdate} />
        </div>

        <ExamProgress
          currentQuestion={currentIndex}
          totalQuestions={questions.length}
          answeredCount={totalAnswered}
        />

        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          selectedAnswer={selectedAnswer}
          selectedAnswers={selectedAnswersForQuestion}
          onAnswerSelect={handleAnswerSelect}
          multipleChoice={isMulti}
        />

        <div className="mt-6">
          <NavigationButtons
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onFinish={handleFinish}
            canFinish={canFinish}
          />
        </div>
      </div>

      {/* Exit confirmation dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Exit Exam?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to exit the exam? Your progress will be saved and you will be redirected to the results page.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
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
