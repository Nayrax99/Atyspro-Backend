export function buildTtsAttributes(provider: string): string {
  if (provider === "elevenlabs_turbo") {
    return `ttsProvider="ElevenLabs" voice="HuLbOdhRlvQQN8oPP0AJ-turbo_v2_5" elevenlabsTextNormalization="auto"`;
  }
  if (provider === "google_chirp") {
    return `ttsProvider="Google" voice="fr-FR-Chirp3-HD-Leda"`;
  }
  // elevenlabs_flash (default) + fallback for any unrecognized value
  return `ttsProvider="ElevenLabs" voice="HuLbOdhRlvQQN8oPP0AJ" elevenlabsTextNormalization="auto"`;
}
