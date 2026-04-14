/**
 * Synthétise du texte en audio via Voxtral TTS (Mistral)
 * Retourne un Buffer MP3 ou null si échec
 */
export async function synthesizeWithMistral(text: string): Promise<Buffer | null> {
  if (!process.env.MISTRAL_API_KEY) return null

  console.log('[MistralTTS] Starting synthesis')

  try {
    const response = await fetch('https://api.mistral.ai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        response_format: 'wav'
      })
    })

    console.log('[MistralTTS] Response status:', response.status)

    if (!response.ok) {
      console.error('[MistralTTS] Error:', response.status, await response.text())
      return null
    }

    const contentType = response.headers.get('content-type') ?? ''
    let buffer: Buffer
    if (contentType.includes('application/json')) {
      const data = await response.json()
      buffer = Buffer.from(data.audio_data, 'base64')
    } else {
      const arrayBuffer = await response.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }
    console.log('[MistralTTS] Buffer size:', buffer.length)
    return buffer

  } catch (error) {
    console.error('[MistralTTS] Error:', error)
    return null
  }
}
