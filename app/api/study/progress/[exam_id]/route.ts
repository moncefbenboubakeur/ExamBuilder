import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ exam_id: string }> }
) {
  try {
    const supabase = await createClient();
    const { exam_id } = await context.params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!exam_id) {
      return NextResponse.json({ error: 'Missing exam_id' }, { status: 400 });
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

    // Fetch study progress for this exam
    const { data: progress, error: progressError } = await supabase
      .from('study_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('exam_id', exam_id)
      .order('last_visited_at', { ascending: false });

    if (progressError) {
      console.error('Failed to fetch study progress:', progressError);
      return NextResponse.json({
        error: 'Failed to fetch progress',
        details: progressError.message
      }, { status: 500 });
    }

    // Calculate progress statistics
    const totalTopics = progress.length;
    const completedTopics = progress.filter(p => p.completed).length;
    const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Find last visited topic
    const lastVisited = progress.length > 0 ? progress[0] : null;

    return NextResponse.json({
      exam_id,
      progress: progress || [],
      statistics: {
        total_topics: totalTopics,
        completed_topics: completedTopics,
        completion_percentage: completionPercentage,
        last_visited_topic: lastVisited ? {
          topic_name: lastVisited.topic_name,
          visited_at: lastVisited.last_visited_at
        } : null
      }
    });

  } catch (error) {
    console.error('Failed to load study progress:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
