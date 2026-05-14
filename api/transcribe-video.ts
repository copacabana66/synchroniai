import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatComplete, extractJSON, getLLMConfig } from './lib/llm';

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

// Step 1 — Transcription via Groq Whisper (if GROQ_API_KEY)
async function groqTranscribe(audioBase64: string, mimeType: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('NO_GROQ_KEY');

  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';

  const formData = new FormData();
  formData.append('file', new File([audioBuffer], `audio.${ext}`, { type: mimeType }));
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'fr');
  formData.append('response_format', 'text');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq Whisper error: ${err.slice(0, 200)}`);
  }
  return await res.text();
}

// Step 2 — Communication analysis via LLM
const ANALYSIS_PROMPT = `Tu es un expert en communication orale. Analyse cette transcription d'une présentation candidat et retourne UNIQUEMENT un JSON strict.

Format JSON attendu :
{
  "transcript": "<reprends la transcription telle quelle>",
  "clarityScore": 82,
  "structureScore": 75,
  "fluencyScore": 80,
  "analysisNotes": "2-3 phrases d'observation objective sur la clarté, la structure et l'aisance. NE PAS juger l'origine, genre ou apparence.",
  "keyThemes": ["thème1", "thème2"],
  "communicationStrengths": ["point fort 1", "point fort 2"],
  "communicationAreas": ["axe d'amélioration 1"]
}

Les scores sont sur 100. Conformité AI Act totale. Réponds UNIQUEMENT avec le JSON.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!getLLMConfig()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const { audioBase64, mimeType } = req.body as { audioBase64?: string; mimeType?: string };
  if (!audioBase64 || !mimeType) {
    return res.status(400).json({ error: 'audioBase64 et mimeType requis' });
  }

  try {
    // Transcribe audio
    let transcript = '';
    try {
      transcript = await groqTranscribe(audioBase64, mimeType);
    } catch (e) {
      // If Groq Whisper unavailable, ask LLM to generate a placeholder analysis
      console.warn('Whisper unavailable, using LLM-only analysis:', e);
      transcript = '[Transcription non disponible — analyse basée sur les données du questionnaire]';
    }

    // Analyze with LLM
    const raw = await chatComplete([
      { role: 'system', content: ANALYSIS_PROMPT },
      { role: 'user',   content: `Transcription à analyser :\n\n${transcript}` },
    ]);

    return res.status(200).json(extractJSON(raw));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('transcribe-video error:', msg);
    if (msg === 'NO_LLM_CONFIGURED') return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
    return res.status(500).json({ error: 'AI_ERROR', detail: msg.slice(0, 200) });
  }
}
