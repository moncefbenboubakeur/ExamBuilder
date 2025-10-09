'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, AlertCircle, Key, BookOpen } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Check your email for the magic link to sign in!',
      });
      setEmail('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send magic link';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        setMessage({
          type: 'success',
          text: 'Successfully logged in! Redirecting...',
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      setMessage({
        type: 'error',
        text: errorMessage,
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <div className="relative">
                <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  {usePassword ? (
                    <Key className="w-10 h-10 text-indigo-600" />
                  ) : (
                    <BookOpen className="w-10 h-10 text-indigo-600" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-sky-400 rounded-full transform rotate-12 shadow-lg"></div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">Welcome to ExamBuilder</h1>
            <p className="text-neutral-600">Build your knowledge. Master your exams.</p>
            <p className="text-sm text-indigo-600 font-semibold mt-1">exambuilder.net</p>
          </div>

          {/* Auth Method Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setUsePassword(false)}
              className={`flex-1 py-3 px-4 rounded-2xl font-medium transition-all duration-200 ${
                !usePassword
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Magic Link
            </button>
            <button
              type="button"
              onClick={() => setUsePassword(true)}
              className={`flex-1 py-3 px-4 rounded-2xl font-medium transition-all duration-200 ${
                usePassword
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              Password
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={usePassword ? handlePasswordLogin : handleMagicLinkLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
              />
            </div>

            {usePassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200"
                />
              </div>
            )}

            {/* Message Alert */}
            {message && (
              <div
                className={`p-4 rounded-xl flex items-start gap-3 border-2 ${
                  message.type === 'success'
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm font-medium ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {usePassword ? 'Signing in...' : 'Sending...'}
                </span>
              ) : (
                usePassword ? 'Sign In' : 'Send Magic Link'
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 pt-6 border-t-2 border-neutral-100">
            <p className="text-sm text-neutral-600 text-center">
              {usePassword
                ? 'Use password authentication for quick testing'
                : "We'll send you a magic link to sign in without a password"}
            </p>
          </div>
        </div>

        {/* Sign Up Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-700 bg-white rounded-2xl border-2 border-neutral-200 px-6 py-4 shadow-sm">
            Don&apos;t have an account? Sign in with your email to create one automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
