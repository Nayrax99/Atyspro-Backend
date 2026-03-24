/**
 * Twilio domain service - business logic for webhooks
 *
 * Fix #5  : is_dangerous et estimated_scope détectés depuis le texte libre et passés à computeScore.
 * Fix #7  : upsert avec ignoreDuplicates pour prévenir les doublons sur webhooks simultanés.
 * Fix #8  : upsert lead AVANT l'envoi du SMS de relance (ordre inversé pour cohérence).
 * Fix #13 : statut lead calculé via determineLeadStatus() partagé avec le pipeline vocal.
 * Fix #14 : fallback scoring : is_dangerous détecté depuis description/raw_message
 *           quand type_code et delay_code sont tous les deux null.
 */

import { supabaseAdmin } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";
import { parseSms, assessDangerLevelFromText, estimateScopeFromText } from "@/lib/leadParsing";
import { computeScore, computeParsingConfidence } from "@/lib/leadScoring";
import { getScoringConfig } from "@/lib/scoringConfig";
import { determineLeadStatus } from "@/lib/leadStatus";
import { sendSMS } from "@/lib/twilioClient";
import { QUALIFICATION_SMS, RELANCE_CORRECTION_SMS } from "@/lib/smsTemplates";
import type { TwilioSmsWebhookParams, TwilioVoiceWebhookParams, TwilioVoiceResult } from "./twilio.types";
import { sendPushNotification } from "@/modules/notifications/notifications.service";

function isReponseExploitable(parsed: {
  type_code: number | null;
  delay_code: number | null;
  has_separator: boolean;
}): boolean {
  return (
    parsed.type_code != null ||
    parsed.delay_code != null ||
    parsed.has_separator
  );
}

const VOICE_MESSAGE =
  "Bonjour, je suis actuellement en intervention et je ne peux pas répondre. Vous allez recevoir un SMS pour qualifier votre demande et être rappelé au plus vite. Merci.";

function buildVoiceTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="fr-FR">${VOICE_MESSAGE}</Say>
    <Hangup/>
</Response>`;
}

/**
 * Normalise un numéro pour envoi Twilio (E.164).
 * 06/07 → +336/+337, 33... → +33..., 00... → +..., supprime espaces/tirets/points.
 */
function toE164ForSending(phone: string): string {
  const trimmed = phone?.trim() || "";
  if (!trimmed) return trimmed;
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  if (!digits.length) return trimmed;

  if (digits.startsWith("33") && digits.length === 11) {
    return `+${digits}`;
  }
  if ((digits.startsWith("06") || digits.startsWith("07")) && digits.length === 10) {
    return `+33${digits.slice(1)}`;
  }
  if ((digits.startsWith("6") || digits.startsWith("7")) && digits.length === 9) {
    return `+33${digits}`;
  }
  if (trimmed.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

async function sendQualificationSMS(
  clientPhone: string,
  ourNumber: string,
  accountId: string
): Promise<void> {
  const toE164 = toE164ForSending(clientPhone);
  console.log("[SMS webhook] Envoi qualification SMS, normalisé E.164: %s (original: %s)", toE164, clientPhone);
  const body = QUALIFICATION_SMS;
  const result = await sendSMS(toE164, ourNumber, body);

    try {
      await supabaseAdmin!.from("sms_messages").insert({
        account_id: accountId,
        from_number: ourNumber,
        to_number: toE164,
      direction: "outbound",
      body,
      twilio_message_sid: result.sid,
    });
  } catch (err) {
    console.warn("Impossible d'enregistrer SMS outbound (sms_messages):", err);
  }
}

/** Normalise E.164 pour lookup (Twilio envoie +33…, la DB peut avoir 33… ou +33…) */
function normalizeE164(value: string): string[] {
  const trimmed = value?.trim() || "";
  if (!trimmed) return [];
  const withPlus = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
  const withoutPlus = withPlus.replace(/^\+/, "");
  return [...new Set([trimmed, withPlus, withoutPlus])];
}

/** Handle incoming Twilio SMS webhook */
export async function handleSmsWebhook(
  params: TwilioSmsWebhookParams
): Promise<Record<string, unknown>> {
  const { From, To, Body, MessageSid } = params;

  console.log("[SMS webhook] handleSmsWebhook:", { From, To, Body: Body?.slice(0, 80) });

  if (!supabaseAdmin) {
    console.error("[SMS webhook] supabaseAdmin non configuré (SUPABASE_SERVICE_ROLE_KEY)");
    throw new ApiError("Service non configuré", 500);
  }

  const e164Candidates = normalizeE164(To);
  let phoneNumber: { id: string; account_id: string } | null = null;
  let phoneError: unknown = null;

  for (const e164 of e164Candidates) {
    const result = await supabaseAdmin
      .from("phone_numbers")
      .select("id, account_id")
      .eq("e164", e164)
      .maybeSingle();
    if (result.data) {
      phoneNumber = result.data;
      break;
    }
    phoneError = result.error;
  }

  if (!phoneNumber) {
    console.error("[SMS webhook] Numéro professionnel non trouvé, To=%s, essayé: %s", To, e164Candidates.join(", "));
    throw new ApiError("Numéro professionnel non trouvé", 400);
  }

  const { account_id } = phoneNumber;

  try {
    await supabaseAdmin.from("sms_messages").insert({
      account_id,
      from_number: From,
      to_number: To,
      direction: "inbound",
      body: Body,
      twilio_message_sid: MessageSid,
    });
  } catch (smsError) {
    console.warn("[SMS webhook] Impossible d'enregistrer SMS inbound (sms_messages):", smsError);
  }

  const parsed = parseSms(Body);
  console.log("[SMS webhook] SMS parsé:", parsed);

  const exploitable = isReponseExploitable(parsed);

  // Paralléliser les lectures account + existingLead (indépendantes)
  const [accountData, existingLeadResult] = await Promise.all([
    supabaseAdmin
      .from("accounts")
      .select("specialty, score_threshold")
      .eq("id", account_id)
      .maybeSingle(),
    supabaseAdmin
      .from("leads")
      .select("id, relance_count")
      .eq("account_id", account_id)
      .eq("client_phone", From)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const existingLead = existingLeadResult.data ?? null;
  const score_threshold = (accountData.data?.score_threshold as number | null) ?? 0;

  // Fix #5 et #14 : scoring V2 data-driven — danger_level et scope extraits du texte.
  const textForDanger = [parsed.description, parsed.raw_message].filter(Boolean).join(" ");
  const danger_level = assessDangerLevelFromText(textForDanger, parsed.type_code, parsed.delay_code);
  const scope = estimateScopeFromText(parsed.description || "") ?? "small" as const;

  const config = await getScoringConfig((accountData.data?.specialty as string) || "electricien");
  const parsing_confidence = computeParsingConfidence({
    type_code: parsed.type_code,
    danger_level,
    full_name: parsed.full_name,
    address: parsed.address,
    description: parsed.description,
  });
  const scored = computeScore(
    {
      type_code: parsed.type_code,
      danger_level,
      scope,
      address: parsed.address,
      full_name: parsed.full_name,
      availability_notes: null,
      relance_count: existingLead?.relance_count ?? 0,
    },
    config
  );

  // Fix #13 : statut via le helper unifié (cohérent avec pipeline vocal)
  const lead_status = determineLeadStatus(
    parsed.type_code,
    parsed.delay_code,
    parsed.address,
    parsed.full_name
  );

  const leadData: Record<string, unknown> = {
    account_id,
    client_phone: From,
    type_code: parsed.type_code,
    delay_code: parsed.delay_code,
    address: parsed.address,
    full_name: parsed.full_name,
    description: parsed.description,
    raw_message: parsed.raw_message,
    danger_level,
    scope,
    availability_notes: null,
    parsing_confidence,
    status: lead_status,
    priority_score: scored.priority_score,
    value_estimate: scored.value_estimate,
    last_inbound_sms_at: new Date().toISOString(),
  };

  if (exploitable) {
    if (existingLead) {
      const { error: updateError } = await supabaseAdmin
        .from("leads")
        .update(leadData)
        .eq("id", existingLead.id);
      if (updateError) throw new Error(`Erreur update lead: ${updateError.message}`);
      console.log("[SMS webhook] Lead mis à jour (réponse exploitable):", existingLead.id);
    } else {
      // Fix #7 : upsert avec ignoreDuplicates pour éviter les doublons sur webhooks simultanés.
      // La contrainte unique (account_id, client_phone) est définie dans la migration 005.
      const { error: insertError } = await supabaseAdmin
        .from("leads")
        .upsert({ ...leadData, relance_count: 0 }, { onConflict: "account_id,client_phone", ignoreDuplicates: true });
      if (insertError) throw new Error(`Erreur création lead: ${insertError.message}`);
      console.log("[SMS webhook] Nouveau lead créé (réponse exploitable):", From);
    }
    // Notification push si le score dépasse le seuil du compte
    if (scored.priority_score >= score_threshold) {
      const leadName = parsed.full_name || "Inconnu";
      void sendPushNotification(account_id, {
        title: "Nouvelle demande qualifiée",
        body:  `${leadName} — score ${scored.priority_score}`,
        url:   "/dashboard",
      });
    }

    return { ok: true, parsed, scored, relance: false };
  }

  // Chemin non exploitable — gestion des relances correction
  const currentRelanceCount = existingLead?.relance_count ?? 0;

  if (currentRelanceCount < 2) {
    const newRelanceCount = currentRelanceCount + 1;
    leadData.relance_count = newRelanceCount;
    leadData.status = newRelanceCount >= 2 ? "a_traiter" : lead_status;

    console.log("Relance correction, relance_count:", newRelanceCount);

    // Fix #8 : upsert lead AVANT l'envoi du SMS de relance.
    // Garantit la cohérence du relance_count même si l'envoi SMS échoue.
    if (existingLead) {
      const { error: updateError } = await supabaseAdmin
        .from("leads")
        .update(leadData)
        .eq("id", existingLead.id);
      if (updateError) throw new Error(`Erreur update lead (relance): ${updateError.message}`);
      console.log("[SMS webhook] Lead mis à jour avant relance correction:", existingLead.id);
    } else {
      // Fix #7 : upsert pour éviter les doublons sur webhooks simultanés
      const { error: insertError } = await supabaseAdmin
        .from("leads")
        .upsert(leadData, { onConflict: "account_id,client_phone", ignoreDuplicates: true });
      if (insertError) throw new Error(`Erreur création lead (relance): ${insertError.message}`);
      console.log("[SMS webhook] Nouveau lead créé (réponse inexploitable, relance à envoyer):", From);
    }

    // Fix #8 : envoi SMS après upsert DB (ordre précédemment inversé)
    const toE164 = toE164ForSending(From);
    console.log("[SMS webhook] Envoi relance correction, normalisé E.164: %s (original: %s)", toE164, From);
    const result = await sendSMS(toE164, To, RELANCE_CORRECTION_SMS);
    try {
      await supabaseAdmin!.from("sms_messages").insert({
        account_id,
        from_number: To,
        to_number: toE164,
        direction: "outbound",
        body: RELANCE_CORRECTION_SMS,
        twilio_message_sid: result.sid,
      });
    } catch (err) {
      console.warn("Impossible d'enregistrer SMS outbound (relance correction):", err);
    }

    return {
      ok: true,
      parsed,
      scored,
      relance: "correction",
      relance_count: newRelanceCount,
    };
  }

  // Quota de relances atteint — lead en a_traiter, plus de SMS
  leadData.status = "a_traiter";

  if (existingLead) {
    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update(leadData)
      .eq("id", existingLead.id);
    if (updateError) throw new Error(`Erreur update lead: ${updateError.message}`);
    console.log("[SMS webhook] Lead mis à jour (a_traiter, plus de relance):", existingLead.id);
  } else {
    const { error: insertError } = await supabaseAdmin
      .from("leads")
      .upsert({ ...leadData, relance_count: 2 }, { onConflict: "account_id,client_phone", ignoreDuplicates: true });
    if (insertError) throw new Error(`Erreur création lead: ${insertError.message}`);
    console.log("[SMS webhook] Nouveau lead créé (inexploitable, quota relances atteint):", From);
  }

  return {
    ok: true,
    parsed,
    scored,
    relance: false,
    reason: "max_relances",
  };
}

/** Handle incoming Twilio Voice webhook */
export async function handleVoiceWebhook(
  params: TwilioVoiceWebhookParams
): Promise<TwilioVoiceResult> {
  const { CallSid, CallStatus, From, To, Direction, Timestamp } = params;

  console.log("Twilio Voice Webhook:", { CallSid, CallStatus, From, To, Direction });

  const { data: phoneNumber, error: phoneError } = await supabaseAdmin!
    .from("phone_numbers")
    .select("id, account_id, e164")
    .eq("e164", To)
    .single();

  if (phoneError || !phoneNumber) {
    console.error("Numéro professionnel non trouvé:", To);
    throw new ApiError("Numéro professionnel non trouvé", 400);
  }

  const { account_id, id: phone_number_id } = phoneNumber;

  const endedStatuses = ["completed", "busy", "failed", "no-answer", "canceled"];
  const inProgressStatuses = ["in-progress", "ringing"];
  const missedStatuses = ["no-answer", "busy", "failed", "canceled"];

  const { data: existingCall } = await supabaseAdmin!
    .from("calls")
    .select("id, status, started_at, ended_at")
    .eq("twilio_call_sid", CallSid)
    .single();

  const callData: Record<string, unknown> = {
    account_id,
    phone_number_id,
    direction: Direction,
    from_number: From,
    to_number: To,
    status: CallStatus,
    twilio_call_sid: CallSid,
  };

  if (inProgressStatuses.includes(CallStatus) && (!existingCall || !existingCall.started_at)) {
    callData.started_at = Timestamp || new Date().toISOString();
  }
  if (endedStatuses.includes(CallStatus)) {
    callData.ended_at = Timestamp || new Date().toISOString();
  }

  if (existingCall) {
    await supabaseAdmin!.from("calls").update(callData).eq("twilio_call_sid", CallSid);
  } else {
    await supabaseAdmin!.from("calls").insert(callData);
  }

  const canPlayTwiML = !endedStatuses.includes(CallStatus);
  const isMissedCall = missedStatuses.includes(CallStatus);
  const isCompleted = CallStatus === "completed";

  if (canPlayTwiML || isMissedCall || isCompleted) {
    console.log(
      isMissedCall ? "Appel manqué (status callback), lead + SMS"
      : isCompleted ? "Appel terminé (completed), SMS qualification en fallback"
      : "Answer URL, lead + SMS qualification"
    );

    const { data: existingLead } = await supabaseAdmin!
      .from("leads")
      .select("id")
      .eq("account_id", account_id)
      .eq("client_phone", From)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingLead) {
      await supabaseAdmin!.from("leads").insert({
        account_id,
        client_phone: From,
        raw_message: null,
        status: "incomplet",
        relance_count: 0,
      });
      console.log("Lead minimal créé pour:", From);
    } else {
      console.log("Lead existant trouvé, pas de doublon");
    }

    // Éviter le double envoi si Twilio appelle answer URL puis status callback.
    const { data: recentSms } = await supabaseAdmin!
      .from("sms_messages")
      .select("id")
      .eq("account_id", account_id)
      .eq("to_number", From)
      .eq("direction", "outbound")
      .eq("body", QUALIFICATION_SMS)
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();

    if (!recentSms) {
      await sendQualificationSMS(From, To, account_id);
    }
    console.log("TODO: Relance 1 dans 10-15 min si aucune réponse");
    console.log("TODO: Relance 2 dans 3h si toujours aucune réponse");
  }

  if (canPlayTwiML) {
    return { type: "xml", content: buildVoiceTwiML() };
  }

  return { type: "json", body: { ok: true } };
}
