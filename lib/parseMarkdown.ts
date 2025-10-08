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

      // Parse question row
      if (cells.length >= 6 && inTable) {
        try {
          const questionNumber = parseInt(cells[0], 10);
          const questionText = cells[1];
          const optionsText = cells[2];
          const correctAnswer = cells[3].toUpperCase();
          const communityVote = cells[4];
          const hasIllustration = cells[5].toLowerCase().includes('yes');

          // Parse options from format like "A. Text\nB. Text\nC. Text\nD. Text"
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
          console.error('Error parsing row:', cells, error);
        }
      }
    } else if (inTable && trimmedLine.length === 0) {
      // End of table
      break;
    }
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

/**
 * Alternative parser using remark for more robust parsing
 */
export async function parseMarkdownWithRemark(
  markdownContent: string
): Promise<ParsedQuestion[]> {
  const processor = unified().use(remarkParse).use(remarkGfm);

  const tree = processor.parse(markdownContent);
  const questions: ParsedQuestion[] = [];

  // Find table nodes
  const visit = (node: Record<string, unknown>) => {
    if (node.type === 'table') {
      const rows = node.children.slice(1); // Skip header row

      for (const row of rows) {
        if (row.type === 'tableRow' && row.children.length >= 6) {
          try {
            const cells = row.children.map((cell: Record<string, unknown>) =>
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
function extractTextFromNode(node: Record<string, unknown>): string {
  if (node.type === 'text') {
    return node.value;
  }

  if (node.children) {
    return node.children.map(extractTextFromNode).join('');
  }

  return '';
}
