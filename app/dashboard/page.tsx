'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  TrendingUp,
  Clock,
  Award,
  Target,
  Calendar,
  RotateCcw,
  CheckCircle,
  XCircle,
  Play,
  Filter,
  Star,
  TrendingDown,
  Minus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface ExamSession {
  id: string;
  exam_id: string;
  created_at: string;
  score: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  elapsed_time: number;
  completed: boolean;
  exams: {
    id: string;
    name: string;
    file_name: string;
    is_sample: boolean;
  };
}

interface Stats {
  totalExams: number;
  averageScore: number;
  bestScore: number;
  totalQuestions: number;
  totalCorrect: number;
  totalTimeSpent: number;
  recentActivity: number;
  scoreTrend: { date: string; score: number }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterScore, setFilterScore] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      fetchData();
    };

    checkAuth();
  }, [router]);

  const fetchData = async () => {
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/stats'),
      ]);

      const sessionsData = await sessionsRes.json();
      const statsData = await statsRes.json();

      if (sessionsData.success) {
        setSessions(sessionsData.sessions);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-700 bg-green-100';
    if (score >= 70) return 'text-blue-700 bg-blue-100';
    if (score >= 50) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const getScoreTrend = (score: number): 'up' | 'down' | 'same' => {
    if (!stats || stats.totalExams < 2) return 'same';
    const diff = score - stats.averageScore;
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'same';
  };

  const handleRetryIncorrect = async (sessionId: string) => {
    // Get wrong question IDs
    const { data: answers } = await supabase
      .from('exam_answers')
      .select('question_id, is_correct')
      .eq('session_id', sessionId)
      .eq('is_correct', false);

    if (answers && answers.length > 0) {
      const questionIds = answers.map(a => a.question_id).join(',');
      router.push(`/exam?retry=${questionIds}`);
    }
  };

  const handleRetakeAll = (examId: string) => {
    router.push(`/exam?exam_id=${examId}`);
  };

  const toggleSessionSelection = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const selectAllSessions = () => {
    const allIds = filteredSessions.map(s => s.id);
    setSelectedSessions(new Set(allIds));
  };

  const deselectAllSessions = () => {
    setSelectedSessions(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedSessions.size === 0) return;

    setDeleting(true);
    try {
      const response = await fetch('/api/sessions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionIds: Array.from(selectedSessions),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`Deleted ${data.deletedCount} sessions out of ${data.requestedCount} requested`);

        // Refresh data after deletion
        await fetchData();
        setSelectedSessions(new Set());
        setShowDeleteDialog(false);

        if (data.deletedCount < data.requestedCount) {
          alert(`Only ${data.deletedCount} out of ${data.requestedCount} sessions were deleted. Some may not belong to you.`);
        }
      } else {
        console.error('Delete failed:', data);
        alert(`Failed to delete sessions: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting sessions:', error);
      alert('Failed to delete sessions');
    } finally {
      setDeleting(false);
    }
  };

  // Filter and sort sessions
  const filteredSessions = sessions
    .filter(session => {
      if (filterScore === 'all') return true;
      if (filterScore === 'excellent') return session.score >= 90;
      if (filterScore === 'good') return session.score >= 70 && session.score < 90;
      if (filterScore === 'poor') return session.score < 70;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'time') return b.elapsed_time - a.elapsed_time;
      return 0;
    });

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your progress and review past exams</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Exams</h3>
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalExams}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalQuestions} questions answered</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Average Score</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.averageScore}%</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalCorrect} correct answers</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Best Score</h3>
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.bestScore}%</p>
              <p className="text-xs text-gray-500 mt-1">Personal best</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Time Spent</h3>
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatTime(stats.totalTimeSpent)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.recentActivity} exams this week</p>
            </div>
          </div>
        )}

        {/* Filters and Bulk Actions */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
                <select
                  value={filterScore}
                  onChange={(e) => setFilterScore(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Scores</option>
                  <option value="excellent">Excellent (90%+)</option>
                  <option value="good">Good (70-89%)</option>
                  <option value="poor">Needs Work (&lt;70%)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="date">Most Recent</option>
                  <option value="score">Highest Score</option>
                  <option value="time">Longest Time</option>
                </select>
              </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedSessions.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-emerald-900">
                    {selectedSessions.size} selected
                  </span>
                  <button
                    onClick={deselectAllSessions}
                    className="text-sm text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSessions.size < filteredSessions.length && (
                    <button
                      onClick={selectAllSessions}
                      className="px-3 py-1 text-sm bg-white text-emerald-700 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Select All
                    </button>
                  )}
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exam History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Exam History</h2>
            {filteredSessions.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllSessions}
                  className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllSessions}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>

          {filteredSessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exams Yet</h3>
              <p className="text-gray-600 mb-6">
                Start taking exams to see your progress here
              </p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Take Your First Exam
              </button>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const trend = getScoreTrend(session.score);
              return (
                <div
                  key={session.id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedSessions.has(session.id)}
                        onChange={() => toggleSessionSelection(session.id)}
                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {session.exams.name}
                        </h3>
                        {session.exams.is_sample && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                            <Star className="w-3 h-3" />
                            Sample
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateTime(session.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(session.elapsed_time)}
                        </div>
                      </div>
                    </div>

                    {/* Score Section */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(session.score)}`}>
                            {session.score}%
                          </span>
                          {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
                          {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
                          {trend === 'same' && <Minus className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            {session.correct_count}
                          </div>
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            {session.wrong_count}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleRetakeAll(session.exam_id)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Retake
                        </button>
                        {session.wrong_count > 0 && (
                          <button
                            onClick={() => handleRetryIncorrect(session.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Retry ({session.wrong_count})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete Exam History?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedSessions.size} exam session{selectedSessions.size > 1 ? 's' : ''}?
                This action cannot be undone and will permanently remove all associated data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
