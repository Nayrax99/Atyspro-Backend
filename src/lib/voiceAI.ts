/**
 * Abstraction LLM pour l'agent vocal
 * Analyse les transcripts vocaux et détermine la prochaine action
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
      delay_code: null,
      full_name: null,
      address: null,
      description: rawText,
      is_dangerous: false,
      estimated_scope: "medium",
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
2. URGENCE : aujourd'hui/urgent (1), sous 48h (2), cette semaine (3), pas pressé (4)
3. NOM COMPLET du prospect
4. ADRESSE de l'intervention

Tu dois aussi détecter automatiquement (sans poser de question) :
- DANGER : étincelles, odeur de brûlé, câbles dénudés, eau + électricité, plus de courant total, disjoncteur qui saute en boucle → is_dangerous: true
- AMPLEUR : un interrupteur/une prise = small, une pièce/un tableau = medium, un appartement/maison entière = large
- DÉLAI DE RAPPEL SUGGÉRÉ : danger → asap, urgent → within_hour, 48h/semaine → today, pas pressé → no_rush

RÈGLES DE CONVERSATION :
- Tu es au tour ${currentTurn} sur ${maxTurns} maximum.
- CONTINUE la conversation (needsFollowUp: true) tant que les 4 infos obligatoires ne sont pas toutes obtenues.
- TERMINE la conversation (needsFollowUp: false) DÈS QUE tu as les 4 infos, même si c'est au tour 1.
- Au DERNIER tour (turn == ${maxTurns}) → needsFollowUp: false toujours, extrais ce que tu peux.
- UNE SEULE question par tour. Jamais deux questions à la fois sauf pour combiner nom + adresse.

STRATÉGIE DE QUESTIONNEMENT — pose la question la plus importante en premier :
- Si type ET urgence manquent → "Pouvez-vous me décrire le problème et me dire si c'est urgent ?"
- Si type manque → "Quel type d'intervention vous faut-il ? Un dépannage, une installation, ou un devis ?"
- Si urgence manque → "Et c'est urgent ou ça peut attendre quelques jours ?"
- Si nom ET adresse manquent → "À quel nom et à quelle adresse pour l'intervention ?"
- Si nom seul manque → "À quel nom je mets la demande ?"
- Si adresse seule manque → "Et l'intervention ce serait à quelle adresse ?"

ACCUSÉ DE RÉCEPTION — OBLIGATOIRE :
Quand le client dit quelque chose, commence TOUJOURS par accuser réception naturellement AVANT de poser ta question suivante :
- Client dit son problème → "Je comprends, je note ça en priorité." puis ta question
- Client dit que c'est urgent → "Bien noté, c'est en priorité." puis ta question
- Client pose une question → Réponds brièvement puis enchaîne avec ta question
- Client semble stressé → "Je comprends votre inquiétude, ${artisanContext.name} vous rappellera très vite." puis ta question
- Ne JAMAIS ignorer ce que dit le client.

QUAND needsFollowUp est false, tu DOIS fournir un "recap" : résumé en langage naturel de la demande pour confirmation.
Exemple : "un dépannage urgent pour une prise avec étincelles au 15 rue de la Paix à Paris, au nom de Marie Martin"

FORMAT DE RÉPONSE — JSON uniquement, aucun autre texte :
{"needsFollowUp":true/false,"followUpQuestion":"..."|null,"parsedData":{"type_code":1|2|3|4|null,"delay_code":1|2|3|4|null,"full_name":"..."|null,"address":"..."|null,"description":"..."|null,"is_dangerous":true/false,"estimated_scope":"small"|"medium"|"large","callback_delay":"asap"|"within_hour"|"today"|"no_rush"},"confidence":0.0-1.0,"recap":"..."|null}`;

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

    // Validation basique de la structure
    if (typeof parsed.needsFollowUp !== "boolean") {
      throw new Error("Structure JSON invalide : needsFollowUp manquant");
    }

    // Garantir les valeurs par défaut des nouveaux champs
    if (!parsed.parsedData.is_dangerous) parsed.parsedData.is_dangerous = false;
    if (!parsed.parsedData.estimated_scope) parsed.parsedData.estimated_scope = "medium";
    if (!parsed.parsedData.callback_delay) parsed.parsedData.callback_delay = "today";
    if (parsed.recap === undefined) parsed.recap = null;

    return parsed;
  } catch (parseErr) {
    console.error("[voiceAI] Erreur parsing JSON LLM:", parseErr, "Raw:", rawResponse);
    return buildFallbackAnalysis(transcripts.join(" | "));
  }
}
