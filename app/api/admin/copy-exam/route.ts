import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { examId, targetUserEmail } = body;

    if (!examId || !targetUserEmail) {
      return NextResponse.json(
        { error: 'Missing examId or targetUserEmail' },
        { status: 400 }
      );
    }

    // Get the target user by email using RPC function
    const { data: allUsers, error: userError } = await supabase
      .rpc('get_all_users');

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    const targetUser = allUsers?.find((u: { email: string }) => u.email === targetUserEmail);

    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email ${targetUserEmail} not found` },
        { status: 404 }
      );
    }

    const targetUserId = targetUser.id;

    // Use admin client to bypass RLS for copying exams
    const adminClient = createAdminClient();

    // Get the original exam
    const { data: exam, error: examError } = await adminClient
      .from('exams')
      .select('*')
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
        { error: 'You can only copy your own exams' },
        { status: 403 }
      );
    }

    // Get all questions for this exam
    const { data: questions, error: questionsError } = await adminClient
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('question_number');

    if (questionsError) {
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // Create a new exam for the target user (using admin client to bypass RLS)
    const { data: newExam, error: newExamError } = await adminClient
      .from('exams')
      .insert({
        user_id: targetUserId,
        name: exam.name,
        file_name: exam.file_name,
        description: exam.description,
        is_sample: false,
      })
      .select()
      .single();

    if (newExamError || !newExam) {
      console.error('Error creating new exam:', newExamError);
      return NextResponse.json(
        { error: 'Failed to create new exam' },
        { status: 500 }
      );
    }

    // Copy all questions to the new exam
    if (questions && questions.length > 0) {
      const newQuestions = questions.map((q) => ({
        exam_id: newExam.id,
        question_number: q.question_number,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        community_vote: q.community_vote,
        has_illustration: q.has_illustration,
      }));

      const { error: insertQuestionsError } = await adminClient
        .from('questions')
        .insert(newQuestions);

      if (insertQuestionsError) {
        // Rollback: delete the exam if questions failed
        await adminClient.from('exams').delete().eq('id', newExam.id);
        return NextResponse.json(
          { error: 'Failed to copy questions' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Exam "${exam.name}" successfully copied to ${targetUserEmail}`,
      newExamId: newExam.id,
    });
  } catch (error) {
    console.error('Error copying exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
