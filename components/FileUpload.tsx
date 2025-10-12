'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Hash } from 'lucide-react';
import { countQuestions } from '@/lib/parseMarkdown';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const processFile = async (selectedFile: File) => {
    if (selectedFile.name.endsWith('.md')) {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
      setScanning(true);
      setQuestionCount(null);

      // Read file content and count questions
      try {
        const content = await selectedFile.text();
        const count = countQuestions(content);
        setQuestionCount(count);
      } catch (err) {
        console.error('Error scanning file:', err);
        setQuestionCount(null);
      } finally {
        setScanning(false);
      }
    } else {
      setError('Please select a .md (Markdown) file');
      setFile(null);
      setQuestionCount(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(true);
      setFile(null);
      setQuestionCount(null);

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="mb-4">
          <label
            htmlFor="file-upload"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-2 text-gray-400 dark:text-gray-500" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Markdown (.md) files only</p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".md"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {file && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-900 dark:text-blue-300 flex-1 truncate font-medium">{file.name}</span>
            </div>
            {scanning ? (
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                <div className="w-3 h-3 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Scanning questions...</span>
              </div>
            ) : questionCount !== null ? (
              <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                <Hash className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  {questionCount} {questionCount === 1 ? 'question' : 'questions'} found
                </span>
              </div>
            ) : null}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-900 dark:text-red-300">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-900 dark:text-green-300">Questions uploaded successfully!</span>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-2 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {uploading ? 'Uploading...' : 'Upload Questions'}
        </button>
      </div>
    </div>
  );
}
