import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const SYSTEM_PROMPT = `Tu es un expert RH francophone. À partir de la description du recruteur, génère une fiche de poste complète et professionnelle en JSON strict (pas de markdown, pas de texte autour).

Format JSON attendu :
{
  "title": "Intitulé exact du poste",
  "location": "Ville ou Remote",
  "contractType": "CDI" | "CDD" | "Freelance / Mission" | "Stage / Alternance",
  "salaryMin": "ex: 45000",
  "salaryMax": "ex: 55000",
  "description": "Paragraphe de 3-5 phrases décrivant les missions principales, le contexte de l'entreprise et l'impact du poste.",
  "expectations": "Liste de 5-8 compétences ou attentes séparées par des sauts de ligne, commençant par un tiret. Ex:\\n- 3+ ans d'expérience en React\\n- Maîtrise de TypeScript",
  "teamProfile": "Description en 2-3 phrases de la composition et la culture de l'équipe.",
  "managementStyle": "bienveillant" | "objectifs" | "directif" | "horizontal" | "autonomie",
  "managementDetail": "Phrase ou deux décrivant concrètement le style de management."
}

Réponds UNIQUEMENT avec le JSON, sans aucun texte avant ou après.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
  }

  const { prompt } = req.body as { prompt?: string };
  if (!prompt || prompt.trim().length < 10) {
    return res.status(400).json({ error: 'Prompt trop court' });
  }

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              { text: `\n\nDescription du recruteur :\n${prompt}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini error:', err);
      return res.status(502).json({ error: 'AI_ERROR' });
    }

    const data = (await geminiRes.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    // Strip potential markdown code fences
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (e) {
    console.error('generate-job-posting error:', e);
    return res.status(500).json({ error: 'PARSE_ERROR' });
  }
}
