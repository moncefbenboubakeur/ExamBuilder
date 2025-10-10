// Topic Detection Prompt Template and JSON Schema Validation

export interface QuestionForTopicDetection {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer?: string;
}

export interface DetectedTopic {
  name: string;
  question_ids: string[];
  concepts: string[];
}

export interface TopicDetectionResponse {
  topics: DetectedTopic[];
}

export function buildTopicDetectionPrompt(questions: QuestionForTopicDetection[]): string {
  const questionList = questions.map(q => {
    const optionsText = Object.entries(q.options)
      .map(([key, value]) => `  ${key}. ${value}`)
      .join('\n');

    return `Question ID: ${q.id}
Question: ${q.question_text}
Options:
${optionsText}
Correct Answer: ${q.correct_answer || 'Not specified'}
---`;
  }).join('\n\n');

  return `You are a senior exam content analyst with expertise in curriculum design and topic taxonomy.

Your task is to analyze the following exam questions and identify 5-10 coherent, well-defined topics that group related questions together. Focus on underlying concepts and skills being tested, NOT superficial keywords.

EXAM QUESTIONS:
${questionList}

REQUIREMENTS:
1. Detect between 5 and 10 topics (aim for ~8 topics)
2. Each topic should group questions testing similar concepts, skills, or knowledge areas
3. Assign each question ID to EXACTLY ONE topic (no duplicates, no omissions)
4. For each topic, provide:
   - A clear, concise topic name (2-5 words)
   - Array of question_ids that belong to this topic
   - List of 2-5 key concepts tested in this topic
5. Topics should be at an appropriate granularity:
   - Not too broad (e.g., avoid "General Knowledge")
   - Not too narrow (e.g., avoid single-question topics unless necessary)
6. CRITICAL: Do NOT copy or paraphrase any exam question text in your output

IMPORTANT: Respond with ONLY valid JSON, no markdown code blocks, no explanations. Use this exact format:

{
  "topics": [
    {
      "name": "Topic Name Here",
      "question_ids": ["q1-uuid", "q2-uuid", "q15-uuid"],
      "concepts": ["concept 1", "concept 2", "concept 3"]
    }
  ]
}`;
}

export function validateTopicDetectionResponse(data: unknown): TopicDetectionResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response: expected object');
  }

  const response = data as Record<string, unknown>;

  if (!Array.isArray(response.topics)) {
    throw new Error('Invalid response: missing or invalid topics array');
  }

  if (response.topics.length < 5 || response.topics.length > 12) {
    throw new Error(`Invalid topic count: ${response.topics.length} (expected 5-10)`);
  }

  const validatedTopics: DetectedTopic[] = [];

  for (const topic of response.topics) {
    if (!topic || typeof topic !== 'object') {
      throw new Error('Invalid topic: expected object');
    }

    const t = topic as Record<string, unknown>;

    if (typeof t.name !== 'string' || t.name.trim().length === 0) {
      throw new Error('Invalid topic: missing or empty name');
    }

    if (!Array.isArray(t.question_ids) || t.question_ids.length === 0) {
      throw new Error(`Invalid topic "${t.name}": missing or empty question_ids`);
    }

    if (!t.question_ids.every(id => typeof id === 'string')) {
      throw new Error(`Invalid topic "${t.name}": question_ids must be strings`);
    }

    if (!Array.isArray(t.concepts) || t.concepts.length === 0) {
      throw new Error(`Invalid topic "${t.name}": missing or empty concepts`);
    }

    if (!t.concepts.every(c => typeof c === 'string')) {
      throw new Error(`Invalid topic "${t.name}": concepts must be strings`);
    }

    validatedTopics.push({
      name: t.name,
      question_ids: t.question_ids as string[],
      concepts: t.concepts as string[]
    });
  }

  return { topics: validatedTopics };
}
