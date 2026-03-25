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

    const { data: account, error } = await client
      .from("accounts")
      .select("id, name, email, owner_phone, city, specialty, first_name, last_name, company_name, welcome_message, assistant_name, score_threshold, callback_delay, pro_phone")
      .eq("id", account_id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      data: account,
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
    const updates: Record<string, string | number> = {};

    // Champs string non-vides (trim requis)
    const allowed = ["name", "city", "specialty", "email", "owner_phone", "first_name", "last_name", "company_name"] as const;
    for (const key of allowed) {
      if (typeof body[key] === "string" && (body[key] as string).trim().length > 0) {
        updates[key] = (body[key] as string).trim();
      }
    }

    // Champs string qui peuvent être vides (ex : effacer le message d'accueil)
    const textAllowed = ["welcome_message", "assistant_name", "callback_delay"] as const;
    for (const key of textAllowed) {
      if (typeof body[key] === "string") {
        updates[key] = body[key] as string;
      }
    }

    // Champs numériques
    const numberAllowed = ["score_threshold"] as const;
    for (const key of numberAllowed) {
      if (typeof body[key] === "number") {
        updates[key] = body[key] as number;
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
      .select("id, name, email, owner_phone, city, specialty, first_name, last_name, company_name, welcome_message, assistant_name, score_threshold, callback_delay, pro_phone")
      .maybeSingle();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      data,
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
