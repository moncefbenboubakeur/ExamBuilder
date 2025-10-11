import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.email !== 'monceftab@gmail.com') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Fetch all exams with user email and question count
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select(`
        id,
        name,
        user_id,
        file_name,
        created_at,
        is_sample,
        questions (count)
      `)
      .order('created_at', { ascending: false });

    if (examsError) {
      throw examsError;
    }

    // Fetch user emails using the database function
    const examsWithDetails = await Promise.all(
      (exams || []).map(async (exam) => {
        const { data: email } = await supabase
          .rpc('get_user_email', { user_uuid: exam.user_id });

        return {
          id: exam.id,
          name: exam.name,
          user_id: exam.user_id,
          user_email: email || 'Unknown',
          file_name: exam.file_name,
          created_at: exam.created_at,
          is_sample: exam.is_sample,
          question_count: exam.questions[0]?.count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      exams: examsWithDetails || []
    });

  } catch (error) {
    console.error('Failed to fetch exams:', error);
    return NextResponse.json({
      error: 'Failed to fetch exams',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
