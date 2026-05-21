import { supabase, isConfigured } from './supabase';

export type ApplicationStatus = 'pending' | 'reviewed' | 'interview' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  candidate_id: string;
  job_posting_id: string;
  recruiter_id: string;
  status: ApplicationStatus;
  candidate_message?: string | null;
  match_score?: number | null;
  match_report?: Record<string, unknown> | null;
  applied_at?: string;
  updated_at?: string;
}

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending:   'En attente',
  reviewed:  'Vue',
  interview: 'Entretien',
  accepted:  'Acceptée',
  rejected:  'Refusée',
};

export const STATUS_COLOR: Record<ApplicationStatus, { bg: string; fg: string }> = {
  pending:   { bg: '#FEF3C7', fg: '#92400E' },
  reviewed:  { bg: '#DBEAFE', fg: '#1E40AF' },
  interview: { bg: '#DDD6FE', fg: '#5B21B6' },
  accepted:  { bg: '#D1FAE5', fg: '#065F46' },
  rejected:  { bg: '#FEE2E2', fg: '#991B1B' },
};

/**
 * Postule à une offre. Le score et le rapport de matching sont gelés
 * au moment de la candidature (audit + transparence).
 */
export async function applyToJob(payload: {
  candidateId: string;
  jobPostingId: string;
  recruiterId: string;
  matchScore?: number;
  matchReport?: Record<string, unknown>;
  message?: string;
}): Promise<{ ok: boolean; error?: string; duplicate?: boolean }> {
  if (!isConfigured) return { ok: false, error: 'NOT_CONFIGURED' };

  // Nettoyage du message : on garde la chaîne brute (même vide) pour différencier
  // 'pas de message envoyé' de 'message envoyé mais perdu en DB'
  const cleanMessage = typeof payload.message === 'string' ? payload.message.trim() : null;

  console.log('[applyToJob] message à envoyer :', JSON.stringify(cleanMessage), '(longueur', (cleanMessage ?? '').length, ')');

  const { data, error } = await supabase
    .from('applications')
    .insert([{
      candidate_id:      payload.candidateId,
      job_posting_id:    payload.jobPostingId,
      recruiter_id:      payload.recruiterId,
      candidate_message: cleanMessage && cleanMessage.length > 0 ? cleanMessage : null,
      match_score:       payload.matchScore ?? null,
      match_report:      payload.matchReport ?? null,
      status:            'pending',
    }])
    .select('id, candidate_message, status, applied_at')
    .single();

  if (error) {
    // 23505 = unique constraint violation (déjà postulé)
    if (error.code === '23505') return { ok: false, duplicate: true };
    console.error('[applyToJob] échec Supabase :', error.code, error.message, error.details);
    return { ok: false, error: error.message };
  }

  // Vérification post-insert : le message est-il bien arrivé en DB ?
  console.log('[applyToJob] OK — row inséré :', data);
  if (cleanMessage && cleanMessage.length > 0 && !data.candidate_message) {
    console.warn('[applyToJob] ⚠ Message envoyé mais non sauvegardé en DB. Vérifiez les RLS / colonne candidate_message.');
  }
  return { ok: true };
}

export async function fetchMyApplications(candidateId: string): Promise<Application[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('applied_at', { ascending: false });
  if (error) { console.error('fetchMyApplications:', error.message); return []; }
  return (data ?? []) as Application[];
}

export async function fetchRecruiterApplications(recruiterId: string): Promise<Application[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('recruiter_id', recruiterId)
    .order('applied_at', { ascending: false });
  if (error) { console.error('fetchRecruiterApplications:', error.message); return []; }
  return (data ?? []) as Application[];
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
  if (!isConfigured) return;
  const { error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('updateApplicationStatus:', error.message);
}
