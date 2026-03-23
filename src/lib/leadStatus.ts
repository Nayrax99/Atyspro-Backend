/**
 * Helper partagé pour déterminer le statut d'un lead.
 * Unifie les critères entre pipeline SMS et pipeline vocal (fix #13).
 *
 * Critères :
 *   "a_traiter" → type + délai + (adresse OU nom) — lead qualifié, prêt à traiter
 *   "incomplet" → au moins type OU délai
 *   "a_traiter" → aucune info structurée (fallback identique)
 *
 * Note : "nouveau" n'est plus retourné — c'est un indicateur visuel basé sur created_at < 24h.
 */
export function determineLeadStatus(
  type_code: number | null,
  delay_code: number | null,
  address?: string | null,
  full_name?: string | null
): "incomplet" | "a_traiter" {
  const hasLocator = !!(address || full_name);
  if (type_code && delay_code && hasLocator) return "a_traiter";
  if (type_code || delay_code) return "incomplet";
  return "a_traiter";
}
