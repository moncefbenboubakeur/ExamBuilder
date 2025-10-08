'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import { BookOpen, Play, History, FileText, Star, Hash } from 'lucide-react';
import { supabase, Exam } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check auth status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthChecked(true);
      if (!user) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user && authChecked) {
      fetchExams();
    }
  }, [user, authChecked, fetchExams]);

  const fetchExams = useCallback(async () => {
    try {
      const response = await fetch('/api/exams');
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed - please try logging in again');
          // Force re-login
          await supabase.auth.signOut();
          router.push('/login');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setExams(data.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleUploadSuccess = () => {
    fetchExams();
  };

  const handleStartExam = (examId: string) => {
    router.push(`/exam?exam_id=${examId}`);
  };

  const handleViewHistory = () => {
    router.push('/dashboard');
  };

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <BookOpen className="w-12 h-12 text-emerald-600" />
              <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-amber-500 rounded transform rotate-12 shadow-md"></div>
            </div>
            <div className="flex flex-col items-start">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">ExamBuilder</h1>
              <span className="text-sm text-emerald-600 font-semibold">.net</span>
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Build your knowledge, one question at a time. Choose an exam and start your journey to mastery.
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Exam Library</h2>
          <button
            onClick={handleViewHistory}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            <History className="w-5 h-5" />
            View History
          </button>
        </div>

        <div className="mb-8">
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exams Yet</h3>
            <p className="text-gray-600 mb-6">
              Upload a markdown file to create your first exam
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{exam.name}</h3>
                      {exam.is_sample && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                          <Star className="w-3 h-3" />
                          Sample
                        </span>
                      )}
                    </div>
                    {exam.description && (
                      <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    <span>{exam.question_count || 0} questions</span>
                  </div>
                  {exam.file_name && (
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span className="truncate max-w-[150px]">{exam.file_name}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleStartExam(exam.id)}
                  disabled={!exam.question_count || exam.question_count === 0}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Start Exam
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🏗️</span>
            </div>
            <h3 className="font-bold text-emerald-900 text-lg">Build Your Success in 4 Steps</h3>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-sm text-emerald-800">
            <li className="font-medium">
              <span className="font-normal">Upload your exam questions in markdown format - we&apos;ll handle the rest</span>
            </li>
            <li className="font-medium">
              <span className="font-normal">Choose an exam from your library and start building your knowledge</span>
            </li>
            <li className="font-medium">
              <span className="font-normal">Answer questions at your own pace with our smart timer and pause feature</span>
            </li>
            <li className="font-medium">
              <span className="font-normal">Track your progress, retry mistakes, and watch your scores improve</span>
            </li>
          </ol>
          <div className="mt-4 pt-4 border-t border-emerald-200">
            <p className="text-xs text-emerald-700 italic">
              💡 Pro tip: Use the dashboard to identify weak areas and focus your practice where it matters most.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
