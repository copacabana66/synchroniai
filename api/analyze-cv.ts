import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatComplete, extractJSON, getLLMConfig } from './lib/llm';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

const SYSTEM_PROMPT = `Tu es un expert en analyse de CV RH. Analyse le texte de CV fourni et retourne UNIQUEMENT un JSON strict, sans markdown ni texte autour.

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

  if (!getLLMConfig()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const { cvText } = req.body as { cvText?: string };
  if (!cvText || cvText.trim().length < 50) {
    return res.status(400).json({ error: 'cvText requis (texte extrait du PDF)' });
  }

  try {
    const raw = await chatComplete([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: `Voici le texte du CV à analyser :\n\n${cvText.slice(0, 8000)}` },
    ]);
    return res.status(200).json(extractJSON(raw));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('analyze-cv error:', msg);
    if (msg === 'NO_LLM_CONFIGURED') return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
    return res.status(500).json({ error: 'AI_ERROR', detail: msg.slice(0, 200) });
  }
}
