import { NextRequest } from "next/server";
import { validateTwilioSignature } from "@/lib/twilioClient";
import { supabaseAdmin } from "@/lib/supabase";

// Edge runtime incompatible : twilio SDK utilise crypto Node.js natif (HMAC-SHA1)
export const dynamic = "force-dynamic";

const ERROR_TWIML = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say language="fr-FR">Une erreur est survenue, veuillez rappeler.</Say></Response>`;

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
        return new Response(ERROR_TWIML, {
          status: 403,
          headers: { "Content-Type": "text/xml; charset=utf-8" },
        });
      }
    }

    const to = formData.get("To")?.toString() ?? "";

    if (!to || !supabaseAdmin) {
      return new Response(ERROR_TWIML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    // Résolution account_id via phone_numbers
    const { data: phoneNumber, error: phoneError } = await supabaseAdmin
      .from("phone_numbers")
      .select("account_id")
      .eq("number", to)
      .single();

    if (phoneError || !phoneNumber) {
      return new Response(ERROR_TWIML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    const accountId = phoneNumber.account_id as string;

    // Récupération des paramètres du compte
    const { data: account, error: accountError } = await supabaseAdmin
      .from("accounts")
      .select("welcome_message, assistant_name, specialty")
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      return new Response(ERROR_TWIML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    const assistantName = (account.assistant_name as string | null) ?? "Maya";
    const welcomeGreeting =
      (account.welcome_message as string | null) ??
      "Bonjour, je suis Maya, comment puis-je vous aider ?";
    const specialty = (account.specialty as string | null) ?? "";

    const wsUrl = `wss://${process.env.RAILWAY_WS_URL}/ws?accountId=${accountId}&specialty=${encodeURIComponent(specialty)}&assistantName=${encodeURIComponent(assistantName)}`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="${wsUrl}" welcomeGreeting="${welcomeGreeting}" language="fr-FR" />
  </Connect>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("Erreur webhook Twilio Voice:", error);
    return new Response(ERROR_TWIML, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }
}
