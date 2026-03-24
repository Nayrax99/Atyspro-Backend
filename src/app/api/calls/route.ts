import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";

/**
 * GET /api/calls — Log des appels paginé (authentifié)
 * Query params: page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { account_id, token } = await requireAuth(request);
    const client = createSupabaseClient(token);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: "Paramètres invalides (page >= 1, limit 1-100)" },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    const { data: calls, error, count } = await client
      .from("calls")
      .select("*", { count: "exact" })
      .eq("account_id", account_id)
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    // Lookup associated leads by from_number → leads.client_phone
    const fromNumbers = [
      ...new Set(
        (calls ?? [])
          .map((c) => c.from_number)
          .filter((n): n is string => n != null)
      ),
    ];

    const leadsByPhone: Record<string, { id: string; full_name: string | null; description: string | null }> = {};

    if (fromNumbers.length > 0) {
      const { data: matchedLeads } = await client
        .from("leads")
        .select("id, full_name, client_phone, description")
        .eq("account_id", account_id)
        .in("client_phone", fromNumbers)
        .order("created_at", { ascending: false });

      for (const lead of matchedLeads ?? []) {
        const phone = lead.client_phone as string | null;
        if (phone && !(phone in leadsByPhone)) {
          leadsByPhone[phone] = {
            id: lead.id as string,
            full_name: lead.full_name as string | null,
            description: lead.description as string | null,
          };
        }
      }
    }

    const enrichedCalls = (calls ?? []).map((call) => ({
      ...call,
      lead: call.from_number ? (leadsByPhone[call.from_number] ?? null) : null,
    }));

    const total = count ?? 0;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    // KPI aggregation — queries all calls to compute accurate totals
    const { data: allCallsForKpi } = await client
      .from("calls")
      .select("from_number, status, started_at, ended_at")
      .eq("account_id", account_id);

    const { data: allLeads } = await client
      .from("leads")
      .select("client_phone")
      .eq("account_id", account_id);

    const allLeadPhoneSet = new Set(
      (allLeads ?? [])
        .map((l) => l.client_phone as string | null)
        .filter((p): p is string => p !== null)
    );

    const qualifiedCount = (allCallsForKpi ?? []).filter(
      (c) => c.from_number && allLeadPhoneSet.has(c.from_number as string)
    ).length;

    const durations = (allCallsForKpi ?? [])
      .filter((c) => c.status === "completed" && c.started_at && c.ended_at)
      .map((c) =>
        Math.floor(
          (new Date(c.ended_at as string).getTime() - new Date(c.started_at as string).getTime()) / 1000
        )
      )
      .filter((d) => d > 0);

    const avgDurationSec =
      durations.length > 0
        ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
        : null;

    return NextResponse.json({
      success: true,
      data: enrichedCalls,
      kpis: {
        total,
        qualified: qualifiedCount,
        avgDurationSec,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
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
