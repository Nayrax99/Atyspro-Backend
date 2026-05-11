/**
 * Configuration de scoring data-driven.
 * Charge les barèmes depuis la table scoring_configs en DB selon la spécialité de l'artisan.
 * Cache en mémoire (Map) pour éviter les requêtes répétées sur une même instance.
 */

import { supabaseAdmin } from "@/lib/supabase";

// ============================================================
// Types exportés — utilisés par leadScoring, leadParsing, voice.types
// ============================================================

export type DangerLevel = "none" | "low" | "medium" | "high" | "critical";
export type ScopeLevel = "small" | "medium" | "large";

export interface ScoringConfig {
  specialty: string;
  /** type_key → points (max 30) */
  type_weights: Record<string, number>;
  /** DangerLevel → points (max 40) */
  delay_weights: Record<DangerLevel, number>;
  /** Bonus qualité lead */
  danger_weights: {
    address_provided: number;
    full_name_provided: number;
    availability_provided: number;
  };
  /** ScopeLevel → points (max 20) */
  scope_weights: Record<ScopeLevel, number>;
  /** "type_code_scope" → type_key  ex: "1_small" → "petite_reparation" */
  type_code_map: Record<string, string>;
  special_rules: {
    /** Score minimum garanti pour danger_level=critical */
    min_score_critical: number;
    /** Bonus si relance_count > 0 */
    relance_bonus: number;
    /** Malus si aucun type ET aucune urgence détectée */
    incomplete_malus: number;
  };
}

// ============================================================
// Fallback hardcodé — identique à l'enregistrement DB electricien
// Utilisé si supabaseAdmin n'est pas configuré ou si la specialty est inconnue
// ============================================================

export const ELECTRICIEN_CONFIG: ScoringConfig = {
  specialty: "electricien",
  type_weights: {
    tableau_complet: 30,
    depannage_large: 25,
    installation_neuve: 22,
    depannage_technique: 18,
    petite_reparation: 8,
    devis: 5,
    autre: 5,
  },
  delay_weights: {
    critical: 40,
    high: 32,
    medium: 20,
    low: 10,
    none: 0,
  },
  danger_weights: {
    address_provided: 4,
    full_name_provided: 3,
    availability_provided: 3,
  },
  scope_weights: {
    large: 20,
    medium: 12,
    small: 5,
  },
  type_code_map: {
    "1_small": "petite_reparation",
    "1_medium": "depannage_technique",
    "1_large": "depannage_large",
    "2_small": "installation_neuve",
    "2_medium": "installation_neuve",
    "2_large": "tableau_complet",
    "3_small": "devis",
    "3_medium": "devis",
    "3_large": "devis",
    "4_small": "autre",
    "4_medium": "autre",
    "4_large": "autre",
  },
  special_rules: {
    min_score_critical: 85,
    relance_bonus: 5,
    incomplete_malus: -10,
  },
};

// ============================================================
// Cache en mémoire — survit aux requêtes sur la même instance
// ============================================================

const configCache = new Map<string, ScoringConfig>();

/**
 * Retourne la config de scoring pour une spécialité donnée.
 * Lit depuis la DB, met en cache, fallback sur ELECTRICIEN_CONFIG.
 */
export async function getScoringConfig(specialty: string | null | undefined): Promise<ScoringConfig> {
  const key = specialty?.toLowerCase().trim() || "electricien";

  if (configCache.has(key)) {
    return configCache.get(key)!;
  }

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("scoring_configs")
        .select("*")
        .eq("specialty", key)
        .maybeSingle();

      if (!error && data) {
        const config: ScoringConfig = {
          specialty: data.specialty as string,
          type_weights: data.type_weights as Record<string, number>,
          delay_weights: data.delay_weights as Record<DangerLevel, number>,
          danger_weights: data.danger_weights as ScoringConfig["danger_weights"],
          scope_weights: data.scope_weights as Record<ScopeLevel, number>,
          type_code_map: (data.type_code_map ?? ELECTRICIEN_CONFIG.type_code_map) as Record<string, string>,
          special_rules: data.special_rules as ScoringConfig["special_rules"],
        };
        configCache.set(key, config);
        return config;
      }
    } catch (err) {
      console.warn(`[scoringConfig] Erreur lecture DB pour '${key}', fallback electricien:`, err);
    }
  }

  // Fallback : electricien pour toutes les spécialités inconnues
  if (key !== "electricien") {
    console.log(`[scoringConfig] Config '${key}' non trouvée en DB, fallback electricien`);
  }
  return ELECTRICIEN_CONFIG;
}

/** Vide le cache (utile après mise à jour des configs en DB) */
export function clearScoringConfigCache(): void {
  configCache.clear();
}
