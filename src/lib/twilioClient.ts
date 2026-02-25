/**
 * Client Twilio - envoi SMS
 * V1 : mode DEV = simulation (logs uniquement), pas d'envoi réel
 */

/**
 * Envoie un SMS (simulation en DEV : log en console uniquement).
 * TODO: activer Twilio en prod avec twilio(accountSid, authToken) et client.messages.create()
 */
export async function sendSMS(
  to: string,
  from: string,
  body: string
): Promise<{ sid: string; success: boolean }> {
  console.log("═══ SMS SIMULATION (DEV MODE) ═══");
  console.log("From:", from);
  console.log("To:", to);
  console.log("Body:", body);
  console.log("═══════════════════════════════════");

  // TODO: Activer Twilio plus tard
  // const client = twilio(accountSid, authToken);
  // const msg = await client.messages.create({ to, from, body });
  // return { sid: msg.sid, success: true };

  return { sid: `SIM${Date.now()}`, success: true };
}
