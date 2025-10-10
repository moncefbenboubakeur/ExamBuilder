'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Exam {
  id: string;
  name: string;
  user_id: string;
  file_name?: string;
  created_at: string;
  question_count?: number;
}

export default function ExamManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetEmail, setTargetEmail] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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

      // Fetch user's exams with question count
      const { data, error } = await supabase
        .from('exams')
        .select(`
          id,
          name,
          user_id,
          file_name,
          created_at,
          questions (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const examsWithCount = data?.map((exam: Exam & { questions: Array<{ count: number }> }) => ({
        ...exam,
        question_count: exam.questions[0]?.count || 0,
      }));

      setExams(examsWithCount || []);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
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
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} ({exam.question_count} questions)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Target User Email
              </label>
              <input
                type="email"
                id="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
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

        {/* Exam List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Your Exams</h2>
          </div>

          {exams.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No exams found. Upload an exam to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{exam.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{exam.question_count}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{exam.file_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(exam.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
