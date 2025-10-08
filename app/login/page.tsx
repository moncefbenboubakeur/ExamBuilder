'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, CheckCircle, AlertCircle, Key } from 'lucide-react';

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

    console.log('🔐 Magic Link Login Attempt');
    console.log('📧 Email:', email);
    console.log('🌐 Origin:', window.location.origin);
    console.log('🔗 Redirect URL:', `${window.location.origin}/auth/callback`);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('❌ Magic Link Error:', error);
        console.error('  Error name:', error.name);
        console.error('  Error message:', error.message);
        console.error('  Error status:', 'status' in error ? (error as { status?: number }).status : 'unknown');
        throw error;
      }

      console.log('✅ Magic link sent successfully');
      setMessage({
        type: 'success',
        text: 'Check your email for the magic link to sign in!',
      });
      setEmail('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send magic link';
      console.error('💥 Magic Link Exception:', error);
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

    console.log('🔐 Password Login Attempt');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password.length);
    console.log('🌍 Environment Variables:');
    console.log('  SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('  SUPABASE_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Password Login Error:', error);
        console.error('  Error name:', error.name);
        console.error('  Error message:', error.message);
        console.error('  Error status:', 'status' in error ? (error as { status?: number }).status : 'unknown');
        throw error;
      }

      console.log('✅ Login successful!');
      console.log('👤 User:', data.user?.email);
      console.log('🎫 Session exists:', !!data.session);

      if (data.session) {
        setMessage({
          type: 'success',
          text: 'Successfully logged in! Redirecting...',
        });
        // Give time for cookies to be set before redirecting
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      console.error('💥 Password Login Exception:', error);
      setMessage({
        type: 'error',
        text: errorMessage,
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-2xl p-8 border border-emerald-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center gap-2 mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  {usePassword ? <Key className="w-8 h-8 text-emerald-600" /> : <Mail className="w-8 h-8 text-emerald-600" />}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded transform rotate-12 shadow-lg"></div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to ExamBuilder</h1>
            <p className="text-gray-600">Build your knowledge. Master your exams.</p>
            <p className="text-sm text-emerald-600 font-medium mt-1">exambuilder.net</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setUsePassword(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                !usePassword
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Magic Link
            </button>
            <button
              type="button"
              onClick={() => setUsePassword(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                usePassword
                  ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              Password
            </button>
          </div>

          <form onSubmit={usePassword ? handlePasswordLogin : handleMagicLinkLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>

            {usePassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                />
              </div>
            )}

            {message && (
              <div
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-emerald-200"
            >
              {loading ? (usePassword ? 'Signing in...' : 'Sending Magic Link...') : (usePassword ? 'Sign In' : 'Send Magic Link')}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              {usePassword
                ? 'Use password authentication for quick testing'
                : "We'll send you a magic link to sign in without a password"}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Don&apos;t have an account? Sign in with your email to create one automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
