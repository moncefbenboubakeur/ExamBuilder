import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { parseMarkdownTable } from '@/lib/parseMarkdown';

export async function POST(request: NextRequest) {
  try {
    // Create authenticated Supabase client
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if file is markdown
    if (!file.name.endsWith('.md')) {
      return NextResponse.json(
        { error: 'File must be a .md (Markdown) file' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Parse markdown table
    const questions = await parseMarkdownTable(content);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions found in the file' },
        { status: 400 }
      );
    }

    // Create exam name from file name
    const examName = file.name.replace('.md', '').replace(/-/g, ' ').replace(/_/g, ' ');

    // Create exam record
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .insert({
        user_id: user.id,
        name: examName,
        file_name: file.name,
        description: `Uploaded from ${file.name}`,
        is_sample: false,
      })
      .select()
      .single();

    if (examError) {
      console.error('Exam creation error:', examError);
      return NextResponse.json(
        { error: 'Failed to create exam record' },
        { status: 500 }
      );
    }

    // Insert questions into Supabase with exam_id
    const questionsToInsert = questions.map((q) => ({
      exam_id: examData.id,
      question_number: q.questionNumber,
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      community_vote: q.communityVote,
      has_illustration: q.hasIllustration,
    }));

    const { data, error } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save questions to database' },
        { status: 500 }
      );
    }

    // Trigger AI analysis asynchronously (don't block response)
    if (data && data.length > 0) {
      const questionIds = data.map(q => q.id);

      // Fire and forget - don't await
      fetch(`${request.nextUrl.origin}/api/ai/analyze-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward auth cookie for server-side auth
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          questionIds,
          examId: examData.id
        })
      }).catch(err => {
        // Log but don't fail the upload
        console.error('AI analysis trigger failed:', err);
      });
    }

    return NextResponse.json({
      success: true,
      exam: examData,
      count: questions.length,
      questions: data,
      ai_analysis_queued: true,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
