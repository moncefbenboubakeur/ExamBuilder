'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, Home, History, LogOut, User, Moon, Sun } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useTheme } from '@/components/ThemeProvider';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (pathname === '/login' || !user) {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b-2 border-neutral-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-sky-400 rounded transform rotate-12 shadow-sm"></div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white leading-tight">
                ExamBuilder
              </span>
              <span className="text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 font-semibold leading-tight">
                .net
              </span>
            </div>
          </button>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl font-medium transition-all duration-200 ${
                pathname === '/'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl font-medium transition-all duration-200 ${
                pathname === '/dashboard'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-2xl text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User Section */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l-2 border-neutral-200 dark:border-gray-700">
              <div className="hidden md:flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="max-w-[150px] truncate font-medium">
                  {user.email}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 border-2 border-red-200 dark:border-red-700 rounded-2xl font-medium hover:bg-red-100 dark:hover:bg-red-800 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
