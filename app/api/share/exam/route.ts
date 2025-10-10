import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/share/exam
 * Share an exam with another user by email
 */
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

    // Verify the exam exists and user owns it
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('id, name, user_id')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    if (exam.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only share your own exams' },
        { status: 403 }
      );
    }

    // Get target user by email
    // Note: We need to query auth.users which requires RPC or admin access
    // For now, we'll use a workaround by checking if they have any exams
    const { data: targetUserExams } = await supabase
      .from('exams')
      .select('user_id')
      .limit(1);

    // Better approach: Use Supabase Edge Function or create a custom RPC
    // For now, let's try to get user from public profiles if it exists,
    // otherwise we need to handle this differently

    // Create a function to get user by email (requires database function)
    const { data: targetUserData, error: targetUserError } = await supabase
      .rpc('get_user_id_by_email', { email: targetUserEmail });

    if (targetUserError || !targetUserData) {
      return NextResponse.json(
        { error: `User with email ${targetUserEmail} not found. They may need to sign up first.` },
        { status: 404 }
      );
    }

    const targetUserId = targetUserData;

    // Check if already shared
    const { data: existingShare } = await supabase
      .from('exam_shares')
      .select('id')
      .eq('exam_id', examId)
      .eq('shared_with', targetUserId)
      .single();

    if (existingShare) {
      return NextResponse.json(
        { error: 'Exam is already shared with this user' },
        { status: 400 }
      );
    }

    // Create the share
    const { data: share, error: shareError } = await supabase
      .from('exam_shares')
      .insert({
        exam_id: examId,
        shared_by: user.id,
        shared_with: targetUserId,
      })
      .select()
      .single();

    if (shareError) {
      console.error('Error creating share:', shareError);
      return NextResponse.json(
        { error: 'Failed to share exam' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Exam "${exam.name}" successfully shared with ${targetUserEmail}`,
      share,
    });
  } catch (error) {
    console.error('Error sharing exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/share/exam
 * Unshare an exam (remove sharing)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json(
        { error: 'Missing shareId parameter' },
        { status: 400 }
      );
    }

    // Delete the share (RLS will ensure user owns it via shared_by)
    const { error: deleteError } = await supabase
      .from('exam_shares')
      .delete()
      .eq('id', shareId)
      .eq('shared_by', user.id);

    if (deleteError) {
      console.error('Error deleting share:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove share' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Share removed successfully',
    });
  } catch (error) {
    console.error('Error removing share:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
