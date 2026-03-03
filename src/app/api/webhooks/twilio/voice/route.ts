import { NextRequest, NextResponse } from "next/server";
import { handleVoiceWebhook } from "@/modules/twilio";
import { ApiError } from "@/lib/utils";
import { validateTwilioSignature } from "@/lib/twilioClient";

/**
 * POST /api/webhooks/twilio/voice - Twilio Voice webhook
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
        return NextResponse.json(
          { ok: false, error: "Signature Twilio invalide" },
          { status: 403 }
        );
      }
    }

    const CallSid = formData.get("CallSid")?.toString() || "";
    const CallStatus = formData.get("CallStatus")?.toString() || "";
    const From = formData.get("From")?.toString() || "";
    const To = formData.get("To")?.toString() || "";
    const Direction = formData.get("Direction")?.toString() || "inbound";
    const Timestamp = formData.get("Timestamp")?.toString() || null;

    if (!CallSid || !CallStatus || !From || !To) {
      return NextResponse.json(
        { ok: false, error: "Champs Twilio manquants" },
        { status: 400 }
      );
    }

    const result = await handleVoiceWebhook({
      CallSid,
      CallStatus,
      From,
      To,
      Direction,
      Timestamp,
    });

    if (result.type === "xml") {
      return new NextResponse(result.content, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    return NextResponse.json(result.body);
  } catch (error) {
    console.error("Erreur webhook Twilio Voice:", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
