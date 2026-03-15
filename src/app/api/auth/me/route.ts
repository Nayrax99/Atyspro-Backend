import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";

/**
 * GET /api/auth/me - Infos utilisateur + account (authentifié)
 */
export async function GET(req: NextRequest) {
  try {
    const { user, account_id } = await requireAuth(req);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Auth non configuré" },
        { status: 500 }
      );
    }

    const { data: account } = await supabaseAdmin
      .from("accounts")
      .select("id, name, email, onboarding_completed, owner_phone, city, is_admin")
      .eq("id", account_id)
      .maybeSingle();

    // Count pending leads (incomplete + needs_review) for sidebar badge
    const { count: pendingLeads } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("account_id", account_id)
      .neq("status", "complete");

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
      account: account
        ? {
            id: account.id,
            name: account.name,
            onboarding_completed: account.onboarding_completed ?? false,
            owner_phone: account.owner_phone ?? null,
            city: account.city ?? null,
            is_admin: account.is_admin ?? false,
            pending_leads: pendingLeads ?? 0,
          }
        : {
            id: account_id,
            name: null,
            onboarding_completed: false,
            owner_phone: null,
            city: null,
            is_admin: false,
            pending_leads: 0,
          },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error("Erreur GET /auth/me:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

