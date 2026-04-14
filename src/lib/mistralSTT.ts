/**
 * Transcrit un audio via Voxtral Realtime (Mistral)
 * Retourne le transcript texte ou null si échec
 */
export async function transcribeWithMistral(audioUrl: string): Promise<string | null> {
  if (!process.env.MISTRAL_API_KEY) return null

  try {
    // 1. Télécharger le fichier audio depuis l'URL Twilio
    const audioResponse = await fetch(audioUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`
      }
    })

    if (!audioResponse.ok) return null

    const audioBuffer = await audioResponse.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' })

    // 2. Envoyer à Mistral STT
    const formData = new FormData()
    formData.append('model', 'voxtral-mini-latest')
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('language', 'fr')

    const response = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: formData
    })

    if (!response.ok) {
      console.error('[MistralSTT] Error:', response.status)
      return null
    }

    const data = await response.json()
    return data.text ?? null

  } catch (error) {
    console.error('[MistralSTT] Error:', error)
    return null
  }
}
