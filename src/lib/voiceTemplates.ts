/**
 * Générateurs de TwiML XML pour l'agent vocal
 * Toutes les fonctions retournent du XML valide prêt à être envoyé à Twilio
 *
 * Voix : Polly.Lea-Generative (Amazon Polly Generative AI, naturelle et expressive)
 * SSML : supporté nativement dans <Say> pour les voix Polly
 * speechTimeout="2" : Twilio détecte la fin de parole après 2s de silence (réduit la latence)
 *
 * Fix #3/#6 : les transcripts et parsedData ne sont PLUS encodés dans les URLs.
 * Seuls account_id et call_sid sont passés en query params ; les données sont lues en DB.
 */

const LANGUAGE = "fr-FR";

/** Lit TTS_PROVIDER à chaque appel (runtime) — évite le gel à l'init du module. */
function getTTSProvider(): string {
  return process.env.TTS_PROVIDER ?? "polly";
}

/**
 * Retourne les attributs TTS selon TTS_PROVIDER.
 * polly   → Polly.Lea-Neural (ou TWILIO_TTS_VOICE)
 * mistral → fallback Polly si l'upload audio Mistral échoue
 * default → Polly.Lea-Neural
 */
function buildSayAttributes(): { voice?: string } {
  switch (getTTSProvider()) {
    case "polly":
    case "mistral":
      return { voice: process.env.TWILIO_TTS_VOICE ?? "Polly.Lea-Neural" };
    default:
      return { voice: "Polly.Lea-Neural" };
  }
}

/** Génère l'attribut voice pour les balises <Say> XML */
function voiceAttr(): string {
  const { voice } = buildSayAttributes();
  return voice ? `voice="${voice}"` : "";
}

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
  callSid: string,
  greetingText?: string,
  audioUrl?: string
): string {
  const gatherAction = `${getBaseUrl()}/api/webhooks/twilio/voice/gather?turn=1&account_id=${encodeURIComponent(accountId)}&call_sid=${encodeURIComponent(callSid)}`;

  // Si audioUrl fourni (Mistral TTS) → <Play>, sinon <Say> Polly avec SSML
  const gatherContent = audioUrl
    ? `<Play>${escapeXml(audioUrl)}</Play>`
    : (() => {
        const speechContent = greetingText
          ? `<prosody rate="95%">${escapeXml(greetingText)}</prosody>`
          : `<prosody rate="95%">
        Bonjour, vous êtes bien chez ${escapeXml(artisanName)}.
        <break time="400ms"/>
        Il est actuellement en intervention.
        <break time="300ms"/>
        Je suis son assistant, et je prends votre demande pour qu&apos;il vous rappelle rapidement.
        <break time="500ms"/>
        Pouvez-vous me décrire votre problème, et me dire si c&apos;est urgent ?
      </prosody>`;
        return `<Say ${voiceAttr()} language="${LANGUAGE}">
      ${speechContent}
    </Say>`;
      })();

  // Mod 2 : speechTimeout="auto" + speechModel + enhanced + actionOnEmptyResult
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="auto" speechModel="phone_call" enhanced="true" actionOnEmptyResult="true" timeout="8" action="${escapeXml(gatherAction)}">
    ${gatherContent}
  </Gather>
  <Say ${voiceAttr()} language="${LANGUAGE}">Je n&apos;ai pas entendu votre réponse. Au revoir.</Say>
</Response>`;
}

/**
 * Génère le TwiML d'une question de suivi avec Gather pour le tour suivant.
 * Fix #3 : plus de prev_transcripts dans l'URL — les transcripts sont lus depuis la DB.
 */
export function buildFollowUpTwiml(
  question: string,
  nextTurn: number,
  accountId: string,
  callSid: string,
  audioUrl?: string
): string {
  const gatherAction = `${getBaseUrl()}/api/webhooks/twilio/voice/gather?turn=${nextTurn}&account_id=${encodeURIComponent(accountId)}&call_sid=${encodeURIComponent(callSid)}`;

  // Si audioUrl fourni (Mistral TTS) → <Play>, sinon <Say> Polly
  const gatherContent = audioUrl
    ? `<Play>${escapeXml(audioUrl)}</Play>`
    : `<Say ${voiceAttr()} language="${LANGUAGE}">${escapeXml(question)}</Say>`;

  // Mod 2 : speechTimeout="auto" + speechModel + enhanced + actionOnEmptyResult
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="auto" speechModel="phone_call" enhanced="true" actionOnEmptyResult="true" timeout="8" action="${escapeXml(gatherAction)}">
    ${gatherContent}
  </Gather>
  <Say ${voiceAttr()} language="${LANGUAGE}">Je n&apos;ai pas entendu votre réponse. Je vais transmettre votre demande à l&apos;artisan.</Say>
</Response>`;
}

/**
 * Génère le TwiML de récapitulatif.
 * Fix #3/#6 : plus de prev_transcripts ni parsedData dans l'URL — données lues depuis la DB.
 * En cas de timeout (pas de réponse), la route confirm considère la demande comme confirmée.
 */
export function buildRecapTwiml(
  recap: string,
  artisanName: string,
  callbackDelay: string,
  accountId: string,
  callSid: string,
  audioUrl?: string
): string {
  const confirmAction = `${getBaseUrl()}/api/webhooks/twilio/voice/confirm?account_id=${encodeURIComponent(accountId)}&call_sid=${encodeURIComponent(callSid)}`;
  const delayText = callbackDelayText(callbackDelay);

  const gatherContent = audioUrl
    ? `<Play>${escapeXml(audioUrl)}</Play>`
    : `<Say ${voiceAttr()} language="${LANGUAGE}">
      Parfait, je récapitule.
      <break time="400ms"/>
      Vous avez besoin de ${escapeXml(recap)}.
      <break time="300ms"/>
      ${escapeXml(artisanName)} vous rappelle ${escapeXml(delayText)}.
      <break time="300ms"/>
      Est-ce que c&apos;est correct ?
    </Say>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="${LANGUAGE}" speechTimeout="2" timeout="5" action="${escapeXml(confirmAction)}">
    ${gatherContent}
  </Gather>
  <Redirect method="POST">${escapeXml(confirmAction)}</Redirect>
</Response>`;
}

/**
 * Génère le TwiML de fin de conversation avec pause naturelle avant "Bonne journée".
 */
export function buildGoodbyeTwiml(artisanName: string, callbackDelay?: string, audioUrl?: string): string {
  const delayText = callbackDelay ? callbackDelayText(callbackDelay) : "dès que possible";

  if (audioUrl) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${escapeXml(audioUrl)}</Play>
  <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say ${voiceAttr()} language="${LANGUAGE}">
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
  <Say ${voiceAttr()} language="${LANGUAGE}">Une erreur est survenue. Veuillez rappeler directement l&apos;artisan. Au revoir.</Say>
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
