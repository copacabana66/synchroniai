-- ═══════════════════════════════════════════════════════════════
-- SynchroniAI — Schéma Supabase
-- À exécuter dans : Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- 1. Fiches de poste (recruteurs)
create table if not exists job_postings (
  id               uuid default gen_random_uuid() primary key,
  recruiter_id     uuid references auth.users on delete cascade,
  title            text not null,
  company          text,
  location         text,
  contract_type    text,
  salary_min       integer,
  salary_max       integer,
  description      text,
  expectations     text,
  team_profile     text,
  management_style text check (management_style in ('bienveillant','objectifs','directif','horizontal','autonomie')),
  management_detail text,
  status           text default 'draft' check (status in ('draft','published','closed')),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table job_postings enable row level security;
create policy "Recruteur voit ses propres fiches"
  on job_postings for all
  using (auth.uid() = recruiter_id);

-- 2. Profils candidats
create table if not exists candidate_profiles (
  id                   uuid references auth.users on delete cascade primary key,
  full_name            text,
  email                text,
  -- CV
  cv_url               text,  -- Supabase Storage path
  cv_text              text,  -- Texte extrait par IA
  cv_analyzed_at       timestamptz,
  -- Vidéo
  video_url            text,
  video_transcript     text,
  video_analyzed_at    timestamptz,
  -- Questionnaire
  management_pref      text,
  environment_pref     text,
  collaboration_pref   text,
  rhythm_pref          text,
  -- Préférences
  location_pref        text,
  salary_expectation   text,
  contract_type        text,
  availability         text,
  -- Statut analyse
  analysis_cv          boolean default false,
  analysis_questionnaire boolean default false,
  analysis_video       boolean default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table candidate_profiles enable row level security;
create policy "Candidat voit son propre profil"
  on candidate_profiles for all
  using (auth.uid() = id);

-- 3. Candidatures (matching candidat ↔ fiche de poste)
create table if not exists applications (
  id                  uuid default gen_random_uuid() primary key,
  candidate_id        uuid references candidate_profiles(id) on delete cascade,
  job_posting_id      uuid references job_postings(id) on delete cascade,
  compatibility_score integer check (compatibility_score between 0 and 100),
  -- Rapport IA structuré
  report              jsonb,   -- { dimensions: {...}, strengths: [...], gaps: [...], recommendation: "" }
  status              text default 'pending' check (status in ('pending','reviewing','accepted','rejected')),
  applied_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  unique (candidate_id, job_posting_id)
);

alter table applications enable row level security;
create policy "Candidat voit ses candidatures"
  on applications for select
  using (auth.uid() = candidate_id);
create policy "Recruteur voit candidatures de ses fiches"
  on applications for select
  using (
    exists (
      select 1 from job_postings jp
      where jp.id = job_posting_id and jp.recruiter_id = auth.uid()
    )
  );

-- 4. Bucket Storage (à créer manuellement dans Supabase → Storage)
-- Bucket "cvs"    : accès privé, taille max 10MB, types acceptés: pdf, docx
-- Bucket "videos" : accès privé, taille max 200MB, types acceptés: mp4, webm, mov
