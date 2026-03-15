import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase";
import { ApiError } from "@/lib/utils";

interface LeadRow {
  status: string;
  type_code: number | null;
  delay_code: number | null;
  priority_score: number | null;
  created_at: string;
}

interface StatsResult {
  total: number;
  byStatus: { complete: number; incomplete: number; needs_review: number };
  byType: {
    depannage: number;
    installation: number;
    devis: number;
    autre: number;
    nonRenseigne: number;
  };
  byDelay: {
    urgent: number;
    h48: number;
    semaine: number;
    flexible: number;
    nonRenseigne: number;
  };
  avgScore: number | null;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

function aggregate(arr: LeadRow[]): StatsResult {
  const byStatus = { complete: 0, incomplete: 0, needs_review: 0 };
  const byType = [0, 0, 0, 0, 0]; // index 0 = null, 1-4 = type_code
  const byDelay = [0, 0, 0, 0, 0]; // index 0 = null, 1-4 = delay_code
  let scoreSum = 0;
  let scoreCount = 0;
  let highPriority = 0;
  let mediumPriority = 0;
  let lowPriority = 0;

  for (const l of arr) {
    if (l.status === "complete") byStatus.complete++;
    else if (l.status === "incomplete") byStatus.incomplete++;
    else if (l.status === "needs_review") byStatus.needs_review++;

    const t = l.type_code ?? 0;
    if (t >= 0 && t <= 4) byType[t]++;

    const d = l.delay_code ?? 0;
    if (d >= 0 && d <= 4) byDelay[d]++;

    if (l.priority_score != null) {
      scoreSum += l.priority_score;
      scoreCount++;
      if (l.priority_score >= 70) highPriority++;
      else if (l.priority_score >= 40) mediumPriority++;
      else lowPriority++;
    } else {
      lowPriority++;
    }
  }

  return {
    total: arr.length,
    byStatus,
    byType: {
      depannage: byType[1],
      installation: byType[2],
      devis: byType[3],
      autre: byType[4],
      nonRenseigne: byType[0],
    },
    byDelay: {
      urgent: byDelay[1],
      h48: byDelay[2],
      semaine: byDelay[3],
      flexible: byDelay[4],
      nonRenseigne: byDelay[0],
    },
    avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : null,
    highPriority,
    mediumPriority,
    lowPriority,
  };
}

/**
 * GET /api/stats — Statistiques agrégées des leads (authentifié)
 * Query params: period=month|all (default: all)
 */
export async function GET(req: NextRequest) {
  try {
    const { account_id, token } = await requireAuth(req);
    const client = createSupabaseClient(token);

    const { data: leads, error } = await client
      .from("leads")
      .select("status, type_code, delay_code, priority_score, created_at")
      .eq("account_id", account_id);

    if (error) throw new Error(error.message);

    const all = (leads || []) as LeadRow[];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = all.filter((l) => new Date(l.created_at) >= startOfMonth);

    return NextResponse.json({
      success: true,
      data: {
        total: aggregate(all),
        month: aggregate(thisMonth),
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
