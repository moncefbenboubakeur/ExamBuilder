import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = user.email === 'monceftab@gmail.com';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { examId, deleteForAll } = body;

    if (!examId) {
      return NextResponse.json({ error: 'Missing examId' }, { status: 400 });
    }

    // Get exam details to find similar exams
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('name, question_count')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    let deletedCount = 0;
    let affectedExams = [];

    if (deleteForAll && exam.name) {
      // Delete all exams with the same name and question count for all users
      // First, find all matching exams
      const { data: matchingExams, error: matchError } = await supabase
        .from('exams')
        .select('id, name, user_id')
        .eq('name', exam.name);

      if (matchError) {
        console.error('Error finding matching exams:', matchError);
        return NextResponse.json({
          error: 'Failed to find matching exams',
          details: matchError.message
        }, { status: 500 });
      }

      // For each matching exam, check question count and delete if it matches
      for (const matchingExam of matchingExams || []) {
        // Count questions for this exam
        const { count: questionCount } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', matchingExam.id);

        // If question count matches, delete the exam
        if (questionCount === exam.question_count) {
          // Delete exam (cascade will handle questions, sessions, answers, courses)
          const { error: deleteError } = await supabase
            .from('exams')
            .delete()
            .eq('id', matchingExam.id);

          if (deleteError) {
            console.error(`Error deleting exam ${matchingExam.id}:`, deleteError);
            continue;
          }

          affectedExams.push({
            id: matchingExam.id,
            name: matchingExam.name,
            user_id: matchingExam.user_id
          });
          deletedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} exam(s) with name "${exam.name}" and ${exam.question_count} questions`,
        deletedCount,
        affectedExams
      });

    } else {
      // Delete only the specific exam
      // As admin, we'll delete it regardless of ownership
      const { error: deleteError } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (deleteError) {
        return NextResponse.json({
          error: 'Failed to delete exam',
          details: deleteError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Exam "${exam.name}" deleted successfully`,
        deletedCount: 1,
        affectedExams: [{ id: examId, name: exam.name }]
      });
    }

  } catch (error) {
    console.error('Delete exam error:', error);
    return NextResponse.json({
      error: 'Failed to delete exam',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}