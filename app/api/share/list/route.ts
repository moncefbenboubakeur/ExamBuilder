import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/share/list
 * Get all shares for the current user (both given and received)
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get shares where user is the sharer
    const { data: sharesGiven, error: sharesGivenError } = await supabase
      .from('exam_shares')
      .select(`
        id,
        exam_id,
        shared_by,
        shared_with,
        created_at,
        exams:exam_id (
          id,
          name,
          description
        )
      `)
      .eq('shared_by', user.id);

    if (sharesGivenError) {
      console.error('Error fetching shares given:', sharesGivenError);
      return NextResponse.json(
        { error: 'Failed to fetch shares given' },
        { status: 500 }
      );
    }

    // Enrich shares with email addresses
    const enrichedSharesGiven = await Promise.all(
      (sharesGiven || []).map(async (share) => {
        // Try to get email using RPC function
        const { data: email, error: rpcError } = await supabase.rpc('get_email_by_user_id', {
          user_id: share.shared_with,
        });

        if (rpcError) {
          console.error('RPC error getting email:', rpcError);
        }

        console.log('Email for user', share.shared_with, ':', email);

        // Fallback: try to get email directly from auth.users (as admin)
        let finalEmail = email;
        if (!finalEmail) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(share.shared_with);
          if (!userError && userData?.user?.email) {
            finalEmail = userData.user.email;
            console.log('Got email from admin API:', finalEmail);
          }
        }

        return {
          ...share,
          shared_with_email: finalEmail || share.shared_with,
        };
      })
    );

    // Get shares where user is the recipient
    const { data: sharesReceived, error: sharesReceivedError } = await supabase
      .from('exam_shares')
      .select(`
        id,
        exam_id,
        shared_by,
        shared_with,
        created_at,
        exams:exam_id (
          id,
          name,
          description,
          user_id
        )
      `)
      .eq('shared_with', user.id);

    if (sharesReceivedError) {
      console.error('Error fetching shares received:', sharesReceivedError);
      return NextResponse.json(
        { error: 'Failed to fetch shares received' },
        { status: 500 }
      );
    }

    // Enrich received shares with sharer email addresses
    const enrichedSharesReceived = await Promise.all(
      (sharesReceived || []).map(async (share) => {
        const { data: email } = await supabase.rpc('get_email_by_user_id', {
          user_id: share.shared_by,
        });
        return {
          ...share,
          shared_by_email: email || share.shared_by,
        };
      })
    );

    return NextResponse.json({
      success: true,
      sharesGiven: enrichedSharesGiven,
      sharesReceived: enrichedSharesReceived,
    });
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
