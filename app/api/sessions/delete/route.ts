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
    const { sessionIds } = body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'Session IDs are required' },
        { status: 400 }
      );
    }

    console.log(`Delete request for ${sessionIds.length} sessions:`, sessionIds);
    console.log(`Authenticated user ID: ${user.id}`);

    // First, verify which sessions actually belong to this user
    const { data: userSessions, error: verifyError } = await supabase
      .from('exam_sessions')
      .select('id, user_id')
      .in('id', sessionIds);

    if (verifyError) {
      console.error('Error verifying sessions:', verifyError);
    } else {
      console.log(`Found ${userSessions?.length || 0} sessions in database`);
      const ownedSessions = userSessions?.filter(s => s.user_id === user.id) || [];
      console.log(`User owns ${ownedSessions.length} of these sessions`);
      if (userSessions && userSessions.length > ownedSessions.length) {
        const notOwned = userSessions.filter(s => s.user_id !== user.id);
        console.log(`Sessions not owned by user:`, notOwned);
      }
    }

    // Delete exam answers first (due to foreign key constraint)
    const { error: answersError } = await supabase
      .from('exam_answers')
      .delete()
      .in('session_id', sessionIds);

    if (answersError) {
      console.error('Error deleting exam answers:', answersError);
      return NextResponse.json(
        { error: 'Failed to delete exam answers' },
        { status: 500 }
      );
    }

    console.log(`Deleted exam answers for ${sessionIds.length} sessions`);

    // Delete exam sessions (only user's own sessions)
    const { error: sessionsError, count } = await supabase
      .from('exam_sessions')
      .delete({ count: 'exact' })
      .in('id', sessionIds)
      .eq('user_id', user.id);

    if (sessionsError) {
      console.error('Error deleting sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to delete sessions' },
        { status: 500 }
      );
    }

    const actualDeletedCount = count || 0;
    console.log(`Successfully deleted ${actualDeletedCount} exam sessions out of ${sessionIds.length} requested`);

    if (actualDeletedCount === 0) {
      console.warn('No sessions were deleted - check RLS policies or user ownership');
    }

    return NextResponse.json({
      success: true,
      deletedCount: actualDeletedCount,
      requestedCount: sessionIds.length,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
