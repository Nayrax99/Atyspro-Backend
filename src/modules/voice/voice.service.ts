/**
 * Service agent vocal AtysPro — orchestration complète de la conversation vocale.
 * Toute la logique métier est ici ; les routes sont de simples délégués.
 *
 * voice_transcripts (DB) : VoiceTranscriptEntry[] — échange complet IA + prospect
 * allTranscripts (mémoire) : string[] (user only) — utilisé par le LLM pour analyser
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

/** Détermine le statut du lead selon les données parsées */
function determineLeadStatus(
  parsedData: VoiceAIAnalysis["parsedData"]
): "complete" | "incomplete" | "needs_review" {
  const { type_code, delay_code, full_name } = parsedData;
  if (type_code && delay_code && full_name) return "complete";
  if (type_code || delay_code) return "incomplete";
  return "needs_review";
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

  // Texte brut du message d'accueil (sans SSML/XML) — stocké en premier dans voice_transcripts
  const welcomeText = `Bonjour, vous êtes bien chez ${artisan.name}, électricien. Il est actuellement en intervention. Je suis son assistant, et je prends votre demande pour qu'il vous rappelle rapidement. Pouvez-vous me décrire votre problème, et me dire si c'est urgent ?`;

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

  return buildWelcomeTwiml(artisan.name, accountId, callSid);
}

/**
 * Gère un résultat de Gather (transcript STT reçu de Twilio).
 * Met à jour voice_transcripts avec l'entrée user + la réponse IA.
 */
export async function handleGatherResult(
  params: GatherResultParams
): Promise<string> {
  const { speechResult, turn, accountId, callSid, prevTranscripts } = params;

  if (!supabaseAdmin) {
    console.error("[voice.service] supabaseAdmin non configuré");
    return buildErrorTwiml();
  }

  // Textes user uniquement — utilisés par le LLM pour analyser la conversation
  const allTranscripts: string[] = [
    ...prevTranscripts.filter((t): t is string => typeof t === "string"),
    speechResult,
  ];

  console.log(
    "[voice.service] Gather tour %d/%d — call_sid: %s — transcripts user: %d",
    turn,
    MAX_VOICE_TURNS,
    callSid,
    allTranscripts.length
  );

  // Fetch parallèle : artisan + entrées existantes de la conversation
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
    assistantText = `Merci beaucoup. ${artisan.name} vous rappelle ${delayTextPlain(analysis.parsedData.callback_delay)}. Bonne journée !`;
  }

  const now = new Date().toISOString();
  const updatedEntries: VoiceTranscriptEntry[] = [
    ...existingEntries,
    { role: "user", text: speechResult, turn, timestamp: now },
    { role: "assistant", text: assistantText, turn, timestamp: now },
  ];

  // Mise à jour progressive des entries en DB
  const { data: updateData, error: transcriptError } = await supabaseAdmin
    .from("calls")
    .update({ voice_transcripts: updatedEntries })
    .eq("twilio_call_sid", callSid)
    .select("twilio_call_sid, voice_transcripts");

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
  await finalizeLead(accountId, callSid, allTranscripts, updatedEntries, analysis, artisan);
  return buildGoodbyeTwiml(artisan.name, analysis.parsedData.callback_delay);
}

/**
 * Gère la confirmation client après le récapitulatif.
 * Ajoute l'entrée de confirmation user + le message de fin IA, puis crée le lead.
 */
export async function handleConfirmation(
  params: ConfirmationParams
): Promise<string> {
  const {
    accountId,
    callSid,
    allTranscripts: fallbackTranscripts,
    speechResult,
    parsedData,
  } = params;

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

  // Récupérer les numéros ET la conversation complète depuis la DB
  const { data: callRow } = await supabaseAdmin
    .from("calls")
    .select("from_number, to_number, voice_transcripts")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  const clientPhone = (callRow?.from_number as string) || null;
  const atysProPhone = (callRow?.to_number as string) || null;

  const existingEntries = parseTranscriptEntries(callRow?.voice_transcripts);

  // Ajouter la confirmation du prospect + le message de fin de l'IA
  const goodbyeText = `Merci beaucoup. ${artisan.name} vous rappelle ${delayTextPlain(parsedData.callback_delay)}. Bonne journée !`;
  const confirmTurn = existingEntries.filter((e) => e.role === "user").length + 1;
  const now = new Date().toISOString();

  const finalEntries: VoiceTranscriptEntry[] = [
    ...existingEntries,
    { role: "user", text: speechResult || "confirmé", turn: confirmTurn, timestamp: now },
    { role: "assistant", text: goodbyeText, turn: confirmTurn, timestamp: now },
  ];

  // raw_message = textes user uniquement (compatibilité parsing existant)
  const userTexts = existingEntries.filter((e) => e.role === "user").map((e) => e.text);
  const rawMessage =
    userTexts.length > 0 ? userTexts.join(" | ") : fallbackTranscripts.join(" | ");

  console.log(
    "[voice.service] Confirmation — entries DB: %d, user texts: %d, raw_message: %s",
    existingEntries.length,
    userTexts.length,
    rawMessage.slice(0, 60)
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
    raw_message: rawMessage,
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

  // Mettre à jour l'appel avec la conversation complète et le statut final
  const { error: updateError } = await supabaseAdmin
    .from("calls")
    .update({
      status: "completed",
      ended_at: new Date().toISOString(),
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
 * Reçoit les entries déjà mises à jour (incluant le message de fin IA).
 */
async function finalizeLead(
  accountId: string,
  callSid: string,
  allTranscripts: string[],
  updatedEntries: VoiceTranscriptEntry[],
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

  // raw_message = textes user uniquement
  const userTexts = updatedEntries.filter((e) => e.role === "user").map((e) => e.text);
  const rawMessage = userTexts.length > 0 ? userTexts.join(" | ") : allTranscripts.join(" | ");

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
    raw_message: rawMessage,
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
      voice_transcripts: updatedEntries,
    })
    .eq("twilio_call_sid", callSid);

  if (updateError) {
    console.warn("[voice.service] Erreur update call (fallback):", updateError.message);
  }
}
