import { supabase, isConfigured } from './supabase';

export interface RecruiterNote {
  recruiter_id: string;
  candidate_id: string;
  note: string | null;
  status: string | null;
  updated_at?: string;
}

export async function fetchNotes(recruiterId: string): Promise<Record<string, RecruiterNote>> {
  if (!isConfigured || !recruiterId) return {};
  const { data, error } = await supabase
    .from('recruiter_candidate_notes')
    .select('*')
    .eq('recruiter_id', recruiterId);
  if (error) { console.error('fetchNotes:', error.message); return {}; }
  const map: Record<string, RecruiterNote> = {};
  for (const row of data ?? []) map[row.candidate_id as string] = row as RecruiterNote;
  return map;
}

export async function upsertNote(recruiterId: string, candidateId: string, patch: Partial<RecruiterNote>): Promise<void> {
  if (!isConfigured) return;
  const { error } = await supabase
    .from('recruiter_candidate_notes')
    .upsert({
      recruiter_id: recruiterId,
      candidate_id: candidateId,
      ...patch,
      updated_at: new Date().toISOString(),
    });
  if (error) console.error('upsertNote:', error.message);
}
