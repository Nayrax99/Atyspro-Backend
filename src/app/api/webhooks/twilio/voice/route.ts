import { NextRequest } from "next/server";
import { handleIncomingCall } from "@/modules/voice/voice.service";
import { validateTwilioSignature } from "@/lib/twilioClient";
import { buildErrorTwiml } from "@/lib/voiceTemplates";

/**
 * POST /api/webhooks/twilio/voice - Point d'entrée appel entrant (accueil + Gather tour 1)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Validation de signature Twilio (sauf en dev)
    if (process.env.NODE_ENV !== "development") {
      const signature = req.headers.get("x-twilio-signature") ?? "";
      const baseUrl = process.env.TWILIO_WEBHOOK_BASE_URL;
      const url = baseUrl
        ? `${baseUrl.replace(/\/$/, "")}/api/webhooks/twilio/voice`
        : req.url;

      const params: Record<string, string> = {};
      for (const [key, value] of formData.entries()) {
        if (typeof value === "string") params[key] = value;
      }

      if (!validateTwilioSignature(url, params, signature)) {
        return new Response(buildErrorTwiml(), {
          status: 403,
          headers: { "Content-Type": "text/xml; charset=utf-8" },
        });
      }
    }

    const callSid = formData.get("CallSid")?.toString() || "";
    const callStatus = formData.get("CallStatus")?.toString() || "ringing";
    const from = formData.get("From")?.toString() || "";
    const to = formData.get("To")?.toString() || "";

    if (!callSid || !from || !to) {
      return new Response(buildErrorTwiml(), {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    const twiml = await handleIncomingCall({ callSid, from, to, callStatus });

    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("Erreur webhook Twilio Voice:", error);
    return new Response(buildErrorTwiml(), {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }
}
