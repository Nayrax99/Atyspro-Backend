/**
 * Générateurs de TwiML XML pour l'agent vocal
 * Toutes les fonctions retournent du XML valide prêt à être envoyé à Twilio
 *
 * Voix : Polly.Lea-Generative (Amazon Polly Generative AI, naturelle et expressive)
 * SSML : supporté nativement dans <Say> pour les voix Polly
 * speechTimeout="2" : Twilio détecte la fin de parole après 2s de silence (réduit la latence)
 */

const VOICE = "Polly.Lea-Generative";
const LANGUAGE = "fr-FR";

/** Construit l'URL de base pour les webhooks Gather */
function getBaseUrl(): string {
  return (process.env.TWILIO_WEBHOOK_BASE_URL || "").replace(/\/$/, "");
}

/**
 * Mappe callback_delay vers un texte naturel pour la voix.
 * Retourne du texte brut (les apostrophes sont sûres dans le contenu XML).
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
 * Génère le TwiML d'accueil avec SSML (pauses naturelles, débit légèrement ralenti).
 * Le <Say> est à l'intérieur du <Gather> pour permettre l'interruption dès que le prospect parle.
 * speechTimeout="2" réduit le blanc entre la réponse du prospect et la prochaine question.
 */
export function buildWelcomeTwiml(
  artisanName: string,
  accountId: string,
  callSid: string
): string {
  const gatherAction = `${getBaseUrl()}/api/webhooks/twilio/voice/gather?turn=1&account_id=${encodeURIComponent(accountId)}&call_sid=${encodeURIComponent(callSid)}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="2" timeout="10" action="${escapeXml(gatherAction)}">
    <Say voice="${VOICE}" language="${LANGUAGE}">
      <prosody rate="95%">
        Bonjour, vous êtes bien chez ${escapeXml(artisanName)}, électricien.
        <break time="400ms"/>
        Il est actuellement en intervention.
        <break time="300ms"/>
        Je suis son assistant, et je prends votre demande pour qu&apos;il vous rappelle rapidement.
        <break time="500ms"/>
        Pouvez-vous me décrire votre problème, et me dire si c&apos;est urgent ?
      </prosody>
    </Say>
  </Gather>
  <Say voice="${VOICE}" language="${LANGUAGE}">Je n&apos;ai pas entendu votre réponse. Au revoir.</Say>
</Response>`;
}

/**
 * Génère le TwiML d'une question de suivi avec Gather pour le tour suivant.
 * Pas de SSML complexe : les voix Generative adaptent déjà la prosodie au texte de Claude.
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
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="2" timeout="10" action="${escapeXml(gatherAction)}">
    <Say voice="${VOICE}" language="${LANGUAGE}">${escapeXml(question)}</Say>
  </Gather>
  <Say voice="${VOICE}" language="${LANGUAGE}">Je n&apos;ai pas entendu votre réponse. Je vais transmettre votre demande à l&apos;artisan.</Say>
</Response>`;
}

/**
 * Génère le TwiML de récapitulatif avec SSML (pauses entre les phrases pour clarté).
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
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="2" timeout="5" action="${escapeXml(confirmAction)}">
    <Say voice="${VOICE}" language="${LANGUAGE}">
      Parfait, je récapitule.
      <break time="400ms"/>
      Vous avez besoin de ${escapeXml(recap)}.
      <break time="300ms"/>
      ${escapeXml(artisanName)} vous rappelle ${escapeXml(delayText)}.
      <break time="300ms"/>
      Est-ce que c&apos;est correct ?
    </Say>
  </Gather>
  <Redirect method="POST">${escapeXml(confirmAction)}</Redirect>
</Response>`;
}

/**
 * Génère le TwiML de fin de conversation avec pause naturelle avant "Bonne journée".
 */
export function buildGoodbyeTwiml(artisanName: string, callbackDelay?: string): string {
  const delayText = callbackDelay ? callbackDelayText(callbackDelay) : "dès que possible";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANGUAGE}">
    Merci beaucoup. ${escapeXml(artisanName)} vous rappelle ${escapeXml(delayText)}.
    <break time="300ms"/>
    Bonne journée !
  </Say>
  <Hangup/>
</Response>`;
}

/**
 * Génère le TwiML d'erreur générique
 */
export function buildErrorTwiml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANGUAGE}">Une erreur est survenue. Veuillez rappeler directement l&apos;artisan. Au revoir.</Say>
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
