import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin';

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
    const { examId } = body;

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
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

    // Trigger AI analysis
    const analysisResponse = await fetch(`${request.nextUrl.origin}/api/ai/analyze-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        questionIds,
        examId
      })
    });

    const analysisResult = await analysisResponse.json();

    if (!analysisResult.success) {
      return NextResponse.json({
        error: 'AI analysis failed',
        details: analysisResult.error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully analyzed ${analysisResult.analyzed} questions`,
      analyzed: analysisResult.analyzed,
      failed: analysisResult.failed,
      errors: analysisResult.errors
    });

  } catch (error) {
    console.error('Re-analyze error:', error);
    return NextResponse.json({
      error: 'Failed to trigger analysis',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
