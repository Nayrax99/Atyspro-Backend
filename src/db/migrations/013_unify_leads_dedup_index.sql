-- Migration 013 — Unification des index de déduplication des leads
--
-- Contexte:
-- Les migrations précédentes avaient créé deux index UNIQUE partiels sur
-- (account_id, client_phone) :
--   - leads_sms_dedup  : WHERE source = 'sms' OR source IS NULL
--   - leads_voice_dedup : WHERE source = 'voice' (migration 012)
--
-- Problème:
-- Le client supabase-js ne supporte pas la syntaxe
-- `ON CONFLICT (col1, col2) WHERE <condition>` lors d'un upsert.
-- Postgres exige cette clause WHERE pour matcher un index partiel
-- (erreur 42P10: "no unique or exclusion constraint matching").
-- Conséquence: les upserts voice ET sms échouaient.
--
-- Solution:
-- On supprime les deux index partiels et on les remplace par un index
-- UNIQUE global. Un client = un lead par compte, tous canaux confondus.
-- Si un client recontacte par un canal différent, le lead existant est
-- mis à jour plutôt que dupliqué.

DROP INDEX IF EXISTS public.leads_voice_dedup;
DROP INDEX IF EXISTS public.leads_sms_dedup;

CREATE UNIQUE INDEX IF NOT EXISTS leads_account_phone_unique
  ON public.leads (account_id, client_phone);

COMMENT ON INDEX public.leads_account_phone_unique IS
  'Déduplique les leads par client (account_id + client_phone), tous canaux confondus (voice/sms). Si un client recontacte par un autre canal, on update le lead existant.';
