/**
 * Transcrit un audio via Voxtral (Mistral)
 *
 * - Si audioUrl fourni → télécharge l'audio Twilio et envoie à Mistral STT (flow avec enregistrement)
 * - Si seulement speechResult fourni → retourne speechResult directement (flow actuel input="speech")
 *
 * Le vrai gain Mistral STT sera actif quand Twilio sera configuré avec input="speech recording".
 */
export async function transcribeWithMistral(
  audioUrl?: string,
  speechResult?: string
): Promise<string | null> {
  if (!process.env.MISTRAL_API_KEY) return speechResult ?? null

  // Pas d'URL audio → retourner le SpeechResult Twilio directement
  if (!audioUrl) return speechResult ?? null

  try {
    // 1. Télécharger le fichier audio depuis l'URL Twilio
    const audioResponse = await fetch(audioUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64')}`
      }
    })

    if (!audioResponse.ok) {
      console.error('[MistralSTT] Échec téléchargement audio Twilio:', audioResponse.status)
      return speechResult ?? null
    }

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
      console.error('[MistralSTT] Erreur API:', response.status)
      return speechResult ?? null
    }

    const data = await response.json()
    return data.text ?? speechResult ?? null

  } catch (error) {
    console.error('[MistralSTT] Exception:', error)
    return speechResult ?? null
  }
}
