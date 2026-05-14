import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatComplete, extractJSON, getLLMConfig } from './lib/llm';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

const SYSTEM_PROMPT = `Tu es un expert RH et consultant en recrutement. Génère un compte rendu d'analyse de compatibilité entre un candidat et une fiche de poste.
Retourne UNIQUEMENT un JSON strict, sans markdown ni texte autour.

Format JSON attendu :
{
  "globalScore": 84,
  "dimensions": {
    "competences":   { "score": 88, "label": "Compétences",   "comment": "phrase d'analyse" },
    "experience":    { "score": 82, "label": "Expérience",    "comment": "phrase d'analyse" },
    "communication": { "score": 78, "label": "Communication", "comment": "phrase d'analyse" },
    "environnement": { "score": 91, "label": "Environnement", "comment": "phrase d'analyse" },
    "equipe":        { "score": 85, "label": "Équipe",        "comment": "phrase d'analyse" },
    "management":    { "score": 79, "label": "Management",    "comment": "phrase d'analyse" },
    "attentes":      { "score": 87, "label": "Attentes",      "comment": "phrase d'analyse" }
  },
  "summary": "Synthèse du profil en rapport avec le poste en 2-3 phrases.",
  "strengths": ["Point fort 1", "Point fort 2", "Point fort 3"],
  "gaps": ["Écart 1", "Écart 2"],
  "recommendation": "RETENIR",
  "recommendationDetail": "Justification en 2 phrases.",
  "suggestedQuestions": ["Question 1", "Question 2", "Question 3"]
}

recommendation doit être "RETENIR", "À EXAMINER" ou "INSUFFISANT".
Scores sur 100. Conforme AI Act. Réponds UNIQUEMENT avec le JSON.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!getLLMConfig()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const body = req.body as Record<string, unknown>;
  if (!body.candidate) return res.status(400).json({ error: 'candidate requis' });

  const userContent = `PROFIL CANDIDAT :\n${JSON.stringify(body.candidate, null, 2)}\n\nFICHE DE POSTE :\n${JSON.stringify(body.jobPosting ?? {}, null, 2)}\n\nPRÉFÉRENCES CANDIDAT :\n${JSON.stringify(body.preferences ?? {}, null, 2)}\n\nANALYSE AUDIO :\n${JSON.stringify(body.videoAnalysis ?? null, null, 2)}`;

  try {
    const raw = await chatComplete([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userContent },
    ], 2000);
    return res.status(200).json(extractJSON(raw));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-report error:', msg);
    if (msg === 'NO_LLM_CONFIGURED') return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
    return res.status(500).json({ error: 'AI_ERROR', detail: msg.slice(0, 200) });
  }
}
