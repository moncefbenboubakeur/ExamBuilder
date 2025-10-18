import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_MODELS } from '@/lib/ai-models';
import { AIQuestionAnalysis } from '@/lib/types/multi-llm';

interface AnalysisRequest {
  questionIds: string[];
  examId: string;
  selectedModels: string[];
}

interface AIResponse {
  recommended_answer: string;
  confidence_score: number;
  explanation: string;
  reasoning_summary?: string;
  reasoning_detailed?: string;
  option_explanations?: Record<string, {
    short: string;
    detailed: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AnalysisRequest = await request.json();
    const { questionIds, selectedModels } = body;

    if (!questionIds || questionIds.length === 0) {
      return NextResponse.json({ error: 'No question IDs provided' }, { status: 400 });
    }

    if (!selectedModels || selectedModels.length === 0) {
      return NextResponse.json({ error: 'No models selected' }, { status: 400 });
    }

    // Validate models exist
    const validModels = selectedModels.filter(modelId =>
      AI_MODELS.some(m => m.id === modelId)
    );

    if (validModels.length === 0) {
      return NextResponse.json({ error: 'No valid models provided' }, { status: 400 });
    }

    // Fetch questions
    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .in('id', questionIds);

    if (fetchError || !questions) {
      console.error('Failed to fetch questions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    console.log(`🎯 Starting multi-model analysis for ${questions.length} questions with ${validModels.length} models`);

    const allAnalyses: AIQuestionAnalysis[] = [];
    const errors: Array<{ questionId: string; modelId: string; error: string }> = [];
    let totalAnalyzed = 0;

    // Process each model
    for (const modelId of validModels) {
      const model = AI_MODELS.find(m => m.id === modelId);
      if (!model) continue;

      console.log(`\n🤖 Processing with model: ${model.name} (${model.provider})`);

      // Process questions in batches for this model
      const batchSize = 5;
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);

        const batchPromises = batch.map(async (question) => {
          try {
            const analysis = await analyzeQuestionWithModel(question, model);

            // Save to ai_question_analyses table
            console.log(`💾 Saving analysis for question ${question.id} with model:`, {
              model_id: model.id,
              model_name: model.name,
              answer: analysis.recommended_answer
            });

            const analysisRecord: Partial<AIQuestionAnalysis> = {
              question_id: question.id,
              model_provider: model.provider,
              model_id: model.id,
              model_name: model.name,
              suggested_answer: analysis.recommended_answer,
              explanation: analysis.explanation,
              confidence_score: analysis.confidence_score,
              analysis_metadata: {
                tokens_used: 0, // TODO: Track actual token usage
                response_time_ms: 0, // TODO: Track actual response time
                reasoning_summary: analysis.reasoning_summary,
                reasoning_detailed: analysis.reasoning_detailed,
                option_explanations: analysis.option_explanations
              }
            };

            // Insert or update the analysis
            const { data, error: insertError } = await supabase
              .from('ai_question_analyses')
              .upsert(analysisRecord, {
                onConflict: 'question_id,model_id',
                ignoreDuplicates: false
              })
              .select()
              .single();

            if (insertError) {
              console.error(`Failed to save analysis for Q${question.id} with ${model.name}:`, insertError);
              errors.push({
                questionId: question.id,
                modelId: model.id,
                error: insertError.message
              });
              return null;
            }

            // Only count as analyzed if we got a real answer
            if (analysis.recommended_answer !== 'Unable to determine') {
              totalAnalyzed++;
            } else {
              errors.push({
                questionId: question.id,
                modelId: model.id,
                error: 'Model returned empty or invalid response'
              });
            }
            return data;
          } catch (error) {
            console.error(`Failed to analyze Q${question.id} with ${model.name}:`, error);
            errors.push({
              questionId: question.id,
              modelId: model.id,
              error: String(error)
            });
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        allAnalyses.push(...batchResults.filter(r => r !== null) as AIQuestionAnalysis[]);

        // Small delay between batches to respect rate limits
        if (i + batchSize < questions.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Delay between models to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Calculate consensus for each question
    console.log('\n📊 Calculating consensus...');
    const consensusData = [];

    for (const questionId of questionIds) {
      // Call the calculate_consensus function we created in the database
      const { error: consensusError } = await supabase
        .rpc('calculate_consensus', { p_question_id: questionId });

      if (consensusError) {
        console.error(`Failed to calculate consensus for question ${questionId}:`, consensusError);
      }

      // Fetch the consensus result
      const { data: consensus } = await supabase
        .from('ai_consensus_results')
        .select('*')
        .eq('question_id', questionId)
        .single();

      if (consensus) {
        consensusData.push({
          questionId,
          consensusAnswer: consensus.consensus_answer,
          agreementPercentage: consensus.agreement_percentage,
          totalModels: consensus.total_models_analyzed
        });
      }
    }

    console.log(`\n✅ Analysis complete: ${totalAnalyzed} successful, ${errors.length} failed`);

    return NextResponse.json({
      success: true,
      analyzed: totalAnalyzed,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      modelsUsed: validModels,
      consensusData,
      totalQuestions: questions.length,
      totalModels: validModels.length
    });

  } catch (error) {
    console.error('Multi-model analysis error:', error);
    return NextResponse.json({
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

interface QuestionData {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer?: string;
}

async function analyzeQuestionWithModel(
  question: QuestionData,
  model: typeof AI_MODELS[0]
): Promise<AIResponse> {
  const prompt = buildPrompt(question);
  let responseText = '';

  console.log(`  🔎 Analyzing Q${question.id.substring(0, 8)}... with ${model.name}`);

  // Call appropriate AI provider
  if (model.provider === 'anthropic') {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: model.id,
      max_tokens: 1500,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    if (message.content[0]?.type === 'text') {
      responseText = message.content[0].text;
    }

  } else if (model.provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      // Handle different parameter names for different OpenAI models
      interface CompletionParams {
        model: string;
        messages: Array<{
          role: 'system' | 'user';
          content: string;
        }>;
        response_format: { type: 'json_object' };
        max_completion_tokens?: number;
      }

      const completionParams: CompletionParams = {
        model: model.id,
        messages: [
          {
            role: 'system',
            content: 'You are an expert exam taker. Respond with valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
      };

      // Use max_completion_tokens for all OpenAI models (GPT-5 requires this)
      // Increase tokens for GPT-5 models due to reasoning overhead
      if (model.id === 'gpt-5-nano') {
        completionParams.max_completion_tokens = 3000; // Nano needs more for reasoning
      } else if (model.id === 'gpt-5-mini') {
        completionParams.max_completion_tokens = 4000; // Mini needs even more
      } else if (model.id === 'gpt-5') {
        completionParams.max_completion_tokens = 5000; // Full GPT-5 needs the most
      } else {
        // For other OpenAI models, use max_completion_tokens (newer API standard)
        completionParams.max_completion_tokens = 2000;
      }

      const completion = await openai.chat.completions.create(completionParams);

      responseText = completion.choices[0]?.message?.content || '';

      // Debug logging for OpenAI responses
      if (!responseText || responseText.length < 50) {
        console.log(`⚠️ Short/empty response from ${model.name}:`, responseText);
      }
    } catch (openaiError) {
      const error = openaiError as { message?: string; status?: number };
      console.error(`❌ OpenAI API error for ${model.name} (${model.id}):`, error.message);
      // Check if it's a model not found error
      if (error.message?.includes('does not exist') || error.status === 404) {
        console.error(`   → Model ${model.id} does not exist in OpenAI API`);
        throw new Error(`Model ${model.id} not found in OpenAI API`);
      }
      throw openaiError;
    }

  } else if (model.provider === 'google') {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('Google AI API key not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const genModel = genAI.getGenerativeModel({ model: model.id });

    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    responseText = response.text();

  } else {
    throw new Error(`Unsupported AI provider: ${model.provider}`);
  }

  // Parse JSON response
  let jsonText = responseText.trim();

  // Clean up markdown code blocks if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  // Try to fix incomplete JSON (common with some models)
  if (!jsonText.endsWith('}')) {
    console.log(`⚠️ Incomplete JSON from ${model.name}, attempting to fix...`);
    // Try to complete the JSON if it's cut off
    const openBraces = (jsonText.match(/{/g) || []).length;
    const closeBraces = (jsonText.match(/}/g) || []).length;
    const missingBraces = openBraces - closeBraces;

    if (missingBraces > 0) {
      // Add missing quotes if the last line looks incomplete
      if (!jsonText.endsWith('"')) {
        jsonText += '"';
      }
      // Add missing braces
      jsonText += '}'.repeat(missingBraces);
    }
  }

  let parsed: AIResponse;
  try {
    parsed = JSON.parse(jsonText);

    // Validate the parsed response has required fields
    if (!parsed.recommended_answer || parsed.recommended_answer === '') {
      console.warn(`${model.name} returned empty answer, using fallback`);
      parsed.recommended_answer = 'Unable to determine';
      parsed.confidence_score = parsed.confidence_score || 0.5;
    }
  } catch (parseError) {
    console.error(`Failed to parse JSON from ${model.name}:`, parseError);
    console.error(`Raw response (first 500 chars): ${responseText.substring(0, 500)}`);
    console.error(`Attempted JSON (first 500 chars): ${jsonText.substring(0, 500)}`);

    // Fallback response if JSON parsing fails
    parsed = {
      recommended_answer: 'Unable to determine',
      confidence_score: 0.5,
      explanation: 'Model response was incomplete or malformed'
    };
  }

  return {
    recommended_answer: parsed.recommended_answer || 'Unable to determine',
    confidence_score: parsed.confidence_score || 0.5,
    explanation: parsed.explanation || 'No explanation provided',
    reasoning_summary: parsed.reasoning_summary,
    reasoning_detailed: parsed.reasoning_detailed,
    option_explanations: parsed.option_explanations
  };
}

function buildPrompt(question: QuestionData): string {
  const optionsText = Object.entries(question.options)
    .map(([key, value]) => `${key}. ${value}`)
    .join('\n');

  return `Analyze this exam question comprehensively and provide detailed explanations for each option.

Question: ${question.question_text}

Options:
${optionsText}

Provide a detailed JSON response with the following structure:
{
  "recommended_answer": "The letter of the correct answer",
  "confidence_score": 0.0-1.0,
  "explanation": "Brief 2-3 sentence explanation of your answer choice",
  "reasoning_summary": "A concise summary of why this answer is correct (1-2 sentences)",
  "reasoning_detailed": "A detailed explanation of the reasoning behind choosing this answer, including relevant context, principles, or concepts (3-5 sentences)",
  "option_explanations": {
    "A": {
      "short": "Brief explanation why this option is correct/incorrect (1 sentence)",
      "detailed": "Detailed analysis of this option, explaining why it's right or wrong, common misconceptions, and relevant context (2-3 sentences)"
    },
    "B": { "short": "...", "detailed": "..." },
    // Include ALL options
  }
}

Example for a question "What does CPU stand for?":
{
  "recommended_answer": "B",
  "confidence_score": 0.99,
  "explanation": "CPU stands for Central Processing Unit, which is the primary component of a computer that performs calculations and executes instructions.",
  "reasoning_summary": "The CPU is universally recognized as the Central Processing Unit in computer science and technology.",
  "reasoning_detailed": "The term CPU has been standardized since the 1960s to refer to the Central Processing Unit, the main processor in a computer system. It's responsible for executing program instructions and coordinating all computer operations. This definition is used consistently across all major technology companies, educational institutions, and technical documentation worldwide.",
  "option_explanations": {
    "A": {
      "short": "Incorrect - 'Computer Personal Unit' is not a real technical term",
      "detailed": "This option uses words associated with computers but in an incorrect combination. While 'Computer' and 'Personal' are relevant to PCs (Personal Computers), 'CPU' has never stood for Computer Personal Unit in any technical context."
    },
    "B": {
      "short": "Correct - Central Processing Unit is the official and universally accepted definition",
      "detailed": "Central Processing Unit accurately describes the CPU's role as the central component that processes instructions. This has been the standard definition since the advent of modern computing and is used in all technical specifications and documentation."
    }
  }
}

IMPORTANT:
- Respond with valid JSON only, no markdown or additional text
- Provide explanations for ALL options in the question
- Be specific about why each option is correct or incorrect`;
}