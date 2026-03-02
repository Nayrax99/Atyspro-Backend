import { NextRequest, NextResponse } from "next/server";
import { handleSmsWebhook } from "@/modules/twilio";
import { ApiError } from "@/lib/utils";

/**
 * POST /api/webhooks/twilio/sms - Twilio SMS webhook
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const From = formData.get("From")?.toString() || "";
    const To = formData.get("To")?.toString() || "";
    const Body = formData.get("Body")?.toString() || "";
    const MessageSid = formData.get("MessageSid")?.toString() || null;

    if (!From || !To || !Body) {
      return NextResponse.json(
        { ok: false, error: "Champs Twilio manquants" },
        { status: 400 }
      );
    }

    const body = await handleSmsWebhook({ From, To, Body, MessageSid });

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
