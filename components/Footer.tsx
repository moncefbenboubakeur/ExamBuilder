'use client';

import { usePathname } from 'next/navigation';
import { BookOpen, Github, Mail, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (pathname === '/login') {
    return null;
  }

  return (
    <footer className="bg-white border-t-2 border-neutral-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <BookOpen className="w-7 h-7 text-indigo-600" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-sky-400 rounded transform rotate-12 shadow-sm"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-neutral-900 leading-tight">
                  ExamBuilder
                </span>
                <span className="text-xs text-indigo-600 font-semibold leading-tight">
                  .net
                </span>
              </div>
            </div>
            <p className="text-sm text-neutral-600 max-w-xs">
              Build your knowledge, construct success. Master your exams with intelligent practice tools.
            </p>
            <div className="pt-2">
              <a
                href="https://exambuilder.net"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                www.exambuilder.net
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => window.location.href = '/'}
                  className="text-neutral-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="text-neutral-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => window.location.href = '/builder'}
                  className="text-neutral-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Builder
                </button>
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-indigo-100 hover:text-indigo-600 transition-all duration-200"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@exambuilder.net"
                className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-indigo-100 hover:text-indigo-600 transition-all duration-200"
                title="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t-2 border-neutral-100">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-neutral-600">
            <p className="font-medium">
              © {currentYear} ExamBuilder.net. All rights reserved.
            </p>
            <p className="flex items-center gap-1.5 font-medium">
              Built with <Heart className="w-4 h-4 text-red-500 fill-current" /> for ambitious learners
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
