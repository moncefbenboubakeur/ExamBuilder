import { Question } from './supabaseClient';

export interface ExamState {
  sessionId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, string>; // questionId -> selectedAnswer
  showAnswer: boolean;
}

export interface ExamResults {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  score: number;
  wrongQuestionIds: string[];
}

/**
 * Calculate exam results from answers
 */
export function calculateResults(
  questions: Question[],
  answers: Map<string, string>
): ExamResults {
  let correctCount = 0;
  let wrongCount = 0;
  const wrongQuestionIds: string[] = [];

  questions.forEach((question) => {
    const selectedAnswer = answers.get(question.id);
    if (selectedAnswer) {
      if (selectedAnswer.toUpperCase() === question.correct_answer.toUpperCase()) {
        correctCount++;
      } else {
        wrongCount++;
        wrongQuestionIds.push(question.id);
      }
    }
  });

  const totalQuestions = questions.length;
  const score = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  return {
    totalQuestions,
    correctCount,
    wrongCount,
    score,
    wrongQuestionIds,
  };
}

/**
 * Get questions for retry (all or wrong only)
 */
export function getRetryQuestions(
  allQuestions: Question[],
  wrongQuestionIds: string[],
  retryAll: boolean
): Question[] {
  if (retryAll) {
    return allQuestions;
  }

  return allQuestions.filter((q) => wrongQuestionIds.includes(q.id));
}

/**
 * Check if answer is correct
 * Handles both single answers and multiple choice (comma-separated)
 */
export function isAnswerCorrect(
  question: Question,
  selectedAnswer: string
): boolean {
  const correctAnswer = question.correct_answer.toUpperCase().trim();
  const userAnswer = selectedAnswer.toUpperCase().trim();

  // Handle multiple choice answers (sort before comparing)
  if (correctAnswer.includes(',') || userAnswer.includes(',')) {
    const correctSet = correctAnswer.split(',').map(a => a.trim()).sort().join(',');
    const userSet = userAnswer.split(',').map(a => a.trim()).sort().join(',');
    return correctSet === userSet;
  }

  return userAnswer === correctAnswer;
}

/**
 * Get progress percentage
 */
export function getProgressPercentage(
  currentIndex: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return Math.round(((currentIndex + 1) / totalQuestions) * 100);
}

/**
 * Get answered count
 */
export function getAnsweredCount(answers: Map<string, string>): number {
  return answers.size;
}

/**
 * Check if exam is complete (all questions answered)
 */
export function isExamComplete(
  totalQuestions: number,
  answers: Map<string, string>
): boolean {
  return answers.size === totalQuestions;
}

/**
 * Format score as grade
 */
export function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get performance message based on score
 */
export function getPerformanceMessage(score: number): string {
  if (score >= 90) return 'Excellent work! 🎉';
  if (score >= 80) return 'Great job! 👏';
  if (score >= 70) return 'Good effort! 👍';
  if (score >= 60) return 'You passed! Keep practicing.';
  return 'Keep studying and try again! 📚';
}
