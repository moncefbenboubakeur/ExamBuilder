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

    // Get all exams for the user (their own exams + sample exams + shared exams)
    // The RLS policy already handles this - it includes shared exams automatically
    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        *,
        questions:questions(count),
        exam_shares!exam_shares_exam_id_fkey(
          id,
          shared_by,
          shared_with
        )
      `)
      .order('is_sample', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching exams:', error);
      return NextResponse.json(
        { error: 'Failed to fetch exams' },
        { status: 500 }
      );
    }

    // Transform the data to include question_count and sharing info
    const examsWithCount = exams.map((exam) => {
      // Check if this exam is shared with the current user
      const sharedWithMe = exam.exam_shares?.some(
        (share: { shared_with: string }) => share.shared_with === user.id
      );

      return {
        ...exam,
        question_count: exam.questions?.[0]?.count || 0,
        is_shared_with_me: sharedWithMe,
        questions: undefined, // Remove the nested questions object
        exam_shares: undefined, // Remove the shares object from response
      };
    });

    return NextResponse.json({
      success: true,
      exams: examsWithCount,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
