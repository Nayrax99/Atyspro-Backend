/**
 * Générateurs de TwiML XML pour l'agent vocal
 * Toutes les fonctions retournent du XML valide prêt à être envoyé à Twilio
 */

const VOICE = "Polly.Lea";
const LANGUAGE = "fr-FR";

/** Construit l'URL de base pour les webhooks Gather */
function getBaseUrl(): string {
  return (process.env.TWILIO_WEBHOOK_BASE_URL || "").replace(/\/$/, "");
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
  <Say voice="${VOICE}" language="${LANGUAGE}">Bonjour, vous êtes bien chez ${escapeXml(artisanName)}. Il est actuellement en intervention. Je suis son assistant, je peux prendre votre demande. Quel est votre besoin ?</Say>
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
 * Génère le TwiML de fin de conversation (remerciement + raccrochage)
 */
export function buildGoodbyeTwiml(artisanName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANGUAGE}">Merci pour votre appel. ${escapeXml(artisanName)} vous rappellera dès que possible. Bonne journée !</Say>
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
