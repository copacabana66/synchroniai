import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatComplete, extractJSON, getLLMConfig } from './lib/llm';

const SYSTEM_PROMPT = `Tu es un expert RH francophone. À partir de la description du recruteur, génère une fiche de poste complète et professionnelle.
Retourne UNIQUEMENT un JSON strict, sans markdown ni texte autour.

Format JSON attendu :
{
  "title": "Intitulé exact du poste",
  "location": "Ville ou Remote",
  "contractType": "CDI",
  "salaryMin": "45000",
  "salaryMax": "55000",
  "description": "3-5 phrases décrivant les missions principales et le contexte.",
  "expectations": "- compétence 1\\n- compétence 2\\n- compétence 3",
  "teamProfile": "2-3 phrases sur la composition et culture de l'équipe.",
  "managementStyle": "bienveillant",
  "managementDetail": "1-2 phrases sur le style de management concret."
}

managementStyle doit être : "bienveillant", "objectifs", "directif", "horizontal" ou "autonomie".
contractType doit être : "CDI", "CDD", "Freelance / Mission" ou "Stage / Alternance".
Réponds UNIQUEMENT avec le JSON.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!getLLMConfig()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const { prompt } = req.body as { prompt?: string };
  if (!prompt || prompt.trim().length < 10) {
    return res.status(400).json({ error: 'Prompt trop court' });
  }

  try {
    const raw = await chatComplete([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: `Description du recruteur :\n${prompt}` },
    ]);
    return res.status(200).json(extractJSON(raw));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('generate-job-posting error:', msg);
    if (msg === 'NO_LLM_CONFIGURED') return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
    return res.status(500).json({ error: 'AI_ERROR', detail: msg.slice(0, 200) });
  }
}
