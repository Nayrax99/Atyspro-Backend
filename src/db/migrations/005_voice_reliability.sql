-- Migration 005 : Fiabilité du pipeline vocal
-- À exécuter dans Supabase SQL Editor
--
-- Changements :
--   1. calls.voice_ai_result (JSONB) — stocke le parsedData LLM pour éviter de passer
--      les données de qualification dans les URLs des webhooks Gather/Confirm (fix #3/#6).
--   2. leads.twilio_call_sid (TEXT) — lien entre un lead vocal et l'appel source ;
--      index partiel unique pour prévenir les doublons sur retry Twilio (fix #2).
--   3. Index unique leads(account_id, client_phone) — empêche la création de leads
--      dupliqués en cas de webhooks SMS simultanés (fix #7).
--      ⚠️  Ce constraint implique un seul lead actif par numéro de client.
--          Si plusieurs leads par téléphone sont nécessaires à l'avenir,
--          supprimer cet index et adapter la logique de déduplication.

-- 1. Colonne de résultat LLM sur les appels vocaux
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS voice_ai_result JSONB;

-- 2. Lien call_sid sur les leads vocaux
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS twilio_call_sid TEXT;

-- Index unique partiel : seulement quand twilio_call_sid est renseigné
-- (les NULLs — leads SMS — ne déclenchent pas de contrainte).
CREATE UNIQUE INDEX IF NOT EXISTS leads_voice_dedup
  ON public.leads(account_id, twilio_call_sid)
  WHERE twilio_call_sid IS NOT NULL;

-- 3. Index unique SMS : un seul lead actif par (compte, numéro client)
CREATE UNIQUE INDEX IF NOT EXISTS leads_sms_dedup
  ON public.leads(account_id, client_phone);

-- Vérification
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'calls' AND column_name = 'voice_ai_result') AS calls_voice_ai_result_added,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'leads' AND column_name = 'twilio_call_sid') AS leads_twilio_call_sid_added;

-- ROLLBACK (exécuter manuellement si nécessaire) :
-- DROP INDEX IF EXISTS public.leads_voice_dedup;
-- DROP INDEX IF EXISTS public.leads_sms_dedup;
-- ALTER TABLE public.leads DROP COLUMN IF EXISTS twilio_call_sid;
-- ALTER TABLE public.calls DROP COLUMN IF EXISTS voice_ai_result;
