import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { callAI, parseJSONResponse } from '@/lib/ai/callAi';
import {
  buildTopicDetectionPrompt,
  validateTopicDetectionResponse,
  QuestionForTopicDetection
} from '@/lib/ai/prompts/topicDetection';
import {
  buildLessonGenerationPrompt,
  validateLessonMarkdown,
  QuestionForLesson
} from '@/lib/ai/prompts/lessonGeneration';
import { upsertTopics, upsertCourseSections, checkCourseExists } from '@/lib/course/persist';
import { detectExamLeakage } from '@/lib/course/leakageDetection';

const REGEN_WINDOW_MINUTES = 10;
const TOPIC_DETECTION_TIMEOUT = 20000; // 20 seconds
const LESSON_GENERATION_TIMEOUT = 30000; // 30 seconds per lesson

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exam_id } = body;

    if (!exam_id) {
      return NextResponse.json({ error: 'Missing exam_id' }, { status: 400 });
    }

    // Verify exam exists and user has access
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check if user has access (owns it, it's a sample, or it's shared with them)
    const isOwner = exam.user_id === user.id;
    const isSample = exam.is_sample;

    // Check if exam is shared with user
    const { data: sharedExam } = await supabase
      .from('exam_shares')
      .select('id')
      .eq('exam_id', exam_id)
      .eq('shared_with', user.id)
      .maybeSingle();

    const isShared = !!sharedExam;

    if (!isOwner && !isSample && !isShared) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if course already exists (idempotent protection)
    const exists = await checkCourseExists(supabase, exam_id, REGEN_WINDOW_MINUTES);
    if (exists) {
      return NextResponse.json({
        message: 'Course already exists for this exam',
        exam_id,
        status: 'exists'
      });
    }

    // Get AI settings
    const { data: settings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json({
        error: 'AI settings not configured'
      }, { status: 500 });
    }

    // Check API key
    if (settings.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        error: 'Anthropic API key not configured'
      }, { status: 500 });
    }
    if (settings.provider === 'openai' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured'
      }, { status: 500 });
    }

    // Fetch questions for this exam
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', exam_id);

    if (questionsError || !questions || questions.length === 0) {
      return NextResponse.json({
        error: 'No questions found for this exam'
      }, { status: 400 });
    }

    console.log(`📚 Generating course for exam ${exam_id} with ${questions.length} questions`);

    // STEP 1: Topic Detection
    const topicDetectionPrompt = buildTopicDetectionPrompt(
      questions as QuestionForTopicDetection[]
    );

    const topicResponseText = await callAI(
      {
        provider: settings.provider,
        model_id: settings.model_id,
        model_name: settings.model_name
      },
      {
        prompt: topicDetectionPrompt,
        systemPrompt: 'You are a senior exam content analyst. Respond with valid JSON only.',
        timeoutMs: TOPIC_DETECTION_TIMEOUT,
        responseFormat: 'json'
      }
    );

    const topicResponse = parseJSONResponse(topicResponseText);
    const validatedTopics = validateTopicDetectionResponse(topicResponse);

    console.log(`✅ Detected ${validatedTopics.topics.length} topics`);

    // Save topics to database
    await upsertTopics(supabase, exam_id, validatedTopics.topics);

    // STEP 2: Generate lessons for each topic
    const courseSections = [];

    for (let i = 0; i < validatedTopics.topics.length; i++) {
      const topic = validatedTopics.topics[i];
      console.log(`📝 Generating lesson ${i + 1}/${validatedTopics.topics.length}: ${topic.name}`);

      // Get questions for this topic
      const topicQuestions = questions.filter(q =>
        topic.question_ids.includes(q.id)
      ) as QuestionForLesson[];

      const lessonPrompt = buildLessonGenerationPrompt({
        topicName: topic.name,
        concepts: topic.concepts,
        questions: topicQuestions
      });

      const lessonMarkdown = await callAI(
        {
          provider: settings.provider,
          model_id: settings.model_id,
          model_name: settings.model_name
        },
        {
          prompt: lessonPrompt,
          systemPrompt: 'You are a master instructor. Respond with Markdown content only.',
          timeoutMs: LESSON_GENERATION_TIMEOUT,
          maxTokens: 2000,
          responseFormat: 'text'
        }
      );

      // Validate lesson structure
      validateLessonMarkdown(lessonMarkdown, topic.name);

      // Check for exam text leakage
      const leakageCheck = detectExamLeakage(
        lessonMarkdown,
        topicQuestions.map(q => ({
          question_text: q.question_text,
          options: q.options
        }))
      );

      if (leakageCheck.hasLeakage) {
        console.warn(`⚠️  Leakage detected in topic "${topic.name}": ${leakageCheck.details}`);
        // In production, you might want to reject this or sanitize further
        // For now, we'll log it and continue
      }

      courseSections.push({
        exam_id,
        topic_name: topic.name,
        content_md: lessonMarkdown,
        order_index: i
      });
    }

    // Save course sections to database
    await upsertCourseSections(supabase, exam_id, courseSections);

    console.log(`✅ Course generation complete for exam ${exam_id}`);

    return NextResponse.json({
      success: true,
      exam_id,
      topics: validatedTopics.topics.map(t => ({
        topic_name: t.name,
        status: 'generated'
      })),
      total_sections: courseSections.length
    });

  } catch (error) {
    console.error('Course generation error:', error);
    return NextResponse.json({
      error: 'Course generation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
