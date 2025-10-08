import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
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

    // Get all completed sessions for the user
    const { data: sessions, error } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Stats fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch session stats' },
        { status: 500 }
      );
    }

    // Calculate aggregate stats
    const totalSessions = sessions?.length || 0;
    const averageScore = totalSessions > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / totalSessions)
      : 0;
    const bestScore = totalSessions > 0
      ? Math.max(...sessions.map((s) => s.score))
      : 0;
    const totalQuestions = sessions?.reduce((sum, s) => sum + s.total_questions, 0) || 0;
    const totalCorrect = sessions?.reduce((sum, s) => sum + s.correct_count, 0) || 0;

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      stats: {
        totalSessions,
        averageScore,
        bestScore,
        totalQuestions,
        totalCorrect,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
