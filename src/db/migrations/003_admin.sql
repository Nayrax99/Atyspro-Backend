-- Migration 003: Add is_admin flag to accounts
-- Run in Supabase SQL Editor

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
