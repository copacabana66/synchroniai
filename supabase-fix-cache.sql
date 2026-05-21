-- ============================================================
-- FIX rapide : ajoute les colonnes manquantes sur 'applications'
-- + force PostgREST à recharger son cache de schéma
-- À exécuter dans Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. S'assure que toutes les colonnes existent (idempotent)
alter table applications add column if not exists candidate_message text;
alter table applications add column if not exists match_score       integer;
alter table applications add column if not exists match_report      jsonb;
alter table applications add column if not exists status            text default 'pending';
alter table applications add column if not exists applied_at        timestamptz default now();
alter table applications add column if not exists updated_at        timestamptz default now();

-- 2. Force PostgREST à recharger le schéma — résout le "schema cache" error
notify pgrst, 'reload schema';

-- 3. Vérifie que les colonnes sont bien là
select column_name, data_type
from information_schema.columns
where table_name = 'applications'
order by ordinal_position;
