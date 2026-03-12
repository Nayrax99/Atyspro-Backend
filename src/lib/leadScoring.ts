/**
 * Lead Scoring V2
 * Fonctions pures pour calculer le score de priorité et l'estimation de valeur.
 * V2 : ajout du dangerBonus, upgrade estimated_scope, et upgrade danger sur value_estimate.
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
 * Upgrades value_estimate (appliqués dans cet ordre) :
 *   1. estimated_scope === 'large' → monte d'un cran (low→medium, medium→high)
 *   2. is_dangerous === true → au minimum 'medium' ; si déjà 'medium' → 'high'
 *      Un dépannage urgent dangereux = client prêt à payer le prix fort.
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

  // Bonus danger
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

  // Upgrade 1 : estimated_scope === 'large' → monte d'un cran
  if (estimated_scope === "large" && value_estimate !== null) {
    if (value_estimate === "low") value_estimate = "medium";
    else if (value_estimate === "medium") value_estimate = "high";
    // 'high' reste 'high'
  }

  // Upgrade 2 : is_dangerous === true → minimum 'medium', et 'medium' → 'high'
  if (is_dangerous === true) {
    if (value_estimate === null || value_estimate === "low") {
      value_estimate = "medium";
    } else if (value_estimate === "medium") {
      value_estimate = "high";
    }
    // 'high' reste 'high'
  }

  return { priority_score, value_estimate };
}
