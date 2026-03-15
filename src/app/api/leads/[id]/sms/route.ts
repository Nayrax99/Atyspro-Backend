import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import { isValidUuid, ApiError } from "@/lib/utils";

type Ctx = { params: { id: string } | Promise<{ id: string }> };

async function getId(ctx: Ctx): Promise<string> {
  const p = await Promise.resolve(ctx.params);
  return p.id;
}

/**
 * GET /api/leads/:id/sms — SMS history for a lead (authentifié, RLS via createSupabaseClient)
 * Returns all sms_messages matching lead.client_phone (from_number OR to_number).
 */
export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { token } = await requireAuth(request);
    const id = await getId(ctx);

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { success: false, error: "ID invalide (format UUID requis)" },
        { status: 400 }
      );
    }

    const client = createSupabaseClient(token);

    // Fetch lead to get client_phone (RLS ensures it belongs to the authenticated account)
    const { data: lead, error: leadError } = await client
      .from("leads")
      .select("client_phone")
      .eq("id", id)
      .maybeSingle();

    if (leadError) throw new Error(leadError.message);
    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead non trouvé" },
        { status: 404 }
      );
    }

    if (!lead.client_phone) {
      return NextResponse.json({ success: true, data: [] });
    }

    const phone = lead.client_phone as string;

    const { data: messages, error: smsError } = await client
      .from("sms_messages")
      .select("id, from_number, to_number, direction, body, created_at")
      .or(`from_number.eq.${phone},to_number.eq.${phone}`)
      .order("created_at", { ascending: true });

    if (smsError) throw new Error(smsError.message);

    return NextResponse.json({ success: true, data: messages ?? [] });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
