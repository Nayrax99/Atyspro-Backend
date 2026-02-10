/**
 * Lead Scoring V1
 * Fonctions pures pour calculer le score de priorité et l'estimation de valeur
 */

/**
 * Calcule le score de priorité (0-100) et l'estimation de valeur
 * basé sur type_code et delay_code
 */
export function computeScore(
  type_code: number | null,
  delay_code: number | null
): {
  priority_score: number;
  value_estimate: "low" | "medium" | "high" | null;
} {
  // Calcul des points pour delay_code
  let delayPoints = 0;
  if (delay_code === 1) delayPoints = 50;
  else if (delay_code === 2) delayPoints = 35;
  else if (delay_code === 3) delayPoints = 20;
  else if (delay_code === 4) delayPoints = 10;

  // Calcul des points pour type_code
  let typePoints = 0;
  if (type_code === 1) typePoints = 25;
  else if (type_code === 2) typePoints = 20;
  else if (type_code === 3) typePoints = 15;
  else if (type_code === 4) typePoints = 10;

  // Score total (max 100)
  const priority_score = Math.min(delayPoints + typePoints, 100);

  // Estimation de valeur basée sur type_code
  let value_estimate: "low" | "medium" | "high" | null = null;
  if (type_code === 3) {
    value_estimate = "high"; // Devis = gros projet potentiel
  } else if (type_code === 1 || type_code === 2) {
    value_estimate = "medium"; // Dépannage/Installation = valeur moyenne
  } else if (type_code === 4) {
    value_estimate = "low"; // Autre = faible valeur
  }
  // Si type_code === null, value_estimate reste null

  return {
    priority_score,
    value_estimate,
  };
}

/**
 * TESTS RAPIDES (à copier dans un fichier de test ou exécuter manuellement)
 * 
 * Test 1: Urgence max + dépannage
 * computeScore(1, 1)
 * → priority_score: 75 (50+25), value_estimate: "medium"
 * 
 * Test 2: Devis sous 48h
 * computeScore(3, 2)
 * → priority_score: 50 (35+15), value_estimate: "high"
 * 
 * Test 3: Installation flexible
 * computeScore(2, 4)
 * → priority_score: 30 (10+20), value_estimate: "medium"
 * 
 * Test 4: Autre, pas pressé
 * computeScore(4, 4)
 * → priority_score: 20 (10+10), value_estimate: "low"
 * 
 * Test 5: Type inconnu, urgence max
 * computeScore(null, 1)
 * → priority_score: 50 (50+0), value_estimate: null
 * 
 * Test 6: Tout inconnu
 * computeScore(null, null)
 * → priority_score: 0, value_estimate: null
 * 
 * Test 7: Score qui dépasse (théoriquement impossible avec nos valeurs)
 * computeScore(1, 1) avec delay=60 type=50 donnerait 110 → plafonné à 100
 */