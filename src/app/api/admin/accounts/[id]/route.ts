import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";

const VALID_SPECIALTIES = ["admin", "electricien", "plombier", "serrurier", "immo"] as const;

/**
 * PATCH /api/admin/accounts/[id] — Modifier la spécialité d'un compte (admin uniquement)
 * Body: { specialty: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { account_id } = await requireAuth(req);
    const { id: targetId } = await params;

    // Vérifier que l'utilisateur est admin
    const { data: adminAccount } = await supabaseAdmin!
      .from("accounts")
      .select("is_admin")
      .eq("id", account_id)
      .maybeSingle();

    if (!adminAccount?.is_admin) {
      return NextResponse.json(
        { success: false, error: "Accès refusé : droits administrateur requis" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { specialty } = body;

    if (!specialty || !VALID_SPECIALTIES.includes(specialty)) {
      return NextResponse.json(
        {
          success: false,
          error: `Spécialité invalide. Valeurs acceptées : ${VALID_SPECIALTIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabaseAdmin!
      .from("accounts")
      .update({ specialty })
      .eq("id", targetId)
      .select("id, specialty")
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Compte introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
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
