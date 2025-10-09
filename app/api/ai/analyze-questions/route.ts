import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

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

    if (!questionIds || questionIds.length === 0) {
      return NextResponse.json({ error: 'No question IDs provided' }, { status: 400 });
    }

    // Get AI settings from database
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error('Failed to fetch AI settings:', settingsError);
      return NextResponse.json({
        error: 'AI settings not configured'
      }, { status: 500 });
    }

    // Check if appropriate API key is configured
    if (settings.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: 'Anthropic API key not configured'
      }, { status: 500 });
    }
    if (settings.provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured'
      }, { status: 500 });
    }

    // Fetch questions
    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);

    if (fetchError || !questions) {
      console.error('Failed to fetch questions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Process questions in batches to avoid timeout
    const batchSize = 5;
    const results = [];
    const errors = [];

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      const batchPromises = batch.map(async (q) => {
        try {
          return await analyzeQuestion(q, settings);
        } catch (error) {
          console.error(`Failed to analyze question ${q.id}:`, error);
          errors.push({ questionId: q.id, error: String(error) });
          return null;
        }
      });
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(r => r !== null));
    }

    // Save results to database
    if (results.length > 0) {
      const analysisRecords = results.map((result) => ({
        question_id: result.question_id,
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
        return NextResponse.json({
          error: 'Failed to save analysis',
          details: insertError.message
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      analyzed: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      model_used: `${settings.model_name} (${settings.provider})`,
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function analyzeQuestion(question: any, settings: any): Promise<any> {
  const prompt = buildPrompt(question);

  let responseText = '';

  // Call appropriate AI provider based on settings
  if (settings.provider === 'anthropic') {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: settings.model_id,
      max_tokens: 2500,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

  } else if (settings.provider === 'openai') {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: settings.model_id,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    responseText = completion.choices[0]?.message?.content || '';

  } else {
    throw new Error(`Unsupported AI provider: ${settings.provider}`);
  }

  // Parse JSON response (handle potential markdown code blocks)
  let jsonText = responseText.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  const parsed: AIResponse = JSON.parse(jsonText);

  // Transform to database format
  const optionShortExplanations: Record<string, string> = {};
  const optionLongExplanations: Record<string, string> = {};

  Object.entries(parsed.options).forEach(([key, value]) => {
    optionShortExplanations[key] = value.short;
    optionLongExplanations[key] = value.long;
  });

  return {
    question_id: question.id,
    recommended_answer: parsed.recommended_answer,
    confidence_score: parsed.confidence_score,
    option_short_explanations: optionShortExplanations,
    option_long_explanations: optionLongExplanations,
    reasoning_summary: parsed.reasoning_summary,
    reasoning_detailed: parsed.reasoning_detailed,
  };
}

function buildPrompt(question: any): string {
  return `You are an expert taking an exam. Solve this question using your knowledge.

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

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
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
}
