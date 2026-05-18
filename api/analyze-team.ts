import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatComplete, extractJSON, getLLMConfig } from './lib/llm.js';
import { guard } from './lib/security.js';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

const SYSTEM_PROMPT = `Tu es un expert en psychologie organisationnelle et dynamiques d'équipe.
Analyse l'équipe fournie et identifie son ADN collectif puis le profil idéal manquant.
Aucun biais sur genre/origine/âge — analyse uniquement les rôles, traits et descriptions.

Format JSON STRICT :
{
  "collectiveDna": {
    "dominantTraits": ["trait1","trait2","trait3","trait4","trait5"],
    "communicationStyle": "1-2 phrases factuelles",
    "decisionMode": "1-2 phrases (consensus / hiérarchique / agile / etc.)",
    "pace": "1 phrase (rythme cadencé / startup / réflexif)",
    "values": ["valeur1","valeur2","valeur3"],
    "blindSpots": ["zone d'ombre 1","zone d'ombre 2"]
  },
  "missingProfile": {
    "type": "Archétype du profil manquant (ex: Innovateur, Médiateur, Stratège)",
    "description": "2-3 phrases : qui chercher exactement et pourquoi",
    "keyStrengths": ["force1","force2","force3","force4"],
    "whyNeeded": "1-2 phrases : ce que ce profil apporterait à l'équipe"
  }
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res)) return;
  if (!getLLMConfig()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const body = req.body as Record<string, unknown>;
  if (!body.teamName || !Array.isArray(body.members) || body.members.length === 0) {
    return res.status(400).json({ error: 'teamName et members[] requis' });
  }

  const userContent = [
    `NOM DE L'ÉQUIPE : ${String(body.teamName).slice(0, 100)}`,
    body.teamDescription ? `CONTEXTE :\n${String(body.teamDescription).slice(0, 800)}` : '',
    `MEMBRES (${(body.members as unknown[]).length}) :\n${JSON.stringify(body.members).slice(0, 3500)}`,
  ].filter(Boolean).join('\n\n');

  try {
    const raw = await chatComplete(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userContent },
      ],
      1200,
      { maxRetries: 1, timeoutMs: 25_000 },
    );

    const result = extractJSON(raw);
    return res.status(200).json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'NO_LLM_CONFIGURED') return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
    return res.status(500).json({ error: 'AI_ERROR', detail: msg.slice(0, 200) });
  }
}
