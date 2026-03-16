import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";

/**
 * GET /api/account — Récupère les données complètes du compte + numéro pro Twilio
 */
export async function GET(req: NextRequest) {
  try {
    const { account_id, token } = await requireAuth(req);
    const client = createSupabaseClient(token);

    const [{ data: account, error }, { data: phoneRecord }] = await Promise.all([
      client
        .from("accounts")
        .select("id, name, email, owner_phone, city, specialty")
        .eq("id", account_id)
        .maybeSingle(),
      client
        .from("phone_numbers")
        .select("phone_number")
        .eq("account_id", account_id)
        .eq("active", true)
        .maybeSingle(),
    ]);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      data: {
        ...account,
        pro_phone: phoneRecord?.phone_number ?? null,
      },
    });
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

/**
 * PATCH /api/account — Met à jour le profil du compte
 */
export async function PATCH(req: NextRequest) {
  try {
    const { account_id, token } = await requireAuth(req);
    const client = createSupabaseClient(token);

    const body = (await req.json()) as Record<string, unknown>;
    const updates: Record<string, string> = {};
    const allowed = ["name", "city", "specialty", "email", "owner_phone"] as const;

    for (const key of allowed) {
      if (typeof body[key] === "string" && (body[key] as string).trim().length > 0) {
        updates[key] = (body[key] as string).trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun champ valide à mettre à jour" },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from("accounts")
      .update(updates)
      .eq("id", account_id)
      .select("id, name, email, owner_phone, city, specialty")
      .maybeSingle();

    if (error) throw new Error(error.message);

    // Re-fetch pro_phone to include in response
    const { data: phoneRecord } = await client
      .from("phone_numbers")
      .select("phone_number")
      .eq("account_id", account_id)
      .eq("active", true)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      data: { ...data, pro_phone: phoneRecord?.phone_number ?? null },
    });
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
