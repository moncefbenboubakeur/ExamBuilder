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
    const affectedExams = [];

    if (deleteForAll && exam.name) {
      // Delete course data for all exams with the same name and question count
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

      // For each matching exam, check question count and delete course data
      for (const matchingExam of matchingExams || []) {
        // Count questions for this exam
        const { count: questionCount } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', matchingExam.id);

        // If question count matches, delete course data
        if (questionCount === exam.question_count) {
          // Delete course sections
          const { error: sectionsError } = await supabase
            .from('ai_generated_course_sections')
            .delete()
            .eq('exam_id', matchingExam.id);

          if (sectionsError) {
            console.error(`Error deleting course sections for exam ${matchingExam.id}:`, sectionsError);
            continue;
          }

          // Delete topics
          const { error: topicsError } = await supabase
            .from('ai_detected_topics')
            .delete()
            .eq('exam_id', matchingExam.id);

          if (topicsError) {
            console.error(`Error deleting topics for exam ${matchingExam.id}:`, topicsError);
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
        message: `Course data deleted for ${deletedCount} exam(s) with name "${exam.name}" and ${exam.question_count} questions`,
        deletedCount,
        affectedExams
      });

    } else {
      // Delete course data only for the specific exam (admin's exam)
      // Delete course sections
      const { error: sectionsError } = await supabase
        .from('ai_generated_course_sections')
        .delete()
        .eq('exam_id', examId);

      if (sectionsError) {
        return NextResponse.json({
          error: 'Failed to delete course sections',
          details: sectionsError.message
        }, { status: 500 });
      }

      // Delete topics
      const { error: topicsError } = await supabase
        .from('ai_detected_topics')
        .delete()
        .eq('exam_id', examId);

      if (topicsError) {
        return NextResponse.json({
          error: 'Failed to delete topics',
          details: topicsError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Course data deleted for exam "${exam.name}"`,
        deletedCount: 1,
        affectedExams: [{ id: examId, name: exam.name }]
      });
    }

  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json({
      error: 'Failed to delete course',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}