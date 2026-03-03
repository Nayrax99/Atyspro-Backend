-- Migration 001 : Auth complète - user_id, RLS strict
-- À exécuter dans Supabase SQL Editor

-- A) Colonnes user_id et email sur accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS email text;

-- B) Index sur accounts.user_id
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

-- C) Supprimer toutes les anciennes policies RLS sur les tables ciblées
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('accounts', 'phone_numbers', 'leads', 'calls', 'sms_messages')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Activer RLS sur toutes les tables (si pas déjà fait)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- D) Nouvelles policies RLS strictes

-- accounts : SELECT et UPDATE uniquement (INSERT fait par service_role)
CREATE POLICY "accounts_select_own"
  ON public.accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "accounts_update_own"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- phone_numbers : accès via account appartenant à l'utilisateur
CREATE POLICY "phone_numbers_all_own"
  ON public.phone_numbers FOR ALL
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

-- leads : idem
CREATE POLICY "leads_all_own"
  ON public.leads FOR ALL
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

-- calls : idem
CREATE POLICY "calls_all_own"
  ON public.calls FOR ALL
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

-- sms_messages : idem
CREATE POLICY "sms_messages_all_own"
  ON public.sms_messages FOR ALL
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()))
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));
