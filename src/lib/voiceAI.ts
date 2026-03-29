/**
 * Abstraction LLM pour l'agent vocal — V2
 * Analyse les transcripts vocaux et détermine la prochaine action.
 *
 * Changements V2 :
 *   - is_dangerous (bool) remplacé par danger_level (none/low/medium/high/critical)
 *   - estimated_scope renommé scope
 *   - availability_notes ajouté (disponibilité mentionnée par le prospect)
 *   - delay_code supprimé du parsedData (le scoring V2 utilise danger_level)
 */

import { getLLMProvider } from "@/lib/voiceAI.providers";
import type { VoiceAIAnalysis, ArtisanContext } from "@/modules/voice/voice.types";

// ---------------------------------------------------------------------------
// Helpers système de prompt — contenu dynamique selon specialty (Mod 1)
// ---------------------------------------------------------------------------

function buildDangerGrid(specialty: string): string {
  if (specialty === "electricien") {
    return `  * critical : étincelles actives, odeur de brûlé, fumée, tableau qui chauffe, risque incendie
  * high     : panne totale logement, disjoncteur principal bloqué, coupure immeuble
  * medium   : panne partielle (pièce/circuit), disjoncteur qui saute en boucle
  * low      : prise HS, va-et-vient en panne, ampoule qui grille souvent
  * none     : devis planifié, installation neuve sans urgence, mise aux normes`;
  }
  if (specialty === "plombier") {
    return `  * critical : fuite active non maîtrisable, dégât des eaux en cours, coupure eau impossible
  * high     : fuite visible, chauffe-eau HS, pas d'eau chaude
  * medium   : robinet qui goutte, pression faible, WC qui coule
  * low      : joint à changer, robinet raide, entretien
  * none     : devis, installation neuve, rénovation planifiée`;
  }
  if (specialty === "serrurier") {
    return `  * critical : personne enfermée ou bloquée dehors la nuit
  * high     : porte impossible à fermer, serrure forcée, effraction
  * medium   : clé cassée dans serrure, cylindre à changer
  * low      : double de clé, serrure qui accroche
  * none     : installation serrure neuve, devis sécurisation`;
  }
  return `  * critical : danger immédiat, sécurité en jeu
  * high     : panne majeure, blocage total
  * medium   : dysfonctionnement partiel
  * low      : panne isolée, gêne mineure
  * none     : devis, intervention planifiée`;
}

function buildScopeGrid(specialty: string): string {
  if (specialty === "electricien") {
    return `  * large  : tableau complet, tout le logement, installation entière
  * medium : plusieurs pièces, circuit dédié, mise aux normes partielle
  * small  : une prise, un interrupteur, une pièce isolée`;
  }
  return `  * large  : travaux importants, tout le logement
  * medium : intervention sur plusieurs points
  * small  : intervention ponctuelle et localisée`;
}

function buildDangerClarificationQuestion(specialty: string): string {
  if (specialty === "electricien") {
    return "Y a-t-il des étincelles, une odeur de brûlé, ou vous n'avez plus de courant du tout ?";
  }
  if (specialty === "plombier") {
    return "Y a-t-il une fuite active visible, ou vous n'avez plus d'eau ?";
  }
  if (specialty === "serrurier") {
    return "Êtes-vous bloqué dehors en ce moment, ou la porte ne ferme plus du tout ?";
  }
  return "C'est une urgence immédiate, ou ça peut attendre quelques heures ?";
}

/**
 * Vérifie si une adresse contient une ville (heuristique simple).
 * Mod 2 : une adresse sans ville a < 15 chars ou < 4 mots.
 */
function addressHasCity(address: string): boolean {
  const trimmed = address?.trim() ?? "";
  if (trimmed.length < 15) return false;
  return trimmed.split(/\s+/).filter(Boolean).length >= 4;
}

// ---------------------------------------------------------------------------

/** Fallback retourné si le parsing JSON du LLM échoue */
function buildFallbackAnalysis(rawText: string): VoiceAIAnalysis {
  return {
    needsFollowUp: false,
    followUpQuestion: null,
    parsedData: {
      type_code: null,
      danger_level: "none",
      scope: "small",
      full_name: null,
      address: null,
      description: rawText,
      availability_notes: null,
      callback_delay: "today",
    },
    confidence: 0.1,
    recap: null,
  };
}

/**
 * Analyse les transcripts vocaux accumulés et détermine la prochaine action.
 * Retourne une structure VoiceAIAnalysis avec le parsing et l'éventuelle question de suivi.
 */
export async function analyzeVoiceTranscripts(
  transcripts: string[],
  currentTurn: number,
  maxTurns: number,
  artisanContext: ArtisanContext
): Promise<VoiceAIAnalysis> {
  // Mod 1 : prompt dynamique selon specialty
  const specialty = artisanContext.specialty;
  const systemPrompt = `Tu es l'assistant téléphonique de ${artisanContext.name}, ${specialty}.
Tu prends les demandes des clients en moins de 90 secondes, de façon naturelle et rassurante.

CHAMPS OBLIGATOIRES À EXTRAIRE :
1. full_name   — nom complet du client
2. address     — numéro + rue + ville (VILLE OBLIGATOIRE)
3. type_code   — 1=dépannage / 2=installation / 3=devis / 4=autre
4. description — le problème en 1 phrase

CHAMPS INFÉRÉS (ne jamais demander directement) :
- danger_level       : évalué depuis la description et le contexte
- scope              : ampleur estimée du chantier
- availability_notes : si mentionné spontanément par le client

GRILLE DANGER (${specialty}) :
${buildDangerGrid(specialty)}

GRILLE SCOPE (${specialty}) :
${buildScopeGrid(specialty)}

CALLBACK DELAY (dérivé automatiquement du danger_level) :
  critical → asap, high → within_hour, medium → today, low/none → no_rush

STRATÉGIE DE CONVERSATION — ${maxTurns} tours maximum, tu es au tour ${currentTurn} :
Tour 1 : laisser décrire librement → "Pouvez-vous me décrire votre problème ?"
Tour 2 : si danger ambigu → "${buildDangerClarificationQuestion(specialty)}"
Tour 3 : si scope non clair → "Ça touche une pièce, plusieurs pièces, ou tout le logement ?"
Tour 4 : si urgence non claire → "C'est urgent pour vous ? Aujourd'hui, cette semaine ?"
Tour 5 : nom + adresse → "C'est à quel nom et à quelle adresse pour l'intervention ?" — si ville absente de l'adresse, demander : "Et dans quelle ville ?"
Tour 6 : confirmation → reformule la demande complète + "C'est bien ça ?" puis needsFollowUp: false

RÈGLES ABSOLUES :
- 1 seule question par tour
- Ne jamais demander danger_level ou scope directement
- VILLE OBLIGATOIRE dans l'adresse — si manquante, demander : "Et dans quelle ville se trouve l'adresse ?"
- Si danger=critical détecté → rassurer immédiatement : "Je transmets ça en urgence absolue, ${artisanContext.name} vous rappelle dans les plus brefs délais."
- Si client paniqué → questions courtes, ton calme et rassurant
- Si client froid/pressé → aller droit au but, pas de politesse superflue
- CONTINUE (needsFollowUp: true) tant que les 4 champs obligatoires ne sont pas tous obtenus
- TERMINE (needsFollowUp: false) dès que les 4 champs sont obtenus, même avant le tour 6
- Au dernier tour (tour ${maxTurns}) → needsFollowUp: false obligatoire, extrais ce que tu peux

STYLE :
- Vouvoiement systématique
- Parle comme un assistant humain au téléphone, naturel et professionnel
- Accuse toujours réception de ce que dit le client avant de poser ta question suivante
- Varie les accusés de réception : "Bien sûr,", "Noté,", "Je comprends,", "C'est noté,", etc.
- Ne jamais dire "je suis une IA" ou "je suis un robot" — tu es "l'assistant de ${artisanContext.name}"

QUAND needsFollowUp est false → fournis un "recap" : résumé naturel de la demande.
Exemple : "un dépannage urgent pour une prise avec étincelles au 15 rue de la Paix Paris, au nom de Marie Martin"

FORMAT DE RÉPONSE — JSON uniquement, aucun autre texte :
{"needsFollowUp":true/false,"followUpQuestion":"..."|null,"parsedData":{"type_code":1|2|3|4|null,"danger_level":"none"|"low"|"medium"|"high"|"critical","scope":"small"|"medium"|"large","full_name":"..."|null,"address":"..."|null,"description":"..."|null,"availability_notes":"..."|null,"callback_delay":"asap"|"within_hour"|"today"|"no_rush"},"confidence":0.0-1.0,"recap":"..."|null}`;

  const userMessage = transcripts
    .map((t, i) => `Tour ${i + 1} : "${t}"`)
    .join("\n");

  const provider = getLLMProvider();
  let rawResponse: string;

  try {
    rawResponse = await provider.complete(systemPrompt, userMessage);
  } catch (err) {
    console.error("[voiceAI] Erreur appel LLM:", err);
    return buildFallbackAnalysis(transcripts.join(" | "));
  }

  try {
    // Nettoyer la réponse (parfois le LLM envoie du markdown malgré les instructions)
    const cleaned = rawResponse
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    const parsed = JSON.parse(cleaned) as VoiceAIAnalysis;

    // Validation de la structure avant accès aux champs
    if (typeof parsed.needsFollowUp !== "boolean") {
      throw new Error("Structure JSON invalide : needsFollowUp manquant");
    }
    if (!parsed.parsedData || typeof parsed.parsedData !== "object") {
      console.error("[voiceAI] parsedData absent ou invalide dans la réponse LLM");
      return buildFallbackAnalysis(transcripts.join(" | "));
    }

    // Valeurs par défaut pour les champs optionnels
    if (!parsed.parsedData.danger_level) parsed.parsedData.danger_level = "none";
    if (!parsed.parsedData.scope) parsed.parsedData.scope = "small";
    if (!parsed.parsedData.callback_delay) parsed.parsedData.callback_delay = "today";
    if (parsed.parsedData.availability_notes === undefined) parsed.parsedData.availability_notes = null;
    if (parsed.recap === undefined) parsed.recap = null;

    // Mod 2 : ville obligatoire — si adresse présente mais sans ville et tours restants, forcer la question
    if (
      !parsed.needsFollowUp &&
      parsed.parsedData.address !== null &&
      !addressHasCity(parsed.parsedData.address) &&
      currentTurn < maxTurns
    ) {
      parsed.needsFollowUp = true;
      parsed.followUpQuestion = "Et dans quelle ville se trouve l'adresse ?";
    }

    return parsed;
  } catch (parseErr) {
    console.error("[voiceAI] Erreur parsing JSON LLM:", parseErr, "Raw:", rawResponse);
    return buildFallbackAnalysis(transcripts.join(" | "));
  }
}
