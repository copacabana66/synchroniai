import { supabase, isConfigured } from './supabase';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  traits: string[];          // adjectifs choisis (ex: "Méthodique", "Créatif")
}

export interface CollectiveDNA {
  dominantTraits: string[];           // 5 traits dominants de l'équipe
  communicationStyle: string;
  decisionMode: string;
  pace: string;
  values: string[];
  blindSpots: string[];               // ce qui manque
}

export interface MissingProfile {
  type: string;                       // archétype manquant
  description: string;
  keyStrengths: string[];
  whyNeeded: string;
}

export interface RecruiterTeam {
  id?: string;
  recruiter_id?: string;
  team_name: string;
  team_description?: string;
  team_members: TeamMember[];
  collective_dna?: CollectiveDNA;
  missing_profile?: MissingProfile;
  analysis_status?: 'pending' | 'done' | 'error';
  created_at?: string;
  updated_at?: string;
}

export async function saveTeam(recruiterId: string, team: Omit<RecruiterTeam, 'id' | 'recruiter_id' | 'created_at' | 'updated_at'>): Promise<RecruiterTeam | null> {
  if (!isConfigured) return null;
  const payload = { ...team, recruiter_id: recruiterId, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('recruiter_teams')
    .insert([payload])
    .select()
    .single();
  if (error) { console.error('saveTeam:', error.message); return null; }
  return data;
}

export async function updateTeamAnalysis(teamId: string, dna: CollectiveDNA, missing: MissingProfile): Promise<void> {
  if (!isConfigured) return;
  const { error } = await supabase
    .from('recruiter_teams')
    .update({
      collective_dna:  dna,
      missing_profile: missing,
      analysis_status: 'done',
      updated_at:      new Date().toISOString(),
    })
    .eq('id', teamId);
  if (error) console.error('updateTeamAnalysis:', error.message);
}

export async function fetchTeams(recruiterId: string): Promise<RecruiterTeam[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('recruiter_teams')
    .select('*')
    .eq('recruiter_id', recruiterId)
    .order('updated_at', { ascending: false });
  if (error) { console.error('fetchTeams:', error.message); return []; }
  return data ?? [];
}

export async function deleteTeam(teamId: string): Promise<void> {
  if (!isConfigured) return;
  await supabase.from('recruiter_teams').delete().eq('id', teamId);
}
