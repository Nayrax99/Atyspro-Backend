import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/dev/simulate/sms
 * DEV ONLY - Simule un SMS entrant et crée un lead.
 * Pas d'auth, pas de Twilio.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const to = typeof body.to === "string" ? body.to.trim() : null;
    const from = typeof body.from === "string" ? body.from.trim() : null;
    const smsBody = typeof body.body === "string" ? body.body : null;

    if (!to || !from || !smsBody) {
      return NextResponse.json(
        { success: false, error: "Body must have to, from, body (strings)" },
        { status: 400 }
      );
    }

    const { data: phoneNumber, error: phoneError } = await supabase
      .from("phone_numbers")
      .select("id, account_id")
      .eq("e164", to)
      .single();

    if (phoneError || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: `Numéro professionnel non trouvé pour e164=${to}` },
        { status: 400 }
      );
    }

    const { account_id } = phoneNumber;

    // Simple parse: "1 / 1 / 44 rue... / Jean Dupont / Plus d'électricité"
    const parts = smsBody.split(/ \/ /).map((p: string) => p.trim());
    const type_code = parts[0] ? parseInt(parts[0], 10) || 1 : 1;
    const delay_code = parts[1] ? parseInt(parts[1], 10) || 1 : 1;
    const address = parts[2] || null;
    const full_name = parts[3] || null;
    const description = parts[4] || smsBody;

    const leadData = {
      account_id,
      status: "needs_review" as const,
      client_phone: from,
      type_code,
      delay_code,
      address,
      full_name,
      description,
      raw_message: smsBody,
      priority_score: 90,
      relance_count: 0,
    };

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      return NextResponse.json(
        { success: false, error: `Erreur création lead: ${leadError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Erreur simulate SMS:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
