// Exam text leakage detection utilities

/**
 * Calculate Jaccard similarity between two sets of words
 */
function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(
    text1.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3) // Only consider words longer than 3 chars
  );

  const words2 = new Set(
    text2.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
  );

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Check if lesson content contains direct quotes from exam questions
 * Uses Jaccard similarity to detect high overlap
 */
export function detectExamLeakage(
  lessonContent: string,
  examQuestions: Array<{ question_text: string; options: Record<string, string> }>
): { hasLeakage: boolean; similarity: number; details?: string } {
  const JACCARD_THRESHOLD = 0.3; // 30% word overlap threshold

  // Combine all exam text
  const examText = examQuestions.map(q => {
    const optionsText = Object.values(q.options).join(' ');
    return `${q.question_text} ${optionsText}`;
  }).join(' ');

  const similarity = jaccardSimilarity(lessonContent, examText);

  if (similarity >= JACCARD_THRESHOLD) {
    return {
      hasLeakage: true,
      similarity,
      details: `High similarity detected (${(similarity * 100).toFixed(1)}%). Lesson may contain exam question text.`
    };
  }

  // Also check for exact phrase matches (5+ consecutive words)
  const lessonWords = lessonContent.toLowerCase().split(/\s+/);
  const examWords = examText.toLowerCase().split(/\s+/);

  for (let i = 0; i <= lessonWords.length - 5; i++) {
    const phrase = lessonWords.slice(i, i + 5).join(' ');
    const examPhrase = examWords.join(' ');

    if (examPhrase.includes(phrase)) {
      return {
        hasLeakage: true,
        similarity,
        details: `Exact phrase match found: "${phrase.substring(0, 50)}..."`
      };
    }
  }

  return {
    hasLeakage: false,
    similarity
  };
}

/**
 * Sanitize lesson content by removing potential exam text
 * This is a safety fallback - the AI should not include exam text
 */
export function sanitizeLessonContent(
  lessonContent: string,
  examQuestions: Array<{ question_text: string }>
): string {
  let sanitized = lessonContent;

  // Remove any lines that are too similar to exam questions
  const lines = sanitized.split('\n');
  const cleanedLines = lines.filter(line => {
    if (line.trim().length < 20) return true; // Keep short lines (headings, etc.)

    for (const q of examQuestions) {
      const similarity = jaccardSimilarity(line, q.question_text);
      if (similarity > 0.5) {
        console.warn(`Removed line with high similarity to exam question: ${line.substring(0, 50)}...`);
        return false;
      }
    }
    return true;
  });

  return cleanedLines.join('\n');
}
