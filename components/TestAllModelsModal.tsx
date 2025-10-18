'use client';

import React, { useState, useEffect } from 'react';
import { AIModel } from '@/lib/ai-models';
import { X, CheckCircle, XCircle, Loader2, Play } from 'lucide-react';

interface TestResult {
  modelId: string;
  modelName: string;
  provider: string;
  status: 'pending' | 'testing' | 'success' | 'failed';
  questions?: Array<{ question: string; response: string }>;
  error?: string;
  duration?: number;
}

interface TestAllModelsModalProps {
  models: AIModel[];
  onClose: () => void;
}

export default function TestAllModelsModal({ models, onClose }: TestAllModelsModalProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize results
  useEffect(() => {
    const initialResults: TestResult[] = models.map(model => ({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider,
      status: 'pending'
    }));
    setResults(initialResults);
  }, [models]);

  const testModel = async (model: AIModel): Promise<Omit<TestResult, 'modelId' | 'modelName' | 'provider'>> => {
    try {
      const response = await fetch('/api/test-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: model.provider,
          model_id: model.id,
          model_name: model.name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          status: 'success',
          questions: data.questions,
          duration: data.duration_ms
        };
      } else {
        return {
          status: 'failed',
          error: data.error || 'Unknown error',
          duration: data.duration_ms
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to test model'
      };
    }
  };

  const startTesting = async () => {
    setIsRunning(true);

    for (let i = 0; i < models.length; i++) {
      setCurrentIndex(i);

      // Update status to testing
      setResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'testing' } : r
      ));

      // Test the model
      const result = await testModel(models[i]);

      // Update with result
      setResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, ...result } : r
      ));
    }

    setCurrentIndex(-1);
    setIsRunning(false);
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const completedCount = successCount + failedCount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Test All Models</h2>
            <p className="text-sm text-neutral-600 dark:text-gray-400 mt-1">
              {isRunning
                ? `Testing ${currentIndex + 1} of ${models.length}...`
                : completedCount > 0
                ? `Completed: ${completedCount}/${models.length} | Success: ${successCount} | Failed: ${failedCount}`
                : `${models.length} models ready to test`
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={isRunning}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {results.map((result) => (
            <div
              key={result.modelId}
              className={`p-4 rounded-xl border-2 transition-all ${
                result.status === 'testing'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : result.status === 'success'
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                  : result.status === 'failed'
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                  : 'border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {result.status === 'testing' && (
                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                    )}
                    {result.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {result.status === 'failed' && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {result.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-gray-600" />
                    )}
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{result.modelName}</h3>
                      <p className="text-sm text-neutral-600 dark:text-gray-400">
                        {result.provider} • {result.modelId}
                      </p>
                    </div>
                  </div>

                  {result.status === 'success' && result.questions && (
                    <div className="mt-2 space-y-2">
                      {result.questions.map((qa, idx) => (
                        <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-xs text-neutral-500 dark:text-gray-500 mb-1 font-semibold">Q{idx + 1}: {qa.question}</p>
                          <p className="text-sm text-neutral-700 dark:text-gray-300">{qa.response}</p>
                        </div>
                      ))}
                      {result.duration && (
                        <p className="text-xs text-neutral-500 dark:text-gray-500">
                          Total response time: {result.duration}ms
                        </p>
                      )}
                    </div>
                  )}

                  {result.status === 'failed' && result.error && (
                    <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-400">{result.error}</p>
                      {result.duration && (
                        <p className="text-xs text-neutral-500 dark:text-gray-500 mt-1">
                          Failed after: {result.duration}ms
                        </p>
                      )}
                    </div>
                  )}

                  {result.status === 'testing' && (
                    <div className="mt-2">
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">Testing in progress...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-gray-700 bg-neutral-50 dark:bg-gray-900/50">
          <div className="text-sm text-neutral-600 dark:text-gray-400">
            {isRunning && (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Testing in progress...</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isRunning}
              className="px-6 py-3 rounded-xl font-medium text-neutral-700 dark:text-gray-300 bg-neutral-200 dark:bg-gray-700 hover:bg-neutral-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Close
            </button>
            <button
              onClick={startTesting}
              disabled={isRunning}
              className="px-6 py-3 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Testing
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
