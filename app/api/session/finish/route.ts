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
    const { sessionId, elapsedTime = 0 } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get all answers for this session
    const { data: answers, error: answersError } = await supabase
      .from('exam_answers')
      .select('*')
      .eq('session_id', sessionId);

    if (answersError) {
      console.error('Answers fetch error:', answersError);
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }

    // Calculate results
    const totalQuestions = answers?.length || 0;
    const correctCount = answers?.filter((a) => a.is_correct).length || 0;
    const wrongCount = totalQuestions - correctCount;
    const score = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    // Update session with final results
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .update({
        completed: true,
        total_questions: totalQuestions,
        correct_count: correctCount,
        wrong_count: wrongCount,
        score,
        elapsed_time: elapsedTime,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (sessionError) {
      console.error('Session update error:', sessionError);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    // Get wrong question IDs for retry
    const wrongQuestionIds = answers
      ?.filter((a) => !a.is_correct)
      .map((a) => a.question_id) || [];

    return NextResponse.json({
      success: true,
      session,
      results: {
        totalQuestions,
        correctCount,
        wrongCount,
        score,
        wrongQuestionIds,
      },
    });
  } catch (error) {
    console.error('Finish session error:', error);
    return NextResponse.json(
      { error: 'Failed to finish exam session' },
      { status: 500 }
    );
  }
}
