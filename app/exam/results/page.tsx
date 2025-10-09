'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ResultScreen from '@/components/ResultScreen';

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [results, setResults] = useState<{
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    score: number;
    wrongQuestionIds: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    if (!sessionId) return;

    try {
      // In a real scenario, we'd fetch from the backend
      // For now, we'll get the session data
      const { data: session, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      if (session) {
        // Get wrong question IDs
        const { data: answers } = await supabase
          .from('exam_answers')
          .select('*')
          .eq('session_id', sessionId)
          .eq('is_correct', false);

        const wrongQuestionIds = answers?.map((a) => a.question_id) || [];

        setResults({
          totalQuestions: session.total_questions,
          correctCount: session.correct_count,
          wrongCount: session.wrong_count,
          score: session.score,
          wrongQuestionIds,
        });
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router, sessionId]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      if (!sessionId) {
        router.push('/');
        return;
      }

      fetchResults();
    };

    checkAuth();
  }, [router, sessionId, fetchResults]);

  const handleRetryAll = () => {
    router.push('/exam');
  };

  const handleRetryWrong = () => {
    if (results?.wrongQuestionIds && results.wrongQuestionIds.length > 0) {
      const ids = results.wrongQuestionIds.join(',');
      router.push(`/exam?retry=${ids}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Results not found</p>
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

  return (
    <div className="py-12 px-4">
      <ResultScreen
        totalQuestions={results.totalQuestions}
        correctCount={results.correctCount}
        wrongCount={results.wrongCount}
        score={results.score}
        onRetryAll={handleRetryAll}
        onRetryWrong={handleRetryWrong}
        hasWrongAnswers={results.wrongQuestionIds.length > 0}
      />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
