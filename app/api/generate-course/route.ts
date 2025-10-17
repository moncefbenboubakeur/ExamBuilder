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

const REGEN_WINDOW_MINUTES = process.env.NODE_ENV === 'production' ? 1 : 0;
const TOPIC_DETECTION_TIMEOUT = 20000; // 20 seconds
const LESSON_GENERATION_TIMEOUT = 30000; // 30 seconds per lesson

// Enhanced logging utility
function logStep(step: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📚 ${step}`, data ? JSON.stringify(data, null, 2) : '');
}

function logError(step: string, error: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ❌ ${step}`, {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    details: error
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let exam_id: string | undefined;

  try {
    logStep('🚀 Course generation started');
    const supabase = await createClient();

    // Check authentication
    logStep('🔐 Checking authentication');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logError('Authentication failed', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logStep('✅ Authentication successful', { user_id: user.id });

    const body = await request.json();
    exam_id = body.exam_id;
    const force = body.force || false;

    if (!exam_id) {
      logError('Missing exam_id in request body', { body });
      return NextResponse.json({ error: 'Missing exam_id' }, { status: 400 });
    }

    logStep('📋 Request details', { exam_id, force, user_id: user.id });

    // Verify exam exists and user has access
    logStep('🔍 Verifying exam exists and checking access');
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) {
      logError('Exam not found', { exam_id, examError });
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

    logStep('✅ Exam access verified', {
      exam_id,
      title: exam.title,
      isOwner,
      isSample,
      isShared
    });

    if (!isOwner && !isSample && !isShared) {
      logError('User not authorized to access exam', { exam_id, user_id: user.id });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if course already exists (idempotent protection)
    // Skip check if force=true
    if (!force) {
      const exists = await checkCourseExists(supabase, exam_id, REGEN_WINDOW_MINUTES);
      if (exists) {
        return NextResponse.json({
          message: 'Course already exists for this exam',
          exam_id,
          status: 'exists'
        });
      }
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
    logStep('📥 Fetching questions for exam');
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', exam_id);

    if (questionsError || !questions || questions.length === 0) {
      logError('No questions found for exam', { exam_id, questionsError, questionCount: questions?.length });
      return NextResponse.json({
        error: 'No questions found for this exam'
      }, { status: 400 });
    }

    logStep(`✅ Found ${questions.length} questions`, { exam_id, questionCount: questions.length });

    // STEP 1: Topic Detection
    logStep('🎯 Starting topic detection', { provider: settings.provider, model: settings.model_name });
    const topicStartTime = Date.now();

    try {
      const topicDetectionPrompt = buildTopicDetectionPrompt(
        questions as QuestionForTopicDetection[]
      );

      logStep('🤖 Calling AI for topic detection');
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
      const expectedQuestionIds = questions.map(q => q.id);
      const validatedTopics = validateTopicDetectionResponse(topicResponse, expectedQuestionIds);

      const topicDuration = ((Date.now() - topicStartTime) / 1000).toFixed(2);
      logStep(`✅ Detected ${validatedTopics.topics.length} topics in ${topicDuration}s`, {
        topics: validatedTopics.topics.map(t => ({ name: t.name, questionCount: t.question_ids.length }))
      });

      // Save topics to database
      logStep('💾 Saving topics to database');
      await upsertTopics(supabase, exam_id, validatedTopics.topics);
      logStep('✅ Topics saved successfully');

      // STEP 2: Generate lessons for each topic IN PARALLEL (70% speed improvement!)
      logStep(`🚀 Starting PARALLEL lesson generation for ${validatedTopics.topics.length} topics`);
      const lessonStartTime = Date.now();

      // Generate all lessons concurrently instead of sequentially
      const courseSections = await Promise.all(
        validatedTopics.topics.map(async (topic, i) => {
          const lessonTopicStartTime = Date.now();
          try {
            logStep(`📝 [${i + 1}/${validatedTopics.topics.length}] Generating lesson: ${topic.name}`);

            // Get questions for this topic
            const topicQuestions = questions.filter(q =>
              topic.question_ids.includes(q.id)
            ) as QuestionForLesson[];

            const lessonPrompt = buildLessonGenerationPrompt({
              topicName: topic.name,
              concepts: topic.concepts,
              questions: topicQuestions
            });

            logStep(`🤖 [${i + 1}/${validatedTopics.topics.length}] Calling AI for lesson: ${topic.name}`);
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
              logError(`⚠️  Leakage detected in topic: ${topic.name}`, {
                topic: topic.name,
                details: leakageCheck.details
              });
            }

            const lessonDuration = ((Date.now() - lessonTopicStartTime) / 1000).toFixed(2);
            logStep(`✅ [${i + 1}/${validatedTopics.topics.length}] Completed lesson: ${topic.name} in ${lessonDuration}s`);

            return {
              exam_id: exam_id!,
              topic_name: topic.name,
              content_md: lessonMarkdown,
              order_index: i
            };
          } catch (error) {
            logError(`Failed to generate lesson for topic: ${topic.name}`, {
              topic: topic.name,
              index: i,
              error
            });
            throw error; // Re-throw to fail the entire generation
          }
        })
      );

      const lessonDuration = ((Date.now() - lessonStartTime) / 1000).toFixed(2);
      logStep(`✅ All ${courseSections.length} lessons generated in ${lessonDuration}s (parallel processing)`);

      // Save course sections to database
      logStep('💾 Saving course sections to database');
      await upsertCourseSections(supabase, exam_id, courseSections);
      logStep('✅ Course sections saved successfully');

      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
      logStep(`🎉 Course generation complete for exam ${exam_id} in ${totalDuration}s`, {
        exam_id,
        totalSections: courseSections.length,
        totalDuration: `${totalDuration}s`
      });

      return NextResponse.json({
        success: true,
        exam_id,
        topics: validatedTopics.topics.map(t => ({
          topic_name: t.name,
          status: 'generated'
        })),
        total_sections: courseSections.length,
        generation_time_seconds: parseFloat(totalDuration)
      });

    } catch (topicError) {
      logError('Topic detection failed', topicError);
      return NextResponse.json({
        error: 'Topic detection failed',
        details: topicError instanceof Error ? topicError.message : String(topicError),
        phase: 'topic_detection'
      }, { status: 500 });
    }

  } catch (error) {
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    logError(`Course generation failed after ${totalDuration}s`, {
      exam_id,
      error,
      duration: totalDuration
    });

    return NextResponse.json({
      error: 'Course generation failed',
      details: error instanceof Error ? error.message : String(error),
      exam_id,
      duration_seconds: parseFloat(totalDuration)
    }, { status: 500 });
  }
}
