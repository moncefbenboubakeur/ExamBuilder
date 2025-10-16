import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * DELETE /api/exams/[id]
 * Delete an exam and all its associated questions
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: examId } = await params;

    // Verify the exam exists and belongs to the user
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, user_id, is_sample')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Check if user owns the exam
    if (exam.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this exam' },
        { status: 403 }
      );
    }

    // Prevent deletion of sample exams
    if (exam.is_sample) {
      return NextResponse.json(
        { error: 'Sample exams cannot be deleted' },
        { status: 403 }
      );
    }

    // Delete the exam (questions will be cascade deleted due to ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId);

    if (deleteError) {
      console.error('Delete exam error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete exam' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    console.error('Delete exam error:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam' },
      { status: 500 }
    );
  }
}
