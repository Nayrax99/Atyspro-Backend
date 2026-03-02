/**
 * Domain types for twilio module
 */

export interface TwilioSmsWebhookParams {
  From: string;
  To: string;
  Body: string;
  MessageSid: string | null;
}

export interface TwilioVoiceWebhookParams {
  CallSid: string;
  CallStatus: string;
  From: string;
  To: string;
  Direction: string;
  Timestamp: string | null;
}

export type TwilioVoiceResult =
  | { type: "xml"; content: string }
  | { type: "json"; body: { ok: boolean } };
