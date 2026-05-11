/**
 * Lead Parsing V3
 * Fonctions pures pour parser les SMS de qualification + helpers scoring V2.
 */

import { determineLeadStatus } from "./status";
import type { DangerLevel, ScopeLevel } from "./scoringConfig";

/**
 * Normalise le body SMS pour faciliter le parsing
 */
export function normalizeBody(body: string): {
  bodyTrim: string;
  bodyLower: string;
  bodySingleLine: string;
} {
  const bodyTrim = body.trim();
  const bodyLower = bodyTrim.toLowerCase();
  const bodySingleLine = bodyLower.replace(/\s+/g, " ");

  return { bodyTrim, bodyLower, bodySingleLine };
}

/**
 * Parse un SMS de qualification et extrait les informations structurées.
 * has_separator: true si le message contient / ou ; ou | (pour détecter réponse exploitable/inexploitable).
 */
export function parseSms(body: string): {
  type_code: number | null;
  delay_code: number | null;
  address: string | null;
  full_name: string | null;
  description: string | null;
  raw_message: string;
  lead_status: "nouveau" | "incomplet" | "a_traiter";
  has_separator: boolean;
  parsing_notes?: string | null;
} {
  const { bodyTrim, bodyLower, bodySingleLine } = normalizeBody(body);

  // Détecter le séparateur utilisé (priorité: / puis ; puis |)
  let separator: string | null = null;
  if (bodyLower.includes("/")) separator = "/";
  else if (bodyLower.includes(";")) separator = ";";
  else if (bodyLower.includes("|")) separator = "|";
  const has_separator = separator !== null;

  let parts: string[] = [];
  if (separator) {
    // Fix #12 : Limiter à 5 parts max (type / délai / adresse / nom / description)
    // Si le client écrit un "/" dans sa description, le reste est concaténé en 5ème part.
    const allParts = bodyTrim.split(separator).map((p) => p.trim());
    if (allParts.length > 5) {
      parts = [...allParts.slice(0, 4), allParts.slice(4).join(separator).trim()];
    } else {
      parts = allParts;
    }
  }

  // Variables de résultat
  let type_code: number | null = null;
  let delay_code: number | null = null;
  let address: string | null = null;
  let full_name: string | null = null;
  let description: string | null = null;
  let parsing_notes: string | null = null;

  // CAS 1: Réponse structurée avec séparateur
  if (separator && parts.length >= 2) {
    // Parse type_code (parts[0]) — mode normal : le champ est isolé
    type_code = extractTypeCode(parts[0] || "");

    // Parse delay_code (parts[1])
    delay_code = extractDelayCode(parts[1] || "");

    // Parse address (parts[2] ou parts[3])
    let addressCandidate = parts[2] || null;
    let nameCandidate = parts[3] || null;

    // Détection d'inversion potentielle
    if (addressCandidate && nameCandidate) {
      const addressIsActuallyName = isLikelyName(addressCandidate);
      const nameIsActuallyAddress = isLikelyAddress(nameCandidate);

      if (addressIsActuallyName && nameIsActuallyAddress) {
        // Swap
        [addressCandidate, nameCandidate] = [nameCandidate, addressCandidate];
        parsing_notes = "Champs inversés détectés et corrigés";
      }
    }

    address = addressCandidate && isLikelyAddress(addressCandidate) ? addressCandidate : null;
    full_name = nameCandidate && isLikelyName(nameCandidate) ? nameCandidate : null;

    // Description = 5ème part (déjà concaténée si > 5 parts initiaux)
    if (parts.length > 4) {
      description = parts[4]?.trim() || null;
    }

    // Déterminer le statut via le helper unifié (fix #13)
    const lead_status = determineLeadStatus(type_code, delay_code, address, full_name);
    return {
      type_code,
      delay_code,
      address,
      full_name,
      description,
      raw_message: bodyTrim,
      lead_status,
      has_separator,
      parsing_notes,
    };
  }

  // CAS 2: Réponse non structurée (pas de séparateur clair)
  // Fix #1 : mode strict — le chiffre doit être en début de message ou précédé d'un mot-clé
  type_code = extractTypeCode(bodySingleLine, true);
  delay_code = extractDelayCode(bodySingleLine, true);

  // Pas d'extraction d'adresse/nom dans une phrase non structurée
  address = null;
  full_name = null;
  description = bodyTrim;

  if (type_code || delay_code) {
    parsing_notes = "Réponse non structurée, extraction partielle uniquement";
  } else {
    parsing_notes = "Réponse libre sans structure détectée";
  }

  const lead_status = determineLeadStatus(type_code, delay_code, null, null);
  return {
    type_code,
    delay_code,
    address,
    full_name,
    description,
    raw_message: bodyTrim,
    lead_status,
    has_separator,
    parsing_notes,
  };
}

/**
 * Extrait le type_code (1-4) depuis une chaîne.
 * Priorité : emoji numérique > chiffre > mot-clé.
 *
 * @param strict - Si true (CAS 2, texte non structuré) : le chiffre doit être en début
 *                 de texte ou précédé d'un mot-clé explicite, pour éviter de capter
 *                 les numéros de rue ou d'appartement. Fix #1 et #9.
 */
function extractTypeCode(text: string, strict = false): number | null {
  // Fix #9 : tester les emojis EN PREMIER (avant la regex numérique)
  // "1️⃣" contient le chiffre "1" que la regex capturerait sinon.
  if (/1️⃣/.test(text)) return 1;
  if (/2️⃣/.test(text)) return 2;
  if (/3️⃣/.test(text)) return 3;
  if (/4️⃣/.test(text)) return 4;

  const lower = text.toLowerCase().trim();

  if (strict) {
    // Fix #1 : en mode strict, le chiffre doit être en début de texte
    const atStart = lower.match(/^([1-4])\b/);
    if (atStart) return parseInt(atStart[1], 10);
    // ou précédé du mot-clé "type"
    const afterKeyword = lower.match(/\btype\s*:?\s*([1-4])\b/);
    if (afterKeyword) return parseInt(afterKeyword[1], 10);
  } else {
    const numericMatch = lower.match(/(?:type\s*)?([1-4])[️⃣\-\s]*/);
    if (numericMatch) return parseInt(numericMatch[1], 10);
  }

  // Fallback mots-clés (toujours actif)
  if (/d[ée]pannage|urgence|panne/i.test(lower)) return 1;
  if (/installation|pose|installer/i.test(lower)) return 2;
  if (/devis|estimation|chiffrage/i.test(lower)) return 3;
  if (/autre|divers|question/i.test(lower)) return 4;

  return null;
}

/**
 * Extrait le delay_code (1-4) depuis une chaîne.
 * Priorité : emoji numérique > chiffre > mot-clé.
 *
 * @param strict - Voir extractTypeCode. Fix #1 et #9.
 */
function extractDelayCode(text: string, strict = false): number | null {
  // Fix #9 : emojis EN PREMIER
  if (/1️⃣/.test(text)) return 1;
  if (/2️⃣/.test(text)) return 2;
  if (/3️⃣/.test(text)) return 3;
  if (/4️⃣/.test(text)) return 4;

  const lower = text.toLowerCase().trim();

  if (strict) {
    // Fix #1 : en mode strict
    const atStart = lower.match(/^([1-4])\b/);
    if (atStart) return parseInt(atStart[1], 10);
    const afterKeyword = lower.match(/\bd[ée]lai\s*:?\s*([1-4])\b/);
    if (afterKeyword) return parseInt(afterKeyword[1], 10);
  } else {
    const numericMatch = lower.match(/(?:d[ée]lai\s*)?([1-4])[️⃣\-\s]*/);
    if (numericMatch) return parseInt(numericMatch[1], 10);
  }

  // Fallback mots-clés
  if (/aujourd'hui|imm[ée]diat|urgent|maintenant|asap/i.test(lower)) return 1;
  if (/48h|2\s*jours|demain|cette semaine/i.test(lower)) return 2;
  if (/semaine|7\s*jours|sous 1 semaine/i.test(lower)) return 3;
  if (/pas press[ée]|flexible|quand (vous )?pouvez/i.test(lower)) return 4;

  return null;
}

/**
 * Détecte si une chaîne ressemble à une adresse.
 * Fix #11 et #15 : élargi aux formes sans mot-clé explicite (numéro + 2 mots minimum).
 */
function isLikelyAddress(text: string): boolean {
  const lower = text.toLowerCase();
  const trimmed = text.trim();

  // Code postal français (5 chiffres) — indicateur fort
  if (/\b\d{5}\b/.test(trimmed)) return true;

  // Mots-clés d'adresse courants
  const addressKeywords = [
    "rue",
    "avenue",
    "av",
    "boulevard",
    "bd",
    "impasse",
    "chemin",
    "route",
    "place",
    "all[ée]e",
    "lotissement",
    "r[eé]sidence",
    "hameau",
    "lieu-dit",
    "villa",
  ];
  if (addressKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lower))) return true;

  // Fix #11/#15 : "numéro + au moins 2 mots" → probablement une adresse
  // Couvre : "15 Grande Rue", "42 Les Pins Lyon", "123 ZA des Sapins Vaulx"
  if (/^\d+\s+\w+\s+\w+/.test(trimmed)) return true;

  return false;
}

/**
 * Détecte si une chaîne ressemble à un nom de personne ou de société.
 * Fix #10 : accepte 1 à 4 mots (noms à prénom unique, noms de société courts).
 */
function isLikelyName(text: string): boolean {
  const trimmed = text.trim();

  // Pas de chiffres
  if (/\d/.test(trimmed)) return false;

  // Pas de mots d'adresse
  if (isLikelyAddress(trimmed)) return false;

  // Fix #10 : 1 à 4 mots (au lieu de 2 à 4)
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;

  // Doit avoir du contenu
  if (trimmed.length < 2) return false;

  // Majoritairement des lettres (au moins 70%)
  const letterCount = (trimmed.match(/[a-zàâäéèêëïîôùûüÿç]/gi) || []).length;
  const totalChars = trimmed.replace(/\s/g, "").length;
  if (totalChars === 0) return false;

  return letterCount / totalChars >= 0.7;
}

/**
 * Évalue le niveau de danger/urgence depuis un texte libre.
 * Tient compte de type_code et delay_code comme signaux de repli quand le texte est vague.
 *
 * Niveaux :
 *   critical : danger sécurité immédiat (étincelles, eau + élec, câbles dénudés…)
 *   high     : panne totale (tout l'appartement/maison)
 *   medium   : panne partielle (quelques prises, un circuit)
 *   low      : panne isolée (une prise, un interrupteur, une ampoule)
 *   none     : pas d'urgence (devis, installation planifiée)
 */
export function assessDangerLevelFromText(
  text: string,
  type_code: number | null = null,
  delay_code: number | null = null
): DangerLevel {
  const lower = (text || "").toLowerCase();

  // critical : danger sécurité
  if (/[eé]tincelle|odeur.{0,10}br[uû]l[eé]|fum[eé]e.{0,15}[eé]lectr|court.circuit|eau.{0,15}[eé]lectr|c[aâ]ble.{0,10}d[eé]nud[eé]|br[uû]lure|choc [eé]lectrique|[eé]lectrisation|risque.{0,10}incendie/i.test(lower)) {
    return "critical";
  }

  // high : panne totale
  if (/plus.{0,10}(de )?courant|pann.{0,10}total|tout.{0,10}(est )?[eé]teint|disjoncteur.{0,15}(saute|d[eé]clenche|trip)|tableau.{0,10}saute|plus.{0,10}[eé]lectric.{0,15}(du tout|compl[eè]t|enti[eè]r)/i.test(lower)) {
    return "high";
  }

  // Devis/installation → généralement pas urgent (sauf delay_code 1)
  if (type_code === 3 && delay_code !== 1) return "none";
  if (type_code === 2 && delay_code === 4) return "none";

  // Signaux delay_code comme repli quand le texte ne donne pas d'indication
  if (!lower || lower.length < 10) {
    if (delay_code === 1) return "high";
    if (delay_code === 2) return "medium";
    if (delay_code === 3) return "low";
    if (delay_code === 4) return "none";
  }

  // medium : panne partielle
  if (/pann.{0,15}partielle|quelques.{0,10}prises|circuit.{0,15}(mort|hors.service|ne march)|pas.{0,10}courant.{0,10}dans|une pi[eè]ce.{0,15}sans/i.test(lower)) {
    return "medium";
  }

  // low : panne isolée
  if (/une prise\b|un interrupteur|une ampoule|une lumi[eè]re|[eé]clairage.{0,10}ne|un point lumineux/i.test(lower)) {
    return "low";
  }

  // Repli sur delay_code
  if (delay_code === 1) return "high";
  if (delay_code === 2) return "medium";
  if (delay_code === 3) return "low";
  if (delay_code === 4) return "none";

  // Dépannage sans autre info → medium par défaut
  if (type_code === 1) return "medium";

  return "none";
}

/**
 * Estime l'ampleur du chantier à partir d'un texte libre.
 * Retourne null si aucun indicateur détecté.
 */
export function estimateScopeFromText(text: string): ScopeLevel | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/tableau.{0,20}(complet|g[eé]n[eé]ral)|r[eé]novation.{0,20}[eé]lectr|mise aux normes|appartement.{0,10}entier|maison.{0,15}enti[eè]re|plusieurs pi[eè]ces/.test(lower)) return "large";
  if (/tableau.{0,20}secondaire|une pi[eè]ce|radiateur [eé]lec|quelques prises/.test(lower)) return "medium";
  if (/une prise\b|un interrupteur|un point lumineux|une ampoule|un d[eé]tecteur/.test(lower)) return "small";
  return null;
}

/**
 * Détecte la présence d'un danger sécurité dans un texte libre.
 * @deprecated Utiliser assessDangerLevelFromText() pour le scoring V2.
 * Conservé pour compatibilité.
 */
export function detectDangerFromText(text: string): boolean {
  return assessDangerLevelFromText(text) === "critical";
}
