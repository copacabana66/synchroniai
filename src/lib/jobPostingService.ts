import { supabase, isConfigured } from './supabase';
import type { JobPosting } from '../types';
import { getJobPostings as localGet, saveJobPosting as localSave } from './storage';

// Map DB row (snake_case) → JobPosting (camelCase)
function mapRow(r: Record<string, unknown>): JobPosting {
  return {
    id:               r.id as string,
    recruiterId:      r.recruiter_id as string,
    title:            r.title as string,
    company:          (r.company as string) ?? '',
    location:         (r.location as string) ?? '',
    contractType:     (r.contract_type as string) ?? '',
    salaryMin:        String(r.salary_min ?? ''),
    salaryMax:        String(r.salary_max ?? ''),
    description:      (r.description as string) ?? '',
    expectations:     (r.expectations as string) ?? '',
    teamProfile:      (r.team_profile as string) ?? '',
    managementStyle:  (r.management_style as JobPosting['managementStyle']) ?? '',
    managementDetail: (r.management_detail as string) ?? '',
    status:           (r.status as JobPosting['status']) ?? 'draft',
    createdAt:        r.created_at as string,
    updatedAt:        r.updated_at as string,
  };
}

// Map JobPosting → DB row
function mapToRow(p: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    recruiter_id:    p.recruiterId,
    title:           p.title,
    company:         p.company,
    location:        p.location,
    contract_type:   p.contractType,
    salary_min:      p.salaryMin ? parseInt(p.salaryMin) : null,
    salary_max:      p.salaryMax ? parseInt(p.salaryMax) : null,
    description:     p.description,
    expectations:    p.expectations,
    team_profile:    p.teamProfile,
    management_style: p.managementStyle || null,
    management_detail: p.managementDetail,
    status:          p.status,
  };
}

export async function fetchJobPostings(recruiterId?: string): Promise<JobPosting[]> {
  if (!isConfigured) return localGet();
  let query = supabase.from('job_postings').select('*').order('created_at', { ascending: false });
  if (recruiterId) query = query.eq('recruiter_id', recruiterId);
  const { data, error } = await query;
  if (error) { console.error('fetchJobPostings error:', error.message); return localGet(); }
  return (data ?? []).map(mapRow);
}

export async function createJobPosting(
  posting: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<JobPosting> {
  if (!isConfigured) return localSave(posting);
  const { data, error } = await supabase
    .from('job_postings')
    .insert([mapToRow(posting)])
    .select()
    .single();
  if (error) { console.error('createJobPosting error:', error.message); return localSave(posting); }
  return mapRow(data);
}

export async function updateJobPostingStatus(id: string, status: JobPosting['status']): Promise<void> {
  if (!isConfigured) return;
  const { error } = await supabase
    .from('job_postings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('updateJobPostingStatus error:', error.message);
}
