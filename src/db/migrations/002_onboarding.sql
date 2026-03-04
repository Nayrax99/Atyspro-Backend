-- Migration 002 : Champs d'onboarding sur accounts
-- À exécuter dans Supabase SQL Editor

ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS owner_phone text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS specialty text DEFAULT 'electricien';
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

