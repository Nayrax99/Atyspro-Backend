import { NextRequest } from "next/server";
import { handleConfirmation } from "@/modules/voice/voice.service";
import { validateTwilioSignature } from "@/lib/twilioClient";
import { buildErrorTwiml } from "@/lib/voiceTemplates";

/**
 * POST /api/webhooks/twilio/voice/confirm
 * Réception de la confirmation client après récapitulatif vocal.
 * En V1, toute réponse (ou absence de réponse via Redirect) est traitée comme une confirmation.
 *
 * Fix #3/#6 : prev_transcripts et parsed_data supprimés des query params.
 * Les données sont lues directement depuis la DB (calls.voice_transcripts, calls.voice_ai_result).
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const url = new URL(req.url);
    const accountId = url.searchParams.get("account_id") || "";
    const callSid = url.searchParams.get("call_sid") || "";

    if (!accountId || !callSid) {
      return new Response(buildErrorTwiml(), {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    // Validation de signature Twilio (sauf en dev)
    if (process.env.NODE_ENV !== "development") {
      const signature = req.headers.get("x-twilio-signature") ?? "";
      const baseUrl = process.env.TWILIO_WEBHOOK_BASE_URL;
      const webhookUrl = baseUrl
        ? `${baseUrl.replace(/\/$/, "")}/api/webhooks/twilio/voice/confirm${url.search}`
        : req.url;

      const params: Record<string, string> = {};
      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") params[key] = value;
      }

      if (!validateTwilioSignature(webhookUrl, params, signature)) {
        return new Response(buildErrorTwiml(), {
          status: 403,
          headers: { "Content-Type": "text/xml; charset=utf-8" },
        });
      }
    }

    // Réponse de confirmation du prospect (vide si timeout → Redirect)
    const speechResult = formData.get("SpeechResult")?.toString() || "";

    const twiml = await handleConfirmation({
      accountId,
      callSid,
      speechResult,
    });

    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("Erreur webhook Twilio Voice Confirm:", error);
    return new Response(buildErrorTwiml(), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }
}
