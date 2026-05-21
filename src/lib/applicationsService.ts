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

  const cleanMessage = typeof payload.message === 'string' ? payload.message.trim() : '';
  const hasMessage   = cleanMessage.length > 0;

  // ─────────────────────────────────────────────────────────────
  // STRATÉGIE DOUBLE : le message est envoyé à 2 endroits différents
  //   1) Colonne dédiée 'candidate_message' (idéal si le schéma est OK)
  //   2) Embarqué dans match_report.candidateMessage (jsonb — toujours OK)
  // Le recruteur lit en priorité la colonne, et fallback sur le JSON.
  // ─────────────────────────────────────────────────────────────
  const matchReportWithMessage = {
    ...(payload.matchReport ?? {}),
    candidateMessage: hasMessage ? cleanMessage : null,
  };

  // Tentative 1 : insert complet (colonne dédiée + JSON)
  let { data, error } = await supabase
    .from('applications')
    .insert([{
      candidate_id:      payload.candidateId,
      job_posting_id:    payload.jobPostingId,
      recruiter_id:      payload.recruiterId,
      candidate_message: hasMessage ? cleanMessage : null,
      match_score:       payload.matchScore ?? null,
      match_report:      matchReportWithMessage,
      status:            'pending',
    }])
    .select('id, candidate_message, status, applied_at')
    .single();

  // Tentative 2 : si la colonne candidate_message n'existe pas, on retry sans elle
  // (le message reste dans match_report.candidateMessage)
  if (error && (error.code === 'PGRST204' || error.message?.includes('candidate_message'))) {
    console.warn('[applyToJob] Colonne candidate_message indisponible — fallback JSON');
    const retry = await supabase
      .from('applications')
      .insert([{
        candidate_id:      payload.candidateId,
        job_posting_id:    payload.jobPostingId,
        recruiter_id:      payload.recruiterId,
        match_score:       payload.matchScore ?? null,
        match_report:      matchReportWithMessage,
        status:            'pending',
      }])
      .select('id, status, applied_at')
      .single();
    data  = retry.data as typeof data;
    error = retry.error;
  }

  if (error) {
    if (error.code === '23505') return { ok: false, duplicate: true };
    console.error('[applyToJob] échec :', error.code, error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Extrait le message du candidat avec fallback : colonne dédiée → match_report */
export function getCandidateMessage(app: Application): string | null {
  if (app.candidate_message) return app.candidate_message;
  const report = app.match_report as Record<string, unknown> | undefined;
  const msg = report?.candidateMessage;
  return typeof msg === 'string' && msg.trim().length > 0 ? msg : null;
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
