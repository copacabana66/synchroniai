import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const PROMPT = `Tu es un expert en communication et évaluation orale. Transcris et analyse cet enregistrement audio d'un candidat.
Retourne UNIQUEMENT un JSON strict, sans markdown ni texte autour.

Format JSON attendu :
{
  "transcript": "Transcription complète et fidèle de ce qui a été dit.",
  "clarityScore": 82,
  "structureScore": 75,
  "fluencyScore": 80,
  "analysisNotes": "2-3 phrases d'observation objective sur la clarté d'expression, la structure du discours et l'aisance orale. NE PAS juger l'apparence, l'origine ou tout autre critère discriminatoire.",
  "keyThemes": ["thème1 mentionné", "thème2 mentionné"],
  "communicationStrengths": ["point fort 1", "point fort 2"],
  "communicationAreas": ["axe d'amélioration 1"]
}

Les scores sont sur 100. Analyse UNIQUEMENT la communication verbale (clarté, structure, vocabulaire, aisance). Conformité AI Act totale.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const { audioBase64, mimeType } = req.body as { audioBase64?: string; mimeType?: string };
  if (!audioBase64 || !mimeType) return res.status(400).json({ error: 'audioBase64 et mimeType requis' });

  const supportedAudio = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav', 'audio/mpeg', 'video/webm'];
  if (!supportedAudio.includes(mimeType)) {
    return res.status(400).json({ error: `Format audio non supporté : ${mimeType}` });
  }

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: audioBase64 } },
            { text: PROMPT },
          ],
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini video error:', err);
      return res.status(502).json({ error: 'AI_ERROR' });
    }

    const data = await geminiRes.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (e) {
    console.error('transcribe-video error:', e);
    return res.status(500).json({ error: 'PARSE_ERROR' });
  }
}
