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

    // Get all exams for the user (their own exams + sample exams)
    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        *,
        questions:questions(count)
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

    // Transform the data to include question_count
    const examsWithCount = exams.map((exam) => ({
      ...exam,
      question_count: exam.questions?.[0]?.count || 0,
      questions: undefined, // Remove the nested questions object
    }));

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
