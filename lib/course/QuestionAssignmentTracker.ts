/**
 * Tracks question assignments to ensure no questions are lost during topic detection
 */
export class QuestionAssignmentTracker {
  private allQuestionIds: Set<string>;
  private assignedQuestions: Map<string, string>; // questionId -> topicName
  private unassignedQuestions: Set<string>;
  private duplicateAssignments: Map<string, string[]>; // questionId -> [topicNames]

  constructor(questionIds: string[]) {
    this.allQuestionIds = new Set(questionIds);
    this.assignedQuestions = new Map();
    this.unassignedQuestions = new Set(this.allQuestionIds);
    this.duplicateAssignments = new Map();
  }

  /**
   * Assign questions to a topic, tracking any duplicates or invalid IDs
   */
  assignQuestions(topicName: string, questionIds: string[]): {
    assigned: number;
    duplicates: number;
    invalid: number;
  } {
    let assigned = 0;
    let duplicates = 0;
    let invalid = 0;

    for (const id of questionIds) {
      if (!this.allQuestionIds.has(id)) {
        // This ID doesn't exist in our original set
        invalid++;
        console.warn(`Invalid question ID detected: ${id}`);
      } else if (this.assignedQuestions.has(id)) {
        // This question was already assigned to another topic
        duplicates++;
        const existingTopic = this.assignedQuestions.get(id)!;

        // Track duplicate assignments
        if (!this.duplicateAssignments.has(id)) {
          this.duplicateAssignments.set(id, [existingTopic]);
        }
        this.duplicateAssignments.get(id)!.push(topicName);

        console.warn(`Question ${id} already assigned to "${existingTopic}", duplicate assignment to "${topicName}"`);
      } else {
        // Valid new assignment
        this.assignedQuestions.set(id, topicName);
        this.unassignedQuestions.delete(id);
        assigned++;
      }
    }

    return { assigned, duplicates, invalid };
  }

  /**
   * Get all unassigned question IDs
   */
  getUnassignedQuestions(): string[] {
    return Array.from(this.unassignedQuestions);
  }

  /**
   * Get statistics about the assignment process
   */
  getStatistics() {
    return {
      total: this.allQuestionIds.size,
      assigned: this.assignedQuestions.size,
      unassigned: this.unassignedQuestions.size,
      duplicates: this.duplicateAssignments.size,
      assignmentRate: `${((this.assignedQuestions.size / this.allQuestionIds.size) * 100).toFixed(1)}%`
    };
  }

  /**
   * Create a recovery topic for unassigned questions
   */
  createRecoveryTopic(topicName: string = "Additional Review Topics"): {
    name: string;
    question_ids: string[];
    concepts: string[];
  } | null {
    const unassigned = this.getUnassignedQuestions();

    if (unassigned.length === 0) {
      return null;
    }

    // Assign all unassigned questions to the recovery topic
    this.assignQuestions(topicName, unassigned);

    return {
      name: topicName,
      question_ids: unassigned,
      concepts: [
        "Mixed concepts",
        "Additional review materials",
        "Supplementary topics",
        "Cross-domain knowledge"
      ]
    };
  }

  /**
   * Validate that all questions are assigned exactly once
   */
  validate(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for unassigned questions
    if (this.unassignedQuestions.size > 0) {
      errors.push(`${this.unassignedQuestions.size} questions were not assigned to any topic`);

      // Log first few unassigned IDs for debugging
      const sample = Array.from(this.unassignedQuestions).slice(0, 5);
      errors.push(`Sample unassigned IDs: ${sample.join(', ')}`);
    }

    // Check for duplicate assignments
    if (this.duplicateAssignments.size > 0) {
      errors.push(`${this.duplicateAssignments.size} questions were assigned to multiple topics`);

      // Log details of duplicates
      for (const [questionId, topics] of this.duplicateAssignments.entries()) {
        errors.push(`Question ${questionId} assigned to: ${topics.join(', ')}`);
        if (errors.length > 10) break; // Limit error output
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get a detailed report of the assignment process
   */
  getReport(): string {
    const stats = this.getStatistics();
    const validation = this.validate();

    let report = `Question Assignment Report:\n`;
    report += `- Total Questions: ${stats.total}\n`;
    report += `- Assigned: ${stats.assigned} (${stats.assignmentRate})\n`;
    report += `- Unassigned: ${stats.unassigned}\n`;
    report += `- Duplicates: ${stats.duplicates}\n`;
    report += `- Status: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}\n`;

    if (!validation.isValid) {
      report += `\nErrors:\n`;
      validation.errors.forEach(error => {
        report += `  - ${error}\n`;
      });
    }

    return report;
  }
}