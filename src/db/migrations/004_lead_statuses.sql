-- Migration 004 : Renommer les statuts de leads en slugs français
-- À exécuter dans Supabase SQL Editor

-- Anciens statuts → Nouveaux statuts français
-- new          → nouveau
-- to_process   → a_traiter
-- incomplete   → incomplet
-- processed    → traite
-- needs_review → a_traiter (ancien mobile)
-- complete     → traite (ancien mobile)

-- IMPORTANT : respecter cet ordre pour éviter les collisions
-- Utiliser une colonne temporaire pour éviter les conflits de clés

-- PREREQUISITE: The `status` column must be plain TEXT (no CHECK constraint, no ENUM).
-- Verify with: SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'leads';
-- If constraints exist, drop them first before running this migration.

BEGIN;

-- Étape 1 : Marquer les valeurs source avec un préfixe temporaire
UPDATE public.leads SET status = 'tmp_' || status WHERE status IN ('new', 'to_process', 'incomplete', 'processed', 'needs_review', 'complete');

-- Étape 2 : Appliquer les mappings finaux
UPDATE public.leads SET status = 'nouveau' WHERE status = 'tmp_new';
UPDATE public.leads SET status = 'a_traiter' WHERE status = 'tmp_to_process';
UPDATE public.leads SET status = 'incomplet' WHERE status = 'tmp_incomplete';
UPDATE public.leads SET status = 'traite' WHERE status = 'tmp_processed';
UPDATE public.leads SET status = 'a_traiter' WHERE status = 'tmp_needs_review';
UPDATE public.leads SET status = 'traite' WHERE status = 'tmp_complete';

COMMIT;

-- Étape 3 : Vérification — doit retourner 0 lignes (tous les préfixes tmp_ résolus)
SELECT id, status FROM public.leads WHERE status LIKE 'tmp_%';

-- Vérification distributive — revoir les comptages
SELECT status, COUNT(*) as count FROM public.leads GROUP BY status ORDER BY status;

-- ============================================================
-- ROLLBACK (if needed — run manually):
-- BEGIN;
-- UPDATE public.leads SET status = 'new'        WHERE status = 'nouveau';
-- UPDATE public.leads SET status = 'to_process' WHERE status = 'a_traiter';
-- UPDATE public.leads SET status = 'incomplete' WHERE status = 'incomplet';
-- UPDATE public.leads SET status = 'processed'  WHERE status = 'traite';
-- COMMIT;
-- ============================================================
