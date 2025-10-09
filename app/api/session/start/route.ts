import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { questionIds, examId } = body;

    // Check if there's already an incomplete session for this exam
    const { data: existingSession } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If an incomplete session exists, return it instead of creating a new one
    if (existingSession) {
      return NextResponse.json({
        success: true,
        session: existingSession,
      });
    }

    // Create a new exam session
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .insert({
        user_id: user.id,
        exam_id: examId,
        completed: false,
        total_questions: questionIds?.length || 0,
        score: 0,
        correct_count: 0,
        wrong_count: 0,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create exam session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Start session error:', error);
    return NextResponse.json(
      { error: 'Failed to start exam session' },
      { status: 500 }
    );
  }
}
