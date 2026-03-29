/**
 * Service agent vocal AtysPro — orchestration complète de la conversation vocale.
 * Toute la logique métier est ici ; les routes sont de simples délégués.
 *
 * Fix #2  : upsert leads (account_id, twilio_call_sid) pour éviter les doublons sur retry Twilio.
 * Fix #3  : transcripts lus depuis DB (calls.voice_transcripts) plutôt que depuis les URLs.
 * Fix #6  : parsedData lu depuis DB (calls.voice_ai_result) plutôt que depuis les URLs.
 * Fix #13 : statut lead calculé via determineLeadStatus() partagé avec le pipeline SMS.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { analyzeVoiceTranscripts, buildGreeting, pickRandom, VOICE_VARIATIONS } from "@/lib/voiceAI";
import { computeScore, computeParsingConfidence } from "@/lib/leadScoring";
import { getScoringConfig } from "@/lib/scoringConfig";
import { sendSMS } from "@/lib/twilioClient";
import { VOICE_CONFIRMATION_SMS } from "@/lib/smsTemplates";
import { determineLeadStatus } from "@/lib/leadStatus";
import {
  buildWelcomeTwiml,
  buildFollowUpTwiml,
  buildRecapTwiml,
  buildGoodbyeTwiml,
  buildErrorTwiml,
} from "@/lib/voiceTemplates";
import type {
  IncomingCallParams,
  GatherResultParams,
  ConfirmationParams,
  ArtisanContext,
  VoiceAIAnalysis,
  VoiceTranscriptEntry,
} from "./voice.types";
import { MAX_VOICE_TURNS } from "./voice.types";

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/** Résout l'account_id depuis le numéro Twilio appelé (e164) */
async function resolveAccountFromPhone(
  phoneE164: string
): Promise<{ accountId: string; phoneNumberId: string } | null> {
  if (!supabaseAdmin) return null;

  const candidates = buildE164Candidates(phoneE164);

  for (const candidate of candidates) {
    const { data } = await supabaseAdmin
      .from("phone_numbers")
      .select("id, account_id")
      .eq("e164", candidate)
      .eq("active", true)
      .maybeSingle();

    if (data) {
      return { accountId: data.account_id, phoneNumberId: data.id };
    }
  }

  return null;
}

/** Charge le contexte artisan depuis la table accounts */
async function loadArtisanContext(accountId: string): Promise<ArtisanContext | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("accounts")
    .select("id, name, specialty")
    .eq("id", accountId)
    .single();

  if (error || !data) return null;

  return {
    accountId: data.id as string,
    name: (data.name as string) || "l'artisan",
    specialty: (data.specialty as string) || "électricien",
  };
}

/** Construit les variantes E.164 pour la recherche en base */
function buildE164Candidates(value: string): string[] {
  const trimmed = value?.trim() || "";
  if (!trimmed) return [];
  const withPlus = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
  const withoutPlus = withPlus.replace(/^\+/, "");
  return [...new Set([trimmed, withPlus, withoutPlus])];
}

/**
 * Parse le champ voice_transcripts depuis la DB en VoiceTranscriptEntry[].
 * Filtre les entrées malformées pour robustesse.
 */
function parseTranscriptEntries(raw: unknown): VoiceTranscriptEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is VoiceTranscriptEntry =>
      e !== null &&
      typeof e === "object" &&
      (e.role === "assistant" || e.role === "user") &&
      typeof e.text === "string"
  );
}

/** Texte naturel du délai de rappel (sans encoding XML) */
function delayTextPlain(callbackDelay: string): string {
  const map: Record<string, string> = {
    asap: "dès que possible, c'est noté en priorité",
    within_hour: "dans l'heure",
    today: "dans la journée",
    no_rush: "rapidement",
  };
  return map[callbackDelay] ?? "dès que possible";
}

// ---------------------------------------------------------------------------
// Fonctions publiques du service
// ---------------------------------------------------------------------------

/**
 * Gère le décroché initial d'un appel entrant.
 * Initialise voice_transcripts avec le message d'accueil de l'IA (tour 0).
 */
export async function handleIncomingCall(
  params: IncomingCallParams
): Promise<string> {
  const { callSid, from, to, callStatus } = params;

  if (!supabaseAdmin) {
    console.error("[voice.service] supabaseAdmin non configuré");
    return buildErrorTwiml();
  }

  const resolved = await resolveAccountFromPhone(to);
  if (!resolved) {
    console.error("[voice.service] Numéro professionnel non trouvé:", to);
    return buildErrorTwiml();
  }

  const { accountId, phoneNumberId } = resolved;

  const artisan = await loadArtisanContext(accountId);
  if (!artisan) {
    console.error("[voice.service] Compte artisan non trouvé:", accountId);
    return buildErrorTwiml();
  }

  // Texte brut du message d'accueil — généré dynamiquement (Mod 1)
  const welcomeText = buildGreeting({ first_name: artisan.name });

  const welcomeEntry: VoiceTranscriptEntry = {
    role: "assistant",
    text: welcomeText,
    turn: 0,
    timestamp: new Date().toISOString(),
  };

  // Upsert avec ignoreDuplicates: true — n'écrase pas si l'appel existe déjà
  const { error: callError } = await supabaseAdmin.from("calls").upsert(
    {
      account_id: accountId,
      phone_number_id: phoneNumberId,
      twilio_call_sid: callSid,
      direction: "inbound",
      from_number: from,
      to_number: to,
      status: callStatus || "in-progress",
      started_at: new Date().toISOString(),
      voice_agent_used: true,
      voice_transcripts: [welcomeEntry],
    },
    { onConflict: "twilio_call_sid", ignoreDuplicates: true }
  );

  if (callError) {
    console.warn("[voice.service] Erreur upsert call (non bloquant):", callError.message);
  }

  console.log("[voice.service] Appel entrant — artisan:", artisan.name, "call_sid:", callSid);

  return buildWelcomeTwiml(artisan.name, accountId, callSid, welcomeText);
}

/**
 * Gère un résultat de Gather (transcript STT reçu de Twilio).
 * Fix #3 : les transcripts user sont dérivés des entries DB, plus passés via URL.
 */
export async function handleGatherResult(
  params: GatherResultParams
): Promise<string> {
  const { speechResult, turn, accountId, callSid } = params;

  if (!supabaseAdmin) {
    console.error("[voice.service] supabaseAdmin non configuré");
    return buildErrorTwiml();
  }

  // Fetch parallèle : artisan + conversation existante en DB
  const [artisan, callResult] = await Promise.all([
    loadArtisanContext(accountId),
    supabaseAdmin
      .from("calls")
      .select("voice_transcripts")
      .eq("twilio_call_sid", callSid)
      .maybeSingle(),
  ]);

  if (!artisan) {
    console.error("[voice.service] Compte artisan non trouvé pour gather:", accountId);
    return buildErrorTwiml();
  }

  const existingEntries = parseTranscriptEntries(callResult.data?.voice_transcripts);

  // Fix #3 : dériver allTranscripts depuis les entries DB (textes user uniquement)
  // plutôt que depuis les query params URL (qui pouvaient dépasser 2KB).
  const allTranscripts: string[] = [
    ...existingEntries
      .filter((e) => e.role === "user")
      .map((e) => e.text),
    speechResult,
  ];

  console.log(
    "[voice.service] Gather tour %d/%d — call_sid: %s — transcripts user: %d",
    turn,
    MAX_VOICE_TURNS,
    callSid,
    allTranscripts.length
  );

  const analysis = await analyzeVoiceTranscripts(
    allTranscripts,
    turn,
    MAX_VOICE_TURNS,
    artisan
  );

  console.log("[voice.service] Analyse LLM tour %d:", turn, {
    needsFollowUp: analysis.needsFollowUp,
    confidence: analysis.confidence,
    parsedData: analysis.parsedData,
    recap: analysis.recap,
  });

  // Texte de la réponse IA pour cette étape
  let assistantText: string;
  if (analysis.needsFollowUp && analysis.followUpQuestion) {
    assistantText = analysis.followUpQuestion;
  } else if (analysis.recap) {
    assistantText = `Parfait, je récapitule. Vous avez besoin de ${analysis.recap}. ${artisan.name} vous rappelle ${delayTextPlain(analysis.parsedData.callback_delay)}. Est-ce que c'est correct ?`;
  } else {
    // Mod 4 : closing varié selon danger_level
    const isUrgent =
      analysis.parsedData.danger_level === "critical" ||
      analysis.parsedData.danger_level === "high";
    const closingTemplate = pickRandom(
      isUrgent ? VOICE_VARIATIONS.closing_urgent : VOICE_VARIATIONS.closing
    );
    assistantText = closingTemplate.replace("ARTISAN_NAME", artisan.name);
  }

  const now = new Date().toISOString();
  const updatedEntries: VoiceTranscriptEntry[] = [
    ...existingEntries,
    { role: "user", text: speechResult, turn, timestamp: now },
    { role: "assistant", text: assistantText, turn, timestamp: now },
  ];

  // Mise à jour progressive des entries en DB
  // Fix #6 : si l'analyse est terminée, persister aussi voice_ai_result pour que
  // /confirm puisse le lire sans avoir à le passer en URL.
  const callUpdate: Record<string, unknown> = { voice_transcripts: updatedEntries };
  if (!analysis.needsFollowUp) {
    callUpdate.voice_ai_result = analysis.parsedData;
  }

  const { data: updateData, error: transcriptError } = await supabaseAdmin
    .from("calls")
    .update(callUpdate)
    .eq("twilio_call_sid", callSid)
    .select("twilio_call_sid");

  if (transcriptError) {
    console.error(
      "[voice.service] Erreur écriture transcripts tour %d: %s",
      turn,
      transcriptError.message
    );
  } else if (!updateData || updateData.length === 0) {
    console.error(
      "[voice.service] AUCUN call trouvé pour twilio_call_sid=%s — transcripts non sauvegardés",
      callSid
    );
  } else {
    console.log(
      "[voice.service] Transcripts écrits tour %d — entries: %d",
      turn,
      updatedEntries.length
    );
  }

  // Continue la qualification tant que les 4 infos ne sont pas obtenues
  if (analysis.needsFollowUp && turn < MAX_VOICE_TURNS && analysis.followUpQuestion) {
    return buildFollowUpTwiml(
      analysis.followUpQuestion,
      turn + 1,
      accountId,
      callSid
    );
  }

  // Qualification terminée — récapitulatif si disponible, sinon finalisation directe
  if (analysis.recap) {
    return buildRecapTwiml(
      analysis.recap,
      artisan.name,
      analysis.parsedData.callback_delay,
      accountId,
      callSid
    );
  }

  // Fallback : pas de récap (ex. LLM timeout) → finaliser directement
  await finalizeLead(accountId, callSid, updatedEntries, analysis, artisan);
  return buildGoodbyeTwiml(artisan.name, analysis.parsedData.callback_delay);
}

/**
 * Gère la confirmation client après le récapitulatif.
 * Fix #3/#6 : parsedData et transcripts lus depuis la DB (calls), plus passés via URL.
 * Fix #2 : upsert lead avec (account_id, twilio_call_sid) pour éviter les doublons sur retry.
 */
export async function handleConfirmation(
  params: ConfirmationParams
): Promise<string> {
  const { accountId, callSid, speechResult } = params;

  if (!supabaseAdmin) {
    console.error("[voice.service] supabaseAdmin non configuré");
    return buildErrorTwiml();
  }

  const artisan = await loadArtisanContext(accountId);
  if (!artisan) {
    console.error("[voice.service] Compte artisan non trouvé pour confirmation:", accountId);
    return buildErrorTwiml();
  }

  // Fix #3/#6 : lire parsedData et transcripts depuis la DB
  const { data: callRow } = await supabaseAdmin
    .from("calls")
    .select("from_number, to_number, voice_transcripts, voice_ai_result")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  const clientPhone = (callRow?.from_number as string) || null;
  const atysProPhone = (callRow?.to_number as string) || null;

  // Fix #6 : parsedData depuis DB, fallback aux valeurs par défaut si absent
  const parsedData: VoiceAIAnalysis["parsedData"] = (callRow?.voice_ai_result as VoiceAIAnalysis["parsedData"] | null) ?? {
    type_code: null,
    danger_level: "none",
    scope: "small",
    full_name: null,
    address: null,
    description: null,
    availability_notes: null,
    callback_delay: "today",
  };

  if (!callRow?.voice_ai_result) {
    console.warn(
      "[voice.service] voice_ai_result absent pour call_sid=%s — utilisation des valeurs par défaut",
      callSid
    );
  }

  const existingEntries = parseTranscriptEntries(callRow?.voice_transcripts);

  // Fix #13 : statut via le helper unifié (pas de delay_code dans le pipeline vocal)
  const status = determineLeadStatus(
    parsedData.type_code,
    null,
    parsedData.address,
    parsedData.full_name
  );

  const config = await getScoringConfig(artisan.specialty);
  const parsing_confidence = computeParsingConfidence({
    type_code: parsedData.type_code,
    danger_level: parsedData.danger_level,
    full_name: parsedData.full_name,
    address: parsedData.address,
    description: parsedData.description,
  });
  const scored = computeScore(
    {
      type_code: parsedData.type_code,
      danger_level: parsedData.danger_level,
      scope: parsedData.scope,
      address: parsedData.address,
      full_name: parsedData.full_name,
      availability_notes: parsedData.availability_notes,
    },
    config
  );

  // Ajouter la confirmation du prospect + le message de fin de l'IA
  const goodbyeText = `Merci beaucoup. ${artisan.name} vous rappelle ${delayTextPlain(parsedData.callback_delay)}. Bonne journée !`;
  const confirmTurn = existingEntries.filter((e) => e.role === "user").length + 1;
  const now = new Date().toISOString();

  const finalEntries: VoiceTranscriptEntry[] = [
    ...existingEntries,
    { role: "user", text: speechResult || "confirmé", turn: confirmTurn, timestamp: now },
    { role: "assistant", text: goodbyeText, turn: confirmTurn, timestamp: now },
  ];

  // raw_message = textes user uniquement (compatibilité dashboard)
  const userTexts = existingEntries.filter((e) => e.role === "user").map((e) => e.text);
  const rawMessage = userTexts.length > 0 ? userTexts.join(" | ") : "";

  console.log(
    "[voice.service] Confirmation — entries DB: %d, user texts: %d",
    existingEntries.length,
    userTexts.length
  );

  // Fix #2 : upsert avec (account_id, twilio_call_sid) — idempotent sur retry Twilio
  const { error: leadError } = await supabaseAdmin.from("leads").upsert(
    {
      account_id: accountId,
      client_phone: clientPhone,
      twilio_call_sid: callSid,
      status,
      type_code: parsedData.type_code,
      danger_level: parsedData.danger_level,
      scope: parsedData.scope,
      availability_notes: parsedData.availability_notes,
      parsing_confidence,
      full_name: parsedData.full_name,
      contact_name: parsedData.full_name,
      address: parsedData.address,
      description: parsedData.description,
      callback_delay: parsedData.callback_delay,
      priority_score: scored.priority_score,
      value_estimate: scored.value_estimate,
      raw_message: rawMessage,
    },
    { onConflict: "account_id,twilio_call_sid" }
  );

  if (leadError) {
    console.error("[voice.service] Erreur upsert lead (confirmation):", leadError.message);
  } else {
    console.log(
      "[voice.service] Lead confirmé — artisan: %s, status: %s, score: %d, danger: %s",
      artisan.name,
      status,
      scored.priority_score,
      parsedData.danger_level
    );
  }

  // Mettre à jour l'appel avec la conversation complète et le statut final
  const { error: updateError } = await supabaseAdmin
    .from("calls")
    .update({
      status: "completed",
      ended_at: now,
      voice_transcripts: finalEntries,
    })
    .eq("twilio_call_sid", callSid);

  if (updateError) {
    console.warn("[voice.service] Erreur update call (confirmation):", updateError.message);
  }

  // Envoyer SMS de confirmation au prospect (non bloquant)
  if (clientPhone && atysProPhone) {
    try {
      const smsResult = await sendSMS(
        clientPhone,
        atysProPhone,
        VOICE_CONFIRMATION_SMS(artisan.name, parsedData.callback_delay)
      );
      if (!smsResult.success) {
        console.error("[voice.service] Échec SMS confirmation (non bloquant):", smsResult.error);
      }
    } catch (err) {
      console.error("[voice.service] Exception SMS confirmation (non bloquant):", err);
    }
  }

  return buildGoodbyeTwiml(artisan.name, parsedData.callback_delay);
}

// ---------------------------------------------------------------------------
// Finalisation directe (fallback sans récapitulatif)
// ---------------------------------------------------------------------------

/**
 * Crée le lead et met à jour l'appel — utilisé quand le LLM ne génère pas de récap.
 * Fix #2 : upsert avec (account_id, twilio_call_sid).
 * Fix #13 : statut via determineLeadStatus().
 */
async function finalizeLead(
  accountId: string,
  callSid: string,
  updatedEntries: VoiceTranscriptEntry[],
  analysis: VoiceAIAnalysis,
  artisan: ArtisanContext
): Promise<void> {
  if (!supabaseAdmin) return;

  const { parsedData } = analysis;

  // Fix #13 : helper unifié (pas de delay_code dans le pipeline vocal)
  const status = determineLeadStatus(
    parsedData.type_code,
    null,
    parsedData.address,
    parsedData.full_name
  );

  const config = await getScoringConfig(artisan.specialty);
  const parsing_confidence = computeParsingConfidence({
    type_code: parsedData.type_code,
    danger_level: parsedData.danger_level,
    full_name: parsedData.full_name,
    address: parsedData.address,
    description: parsedData.description,
  });
  const scored = computeScore(
    {
      type_code: parsedData.type_code,
      danger_level: parsedData.danger_level,
      scope: parsedData.scope,
      address: parsedData.address,
      full_name: parsedData.full_name,
      availability_notes: parsedData.availability_notes,
    },
    config
  );

  const { data: callRow } = await supabaseAdmin
    .from("calls")
    .select("from_number")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  const clientPhone = (callRow?.from_number as string) || null;

  // raw_message = textes user uniquement
  const userTexts = updatedEntries.filter((e) => e.role === "user").map((e) => e.text);
  const rawMessage = userTexts.join(" | ");

  // Fix #2 : upsert idempotent
  const { error: leadError } = await supabaseAdmin.from("leads").upsert(
    {
      account_id: accountId,
      client_phone: clientPhone,
      twilio_call_sid: callSid,
      status,
      type_code: parsedData.type_code,
      danger_level: parsedData.danger_level,
      scope: parsedData.scope,
      availability_notes: parsedData.availability_notes,
      parsing_confidence,
      full_name: parsedData.full_name,
      contact_name: parsedData.full_name,
      address: parsedData.address,
      description: parsedData.description,
      callback_delay: parsedData.callback_delay,
      priority_score: scored.priority_score,
      value_estimate: scored.value_estimate,
      raw_message: rawMessage,
    },
    { onConflict: "account_id,twilio_call_sid" }
  );

  if (leadError) {
    console.error("[voice.service] Erreur upsert lead (fallback):", leadError.message);
  } else {
    console.log(
      "[voice.service] Lead créé (fallback) — artisan: %s, status: %s, score: %d",
      artisan.name,
      status,
      scored.priority_score
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("calls")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
      voice_transcripts: updatedEntries,
    })
    .eq("twilio_call_sid", callSid);

  if (updateError) {
    console.warn("[voice.service] Erreur update call (fallback):", updateError.message);
  }
}
