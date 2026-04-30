/**
 * Env vars requises (ajouter dans .env.local) :
 *   CARTESIA_API_KEY  — clé API Cartesia (https://play.cartesia.ai)
 *   CARTESIA_VOICE_ID — identifiant de voix Sonic-3 (ex : "a0e99841-438c-4a64-b679-ae501e7d6091")
 */

import { createHash } from "crypto";
import { supabaseAdmin } from "./supabase";

const CARTESIA_API_URL = "https://api.cartesia.ai/tts/bytes";
const CARTESIA_VERSION = "2024-06-10";
const BUCKET = "tts-cache";

/**
 * Synthétise un texte en audio WAV via l'API Cartesia Sonic-3 et met le résultat
 * en cache dans le bucket Supabase Storage "tts-cache" (clé = hash SHA-256 du texte).
 * Retourne l'URL publique du fichier audio, utilisable dans une balise TwiML <Play>.
 *
 * Le cache est implicite : un même texte produit toujours le même nom de fichier,
 * ce qui évite les appels Cartesia redondants entre invocations.
 *
 * @param text — Texte brut à synthétiser (sans balises SSML)
 * @returns URL publique Supabase du fichier WAV
 * @throws Error si l'API Cartesia renvoie une erreur ou si l'upload Supabase échoue
 */
export async function cartesiaSpeak(text: string): Promise<string> {
  const apiKey = process.env.CARTESIA_API_KEY;
  const voiceId = process.env.CARTESIA_VOICE_ID;

  if (!apiKey) throw new Error("[Cartesia] CARTESIA_API_KEY manquante");
  if (!voiceId) throw new Error("[Cartesia] CARTESIA_VOICE_ID manquant");
  if (!supabaseAdmin)
    throw new Error("[Cartesia] supabaseAdmin non disponible (SUPABASE_SERVICE_ROLE_KEY manquant)");

  const hash = createHash("sha256").update(text).digest("hex");
  const fileName = `${hash}.wav`;

  // Vérification du cache : HEAD sur l'URL publique
  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
  const headRes = await fetch(urlData.publicUrl, { method: "HEAD" });
  if (headRes.ok) return urlData.publicUrl;

  // Synthèse audio via l'API Cartesia
  const cartesiaRes = await fetch(CARTESIA_API_URL, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Cartesia-Version": CARTESIA_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: "sonic-3",
      transcript: text,
      voice: { mode: "id", id: voiceId },
      output_format: {
        container: "wav",
        encoding: "pcm_f32le",
        sample_rate: 22050,
      },
    }),
  });

  if (!cartesiaRes.ok) {
    const errorBody = await cartesiaRes.text();
    throw new Error(`[Cartesia] API error ${cartesiaRes.status}: ${errorBody}`);
  }

  const audioBuffer = await cartesiaRes.arrayBuffer();

  // Upload sur Supabase Storage (upsert=true pour gérer les races entre instances)
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(fileName, Buffer.from(audioBuffer), {
      contentType: "audio/wav",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`[Cartesia] Erreur upload Supabase: ${uploadError.message}`);
  }

  const { data: finalUrl } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
  return finalUrl.publicUrl;
}
