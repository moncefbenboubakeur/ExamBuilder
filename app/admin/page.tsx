'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AI_MODELS, AIModel } from '@/lib/ai-models';
import { Shield, Bot, Check, DollarSign, Zap, AlertCircle, RefreshCw, Sparkles, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import TestModelModal from '@/components/TestModelModal';

export const dynamic = 'force-dynamic';

interface AISettings {
  id: string;
  provider: string;
  model_id: string;
  model_name: string;
  input_price_per_million: number;
  output_price_per_million: number;
  updated_at?: string;
  updated_by?: string;
}

interface UserData {
  email?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSettings, setCurrentSettings] = useState<AISettings | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [exams, setExams] = useState<Array<{ id: string; name: string; question_count: number }>>([]);
  const [reanalyzing, setReanalyzing] = useState<string | null>(null);
  const [testingModel, setTestingModel] = useState<AIModel | null>(null);

  useEffect(() => {
    checkAuth();
    fetchCurrentSettings();
    fetchExams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setUser(user);
    const adminCheck = user.email === 'monceftab@gmail.com';
    setIsAdmin(adminCheck);
    setLoading(false);

    if (!adminCheck) {
      // Redirect non-admin users
      router.push('/');
    }
  }

  async function fetchCurrentSettings() {
    try {
      const response = await fetch('/api/admin/ai-settings');
      const data = await response.json();
      if (data.success) {
        setCurrentSettings(data.settings);
        // Find matching model
        const model = AI_MODELS.find(m => m.id === data.settings.model_id);
        if (model) {
          setSelectedModel(model);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  }

  async function fetchExams() {
    try {
      const response = await fetch('/api/exams');
      const data = await response.json();
      if (data.success && data.exams) {
        setExams(data.exams);
      } else {
        console.error('Failed to fetch exams:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    }
  }

  async function handleReanalyzeExam(examId: string) {
    console.log('🔍 Starting re-analysis for exam:', examId);
    setReanalyzing(examId);
    setMessage(null);

    try {
      console.log('📡 Sending request to /api/admin/reanalyze-exam');
      const response = await fetch('/api/admin/reanalyze-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId }),
      });

      console.log('📨 Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);

      if (data.success) {
        setMessage({
          type: 'success',
          text: `${data.message}. Analyzed: ${data.analyzed}, Failed: ${data.failed}`
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to analyze exam' });
      }
    } catch (error) {
      console.error('❌ Reanalyze error:', error);
      setMessage({ type: 'error', text: `Failed: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setReanalyzing(null);
    }
  }

  async function handleSaveSettings() {
    if (!selectedModel) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedModel.provider,
          model_id: selectedModel.id,
          model_name: selectedModel.name,
          input_price_per_million: selectedModel.inputPricePerMillion,
          output_price_per_million: selectedModel.outputPricePerMillion,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSettings(data.settings);
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update settings' });
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-2 dark:text-white">Access Denied</h2>
          <p className="text-neutral-600 dark:text-gray-400 text-center">
            This page is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  const openaiModels = AI_MODELS.filter(m => m.provider === 'openai');
  const anthropicModels = AI_MODELS.filter(m => m.provider === 'anthropic');
  const googleModels = AI_MODELS.filter(m => m.provider === 'google');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border-2 border-indigo-200 dark:border-indigo-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Admin Console</h1>
            </div>
            <a
              href="/admin/exam-management"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Manage Exams
            </a>
          </div>
          <p className="text-neutral-600 dark:text-gray-400">
            Logged in as: <span className="font-semibold">{user?.email}</span>
          </p>
        </div>

        {/* Current Settings */}
        {currentSettings && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-6 border-2 border-indigo-200 dark:border-indigo-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
              <Bot className="w-5 h-5" />
              Current AI Model
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-indigo-200 dark:border-indigo-700">
                <p className="text-sm text-neutral-600 dark:text-gray-400 mb-1">Model</p>
                <p className="font-bold text-lg dark:text-white">{currentSettings.model_name}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-indigo-200 dark:border-indigo-700">
                <p className="text-sm text-neutral-600 dark:text-gray-400 mb-1">Provider</p>
                <p className="font-bold text-lg capitalize dark:text-white">{currentSettings.provider}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-indigo-200 dark:border-indigo-700">
                <p className="text-sm text-neutral-600 dark:text-gray-400 mb-1">Combined Price</p>
                <p className="font-bold text-lg dark:text-white">
                  ${(currentSettings.input_price_per_million + currentSettings.output_price_per_million).toFixed(2)}/M tokens
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={cn(
            "rounded-2xl p-4 mb-6 border-2",
            message.type === 'success'
              ? "bg-green-50 border-green-300 text-green-900"
              : "bg-red-50 border-red-300 text-red-900"
          )}>
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        )}

        {/* Model Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-neutral-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-6 dark:text-white">Select AI Model</h2>

          {/* OpenAI Models */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-green-600">OpenAI Models</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openaiModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModel?.id === model.id}
                  onSelect={() => setSelectedModel(model)}
                  onTest={() => setTestingModel(model)}
                />
              ))}
            </div>
          </div>

          {/* Anthropic Models */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-purple-600">Anthropic Models</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {anthropicModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModel?.id === model.id}
                  onSelect={() => setSelectedModel(model)}
                  onTest={() => setTestingModel(model)}
                />
              ))}
            </div>
          </div>

          {/* Google Models */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-blue-600">Google Models</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {googleModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedModel?.id === model.id}
                  onSelect={() => setSelectedModel(model)}
                  onTest={() => setTestingModel(model)}
                />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={!selectedModel || saving || selectedModel?.id === currentSettings?.model_id}
              className={cn(
                "px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center gap-2",
                selectedModel && selectedModel.id !== currentSettings?.model_id && !saving
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl"
                  : "bg-neutral-300 text-neutral-500 cursor-not-allowed"
              )}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>

        {/* Re-analyze Existing Exams Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-6 border-2 border-neutral-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 dark:text-white">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Re-analyze Existing Exams
          </h2>
          <p className="text-neutral-600 dark:text-gray-400 mb-6">
            Trigger AI analysis for exams that were uploaded before the AI feature was implemented.
          </p>

          {exams.length > 0 ? (
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 border-2 border-neutral-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-lg dark:text-white">{exam.name}</h3>
                    <p className="text-sm text-neutral-600 dark:text-gray-400">
                      {exam.question_count || 0} questions
                    </p>
                  </div>
                  <button
                    onClick={() => handleReanalyzeExam(exam.id)}
                    disabled={reanalyzing === exam.id}
                    className={cn(
                      "px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
                      reanalyzing === exam.id
                        ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                        : "bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg"
                    )}
                  >
                    {reanalyzing === exam.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Analyze with AI
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 dark:text-gray-500 italic">No exams found.</p>
          )}
        </div>
      </div>

      {/* Test Model Modal */}
      {testingModel && (
        <TestModelModal
          model={testingModel}
          onClose={() => setTestingModel(null)}
        />
      )}
    </div>
  );
}

function ModelCard({ model, isSelected, onSelect, onTest }: {
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
  onTest: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-4 rounded-xl border-2 transition-all duration-200 relative cursor-pointer",
        isSelected
          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg"
          : "border-neutral-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md"
      )}
    >
      <div className="w-full">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-bold text-lg dark:text-white">{model.name}</h4>
            <p className="text-sm text-neutral-600 dark:text-gray-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {model.tier}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTest();
              }}
              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-gray-600 hover:bg-indigo-100 dark:hover:bg-indigo-700 transition-colors group"
              title="Test this model"
            >
              <FlaskConical className="w-4 h-4 text-neutral-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </button>
            {isSelected && (
              <div className="bg-indigo-600 rounded-full p-1">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-gray-400">Input:</span>
            <span className="font-semibold dark:text-white">${model.inputPricePerMillion}/M</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-gray-400">Output:</span>
            <span className="font-semibold dark:text-white">${model.outputPricePerMillion}/M</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-neutral-200 dark:border-gray-600">
            <span className="text-neutral-600 dark:text-gray-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Total:
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">${model.combinedPrice}/M</span>
          </div>
        </div>
      </div>
    </div>
  );
}
