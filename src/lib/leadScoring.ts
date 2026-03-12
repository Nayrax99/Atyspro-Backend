/**
 * Lead Scoring V2
 * Fonctions pures pour calculer le score de priorité et l'estimation de valeur.
 * V2 : ajout du dangerBonus et de l'upgrade estimated_scope sur value_estimate.
 */

/**
 * Calcule le score de priorité (0-100) et l'estimation de valeur.
 *
 * Formule : priority_score = min(delayPoints + typePoints + dangerBonus, 100)
 *
 * dangerBonus :
 *   is_dangerous === true  → +15
 *   is_dangerous === false → 0
 *
 * estimated_scope upgrade sur value_estimate :
 *   Si scope === 'large', value_estimate monte d'un cran (low→medium, medium→high)
 *   type_code 1 (dépannage) + scope 'large' → 'high'
 *   type_code 3 (devis) + scope 'large'     → reste 'high' (déjà max)
 */
export function computeScore(
  type_code: number | null,
  delay_code: number | null,
  is_dangerous?: boolean,
  estimated_scope?: "small" | "medium" | "large"
): {
  priority_score: number;
  value_estimate: "low" | "medium" | "high" | null;
} {
  // Points pour delay_code
  let delayPoints = 0;
  if (delay_code === 1) delayPoints = 50;
  else if (delay_code === 2) delayPoints = 35;
  else if (delay_code === 3) delayPoints = 20;
  else if (delay_code === 4) delayPoints = 10;

  // Points pour type_code
  let typePoints = 0;
  if (type_code === 1) typePoints = 25;
  else if (type_code === 2) typePoints = 20;
  else if (type_code === 3) typePoints = 15;
  else if (type_code === 4) typePoints = 10;

  // Bonus danger (V2)
  const dangerBonus = is_dangerous === true ? 15 : 0;

  // Score total plafonné à 100
  const priority_score = Math.min(delayPoints + typePoints + dangerBonus, 100);

  // Estimation de valeur de base
  let value_estimate: "low" | "medium" | "high" | null = null;
  if (type_code === 3) {
    value_estimate = "high";
  } else if (type_code === 1 || type_code === 2) {
    value_estimate = "medium";
  } else if (type_code === 4) {
    value_estimate = "low";
  }

  // Upgrade value_estimate si estimated_scope === 'large' (V2)
  if (estimated_scope === "large" && value_estimate !== null) {
    if (value_estimate === "low") value_estimate = "medium";
    else if (value_estimate === "medium") value_estimate = "high";
    // 'high' reste 'high'
  }

  return { priority_score, value_estimate };
}
