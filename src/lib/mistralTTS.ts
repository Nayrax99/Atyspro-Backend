/**
 * Synthétise du texte en audio via Voxtral TTS (Mistral)
 * Retourne un Buffer MP3 ou null si échec
 */
export async function synthesizeWithMistral(text: string): Promise<Buffer | null> {
  if (!process.env.MISTRAL_API_KEY) return null

  const voice = process.env.MISTRAL_TTS_VOICE ?? 'fr_female'

  try {
    const response = await fetch('https://api.mistral.ai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'voxtral-mini-tts-2603',
        input: text,
        voice,
        response_format: 'mp3'
      })
    })

    if (!response.ok) {
      console.error('[MistralTTS] Error:', response.status, await response.text())
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)

  } catch (error) {
    console.error('[MistralTTS] Error:', error)
    return null
  }
}
