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

-- Étape 1 : Marquer les valeurs source avec un préfixe temporaire
UPDATE public.leads SET status = 'tmp_' || status WHERE status IN ('new', 'to_process', 'incomplete', 'processed', 'needs_review', 'complete');

-- Étape 2 : Appliquer les mappings finaux
UPDATE public.leads SET status = 'nouveau' WHERE status = 'tmp_new';
UPDATE public.leads SET status = 'a_traiter' WHERE status = 'tmp_to_process';
UPDATE public.leads SET status = 'incomplet' WHERE status = 'tmp_incomplete';
UPDATE public.leads SET status = 'traite' WHERE status = 'tmp_processed';
UPDATE public.leads SET status = 'a_traiter' WHERE status = 'tmp_needs_review';
UPDATE public.leads SET status = 'traite' WHERE status = 'tmp_complete';

-- Étape 3 : Vérification — doit retourner 0 lignes si tout est OK
-- (vérifier qu'il n'y a plus de statuts avec le préfixe temporaire)
SELECT id, status FROM public.leads WHERE status LIKE 'tmp_%';
