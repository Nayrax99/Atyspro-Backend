-- Migration 012 — Index UNIQUE pour upsert des leads vocaux
--
-- Contexte:
-- L'index existant `leads_sms_dedup` couvre uniquement les leads SMS et legacy
-- (WHERE source = 'sms' OR source IS NULL). Les leads créés par Maya via le
-- WebSocket (source = 'voice') faisaient échouer l'upsert ON CONFLICT
-- (account_id, client_phone) avec l'erreur Postgres 42P10.
--
-- Cette migration ajoute l'index symétrique pour la source 'voice', rendant
-- l'upsert fonctionnel pour les deux canaux de qualification.

CREATE UNIQUE INDEX IF NOT EXISTS leads_voice_dedup
  ON public.leads (account_id, client_phone)
  WHERE source = 'voice';

COMMENT ON INDEX public.leads_voice_dedup IS
  'Permet l''upsert ON CONFLICT (account_id, client_phone) pour les leads créés via Maya (source=voice). Symétrique à leads_sms_dedup pour le canal SMS.';
