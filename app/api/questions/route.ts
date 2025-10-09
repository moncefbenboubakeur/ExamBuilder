import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const examId = searchParams.get('exam_id');

    let query = supabase
      .from('questions')
      .select(`
        *,
        ai_analysis:question_ai_analysis(*)
      `)
      .order('question_number', { ascending: true });

    // Filter by exam_id if provided
    if (examId) {
      query = query.eq('exam_id', examId);
    }

    // Filter by IDs if provided
    if (ids) {
      const idArray = ids.split(',');
      query = query.in('id', idArray);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // Transform ai_analysis from array to single object
    const transformedData = data?.map(question => ({
      ...question,
      ai_analysis: Array.isArray(question.ai_analysis) && question.ai_analysis.length > 0
        ? question.ai_analysis[0]
        : null
    }));

    return NextResponse.json({
      success: true,
      questions: transformedData || [],
      count: transformedData?.length || 0,
    });
  } catch (error) {
    console.error('Questions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
