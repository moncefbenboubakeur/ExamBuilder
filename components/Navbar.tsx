'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BookOpen, Home, History, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Don't show navbar on login page
  if (pathname === '/login') {
    return null;
  }

  // Don't show navbar if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            <div className="relative">
              <BookOpen className="w-8 h-8 text-emerald-600" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-500 rounded-sm transform rotate-12"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 leading-tight">ExamBuilder</span>
              <span className="text-[10px] text-emerald-600 font-medium leading-tight">.net</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-300">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4" />
                <span className="hidden md:inline max-w-[150px] truncate">
                  {user.email}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors"
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
