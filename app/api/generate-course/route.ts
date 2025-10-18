import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { callAI, parseJSONResponse } from '@/lib/ai/callAi';
import {
  buildTopicDetectionPrompt,
  validateTopicDetectionResponse,
  QuestionForTopicDetection,
  DetectedTopic,
  TopicDetectionResponse
} from '@/lib/ai/prompts/topicDetection';
import {
  buildLessonGenerationPrompt,
  validateLessonMarkdown,
  QuestionForLesson
} from '@/lib/ai/prompts/lessonGeneration';
import { upsertTopics, upsertCourseSections, checkCourseExists } from '@/lib/course/persist';
import { detectExamLeakage } from '@/lib/course/leakageDetection';

const REGEN_WINDOW_MINUTES = process.env.NODE_ENV === 'production' ? 1 : 0;
const TOPIC_DETECTION_TIMEOUT = 120000; // 120 seconds (2 minutes) for large exams
const LESSON_GENERATION_TIMEOUT = 30000; // 30 seconds per lesson

// Enhanced logging utility
function logStep(step: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📚 ${step}`, data ? JSON.stringify(data, null, 2) : '');
}

function logError(step: string, error: unknown) {
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
      let validatedTopics: { topics: DetectedTopic[] };

      // For large exams (>100 questions), process in batches
      if (questions.length > 100) {
        logStep(`📦 Large exam detected (${questions.length} questions), processing in batches`);

        const BATCH_SIZE = 75; // Increased batch size to reduce API calls
        const batches: QuestionForTopicDetection[][] = [];

        for (let i = 0; i < questions.length; i += BATCH_SIZE) {
          batches.push(questions.slice(i, i + BATCH_SIZE) as QuestionForTopicDetection[]);
        }

        logStep(`📊 Created ${batches.length} batches of ~${BATCH_SIZE} questions each`);

        // Process first batch to get initial topics
        logStep(`🔍 Processing batch 1/${batches.length} (${batches[0].length} questions)`);
        const firstBatchPrompt = buildTopicDetectionPrompt(batches[0]);

        const firstBatchResponse = await callAI(
          {
            provider: settings.provider,
            model_id: settings.model_id,
            model_name: settings.model_name
          },
          {
            prompt: firstBatchPrompt,
            systemPrompt: 'You are a senior exam content analyst. Respond with valid JSON only.',
            timeoutMs: 60000, // 60 seconds per batch
            maxTokens: 4000,
            responseFormat: 'json'
          }
        );

        const firstBatchTopics = parseJSONResponse(firstBatchResponse) as TopicDetectionResponse;
        const allTopics = [...firstBatchTopics.topics];

        // Process remaining batches and merge into existing topics
        for (let i = 1; i < batches.length; i++) {
          logStep(`🔍 Processing batch ${i + 1}/${batches.length} (${batches[i].length} questions)`);

          // Build a more concise prompt for subsequent batches
          const topicNames = allTopics.map(t => t.name).join(', ');

          // Create a simplified question format to reduce prompt size
          const simplifiedQuestions = batches[i].map(q => ({
            id: q.id,
            text: q.question_text.substring(0, 150) + (q.question_text.length > 150 ? '...' : ''),
            correct: q.correct_answer
          }));

          const batchPrompt = `Existing topics: ${topicNames}

Analyze these ${batches[i].length} questions and group them into topics. Use existing topic names when appropriate, create new ones if needed.

Questions (simplified):
${simplifiedQuestions.map(q => `ID: ${q.id}\nQ: ${q.text}\nAnswer: ${q.correct}`).join('\n---\n')}

Return JSON with topic assignments:
{
  "topics": [
    {"name": "Topic Name", "question_ids": ["id1","id2"], "concepts": ["concept1","concept2"]}
  ]
}`;

          const batchResponse = await callAI(
            {
              provider: settings.provider,
              model_id: settings.model_id,
              model_name: settings.model_name
            },
            {
              prompt: batchPrompt,
              systemPrompt: 'You are a senior exam content analyst. Group questions into coherent topics. Respond with valid JSON only.',
              timeoutMs: 90000, // Increase to 90 seconds for subsequent batches
              maxTokens: 3000,
              responseFormat: 'json'
            }
          );

          const batchTopics = parseJSONResponse(batchResponse) as TopicDetectionResponse;

          // Merge batch topics into allTopics
          for (const newTopic of batchTopics.topics) {
            const existingTopic = allTopics.find(t => t.name === newTopic.name);
            if (existingTopic) {
              // Add questions to existing topic
              existingTopic.question_ids.push(...newTopic.question_ids);
              // Merge unique concepts
              const uniqueConcepts = new Set([...existingTopic.concepts, ...newTopic.concepts]);
              existingTopic.concepts = Array.from(uniqueConcepts).slice(0, 5);
            } else {
              // Add new topic
              allTopics.push(newTopic);
            }
          }
        }

        validatedTopics = { topics: allTopics };

        // Validate all questions are covered
        const assignedIds = new Set(allTopics.flatMap(t => t.question_ids));
        const missingIds = questions.filter(q => !assignedIds.has(q.id));
        if (missingIds.length > 0) {
          logError(`⚠️ ${missingIds.length} questions not assigned to topics`, { missingCount: missingIds.length });
        }

      } else {
        // Small exam, process normally
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
            maxTokens: 8000,
            responseFormat: 'json'
          }
        );

        const topicResponse = parseJSONResponse(topicResponseText);
        const expectedQuestionIds = questions.map(q => q.id);
        validatedTopics = validateTopicDetectionResponse(topicResponse, expectedQuestionIds);
      }

      const topicDuration = ((Date.now() - topicStartTime) / 1000).toFixed(2);
      logStep(`✅ Detected ${validatedTopics.topics.length} topics in ${topicDuration}s`, {
        topics: validatedTopics.topics.map(t => ({ name: t.name, questionCount: t.question_ids.length }))
      });

      // Save topics to database
      logStep('💾 Saving topics to database');
      await upsertTopics(supabase, exam_id, validatedTopics.topics);
      logStep('✅ Topics saved successfully');

      // STEP 2: Generate lessons with controlled concurrency to avoid rate limits
      logStep(`🚀 Starting lesson generation for ${validatedTopics.topics.length} topics`);
      const lessonStartTime = Date.now();

      // Process lessons in batches to avoid rate limiting
      const CONCURRENT_LESSONS = 3; // Process 3 lessons at a time to stay within rate limits
      const courseSections: Array<{
        exam_id: string;
        topic_name: string;
        content_md: string;
        order_index: number;
      }> = [];

      for (let batchStart = 0; batchStart < validatedTopics.topics.length; batchStart += CONCURRENT_LESSONS) {
        const batchEnd = Math.min(batchStart + CONCURRENT_LESSONS, validatedTopics.topics.length);
        const batchTopics = validatedTopics.topics.slice(batchStart, batchEnd);
        const batchNumber = Math.floor(batchStart / CONCURRENT_LESSONS) + 1;
        const totalBatches = Math.ceil(validatedTopics.topics.length / CONCURRENT_LESSONS);

        logStep(`📚 Processing lesson batch ${batchNumber}/${totalBatches} (topics ${batchStart + 1}-${batchEnd})`);

        const batchResults = await Promise.all(
          batchTopics.map(async (topic, batchIndex) => {
            const i = batchStart + batchIndex;
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

        courseSections.push(...batchResults);

        // Add a small delay between batches to be extra safe with rate limits
        if (batchEnd < validatedTopics.topics.length) {
          logStep(`⏳ Waiting 2 seconds before next batch to respect rate limits...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

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
