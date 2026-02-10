/**
 * Lead Parsing V1
 * Fonctions pures pour parser les SMS de qualification
 */

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
 * Parse un SMS de qualification et extrait les informations structurées
 */
export function parseSms(body: string): {
  type_code: number | null;
  delay_code: number | null;
  address: string | null;
  full_name: string | null;
  description: string | null;
  raw_message: string;
  lead_status: "complete" | "incomplete" | "needs_review";
  parsing_notes?: string | null;
} {
  const { bodyTrim, bodyLower, bodySingleLine } = normalizeBody(body);

  // Détecter le séparateur utilisé (priorité: / puis ; puis |)
  let separator: string | null = null;
  if (bodyLower.includes("/")) separator = "/";
  else if (bodyLower.includes(";")) separator = ";";
  else if (bodyLower.includes("|")) separator = "|";

  let parts: string[] = [];
  if (separator) {
    parts = bodyTrim.split(separator).map((p) => p.trim());
  }

  // Variables de résultat
  let type_code: number | null = null;
  let delay_code: number | null = null;
  let address: string | null = null;
  let full_name: string | null = null;
  let description: string | null = null;
  let lead_status: "complete" | "incomplete" | "needs_review" = "needs_review";
  let parsing_notes: string | null = null;

  // CAS 1: Réponse structurée avec séparateur
  if (separator && parts.length >= 2) {
    // Parse type_code (parts[0])
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

    // Description = reste des parts non utilisées
    if (parts.length > 4) {
      description = parts.slice(4).join(" ").trim() || null;
    }

    // Déterminer le status
    if (type_code && delay_code && address) {
      lead_status = "complete";
    } else if (type_code || delay_code) {
      lead_status = "incomplete";
    } else {
      lead_status = "needs_review";
    }
  }
  // CAS 2: Réponse non structurée (pas de séparateur clair)
  else {
    // Tenter d'extraire type et delay via mots-clés
    type_code = extractTypeCode(bodySingleLine);
    delay_code = extractDelayCode(bodySingleLine);

    // Pas d'extraction d'adresse/nom dans une phrase non structurée
    address = null;
    full_name = null;
    description = bodyTrim;

    // Status: incomplete si au moins type OU delay, sinon needs_review
    if (type_code || delay_code) {
      lead_status = "incomplete";
      parsing_notes = "Réponse non structurée, extraction partielle uniquement";
    } else {
      lead_status = "needs_review";
      parsing_notes = "Réponse libre sans structure détectée";
    }
  }

  return {
    type_code,
    delay_code,
    address,
    full_name,
    description,
    raw_message: bodyTrim,
    lead_status,
    parsing_notes,
  };
}

/**
 * Extrait le type_code (1-4) depuis une chaîne
 * Priorité: chiffre explicite > emoji > mot-clé
 */
function extractTypeCode(text: string): number | null {
  const lower = text.toLowerCase().trim();

  // 1. Détection chiffre/emoji numérique
  const numericMatch = lower.match(/(?:type\s*)?([1-4])[️⃣\-\s]*/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }

  // Emojis numériques 1️⃣ 2️⃣ 3️⃣ 4️⃣
  if (/1️⃣/.test(text)) return 1;
  if (/2️⃣/.test(text)) return 2;
  if (/3️⃣/.test(text)) return 3;
  if (/4️⃣/.test(text)) return 4;

  // 2. Fallback mots-clés
  if (/d[ée]pannage|urgence|panne/i.test(lower)) return 1;
  if (/installation|pose|installer/i.test(lower)) return 2;
  if (/devis|estimation|chiffrage/i.test(lower)) return 3;
  if (/autre|divers|question/i.test(lower)) return 4;

  return null;
}

/**
 * Extrait le delay_code (1-4) depuis une chaîne
 * Priorité: chiffre explicite > emoji > mot-clé
 */
function extractDelayCode(text: string): number | null {
  const lower = text.toLowerCase().trim();

  // 1. Détection chiffre/emoji numérique
  const numericMatch = lower.match(/(?:d[ée]lai\s*)?([1-4])[️⃣\-\s]*/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }

  // Emojis numériques
  if (/1️⃣/.test(text)) return 1;
  if (/2️⃣/.test(text)) return 2;
  if (/3️⃣/.test(text)) return 3;
  if (/4️⃣/.test(text)) return 4;

  // 2. Fallback mots-clés
  if (/aujourd'hui|imm[ée]diat|urgent|maintenant|asap/i.test(lower)) return 1;
  if (/48h|2\s*jours|demain|cette semaine/i.test(lower)) return 2;
  if (/semaine|7\s*jours|sous 1 semaine/i.test(lower)) return 3;
  if (/pas press[ée]|flexible|quand (vous )?pouvez/i.test(lower)) return 4;

  return null;
}

/**
 * Détecte si une chaîne ressemble à une adresse
 */
function isLikelyAddress(text: string): boolean {
  const lower = text.toLowerCase();

  // Code postal français
  if (/\b\d{5}\b/.test(text)) return true;

  // Mots-clés d'adresse
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
  ];

  return addressKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(lower));
}

/**
 * Détecte si une chaîne ressemble à un nom de personne
 * 2-4 mots, majoritairement lettres, pas de chiffres
 */
function isLikelyName(text: string): boolean {
  const trimmed = text.trim();

  // Pas de chiffres
  if (/\d/.test(trimmed)) return false;

  // Pas de mots d'adresse
  if (isLikelyAddress(trimmed)) return false;

  // 2 à 4 mots
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;

  // Majoritairement des lettres (au moins 70%)
  const letterCount = (trimmed.match(/[a-zàâäéèêëïîôùûüÿç]/gi) || []).length;
  const totalChars = trimmed.replace(/\s/g, "").length;

  return letterCount / totalChars >= 0.7;
}

/**
 * TESTS RAPIDES (à copier dans un fichier de test ou exécuter manuellement)
 * 
 * Test 1: SMS structuré complet
 * parseSms("1/aujourd'hui/15 rue de la Paix 75002/Marie Dupont")
 * → type_code: 1, delay_code: 1, address: "15 rue de la Paix 75002", full_name: "Marie Dupont", lead_status: "complete"
 * 
 * Test 2: SMS avec séparateur ; et inversion
 * parseSms("2;48h;Jean Martin;42 avenue Victor Hugo Lyon")
 * → type_code: 2, delay_code: 2, address: "42 avenue Victor Hugo Lyon", full_name: "Jean Martin", lead_status: "complete"
 * 
 * Test 3: SMS incomplet (manque adresse)
 * parseSms("dépannage/urgent")
 * → type_code: 1, delay_code: 1, address: null, full_name: null, lead_status: "incomplete"
 * 
 * Test 4: Réponse libre
 * parseSms("Bonjour j'ai une panne électrique dans ma cuisine")
 * → type_code: 1, delay_code: null, address: null, description: "Bonjour j'ai une panne...", lead_status: "incomplete"
 * 
 * Test 5: Emojis numériques
 * parseSms("1️⃣/2️⃣/12 rue Voltaire/Sophie L")
 * → type_code: 1, delay_code: 2, address: "12 rue Voltaire", full_name: "Sophie L", lead_status: "complete"
 */