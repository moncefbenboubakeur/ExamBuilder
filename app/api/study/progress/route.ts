import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { exam_id, topic_name, completed } = body;

    // Validate required fields
    if (!exam_id || !topic_name) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['exam_id', 'topic_name']
      }, { status: 400 });
    }

    // Verify exam exists and user has access
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check if user has access (owns it, it's a sample, or it's shared with them)
    const isOwner = exam.user_id === user.id;
    const isSample = exam.is_sample;

    // Check if exam is shared with user
    const { data: sharedExam } = await supabase
      .from('exam_shares')
      .select('id')
      .eq('exam_id', exam_id)
      .eq('shared_with', user.id)
      .maybeSingle();

    const isShared = !!sharedExam;

    if (!isOwner && !isSample && !isShared) {
      return NextResponse.json({ error: 'Unauthorized access to this exam' }, { status: 403 });
    }

    // Upsert study progress
    const { data: progress, error: progressError } = await supabase
      .from('study_progress')
      .upsert({
        user_id: user.id,
        exam_id,
        topic_name,
        completed: completed ?? false,
        last_visited_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,exam_id,topic_name'
      })
      .select()
      .single();

    if (progressError) {
      console.error('Failed to save study progress:', progressError);
      return NextResponse.json({
        error: 'Failed to save progress',
        details: progressError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: progress
    });

  } catch (error) {
    console.error('Failed to process study progress:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
