/**
 * Service agent vocal AtysPro — orchestration complète de la conversation vocale.
 * Toute la logique métier est ici ; les routes sont de simples délégués.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { analyzeVoiceTranscripts } from "@/lib/voiceAI";
import { computeScore } from "@/lib/leadScoring";
import { sendSMS } from "@/lib/twilioClient";
import { VOICE_CONFIRMATION_SMS } from "@/lib/smsTemplates";
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

/** Détermine le statut du lead selon les données parsées */
function determineLeadStatus(
  parsedData: VoiceAIAnalysis["parsedData"]
): "complete" | "incomplete" | "needs_review" {
  const { type_code, delay_code, full_name } = parsedData;
  if (type_code && delay_code && full_name) return "complete";
  if (type_code || delay_code) return "incomplete";
  return "needs_review";
}

// ---------------------------------------------------------------------------
// Fonctions publiques du service
// ---------------------------------------------------------------------------

/**
 * Gère le décroché initial d'un appel entrant.
 * Retourne le TwiML d'accueil personnalisé avec Gather tour 1.
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

  // Logger l'appel entrant — upsert pour éviter le doublon si Twilio rappelle le webhook
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
      voice_transcripts: [],
    },
    { onConflict: "twilio_call_sid", ignoreDuplicates: true }
  );

  if (callError) {
    console.warn("[voice.service] Erreur upsert call (non bloquant):", callError.message);
  }

  console.log("[voice.service] Appel entrant — artisan:", artisan.name, "call_sid:", callSid);

  return buildWelcomeTwiml(artisan.name, accountId, callSid);
}

/**
 * Gère un résultat de Gather (transcript STT reçu de Twilio).
 * Retourne le TwiML de la prochaine étape :
 * - question de suivi si needsFollowUp et tours restants
 * - récapitulatif pour confirmation si toutes les infos sont collectées
 */
export async function handleGatherResult(
  params: GatherResultParams
): Promise<string> {
  const { speechResult, turn, accountId, callSid, prevTranscripts } = params;

  if (!supabaseAdmin) {
    console.error("[voice.service] supabaseAdmin non configuré");
    return buildErrorTwiml();
  }

  // Garantir que allTranscripts est bien un tableau de strings
  const allTranscripts: string[] = [
    ...prevTranscripts.filter((t): t is string => typeof t === "string"),
    speechResult,
  ];

  console.log(
    "[voice.service] Gather tour %d/%d — call_sid: %s — transcripts: %d — types: %s",
    turn,
    MAX_VOICE_TURNS,
    callSid,
    allTranscripts.length,
    allTranscripts.map((t) => typeof t).join(",")
  );

  const artisan = await loadArtisanContext(accountId);
  if (!artisan) {
    console.error("[voice.service] Compte artisan non trouvé pour gather:", accountId);
    return buildErrorTwiml();
  }

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

  // Mise à jour progressive des transcripts en DB à chaque tour
  // Utilise .select() pour confirmer que le UPDATE a bien touché des rows
  const { data: updateData, error: transcriptError } = await supabaseAdmin
    .from("calls")
    .update({ voice_transcripts: allTranscripts })
    .eq("twilio_call_sid", callSid)
    .select("twilio_call_sid, voice_transcripts");

  if (transcriptError) {
    console.error(
      "[voice.service] Erreur écriture transcripts tour %d: %s",
      turn,
      transcriptError.message,
      transcriptError
    );
  } else if (!updateData || updateData.length === 0) {
    console.error(
      "[voice.service] AUCUN call trouvé pour twilio_call_sid=%s — transcripts non sauvegardés",
      callSid
    );
  } else {
    console.log(
      "[voice.service] Transcripts écrits tour %d — rows: %d — saved: %j",
      turn,
      updateData.length,
      updateData[0].voice_transcripts
    );
  }

  // Continue la qualification tant que les 4 infos ne sont pas obtenues
  if (analysis.needsFollowUp && turn < MAX_VOICE_TURNS && analysis.followUpQuestion) {
    return buildFollowUpTwiml(
      analysis.followUpQuestion,
      turn + 1,
      accountId,
      callSid,
      allTranscripts
    );
  }

  // Qualification terminée — récapitulatif si disponible, sinon finalisation directe
  if (analysis.recap) {
    return buildRecapTwiml(
      analysis.recap,
      artisan.name,
      analysis.parsedData.callback_delay,
      accountId,
      callSid,
      allTranscripts,
      analysis.parsedData as unknown as Record<string, unknown>
    );
  }

  // Fallback : pas de récap (ex. LLM timeout) → finaliser directement
  await finalizeLead(accountId, callSid, allTranscripts, analysis, artisan);
  return buildGoodbyeTwiml(artisan.name, analysis.parsedData.callback_delay);
}

/**
 * Gère la confirmation client après le récapitulatif.
 * Crée le lead, met à jour l'appel, envoie le SMS de confirmation et retourne le TwiML de fin.
 */
export async function handleConfirmation(
  params: ConfirmationParams
): Promise<string> {
  const { accountId, callSid, allTranscripts: fallbackTranscripts, parsedData } = params;

  if (!supabaseAdmin) {
    console.error("[voice.service] supabaseAdmin non configuré");
    return buildErrorTwiml();
  }

  const artisan = await loadArtisanContext(accountId);
  if (!artisan) {
    console.error("[voice.service] Compte artisan non trouvé pour confirmation:", accountId);
    return buildErrorTwiml();
  }

  const status = determineLeadStatus(parsedData);
  const scored = computeScore(
    parsedData.type_code,
    parsedData.delay_code,
    parsedData.is_dangerous,
    parsedData.estimated_scope
  );

  // Récupérer les numéros ET les transcripts depuis l'appel en base
  // Les transcripts en DB sont plus fiables que ceux passés via URL params
  const { data: callRow } = await supabaseAdmin
    .from("calls")
    .select("from_number, to_number, voice_transcripts")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  const clientPhone = (callRow?.from_number as string) || null;
  const atysProPhone = (callRow?.to_number as string) || null;

  // Utiliser les transcripts depuis la DB (mis à jour à chaque tour dans handleGatherResult)
  // Fallback sur les params URL si la DB ne les a pas
  const dbTranscripts = Array.isArray(callRow?.voice_transcripts)
    ? (callRow.voice_transcripts as string[])
    : [];
  const allTranscripts = dbTranscripts.length > 0 ? dbTranscripts : fallbackTranscripts;

  console.log(
    "[voice.service] Confirmation — DB transcripts: %d, fallback: %d, using: %d",
    dbTranscripts.length,
    fallbackTranscripts.length,
    allTranscripts.length
  );

  // Créer le lead avec scoring V2
  const { error: leadError } = await supabaseAdmin.from("leads").insert({
    account_id: accountId,
    client_phone: clientPhone,
    status,
    type_code: parsedData.type_code,
    delay_code: parsedData.delay_code,
    full_name: parsedData.full_name,
    contact_name: parsedData.full_name,
    address: parsedData.address,
    description: parsedData.description,
    is_dangerous: parsedData.is_dangerous,
    estimated_scope: parsedData.estimated_scope,
    callback_delay: parsedData.callback_delay,
    priority_score: scored.priority_score,
    value_estimate: scored.value_estimate,
    raw_message: allTranscripts.join(" | "),
  });

  if (leadError) {
    console.error("[voice.service] Erreur création lead (confirmation):", leadError.message);
  } else {
    console.log(
      "[voice.service] Lead confirmé — artisan: %s, status: %s, score: %d, danger: %s",
      artisan.name,
      status,
      scored.priority_score,
      parsedData.is_dangerous
    );
  }

  // Mettre à jour l'appel avec le statut final
  const { error: updateError } = await supabaseAdmin
    .from("calls")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
      voice_transcripts: allTranscripts,
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

/** Crée le lead Supabase et met à jour le statut de l'appel (fallback sans confirmation) */
async function finalizeLead(
  accountId: string,
  callSid: string,
  allTranscripts: string[],
  analysis: VoiceAIAnalysis,
  artisan: ArtisanContext
): Promise<void> {
  if (!supabaseAdmin) return;

  const { parsedData } = analysis;
  const status = determineLeadStatus(parsedData);
  const scored = computeScore(
    parsedData.type_code,
    parsedData.delay_code,
    parsedData.is_dangerous,
    parsedData.estimated_scope
  );

  const { data: callRow } = await supabaseAdmin
    .from("calls")
    .select("from_number")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  const clientPhone = (callRow?.from_number as string) || null;

  const { error: leadError } = await supabaseAdmin.from("leads").insert({
    account_id: accountId,
    client_phone: clientPhone,
    status,
    type_code: parsedData.type_code,
    delay_code: parsedData.delay_code,
    full_name: parsedData.full_name,
    contact_name: parsedData.full_name,
    address: parsedData.address,
    description: parsedData.description,
    is_dangerous: parsedData.is_dangerous,
    estimated_scope: parsedData.estimated_scope,
    callback_delay: parsedData.callback_delay,
    priority_score: scored.priority_score,
    value_estimate: scored.value_estimate,
    raw_message: allTranscripts.join(" | "),
  });

  if (leadError) {
    console.error("[voice.service] Erreur création lead (fallback):", leadError.message);
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
      voice_transcripts: allTranscripts,
    })
    .eq("twilio_call_sid", callSid);

  if (updateError) {
    console.warn("[voice.service] Erreur update call (fallback):", updateError.message);
  }
}
