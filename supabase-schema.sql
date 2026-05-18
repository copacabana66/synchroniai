-- ============================================================
-- SynchroniAI — Schéma Supabase
-- Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Profils candidats
create table if not exists candidate_profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  full_name              text,
  email                  text,
  cv_url                 text,
  cv_text                text,           -- JSON : CvAnalysisData
  cv_analyzed_at         timestamptz,
  video_url              text,
  video_transcript       text,
  video_analysis         text,           -- JSON : VideoAnalysisData
  video_analyzed_at      timestamptz,
  management_pref        text,
  environment_pref       text,
  collaboration_pref     text,
  rhythm_pref            text,
  location_pref          text,
  salary_expectation     text,
  contract_type          text,
  availability           text,
  analysis_cv            boolean not null default false,
  analysis_questionnaire boolean not null default false,
  analysis_video         boolean not null default false,
  analysis_assessment    boolean not null default false,
  -- Tests cognitif + personnalité (Big Five)
  assessment_cognitive   jsonb,            -- scores par dimension + total
  assessment_personality jsonb,            -- Big Five (OCEAN) + type comportemental
  assessment_responses   jsonb,            -- toutes les réponses brutes (audit)
  assessment_completed_at timestamptz,
  updated_at             timestamptz default now()
);

-- Migration : colonnes ajoutées sur tables existantes
alter table candidate_profiles add column if not exists analysis_assessment     boolean not null default false;
alter table candidate_profiles add column if not exists assessment_cognitive    jsonb;
alter table candidate_profiles add column if not exists assessment_personality  jsonb;
alter table candidate_profiles add column if not exists assessment_responses    jsonb;
alter table candidate_profiles add column if not exists assessment_completed_at timestamptz;

alter table candidate_profiles enable row level security;

drop policy if exists "candidat_own_select"        on candidate_profiles;
drop policy if exists "candidat_own_insert"        on candidate_profiles;
drop policy if exists "candidat_own_update"        on candidate_profiles;
drop policy if exists "recruiter_see_candidates"   on candidate_profiles;
-- anciens noms éventuels
drop policy if exists "Candidat lit son profil"             on candidate_profiles;
drop policy if exists "Candidat crée/met à jour son profil" on candidate_profiles;
drop policy if exists "Candidat met à jour son profil"      on candidate_profiles;
drop policy if exists "Recruteurs voient les candidats"     on candidate_profiles;

create policy "candidat_own_select"       on candidate_profiles for select using (auth.uid() = id);
create policy "candidat_own_insert"       on candidate_profiles for insert with check (auth.uid() = id);
create policy "candidat_own_update"       on candidate_profiles for update using (auth.uid() = id);
create policy "recruiter_see_candidates"  on candidate_profiles for select using (analysis_cv = true);


-- 2. Fiches de poste
create table if not exists job_postings (
  id                uuid primary key default gen_random_uuid(),
  recruiter_id      uuid references auth.users(id) on delete cascade,
  title             text not null,
  company           text,
  location          text,
  contract_type     text,
  salary_min        integer,
  salary_max        integer,
  description       text,
  expectations      text,
  team_profile      text,
  management_style  text,
  management_detail text,
  status            text not null default 'draft' check (status in ('draft','published','closed')),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table job_postings enable row level security;

drop policy if exists "recruiter_own_postings"              on job_postings;
drop policy if exists "candidates_see_published"            on job_postings;
-- anciens noms éventuels
drop policy if exists "Recruteur voit ses propres fiches"   on job_postings;
drop policy if exists "Recruteur gère ses fiches"           on job_postings;
drop policy if exists "Candidats voient les fiches publiées" on job_postings;

create policy "recruiter_own_postings"   on job_postings for all
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

create policy "candidates_see_published" on job_postings for select
  using (status = 'published');


-- 3. Équipes recruteur (Team Discovery — ADN d'entreprise)
create table if not exists recruiter_teams (
  id                  uuid primary key default gen_random_uuid(),
  recruiter_id        uuid references auth.users(id) on delete cascade,
  team_name           text not null,
  team_description    text,
  team_members        jsonb,             -- [{name, role, bigFive?, traits}]
  collective_dna      jsonb,             -- résultat de l'analyse : profils dominants, valeurs, etc.
  missing_profile     jsonb,             -- profil idéal manquant suggéré
  analysis_status     text not null default 'pending' check (analysis_status in ('pending','done','error')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table recruiter_teams enable row level security;

drop policy if exists "team_own"       on recruiter_teams;
create policy "team_own" on recruiter_teams for all
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);


-- 4. Buckets de stockage
insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('videos', 'videos', false)
  on conflict (id) do nothing;

drop policy if exists "cv_upload_own"    on storage.objects;
drop policy if exists "cv_read_own"      on storage.objects;
drop policy if exists "audio_upload_own" on storage.objects;
drop policy if exists "audio_read_own"   on storage.objects;
-- anciens noms éventuels
drop policy if exists "Upload CV propre dossier"    on storage.objects;
drop policy if exists "Lecture CV propre dossier"   on storage.objects;
drop policy if exists "Upload audio propre dossier" on storage.objects;
drop policy if exists "Lecture audio propre dossier" on storage.objects;

create policy "cv_upload_own"    on storage.objects for insert
  with check (bucket_id = 'cvs'    and auth.uid()::text = (storage.foldername(name))[1]);

create policy "cv_read_own"      on storage.objects for select
  using     (bucket_id = 'cvs'    and auth.uid()::text = (storage.foldername(name))[1]);

create policy "audio_upload_own" on storage.objects for insert
  with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "audio_read_own"   on storage.objects for select
  using     (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);
