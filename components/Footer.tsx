'use client';

import { usePathname } from 'next/navigation';
import { BookOpen, Github, Mail, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Don't show footer on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <footer className="bg-gradient-to-br from-slate-50 to-slate-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-sm transform rotate-12"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900 leading-tight">ExamBuilder</span>
                <span className="text-[9px] text-emerald-600 font-medium leading-tight">.net</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Build your knowledge, construct success. Master your exams with intelligent practice tools.
            </p>
            <div className="pt-2">
              <a
                href="https://exambuilder.net"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                www.exambuilder.net
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => window.location.href = '/'} className="text-gray-600 hover:text-blue-600 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <a href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                  About
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-600 transition-colors"
                title="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@example.com"
                className="text-gray-600 hover:text-blue-600 transition-colors"
                title="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600">
            <p>
              © {currentYear} ExamBuilder.net. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Built with <Heart className="w-4 h-4 text-emerald-500 fill-current" /> for ambitious learners
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
