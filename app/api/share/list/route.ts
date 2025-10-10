import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/share/list
 * Get all shares for the current user (both given and received)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shares where user is the sharer
    const { data: sharesGiven, error: sharesGivenError } = await supabase
      .from('exam_shares')
      .select(`
        id,
        exam_id,
        shared_by,
        shared_with,
        created_at,
        exams:exam_id (
          id,
          name,
          description
        )
      `)
      .eq('shared_by', user.id);

    if (sharesGivenError) {
      console.error('Error fetching shares given:', sharesGivenError);
      return NextResponse.json(
        { error: 'Failed to fetch shares given' },
        { status: 500 }
      );
    }

    // Get shares where user is the recipient
    const { data: sharesReceived, error: sharesReceivedError } = await supabase
      .from('exam_shares')
      .select(`
        id,
        exam_id,
        shared_by,
        shared_with,
        created_at,
        exams:exam_id (
          id,
          name,
          description,
          user_id
        )
      `)
      .eq('shared_with', user.id);

    if (sharesReceivedError) {
      console.error('Error fetching shares received:', sharesReceivedError);
      return NextResponse.json(
        { error: 'Failed to fetch shares received' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sharesGiven: sharesGiven || [],
      sharesReceived: sharesReceived || [],
    });
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
