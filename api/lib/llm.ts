// Shared LLM client — Groq (priority) → OpenRouter → Gemini
// Patterns: retry with backoff, robust JSON extraction, structured logging

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  name: string;
}

export function getLLMConfig(): LLMConfig | null {
  if (process.env.GROQ_API_KEY) {
    return {
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey:  process.env.GROQ_API_KEY,
      model:   'llama-3.3-70b-versatile',
      name:    'Groq',
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey:  process.env.OPENROUTER_API_KEY,
      model:   'meta-llama/llama-3.3-70b-instruct:free',
      name:    'OpenRouter',
    };
  }
  if (process.env.GEMINI_API_KEY) {
    return {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey:  process.env.GEMINI_API_KEY,
      model:   'gemini-1.5-flash',
      name:    'Gemini',
    };
  }
  return null;
}

// Exponential backoff retry — skips retry on timeout (AbortError) or noRetry flag
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Never retry on timeout or auth errors — they won't resolve with retries
      const isAbort  = err instanceof Error && err.name === 'AbortError';
      const noRetry  = err instanceof Error && (err as { noRetry?: boolean }).noRetry === true;
      if (isAbort || noRetry) throw err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 600 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

export interface ChatOptions {
  maxTokens?: number;
  timeoutMs?: number;  // AbortController timeout per attempt
  maxRetries?: number; // 0 = single attempt, 1 = one retry (default)
}

export async function chatComplete(
  messages: Message[],
  maxTokens = 1500,
  options: ChatOptions = {},
): Promise<string> {
  const {
    timeoutMs  = 20_000,
    maxRetries = 1,
  } = options;

  const config = getLLMConfig();
  if (!config) throw new Error('NO_LLM_CONFIGURED');

  const t0 = Date.now();

  return withRetry(async () => {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), timeoutMs);

    const body: Record<string, unknown> = {
      model:       config.model,
      messages,
      temperature: 0.2,
      max_tokens:  maxTokens,
    };
    // json_object mode: only Groq supports it reliably
    if (config.name === 'Groq') {
      body.response_format = { type: 'json_object' };
    }

    let res: Response;
    try {
      res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'HTTP-Referer':  'https://synchroniai.vercel.app',
          'X-Title':       'SynchroniAI',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(tid);
    }

    if (!res.ok) {
      const detail = await res.text();
      if (res.status === 401 || res.status === 403) {
        throw Object.assign(new Error(`LLM_AUTH_ERROR:${config.name}`), { noRetry: true });
      }
      throw new Error(`LLM_ERROR:${config.name}:${res.status}:${detail.slice(0, 200)}`);
    }

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content ?? '';

    console.log(`[${config.name}] ${Date.now() - t0}ms — ${content.length} chars`);
    return content;
  }, maxRetries);
}

// Robust JSON extraction — handles markdown fences, leading text, partial wraps
export function extractJSON(raw: string): unknown {
  if (!raw || raw.trim() === '') throw new Error('EMPTY_RESPONSE');

  // 1. Direct parse (json_object mode returns clean JSON)
  try { return JSON.parse(raw.trim()); } catch { /* fall through */ }

  // 2. Strip markdown code fences
  const stripped = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();
  try { return JSON.parse(stripped); } catch { /* fall through */ }

  // 3. Extract first {...} block
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* fall through */ }
  }

  throw new Error(`INVALID_JSON:${raw.slice(0, 100)}`);
}
