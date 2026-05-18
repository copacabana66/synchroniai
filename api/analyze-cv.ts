import type { VercelRequest, VercelResponse } from '@vercel/node';
import pdfParse from 'pdf-parse';
import { chatComplete, extractJSON, getLLMConfig } from './lib/llm';
import { guard, sanitizeText } from './lib/security';

// Accept PDF binaries up to 6 MB (base64 ~4.5 MB PDF → ~6 MB string)
export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };

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

  const body = req.body as Record<string, unknown>;

  // ── Extraction du texte ──────────────────────────────────────────────────
  let cvText = '';

  if (body.pdfBase64) {
    // Nouveau flux : PDF envoyé en base64, extraction serveur (zéro dépendance navigateur)
    if (typeof body.pdfBase64 !== 'string' || body.pdfBase64.length > 8_000_000) {
      return res.status(413).json({ error: 'FILE_TOO_LARGE', detail: 'Max 4 MB PDF' });
    }
    try {
      const buffer = Buffer.from(body.pdfBase64, 'base64');
      if (buffer.length < 100) return res.status(400).json({ error: 'PDF_EMPTY' });
      const parsed = await pdfParse(buffer);
      cvText = parsed.text ?? '';
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[analyze-cv] pdf-parse error:', msg);
      return res.status(422).json({ error: 'PDF_PARSE_ERROR', detail: 'Le PDF est illisible ou corrompu.' });
    }
  } else if (body.cvText) {
    // Flux legacy : texte déjà extrait côté client
    cvText = sanitizeText(body.cvText, 12_000) ?? '';
  }

  if (!cvText || cvText.trim().length < 50) {
    return res.status(400).json({
      error: 'EMPTY_CV',
      detail: 'Le CV ne contient pas de texte lisible. Utilisez un PDF généré par Word ou LibreOffice (pas un scan).',
    });
  }

  // ── Analyse LLM ──────────────────────────────────────────────────────────
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
