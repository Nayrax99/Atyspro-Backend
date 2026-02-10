import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook POST /api/webhooks/twilio/voice
 * Reçoit les événements d'appels Twilio (status callbacks)
 * Flow: call missed → créé lead minimal (sans SMS pour économiser)
 */
export async function POST(req: NextRequest) {
  try {
    // Lire form-data Twilio (application/x-www-form-urlencoded)
    const formData = await req.formData();

    const CallSid = formData.get("CallSid")?.toString() || "";
    const CallStatus = formData.get("CallStatus")?.toString() || "";
    const From = formData.get("From")?.toString() || "";
    const To = formData.get("To")?.toString() || "";
    const Direction = formData.get("Direction")?.toString() || "inbound";
    const Timestamp = formData.get("Timestamp")?.toString() || null;

    console.log("Twilio Voice Webhook:", { CallSid, CallStatus, From, To, Direction });

    // Validation des champs requis
    if (!CallSid || !CallStatus || !From || !To) {
      return NextResponse.json(
        { ok: false, error: "Champs Twilio manquants" },
        { status: 400 }
      );
    }

    // Trouver le phone_number correspondant à To (numéro pro)
    const { data: phoneNumber, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("id, account_id, e164")
      .eq("e164", To)
      .single();

    if (phoneError || !phoneNumber) {
      console.error("Numéro professionnel non trouvé:", To);
      return NextResponse.json(
        { ok: false, error: "Numéro professionnel non trouvé" },
        { status: 400 }
      );
    }

    const { account_id, id: phone_number_id } = phoneNumber;

    // Upsert dans table calls par twilio_call_sid
    const { data: existingCall } = await supabase
      .from("calls")
      .select("id, status, started_at, ended_at")
      .eq("twilio_call_sid", CallSid)
      .single();

    const callData: any = {
      account_id,
      phone_number_id,
      direction: Direction,
      from_number: From,
      to_number: To,
      status: CallStatus,
      twilio_call_sid: CallSid,
    };

    // Gérer started_at et ended_at selon le statut
    const inProgressStatuses = ["in-progress", "ringing"];
    const endedStatuses = ["completed", "busy", "failed", "no-answer", "canceled"];

    if (inProgressStatuses.includes(CallStatus) && (!existingCall || !existingCall.started_at)) {
      callData.started_at = Timestamp || new Date().toISOString();
    }

    if (endedStatuses.includes(CallStatus)) {
      callData.ended_at = Timestamp || new Date().toISOString();
    }

    if (existingCall) {
      // Update
      await supabase
        .from("calls")
        .update(callData)
        .eq("twilio_call_sid", CallSid);
    } else {
      // Insert
      await supabase.from("calls").insert(callData);
    }

    // FLOW APPEL MANQUÉ: créer lead minimal si statut d'échec
    const missedStatuses = ["no-answer", "busy", "failed", "canceled"];
    if (missedStatuses.includes(CallStatus)) {
      console.log("Appel manqué détecté, création lead minimal");

      // Chercher si un lead existe déjà pour ce client
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("account_id", account_id)
        .eq("client_phone", From)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!existingLead) {
        // Créer un lead minimal en status incomplete
        await supabase.from("leads").insert({
          account_id,
          client_phone: From,
          raw_message: null,
          status: "incomplete",
          relance_count: 0,
          priority_score: 0,
          value_estimate: null,
        });

        console.log("Lead minimal créé pour:", From);
      } else {
        console.log("Lead existant trouvé, pas de création");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erreur webhook Twilio Voice:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}