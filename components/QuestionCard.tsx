'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/lib/supabaseClient';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  selectedAnswer?: string;
  selectedAnswers?: string[];
  onAnswerSelect: (answer: string) => void;
  showCorrectAnswer?: boolean;
  multipleChoice?: boolean;
}

export default function QuestionCard({
  question,
  questionNumber,
  selectedAnswer,
  selectedAnswers = [],
  onAnswerSelect,
  showCorrectAnswer = false,
  multipleChoice = false,
}: QuestionCardProps) {
  const [revealed, setRevealed] = useState(showCorrectAnswer);

  // Reset revealed state when question changes
  useEffect(() => {
    setRevealed(false);
  }, [question.id]);

  // Get all available options dynamically from the question
  const options = Object.keys(question.options).sort();

  const isCorrect = (option: string) => {
    const correctAnswers = question.correct_answer.toUpperCase().split(',').map(a => a.trim());
    return correctAnswers.includes(option.toUpperCase());
  };

  const getOptionClassName = (option: string) => {
    const isSelected = multipleChoice
      ? selectedAnswers.includes(option)
      : selectedAnswer === option;
    const isCorrectOption = isCorrect(option);

    if (revealed) {
      if (isCorrectOption) {
        return 'border-green-600 bg-green-50 text-green-950 font-medium';
      }
      if (isSelected && !isCorrectOption) {
        return 'border-red-600 bg-red-50 text-red-950 font-medium';
      }
      return 'border-gray-300 bg-white text-gray-800';
    } else if (isSelected) {
      return 'border-blue-600 bg-blue-50 text-blue-950 font-medium';
    }

    return 'border-gray-300 bg-white text-gray-900 hover:border-blue-400 hover:bg-blue-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-500">
              Question {questionNumber}
            </h3>
            {multipleChoice && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                Multiple Choice
              </span>
            )}
          </div>
          {question.has_illustration && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              Has Illustration
            </span>
          )}
        </div>
        <p className="text-xl font-semibold text-gray-950 leading-relaxed">
          {question.question_text}
        </p>
        {multipleChoice && (
          <p className="text-sm text-gray-600 mt-2 italic">
            Select all answers that apply
          </p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => !revealed && onAnswerSelect(option)}
            disabled={revealed}
            className={cn(
              'w-full text-left p-4 border-2 rounded-lg transition-all duration-200',
              getOptionClassName(option),
              revealed ? 'cursor-default' : 'cursor-pointer'
            )}
          >
            <div className="flex items-start gap-3">
              <span className="font-bold min-w-[24px]">{option}.</span>
              <span className="flex-1">
                {question.options[option]}
              </span>
              {revealed && isCorrect(option) && (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
              {revealed && (multipleChoice ? selectedAnswers.includes(option) : selectedAnswer === option) && !isCorrect(option) && (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={() => setRevealed(!revealed)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          {revealed ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Answer
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show Answer
            </>
          )}
        </button>

        {revealed && question.community_vote && (
          <div className="text-sm text-gray-700">
            Community Vote: <span className="font-semibold text-gray-900">{question.community_vote}</span>
          </div>
        )}
      </div>
    </div>
  );
}
