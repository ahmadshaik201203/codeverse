import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, isGeminiConfigured } from '../config/env';
import { AppError } from '../middleware/error';

/**
 * Single gateway for every Gemini call in the API.
 *
 * Responsibilities:
 * - one place that reads the model name, timeout and key (the key itself is
 *   never logged or returned);
 * - one retry for transient provider failures (429/5xx/timeout);
 * - mapping provider failures to stable API errors so controllers never leak
 *   upstream payloads or credentials to a client.
 *
 * Controllers call `aiGateway.generateText` through the exported object so the
 * test suite can replace it without touching the network.
 */

export interface AiContentPart {
  text: string;
}

export interface AiContent {
  role: 'user' | 'model';
  parts: AiContentPart[];
}

export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}

export interface AiGateway {
  isConfigured(): boolean;
  modelName(): string;
  generateText(prompt: string | AiContent[], options?: GenerateOptions): Promise<string>;
}

const DEFAULT_TIMEOUT_MS = 45_000;
const RETRY_DELAY_MS = 400;

const isTimeoutError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: unknown }).name;
  if (name === 'AbortError' || name === 'TimeoutError') return true;
  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && /timeout|timed out|aborted/i.test(message);
};

const providerStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
};

const isTransient = (error: unknown): boolean => {
  if (isTimeoutError(error)) return true;
  const status = providerStatus(error);
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
};

/**
 * Reads the provider's RetryInfo hint ("27s") when present and caps the local
 * wait so a request can never hang for an unbounded amount of time.
 */
const retryAfterMs = (error: unknown): number | undefined => {
  const details = (error as { errorDetails?: unknown } | null)?.errorDetails;
  if (!Array.isArray(details)) return undefined;

  for (const detail of details) {
    if (!detail || typeof detail !== 'object') continue;
    const delay = (detail as { retryDelay?: unknown }).retryDelay;
    if (typeof delay !== 'string' || !delay.endsWith('s')) continue;
    const seconds = Number.parseFloat(delay);
    if (Number.isFinite(seconds)) return Math.min(15_000, Math.max(1_000, seconds * 1000));
  }

  return undefined;
};

export const mapProviderError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;

  const status = providerStatus(error);

  if (isTimeoutError(error)) {
    return new AppError(
      504,
      'AI_TIMEOUT',
      'The AI service took too long to respond. Nothing was generated — please try again.'
    );
  }
  if (status === 429) {
    return new AppError(
      429,
      'AI_RATE_LIMITED',
      'The AI service is rate limiting requests right now. Please wait a moment and try again.'
    );
  }
  if (status === 401 || status === 403) {
    return new AppError(
      503,
      'AI_UNAVAILABLE',
      'The AI provider rejected the configured credentials. No AI output was produced.'
    );
  }

  return new AppError(
    502,
    'AI_UPSTREAM_ERROR',
    'The AI service could not complete the request. Nothing was generated — please try again.'
  );
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const toContents = (prompt: string | AiContent[]): AiContent[] => {
  if (typeof prompt === 'string') {
    return [{ role: 'user', parts: [{ text: prompt }] }];
  }
  return prompt;
};

const callOnce = async (
  prompt: string | AiContent[],
  options: GenerateOptions
): Promise<string> => {
  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  const model = genAI.getGenerativeModel(
    {
      model: env.geminiModel,
      ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
    },
    { timeout: options.timeoutMs ?? env.geminiTimeoutMs ?? DEFAULT_TIMEOUT_MS }
  );

  const result = await model.generateContent({
    contents: toContents(prompt),
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
    },
  });

  // A truncated payload is not a valid answer. Report it explicitly instead of
  // letting JSON parsing fail with a vague "unreadable" message.
  const finishReason = result.response.candidates?.[0]?.finishReason;
  if (finishReason === 'MAX_TOKENS') {
    throw new AppError(
      502,
      'AI_TRUNCATED',
      'The AI response was cut off before it finished. Nothing was displayed — please try again.'
    );
  }

  return result.response.text();
};

const generateText = async (
  prompt: string | AiContent[],
  options: GenerateOptions = {}
): Promise<string> => {
  if (!isGeminiConfigured()) {
    throw new AppError(
      503,
      'AI_UNAVAILABLE',
      'The AI provider is not configured on this server. No AI output was generated.'
    );
  }

  let lastError: unknown;
  let attempt = 0;

  while (attempt < 3) {
    attempt += 1;
    try {
      return await callOnce(prompt, options);
    } catch (error) {
      lastError = error;

      // Never log the upstream message: it can contain request metadata. Only
      // the provider status and attempt number are recorded.
      console.error(
        JSON.stringify({
          level: 'error',
          scope: 'ai-gateway',
          attempt,
          providerStatus: providerStatus(error) ?? null,
          name: (error as { name?: string } | null)?.name ?? 'Error',
        })
      );

      const rateLimited = providerStatus(error) === 429;
      const allowedAttempts = rateLimited ? 3 : 2;

      if (attempt < allowedAttempts && isTransient(error)) {
        // Quota errors need a real pause; the provider usually says how long.
        await sleep(rateLimited ? (retryAfterMs(error) ?? 4_000) : RETRY_DELAY_MS);
        continue;
      }
      break;
    }
  }

  throw mapProviderError(lastError);
};

export const aiGateway: AiGateway = {
  isConfigured: () => isGeminiConfigured(),
  modelName: () => env.geminiModel,
  generateText,
};
