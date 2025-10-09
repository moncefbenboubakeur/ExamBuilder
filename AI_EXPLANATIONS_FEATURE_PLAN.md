# AI-Powered Answer Explanations - Feature Implementation Plan

## Overview

Add AI as an **independent expert** that solves exam questions and provides explanations. The AI analyzes questions without seeing the exam creator's answer or community vote, providing a third opinion to help users make informed decisions.

**Three Sources of Truth:**
- **📝 Exam Creator's Answer**: From the markdown file "Correct Answer" column (may be wrong or outdated)
- **👥 Community Vote**: Collective wisdom of users who took the exam
- **🤖 AI Analysis**: Independent AI determination with detailed explanations

**Two-tier explanations for each option:**
- **Short explanations**: Quick one-line verdicts (always visible when answer revealed)
- **Long explanations**: Detailed reasoning (expandable per option)
- **Full AI reasoning**: Complete analysis (modal/overlay)

**Key Requirement**: Pre-compute all AI analysis during exam upload to avoid consuming AI tokens on every user view.

---

## Current State Analysis

### Exam Taking Flow
- **Location**: `app/exam/page.tsx`
- **Component**: `components/QuestionCard.tsx`
- Users select answers during exam
- "Show Answer" button reveals correct answer and community vote
- Currently displays:
  - Correct answer (green highlight)
  - Wrong answer (red highlight)
  - Community vote percentage

### Database Structure
- **Schema**: `supabase/schema.sql`
- **questions table** has:
  - `question_text` (TEXT)
  - `options` (JSONB) - Dynamic option keys (A, B, C, D, etc.)
  - `correct_answer` (TEXT)
  - `community_vote` (TEXT)

---

## Proposed Solution

### 1. Database Schema Changes

Create new table `question_ai_analysis`:

```sql
-- AI Analysis table for storing pre-computed explanations
CREATE TABLE IF NOT EXISTS question_ai_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,

  -- AI recommendation
  ai_recommended_answer TEXT NOT NULL,
  ai_confidence_score FLOAT, -- 0.0 to 1.0

  -- Two-tier explanations per option
  option_short_explanations JSONB NOT NULL,  -- {"A": "Quick verdict", "B": "..."}
  option_long_explanations JSONB NOT NULL,   -- {"A": "Detailed explanation", "B": "..."}

  -- Overall reasoning (two levels)
  reasoning_summary TEXT,      -- 2-3 sentence summary
  reasoning_detailed TEXT,     -- Full comprehensive explanation

  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_analysis_question ON question_ai_analysis(question_id);

-- Enable RLS
ALTER TABLE question_ai_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policy (all authenticated users can view AI analysis)
CREATE POLICY "AI analysis viewable by authenticated users"
  ON question_ai_analysis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "AI analysis insertable by authenticated users"
  ON question_ai_analysis FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

#### Example Data Structure

```json
{
  "ai_recommended_answer": "C",
  "ai_confidence_score": 0.95,
  "option_short_explanations": {
    "A": "Used for batch transfers — not continuous access",
    "B": "Not possible — VPCs exist only within Google Cloud",
    "C": "✓ Best solution: Private, low-latency connectivity",
    "D": "Used for offline migration, not ongoing access"
  },
  "option_long_explanations": {
    "A": "Storage Transfer Service: Used for batch or one-time data transfers to Cloud Storage — not continuous low-latency access.\n\nWhy it's wrong:\n- Designed for bulk data migration\n- Not suitable for real-time workload access\n- Higher latency than direct connectivity solutions\n- No private network path",
    "B": "Create a VPC between on-prem and Google Cloud: Not possible — VPCs exist only within Google Cloud. You'd need Interconnect or VPN to link environments.\n\nDetailed reasoning:\n- VPCs are internal GCP constructs\n- Cannot span on-premises and cloud\n- Cross-environment connectivity requires Cloud Interconnect, Partner Interconnect, or Cloud VPN\n- This option shows fundamental misunderstanding of VPC scope",
    "C": "✓ Peer your on-premises data center to Google's Edge Network (via Dedicated Interconnect, Partner Interconnect, or Direct Peering)\n\nWhy this is correct:\n- Provides private, high-bandwidth, low-latency connectivity\n- Secure communication without traversing public internet\n- Ideal for hybrid environments with frequent data access\n- Supports large-scale, continuous workload requirements\n- Edge Network proximity minimizes latency",
    "D": "Transfer Appliance: Used for offline bulk data migration, not ongoing access or low latency.\n\nWhy it's wrong:\n- Physical device for one-time data transfers\n- Not designed for continuous access patterns\n- No network connectivity solution\n- Introduces significant delays (shipping, processing)\n- Doesn't address the real-time access requirement"
  },
  "reasoning_summary": "The goal is to allow Google Cloud workloads to privately and securely access on-premises data with minimal latency for large-scale, continuous operations. Peering with Google's Edge Network provides the optimal solution.",
  "reasoning_detailed": "The goal is to allow Google Cloud workloads to:\n• Privately and securely access on-premises data, and\n• Minimize latency for large-scale, continuous data access.\n\n✅ Best solution: Cloud Interconnect or Peering\n\nPeering your on-premises network with Google's Edge Network (via Dedicated Interconnect, Partner Interconnect, or Direct Peering) gives you:\n\n• Private, high-bandwidth, low-latency connectivity between Google Cloud and on-premises data.\n• Secure communication without sending traffic over the public internet.\n\nThis setup is ideal for hybrid environments where you need frequent or real-time access to large datasets still located on-prem.\n\n❌ Why not the others:\n\nA. Storage Transfer Service: Used for batch or one-time data transfers to Cloud Storage — not continuous low-latency access.\n\nB. Create a VPC between on-prem and Google Cloud: Not possible — VPCs exist only within Google Cloud. You'd need Interconnect or VPN to link environments.\n\nD. Transfer Appliance: Used for offline bulk data migration, not ongoing access or low latency."
}
```

---

### 2. Backend Implementation

#### 2.1 Modify Upload Endpoint

**File**: `app/api/upload/route.ts`

After questions are successfully inserted (around line 88), trigger AI analysis:

```typescript
// After successful question insertion
if (data && data.length > 0) {
  // Trigger AI analysis asynchronously (don't block response)
  fetch('/api/ai/analyze-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionIds: data.map(q => q.id),
      examId: examData.id
    })
  }).catch(err => console.error('AI analysis trigger failed:', err));
}

return NextResponse.json({
  success: true,
  exam: examData,
  count: questions.length,
  questions: data,
  ai_analysis_queued: true // Inform user AI analysis is processing
});
```

#### 2.2 Create AI Analysis Endpoint

**New File**: `app/api/ai/analyze-questions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AnalysisRequest {
  questionIds: string[];
  examId: string;
}

interface AIResponse {
  recommended_answer: string;
  confidence_score: number;
  reasoning_summary: string;
  reasoning_detailed: string;
  options: {
    [key: string]: {
      short: string;
      long: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AnalysisRequest = await request.json();
    const { questionIds } = body;

    // Fetch questions
    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);

    if (fetchError || !questions) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Process questions in batches to avoid timeout
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      const batchPromises = batch.map(q => analyzeQuestion(q));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Save results to database
    const analysisRecords = results.map((result, idx) => ({
      question_id: questions[idx].id,
      ai_recommended_answer: result.recommended_answer,
      ai_confidence_score: result.confidence_score,
      option_short_explanations: result.option_short_explanations,
      option_long_explanations: result.option_long_explanations,
      reasoning_summary: result.reasoning_summary,
      reasoning_detailed: result.reasoning_detailed,
    }));

    const { error: insertError } = await supabase
      .from('question_ai_analysis')
      .insert(analysisRecords);

    if (insertError) {
      console.error('Failed to save AI analysis:', insertError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analyzed: results.length,
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

async function analyzeQuestion(question: any): Promise<any> {
  // CRITICAL: Do NOT send correct_answer or community_vote to AI
  // AI must solve independently!

  const prompt = `You are an expert taking an exam. Solve this question using your knowledge.

IMPORTANT: Do NOT assume any answer is correct. Analyze the question independently and determine the BEST answer based on your expertise.

Question: ${question.question_text}

Options:
${Object.entries(question.options).map(([key, val]) => `${key}. ${val}`).join('\n')}

Requirements:
1. Determine which option is BEST (your independent choice)
2. Provide confidence score (0-1) for your answer
3. For EACH option, explain why it's good or bad:
   - SHORT explanation (1 line, max 15 words) - Quick verdict
   - LONG explanation (3-5 sentences) - Detailed technical analysis with:
     * Why it's correct/incorrect
     * Key concepts explanation
     * Common misconceptions
     * Real-world context
4. Provide overall reasoning summary and detailed explanation

Be objective and critical. If multiple options seem valid, explain the nuances.

Example format for long explanation:
"Storage Transfer Service: Used for batch or one-time data transfers to Cloud Storage — not continuous low-latency access.

Why it's not the best answer:
- Designed for bulk data migration
- Not suitable for real-time workload access
- Higher latency than direct connectivity solutions
- Doesn't provide ongoing network connectivity"

Return ONLY valid JSON in this exact format:
{
  "recommended_answer": "C",
  "confidence_score": 0.92,
  "reasoning_summary": "Brief 2-3 sentence summary of why you chose this answer",
  "reasoning_detailed": "Full comprehensive explanation with sections and bullet points",
  "options": {
    "A": {
      "short": "One-line verdict (max 15 words)",
      "long": "Detailed 3-5 sentence explanation with technical reasoning"
    },
    "B": { "short": "...", "long": "..." },
    "C": { "short": "...", "long": "..." },
    "D": { "short": "...", "long": "..." }
  }
}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [
      { role: 'user', content: prompt }
    ],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  const parsed: AIResponse = JSON.parse(responseText);

  // Transform to database format
  const optionShortExplanations: Record<string, string> = {};
  const optionLongExplanations: Record<string, string> = {};

  Object.entries(parsed.options).forEach(([key, value]) => {
    optionShortExplanations[key] = value.short;
    optionLongExplanations[key] = value.long;
  });

  return {
    recommended_answer: parsed.recommended_answer,
    confidence_score: parsed.confidence_score,
    option_short_explanations: optionShortExplanations,
    option_long_explanations: optionLongExplanations,
    reasoning_summary: parsed.reasoning_summary,
    reasoning_detailed: parsed.reasoning_detailed,
  };
}
```

#### 2.3 Modify Questions API

**File**: `app/api/questions/route.ts` (or wherever questions are fetched)

Add LEFT JOIN to include AI analysis:

```typescript
const { data: questions, error } = await supabase
  .from('questions')
  .select(`
    *,
    ai_analysis:question_ai_analysis(*)
  `)
  .eq('exam_id', examId);
```

---

### 3. Frontend Implementation

#### 3.1 Update TypeScript Types

**File**: `lib/supabaseClient.ts`

```typescript
export interface AIAnalysis {
  id: string;
  question_id: string;
  ai_recommended_answer: string;
  ai_confidence_score: number;
  option_short_explanations: Record<string, string>;
  option_long_explanations: Record<string, string>;
  reasoning_summary: string;
  reasoning_detailed: string;
  analyzed_at: string;
  created_at: string;
}

export interface Question {
  id: string;
  exam_id: string;
  question_number: number;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  community_vote: string | null;
  has_illustration: boolean;
  created_at: string;
  ai_analysis?: AIAnalysis | null; // Optional - may not exist for old questions
}
```

#### 3.2 Update QuestionCard Component

**File**: `components/QuestionCard.tsx`

Add new state management and UI sections:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/lib/supabaseClient';
import {
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Users,
  Bot,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  X
} from 'lucide-react';
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
  const [showFullAIReasoning, setShowFullAIReasoning] = useState(false);
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());

  // Reset revealed state when question changes
  useEffect(() => {
    setRevealed(false);
    setShowFullAIReasoning(false);
    setExpandedOptions(new Set());
  }, [question.id]);

  const options = Object.keys(question.options).sort();

  const isCorrect = (option: string) => {
    const correctAnswers = question.correct_answer.toUpperCase().split(',').map(a => a.trim());
    return correctAnswers.includes(option.toUpperCase());
  };

  const toggleOptionExpansion = (option: string) => {
    const newExpanded = new Set(expandedOptions);
    if (newExpanded.has(option)) {
      newExpanded.delete(option);
    } else {
      newExpanded.add(option);
    }
    setExpandedOptions(newExpanded);
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
      {/* Question Header */}
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

      {/* Answer Summary - Three Sources of Truth (when revealed) */}
      {revealed && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase">Three Expert Opinions</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Exam Creator's Answer */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-700 mb-1">📝 Exam Creator</div>
              <div className="text-2xl font-bold text-blue-900">{question.correct_answer}</div>
              <div className="text-xs text-blue-600 mt-1">From markdown file</div>
            </div>

            {/* Community Vote */}
            {question.community_vote && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-green-700 mb-1">👥 Community</div>
                <div className="text-2xl font-bold text-green-900">{question.community_vote}</div>
                <div className="text-xs text-green-600 mt-1">Crowd wisdom</div>
              </div>
            )}

            {/* AI Recommendation */}
            {question.ai_analysis && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-purple-700 mb-1">🤖 AI Analysis</div>
                <div className="text-2xl font-bold text-purple-900">
                  {question.ai_analysis.ai_recommended_answer}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {Math.round(question.ai_analysis.ai_confidence_score * 100)}% confidence
                </div>
              </div>
            )}
          </div>

          {/* Warning if answers disagree */}
          {question.ai_analysis &&
           (question.correct_answer !== question.ai_analysis.ai_recommended_answer ||
            (question.community_vote && question.community_vote !== question.ai_analysis.ai_recommended_answer)) && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900 mb-1">Sources disagree on the answer!</p>
                  <p className="text-yellow-800 text-xs">
                    Review all explanations carefully to understand why. This may indicate a controversial or outdated question.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Show Full AI Reasoning button */}
          {question.ai_analysis && (
            <button
              onClick={() => setShowFullAIReasoning(true)}
              className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
            >
              <BookOpen className="w-4 h-4" />
              Show Full AI Reasoning
            </button>
          )}
        </div>
      )}

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option) => {
          const isCorrectOption = isCorrect(option);
          const shortExplanation = question.ai_analysis?.option_short_explanations?.[option];
          const longExplanation = question.ai_analysis?.option_long_explanations?.[option];
          const isExpanded = expandedOptions.has(option);

          return (
            <div key={option}>
              {/* Option Button */}
              <button
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
                  {revealed && isCorrectOption && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  )}
                  {revealed && (multipleChoice ? selectedAnswers.includes(option) : selectedAnswer === option) && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* AI Short Explanation (always visible when revealed) */}
              {revealed && shortExplanation && (
                <div className="mt-2 p-3 rounded-md text-sm bg-purple-50 border border-purple-200 text-purple-900">
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-600" />
                    <div className="flex-1">
                      <p className="font-medium">{shortExplanation}</p>

                      {longExplanation && (
                        <button
                          onClick={() => toggleOptionExpansion(option)}
                          className="mt-2 text-xs font-semibold flex items-center gap-1 hover:underline text-purple-700"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              Learn More
                            </>
                          )}
                        </button>
                      )}

                      {/* Long Explanation (expandable) */}
                      {isExpanded && longExplanation && (
                        <div className="mt-3 pt-3 border-t border-purple-300/30">
                          <p className="font-semibold text-xs mb-2 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Detailed AI Analysis
                          </p>
                          <div className="whitespace-pre-line text-xs leading-relaxed">
                            {longExplanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show/Hide Answer Button */}
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
      </div>

      {/* Full AI Reasoning Modal */}
      {showFullAIReasoning && question.ai_analysis && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Bot className="w-5 h-5 text-purple-600" />
                AI Full Reasoning
              </h3>
              <button
                onClick={() => setShowFullAIReasoning(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  Summary
                </h4>
                <p className="text-sm leading-relaxed">{question.ai_analysis.reasoning_summary}</p>
              </div>

              {/* Detailed Analysis */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Detailed Analysis
                </h4>
                <div className="text-sm whitespace-pre-line leading-relaxed bg-gray-50 rounded-lg p-4">
                  {question.ai_analysis.reasoning_detailed}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 4. Environment Variables

Add to `.env.local`:

```env
# AI Provider (choose one)
ANTHROPIC_API_KEY=sk-ant-your-key-here
# OR
# OPENAI_API_KEY=sk-your-key-here
```

---

### 5. Dependencies

Install required packages:

```bash
npm install @anthropic-ai/sdk
# OR
# npm install openai
```

---

### 6. User Interaction Flow

1. **User clicks "Show Answer"**
   - `revealed = true`
   - Shows: Correct answer, Community vote, AI recommendation
   - Shows: Short explanations under each option (always visible)
   - Buttons appear: "Learn More" per option + "Show Full AI Reasoning"

2. **User clicks "Learn More" on specific option**
   - `expandedOptions.add(option)`
   - Expands long explanation for that option only
   - Button changes to "Show Less"
   - Other options remain collapsed

3. **User clicks "Show Full AI Reasoning"**
   - `showFullAIReasoning = true`
   - Opens modal/overlay with complete AI analysis
   - Shows reasoning summary + detailed explanation

4. **User clicks "Hide Answer"**
   - `revealed = false`
   - Collapses everything
   - Resets: `expandedOptions.clear()`, `showFullAIReasoning = false`

---

### 7. Cost Optimization

**Pre-computation Strategy:**
- AI analysis runs ONCE per question during exam upload
- Results stored permanently in `question_ai_analysis` table
- Zero AI tokens consumed during user exam sessions
- All explanations served from database

**Estimated Costs:**
- **Input tokens**: ~500 per question (question + options + prompt)
- **Output tokens**: ~800 per question (short + long explanations for all options)
- **Total per question**: ~1,300 tokens
- **Cost with Claude 3.5 Sonnet**: ~$0.005 per question
- **100 questions**: ~$0.50
- **1000 questions**: ~$5.00

**Performance:**
- Batch processing (5 questions at a time) to avoid timeouts
- Async processing (upload endpoint returns immediately)
- Background job processes AI analysis
- User can start taking exam while analysis completes

---

### 8. Migration Strategy for Existing Questions

**Option 1: Background Batch Job**
- Create admin endpoint to analyze all questions without AI analysis
- Process in batches of 10-20 questions
- Run during off-peak hours

**Option 2: On-Demand Analysis**
- When user views question without AI analysis, trigger analysis
- Cache result for future users
- Slight delay on first view

**Option 3: Manual Trigger**
- Add admin button: "Analyze All Questions in Exam"
- Admin can selectively analyze important exams
- Cost-conscious approach

**Recommended**: Option 1 (batch job) for comprehensive coverage

---

### 9. Database Migration Script

**File**: `supabase/migrations/001_add_ai_analysis.sql`

```sql
-- Migration: Add AI Analysis Support
-- Run this in Supabase SQL Editor

-- Create AI Analysis table
CREATE TABLE IF NOT EXISTS question_ai_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  ai_recommended_answer TEXT NOT NULL,
  ai_confidence_score FLOAT,
  option_short_explanations JSONB NOT NULL,
  option_long_explanations JSONB NOT NULL,
  reasoning_summary TEXT,
  reasoning_detailed TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_ai_analysis_question ON question_ai_analysis(question_id);

-- Enable RLS
ALTER TABLE question_ai_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "AI analysis viewable by authenticated users"
  ON question_ai_analysis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "AI analysis insertable by authenticated users"
  ON question_ai_analysis FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

### 10. Testing Checklist

- [ ] Database migration runs successfully
- [ ] Upload endpoint triggers AI analysis
- [ ] AI analysis saves to database correctly
- [ ] Questions API returns AI analysis data
- [ ] QuestionCard shows AI recommendation
- [ ] Short explanations display correctly
- [ ] "Learn More" expands long explanations
- [ ] "Show Full AI Reasoning" modal works
- [ ] State resets when changing questions
- [ ] Handles questions without AI analysis gracefully
- [ ] Works for both single and multiple choice
- [ ] Mobile responsive design

---

### 11. Implementation Phases

**Phase 1: Database Setup** (30 mins)
- Run migration script
- Verify table creation and RLS policies

**Phase 2: Backend AI Integration** (2 hours)
- Create AI analysis endpoint
- Implement Claude API integration
- Add batch processing logic
- Modify upload endpoint

**Phase 3: API Updates** (30 mins)
- Update questions API to join AI analysis
- Update TypeScript types

**Phase 4: Frontend UI** (3 hours)
- Update QuestionCard component
- Add state management
- Implement progressive disclosure UI
- Add modal for full reasoning
- Style short/long explanations

**Phase 5: Testing & Refinement** (1 hour)
- Test with sample questions
- Fix edge cases
- Optimize UI/UX
- Mobile testing

**Total Estimated Time**: 6-7 hours

---

### 12. Future Enhancements

- **AI Model Selection**: Allow admin to choose between Claude/GPT-4
- **Explanation Regeneration**: Admin can trigger re-analysis for specific questions
- **User Feedback**: Users can rate AI explanations quality
- **Multilingual Support**: Generate explanations in multiple languages
- **Difficulty Analysis**: AI provides difficulty score per question
- **Topic Tagging**: AI extracts topics/skills tested by each question
- **Custom Prompts**: Admin can customize AI analysis prompt per exam type

---

## How AI Gets Answers - Critical Understanding

**IMPORTANT**: The AI **does NOT** receive the exam creator's answer or community vote!

### The Process:

1. **User uploads markdown** with questions containing:
   - Question text
   - Options (A, B, C, D)
   - Exam creator's "Correct Answer" (may be wrong!)
   - Community vote (optional)

2. **AI analyzes independently**:
   - Receives ONLY: Question text + Options
   - Does NOT receive: Correct answer or community vote
   - AI solves the question using its own knowledge
   - Determines best answer based on expertise

3. **Three independent opinions stored**:
   - 📝 Exam Creator: From markdown "Correct Answer" column
   - 👥 Community: From markdown "Community Vote" column
   - 🤖 AI Analysis: AI's independent determination

4. **User sees all three and decides**:
   - Compare different expert opinions
   - Read AI's explanations for each option
   - Make informed decision about correct answer

### Real-World Scenario:

```
Markdown file says:     Correct Answer = A
Community voted:        B (65% of users)
AI independently says:  C (92% confidence)

User sees:
"⚠️ Sources disagree! Review all explanations."

User reads AI explanation:
"Option A is outdated (used in older GCP versions)
 Option B is commonly confused but incorrect because...
 Option C is the current best practice because..."

User learns WHY and makes informed choice!
```

### Why This Approach?

✅ **AI as independent expert** - Not biased by potentially wrong answers
✅ **Quality control** - Catches bad or outdated questions
✅ **Educational** - Users learn to think critically, not memorize
✅ **Trust building** - AI explains reasoning, users verify logic
✅ **Future-proof** - AI knowledge updated, exam files may be old

---

## Summary

This implementation provides:

✅ **Three independent sources**: Exam creator, Community, AI (unbiased)
✅ **Two-tier explanations**: Short (always visible) + Long (on-demand)
✅ **Cost-efficient**: Pre-computed during upload, zero tokens per user
✅ **Progressive disclosure**: Users control detail level
✅ **Disagreement detection**: Warns when sources conflict
✅ **Rich context**: Full AI reasoning available in modal
✅ **Database-backed**: All explanations stored permanently
✅ **Graceful degradation**: Works for questions with/without AI analysis
✅ **Learning tool**: Users learn WHY, not just memorize answers

The system transforms the platform from a memorization tool into a critical thinking and learning platform, while maintaining cost efficiency through pre-computation.
