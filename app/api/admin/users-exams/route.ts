import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

interface ExamWithSharing {
  exam_id: string;
  exam_name: string;
  question_count: number;
  created_at: string;
  is_owner: boolean;
  owner_email: string;
  shared_by_email?: string;
}

interface UserExamsData {
  user_id: string;
  user_email: string;
  exams: ExamWithSharing[];
}

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

    // Fetch all users from auth.users
    const { data: users, error: usersError } = await supabase
      .rpc('get_all_users');

    if (usersError) {
      throw usersError;
    }

    // For each user, get their owned exams and shared exams
    const userExamsData: UserExamsData[] = [];

    for (const userData of users || []) {
      const userId = userData.id;
      const userEmail = userData.email;

      // Get owned exams
      const { data: ownedExams } = await supabase
        .from('exams')
        .select(`
          id,
          name,
          created_at,
          questions (count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get shared exams
      const { data: sharedExams } = await supabase
        .from('exam_shares')
        .select(`
          exam_id,
          shared_by,
          exams!inner (
            id,
            name,
            created_at,
            user_id,
            questions (count)
          )
        `)
        .eq('shared_with', userId);

      const exams: ExamWithSharing[] = [];

      // Add owned exams
      if (ownedExams) {
        for (const exam of ownedExams) {
          exams.push({
            exam_id: exam.id,
            exam_name: exam.name,
            question_count: exam.questions[0]?.count || 0,
            created_at: exam.created_at,
            is_owner: true,
            owner_email: userEmail,
          });
        }
      }

      // Add shared exams
      if (sharedExams) {
        for (const share of sharedExams) {
          // Type assertion for Supabase join response
          const examData = (share as unknown as { exams: { id: string; name: string; created_at: string; user_id: string; questions: { count: number }[] } }).exams;
          if (examData) {
            // Get the email of the person who shared it
            const { data: sharedByEmail } = await supabase
              .rpc('get_user_email', { user_uuid: share.shared_by });

            // Get the email of the owner
            const { data: ownerEmail } = await supabase
              .rpc('get_user_email', { user_uuid: examData.user_id });

            exams.push({
              exam_id: examData.id,
              exam_name: examData.name,
              question_count: examData.questions[0]?.count || 0,
              created_at: examData.created_at,
              is_owner: false,
              owner_email: ownerEmail || 'Unknown',
              shared_by_email: sharedByEmail || 'Unknown',
            });
          }
        }
      }

      // Only add users who have exams
      if (exams.length > 0) {
        userExamsData.push({
          user_id: userId,
          user_email: userEmail,
          exams: exams.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
        });
      }
    }

    return NextResponse.json({
      success: true,
      users: userExamsData,
    });

  } catch (error) {
    console.error('Failed to fetch user exams:', error);
    return NextResponse.json({
      error: 'Failed to fetch user exams',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
