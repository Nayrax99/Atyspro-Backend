import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";

interface AccountRow {
  id: string;
  name: string | null;
  email: string | null;
  city: string | null;
  specialty: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
}

interface LeadCountRow {
  account_id: string;
}

/**
 * GET /api/admin/overview — Vue admin plateforme (authentifié, supabaseAdmin)
 * Retourne la liste de tous les comptes + stats globales.
 */
export async function GET(req: NextRequest) {
  try {
    // Admin requis
    await requireAdmin(req);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin Supabase non configuré" },
        { status: 500 }
      );
    }

    // Comptes
    const { data: accounts, error: accErr } = await supabaseAdmin
      .from("accounts")
      .select("id, name, email, city, specialty, onboarding_completed, created_at")
      .order("created_at", { ascending: false });

    if (accErr) throw new Error(accErr.message);

    // Comptage leads par account_id
    const { data: leadRows, error: leadErr } = await supabaseAdmin
      .from("leads")
      .select("account_id");

    if (leadErr) throw new Error(leadErr.message);

    const leadCountMap: Record<string, number> = {};
    for (const row of (leadRows ?? []) as LeadCountRow[]) {
      leadCountMap[row.account_id] = (leadCountMap[row.account_id] ?? 0) + 1;
    }

    // Comptage leads complets (pour taux de completion global)
    const { count: completeCount } = await supabaseAdmin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "complete");

    // Appels total
    const { count: callCount } = await supabaseAdmin
      .from("calls")
      .select("*", { count: "exact", head: true });

    const totalLeads = (leadRows ?? []).length;
    const totalAccounts = (accounts ?? []).length;
    const onboardedAccounts = (accounts ?? [] as AccountRow[]).filter(
      (a: AccountRow) => a.onboarding_completed === true
    ).length;

    const accountsWithLeads = (accounts ?? [] as AccountRow[]).map((a: AccountRow) => ({
      ...a,
      lead_count: leadCountMap[a.id] ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        accounts: accountsWithLeads,
        stats: {
          totalAccounts,
          onboardedAccounts,
          totalLeads,
          completeLeads: completeCount ?? 0,
          completionRate:
            totalLeads > 0
              ? Math.round(((completeCount ?? 0) / totalLeads) * 100)
              : 0,
          totalCalls: callCount ?? 0,
        },
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
