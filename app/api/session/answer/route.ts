import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { reverseMapAnswer } from '@/lib/shuffleUtils';

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
    const { sessionId, questionId, selectedAnswer, isCorrect } = body;

    if (!sessionId || !questionId || !selectedAnswer) {
      return NextResponse.json(
        { error: 'Session ID, question ID, and selected answer are required' },
        { status: 400 }
      );
    }

    // Fetch session to get shuffle mapping (if any)
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('shuffled_options_map')
      .eq('id', sessionId)
      .single();

    // If options were shuffled, reverse-map the answer back to original
    let answerToStore = selectedAnswer;
    if (session?.shuffled_options_map && session.shuffled_options_map[questionId]) {
      answerToStore = reverseMapAnswer(
        selectedAnswer,
        session.shuffled_options_map[questionId]
      );
    }

    // Check if answer already exists for this question in this session
    const { data: existing } = await supabase
      .from('exam_answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
      .single();

    let result;

    if (existing) {
      // Update existing answer (store original answer, not shuffled)
      const { data, error } = await supabase
        .from('exam_answers')
        .update({
          selected_answer: answerToStore,
          is_correct: isCorrect,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Answer update error:', error);
        return NextResponse.json(
          { error: 'Failed to update answer' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Insert new answer (store original answer, not shuffled)
      const { data, error } = await supabase
        .from('exam_answers')
        .insert({
          session_id: sessionId,
          question_id: questionId,
          selected_answer: answerToStore,
          is_correct: isCorrect,
        })
        .select()
        .single();

      if (error) {
        console.error('Answer insert error:', error);
        return NextResponse.json(
          { error: 'Failed to save answer' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      answer: result,
    });
  } catch (error) {
    console.error('Save answer error:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}
