import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

    // Get all completed exam sessions for the user
    const { data: sessions, error } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true);

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalExams = sessions?.length || 0;
    const averageScore = totalExams > 0
      ? Math.round(sessions!.reduce((sum, s) => sum + s.score, 0) / totalExams)
      : 0;
    const bestScore = totalExams > 0
      ? Math.max(...sessions!.map(s => s.score))
      : 0;
    const totalQuestions = sessions?.reduce((sum, s) => sum + s.total_questions, 0) || 0;
    const totalCorrect = sessions?.reduce((sum, s) => sum + s.correct_count, 0) || 0;
    const totalTimeSpent = sessions?.reduce((sum, s) => sum + (s.elapsed_time || 0), 0) || 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSessions = sessions?.filter(s =>
      new Date(s.created_at) >= sevenDaysAgo
    ) || [];

    // Calculate score trend (last 10 exams)
    const recentTrend = sessions?.slice(0, 10).reverse().map(s => ({
      date: new Date(s.created_at).toLocaleDateString(),
      score: s.score,
    })) || [];

    return NextResponse.json({
      success: true,
      stats: {
        totalExams,
        averageScore,
        bestScore,
        totalQuestions,
        totalCorrect,
        totalTimeSpent,
        recentActivity: recentSessions.length,
        scoreTrend: recentTrend,
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
