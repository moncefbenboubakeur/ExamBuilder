'use client';

import { useState } from 'react';
import { X, Share2, Mail, Loader2, Check, Trash2 } from 'lucide-react';

interface ShareExamModalProps {
  examId: string;
  examName: string;
  isOpen: boolean;
  onClose: () => void;
  onShareSuccess?: () => void;
}

interface ShareRecord {
  id: string;
  shared_with: string;
  created_at: string;
}

export default function ShareExamModal({
  examId,
  examName,
  isOpen,
  onClose,
  onShareSuccess,
}: ShareExamModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [loadingShares, setLoadingShares] = useState(false);

  // Load existing shares when modal opens
  const loadShares = async () => {
    setLoadingShares(true);
    try {
      const response = await fetch('/api/share/list');
      const data = await response.json();

      if (data.success) {
        // Filter shares for this specific exam
        const examShares = data.sharesGiven?.filter(
          (share: { exam_id: string }) => share.exam_id === examId
        ) || [];
        setShares(examShares);
      }
    } catch (err) {
      console.error('Error loading shares:', err);
    } finally {
      setLoadingShares(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/share/exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examId,
          targetUserEmail: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to share exam');
      }

      setMessage(data.message);
      setEmail('');

      // Reload shares list
      await loadShares();

      if (onShareSuccess) {
        onShareSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share exam');
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/share/exam?shareId=${shareId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove share');
      }

      // Reload shares list
      await loadShares();

      setMessage('Share removed successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove share');
    }
  };

  // Load shares when modal opens
  if (isOpen && shares.length === 0 && !loadingShares) {
    loadShares();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Share Exam</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Exam Name */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Sharing</p>
            <p className="font-medium text-gray-900">{examName}</p>
          </div>

          {/* Share Form */}
          <form onSubmit={handleShare} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Share with user email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            {/* Messages */}
            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  Share Exam
                </>
              )}
            </button>
          </form>

          {/* Existing Shares */}
          {shares.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Currently shared with
              </h3>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{share.shared_with}</span>
                    </div>
                    <button
                      onClick={() => handleUnshare(share.id)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Remove access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
