/**
 * Service agent vocal AtysPro — orchestration complète de la conversation vocale.
 * Toute la logique métier est ici ; les routes sont de simples délégués.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { analyzeVoiceTranscripts } from "@/lib/voiceAI";
import { computeScore } from "@/lib/leadScoring";
import {
  buildWelcomeTwiml,
  buildFollowUpTwiml,
  buildGoodbyeTwiml,
  buildErrorTwiml,
} from "@/lib/voiceTemplates";
import type { IncomingCallParams, GatherResultParams, ArtisanContext, VoiceAIAnalysis } from "./voice.types";

const MAX_TURNS = 3;

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/** Résout l'account_id depuis le numéro Twilio appelé (e164) */
async function resolveAccountFromPhone(
  phoneE164: string
): Promise<{ accountId: string; phoneNumberId: string } | null> {
  if (!supabaseAdmin) return null;

  // Twilio envoie +33…, la DB peut stocker +33… ou 33…
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
  const { type_code, delay_code, address } = parsedData;
  if (type_code && delay_code && address) return "complete";
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

  // Résoudre le compte depuis le numéro appelé
  const resolved = await resolveAccountFromPhone(to);
  if (!resolved) {
    console.error("[voice.service] Numéro professionnel non trouvé:", to);
    return buildErrorTwiml();
  }

  const { accountId, phoneNumberId } = resolved;

  // Charger le contexte artisan
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
    { onConflict: "twilio_call_sid", ignoreDuplicates: false }
  );

  if (callError) {
    console.warn("[voice.service] Erreur upsert call (non bloquant):", callError.message);
  }

  console.log("[voice.service] Appel entrant — artisan:", artisan.name, "call_sid:", callSid);

  return buildWelcomeTwiml(artisan.name, accountId, callSid);
}

/**
 * Gère un résultat de Gather (transcript STT reçu de Twilio).
 * Retourne le TwiML de la prochaine étape (question de suivi ou fin + création lead).
 */
export async function handleGatherResult(
  params: GatherResultParams
): Promise<string> {
  const { speechResult, turn, accountId, callSid, prevTranscripts } = params;

  if (!supabaseAdmin) {
    console.error("[voice.service] supabaseAdmin non configuré");
    return buildErrorTwiml();
  }

  // Accumuler le transcript du tour courant
  const allTranscripts = [...prevTranscripts, speechResult];

  console.log(
    "[voice.service] Gather tour %d, call_sid: %s, transcripts: %d",
    turn,
    callSid,
    allTranscripts.length
  );

  // Charger le contexte artisan
  const artisan = await loadArtisanContext(accountId);
  if (!artisan) {
    console.error("[voice.service] Compte artisan non trouvé pour gather:", accountId);
    return buildErrorTwiml();
  }

  // Analyser les transcripts avec le LLM
  const analysis = await analyzeVoiceTranscripts(
    allTranscripts,
    turn,
    MAX_TURNS,
    artisan
  );

  console.log("[voice.service] Analyse LLM tour %d:", turn, {
    needsFollowUp: analysis.needsFollowUp,
    confidence: analysis.confidence,
    parsedData: analysis.parsedData,
  });

  // Si un suivi est nécessaire et qu'il reste des tours disponibles
  if (analysis.needsFollowUp && turn < MAX_TURNS && analysis.followUpQuestion) {
    return buildFollowUpTwiml(
      analysis.followUpQuestion,
      turn + 1,
      accountId,
      callSid,
      allTranscripts
    );
  }

  // Parsing final — créer le lead
  await finalizeLead(accountId, callSid, allTranscripts, analysis, artisan);

  return buildGoodbyeTwiml(artisan.name);
}

// ---------------------------------------------------------------------------
// Finalisation (création lead + mise à jour call)
// ---------------------------------------------------------------------------

/** Crée le lead Supabase et met à jour le statut de l'appel */
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
  const scored = computeScore(parsedData.type_code, parsedData.delay_code);

  // Récupérer le from_number depuis l'appel en base
  const { data: callRow } = await supabaseAdmin
    .from("calls")
    .select("from_number")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  const clientPhone = (callRow?.from_number as string) || null;

  // Créer le lead
  const { error: leadError } = await supabaseAdmin.from("leads").insert({
    account_id: accountId,
    client_phone: clientPhone,
    status,
    type_code: parsedData.type_code,
    delay_code: parsedData.delay_code,
    full_name: parsedData.full_name,
    address: parsedData.address,
    description: parsedData.description,
    priority_score: scored.priority_score,
    value_estimate: scored.value_estimate,
    raw_message: allTranscripts.join(" | "),
  });

  if (leadError) {
    console.error("[voice.service] Erreur création lead:", leadError.message);
  } else {
    console.log(
      "[voice.service] Lead créé — artisan: %s, status: %s, score: %d",
      artisan.name,
      status,
      scored.priority_score
    );
  }

  // Mettre à jour l'appel
  const { error: updateError } = await supabaseAdmin
    .from("calls")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
      voice_transcripts: allTranscripts,
    })
    .eq("twilio_call_sid", callSid);

  if (updateError) {
    console.warn("[voice.service] Erreur update call:", updateError.message);
  }
}
