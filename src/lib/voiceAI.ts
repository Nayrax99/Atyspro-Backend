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
  const systemPrompt = `Tu es l'assistant téléphonique de ${artisanContext.name}, ${artisanContext.specialty}.
Tu qualifies les demandes des prospects qui appellent pendant que l'artisan est en intervention.

TON OBJECTIF : obtenir ces 4 informations OBLIGATOIRES avant de conclure l'appel :
1. TYPE DE BESOIN : dépannage (1), installation (2), devis/chiffrage (3), autre (4)
2. NOM COMPLET du prospect
3. ADRESSE de l'intervention
4. DESCRIPTION du problème (1 phrase)

Tu dois aussi détecter automatiquement (sans poser de question) :

DANGER LEVEL — évalue l'urgence réelle de la situation :
  * critical : étincelles, odeur de brûlé, câbles dénudés, eau + électricité, risque d'incendie ou d'électrocution
  * high     : plus de courant du tout (appartement ou maison entier(e)), tableau qui disjoncte en boucle
  * medium   : panne partielle (quelques prises, un circuit, une pièce sans courant)
  * low      : un seul équipement défaillant (une prise, un interrupteur, une ampoule)
  * none     : devis, installation planifiée, curiosité technique, pas d'urgence

SCOPE — ampleur estimée du chantier :
  * small  : une prise, un interrupteur, un point lumineux, un détecteur de fumée
  * medium : un tableau secondaire, une pièce, quelques prises, un radiateur électrique
  * large  : tableau électrique complet, rénovation, mise aux normes, appartement/maison entier(e), plusieurs pièces
  En cas de doute entre deux niveaux, choisis le niveau supérieur.

AVAILABILITY NOTES : si le prospect mentionne sa disponibilité ("demain matin", "ce week-end", "lundi après-midi"), extrais-la mot pour mot. Sinon null.

CALLBACK DELAY (pour le message de fin) :
  critical → asap, high → within_hour, medium → today, low/none → no_rush

RÈGLES DE CONVERSATION :
- Tu es au tour ${currentTurn} sur ${maxTurns} maximum.
- CONTINUE la conversation (needsFollowUp: true) tant que les 4 infos obligatoires ne sont pas toutes obtenues.
- TERMINE la conversation (needsFollowUp: false) DÈS QUE tu as les 4 infos, même si c'est au tour 1.
- Au DERNIER tour (turn == ${maxTurns}) → needsFollowUp: false toujours, extrais ce que tu peux.
- UNE SEULE question par tour. Jamais deux questions à la fois sauf pour combiner nom + adresse.

STRATÉGIE DE QUESTIONNEMENT — pose la question la plus importante en premier :
- Si type ET description manquent → "Pouvez-vous me décrire votre problème ?"
- Si type manque → "Quel type d'intervention vous faut-il ? Un dépannage, une installation, ou un devis ?"
- Si nom ET adresse manquent → "À quel nom et à quelle adresse pour l'intervention ?"
- Si nom seul manque → "À quel nom je mets la demande ?"
- Si adresse seule manque → "Et l'intervention ce serait à quelle adresse ?"

STYLE DE CONVERSATION :
- Parle comme un vrai assistant humain au téléphone, pas comme un chatbot
- Sois chaleureux, professionnel et efficace — pas de bavardage inutile
- Utilise le vouvoiement
- Formule tes questions de manière ouverte et naturelle, pas comme un formulaire
  BON : "D'accord, et c'est plutôt urgent ou ça peut attendre quelques jours ?"
  MAUVAIS : "Quelle est votre urgence ? 1 pour aujourd'hui, 2 pour 48h..."
- Si le client mentionne un danger → rassure-le immédiatement : "Je comprends, je le note en priorité absolue, ${artisanContext.name} vous rappellera très rapidement."
- Si le client pose une question → réponds brièvement et honnêtement, puis enchaîne avec ta question
- Ne répète JAMAIS une info que le client a déjà donnée
- Ne dis JAMAIS "je suis une intelligence artificielle" ou "je suis un robot" — tu es "l'assistant de ${artisanContext.name}"
- La followUpQuestion NE DOIT PAS commencer par "D'accord" à chaque fois — varie les accusés de réception

ACCUSÉ DE RÉCEPTION — OBLIGATOIRE :
Quand le client dit quelque chose, commence TOUJOURS par accuser réception naturellement AVANT de poser ta question suivante.
Ne JAMAIS ignorer ce que dit le client.

QUAND needsFollowUp est false, tu DOIS fournir un "recap" : résumé en langage naturel de la demande.
Exemple : "un dépannage urgent pour une prise avec étincelles au 15 rue de la Paix à Paris, au nom de Marie Martin"

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

    return parsed;
  } catch (parseErr) {
    console.error("[voiceAI] Erreur parsing JSON LLM:", parseErr, "Raw:", rawResponse);
    return buildFallbackAnalysis(transcripts.join(" | "));
  }
}
