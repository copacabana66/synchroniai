// Shared LLM client — supports Groq (priority) and OpenRouter
// Both use the OpenAI-compatible chat/completions endpoint

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
      model:   'llama-3.1-70b-versatile',
      name:    'Groq',
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey:  process.env.OPENROUTER_API_KEY,
      model:   'meta-llama/llama-3.1-70b-instruct:free',
      name:    'OpenRouter',
    };
  }
  // Gemini fallback via OpenAI-compatible wrapper (if key exists)
  if (process.env.GEMINI_API_KEY) {
    return {
      baseUrl: `https://generativelanguage.googleapis.com/v1beta/openai`,
      apiKey:  process.env.GEMINI_API_KEY,
      model:   'gemini-1.5-flash',
      name:    'Gemini',
    };
  }
  return null;
}

export async function chatComplete(
  messages: Message[],
  maxTokens = 1500,
): Promise<string> {
  const config = getLLMConfig();
  if (!config) throw new Error('NO_LLM_CONFIGURED');

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'HTTP-Referer':  'https://synchroniai.vercel.app',
      'X-Title':       'SynchroniAI',
    },
    body: JSON.stringify({
      model:       config.model,
      messages,
      temperature: 0.3,
      max_tokens:  maxTokens,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`[${config.name}] LLM error:`, detail.slice(0, 300));
    throw new Error(`LLM_ERROR:${config.name}:${detail.slice(0, 200)}`);
  }

  const data = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? '';
}

export function extractJSON(raw: string): unknown {
  const clean = raw
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();
  return JSON.parse(clean);
}
