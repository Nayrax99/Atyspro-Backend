/**
 * Types pour le module agent vocal AtysPro
 */

import type { DangerLevel, ScopeLevel } from "@/lib/scoringConfig";

/** Nombre maximum de tours de conversation avant clôture forcée */
export const MAX_VOICE_TURNS = 6;

/** Paramètres reçus lors d'un appel entrant Twilio */
export interface IncomingCallParams {
  callSid: string;
  from: string;
  to: string;
  callStatus: string;
}

/**
 * Paramètres reçus lors d'un résultat de Gather.
 * Fix #3 : prevTranscripts supprimé — les transcripts sont lus depuis la DB (calls.voice_transcripts).
 * Deepgram : recordingUrl optionnel — si présent et DEEPGRAM_API_KEY défini, utilisé pour la transcription.
 */
export interface GatherResultParams {
  speechResult: string;
  confidence: number;
  turn: number;
  accountId: string;
  callSid: string;
  /** URL audio Twilio (RecordingUrl) — utilisé pour la transcription Deepgram si disponible */
  recordingUrl?: string;
}

/** Analyse retournée par le LLM après traitement des transcripts */
export interface VoiceAIAnalysis {
  needsFollowUp: boolean;
  followUpQuestion: string | null;
  parsedData: {
    type_code: number | null;
    /** Niveau d'urgence/danger évalué par le LLM (remplace is_dangerous + delay_code pour le scoring) */
    danger_level: DangerLevel;
    /** Ampleur du chantier (remplace estimated_scope) */
    scope: ScopeLevel;
    full_name: string | null;
    address: string | null;
    description: string | null;
    /** Disponibilité mentionnée par le prospect, ex : "demain matin", "ce week-end" */
    availability_notes: string | null;
    /** Délai de rappel suggéré par le LLM pour le message de fin */
    callback_delay: "asap" | "within_hour" | "today" | "no_rush";
  };
  /** Confiance auto-évaluée par le LLM (0.0–1.0) */
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

/** Entrée d'une conversation vocale — inclut messages IA et prospect */
export interface VoiceTranscriptEntry {
  role: "assistant" | "user";
  text: string;
  turn: number;
  timestamp: string;
}

/**
 * Paramètres pour la finalisation après confirmation client.
 * Fix #3/#6 : allTranscripts et parsedData supprimés — lus depuis la DB
 * (calls.voice_transcripts et calls.voice_ai_result).
 */
export interface ConfirmationParams {
  accountId: string;
  callSid: string;
  /** Réponse de confirmation du prospect (SpeechResult Twilio, vide si timeout) */
  speechResult: string;
}
