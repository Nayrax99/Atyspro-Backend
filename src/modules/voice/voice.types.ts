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
    /** Danger sécurité détecté (étincelles, odeur brûlé, eau + élec, etc.) */
    is_dangerous: boolean;
    /** Ampleur estimée du chantier */
    estimated_scope: "small" | "medium" | "large";
    /** Délai de rappel suggéré par le LLM */
    callback_delay: "asap" | "within_hour" | "today" | "no_rush";
  };
  confidence: number;
  /** Récapitulatif en langage naturel pour confirmation client */
  recap: string | null;
}

/** Contexte de l'artisan pour personnaliser la conversation */
export interface ArtisanContext {
  accountId: string;
  name: string;
  specialty: string;
}

/** Paramètres pour la finalisation après confirmation client */
export interface ConfirmationParams {
  accountId: string;
  callSid: string;
  allTranscripts: string[];
  parsedData: VoiceAIAnalysis["parsedData"];
}
