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
  updated_at: string | null;
}

interface StatsResult {
  total: number;
  byStatus: { nouveau: number; incomplet: number; a_traiter: number; traite: number };
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
  const byStatus = { nouveau: 0, incomplet: 0, a_traiter: 0, traite: 0 };
  const byType = [0, 0, 0, 0, 0]; // index 0 = null, 1-4 = type_code
  const byDelay = [0, 0, 0, 0, 0]; // index 0 = null, 1-4 = delay_code
  let scoreSum = 0;
  let scoreCount = 0;
  let highPriority = 0;
  let mediumPriority = 0;
  let lowPriority = 0;

  for (const l of arr) {
    if (l.status === "nouveau") byStatus.nouveau++;
    else if (l.status === "incomplet") byStatus.incomplet++;
    else if (l.status === "a_traiter") byStatus.a_traiter++;
    else if (l.status === "traite") byStatus.traite++;

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

const TYPE_LABELS: Record<number, string> = {
  1: "Dépannage",
  2: "Installation",
  3: "Devis",
  4: "Autre",
  0: "Non renseigné",
};

interface EnhancedMonthStats extends StatsResult {
  avgScoreByType: { depannage: number | null; installation: number | null; devis: number | null; autre: number | null };
  conversionRate: number;
  avgTreatmentDelayDays: number | null;
  top3Types: { type: string; count: number }[];
}

function aggregateEnhanced(arr: LeadRow[]): EnhancedMonthStats {
  const base = aggregate(arr);

  // A) Score moyen par type d'intervention
  const scoreByType: Record<number, { sum: number; count: number }> = { 1: { sum: 0, count: 0 }, 2: { sum: 0, count: 0 }, 3: { sum: 0, count: 0 }, 4: { sum: 0, count: 0 } };
  // B) Taux de traitement — calculé depuis byStatus.traite / total
  // C) Délai moyen de traitement
  let delaySum = 0;
  let delayCount = 0;
  // D) Top 3 types — reuse byType counts
  const typeCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const l of arr) {
    const t = l.type_code ?? 0;
    if (t >= 1 && t <= 4 && l.priority_score != null) {
      scoreByType[t].sum += l.priority_score;
      scoreByType[t].count++;
    }
    if (t >= 0 && t <= 4) typeCounts[t]++;

    if (l.status === "traite" && l.updated_at) {
      const created = new Date(l.created_at).getTime();
      const updated = new Date(l.updated_at).getTime();
      const diffDays = (updated - created) / (1000 * 60 * 60 * 24);
      if (!isNaN(diffDays)) {
        delaySum += diffDays;
        delayCount++;
      }
    }
  }

  const avgScoreByType = {
    depannage: scoreByType[1].count > 0 ? Math.round(scoreByType[1].sum / scoreByType[1].count) : null,
    installation: scoreByType[2].count > 0 ? Math.round(scoreByType[2].sum / scoreByType[2].count) : null,
    devis: scoreByType[3].count > 0 ? Math.round(scoreByType[3].sum / scoreByType[3].count) : null,
    autre: scoreByType[4].count > 0 ? Math.round(scoreByType[4].sum / scoreByType[4].count) : null,
  };

  const conversionRate = base.total > 0 ? Math.round((base.byStatus.traite / base.total) * 100) : 0;

  const avgTreatmentDelayDays = delayCount > 0 ? Math.round((delaySum / delayCount) * 10) / 10 : null;

  const top3Types = Object.entries(typeCounts)
    .filter(([, count]) => count > 0)
    .map(([code, count]) => ({ type: TYPE_LABELS[Number(code)] ?? "Non renseigné", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return { ...base, avgScoreByType, conversionRate, avgTreatmentDelayDays, top3Types };
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
      .select("status, type_code, delay_code, priority_score, created_at, updated_at")
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
        month: aggregateEnhanced(thisMonth),
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
