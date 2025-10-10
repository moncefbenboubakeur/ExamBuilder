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

  // Build question context (without revealing answers in the lesson)
  const questionContext = questions.map(q => {
    const optionsText = Object.entries(q.options)
      .map(([key, value]) => `  ${key}. ${value}`)
      .join('\n');

    return `Question: ${q.question_text}
Options:
${optionsText}
Correct: ${q.correct_answer || 'Not specified'}`;
  }).join('\n\n---\n\n');

  return `You are a master instructor who writes compact, practical study notes that teach underlying concepts and help students avoid common mistakes.

TOPIC: ${topicName}

KEY CONCEPTS TO COVER:
${concepts.map(c => `- ${c}`).join('\n')}

RELATED EXAM QUESTIONS (for context only - DO NOT quote or paraphrase these in your output):
${questionContext}

YOUR TASK:
Generate a concise, educational lesson in Markdown format (≤500 words) that teaches the concepts tested in this topic.

CRITICAL REQUIREMENTS:
1. DO NOT copy, quote, or paraphrase any exam question text
2. Instead, teach the UNDERLYING CONCEPTS that would help answer these types of questions
3. Derive "Common Traps & Misconceptions" by analyzing patterns in the WRONG options (distractors)
4. Use generalized examples and analogies, NOT the specific exam scenarios
5. Keep it actionable and concise - no fluff

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
