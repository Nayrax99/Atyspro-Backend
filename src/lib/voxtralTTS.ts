/** @deprecated migrated to Cartesia — see src/lib/cartesiaTTS.ts */

export interface VoxtralSynthesisOptions {
  text: string;
  voiceId: string;
  format?: "mp3" | "pcm" | "wav";
}

export interface VoxtralSynthesisResult {
  audioBase64: string;
  format: string;
  durationMs: number;
  characters: number;
}

/** @deprecated migrated to Cartesia */
export async function synthesizeWithVoxtral(
  _opts: VoxtralSynthesisOptions
): Promise<VoxtralSynthesisResult> {
  throw new Error("[Voxtral] migrated to Cartesia — see src/lib/cartesiaTTS.ts");
}

/** @deprecated migrated to Cartesia */
export async function listVoxtralVoices(): Promise<never[]> {
  throw new Error("[Voxtral] migrated to Cartesia — see src/lib/cartesiaTTS.ts");
}
