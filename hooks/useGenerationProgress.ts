'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Progress data structure from backend
 */
export interface GenerationProgress {
  step: 'validating' | 'detecting_topics' | 'generating_lessons' | 'complete' | 'error';
  progress: number; // 0-100
  currentTask?: string;
  estimatedTimeRemaining?: number;
  error?: string;
  metadata?: {
    totalLessons?: number;
    completedLessons?: number;
    currentLesson?: string;
  };
}

/**
 * Configuration for different data fetching strategies
 */
export type ProgressFetchStrategy = 'polling' | 'sse' | 'websocket';

interface UseGenerationProgressOptions {
  examId: string;
  fetchStrategy?: ProgressFetchStrategy;
  pollingInterval?: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
}

interface UseGenerationProgressReturn {
  progress: GenerationProgress | null;
  isGenerating: boolean;
  error: string | null;
  startGeneration: (force?: boolean) => Promise<void>;
  cancelGeneration: () => void;
  retryGeneration: () => Promise<void>;
}

/**
 * Custom hook for managing course generation progress
 * Handles the complete lifecycle: trigger generation -> track progress -> handle completion
 */
export function useGenerationProgress({
  examId,
  fetchStrategy = 'polling',
  pollingInterval = 2000,
  onComplete,
  onError,
  autoStart = false
}: UseGenerationProgressOptions): UseGenerationProgressReturn {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  /**
   * Cleanup all active connections
   */
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  /**
   * Handle progress updates
   */
  const handleProgressUpdate = useCallback((data: GenerationProgress) => {
    setProgress(data);

    if (data.step === 'complete') {
      setIsGenerating(false);
      cleanup();
      onComplete?.();
    } else if (data.step === 'error' || data.error) {
      setIsGenerating(false);
      setError(data.error || 'Course generation failed');
      cleanup();
      onError?.(data.error || 'Course generation failed');
    }
  }, [cleanup, onComplete, onError]);

  /**
   * Polling implementation
   */
  const pollProgress = useCallback(async () => {
    if (!isGenerating) return;

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch(`/api/generate-course/progress/${examId}`, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenerationProgress = await response.json();
      handleProgressUpdate(data);

      // Continue polling if not complete or error
      if (data.step !== 'complete' && data.step !== 'error' && !data.error) {
        pollingTimerRef.current = setTimeout(pollProgress, pollingInterval);
      }

      retryCountRef.current = 0; // Reset retry count on success
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Cancelled, don't retry
      }

      // Retry logic
      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        pollingTimerRef.current = setTimeout(pollProgress, pollingInterval * 2);
      } else {
        setError('Network error: Failed to fetch progress');
        setIsGenerating(false);
        cleanup();
        onError?.('Network error: Failed to fetch progress');
      }
    }
  }, [examId, isGenerating, pollingInterval, handleProgressUpdate, cleanup, onError]);

  /**
   * Server-Sent Events implementation
   */
  const setupSSE = useCallback(() => {
    const eventSource = new EventSource(`/api/generate-course/progress/${examId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data: GenerationProgress = JSON.parse(event.data);
      handleProgressUpdate(data);
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);

      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(() => {
          eventSource.close();
          setupSSE();
        }, 2000);
      } else {
        setError('Connection lost: Failed to receive progress updates');
        setIsGenerating(false);
        cleanup();
        onError?.('Connection lost: Failed to receive progress updates');
      }
    };
  }, [examId, handleProgressUpdate, cleanup, onError]);

  /**
   * WebSocket implementation
   */
  const setupWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/generate-course/progress/${examId}/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data: GenerationProgress = JSON.parse(event.data);
      handleProgressUpdate(data);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);

      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(() => {
          ws.close();
          setupWebSocket();
        }, 2000);
      } else {
        setError('Connection error: Failed to establish WebSocket');
        setIsGenerating(false);
        cleanup();
        onError?.('Connection error: Failed to establish WebSocket');
      }
    };
  }, [examId, handleProgressUpdate, cleanup, onError]);

  /**
   * Start progress tracking based on strategy
   */
  const startTracking = useCallback(() => {
    retryCountRef.current = 0;

    if (fetchStrategy === 'polling') {
      pollProgress();
    } else if (fetchStrategy === 'sse') {
      setupSSE();
    } else if (fetchStrategy === 'websocket') {
      setupWebSocket();
    }
  }, [fetchStrategy, pollProgress, setupSSE, setupWebSocket]);

  /**
   * Trigger course generation
   */
  const startGeneration = useCallback(async (force = false) => {
    try {
      setIsGenerating(true);
      setError(null);
      setProgress(null);

      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: examId, force })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start course generation');
      }

      // Start tracking progress
      startTracking();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start generation';
      setError(errorMessage);
      setIsGenerating(false);
      onError?.(errorMessage);
    }
  }, [examId, startTracking, onError]);

  /**
   * Cancel generation
   */
  const cancelGeneration = useCallback(() => {
    setIsGenerating(false);
    cleanup();
    setProgress(null);
  }, [cleanup]);

  /**
   * Retry generation after error
   */
  const retryGeneration = useCallback(async () => {
    retryCountRef.current = 0;
    await startGeneration();
  }, [startGeneration]);

  /**
   * Auto-start if enabled
   */
  useEffect(() => {
    if (autoStart) {
      startGeneration();
    }
  }, [autoStart]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    progress,
    isGenerating,
    error,
    startGeneration,
    cancelGeneration,
    retryGeneration
  };
}
