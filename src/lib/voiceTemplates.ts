/**
 * Générateurs de TwiML XML pour l'agent vocal.
 * Toutes les fonctions retournent du XML valide prêt à être envoyé à Twilio.
 * TTS : Cartesia Sonic-3 via cartesiaSpeak() — WAV mis en cache sur Supabase Storage.
 *
 * Fix #3/#6 : les transcripts et parsedData ne sont PLUS encodés dans les URLs.
 * Seuls account_id et call_sid sont passés en query params ; les données sont lues en DB.
 */

import { cartesiaSpeak } from "./cartesiaTTS";

const LANGUAGE = "fr-FR";

/** Construit l'URL de base pour les webhooks Gather */
function getBaseUrl(): string {
  return (process.env.TWILIO_WEBHOOK_BASE_URL || "").replace(/\/$/, "");
}

/**
 * Mappe callback_delay vers un texte naturel pour la voix.
 */
function callbackDelayText(callbackDelay: string): string {
  const map: Record<string, string> = {
    asap: "dès que possible, c'est noté en priorité",
    within_hour: "dans l'heure",
    today: "dans la journée",
    no_rush: "rapidement",
  };
  return map[callbackDelay] ?? "dès que possible";
}

/**
 * Génère le TwiML d'accueil.
 * Le message vocal est synthétisé par Cartesia Sonic-3 et mis en cache sur Supabase Storage.
 * speechTimeout="auto" + speechModel="phone_call" + enhanced="true" pour une détection optimale.
 */
export async function buildWelcomeTwiml(
  artisanName: string,
  accountId: string,
  callSid: string,
  greetingText?: string,
  _audioUrl?: string
): Promise<string> {
  const gatherAction = `${getBaseUrl()}/api/webhooks/twilio/voice/gather?turn=1&account_id=${encodeURIComponent(accountId)}&call_sid=${encodeURIComponent(callSid)}`;

  const welcomeText =
    greetingText ??
    `Bonjour, vous êtes bien chez ${artisanName}. Il est actuellement en intervention. Je suis son assistant, et je prends votre demande pour qu'il vous rappelle rapidement. Pouvez-vous me décrire votre problème, et me dire si c'est urgent ?`;

  const [mainUrl, fallbackUrl] = await Promise.all([
    cartesiaSpeak(welcomeText),
    cartesiaSpeak("Je n'ai pas entendu votre réponse. Au revoir."),
  ]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="auto" speechModel="phone_call" enhanced="true" actionOnEmptyResult="true" timeout="8" action="${escapeXml(gatherAction)}">
    <Play>${escapeXml(mainUrl)}</Play>
  </Gather>
  <Play>${escapeXml(fallbackUrl)}</Play>
</Response>`;
}

/**
 * Génère le TwiML d'une question de suivi avec Gather pour le tour suivant.
 * Fix #3 : plus de prev_transcripts dans l'URL — les transcripts sont lus depuis la DB.
 */
export async function buildFollowUpTwiml(
  question: string,
  nextTurn: number,
  accountId: string,
  callSid: string,
  _audioUrl?: string
): Promise<string> {
  const gatherAction = `${getBaseUrl()}/api/webhooks/twilio/voice/gather?turn=${nextTurn}&account_id=${encodeURIComponent(accountId)}&call_sid=${encodeURIComponent(callSid)}`;

  const [questionUrl, fallbackUrl] = await Promise.all([
    cartesiaSpeak(question),
    cartesiaSpeak("Je n'ai pas entendu votre réponse. Je vais transmettre votre demande à l'artisan."),
  ]);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="auto" speechModel="phone_call" enhanced="true" actionOnEmptyResult="true" timeout="8" action="${escapeXml(gatherAction)}">
    <Play>${escapeXml(questionUrl)}</Play>
  </Gather>
  <Play>${escapeXml(fallbackUrl)}</Play>
</Response>`;
}

/**
 * Génère le TwiML de récapitulatif.
 * Fix #3/#6 : plus de prev_transcripts ni parsedData dans l'URL — données lues depuis la DB.
 * En cas de timeout (pas de réponse), la route confirm considère la demande comme confirmée.
 */
export async function buildRecapTwiml(
  recap: string,
  artisanName: string,
  callbackDelay: string,
  accountId: string,
  callSid: string,
  _audioUrl?: string
): Promise<string> {
  const confirmAction = `${getBaseUrl()}/api/webhooks/twilio/voice/confirm?account_id=${encodeURIComponent(accountId)}&call_sid=${encodeURIComponent(callSid)}`;
  const delayText = callbackDelayText(callbackDelay);

  const recapText = `Parfait, je récapitule. Vous avez besoin de ${recap}. ${artisanName} vous rappelle ${delayText}. Est-ce que c'est correct ?`;

  const recapUrl = await cartesiaSpeak(recapText);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="2" timeout="5" action="${escapeXml(confirmAction)}">
    <Play>${escapeXml(recapUrl)}</Play>
  </Gather>
  <Redirect method="POST">${escapeXml(confirmAction)}</Redirect>
</Response>`;
}

/**
 * Génère le TwiML de fin de conversation.
 */
export async function buildGoodbyeTwiml(
  artisanName: string,
  callbackDelay?: string,
  _audioUrl?: string
): Promise<string> {
  const delayText = callbackDelay ? callbackDelayText(callbackDelay) : "dès que possible";
  const goodbyeText = `Merci beaucoup. ${artisanName} vous rappelle ${delayText}. Bonne journée !`;

  const goodbyeUrl = await cartesiaSpeak(goodbyeText);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${escapeXml(goodbyeUrl)}</Play>
  <Hangup/>
</Response>`;
}

/**
 * Génère le TwiML d'erreur générique.
 * Reste synchrone intentionnellement : utilisé comme filet de sécurité dans les webhooks,
 * y compris quand Cartesia ou Supabase sont indisponibles.
 */
export function buildErrorTwiml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Lea-Neural" language="${LANGUAGE}">Une erreur est survenue. Veuillez rappeler directement l&apos;artisan. Au revoir.</Say>
  <Hangup/>
</Response>`;
}

/** Échappe les caractères XML spéciaux pour sécuriser les valeurs dynamiques */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
