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

    const testPrompt = 'Say "Hello! I am working correctly." in a single sentence.';
    const startTime = Date.now();

    try {
      const response = await callAI(
        {
          provider,
          model_id,
          model_name
        },
        {
          prompt: testPrompt,
          systemPrompt: 'You are a helpful AI assistant. Respond concisely.',
          timeoutMs: 10000, // 10 second timeout for test
          maxTokens: 50,
          responseFormat: 'text'
        }
      );

      const duration = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        model_id,
        model_name,
        provider,
        test_prompt: testPrompt,
        response: response.trim(),
        duration_ms: duration
      });

    } catch (aiError: any) {
      const duration = Date.now() - startTime;

      return NextResponse.json({
        success: false,
        model_id,
        model_name,
        provider,
        test_prompt: testPrompt,
        error: aiError.message || String(aiError),
        duration_ms: duration
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
}
