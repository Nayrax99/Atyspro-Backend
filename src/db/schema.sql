-- AtysPro — Schema consolidé
-- Dernière migration appliquée : 014_db_cleanup.sql
-- Date : mai 2026
--
-- Colonnes marquées (* pré-existantes) ne figurent dans aucune migration ;
-- elles sont déduites du code et du CLAUDE.md.
-- Migrations de données pures (pas de DDL) :
--   004 — renommage des statuts leads
--   008 — specialty 'autre' → 'admin'
--   009 — documentation uniquement (pas de changement schéma)

-- ============================================================
-- ENUMS
-- ============================================================

-- lead_status : seules 3 valeurs FR autorisées (mig. 014)
-- Le badge "Nouveau" est calculé côté UI (created_at < now - 24h), jamais stocké.
CREATE TYPE lead_status AS ENUM ('a_traiter', 'incomplet', 'traite');

-- danger_level et scope sont TEXT avec contraintes CHECK (pas d'enum Postgres)

-- ============================================================
-- TABLES
-- ============================================================

-- accounts : profil artisan
-- Étendu par mig. 001 (user_id, email), 002 (onboarding), 003 (admin),
--             007 (profil enrichi), 011 (pro_phone)
CREATE TABLE IF NOT EXISTS public.accounts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),        -- *
  created_at           TIMESTAMPTZ DEFAULT now(),                                -- *
  user_id              UUID        REFERENCES auth.users(id) ON DELETE SET NULL, -- 001
  email                TEXT,                                                     -- 001
  owner_phone          TEXT,                                                     -- 002
  city                 TEXT,                                                     -- 002
  specialty            TEXT        DEFAULT 'electricien',                        -- 002
  onboarding_completed BOOLEAN     DEFAULT false,                                -- 002
  is_admin             BOOLEAN     DEFAULT FALSE,                                -- 003
  artisan_name         TEXT,                                                     -- *
  first_name           TEXT,                                                     -- 007
  last_name            TEXT,                                                     -- 007
  company_name         TEXT,                                                     -- 007
  welcome_message      TEXT,                                                     -- 007
  assistant_name       TEXT,                                                     -- 007
  score_threshold      INTEGER     DEFAULT 0,                                    -- 007
  callback_delay       TEXT        DEFAULT '24h',                                -- 007
  pro_phone            TEXT                                                      -- 011
);

-- phone_numbers : numéros Twilio associés à un compte
CREATE TABLE IF NOT EXISTS public.phone_numbers (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(), -- *
  e164       TEXT        NOT NULL UNIQUE,                       -- *
  account_id UUID        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE, -- *
  active     BOOLEAN     NOT NULL DEFAULT false,                -- *
  created_at TIMESTAMPTZ DEFAULT now()                          -- *
);

-- leads : demandes client qualifiées par Maya (voice) ou SMS
-- Étendu par mig. 005 (twilio_call_sid), 006 (scoring V2), 010 (reminder_sent_at)
CREATE TABLE IF NOT EXISTS public.leads (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),           -- *
  created_at         TIMESTAMPTZ DEFAULT now(),                                   -- *
  updated_at         TIMESTAMPTZ DEFAULT now(),                                   -- *
  account_id         UUID        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE, -- *
  status             lead_status NOT NULL DEFAULT 'a_traiter',                    -- * enum : a_traiter | incomplet | traite (mig. 014)
  client_phone       TEXT,                                                        -- *
  full_name          TEXT,                                                        -- *
  type_code          TEXT,                                                        -- *
  delay_code         TEXT,                                                        -- *
  priority_score     INTEGER,                                                     -- *
  address            TEXT,                                                        -- *
  description        TEXT,                                                        -- *
  source             TEXT,                                                        -- * ('voice' | 'sms')
  twilio_call_sid    TEXT,                                                        -- 005
  danger_level       TEXT        NOT NULL DEFAULT 'none'
                       CHECK (danger_level IN ('none','low','medium','high','critical')), -- 006
  scope              TEXT        CHECK (scope IN ('small','medium','large')),      -- 006
  availability_notes TEXT,                                                        -- 006
  parsing_confidence FLOAT,                                                       -- 006
  reminder_sent_at   TIMESTAMPTZ                                                  -- 010
);

-- calls : appels Twilio (entrants et sortants)
-- Étendu par mig. 005 (voice_ai_result)
CREATE TABLE IF NOT EXISTS public.calls (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),              -- *
  created_at      TIMESTAMPTZ DEFAULT now(),                                      -- *
  twilio_call_sid TEXT        UNIQUE,                                             -- *
  account_id      UUID        REFERENCES public.accounts(id) ON DELETE CASCADE,  -- *
  direction       TEXT,                                                           -- *
  from_number     TEXT,                                                           -- *
  to_number       TEXT,                                                           -- *
  started_at      TIMESTAMPTZ,                                                    -- *
  ended_at        TIMESTAMPTZ,                                                    -- *
  voice_ai_result JSONB                                                           -- 005
);

-- sms_messages : messages SMS entrants et sortants
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),           -- *
  created_at         TIMESTAMPTZ DEFAULT now(),                                   -- *
  account_id         UUID        REFERENCES public.accounts(id) ON DELETE CASCADE, -- *
  direction          TEXT,                                                        -- *
  body               TEXT,                                                        -- *
  twilio_message_sid TEXT                                                         -- *
);

-- scoring_configs : barèmes de scoring par spécialité (créé mig. 006)
CREATE TABLE IF NOT EXISTS public.scoring_configs (
  specialty      TEXT        PRIMARY KEY,
  type_weights   JSONB       NOT NULL,
  delay_weights  JSONB       NOT NULL,
  danger_weights JSONB       NOT NULL,
  scope_weights  JSONB       NOT NULL,
  type_code_map  JSONB       NOT NULL,
  special_rules  JSONB       NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- push_subscriptions : abonnements push Web/PWA par compte (créé mig. 010)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  endpoint     TEXT        NOT NULL,
  subscription JSONB       NOT NULL,
  platform     TEXT        NOT NULL DEFAULT 'web',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, endpoint)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- accounts — user_id unique (un compte par utilisateur auth) (mig. 014)
CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_id_unique
  ON public.accounts (user_id)
  WHERE user_id IS NOT NULL;

-- phone_numbers — e164 unique par index nommé (mig. 014)
CREATE UNIQUE INDEX IF NOT EXISTS phone_numbers_e164_unique
  ON public.phone_numbers (e164);

-- leads — un lead par compte + téléphone client (mig. 013)
CREATE UNIQUE INDEX IF NOT EXISTS leads_account_phone_unique
  ON public.leads (account_id, client_phone);

-- push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_account_id
  ON public.push_subscriptions(account_id);                                -- 010

-- ============================================================
-- FUNCTIONS
-- (Aucune fonction custom dans les migrations 001–012)
-- ============================================================

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_configs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- accounts : SELECT et UPDATE par le propriétaire (INSERT via service_role)
CREATE POLICY "accounts_select_own"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "accounts_update_own"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- phone_numbers
CREATE POLICY "phone_numbers_all_own"
  ON public.phone_numbers FOR ALL
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

-- leads
CREATE POLICY "leads_all_own"
  ON public.leads FOR ALL
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

-- calls
CREATE POLICY "calls_all_own"
  ON public.calls FOR ALL
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

-- sms_messages
CREATE POLICY "sms_messages_all_own"
  ON public.sms_messages FOR ALL
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

-- scoring_configs : lecture publique pour tous les utilisateurs authentifiés
CREATE POLICY "scoring_configs_select"
  ON public.scoring_configs FOR SELECT
  TO authenticated USING (true);

-- push_subscriptions
CREATE POLICY "push_sub_select_own"
  ON public.push_subscriptions FOR SELECT
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

CREATE POLICY "push_sub_insert_own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

CREATE POLICY "push_sub_delete_own"
  ON public.push_subscriptions FOR DELETE
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));
