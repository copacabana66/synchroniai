import type { JobPosting } from '../types';

const JOB_POSTINGS_KEY = 'synchroniai_job_postings';

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export function getJobPostings(): JobPosting[] {
  try {
    const raw = localStorage.getItem(JOB_POSTINGS_KEY);
    return raw ? (JSON.parse(raw) as JobPosting[]) : [];
  } catch {
    return [];
  }
}

export function saveJobPosting(posting: Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'>): JobPosting {
  const postings = getJobPostings();
  const now = new Date().toISOString();
  const newPosting: JobPosting = {
    ...posting,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(JOB_POSTINGS_KEY, JSON.stringify([newPosting, ...postings]));
  return newPosting;
}

export function updateJobPosting(id: string, updates: Partial<JobPosting>): JobPosting | null {
  const postings = getJobPostings();
  const idx = postings.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const updated = { ...postings[idx], ...updates, updatedAt: new Date().toISOString() };
  postings[idx] = updated;
  localStorage.setItem(JOB_POSTINGS_KEY, JSON.stringify(postings));
  return updated;
}

export function deleteJobPosting(id: string): void {
  const postings = getJobPostings().filter(p => p.id !== id);
  localStorage.setItem(JOB_POSTINGS_KEY, JSON.stringify(postings));
}
