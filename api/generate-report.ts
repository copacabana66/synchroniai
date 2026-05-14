import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function buildPrompt(body: Record<string, unknown>): string {
  return `Tu es un expert RH et consultant en recrutement. Génère un compte rendu d'analyse de compatibilité entre un candidat et une fiche de poste.
Retourne UNIQUEMENT un JSON strict, sans markdown ni texte autour.

=== PROFIL CANDIDAT ===
${JSON.stringify(body.candidate, null, 2)}

=== FICHE DE POSTE ===
${JSON.stringify(body.jobPosting, null, 2)}

=== PRÉFÉRENCES ET QUESTIONNAIRE CANDIDAT ===
${JSON.stringify(body.preferences, null, 2)}

=== ANALYSE VIDÉO (si disponible) ===
${JSON.stringify(body.videoAnalysis ?? null, null, 2)}

Format JSON attendu :
{
  "globalScore": 84,
  "dimensions": {
    "competences":    { "score": 88, "label": "Compétences",    "comment": "phrase d'analyse" },
    "experience":     { "score": 82, "label": "Expérience",     "comment": "phrase d'analyse" },
    "communication":  { "score": 78, "label": "Communication",  "comment": "phrase d'analyse" },
    "environnement":  { "score": 91, "label": "Environnement",  "comment": "phrase d'analyse" },
    "equipe":         { "score": 85, "label": "Équipe",         "comment": "phrase d'analyse" },
    "management":     { "score": 79, "label": "Management",     "comment": "phrase d'analyse" },
    "attentes":       { "score": 87, "label": "Attentes",       "comment": "phrase d'analyse" }
  },
  "summary": "Synthèse du profil candidat en rapport avec le poste en 2-3 phrases.",
  "strengths": [
    "Point fort 1 — explication concrète",
    "Point fort 2 — explication concrète",
    "Point fort 3 — explication concrète"
  ],
  "gaps": [
    "Écart ou risque 1 — explication",
    "Écart ou risque 2 — explication"
  ],
  "recommendation": "RETENIR" | "À EXAMINER" | "INSUFFISANT",
  "recommendationDetail": "Justification de la recommandation en 2 phrases claires.",
  "suggestedQuestions": [
    "Question d'entretien ciblée 1 basée sur les écarts identifiés",
    "Question d'entretien ciblée 2",
    "Question d'entretien ciblée 3"
  ]
}

Les scores sont sur 100. Sois objectif, factuel, et conforme à l'AI Act (pas de biais discriminatoire).
Réponds UNIQUEMENT avec le JSON.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const body = req.body as Record<string, unknown>;
  if (!body.candidate) return res.status(400).json({ error: 'candidate requis' });

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(body) }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini report error:', err);
      return res.status(502).json({ error: 'AI_ERROR' });
    }

    const data = await geminiRes.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return res.status(200).json(JSON.parse(clean));
  } catch (e) {
    console.error('generate-report error:', e);
    return res.status(500).json({ error: 'PARSE_ERROR' });
  }
}
