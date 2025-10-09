'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  isVisible?: boolean;
}

export default function Toast({
  message,
  type = 'success',
  duration = 3000,
  onClose,
  isVisible = true,
}: ToastProps) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-900',
      iconColor: 'text-green-600',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-900',
      iconColor: 'text-red-600',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-900',
      iconColor: 'text-blue-600',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-900',
      iconColor: 'text-yellow-600',
    },
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 shadow-lg',
        bgColor,
        borderColor,
        'animate-slideIn'
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', iconColor)} />
      <p className={cn('flex-1 text-sm font-medium', textColor)}>{message}</p>
      <button
        onClick={() => {
          setShow(false);
          onClose?.();
        }}
        className={cn('p-1 rounded-lg hover:bg-white/50 transition-colors', textColor)}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast Container Component for managing multiple toasts
interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

// Custom hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
  };
}
