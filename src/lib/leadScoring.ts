/**
 * Lead Scoring V2 — data-driven
 *
 * computeScore() utilise un ScoringConfig chargé depuis la DB (scoring_configs)
 * selon la spécialité de l'artisan. Fallback sur ELECTRICIEN_CONFIG.
 *
 * Changements V2 vs V1 :
 *   - is_dangerous (bool) remplacé par danger_level (none/low/medium/high/critical)
 *   - estimated_scope (string) remplacé par scope (small/medium/large)
 *   - Formule data-driven : delay_weights[danger_level] + type_weights[type_key] + scope_weights[scope] + lead quality bonus
 *   - Règles spéciales : score minimum pour critical, bonus relance, malus incomplet
 */

import type { ScoringConfig, DangerLevel, ScopeLevel } from "./scoringConfig";

// ============================================================
// Types
// ============================================================

export interface LeadScoreInput {
  type_code: number | null;
  /** Niveau d'urgence/danger évalué depuis le texte ou par le LLM */
  danger_level: DangerLevel;
  scope: ScopeLevel | null;
  address: string | null;
  full_name: string | null;
  availability_notes?: string | null;
  relance_count?: number;
}

// ============================================================
// Helpers internes
// ============================================================

/**
 * Résout le type_key depuis type_code + scope en utilisant type_code_map de la config.
 * Ex: type_code=1, scope="small" → "petite_reparation"
 */
function resolveTypeKey(
  type_code: number | null,
  scope: ScopeLevel | null,
  config: ScoringConfig
): string | null {
  if (!type_code) return null;
  const scopeStr: ScopeLevel = scope ?? "medium";
  return config.type_code_map[`${type_code}_${scopeStr}`] ?? null;
}

/**
 * Dérive la valeur estimée du lead depuis le type_key et le scope.
 */
function deriveValueEstimate(
  typeKey: string | null,
  scope: ScopeLevel | null
): "low" | "medium" | "high" | null {
  if (!typeKey) return null;
  if (typeKey === "tableau_complet") return "high";
  if (typeKey === "installation_neuve" || typeKey === "depannage_technique") {
    return scope === "large" ? "high" : "medium";
  }
  if (typeKey === "petite_reparation") return "low";
  if (typeKey === "devis") return scope === "large" ? "high" : "medium";
  return "low";
}

// ============================================================
// Fonctions publiques
// ============================================================

/**
 * Calcule le score de priorité (0-100) et l'estimation de valeur.
 *
 * Formule :
 *   score = delay_weights[danger_level]      (40pts max — urgence évaluée)
 *         + type_weights[type_key]           (30pts max — nature intervention)
 *         + scope_weights[scope]             (20pts max — ampleur chantier)
 *         + danger_weights.address_provided  (+4 si adresse fournie)
 *         + danger_weights.full_name_provided(+3 si nom fourni)
 *         + danger_weights.availability_provided (+3 si dispo précisée)
 *         + special_rules.relance_bonus      (+5 si relance_count > 0)
 *         + special_rules.incomplete_malus   (-10 si pas de type ET danger=none)
 *
 *   Score minimum = special_rules.min_score_critical (85) si danger_level=critical
 */
export function computeScore(
  lead: LeadScoreInput,
  config: ScoringConfig
): { priority_score: number; value_estimate: "low" | "medium" | "high" | null } {
  const {
    type_code,
    danger_level,
    scope,
    address,
    full_name,
    availability_notes,
    relance_count = 0,
  } = lead;

  // 1. Urgence (40pts max)
  const urgencyPoints = config.delay_weights[danger_level] ?? 0;

  // 2. Type d'intervention (30pts max)
  const typeKey = resolveTypeKey(type_code, scope, config);
  const typePoints = typeKey ? (config.type_weights[typeKey] ?? 0) : 0;

  // 3. Ampleur du chantier (20pts max)
  const scopePoints = scope ? (config.scope_weights[scope] ?? 0) : 0;

  // 4. Qualité lead (10pts max)
  const addressBonus = address ? (config.danger_weights.address_provided ?? 0) : 0;
  const nameBonus = full_name ? (config.danger_weights.full_name_provided ?? 0) : 0;
  const availabilityBonus = availability_notes ? (config.danger_weights.availability_provided ?? 0) : 0;

  // 5. Règles spéciales
  const relanceBonus = relance_count > 0 ? (config.special_rules.relance_bonus ?? 0) : 0;
  const incompleteMalus = !type_code && danger_level === "none"
    ? (config.special_rules.incomplete_malus ?? 0)
    : 0;

  let rawScore =
    urgencyPoints +
    typePoints +
    scopePoints +
    addressBonus +
    nameBonus +
    availabilityBonus +
    relanceBonus +
    incompleteMalus;

  // Plafonné entre 0 et 100
  let priority_score = Math.max(0, Math.min(100, rawScore));

  // Règle spéciale : score minimum garanti pour danger critique
  if (danger_level === "critical") {
    priority_score = Math.max(priority_score, config.special_rules.min_score_critical ?? 85);
  }

  return {
    priority_score,
    value_estimate: deriveValueEstimate(typeKey, scope),
  };
}

/**
 * Calcule la confiance de parsing (0.0 à 1.0).
 * 1.0 = tous les champs clés extraits.
 * -0.2 par champ manquant parmi : type_code, danger_level (≠none), full_name, address, description.
 */
export function computeParsingConfidence(params: {
  type_code: number | null;
  danger_level: DangerLevel;
  full_name: string | null;
  address: string | null;
  description: string | null;
}): number {
  let confidence = 1.0;
  if (!params.type_code) confidence -= 0.2;
  if (params.danger_level === "none") confidence -= 0.2;
  if (!params.full_name) confidence -= 0.2;
  if (!params.address) confidence -= 0.2;
  if (!params.description) confidence -= 0.2;
  return Math.max(0, parseFloat(confidence.toFixed(1)));
}
