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
  byStatus: { new: number; incomplete: number; to_process: number; processed: number };
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

interface ChartBucket {
  label: string;
  count: number;
}

function aggregate(arr: LeadRow[]): StatsResult {
  const byStatus = { new: 0, incomplete: 0, to_process: 0, processed: 0 };
  const byType = [0, 0, 0, 0, 0]; // index 0 = null, 1-4 = type_code
  const byDelay = [0, 0, 0, 0, 0]; // index 0 = null, 1-4 = delay_code
  let scoreSum = 0;
  let scoreCount = 0;
  let highPriority = 0;
  let mediumPriority = 0;
  let lowPriority = 0;

  for (const l of arr) {
    if (l.status === "new") byStatus.new++;
    else if (l.status === "incomplete") byStatus.incomplete++;
    else if (l.status === "to_process") byStatus.to_process++;
    else if (l.status === "processed") byStatus.processed++;

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

const MONTHS_FR = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];

/** Regroupe les leads par semaine (lundi → dimanche) — tout en UTC */
function groupByWeek(arr: LeadRow[]): ChartBucket[] {
  const buckets = new Map<string, { label: string; count: number; order: number }>();
  for (const l of arr) {
    const d = new Date(l.created_at);
    const day = d.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + mondayOffset);
    monday.setUTCHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const key = monday.toISOString().split("T")[0];
    if (!buckets.has(key)) {
      const label = `${monday.getUTCDate()} ${MONTHS_FR[monday.getUTCMonth()]}-${sunday.getUTCDate()} ${MONTHS_FR[sunday.getUTCMonth()]}`;
      buckets.set(key, { label, count: 0, order: monday.getTime() });
    }
    buckets.get(key)!.count++;
  }
  return Array.from(buckets.values())
    .sort((a, b) => a.order - b.order)
    .map(({ label, count }) => ({ label, count }));
}

/** Regroupe les leads par jour — clé et label tous deux en UTC pour éviter les doublons de timezone */
function groupByDay(arr: LeadRow[]): ChartBucket[] {
  const buckets = new Map<string, { label: string; count: number; order: number }>();
  for (const l of arr) {
    const d = new Date(l.created_at);
    const key = d.toISOString().split("T")[0]; // clé UTC : "YYYY-MM-DD"
    if (!buckets.has(key)) {
      buckets.set(key, {
        label: `${d.getUTCDate()} ${MONTHS_FR[d.getUTCMonth()]}`, // label UTC, cohérent avec la clé
        count: 0,
        order: d.getTime(),
      });
    }
    buckets.get(key)!.count++;
  }
  return Array.from(buckets.values())
    .sort((a, b) => a.order - b.order)
    .map(({ label, count }) => ({ label, count }));
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
        chartData: {
          byWeek: groupByWeek(all),
          byDay: groupByDay(thisMonth),
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
