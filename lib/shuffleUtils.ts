import { Question } from './supabaseClient';

/**
 * Fisher-Yates shuffle algorithm
 * Creates a randomized copy of the input array without modifying the original
 *
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Create option mapping (original key -> shuffled key)
 * Example: {"A":"D", "B":"A", "C":"C", "D":"B"}
 *
 * @param options - Original options object with letter keys
 * @returns Mapping from original keys to shuffled keys
 */
export function createOptionMapping(
  options: Record<string, string>
): Record<string, string> {
  const keys = Object.keys(options).sort(); // Sort to ensure consistency
  const shuffledKeys = shuffleArray(keys);

  const mapping: Record<string, string> = {};
  keys.forEach((originalKey, index) => {
    mapping[originalKey] = shuffledKeys[index];
  });

  return mapping;
}

/**
 * Apply option mapping to transform question options
 * Transforms {"A":"Answer 1", "B":"Answer 2"} with mapping {"A":"B", "B":"A"}
 * into {"B":"Answer 1", "A":"Answer 2"}
 *
 * @param options - Original options object
 * @param mapping - Mapping from original to shuffled keys
 * @returns New options object with shuffled keys
 */
export function applyOptionShuffle(
  options: Record<string, string>,
  mapping: Record<string, string>
): Record<string, string> {
  const shuffled: Record<string, string> = {};

  Object.entries(options).forEach(([originalKey, value]) => {
    const newKey = mapping[originalKey];
    shuffled[newKey] = value;
  });

  return shuffled;
}

/**
 * Reverse map a user's selected answer back to the original key
 * Used during answer validation when options were shuffled
 *
 * @param selectedAnswer - User's selected answer (could be single like "B" or multiple like "A,C,D")
 * @param mapping - Mapping from original to shuffled keys
 * @returns Original answer key(s)
 */
export function reverseMapAnswer(
  selectedAnswer: string,
  mapping: Record<string, string>
): string {
  // Create reverse mapping (shuffled -> original)
  const reverseMapping = Object.entries(mapping).reduce((acc, [orig, shuffled]) => {
    acc[shuffled] = orig;
    return acc;
  }, {} as Record<string, string>);

  // Handle multiple answers (e.g., "A,C,D")
  if (selectedAnswer.includes(',')) {
    return selectedAnswer
      .split(',')
      .map(ans => reverseMapping[ans.trim()] || ans.trim())
      .join(',');
  }

  return reverseMapping[selectedAnswer] || selectedAnswer;
}

/**
 * Apply shuffled question order to a list of questions
 *
 * @param questions - Original questions array
 * @param shuffledOrder - Array of question IDs in desired order
 * @returns Questions sorted according to shuffled order
 */
export function applyShuffle<T extends { id: string }>(
  items: T[],
  shuffledOrder: string[]
): T[] {
  const itemMap = new Map(items.map(item => [item.id, item]));
  return shuffledOrder
    .map(id => itemMap.get(id))
    .filter((item): item is T => item !== undefined);
}

/**
 * Create complete shuffle data for a session
 *
 * @param questions - All questions for the exam
 * @param shuffleQuestions - Whether to shuffle question order
 * @param shuffleOptions - Whether to shuffle option order
 * @returns Object containing shuffled question order and option mappings
 */
export function createShuffleData(
  questions: Question[],
  shuffleQuestions: boolean,
  shuffleOptions: boolean
): {
  shuffledQuestionOrder: string[] | null;
  shuffledOptionsMap: Record<string, Record<string, string>> | null;
} {
  const shuffledQuestionOrder = shuffleQuestions
    ? shuffleArray(questions.map(q => q.id))
    : null;

  const shuffledOptionsMap: Record<string, Record<string, string>> = {};

  if (shuffleOptions) {
    questions.forEach(question => {
      shuffledOptionsMap[question.id] = createOptionMapping(question.options);
    });
  }

  return {
    shuffledQuestionOrder,
    shuffledOptionsMap: shuffleOptions ? shuffledOptionsMap : null,
  };
}

/**
 * Apply shuffled options to a single question
 *
 * @param question - Original question
 * @param optionsMap - Mapping for this question (or null if no shuffle)
 * @returns Question with shuffled options (or original if no mapping)
 */
export function applyOptionShuffleToQuestion(
  question: Question,
  optionsMap: Record<string, Record<string, string>> | null
): Question {
  if (!optionsMap || !optionsMap[question.id]) {
    return question;
  }

  const mapping = optionsMap[question.id];
  const shuffledOptions = applyOptionShuffle(question.options, mapping);

  return {
    ...question,
    options: shuffledOptions,
  };
}

/**
 * Get the correct answer key after shuffling
 * Maps the original correct answer to its shuffled position
 *
 * @param correctAnswer - Original correct answer (e.g., "A" or "A,C")
 * @param mapping - Option mapping for the question
 * @returns Shuffled correct answer key(s)
 */
export function getShuffledCorrectAnswer(
  correctAnswer: string,
  mapping: Record<string, string> | undefined
): string {
  if (!mapping) return correctAnswer;

  // Handle multiple correct answers
  if (correctAnswer.includes(',')) {
    return correctAnswer
      .split(',')
      .map(ans => mapping[ans.trim()] || ans.trim())
      .join(',');
  }

  return mapping[correctAnswer] || correctAnswer;
}
