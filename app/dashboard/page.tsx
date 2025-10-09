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
import { cn } from '@/lib/utils';

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
    if (score >= 90) return 'text-green-700 bg-green-100 border-green-300';
    if (score >= 70) return 'text-blue-700 bg-blue-100 border-blue-300';
    if (score >= 50) return 'text-amber-700 bg-amber-100 border-amber-300';
    return 'text-red-700 bg-red-100 border-red-300';
  };

  const getScoreTrend = (score: number): 'up' | 'down' | 'same' => {
    if (!stats || stats.totalExams < 2) return 'same';
    const diff = score - stats.averageScore;
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'same';
  };

  const handleRetryIncorrect = async (sessionId: string) => {
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
        await fetchData();
        setSelectedSessions(new Set());
        setShowDeleteDialog(false);

        if (data.deletedCount < data.requestedCount) {
          alert(`Only ${data.deletedCount} out of ${data.requestedCount} sessions were deleted.`);
        }
      } else {
        alert(`Failed to delete sessions: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting sessions:', error);
      alert('Failed to delete sessions');
    } finally {
      setDeleting(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">Dashboard</h1>
            <p className="text-neutral-600">Track your progress and review past exams</p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <div className="bg-white rounded-xl border-2 border-neutral-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-600">Total Exams</h3>
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-neutral-900">{stats.totalExams}</p>
                <p className="text-xs text-neutral-500 mt-1">{stats.totalQuestions} questions answered</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-neutral-200 p-6 hover:border-green-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-600">Average Score</h3>
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-neutral-900">{stats.averageScore}%</p>
                <p className="text-xs text-neutral-500 mt-1">{stats.totalCorrect} correct answers</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-neutral-200 p-6 hover:border-amber-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-600">Best Score</h3>
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-neutral-900">{stats.bestScore}%</p>
                <p className="text-xs text-neutral-500 mt-1">Personal best</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-neutral-200 p-6 hover:border-purple-300 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-600">Time Spent</h3>
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-neutral-900">{formatTime(stats.totalTimeSpent)}</p>
                <p className="text-xs text-neutral-500 mt-1">{stats.recentActivity} exams this week</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl border-2 border-neutral-200 p-4 sm:p-6 mb-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <Filter className="w-5 h-5 text-neutral-600" />
                  <span className="text-sm font-semibold text-neutral-700">Filter:</span>
                  <select
                    value={filterScore}
                    onChange={(e) => setFilterScore(e.target.value)}
                    className="px-4 py-2 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Scores</option>
                    <option value="excellent">Excellent (90%+)</option>
                    <option value="good">Good (70-89%)</option>
                    <option value="poor">Needs Work (&lt;70%)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-700">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  >
                    <option value="date">Most Recent</option>
                    <option value="score">Highest Score</option>
                    <option value="time">Longest Time</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedSessions.size > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-indigo-900">
                      {selectedSessions.size} selected
                    </span>
                    <button
                      onClick={deselectAllSessions}
                      className="text-sm text-indigo-700 hover:text-indigo-900 font-medium underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSessions.size < filteredSessions.length && (
                      <button
                        onClick={selectAllSessions}
                        className="px-4 py-2 text-sm bg-white text-indigo-700 border-2 border-indigo-300 rounded-2xl hover:bg-indigo-100 transition-all duration-200 font-medium"
                      >
                        Select All
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exam History */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-neutral-900">Exam History</h2>
              {filteredSessions.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllSessions}
                    className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-2xl hover:bg-indigo-200 transition-all duration-200 font-medium"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllSessions}
                    className="px-4 py-2 text-sm bg-neutral-100 text-neutral-700 rounded-2xl hover:bg-neutral-200 transition-all duration-200 font-medium"
                  >
                    Deselect All
                  </button>
                </div>
              )}
            </div>

            {filteredSessions.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-neutral-200 shadow-sm p-12 text-center">
                <Calendar className="w-20 h-20 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">No Exams Yet</h3>
                <p className="text-neutral-600 mb-6">
                  Start taking exams to see your progress here
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
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
                    className="bg-white rounded-xl border-2 border-neutral-200 p-4 sm:p-6 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col gap-4">
                      {/* Top Row */}
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selectedSessions.has(session.id)}
                          onChange={() => toggleSessionSelection(session.id)}
                          className="mt-1 w-5 h-5 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-bold text-neutral-900 truncate">
                              {session.exams.name}
                            </h3>
                            {session.exams.is_sample && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full flex-shrink-0">
                                <Star className="w-3 h-3" />
                                Sample
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-neutral-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs sm:text-sm">{formatDateTime(session.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(session.elapsed_time)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-neutral-100">
                        {/* Score */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className={cn('text-2xl sm:text-3xl font-bold px-4 py-2 rounded-xl border-2', getScoreColor(session.score))}>
                              {session.score}%
                            </span>
                            {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-600" />}
                            {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-600" />}
                            {trend === 'same' && <Minus className="w-5 h-5 text-neutral-400" />}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-semibold">{session.correct_count}</span>
                            </div>
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span className="font-semibold">{session.wrong_count}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleRetakeAll(session.exam_id)}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <Play className="w-4 h-4" />
                            Retake
                          </button>
                          {session.wrong_count > 0 && (
                            <button
                              onClick={() => handleRetryIncorrect(session.id)}
                              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-100 text-amber-700 border-2 border-amber-300 rounded-2xl text-sm font-medium hover:bg-amber-200 transition-all duration-200"
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

          {/* Delete Dialog */}
          {showDeleteDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 animate-fadeIn">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-1">Delete Exam History?</h3>
                    <p className="text-sm text-neutral-600">
                      Delete {selectedSessions.size} session{selectedSessions.size > 1 ? 's' : ''}? This cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={deleting}
                    className="flex-1 px-5 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-2xl font-medium hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    className="flex-1 px-5 py-3 bg-red-600 text-white rounded-2xl font-medium hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
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
    </div>
  );
}
