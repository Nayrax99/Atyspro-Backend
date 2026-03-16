-- Migration 004: Mise à jour des statuts de leads
-- Anciens statuts → Nouveaux statuts métier
--
-- IMPORTANT : respecter cet ordre pour éviter les collisions
-- 1. needs_review  → temp_incomplete (temporaire)
-- 2. incomplete    → new
-- 3. temp_incomplete → incomplete
-- 4. complete      → processed

-- Étape 1 : Protéger les needs_review avant de migrer les incomplete
UPDATE leads SET status = 'temp_incomplete' WHERE status = 'needs_review';

-- Étape 2 : Anciens "incomplete" (qualif partielle) → "new" (nouveau lead)
UPDATE leads SET status = 'new' WHERE status = 'incomplete';

-- Étape 3 : needs_review (renommé temporairement) → "incomplete" (nouveau sens : infos manquantes)
UPDATE leads SET status = 'incomplete' WHERE status = 'temp_incomplete';

-- Étape 4 : complete → processed
UPDATE leads SET status = 'processed' WHERE status = 'complete';
