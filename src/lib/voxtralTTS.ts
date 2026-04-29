/**
 * Service TTS Voxtral (Mistral) — remplace l'ancienne intégration cassée.
 * Endpoint : POST https://api.mistral.ai/v1/audio/speech
 * Réponse  : JSON { audio_data: base64 }
 * Modèle   : voxtral-mini-tts-2603
 */

export interface VoxtralSynthesisOptions {
  text: string;
  /** Identifiant de voix Voxtral, ex: "casual_female", "vivian" */
  voiceId: string;
  /** Format audio — défaut "mp3" pour compatibilité Twilio */
  format?: "mp3" | "pcm" | "wav";
}

export interface VoxtralSynthesisResult {
  audioBase64: string;
  format: string;
  /** Latence end-to-end mesurée en millisecondes */
  durationMs: number;
  characters: number;
}

interface VoxtralSpeechResponse {
  audio_data: string;
}

interface VoxtralVoiceEntry {
  id: string;
  name?: string;
  language?: string;
  gender?: string;
}

interface VoxtralVoicesResponse {
  data?: VoxtralVoiceEntry[];
  voices?: VoxtralVoiceEntry[];
}

const VOXTRAL_API_BASE = "https://api.mistral.ai/v1";
const VOXTRAL_MODEL = "voxtral-mini-tts-2603";
const TIMEOUT_MS = 5_000;

/** Fetch avec timeout 5s et retry x1 sur erreur réseau */
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === 1) throw err;
    }
  }
  // Unreachable — satisfait le compilateur TypeScript
  throw new Error("[Voxtral] fetchWithRetry: unreachable");
}

/**
 * Synthétise un texte en audio via Voxtral TTS.
 * Lève une erreur explicite si l'API échoue — pas de fallback silencieux.
 */
export async function synthesizeWithVoxtral(
  opts: VoxtralSynthesisOptions
): Promise<VoxtralSynthesisResult> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("[Voxtral] MISTRAL_API_KEY manquante");

  const format = opts.format ?? "mp3";
  const chars = opts.text.length;

  console.log(`[Voxtral] Synth start chars=${chars} voice=${opts.voiceId}`);

  const t0 = Date.now();
  const payload = {
    model: VOXTRAL_MODEL,
    input: opts.text,
    voice_id: opts.voiceId,
    response_format: format,
  };

  let res: Response;
  try {
    res = await fetchWithRetry(`${VOXTRAL_API_BASE}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Voxtral] CRITICAL status=network message=${msg}`);
    throw new Error(`[Voxtral] Erreur réseau : ${msg}`);
  }

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[Voxtral] CRITICAL status=${res.status} message=${errorBody}`);
    // Payload loggué sans la clé API
    throw new Error(
      `[Voxtral] API error ${res.status}: ${errorBody} (payload=${JSON.stringify(payload)})`
    );
  }

  const data = (await res.json()) as VoxtralSpeechResponse;
  const durationMs = Date.now() - t0;

  console.log(
    `[Voxtral] Synth done chars=${chars} ms=${durationMs} bytes=${data.audio_data.length}`
  );

  return { audioBase64: data.audio_data, format, durationMs, characters: chars };
}

/**
 * Liste les voix Voxtral disponibles via l'API Mistral.
 */
export async function listVoxtralVoices(): Promise<VoxtralVoiceEntry[]> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) throw new Error("[Voxtral] MISTRAL_API_KEY manquante");

  const res = await fetch(`${VOXTRAL_API_BASE}/audio/voices`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[Voxtral] CRITICAL status=${res.status} message=${errorBody}`);
    throw new Error(`[Voxtral] listVoxtralVoices error ${res.status}: ${errorBody}`);
  }

  const json = (await res.json()) as VoxtralVoicesResponse;
  return json.data ?? json.voices ?? [];
}
