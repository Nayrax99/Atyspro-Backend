/**
 * Générateurs de TwiML XML pour l'agent vocal
 * Toutes les fonctions retournent du XML valide prêt à être envoyé à Twilio
 */

// Polly.Lea-Generative : voix Amazon Polly Generative AI, naturelle et expressive
// Disponible nativement dans Twilio <Say> sans configuration supplémentaire
const VOICE = "Polly.Lea-Generative";
const LANGUAGE = "fr-FR";

/** Construit l'URL de base pour les webhooks Gather */
function getBaseUrl(): string {
  return (process.env.TWILIO_WEBHOOK_BASE_URL || "").replace(/\/$/, "");
}

/** Mappe callback_delay vers un texte naturel pour la voix */
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
 * Génère le TwiML d'accueil avec question ouverte et Gather tour 1
 */
export function buildWelcomeTwiml(
  artisanName: string,
  accountId: string,
  callSid: string
): string {
  const gatherAction = `${getBaseUrl()}/api/webhooks/twilio/voice/gather?turn=1&account_id=${encodeURIComponent(accountId)}&call_sid=${encodeURIComponent(callSid)}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANGUAGE}">Bonjour, vous êtes bien chez ${escapeXml(artisanName)}, électricien. Il est actuellement en intervention. Je suis son assistant et je prends votre demande pour qu'il vous rappelle rapidement. Pouvez-vous me décrire votre problème et me dire si c'est urgent ?</Say>
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="auto" timeout="10" action="${escapeXml(gatherAction)}">
  </Gather>
  <Say voice="${VOICE}" language="${LANGUAGE}">Je n'ai pas entendu votre réponse. Au revoir.</Say>
</Response>`;
}

/**
 * Génère le TwiML d'une question de suivi avec Gather pour le tour suivant
 */
export function buildFollowUpTwiml(
  question: string,
  nextTurn: number,
  accountId: string,
  callSid: string,
  prevTranscripts: string[]
): string {
  const encodedTranscripts = encodeURIComponent(JSON.stringify(prevTranscripts));
  const gatherAction = `${getBaseUrl()}/api/webhooks/twilio/voice/gather?turn=${nextTurn}&account_id=${encodeURIComponent(accountId)}&call_sid=${encodeURIComponent(callSid)}&prev_transcripts=${encodedTranscripts}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANGUAGE}">${escapeXml(question)}</Say>
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="auto" timeout="10" action="${escapeXml(gatherAction)}">
  </Gather>
  <Say voice="${VOICE}" language="${LANGUAGE}">Je n'ai pas entendu votre réponse. Je vais transmettre votre demande à l'artisan.</Say>
</Response>`;
}

/**
 * Génère le TwiML de récapitulatif avec demande de confirmation client.
 * Le Gather écoute un "oui" ou "c'est bon" du client.
 * En cas de timeout (pas de réponse), la route confirm considère la demande comme confirmée.
 */
export function buildRecapTwiml(
  recap: string,
  artisanName: string,
  callbackDelay: string,
  accountId: string,
  callSid: string,
  prevTranscripts: string[],
  parsedData: Record<string, unknown>
): string {
  const encodedTranscripts = encodeURIComponent(JSON.stringify(prevTranscripts));
  const encodedParsedData = encodeURIComponent(JSON.stringify(parsedData));
  const confirmAction = `${getBaseUrl()}/api/webhooks/twilio/voice/confirm?account_id=${encodeURIComponent(accountId)}&call_sid=${encodeURIComponent(callSid)}&prev_transcripts=${encodedTranscripts}&parsed_data=${encodedParsedData}`;
  const delayText = callbackDelayText(callbackDelay);

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="3" timeout="5" action="${escapeXml(confirmAction)}">
    <Say voice="${VOICE}" language="${LANGUAGE}">Parfait, je récapitule : vous avez besoin de ${escapeXml(recap)}. ${escapeXml(artisanName)} vous rappelle ${escapeXml(delayText)}. Est-ce que c'est correct ?</Say>
  </Gather>
  <Redirect method="POST">${escapeXml(confirmAction)}</Redirect>
</Response>`;
}

/**
 * Génère le TwiML de fin de conversation (remerciement + raccrochage)
 */
export function buildGoodbyeTwiml(artisanName: string, callbackDelay?: string): string {
  const delayText = callbackDelay ? callbackDelayText(callbackDelay) : "dès que possible";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANGUAGE}">Merci pour votre appel. ${escapeXml(artisanName)} vous rappelle ${escapeXml(delayText)}. Bonne journée !</Say>
  <Hangup/>
</Response>`;
}

/**
 * Génère le TwiML d'erreur générique
 */
export function buildErrorTwiml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANGUAGE}">Une erreur est survenue. Veuillez rappeler directement l'artisan. Au revoir.</Say>
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
