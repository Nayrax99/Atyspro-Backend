import { supabase } from "@/lib/supabase";
import { sendSMS } from "@/lib/twilioClient";
import { QUALIFICATION_SMS } from "@/lib/smsTemplates";
import { NextRequest, NextResponse } from "next/server";

/** Message vocal exact (specs produit) - lu par Twilio */
const VOICE_MESSAGE =
  "Bonjour, je suis actuellement en intervention et je ne peux pas répondre. Vous allez recevoir un SMS pour qualifier votre demande et être rappelé au plus vite. Merci.";

/** TwiML à retourner pour faire jouer le message vocal (Content-Type: text/xml) */
function buildVoiceTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="fr-FR">${VOICE_MESSAGE}</Say>
    <Hangup/>
</Response>`;
}

/**
 * Envoie le SMS de qualification (log + enregistrement outbound).
 * Appelé après un appel manqué pour notifier le client.
 */
async function sendQualificationSMS(
  clientPhone: string,
  ourNumber: string,
  accountId: string
): Promise<void> {
  const body = QUALIFICATION_SMS;
  const result = await sendSMS(clientPhone, ourNumber, body);

  try {
    await supabase.from("sms_messages").insert({
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

/**
 * Webhook POST /api/webhooks/twilio/voice
 * Reçoit les événements d'appels Twilio (Answer URL ou Status callback).
 * - Appel manqué (no-answer, busy, failed, canceled) : création lead minimal, envoi SMS qualification, TwiML si demandé.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const CallSid = formData.get("CallSid")?.toString() || "";
    const CallStatus = formData.get("CallStatus")?.toString() || "";
    const From = formData.get("From")?.toString() || "";
    const To = formData.get("To")?.toString() || "";
    const Direction = formData.get("Direction")?.toString() || "inbound";
    const Timestamp = formData.get("Timestamp")?.toString() || null;

    console.log("Twilio Voice Webhook:", { CallSid, CallStatus, From, To, Direction });

    if (!CallSid || !CallStatus || !From || !To) {
      return NextResponse.json(
        { ok: false, error: "Champs Twilio manquants" },
        { status: 400 }
      );
    }

    const { data: phoneNumber, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("id, account_id, e164")
      .eq("e164", To)
      .single();

    if (phoneError || !phoneNumber) {
      console.error("Numéro professionnel non trouvé:", To);
      return NextResponse.json(
        { ok: false, error: "Numéro professionnel non trouvé" },
        { status: 400 }
      );
    }

    const { account_id, id: phone_number_id } = phoneNumber;

    // Mise à jour / création de l'appel dans la table calls
    const endedStatuses = ["completed", "busy", "failed", "no-answer", "canceled"];
    const inProgressStatuses = ["in-progress", "ringing"];
    const missedStatuses = ["no-answer", "busy", "failed", "canceled"];

    const { data: existingCall } = await supabase
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
      await supabase.from("calls").update(callData).eq("twilio_call_sid", CallSid);
    } else {
      await supabase.from("calls").insert(callData);
    }

    // Créer lead minimal + envoyer SMS qualification dans deux cas :
    // 1) Answer URL : call en cours (ringing, etc.) → on joue le message vocal et on envoie le SMS
    // 2) Status callback : appel terminé en manqué (no-answer, busy, failed, canceled)
    const canPlayTwiML = !endedStatuses.includes(CallStatus);
    const isMissedCall = missedStatuses.includes(CallStatus);

    if (canPlayTwiML || isMissedCall) {
      console.log(
        isMissedCall ? "Appel manqué (status callback), lead + SMS" : "Answer URL, lead + SMS qualification"
          );

      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("account_id", account_id)
        .eq("client_phone", From)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingLead) {
        await supabase.from("leads").insert({
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

      await sendQualificationSMS(From, To, account_id);
      // V1 : pas de job scheduler — relances temporisées non implémentées
      console.log("TODO: Relance 1 dans 10-15 min si aucune réponse");
      console.log("TODO: Relance 2 dans 3h si toujours aucune réponse");
    }

    if (canPlayTwiML) {
      return new NextResponse(buildVoiceTwiML(), {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur webhook Twilio Voice:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
