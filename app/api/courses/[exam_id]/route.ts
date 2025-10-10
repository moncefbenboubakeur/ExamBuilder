import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { loadCourse } from '@/lib/course/load';

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

    if (exam.user_id !== user.id && !exam.is_sample) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Load course data
    const courseData = await loadCourse(supabase, exam_id);

    if (!courseData) {
      return NextResponse.json({
        error: 'No course found for this exam',
        exam_id,
        status: 'not_generated'
      }, { status: 404 });
    }

    return NextResponse.json(courseData);

  } catch (error) {
    console.error('Failed to load course:', error);
    return NextResponse.json({
      error: 'Failed to load course',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
