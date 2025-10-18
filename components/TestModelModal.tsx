'use client';

import React, { useState } from 'react';
import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { AIModel } from '@/lib/ai-models';

interface TestModelModalProps {
  model: AIModel;
  onClose: () => void;
}

interface TestResult {
  success: boolean;
  questions?: Array<{ question: string; response: string }>;
  error?: string;
  duration_ms?: number;
  model_id?: string;
  model_name?: string;
  provider?: string;
}

export default function TestModelModal({ model, onClose }: TestModelModalProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: model.provider,
          model_id: model.id,
          model_name: model.name,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: unknown) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test model',
      });
    } finally {
      setTesting(false);
    }
  };

  // Auto-test when modal opens
  React.useEffect(() => {
    handleTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Test AI Model
            </h2>
            <p className="text-sm text-neutral-600 dark:text-gray-400 mt-1">
              {model.name} ({model.provider})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-neutral-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Model Info */}
          <div className="bg-neutral-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600 dark:text-gray-400">Model ID:</span>
              <span className="text-sm font-mono text-neutral-900 dark:text-white">{model.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600 dark:text-gray-400">Provider:</span>
              <span className="text-sm text-neutral-900 dark:text-white capitalize">{model.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-neutral-600 dark:text-gray-400">Tier:</span>
              <span className="text-sm text-neutral-900 dark:text-white">{model.tier}</span>
            </div>
          </div>

          {/* Testing Status */}
          {testing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <span className="ml-3 text-neutral-600 dark:text-gray-400">Testing model...</span>
            </div>
          )}

          {/* Test Result */}
          {!testing && result && (
            <div className="space-y-4">
              {/* Status */}
              <div className={`flex items-start gap-3 p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${
                    result.success
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {result.success ? 'Model is working correctly!' : 'Model test failed'}
                  </p>
                  {result.duration_ms && (
                    <p className={`text-sm mt-1 ${
                      result.success
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      Response time: {result.duration_ms}ms
                    </p>
                  )}
                </div>
              </div>

              {/* Questions and Responses */}
              {result.success && result.questions && result.questions.map((qa, index) => (
                <div key={index}>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Question {index + 1}:
                  </h3>
                  <div className="bg-neutral-50 dark:bg-gray-700 rounded-lg p-3 mb-2">
                    <p className="text-sm text-neutral-700 dark:text-gray-300 font-mono">
                      {qa.question}
                    </p>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Response {index + 1}:
                  </h3>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 mb-4">
                    <p className="text-sm text-green-900 dark:text-green-100">
                      {qa.response}
                    </p>
                  </div>
                </div>
              ))}

              {/* Error */}
              {!result.success && result.error && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                    Error Details:
                  </h3>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-900 dark:text-red-100 font-mono break-all">
                      {result.error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 dark:border-gray-700">
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test Again'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 dark:bg-gray-700 hover:bg-neutral-300 dark:hover:bg-gray-600 text-neutral-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
