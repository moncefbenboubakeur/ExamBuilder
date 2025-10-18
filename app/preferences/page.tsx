'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Shuffle, Save, ArrowLeft, Loader2 } from 'lucide-react';

export default function PreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      await fetchPreferences();
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/preferences');
      const data = await response.json();

      if (data.success && data.preferences) {
        setShuffleQuestions(data.preferences.shuffle_questions);
        setShuffleOptions(data.preferences.shuffle_options);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shuffle_questions: shuffleQuestions,
          shuffle_options: shuffleOptions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Preferences saved successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-gray-400">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
      {/* Header */}
      <div id="main-content" className="bg-white dark:bg-gray-800 border-b border-neutral-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Exam Preferences</h1>
          <p className="text-neutral-600 dark:text-gray-400 mt-2">
            Customize how questions and answer options are presented during your exams
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-neutral-200 dark:border-gray-700 p-6 sm:p-8">
          {/* Save Message */}
          {saveMessage && (
            <div
              className={`mb-6 p-4 rounded-xl ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100'
                  : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
              }`}
            >
              {saveMessage.text}
            </div>
          )}

          {/* Shuffle Settings */}
          <div className="space-y-6">
            <div className="flex items-start gap-4 pb-6 border-b border-neutral-200 dark:border-gray-700">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Shuffle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  Exam Personalization
                </h2>
                <p className="text-neutral-600 dark:text-gray-400 text-sm">
                  These settings control how questions and answer options are randomized for you.
                  Changes apply to all future exam sessions.
                </p>
              </div>
            </div>

            {/* Shuffle Questions Toggle */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Shuffle Questions
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      shuffleQuestions
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-neutral-100 dark:bg-gray-700 text-neutral-600 dark:text-gray-400'
                    }`}
                  >
                    {shuffleQuestions ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-gray-400 text-sm">
                  When enabled, questions will appear in a random order each time you start an exam.
                  This helps prevent memorization of question sequences and reinforces true understanding.
                </p>
              </div>
              <button
                onClick={() => setShuffleQuestions(!shuffleQuestions)}
                className={`flex-shrink-0 relative w-14 h-8 rounded-full transition-colors duration-200 ${
                  shuffleQuestions
                    ? 'bg-indigo-600'
                    : 'bg-neutral-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                    shuffleQuestions ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Shuffle Options Toggle */}
            <div className="flex items-start justify-between gap-6 pt-6 border-t border-neutral-200 dark:border-gray-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Shuffle Answer Options
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      shuffleOptions
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-neutral-100 dark:bg-gray-700 text-neutral-600 dark:text-gray-400'
                    }`}
                  >
                    {shuffleOptions ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-gray-400 text-sm">
                  When enabled, answer options (A, B, C, D) will be randomized within each question.
                  This prevents memorizing answer positions and tests your actual knowledge.
                </p>
              </div>
              <button
                onClick={() => setShuffleOptions(!shuffleOptions)}
                className={`flex-shrink-0 relative w-14 h-8 rounded-full transition-colors duration-200 ${
                  shuffleOptions
                    ? 'bg-indigo-600'
                    : 'bg-neutral-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                    shuffleOptions ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-blue-900 dark:text-blue-100 text-sm">
              <strong>Note:</strong> These preferences apply to all future exam sessions. Once you start an exam,
              the shuffle order is locked for that session to ensure consistent review. Your current ongoing exams
              will maintain their original shuffle state.
            </p>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
