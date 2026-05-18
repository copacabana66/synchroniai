import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chatComplete, extractJSON, getLLMConfig } from './lib/llm';
import { guard, sanitizeText } from './lib/security';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

const SYSTEM_PROMPT = `Tu es un expert en analyse de CV RH. Analyse le texte de CV fourni et retourne un JSON strict.

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
}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!guard(req, res)) return;
  if (!getLLMConfig()) return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });

  const cvText = sanitizeText((req.body as Record<string, unknown>).cvText, 12_000);
  if (!cvText || cvText.length < 50) {
    return res.status(400).json({ error: 'cvText requis (min 50 caractères)' });
  }

  try {
    const raw = await chatComplete([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: `Texte du CV :\n\n${cvText.slice(0, 8000)}` },
    ]);
    return res.status(200).json(extractJSON(raw));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('analyze-cv error:', msg);
    if (msg === 'NO_LLM_CONFIGURED') return res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
    if (msg.startsWith('EMPTY_RESPONSE')) return res.status(502).json({ error: 'EMPTY_RESPONSE' });
    return res.status(500).json({ error: 'AI_ERROR', detail: msg.slice(0, 200) });
  }
}
