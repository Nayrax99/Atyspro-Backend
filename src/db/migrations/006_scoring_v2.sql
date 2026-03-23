-- Migration 006 : Scoring V2 — config data-driven et champs de qualification enrichis
-- À exécuter dans Supabase SQL Editor
--
-- Changements :
--   1. leads : 4 nouvelles colonnes (danger_level, scope, availability_notes, parsing_confidence)
--   2. Table scoring_configs : barèmes par spécialité, lisibles en DB
--   3. Config electricien insérée (fallback hardcodé identique dans scoringConfig.ts)
--   4. Backfill des nouvelles colonnes depuis les anciennes (is_dangerous → danger_level,
--      estimated_scope → scope) pour conserver la cohérence des leads existants.

-- ============================================================
-- 1. Nouvelles colonnes sur leads
-- ============================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS danger_level TEXT NOT NULL DEFAULT 'none'
    CHECK (danger_level IN ('none', 'low', 'medium', 'high', 'critical'));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS scope TEXT
    CHECK (scope IN ('small', 'medium', 'large'));

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS availability_notes TEXT;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS parsing_confidence FLOAT;

-- ============================================================
-- 2. Table scoring_configs
-- ============================================================

CREATE TABLE IF NOT EXISTS public.scoring_configs (
  specialty          TEXT PRIMARY KEY,
  -- type_weights  : type_key (string) → points (int, max 30)
  type_weights       JSONB NOT NULL,
  -- delay_weights : danger_level (none/low/medium/high/critical) → points (int, max 40)
  delay_weights      JSONB NOT NULL,
  -- danger_weights : bonus qualité lead (adresse, nom, dispo) → points (int, total max 10)
  danger_weights     JSONB NOT NULL,
  -- scope_weights  : scope (small/medium/large) → points (int, max 20)
  scope_weights      JSONB NOT NULL,
  -- type_code_map  : "type_code_scope" → type_key
  --   ex: "1_small" → "petite_reparation", "2_large" → "tableau_complet"
  type_code_map      JSONB NOT NULL,
  -- special_rules  : règles spéciales (min score critical, bonus relance, malus incomplet)
  special_rules      JSONB NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scoring_configs ENABLE ROW LEVEL SECURITY;

-- Config accessible en lecture par tous les utilisateurs authentifiés
CREATE POLICY IF NOT EXISTS "scoring_configs_select"
  ON public.scoring_configs FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- 3. Config électricien
-- ============================================================

INSERT INTO public.scoring_configs (
  specialty, type_weights, delay_weights, danger_weights,
  scope_weights, type_code_map, special_rules
) VALUES (
  'electricien',

  -- type_weights (30pts max)
  '{"tableau_complet": 30, "installation_neuve": 22, "depannage_technique": 18,
    "petite_reparation": 8, "devis": 5, "autre": 5}',

  -- delay_weights = urgence réelle évaluée (40pts max)
  '{"critical": 40, "high": 32, "medium": 20, "low": 10, "none": 0}',

  -- danger_weights = qualité du lead (10pts max)
  '{"address_provided": 4, "full_name_provided": 3, "availability_provided": 3}',

  -- scope_weights (20pts max)
  '{"large": 20, "medium": 12, "small": 5}',

  -- type_code_map : résolution type_code (1-4) + scope → type_key
  '{"1_small":  "petite_reparation",
    "1_medium": "depannage_technique",
    "1_large":  "depannage_technique",
    "2_small":  "installation_neuve",
    "2_medium": "installation_neuve",
    "2_large":  "tableau_complet",
    "3_small":  "devis",
    "3_medium": "devis",
    "3_large":  "devis",
    "4_small":  "autre",
    "4_medium": "autre",
    "4_large":  "autre"}',

  -- special_rules
  '{"min_score_critical": 85, "relance_bonus": 5, "incomplete_malus": -10}'

) ON CONFLICT (specialty) DO NOTHING;

-- ============================================================
-- 4. Backfill depuis les anciens champs
-- ============================================================

-- danger_level depuis is_dangerous (booléen → enum)
UPDATE public.leads
SET danger_level = CASE
  WHEN is_dangerous = TRUE THEN 'critical'
  ELSE 'none'
END
WHERE danger_level = 'none' AND is_dangerous IS NOT NULL;

-- scope depuis estimated_scope (même enum, renommage)
UPDATE public.leads
SET scope = estimated_scope
WHERE scope IS NULL AND estimated_scope IS NOT NULL;

-- ============================================================
-- 5. Vérification
-- ============================================================

SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'leads' AND column_name = 'danger_level')       AS danger_level_added,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'leads' AND column_name = 'scope')              AS scope_added,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'leads' AND column_name = 'availability_notes') AS availability_added,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'leads' AND column_name = 'parsing_confidence') AS confidence_added,
  (SELECT COUNT(*) FROM public.scoring_configs)                       AS scoring_configs_rows;

-- ============================================================
-- ROLLBACK (exécuter manuellement si nécessaire)
-- ============================================================
-- DELETE FROM public.scoring_configs WHERE specialty = 'electricien';
-- DROP TABLE IF EXISTS public.scoring_configs;
-- ALTER TABLE public.leads DROP COLUMN IF EXISTS parsing_confidence;
-- ALTER TABLE public.leads DROP COLUMN IF EXISTS availability_notes;
-- ALTER TABLE public.leads DROP COLUMN IF EXISTS scope;
-- ALTER TABLE public.leads DROP COLUMN IF EXISTS danger_level;
