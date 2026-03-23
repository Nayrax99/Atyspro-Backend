-- 007 : Champs profil enrichi sur accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS assistant_name TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS score_threshold INTEGER DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS callback_delay TEXT DEFAULT '24h';
