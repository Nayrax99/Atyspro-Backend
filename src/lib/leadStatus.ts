/**
 * Helper partagé pour déterminer le statut d'un lead.
 * Unifie les critères entre pipeline SMS et pipeline vocal (fix #13).
 *
 * Critères :
 *   "nouveau"   → type + délai + (adresse OU nom)
 *   "incomplet" → au moins type OU délai
 *   "a_traiter" → aucune info structurée
 */
export function determineLeadStatus(
  type_code: number | null,
  delay_code: number | null,
  address?: string | null,
  full_name?: string | null
): "nouveau" | "incomplet" | "a_traiter" {
  const hasLocator = !!(address || full_name);
  if (type_code && delay_code && hasLocator) return "nouveau";
  if (type_code || delay_code) return "incomplet";
  return "a_traiter";
}
