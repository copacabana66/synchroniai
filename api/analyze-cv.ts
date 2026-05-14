import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const PROMPT = `Tu es un expert en analyse de CV RH. Analyse ce CV et retourne UNIQUEMENT un JSON strict, sans markdown ni texte autour.

Format JSON attendu :
{
  "fullName": "Prénom Nom extrait du CV",
  "currentRole": "Titre du poste actuel ou dernier poste occupé",
  "yearsOfExperience": 5,
  "skills": ["compétence1", "compétence2"],
  "technicalSkills": ["outil1", "outil2"],
  "softSkills": ["qualité1", "qualité2"],
  "education": "Formation principale et établissement",
  "languages": ["Français (natif)", "Anglais (courant)"],
  "experience": "Résumé de l'expérience professionnelle en 2-3 phrases.",
  "summary": "Synthèse du profil candidat en 3 phrases percutantes pour un recruteur."
}

Réponds UNIQUEMENT avec le JSON.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const { fileBase64, mimeType } = req.body as { fileBase64?: string; mimeType?: string };
  if (!fileBase64 || !mimeType) return res.status(400).json({ error: 'fileBase64 et mimeType requis' });

  const supportedTypes = ['application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!supportedTypes.includes(mimeType)) {
    return res.status(400).json({ error: 'Format non supporté. Utilisez PDF ou DOCX.' });
  }

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: fileBase64 } },
            { text: PROMPT },
          ],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini CV error:', err);
      return res.status(502).json({ error: 'AI_ERROR' });
    }

    const data = await geminiRes.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (e) {
    console.error('analyze-cv error:', e);
    return res.status(500).json({ error: 'PARSE_ERROR' });
  }
}
