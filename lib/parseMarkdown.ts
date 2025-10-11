import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

export interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  options: Record<string, string>; // Dynamic options (A, B, C, D, E, F, etc.)
  correctAnswer: string;
  communityVote: string;
  hasIllustration: boolean;
}

/**
 * Parse markdown table into structured question objects
 * Expected format:
 * | Question # | Question | Options (A–D) | Correct Answer | Community Vote | Has Illustration |
 */
export async function parseMarkdownTable(
  markdownContent: string
): Promise<ParsedQuestion[]> {
  const questions: ParsedQuestion[] = [];

  // Split by lines and find table rows
  const lines = markdownContent.split('\n');
  let inTable = false;
  let headerProcessed = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if this is a table row
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      // Skip separator lines (like |---|---|)
      if (trimmedLine.includes('---')) {
        inTable = true;
        continue;
      }

      // Parse table cells
      const cells = trimmedLine
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);

      // Skip header row
      if (!headerProcessed) {
        headerProcessed = true;
        continue;
      }

      // Parse question row (require at least 4 cells: question#, question, options, answer)
      if (cells.length >= 4 && inTable) {
        try {
          const questionNumber = parseInt(cells[0], 10);
          const questionText = cells[1];
          const optionsText = cells[2];
          const correctAnswer = cells[3].toUpperCase();
          const communityVote = cells[4] || '';
          const hasIllustration = cells[5] ? cells[5].toLowerCase().includes('yes') : false;

          // Parse options from format like "A. Text\nB. Text\nC. Text\nD. Text"
          // For HOTSPOT questions with non-standard formats, store the raw text
          let options = parseOptions(optionsText);

          // If parsing failed (HOTSPOT or other structured format), create a single option with raw text
          if (!options && optionsText) {
            options = { 'RAW': optionsText };
          }

          if (questionNumber && questionText && options) {
            questions.push({
              questionNumber,
              questionText,
              options,
              correctAnswer,
              communityVote,
              hasIllustration,
            });
          }
        } catch (error) {
          console.error('Error parsing row:', cells, error);
        }
      }
    }
    // Don't break on empty lines - continue parsing through entire file
  }

  return questions;
}

/**
 * Parse options text into structured format
 * Handles formats like:
 * - "A. Text\nB. Text\nC. Text\nD. Text\nE. Text..."
 * - "A. Text B. Text C. Text D. Text E. Text..."
 * Supports unlimited options (A-Z)
 */
function parseOptions(optionsText: string): Record<string, string> | null {
  const options: Record<string, string> = {};

  // Split by newlines or <br> tags
  const lines = optionsText.split(/\n|<br\s*\/?>/).filter((l) => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    // Match pattern like "A." or "A)" or "A:" followed by text
    const match = trimmed.match(/^([A-Z])[.):]\s*(.+)/i);
    if (match) {
      const optionLetter = match[1].toUpperCase();
      const optionText = match[2].trim();
      options[optionLetter] = optionText;
    }
  }

  // Validate we got at least some options
  if (Object.keys(options).length >= 2) {
    return options;
  }

  return null;
}

// Type for AST nodes
interface ASTNode {
  type: string;
  children?: ASTNode[];
  value?: string;
  [key: string]: unknown;
}

/**
 * Alternative parser using remark for more robust parsing
 */
export async function parseMarkdownWithRemark(
  markdownContent: string
): Promise<ParsedQuestion[]> {
  const processor = unified().use(remarkParse).use(remarkGfm);

  const tree = processor.parse(markdownContent) as ASTNode;
  const questions: ParsedQuestion[] = [];

  // Find table nodes
  const visit = (node: ASTNode): void => {
    if (node.type === 'table' && node.children) {
      const rows = node.children.slice(1); // Skip header row

      for (const row of rows) {
        if (row.type === 'tableRow' && row.children && row.children.length >= 6) {
          try {
            const cells = row.children.map((cell: ASTNode) =>
              extractTextFromNode(cell)
            );

            const questionNumber = parseInt(cells[0], 10);
            const questionText = cells[1];
            const optionsText = cells[2];
            const correctAnswer = cells[3].toUpperCase();
            const communityVote = cells[4];
            const hasIllustration = cells[5].toLowerCase().includes('yes');

            const options = parseOptions(optionsText);

            if (questionNumber && questionText && options) {
              questions.push({
                questionNumber,
                questionText,
                options,
                correctAnswer,
                communityVote,
                hasIllustration,
              });
            }
          } catch (error) {
            console.error('Error parsing table row:', error);
          }
        }
      }
    }

    if (node.children) {
      node.children.forEach(visit);
    }
  };

  visit(tree);
  return questions;
}

/**
 * Extract text content from a remark node
 */
function extractTextFromNode(node: ASTNode): string {
  if (node.type === 'text' && node.value) {
    return node.value as string;
  }

  if (node.children) {
    return node.children.map(extractTextFromNode).join('');
  }

  return '';
}

/**
 * Quickly count questions in markdown content without full parsing
 * This is useful for preview purposes
 */
export function countQuestions(markdownContent: string): number {
  const lines = markdownContent.split('\n');
  let questionCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if this is a table row (but not a header or separator)
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      // Skip separator lines (like |---|---|)
      if (trimmedLine.includes('---')) {
        continue;
      }

      // Skip header row (contains "Question #" text)
      if (trimmedLine.toLowerCase().includes('question #')) {
        continue;
      }

      // Count question rows (must have at least 4 cells: question#, question, options, answer)
      const cells = trimmedLine
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);

      if (cells.length >= 4) {
        // Try to parse question number from first cell
        const questionNumber = parseInt(cells[0], 10);
        if (!isNaN(questionNumber) && questionNumber > 0) {
          questionCount++;
        }
      }
    }
  }

  return questionCount;
}
