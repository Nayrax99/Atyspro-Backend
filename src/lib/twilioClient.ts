/**
 * Client Twilio - envoi SMS + validation signature webhook
 */

import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Singleton : client créé une seule fois
const client =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SendSMSResult {
  sid: string | null;
  success: boolean;
  error?: string;
}

/**
 * Envoie un SMS via Twilio.
 * Retourne { sid, success: true } ou { sid: null, success: false, error }.
 */
export async function sendSMS(
  to: string,
  from: string,
  body: string
): Promise<SendSMSResult> {
  if (!client) {
    console.error("Twilio client non initialisé (TWILIO_ACCOUNT_SID/AUTH_TOKEN manquants)");
    return { sid: null, success: false, error: "Client Twilio non configuré" };
  }

  try {
    const message = await client.messages.create({ to, from, body });
    return { sid: message.sid, success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Erreur envoi SMS Twilio:", err);
    return { sid: null, success: false, error: message };
  }
}

/**
 * Valide la signature Twilio d'une requête webhook.
 * Utilise twilio.validateRequest(authToken, signature, url, params).
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  if (!authToken) {
    console.error("TWILIO_AUTH_TOKEN manquant pour la validation de signature");
    return false;
  }
  return twilio.validateRequest(authToken, signature, url, params);
}
