'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

/**
 * Floating Action Button (FAB) - Mobile-first quick action button
 * Appears in bottom-right corner for easy thumb access on mobile devices
 */
export default function FloatingActionButton({
  onClick,
  label = 'Add',
  className,
}: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-30',
        'flex items-center gap-2',
        'px-5 py-4 sm:px-6 sm:py-5',
        'bg-indigo-600 text-white',
        'rounded-full',
        'shadow-lg hover:shadow-xl',
        'hover:bg-indigo-700',
        'transition-all duration-200',
        'group',
        className
      )}
      aria-label={label}
    >
      <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
      <span className="hidden sm:inline font-medium">{label}</span>
    </button>
  );
}
