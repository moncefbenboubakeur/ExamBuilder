// Provider-agnostic AI call with timeout and retry logic

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface AICallOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  timeoutMs?: number;
  retries?: number;
  responseFormat?: 'text' | 'json';
}

export interface AISettings {
  provider: 'anthropic' | 'openai';
  model_id: string;
  model_name: string;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 1;

/**
 * Call AI with automatic timeout and retry logic
 */
export async function callAI(
  settings: AISettings,
  options: AICallOptions
): Promise<string> {
  const {
    prompt,
    systemPrompt,
    maxTokens = 3000,
    timeoutMs = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    responseFormat = 'text'
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        executeAICall(settings, { prompt, systemPrompt, maxTokens, responseFormat }),
        createTimeout(timeoutMs)
      ]);

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`AI call attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < retries) {
        // Exponential backoff: wait 2^attempt seconds
        const waitMs = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${waitMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
    }
  }

  throw new Error(`AI call failed after ${retries + 1} attempts: ${lastError?.message}`);
}

/**
 * Execute the actual AI call based on provider
 */
async function executeAICall(
  settings: AISettings,
  options: {
    prompt: string;
    systemPrompt?: string;
    maxTokens: number;
    responseFormat: 'text' | 'json';
  }
): Promise<string> {
  const { prompt, systemPrompt, maxTokens, responseFormat } = options;

  if (settings.provider === 'anthropic') {
    return callAnthropic(settings.model_id, prompt, systemPrompt, maxTokens);
  } else if (settings.provider === 'openai') {
    return callOpenAI(settings.model_id, prompt, systemPrompt, maxTokens, responseFormat);
  } else {
    throw new Error(`Unsupported AI provider: ${settings.provider}`);
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  modelId: string,
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 3000
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const message = await anthropic.messages.create({
    model: modelId,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  if (!responseText) {
    throw new Error('Empty response from Anthropic');
  }

  return responseText;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  modelId: string,
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 3000,
  responseFormat: 'text' | 'json' = 'text'
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt
    });
  }

  messages.push({
    role: 'user',
    content: prompt
  });

  console.log(`📞 Calling OpenAI model ${modelId} with ${maxTokens} max_completion_tokens`);

  const completion = await openai.chat.completions.create({
    model: modelId,
    messages,
    max_completion_tokens: maxTokens,
    ...(responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {})
  });

  const responseText = completion.choices[0]?.message?.content || '';

  if (!responseText) {
    console.error(`❌ Empty response from OpenAI model ${modelId}. Completion object:`, {
      id: completion.id,
      model: completion.model,
      usage: completion.usage,
      finish_reason: completion.choices[0]?.finish_reason
    });
    throw new Error('Empty response from OpenAI');
  }

  return responseText;
}

/**
 * Create a timeout promise
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`AI call timeout after ${ms}ms`));
    }, ms);
  });
}

/**
 * Parse JSON response, handling potential markdown code blocks
 */
export function parseJSONResponse<T>(responseText: string): T {
  let jsonText = responseText.trim();

  // Strip markdown code blocks if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  if (!jsonText || jsonText.length === 0) {
    throw new Error('AI returned empty response');
  }

  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', jsonText.substring(0, 500));
    throw new Error(`Invalid JSON response: ${error instanceof Error ? error.message : String(error)}`);
  }
}
