import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin';
import { AI_MODELS } from '@/lib/ai-models';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permission
    try {
      requireAdmin(user.email);
    } catch {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { examId, selectedModels } = body;

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    // If selectedModels is provided, use them; otherwise use the current global model
    let modelsToUse: string[] = [];

    if (selectedModels && Array.isArray(selectedModels) && selectedModels.length > 0) {
      // Validate that all selected models exist
      modelsToUse = selectedModels.filter(modelId =>
        AI_MODELS.some(m => m.id === modelId)
      );

      if (modelsToUse.length === 0) {
        return NextResponse.json({ error: 'No valid models selected' }, { status: 400 });
      }
    } else {
      // Fallback to current global model
      const { data: settings } = await supabase
        .from('ai_settings')
        .select('model_id')
        .single();

      if (settings?.model_id) {
        modelsToUse = [settings.model_id];
      } else {
        return NextResponse.json({ error: 'No AI models configured' }, { status: 400 });
      }
    }

    // Get all questions for this exam
    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('id')
      .eq('exam_id', examId);

    if (fetchError || !questions || questions.length === 0) {
      return NextResponse.json({
        error: 'Failed to fetch questions or no questions found'
      }, { status: 500 });
    }

    const questionIds = questions.map(q => q.id);

    console.log(`🎯 Starting multi-model analysis for ${questionIds.length} questions with models:`, modelsToUse);

    // Always use the multi-model endpoint for consistency
    const analysisResponse = await fetch(`${request.nextUrl.origin}/api/ai/analyze-questions-multi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        questionIds,
        examId,
        selectedModels: modelsToUse
      })
    });

    const analysisResult = await analysisResponse.json();

    if (!analysisResult.success) {
      return NextResponse.json({
        error: 'AI analysis failed',
        details: analysisResult.error
      }, { status: 500 });
    }

    // Calculate consensus statistics
    const consensusStats = {
      totalQuestions: questionIds.length,
      modelsUsed: modelsToUse.length,
      strongConsensus: 0,
      partialConsensus: 0,
      noConsensus: 0
    };

    // If we have consensus data, calculate statistics
    if (analysisResult.consensusData) {
      for (const result of analysisResult.consensusData) {
        if (result.agreementPercentage >= 75) {
          consensusStats.strongConsensus++;
        } else if (result.agreementPercentage >= 50) {
          consensusStats.partialConsensus++;
        } else {
          consensusStats.noConsensus++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully analyzed ${analysisResult.analyzed} questions with ${modelsToUse.length} model(s)`,
      analyzed: analysisResult.analyzed,
      failed: analysisResult.failed || 0,
      errors: analysisResult.errors || [],
      modelsUsed: modelsToUse,
      consensusStats
    });

  } catch (error) {
    console.error('Re-analyze error:', error);
    return NextResponse.json({
      error: 'Failed to trigger analysis',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
