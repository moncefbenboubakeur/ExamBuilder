import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { callAI } from '@/lib/ai/callAi';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, model_id, model_name } = body;

    if (!provider || !model_id || !model_name) {
      return NextResponse.json({
        error: 'Missing required fields: provider, model_id, model_name'
      }, { status: 400 });
    }

    // Check API key for the provider
    if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: 'Anthropic API key not configured in environment variables'
      }, { status: 500 });
    }
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured in environment variables'
      }, { status: 500 });
    }
    if (provider === 'google' && !process.env.GOOGLE_API_KEY) {
      return NextResponse.json({
        error: 'Google API key not configured in environment variables'
      }, { status: 500 });
    }

    const startTime = Date.now();

    try {
      // GPT-5 models are reasoning models and need more tokens (reasoning + output)
      let maxTokens = 100;
      if (model_id === 'gpt-5-nano') {
        maxTokens = 1000; // Nano model has very high reasoning overhead
      } else if (model_id === 'gpt-5-mini') {
        maxTokens = 1500; // Mini model needs more tokens for dual questions
      } else if (model_id === 'gpt-5') {
        maxTokens = 2000; // Full GPT-5 needs the most tokens
      } else if (model_id.startsWith('gpt-5')) {
        maxTokens = 500; // Other GPT-5 models
      }

      // Question 1: Basic working test
      const question1 = 'Say "Hello! I am working correctly." in a single sentence.';
      const response1 = await callAI(
        {
          provider,
          model_id,
          model_name
        },
        {
          prompt: question1,
          systemPrompt: 'You are a helpful AI assistant. Respond concisely.',
          timeoutMs: 15000, // Increased timeout for reasoning models
          maxTokens,
          responseFormat: 'text'
        }
      );

      // Question 2: Model identification
      const question2 = 'Identify yourself.';
      const response2 = await callAI(
        {
          provider,
          model_id,
          model_name
        },
        {
          prompt: question2,
          systemPrompt: 'You are a helpful AI assistant. State your exact model name.',
          timeoutMs: 15000,
          maxTokens,
          responseFormat: 'text'
        }
      );

      const duration = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        model_id,
        model_name,
        provider,
        questions: [
          { question: question1, response: response1.trim() },
          { question: question2, response: response2.trim() }
        ],
        duration_ms: duration
      });

    } catch (aiError: unknown) {
      const duration = Date.now() - startTime;

      return NextResponse.json({
        success: false,
        model_id,
        model_name,
        provider,
        error: aiError instanceof Error ? aiError.message : String(aiError),
        duration_ms: duration
      }, { status: 500 });
    }

  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}
