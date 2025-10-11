'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface ExamWithSharing {
  exam_id: string;
  exam_name: string;
  question_count: number;
  created_at: string;
  is_owner: boolean;
  owner_email: string;
  shared_by_email?: string;
}

interface UserExamsData {
  user_id: string;
  user_email: string;
  exams: ExamWithSharing[];
}

export default function ExamManagement() {
  const [usersData, setUsersData] = useState<UserExamsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetEmail, setTargetEmail] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [inputMode, setInputMode] = useState<'select' | 'manual'>('select');
  const router = useRouter();

  useEffect(() => {
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is admin
      const isAdmin = user.email === 'monceftab@gmail.com';

      if (!isAdmin) {
        router.push('/');
        return;
      }

      // Fetch user-organized exams via admin API
      const response = await fetch('/api/admin/users-exams');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch exams');
      }

      setUsersData(data.users || []);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const handleCopyExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!selectedExamId || !targetEmail) {
      setError('Please select an exam and enter target email');
      return;
    }

    try {
      const response = await fetch('/api/admin/copy-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examId: selectedExamId,
          targetUserEmail: targetEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to copy exam');
      }

      setMessage(data.message);
      setTargetEmail('');
      setSelectedExamId(null);
    } catch (err) {
      console.error('Error copying exam:', err);
      setError(err instanceof Error ? err.message : 'Failed to copy exam');
    }
  };

  const handleDeleteExam = async (examId: string, examName: string) => {
    if (deleting) return;

    setDeleting(examId);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`/api/admin/exams/${examId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete exam');
      }

      setMessage(`Exam "${examName}" deleted successfully`);
      setDeleteConfirm(null);

      // Refresh exams list
      await fetchExams();
    } catch (err) {
      console.error('Error deleting exam:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete exam');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
          <p className="mt-2 text-gray-600">Copy exams to other users</p>
        </div>

        {/* Copy Exam Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Copy Exam to Another User</h2>

          <form onSubmit={handleCopyExam} className="space-y-4">
            <div>
              <label htmlFor="exam" className="block text-sm font-medium text-gray-700 mb-2">
                Select Exam
              </label>
              <select
                id="exam"
                value={selectedExamId || ''}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose an exam...</option>
                {usersData.flatMap((userData) =>
                  userData.exams.map((exam, examIndex) => (
                    <option key={`${userData.user_id}-${exam.exam_id}-${examIndex}`} value={exam.exam_id}>
                      {exam.exam_name} - {userData.user_email} ({exam.question_count} questions)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="targetUser" className="block text-sm font-medium text-gray-700">
                  Target User
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('select');
                      setTargetEmail('');
                    }}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      inputMode === 'select'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Select User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('manual');
                      setTargetEmail('');
                    }}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      inputMode === 'manual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Type Email
                  </button>
                </div>
              </div>

              {inputMode === 'select' ? (
                <select
                  id="targetUser"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a user...</option>
                  {usersData.map((userData) => (
                    <option key={userData.user_id} value={userData.user_email}>
                      {userData.user_email} ({userData.exams.length} exam{userData.exams.length !== 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="email"
                  id="targetUser"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <p className="mt-1 text-xs text-gray-500">
                {inputMode === 'select'
                  ? 'Select from existing users in the system'
                  : 'Manually type an email address (user must have an account)'}
              </p>
            </div>

            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Copy Exam
            </button>
          </form>
        </div>

        {/* User-Organized Exam List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Exams by User</h2>
            <p className="text-sm text-gray-600 mt-1">View exams organized by user, showing owned and shared exams</p>
          </div>

          {usersData.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No users found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {usersData.map((userData) => (
                <div key={userData.user_id} className="px-6 py-4">
                  {/* User Header */}
                  <button
                    onClick={() => toggleUserExpanded(userData.user_id)}
                    className="w-full flex items-center justify-between py-2 hover:bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {userData.user_email[0].toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{userData.user_email}</div>
                        <div className="text-sm text-gray-500">{userData.exams.length} exam{userData.exams.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedUsers.has(userData.user_id) ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Exams List */}
                  {expandedUsers.has(userData.user_id) && (
                    <div className="mt-4 ml-11 space-y-3">
                      {userData.exams.length === 0 ? (
                        <div className="text-sm text-gray-500 italic">No exams found for this user</div>
                      ) : (
                        userData.exams.map((exam) => (
                        <div key={exam.exam_id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{exam.exam_name}</h4>
                              <div className="mt-2 space-y-1 text-sm">
                                <div className="text-gray-600">
                                  <span className="font-medium">Questions:</span> {exam.question_count}
                                </div>
                                <div className="text-gray-600">
                                  <span className="font-medium">Created:</span> {new Date(exam.created_at).toLocaleDateString()}
                                </div>
                                {exam.is_owner ? (
                                  <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Owner
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-gray-600">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      Shared
                                    </span>
                                    <span className="ml-2">by {exam.shared_by_email}</span>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Original owner: {exam.owner_email}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              {deleteConfirm === exam.exam_id ? (
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => handleDeleteExam(exam.exam_id, exam.exam_name)}
                                    disabled={deleting === exam.exam_id}
                                    className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                                  >
                                    {deleting === exam.exam_id ? 'Deleting...' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    disabled={deleting === exam.exam_id}
                                    className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(exam.exam_id)}
                                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
}
