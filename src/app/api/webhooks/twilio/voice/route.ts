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

    const toNumber = formData.get("To")?.toString() ?? "";

    if (!toNumber || !supabaseAdmin) {
      return new Response(ERROR_TWIML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    console.log('[VOICE] To number:', formData.get('To'));
    console.log('[VOICE] querying phone_numbers for:', toNumber);

    // Résolution account_id via phone_numbers
    const { data: phoneData, error: phoneError, status } = await supabaseAdmin
      .from('phone_numbers')
      .select('account_id')
      .eq('e164', toNumber)
      .single();

    console.log('[VOICE] phone_numbers query result:', JSON.stringify({ data: phoneData, error: phoneError, status }));

    if (phoneError || !phoneData) {
      return new Response(ERROR_TWIML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    const accountId = phoneData.account_id as string;

    // Récupération des paramètres du compte
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('assistant_name, specialty, artisan_name')
      .eq('id', phoneData.account_id)
      .single();

    if (accountError || !account) {
      return new Response(ERROR_TWIML, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    const assistantName = (account.assistant_name as string | null) ?? "Maya";
    const specialty = (account.specialty as string | null) ?? "";
    const artisanName = (account.artisan_name as string | null) ?? "votre artisan";

    const wsUrl = `wss://${process.env.RAILWAY_WS_URL}/ws?accountId=${accountId}&specialty=${encodeURIComponent(specialty)}&artisanName=${encodeURIComponent(artisanName)}&assistantName=${encodeURIComponent(assistantName)}`;
    const wsUrlXml = wsUrl.replace(/&/g, '&amp;');

    console.log('[VOICE WEBHOOK] building ConversationRelay TwiML', { accountId, wsUrl: process.env.RAILWAY_WS_URL });

    // ConversationRelay attributes:
    // - url: WebSocket Railway pour le runtime voice (Maya)
    // - language: fr-FR pour STT Deepgram + TTS ElevenLabs
    // - ttsProvider: ElevenLabs (alternative: Google, Amazon)
    // - voice: voice ID ElevenLabs (custom or library)
    // - elevenlabsTextNormalization: "auto" pour normaliser nombres/dates/abréviations
    //   avant TTS (résout les bugs "11h55" prononcé "1 1 heure 5 5")
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay url="${wsUrlXml}" language="fr-FR" ttsProvider="ElevenLabs" voice="HuLbOdhRlvQQN8oPP0AJ" elevenlabsTextNormalization="auto" />
  </Connect>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error('[VOICE WEBHOOK ERROR]', error instanceof Error ? error.message : error);
    return new Response(ERROR_TWIML, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }
}
