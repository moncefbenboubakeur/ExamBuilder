import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function DELETE(
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

    // Check if user is admin
    if (user.email !== 'monceftab@gmail.com') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    if (!exam_id) {
      return NextResponse.json({ error: 'Missing exam_id' }, { status: 400 });
    }

    // Verify exam exists
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, name, user_id')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Delete the exam (cascade deletes will handle questions, sessions, etc.)
    const { error: deleteError } = await supabase
      .from('exams')
      .delete()
      .eq('id', exam_id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: `Exam "${exam.name}" deleted successfully`,
      exam_id
    });

  } catch (error) {
    console.error('Failed to delete exam:', error);
    return NextResponse.json({
      error: 'Failed to delete exam',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
