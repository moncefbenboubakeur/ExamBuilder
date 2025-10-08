'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, Pause, Play } from 'lucide-react';

interface ExamTimerProps {
  onTimeUpdate?: (seconds: number) => void;
}

export default function ExamTimer({ onTimeUpdate }: ExamTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  // Update ref when callback changes
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newTime = prev + 1;
        // Call the callback in the next tick to avoid state updates during render
        if (onTimeUpdateRef.current) {
          setTimeout(() => onTimeUpdateRef.current?.(newTime), 0);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg shadow-md px-4 py-2">
      <Clock className="w-5 h-5 text-blue-600" />
      <span className="text-lg font-mono font-semibold text-gray-900 min-w-[80px]">
        {formatTime(elapsedSeconds)}
      </span>
      <button
        onClick={togglePause}
        className={`p-2 rounded-lg transition-colors ${
          isPaused
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
        }`}
        title={isPaused ? 'Resume Timer' : 'Pause Timer'}
      >
        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </button>
      {isPaused && (
        <span className="text-sm text-yellow-700 font-medium">Paused</span>
      )}
    </div>
  );
}
