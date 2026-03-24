-- 010 : Push notifications — table push_subscriptions + reminder_sent_at sur leads
-- À exécuter dans Supabase SQL Editor

-- A) Table push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID        NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  endpoint     TEXT        NOT NULL,
  subscription JSONB       NOT NULL,
  platform     TEXT        NOT NULL DEFAULT 'web',  -- 'web' | 'expo' (compat future Expo Push)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, endpoint)
);

-- B) Index
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_account_id
  ON public.push_subscriptions(account_id);

-- C) RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_sub_select_own"
  ON public.push_subscriptions FOR SELECT
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

CREATE POLICY "push_sub_insert_own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

CREATE POLICY "push_sub_delete_own"
  ON public.push_subscriptions FOR DELETE
  USING (account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid()));

-- D) Colonne reminder_sent_at sur leads (évite les doublons de rappel cron)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
