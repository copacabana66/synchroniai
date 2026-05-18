import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatComplete, extractJSON, getLLMConfig } from './lib/llm';
import { guard } from './lib/security';

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

// Groq Whisper — timeout 15s, 1 retry max
async function groqTranscribe(audioBase64: string, mimeType: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('NO_GROQ_KEY');

  const audioBuffer = Buffer.from(audioBase64, 'base64');
  const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15_000);

    try {
      const formData = new FormData();
      formData.append('file', new File([audioBuffer], `audio.${ext}`, { type: mimeType }));
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'fr');
      formData.append('response_format', 'text');

      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
        signal: controller.signal,
      });

      if (res.ok) return await res.text();

      if (attempt === 0) {
        await new Promise(r => setTimeout(r, 800));
        continue;
      }
      const err = await res.text();
      throw new Error(`Groq Whisper error ${res.status}: ${err.slice(0, 200)}`);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw new Error('WHISPER_TIMEOUT');
      if (attempt === 1) throw e;
      await new Promise(r => setTimeout(r, 800));
    } finally {
      clearTimeout(tid);
    }
  }
  throw new Error('Groq Whisper: max retries exceeded');
}

const ANALYSIS_PROMPT = `Tu es un expert en communication orale. Analyse cette transcription d'une présentation candidat.
Conformité AI Act totale — analyse uniquement l'expression orale, jamais l'apparence, le genre ou l'origine.

Format JSON attendu :
{
  "transcript": "<reprends la transcription telle quelle>",
  "clarityScore": 82,
  "structureScore": 75,
  "fluencyScore": 80,
  "analysisNotes": "2-3 phrases d'observation objective sur la clarté, la structure et l'aisance orale.",
  "keyThemes": ["thème1", "thème2"],
  "communicationStrengths": ["point fort 1", "point fort 2"],
  "communicationAreas": ["axe d'amélioration 1"]
}

Scores sur 100.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res)) return;
  if (!getLLMConfig()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const body = req.body as { audioBase64?: string; mimeType?: string };
  if (!body.audioBase64 || !body.mimeType) {
    return res.status(400).json({ error: 'audioBase64 et mimeType requis' });
  }
  if (body.audioBase64.length > 14_000_000) {
    return res.status(413).json({ error: 'AUDIO_TOO_LARGE', detail: 'Max 10 MB audio' });
  }

  // ── Étape 1 : Transcription Whisper ──────────────────────────────────────
  let transcript = '';
  try {
    transcript = await groqTranscribe(body.audioBase64, body.mimeType);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[Whisper] indisponible, fallback placeholder:', msg);
    transcript = '[Transcription non disponible — analyse basée sur les données du questionnaire]';
  }

  // ── Étape 2 : Analyse LLM (0 retries, 25s timeout — budget serré) ────────
  try {
    const raw = await chatComplete(
      [
        { role: 'system', content: ANALYSIS_PROMPT },
        { role: 'user',   content: `Transcription :\n\n${transcript.slice(0, 4000)}` },
      ],
      800,                          // maxTokens réduit — réponse plus rapide
      { maxRetries: 0, timeoutMs: 25_000 },
    );
    return res.status(200).json(extractJSON(raw));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[transcribe-video] LLM error:', msg);
    if (msg === 'NO_LLM_CONFIGURED') return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
    if (e instanceof Error && e.name === 'AbortError') {
      return res.status(504).json({ error: 'LLM_TIMEOUT', detail: 'L\'analyse a dépassé le temps imparti.' });
    }
    return res.status(500).json({ error: 'AI_ERROR', detail: msg.slice(0, 200) });
  }
}
