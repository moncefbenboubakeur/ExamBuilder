'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Save, User, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface TopbarProps {
  onSave?: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function Topbar({
  onSave,
  isSaving = false,
  lastSaved,
  onMenuToggle,
  isMobileMenuOpen = false,
}: TopbarProps) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);

    if (diff < 60) return 'Saved just now';
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`;
    return `Saved ${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Left: Logo + Mobile Menu Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-neutral-700" />
            ) : (
              <Menu className="w-5 h-5 text-neutral-700" />
            )}
          </button>

          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-sky-400 rounded transform rotate-12 shadow-sm"></div>
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-none">
                ExamBuilder
              </h1>
              <span className="text-xs text-indigo-600 font-semibold">.net</span>
            </div>
            <div className="sm:hidden">
              <span className="text-lg font-bold text-neutral-900">ExamBuilder</span>
            </div>
          </button>
        </div>

        {/* Right: Save Button + User Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Save Button - Only show if onSave is provided */}
          {onSave && (
            <div className="flex items-center gap-2">
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">
                  {isSaving ? 'Saving...' : 'Save'}
                </span>
              </button>
              {lastSaved && (
                <span className="hidden md:inline text-xs text-neutral-500">
                  {formatLastSaved()}
                </span>
              )}
            </div>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
              aria-label="User menu"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-neutral-700 max-w-[150px] truncate">
                {userEmail}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {userEmail}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/dashboard');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
