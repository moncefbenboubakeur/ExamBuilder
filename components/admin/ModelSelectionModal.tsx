'use client';

import { useState, useMemo } from 'react';
import { X, CheckSquare, Square, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import { AIModel, AI_MODELS } from '@/lib/ai-models';
import { cn } from '@/lib/utils';
import { ModelSelectionOption, calculateAnalysisCost } from '@/lib/types/multi-llm';

interface ModelSelectionModalProps {
  examName: string;
  questionCount: number;
  onClose: () => void;
  onAnalyze: (selectedModels: string[]) => Promise<void>;
}

export default function ModelSelectionModal({
  examName,
  questionCount,
  onClose,
  onAnalyze
}: ModelSelectionModalProps) {
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group models by provider
  const modelsByProvider = useMemo(() => {
    const grouped: Record<string, AIModel[]> = {
      openai: [],
      anthropic: [],
      google: []
    };

    AI_MODELS.forEach(model => {
      if (grouped[model.provider]) {
        grouped[model.provider].push(model);
      }
    });

    return grouped;
  }, []);

  // Convert to ModelSelectionOption format
  const modelOptions: ModelSelectionOption[] = useMemo(() => {
    return AI_MODELS.map(model => ({
      modelId: model.id,
      modelName: model.name,
      provider: model.provider as 'openai' | 'anthropic' | 'google',
      costPerMillion: model.combinedPrice,
      selected: selectedModels.has(model.id),
      available: true,
      tier: model.tier as 'flagship' | 'standard' | 'fast'
    }));
  }, [selectedModels]);

  // Calculate estimated cost
  const estimatedCost = useMemo(() => {
    return calculateAnalysisCost(modelOptions, questionCount);
  }, [modelOptions, questionCount]);

  // Calculate estimated time (rough estimate: 1 second per question per model)
  const estimatedTimeMinutes = useMemo(() => {
    const selectedCount = selectedModels.size;
    const totalSeconds = (questionCount * selectedCount) / 3; // Assume parallel processing
    return Math.ceil(totalSeconds / 60);
  }, [selectedModels.size, questionCount]);

  const handleSelectAll = () => {
    if (selectedModels.size === AI_MODELS.length) {
      setSelectedModels(new Set());
    } else {
      setSelectedModels(new Set(AI_MODELS.map(m => m.id)));
    }
  };

  const handleToggleModel = (modelId: string) => {
    const newSelected = new Set(selectedModels);
    if (newSelected.has(modelId)) {
      newSelected.delete(modelId);
    } else {
      newSelected.add(modelId);
    }
    setSelectedModels(newSelected);
  };

  const handleSelectProvider = (provider: string) => {
    const providerModels = modelsByProvider[provider];
    const allProviderSelected = providerModels.every(m => selectedModels.has(m.id));

    const newSelected = new Set(selectedModels);
    providerModels.forEach(model => {
      if (allProviderSelected) {
        newSelected.delete(model.id);
      } else {
        newSelected.add(model.id);
      }
    });
    setSelectedModels(newSelected);
  };

  const handleStartAnalysis = async () => {
    if (selectedModels.size === 0) {
      setError('Please select at least one model');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      await onAnalyze(Array.from(selectedModels));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setAnalyzing(false);
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'text-green-600 dark:text-green-400';
      case 'anthropic': return 'text-purple-600 dark:text-purple-400';
      case 'google': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold dark:text-white">Select AI Models for Analysis</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Analyzing &ldquo;{examName}&rdquo; ({questionCount} questions)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Select All */}
          <div className="mb-6">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {selectedModels.size === AI_MODELS.length ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-medium dark:text-white">
                {selectedModels.size === AI_MODELS.length ? 'Deselect All' : 'Select All'}
              </span>
            </button>
          </div>

          {/* Models by Provider */}
          {Object.entries(modelsByProvider).map(([provider, models]) => (
            <div key={provider} className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className={cn("text-lg font-bold capitalize", getProviderColor(provider))}>
                  {provider} Models
                </h3>
                <button
                  onClick={() => handleSelectProvider(provider)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Toggle All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {models.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => handleToggleModel(model.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      selectedModels.has(model.id)
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {selectedModels.has(model.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 mt-0.5" />
                        )}
                        <div>
                          <h4 className="font-semibold dark:text-white">{model.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {model.tier} tier
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          ${model.combinedPrice}/M
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          tokens
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Models selected: <span className="font-semibold">{selectedModels.size}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estimated time: <span className="font-semibold">~{estimatedTimeMinutes} minutes</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Estimated cost</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
                <DollarSign className="w-5 h-5" />
                {estimatedCost.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={analyzing}
              className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleStartAnalysis}
              disabled={selectedModels.size === 0 || analyzing}
              className={cn(
                "px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2",
                selectedModels.size > 0 && !analyzing
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting Analysis...
                </>
              ) : (
                <>Start Analysis</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}