/**
 * Types pour le module agent vocal AtysPro
 */

/** Paramètres reçus lors d'un appel entrant Twilio */
export interface IncomingCallParams {
  callSid: string;
  from: string;
  to: string;
  callStatus: string;
}

/** Paramètres reçus lors d'un résultat de Gather */
export interface GatherResultParams {
  speechResult: string;
  confidence: number;
  turn: number;
  accountId: string;
  callSid: string;
  prevTranscripts: string[];
}

/** Analyse retournée par le LLM après traitement des transcripts */
export interface VoiceAIAnalysis {
  needsFollowUp: boolean;
  followUpQuestion: string | null;
  parsedData: {
    type_code: number | null;
    delay_code: number | null;
    full_name: string | null;
    address: string | null;
    description: string | null;
  };
  confidence: number;
}

/** Contexte de l'artisan pour personnaliser la conversation */
export interface ArtisanContext {
  accountId: string;
  name: string;
  specialty: string;
}
