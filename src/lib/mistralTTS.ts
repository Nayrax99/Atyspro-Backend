/**
 * Synthétise du texte en audio via Voxtral TTS (Mistral)
 * Retourne un Buffer MP3 ou null si échec
 */
export async function synthesizeWithMistral(text: string): Promise<Buffer | null> {
  if (!process.env.MISTRAL_API_KEY) return null

  const voice = process.env.MISTRAL_TTS_VOICE ?? 'fr_female'
  console.log('[MistralTTS] Starting synthesis, voice:', voice)

  try {
    const response = await fetch('https://api.mistral.ai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        voice_id: voice,
        response_format: 'mp3'
      })
    })

    console.log('[MistralTTS] Response status:', response.status)

    if (!response.ok) {
      console.error('[MistralTTS] Error:', response.status, await response.text())
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('[MistralTTS] Buffer size:', buffer.length)
    return buffer

  } catch (error) {
    console.error('[MistralTTS] Error:', error)
    return null
  }
}
