import { NextRequest } from "next/server";
import { handleGatherResult } from "@/modules/voice/voice.service";
import { validateTwilioSignature } from "@/lib/twilioClient";
import { buildErrorTwiml } from "@/lib/voiceTemplates";

/**
 * POST /api/webhooks/twilio/voice/gather - Réception des résultats Gather (tours 1-3)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Extraire les paramètres de query
    const url = new URL(req.url);
    const turn = parseInt(url.searchParams.get("turn") || "1", 10);
    const accountId = url.searchParams.get("account_id") || "";
    const callSid = url.searchParams.get("call_sid") || "";
    const rawPrevTranscripts = url.searchParams.get("prev_transcripts") || "[]";

    // Validation des paramètres obligatoires
    if (!accountId || !callSid) {
      return new Response(buildErrorTwiml(), {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    // Validation de signature Twilio (sauf en dev)
    // IMPORTANT : Twilio signe l'URL complète incluant les query params
    if (process.env.NODE_ENV !== "development") {
      const signature = req.headers.get("x-twilio-signature") ?? "";
      const baseUrl = process.env.TWILIO_WEBHOOK_BASE_URL;
      // Reconstruire l'URL complète avec query string (turn, account_id, call_sid, prev_transcripts)
      const webhookUrl = baseUrl
        ? `${baseUrl.replace(/\/$/, "")}/api/webhooks/twilio/voice/gather${url.search}`
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

    // Extraire le transcript STT
    const speechResult = formData.get("SpeechResult")?.toString() || "";
    const confidence = parseFloat(formData.get("Confidence")?.toString() || "0");

    // Décoder les transcripts précédents
    // Note : url.searchParams.get() décode déjà les valeurs percent-encodées
    let prevTranscripts: string[] = [];
    try {
      prevTranscripts = JSON.parse(rawPrevTranscripts);
      if (!Array.isArray(prevTranscripts)) prevTranscripts = [];
    } catch {
      prevTranscripts = [];
    }

    const twiml = await handleGatherResult({
      speechResult,
      confidence,
      turn,
      accountId,
      callSid,
      prevTranscripts,
    });

    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("Erreur webhook Twilio Voice Gather:", error);
    return new Response(buildErrorTwiml(), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }
}
