import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatComplete, extractJSON, getLLMConfig } from './lib/llm.js';
import { guard } from './lib/security.js';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

const SYSTEM_PROMPT = `Tu es un expert RH. Évalue la compatibilité entre un candidat et une fiche de poste.
Retourne un score global et des scores par dimension. Conforme AI Act — analyse factuelle uniquement,
zéro biais sur genre/origine/apparence.

CRITÈRES OBLIGATOIRES :
- Si "managementStyle" est fourni dans la fiche de poste, ÉVALUE explicitement la compatibilité
  entre le style de management attendu et les préférences du candidat (managementPref).
- Si "teamDna" est fourni (ADN collectif de l'équipe), évalue la cohérence du candidat
  avec les traits dominants, le rythme et les valeurs de l'équipe — ET sa capacité à combler
  les angles morts (blindSpots) de l'équipe.
- Si test de personnalité (Big Five) ou cognitif est fourni, intègre-les dans les dimensions.

Format JSON :
{
  "globalScore": 84,
  "dimensions": {
    "competences":   { "score": 88, "comment": "analyse factuelle" },
    "experience":    { "score": 82, "comment": "analyse factuelle" },
    "communication": { "score": 78, "comment": "analyse factuelle" },
    "environnement": { "score": 91, "comment": "analyse factuelle" },
    "management":    { "score": 85, "comment": "alignement style mgmt attendu ↔ préférences candidat" },
    "equipe":        { "score": 79, "comment": "fit avec l'ADN collectif" },
    "personnalite":  { "score": 86, "comment": "lien Big Five ↔ poste" },
    "cognitif":      { "score": 82, "comment": "raisonnement attendu pour ce poste" },
    "attentes":      { "score": 87, "comment": "analyse factuelle" }
  },
  "recommendation": "RETENIR",
  "summary": "Synthèse en 2 phrases."
}
recommendation : "RETENIR" (≥85), "À EXAMINER" (70-84), "INSUFFISANT" (<70).
N'inclure une dimension QUE si les données correspondantes sont présentes dans le prompt.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res)) return;
  if (!getLLMConfig()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const body = req.body as Record<string, unknown>;
  if (!body.candidate || !body.jobPosting) {
    return res.status(400).json({ error: 'candidate et jobPosting requis' });
  }

  const userContent = [
    `PROFIL CANDIDAT :\n${JSON.stringify(body.candidate).slice(0, 3000)}`,
    `FICHE DE POSTE :\n${JSON.stringify(body.jobPosting).slice(0, 2000)}`,
    body.preferences   ? `PRÉFÉRENCES CANDIDAT (incl. management préféré) :\n${JSON.stringify(body.preferences).slice(0, 500)}` : '',
    body.teamDna       ? `ADN COLLECTIF DE L'ÉQUIPE EXISTANTE :\n${JSON.stringify(body.teamDna).slice(0, 1000)}` : '',
    body.videoAnalysis ? `ANALYSE ORALE :\n${JSON.stringify(body.videoAnalysis).slice(0, 800)}` : '',
    body.assessment    ? `TEST COGNITIF & PERSONNALITÉ :\n${JSON.stringify(body.assessment).slice(0, 1200)}` : '',
  ].filter(Boolean).join('\n\n');

  try {
    const raw = await chatComplete(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userContent },
      ],
      800,
      { maxRetries: 1, timeoutMs: 20_000 },
    );

    const report = extractJSON(raw) as Record<string, unknown>;

    // Clamp scores
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
    if (msg === 'NO_LLM_CONFIGURED') return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
    return res.status(500).json({ error: 'AI_ERROR', detail: msg.slice(0, 200) });
  }
}
