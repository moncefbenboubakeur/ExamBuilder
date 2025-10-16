import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createShuffleData } from '@/lib/shuffleUtils';
import { Question } from '@/lib/supabaseClient';

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

    // Fetch user preferences for shuffle settings
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Default to both shuffles enabled if no preferences found
    const shuffleQuestions = preferences?.shuffle_questions ?? true;
    const shuffleOptions = preferences?.shuffle_options ?? true;

    // Fetch all questions for the exam to apply shuffle logic
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('question_number', { ascending: true });

    if (questionsError || !questions) {
      return NextResponse.json(
        { error: 'Failed to fetch questions for shuffle' },
        { status: 500 }
      );
    }

    // Create shuffle data based on user preferences
    const { shuffledQuestionOrder, shuffledOptionsMap } = createShuffleData(
      questions as Question[],
      shuffleQuestions,
      shuffleOptions
    );

    // Create a new exam session with shuffle data
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
        shuffled_question_order: shuffledQuestionOrder,
        shuffled_options_map: shuffledOptionsMap,
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
