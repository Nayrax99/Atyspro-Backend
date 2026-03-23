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

interface PhoneRow {
  account_id: string;
  phone_number: string;
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

    // Comptes + numéros pro en parallèle
    const [
      { data: accounts, error: accErr },
      { data: leadRows, error: leadErr },
      { data: phoneRows },
      { count: completeCount },
      { count: callCount },
    ] = await Promise.all([
      supabaseAdmin
        .from("accounts")
        .select("id, name, email, city, specialty, onboarding_completed, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("leads")
        .select("account_id"),
      supabaseAdmin
        .from("phone_numbers")
        .select("account_id, phone_number")
        .eq("active", true),
      supabaseAdmin
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "traite"),
      supabaseAdmin
        .from("calls")
        .select("*", { count: "exact", head: true }),
    ]);

    if (accErr) throw new Error(accErr.message);
    if (leadErr) throw new Error(leadErr.message);

    const leadCountMap: Record<string, number> = {};
    for (const row of (leadRows ?? []) as LeadCountRow[]) {
      leadCountMap[row.account_id] = (leadCountMap[row.account_id] ?? 0) + 1;
    }

    const phoneMap: Record<string, string> = {};
    for (const row of (phoneRows ?? []) as PhoneRow[]) {
      phoneMap[row.account_id] = row.phone_number;
    }

    const totalLeads = (leadRows ?? []).length;
    const totalAccounts = (accounts ?? []).length;
    const onboardedAccounts = (accounts ?? [] as AccountRow[]).filter(
      (a: AccountRow) => a.onboarding_completed === true
    ).length;

    const accountsWithLeads = (accounts ?? [] as AccountRow[]).map((a: AccountRow) => ({
      ...a,
      lead_count: leadCountMap[a.id] ?? 0,
      pro_phone: phoneMap[a.id] ?? null,
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
