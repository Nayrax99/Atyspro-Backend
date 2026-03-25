-- Migration 011 : ajout colonne pro_phone sur accounts
-- Permet de lire le numéro pro directement depuis accounts sans join phone_numbers

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS pro_phone TEXT;

-- Backfill depuis phone_numbers (numéro actif, format e164)
UPDATE accounts
SET pro_phone = phone_numbers.e164
FROM phone_numbers
WHERE phone_numbers.account_id = accounts.id
  AND phone_numbers.active = true;
