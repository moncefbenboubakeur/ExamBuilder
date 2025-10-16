'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import { BookOpen, Play, History, FileText, Star, Hash, Plus, Sparkles, Share2, Users, GraduationCap, Settings, Trash2 } from 'lucide-react';
import { supabase, ExamWithSharing } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import ShareExamModal from '@/components/share/ShareExamModal';

export default function Home() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamWithSharing[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExams = useCallback(async () => {
    try {
      const response = await fetch('/api/exams');
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed - please try logging in again');
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

  useEffect(() => {
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

  const handleUploadSuccess = () => {
    fetchExams();
  };

  const handleStartExam = (examId: string) => {
    router.push(`/exam?exam_id=${examId}`);
  };

  const handleStudyMode = (examId: string) => {
    router.push(`/study/${examId}`);
  };

  const handleViewHistory = () => {
    router.push('/dashboard');
  };

  const handleShareExam = (examId: string, examName: string) => {
    setSelectedExam({ id: examId, name: examName });
    setShareModalOpen(true);
  };

  const handleShareSuccess = () => {
    // Optionally refetch exams or show a notification
    fetchExams();
  };

  const handleDeleteExam = (examId: string, examName: string) => {
    setExamToDelete({ id: examId, name: examName });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteExam = async () => {
    if (!examToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/exams/${examToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh exam list
        await fetchExams();
        setDeleteConfirmOpen(false);
        setExamToDelete(null);
      } else {
        const data = await response.json();
        alert(`Failed to delete exam: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!authChecked || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
      <div id="main-content" className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 dark:text-indigo-400" />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-sky-400 dark:bg-sky-500 rounded transform rotate-12 shadow-md"></div>
              </div>
              <div className="flex flex-col items-start">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white leading-tight">
                  ExamBuilder
                </h1>
                <span className="text-sm sm:text-base text-indigo-600 dark:text-indigo-400 font-semibold">.net</span>
              </div>
            </div>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-gray-300 max-w-2xl mx-auto">
              Build your knowledge, one question at a time. Choose an exam and start your journey to mastery.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Your Exam Library</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => router.push('/builder')}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" />
                New Builder
              </button>
              <button
                onClick={handleViewHistory}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border-2 border-neutral-200 dark:border-gray-600 text-neutral-700 dark:text-gray-300 rounded-2xl font-medium hover:border-neutral-300 dark:hover:border-gray-500 hover:bg-neutral-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <History className="w-5 h-5" />
                View History
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mb-8">
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          </div>

          {/* Exams Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-neutral-200 dark:border-gray-700 p-6 animate-pulse">
                  <div className="h-6 bg-neutral-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-neutral-200 dark:border-gray-700 shadow-sm p-12 text-center">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center">
                  <FileText className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-sky-400 dark:bg-sky-500 rounded-full flex items-center justify-center shadow-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                No Exams Yet
              </h3>
              <p className="text-neutral-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Upload a markdown file to create your first exam, or use the new builder to create one from scratch
              </p>
              <button
                onClick={() => router.push('/builder')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Sparkles className="w-5 h-5" />
                Create Your First Exam
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className={cn(
                    'bg-white dark:bg-gray-800 rounded-xl border-2 border-neutral-200 dark:border-gray-700 p-6',
                    'hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200',
                    'group grid grid-rows-[auto_minmax(3rem,auto)_auto_auto] gap-3'
                  )}
                >
                  {/* Row 1: Title, Badges, and Action Icons - auto height with min-height */}
                  <div className="flex items-start justify-between min-h-[3rem]">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white line-clamp-1">
                          {exam.name}
                        </h3>
                        {exam.is_sample && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full flex-shrink-0">
                            <Star className="w-3 h-3" />
                            Sample
                          </span>
                        )}
                        {exam.is_shared_with_me && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full flex-shrink-0">
                            <Users className="w-3 h-3" />
                            Shared
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Action Icons */}
                    <div className="flex items-center gap-1 ml-2">
                      {/* Preferences/Settings button - always visible */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/preferences');
                        }}
                        className="p-2 text-neutral-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-lg transition-colors"
                        title="Exam preferences (shuffle settings)"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                      {/* Share button - only for owned exams */}
                      {user && exam.user_id === user.id && !exam.is_sample && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareExam(exam.id, exam.name);
                          }}
                          className="p-2 text-neutral-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-lg transition-colors"
                          title="Share this exam"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      )}
                      {/* Delete button - only for owned, non-sample exams */}
                      {user && exam.user_id === user.id && !exam.is_sample && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExam(exam.id, exam.name);
                          }}
                          className="p-2 text-neutral-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete this exam"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Description - fixed height with line-clamp */}
                  <div className="min-h-[3rem]">
                    {exam.description ? (
                      <p className="text-sm text-neutral-600 dark:text-gray-300 line-clamp-2">
                        {exam.description}
                      </p>
                    ) : (
                      <div className="h-[3rem]"></div>
                    )}
                  </div>

                  {/* Row 3: Metadata - auto height */}
                  <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Hash className="w-4 h-4" />
                      <span>{exam.question_count || 0} questions</span>
                    </div>
                    {exam.file_name && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span className="truncate max-w-[120px]">{exam.file_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Row 4: Action Buttons - always at bottom, aligned across all cards */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStudyMode(exam.id)}
                      disabled={!exam.question_count || exam.question_count === 0}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all duration-200',
                        exam.question_count && exam.question_count > 0
                          ? 'bg-white dark:bg-gray-800 border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900'
                          : 'bg-neutral-200 dark:bg-gray-700 text-neutral-400 dark:text-gray-500 cursor-not-allowed border-2 border-transparent'
                      )}
                    >
                      <GraduationCap className="w-5 h-5" />
                      Study
                    </button>
                    <button
                      onClick={() => handleStartExam(exam.id)}
                      disabled={!exam.question_count || exam.question_count === 0}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all duration-200',
                        exam.question_count && exam.question_count > 0
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-sm hover:shadow-md'
                          : 'bg-neutral-200 dark:bg-gray-700 text-neutral-400 dark:text-gray-500 cursor-not-allowed'
                      )}
                    >
                      <Play className="w-5 h-5" />
                      Take Exam
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Card */}
          <div className="mt-8 sm:mt-12 bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950 dark:to-sky-950 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-indigo-900 dark:text-indigo-300 text-lg sm:text-xl">
                Build Your Success in 4 Steps
              </h3>
            </div>
            <ol className="list-decimal list-inside space-y-3 text-sm sm:text-base text-indigo-800 dark:text-indigo-300">
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
            <div className="mt-6 pt-6 border-t border-indigo-200 dark:border-indigo-700">
              <p className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">
                <span className="font-semibold">💡 Pro tip:</span> Use the dashboard to identify weak areas and focus your practice where it matters most.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {selectedExam && (
        <ShareExamModal
          examId={selectedExam.id}
          examName={selectedExam.name}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedExam(null);
          }}
          onShareSuccess={handleShareSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && examToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 animate-fadeIn">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">Delete Exam?</h3>
            </div>
            <p className="text-neutral-600 dark:text-gray-300 mb-2">
              Are you sure you want to delete{' '}
              <strong className="text-neutral-900 dark:text-white">&quot;{examToDelete.name}&quot;</strong>?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-6">
              ⚠️ This will permanently delete the exam and all its questions. This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setExamToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-5 py-3 bg-white dark:bg-gray-700 border-2 border-neutral-200 dark:border-gray-600 text-neutral-700 dark:text-gray-300 rounded-2xl font-medium hover:border-neutral-300 dark:hover:border-gray-500 hover:bg-neutral-50 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteExam}
                disabled={deleting}
                className="flex-1 px-5 py-3 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Delete Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
