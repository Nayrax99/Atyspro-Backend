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
    },
    confidence: 0.1,
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
  const systemPrompt = `Tu es l'assistant téléphonique d'un artisan ${artisanContext.specialty} nommé ${artisanContext.name}.
Tu analyses la transcription vocale d'un prospect qui appelle.

Objectif : extraire ces informations :
- Type de travaux : dépannage (1), installation (2), devis (3), autre (4)
- Urgence : aujourd'hui (1), sous 48h (2), cette semaine (3), pas pressé (4)
- Nom complet du prospect
- Adresse des travaux
- Description du besoin

Tour actuel : ${currentTurn}/${maxTurns}.

Règles :
- Si type OU urgence manque et qu'il reste des tours → needsFollowUp true avec UNE question courte et naturelle
- Si tu as au moins type ET urgence → needsFollowUp false même si adresse manque
- Au dernier tour → needsFollowUp false toujours, extrais ce que tu peux
- Réponds UNIQUEMENT en JSON valide, aucun autre texte

Format :
{"needsFollowUp":true,"followUpQuestion":"...","parsedData":{"type_code":1,"delay_code":null,"full_name":null,"address":null,"description":null},"confidence":0.8}`;

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

    return parsed;
  } catch (parseErr) {
    console.error("[voiceAI] Erreur parsing JSON LLM:", parseErr, "Raw:", rawResponse);
    return buildFallbackAnalysis(transcripts.join(" | "));
  }
}
