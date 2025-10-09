import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('exam_id');

    // Get questions for this exam
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text')
      .eq('exam_id', examId)
      .limit(3);

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }

    // Check if AI analysis exists for these questions
    const questionIds = questions?.map(q => q.id) || [];
    const { data: aiData, error: aiError } = await supabase
      .from('question_ai_analysis')
      .select('*')
      .in('question_id', questionIds);

    if (aiError) {
      return NextResponse.json({ error: aiError.message }, { status: 500 });
    }

    // Check AI settings
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('*')
      .single();

    return NextResponse.json({
      success: true,
      questions: questions,
      aiAnalysisCount: aiData?.length || 0,
      aiAnalysisData: aiData,
      aiSettings: settings,
      settingsError: settingsError?.message
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      error: 'Failed to fetch debug data',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
