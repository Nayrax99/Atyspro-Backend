import { supabase } from "@/lib/supabase";
import { parseSms } from "@/lib/leadParsing";
import { computeScore } from "@/lib/leadScoring";
import { sendSMS } from "@/lib/twilioClient";
import { RELANCE_CORRECTION_SMS } from "@/lib/smsTemplates";
import { NextRequest, NextResponse } from "next/server";

/**
 * Réponse exploitable : type OU delay détecté OU séparateur présent.
 * Inexploitable : type=null ET delay=null ET pas de séparateur.
 */
function isReponseExploitable(parsed: {
  type_code: number | null;
  delay_code: number | null;
  has_separator: boolean;
}): boolean {
  return (
    parsed.type_code != null ||
    parsed.delay_code != null ||
    parsed.has_separator
  );
}

/**
 * Webhook POST /api/webhooks/twilio/sms
 * Reçoit les SMS entrants Twilio.
 * - Réponse exploitable → créer/update lead, pas de relance.
 * - Réponse inexploitable → si relance_count < 2 : relance correction (SMS) + incrément ; sinon needs_review, pas de SMS.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const From = formData.get("From")?.toString() || "";
    const To = formData.get("To")?.toString() || "";
    const Body = formData.get("Body")?.toString() || "";
    const MessageSid = formData.get("MessageSid")?.toString() || null;

    console.log("Twilio SMS Webhook:", { From, To, Body });

    if (!From || !To || !Body) {
      return NextResponse.json(
        { ok: false, error: "Champs Twilio manquants" },
        { status: 400 }
      );
    }

    const { data: phoneNumber, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("id, account_id")
      .eq("e164", To)
      .single();

    if (phoneError || !phoneNumber) {
      console.error("Numéro professionnel non trouvé:", To);
      return NextResponse.json(
        { ok: false, error: "Numéro professionnel non trouvé" },
        { status: 400 }
      );
    }

    const { account_id } = phoneNumber;

    // Enregistrer le SMS entrant
    try {
      await supabase.from("sms_messages").insert({
        account_id,
        from_number: From,
        to_number: To,
        direction: "inbound",
        body: Body,
        twilio_message_sid: MessageSid,
      });
    } catch (smsError) {
      console.warn("Impossible d'enregistrer SMS inbound (sms_messages):", smsError);
    }

    const parsed = parseSms(Body);
    console.log("SMS parsé:", parsed);

    const exploitable = isReponseExploitable(parsed);
    const scored = computeScore(parsed.type_code, parsed.delay_code);

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, relance_count")
      .eq("account_id", account_id)
      .eq("client_phone", From)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const leadData: Record<string, unknown> = {
      account_id,
      client_phone: From,
      type_code: parsed.type_code,
      delay_code: parsed.delay_code,
      address: parsed.address,
      full_name: parsed.full_name,
      description: parsed.description,
      raw_message: parsed.raw_message,
      status: parsed.lead_status,
      priority_score: scored.priority_score,
      value_estimate: scored.value_estimate,
      last_inbound_sms_at: new Date().toISOString(),
    };

    if (exploitable) {
      // Réponse exploitable : mise à jour normale du lead, aucune relance
      if (existingLead) {
        const { error: updateError } = await supabase
          .from("leads")
          .update(leadData)
          .eq("id", existingLead.id);
        if (updateError) throw new Error(`Erreur update lead: ${updateError.message}`);
        console.log("Lead mis à jour (réponse exploitable):", existingLead.id);
      } else {
        (leadData as Record<string, unknown>).relance_count = 0;
        const { error: insertError } = await supabase.from("leads").insert(leadData);
        if (insertError) throw new Error(`Erreur création lead: ${insertError.message}`);
        console.log("Nouveau lead créé (réponse exploitable):", From);
      }
      return NextResponse.json({ ok: true, parsed, scored, relance: false });
    }

    // Réponse inexploitable
    const currentRelanceCount = existingLead?.relance_count ?? 0;

    if (currentRelanceCount < 2) {
      const newRelanceCount = currentRelanceCount + 1;
      leadData.relance_count = newRelanceCount;
      leadData.status = newRelanceCount >= 2 ? "needs_review" : parsed.lead_status;

      console.log("Relance correction (immédiate), relance_count:", newRelanceCount);

      const result = await sendSMS(From, To, RELANCE_CORRECTION_SMS);
      try {
        await supabase.from("sms_messages").insert({
          account_id,
          from_number: To,
          to_number: From,
          direction: "outbound",
          body: RELANCE_CORRECTION_SMS,
          twilio_message_sid: result.sid,
        });
      } catch (err) {
        console.warn("Impossible d'enregistrer SMS outbound (relance correction):", err);
      }

      if (existingLead) {
        const { error: updateError } = await supabase
          .from("leads")
          .update(leadData)
          .eq("id", existingLead.id);
        if (updateError) throw new Error(`Erreur update lead: ${updateError.message}`);
        console.log("Lead mis à jour après relance correction:", existingLead.id);
      } else {
        const { error: insertError } = await supabase.from("leads").insert(leadData);
        if (insertError) throw new Error(`Erreur création lead: ${insertError.message}`);
        console.log("Nouveau lead créé (réponse inexploitable, relance envoyée):", From);
      }

      return NextResponse.json({
        ok: true,
        parsed,
        scored,
        relance: "correction",
        relance_count: newRelanceCount,
      });
    }

    // Déjà 2 relances : pas de 3e SMS, lead en needs_review
    leadData.status = "needs_review";
    leadData.raw_message = parsed.raw_message;

    if (existingLead) {
      const { error: updateError } = await supabase
        .from("leads")
        .update(leadData)
        .eq("id", existingLead.id);
      if (updateError) throw new Error(`Erreur update lead: ${updateError.message}`);
      console.log("Lead mis à jour (needs_review, plus de relance):", existingLead.id);
    } else {
      (leadData as Record<string, unknown>).relance_count = 2;
      const { error: insertError } = await supabase.from("leads").insert(leadData);
      if (insertError) throw new Error(`Erreur création lead: ${insertError.message}`);
      console.log("Nouveau lead créé (inexploitable, quota relances atteint):", From);
    }

    return NextResponse.json({
      ok: true,
      parsed,
      scored,
      relance: false,
      reason: "max_relances",
    });
  } catch (error) {
    console.error("Erreur webhook Twilio SMS:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
