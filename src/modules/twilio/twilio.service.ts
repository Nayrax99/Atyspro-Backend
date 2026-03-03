/**
 * Twilio domain service - business logic for webhooks
 */

import { supabaseAdmin } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";
import { parseSms } from "@/lib/leadParsing";
import { computeScore } from "@/lib/leadScoring";
import { sendSMS } from "@/lib/twilioClient";
import { QUALIFICATION_SMS, RELANCE_CORRECTION_SMS } from "@/lib/smsTemplates";
import type { TwilioSmsWebhookParams, TwilioVoiceWebhookParams, TwilioVoiceResult } from "./twilio.types";

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

async function sendQualificationSMS(
  clientPhone: string,
  ourNumber: string,
  accountId: string
): Promise<void> {
  const body = QUALIFICATION_SMS;
  const result = await sendSMS(clientPhone, ourNumber, body);

  try {
    await supabaseAdmin!.from("sms_messages").insert({
      account_id: accountId,
      from_number: ourNumber,
      to_number: clientPhone,
      direction: "outbound",
      body,
      twilio_message_sid: result.sid,
    });
  } catch (err) {
    console.warn("Impossible d'enregistrer SMS outbound (sms_messages):", err);
  }
}

/** Handle incoming Twilio SMS webhook */
export async function handleSmsWebhook(
  params: TwilioSmsWebhookParams
): Promise<Record<string, unknown>> {
  const { From, To, Body, MessageSid } = params;

  console.log("Twilio SMS Webhook:", { From, To, Body });

  const { data: phoneNumber, error: phoneError } = await supabaseAdmin!
    .from("phone_numbers")
    .select("id, account_id")
    .eq("e164", To)
    .single();

  if (phoneError || !phoneNumber) {
    console.error("Numéro professionnel non trouvé:", To);
    throw new ApiError("Numéro professionnel non trouvé", 400);
  }

  const { account_id } = phoneNumber;

  try {
    await supabaseAdmin!.from("sms_messages").insert({
      account_id,
      from_number: From,
      to_number: To,
      direction: "inbound",
      body: Body,
      twilio_message_sid: MessageSid,
    });
  } catch (smsError) {
    console.warn("Impossible d'enregistrer SMS inbound (sms_messages):", smsError);
  }

  const parsed = parseSms(Body);
  console.log("SMS parsé:", parsed);

  const exploitable = isReponseExploitable(parsed);
  const scored = computeScore(parsed.type_code, parsed.delay_code);

  const { data: existingLead } = await supabaseAdmin!
    .from("leads")
    .select("id, relance_count")
    .eq("account_id", account_id)
    .eq("client_phone", From)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const leadData: Record<string, unknown> = {
    account_id,
    client_phone: From,
    type_code: parsed.type_code,
    delay_code: parsed.delay_code,
    address: parsed.address,
    full_name: parsed.full_name,
    description: parsed.description,
    raw_message: parsed.raw_message,
    status: parsed.lead_status,
    priority_score: scored.priority_score,
    value_estimate: scored.value_estimate,
    last_inbound_sms_at: new Date().toISOString(),
  };

  if (exploitable) {
    if (existingLead) {
      const { error: updateError } = await supabaseAdmin!
        .from("leads")
        .update(leadData)
        .eq("id", existingLead.id);
      if (updateError) throw new Error(`Erreur update lead: ${updateError.message}`);
      console.log("Lead mis à jour (réponse exploitable):", existingLead.id);
    } else {
      (leadData as Record<string, unknown>).relance_count = 0;
      const { error: insertError } = await supabaseAdmin!.from("leads").insert(leadData);
      if (insertError) throw new Error(`Erreur création lead: ${insertError.message}`);
      console.log("Nouveau lead créé (réponse exploitable):", From);
    }
    return { ok: true, parsed, scored, relance: false };
  }

  const currentRelanceCount = existingLead?.relance_count ?? 0;

  if (currentRelanceCount < 2) {
    const newRelanceCount = currentRelanceCount + 1;
    leadData.relance_count = newRelanceCount;
    leadData.status = newRelanceCount >= 2 ? "needs_review" : parsed.lead_status;

    console.log("Relance correction (immédiate), relance_count:", newRelanceCount);

    const result = await sendSMS(From, To, RELANCE_CORRECTION_SMS);
    try {
      await supabaseAdmin!.from("sms_messages").insert({
        account_id,
        from_number: To,
        to_number: From,
        direction: "outbound",
        body: RELANCE_CORRECTION_SMS,
        twilio_message_sid: result.sid,
      });
    } catch (err) {
      console.warn("Impossible d'enregistrer SMS outbound (relance correction):", err);
    }

    if (existingLead) {
      const { error: updateError } = await supabaseAdmin!
        .from("leads")
        .update(leadData)
        .eq("id", existingLead.id);
      if (updateError) throw new Error(`Erreur update lead: ${updateError.message}`);
      console.log("Lead mis à jour après relance correction:", existingLead.id);
    } else {
      const { error: insertError } = await supabaseAdmin!.from("leads").insert(leadData);
      if (insertError) throw new Error(`Erreur création lead: ${insertError.message}`);
      console.log("Nouveau lead créé (réponse inexploitable, relance envoyée):", From);
    }

    return {
      ok: true,
      parsed,
      scored,
      relance: "correction",
      relance_count: newRelanceCount,
    };
  }

  leadData.status = "needs_review";
  leadData.raw_message = parsed.raw_message;

  if (existingLead) {
    const { error: updateError } = await supabaseAdmin!
      .from("leads")
      .update(leadData)
      .eq("id", existingLead.id);
    if (updateError) throw new Error(`Erreur update lead: ${updateError.message}`);
    console.log("Lead mis à jour (needs_review, plus de relance):", existingLead.id);
  } else {
    (leadData as Record<string, unknown>).relance_count = 2;
    const { error: insertError } = await supabaseAdmin!.from("leads").insert(leadData);
    if (insertError) throw new Error(`Erreur création lead: ${insertError.message}`);
    console.log("Nouveau lead créé (inexploitable, quota relances atteint):", From);
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

  if (canPlayTwiML || isMissedCall) {
    console.log(
      isMissedCall ? "Appel manqué (status callback), lead + SMS" : "Answer URL, lead + SMS qualification"
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
        status: "incomplete",
        relance_count: 0,
      });
      console.log("Lead minimal créé pour:", From);
    } else {
      console.log("Lead existant trouvé, pas de doublon");
    }

    // Éviter le double envoi si Twilio appelle answer URL puis status callback
    const { data: recentSms } = await supabaseAdmin!
      .from("sms_messages")
      .select("id")
      .eq("account_id", account_id)
      .eq("to_number", From)
      .eq("direction", "outbound")
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
