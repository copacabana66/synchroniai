import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatComplete, extractJSON, getLLMConfig } from './lib/llm';
import { guard } from './lib/security';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

const SYSTEM_PROMPT = `Tu es un expert RH et consultant en recrutement. Génère un compte rendu d'analyse de compatibilité entre un candidat et une fiche de poste. Conforme AI Act européen — analyse factuelle uniquement, aucun biais.

Format JSON attendu :
{
  "globalScore": 84,
  "dimensions": {
    "competences":   { "score": 88, "label": "Compétences",   "comment": "phrase d'analyse factuelle" },
    "experience":    { "score": 82, "label": "Expérience",    "comment": "phrase d'analyse factuelle" },
    "communication": { "score": 78, "label": "Communication", "comment": "phrase d'analyse factuelle" },
    "environnement": { "score": 91, "label": "Environnement", "comment": "phrase d'analyse factuelle" },
    "equipe":        { "score": 85, "label": "Équipe",        "comment": "phrase d'analyse factuelle" },
    "management":    { "score": 79, "label": "Management",    "comment": "phrase d'analyse factuelle" },
    "attentes":      { "score": 87, "label": "Attentes",      "comment": "phrase d'analyse factuelle" }
  },
  "summary": "Synthèse objective en 2-3 phrases.",
  "strengths": ["Point fort 1", "Point fort 2", "Point fort 3"],
  "gaps": ["Écart 1", "Écart 2"],
  "recommendation": "RETENIR",
  "recommendationDetail": "Justification factuelle en 2 phrases.",
  "suggestedQuestions": ["Question 1", "Question 2", "Question 3"]
}

recommendation : "RETENIR" (score ≥85), "À EXAMINER" (70-84), ou "INSUFFISANT" (<70). Scores sur 100.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res)) return;
  if (!getLLMConfig()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const body = req.body as Record<string, unknown>;
  if (!body.candidate) return res.status(400).json({ error: 'candidate requis' });

  // Cap payload sizes to avoid token abuse
  const userContent = [
    `PROFIL CANDIDAT :\n${JSON.stringify(body.candidate).slice(0, 3000)}`,
    `FICHE DE POSTE :\n${JSON.stringify(body.jobPosting ?? {}).slice(0, 2000)}`,
    `PRÉFÉRENCES CANDIDAT :\n${JSON.stringify(body.preferences ?? {}).slice(0, 500)}`,
    `ANALYSE AUDIO :\n${JSON.stringify(body.videoAnalysis ?? null).slice(0, 1000)}`,
  ].join('\n\n');

  try {
    const raw = await chatComplete([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userContent },
    ], 2000);

    const report = extractJSON(raw) as Record<string, unknown>;

    // Validate score bounds (evaluator pattern — catch hallucinated scores)
    const dims = report.dimensions as Record<string, { score: number }> | undefined;
    if (dims) {
      for (const key of Object.keys(dims)) {
        const s = dims[key].score;
        if (typeof s !== 'number' || s < 0 || s > 100) {
          dims[key].score = Math.max(0, Math.min(100, Math.round(Number(s) || 50)));
        }
      }
    }
    if (typeof report.globalScore === 'number') {
      report.globalScore = Math.max(0, Math.min(100, Math.round(report.globalScore)));
    }

    return res.status(200).json(report);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-report error:', msg);
    if (msg === 'NO_LLM_CONFIGURED') return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
    return res.status(500).json({ error: 'AI_ERROR', detail: msg.slice(0, 200) });
  }
}
