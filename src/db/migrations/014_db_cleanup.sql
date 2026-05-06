-- Migration 014 — DB Cleanup (sprint 0.6)
--
-- Contexte:
-- L'audit du schéma a révélé 8 paires de colonnes legacy/new redondantes,
-- 2 colonnes orphelines, un enum lead_status pollué (10 valeurs dont seules
-- 3 utilisées), et plusieurs index manquants ou redondants.
--
-- Cette migration a été appliquée manuellement dans Supabase SQL Editor avant
-- d'être committée pour traçabilité. Elle ne sera pas rejouée.
--
-- Actions:
--   1. Suppression de 10 colonnes fantômes/mortes de `leads`
--   2. Recréation de l'enum lead_status (text → enum FR uniquement)
--   3. Ajout des index UNIQUE manquants
--   4. Drop de l'index leads_voice_idx redondant

BEGIN;

-- 1. Suppression des colonnes fantômes / supersédées / orphelines
ALTER TABLE public.leads DROP COLUMN IF EXISTS contact_name;
ALTER TABLE public.leads DROP COLUMN IF EXISTS phone;
ALTER TABLE public.leads DROP COLUMN IF EXISTS request_text;
ALTER TABLE public.leads DROP COLUMN IF EXISTS job_type;
ALTER TABLE public.leads DROP COLUMN IF EXISTS urgency;
ALTER TABLE public.leads DROP COLUMN IF EXISTS score;
ALTER TABLE public.leads DROP COLUMN IF EXISTS is_dangerous;
ALTER TABLE public.leads DROP COLUMN IF EXISTS estimated_scope;
ALTER TABLE public.leads DROP COLUMN IF EXISTS logement_type;
ALTER TABLE public.leads DROP COLUMN IF EXISTS callback_delay;

-- 2. Recréation de l'enum lead_status avec les 3 valeurs FR uniquement
ALTER TABLE public.leads ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.leads ALTER COLUMN status TYPE text USING status::text;
DROP TYPE IF EXISTS lead_status;
CREATE TYPE lead_status AS ENUM ('a_traiter', 'incomplet', 'traite');
ALTER TABLE public.leads ALTER COLUMN status TYPE lead_status USING status::lead_status;
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'a_traiter'::lead_status;
ALTER TABLE public.leads ALTER COLUMN status SET NOT NULL;

-- 3. Index UNIQUE manquants
CREATE UNIQUE INDEX IF NOT EXISTS phone_numbers_e164_unique
  ON public.phone_numbers (e164);

DROP INDEX IF EXISTS public.idx_accounts_user_id;
CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_id_unique
  ON public.accounts (user_id)
  WHERE user_id IS NOT NULL;

-- 4. Drop index redondant
DROP INDEX IF EXISTS public.leads_voice_idx;

COMMIT;
