import { NextRequest, NextResponse } from "next/server";
import { handleSmsWebhook } from "@/modules/twilio";
import { ApiError } from "@/lib/utils";
import { validateTwilioSignature } from "@/lib/twilioClient";

/**
 * POST /api/webhooks/twilio/sms - Twilio SMS webhook
 * Twilio envoie application/x-www-form-urlencoded ; on lit le body une seule fois.
 */
export async function POST(req: NextRequest) {
  try {
    console.log("[SMS webhook] POST received");
    const formData = await req.formData();

    // Une seule lecture du body : params pour signature + extraction des champs
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") params[key] = value;
    }

    const From = params["From"] ?? "";
    const To = params["To"] ?? "";
    const Body = params["Body"] ?? "";
    const MessageSid = params["MessageSid"] ?? null;

    console.log("[SMS webhook] From=%s To=%s Body=%s", From, To, Body?.slice(0, 80));

    // Validation de signature Twilio (sauf en dev)
    if (process.env.NODE_ENV !== "development") {
      const signature = req.headers.get("x-twilio-signature") ?? "";
      const baseUrl = process.env.TWILIO_WEBHOOK_BASE_URL;
      const url = baseUrl
        ? `${baseUrl.replace(/\/$/, "")}/api/webhooks/twilio/sms`
        : req.url;

      if (!validateTwilioSignature(url, params, signature)) {
        console.error("[SMS webhook] Signature Twilio invalide, url=%s", url);
        return NextResponse.json(
          { ok: false, error: "Signature Twilio invalide" },
          { status: 403 }
        );
      }
    }

    if (!From || !To || !Body) {
      return NextResponse.json(
        { ok: false, error: "Champs Twilio manquants" },
        { status: 400 }
      );
    }

    const body = await handleSmsWebhook({ From, To, Body, MessageSid });
    console.log("[SMS webhook] handleSmsWebhook success");
    return NextResponse.json(body);
  } catch (error) {
    console.error("Erreur webhook Twilio SMS:", error);

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
