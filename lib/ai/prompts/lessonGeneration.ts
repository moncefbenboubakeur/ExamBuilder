// Lesson Generation Prompt Template

export interface QuestionForLesson {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer?: string;
}

export interface LessonGenerationInput {
  topicName: string;
  concepts: string[];
  questions: QuestionForLesson[];
}

export function buildLessonGenerationPrompt(input: LessonGenerationInput): string {
  const { topicName, concepts, questions } = input;

  // Build minimal question context WITHOUT actual question text to prevent content leakage
  // We only provide the pattern of correct answers to help identify common misconceptions
  const answerPatterns = questions.map(q => q.correct_answer || 'N/A').join(', ');
  const questionCount = questions.length;

  return `You are a master instructor who writes compact, practical study notes that teach underlying concepts and help students avoid common mistakes.

TOPIC: ${topicName}

KEY CONCEPTS TO COVER:
${concepts.map(c => `- ${c}`).join('\n')}

QUESTION STATISTICS:
- Number of questions on this topic: ${questionCount}
- Answer distribution: ${answerPatterns}

YOUR TASK:
Generate a concise, educational lesson in Markdown format (≤500 words) that teaches the concepts tested in this topic.

CRITICAL REQUIREMENTS:
1. DO NOT include any specific exam content, questions, or scenarios
2. Teach ONLY the UNDERLYING CONCEPTS and general principles
3. Use your knowledge of the topic to identify common misconceptions
4. Create your own original examples and analogies
5. Keep it actionable and concise - no fluff
6. NEVER reference or hint at specific exam questions

REQUIRED MARKDOWN STRUCTURE:
# ${topicName}

## Overview
(2-3 sentences: What is this topic about? Why is it important?)

## Core Principles
(3-5 bullet points: Key concepts, rules, or formulas students must know)

## Common Traps & Misconceptions
(3-5 bullet points: Common mistakes derived from analyzing wrong answer patterns. Each should explain:
- What the trap is
- Why it's tempting
- How to avoid it)

## Example or Analogy
(1 brief example or real-world analogy that clarifies the concept - NOT from the exam questions)

## Summary / Quick Takeaways
(3-5 bullet points: Key points to remember for quick review)

CONSTRAINTS:
- Maximum 500 words total
- Use clear, concise language
- Focus on conceptual understanding, not memorization
- Avoid technical jargon unless necessary (and define it if used)

Return ONLY the Markdown content, no explanations, no metadata.`;
}

export function validateLessonMarkdown(markdown: string, topicName: string): void {
  // Check minimum length
  if (markdown.trim().length < 100) {
    throw new Error('Lesson too short (minimum 100 characters)');
  }

  // Check maximum word count (~500 words)
  const wordCount = markdown.split(/\s+/).length;
  if (wordCount > 600) {
    throw new Error(`Lesson too long: ${wordCount} words (max 500)`);
  }

  // Verify required headings are present
  const requiredHeadings = [
    '# ' + topicName,
    '## Overview',
    '## Core Principles',
    '## Common Traps & Misconceptions',
    '## Example or Analogy',
    '## Summary / Quick Takeaways'
  ];

  for (const heading of requiredHeadings) {
    if (!markdown.includes(heading)) {
      throw new Error(`Missing required heading: "${heading}"`);
    }
  }
}
