"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useDashboard } from "@/contexts/DashboardContext";

interface StatsResult {
  total: number;
  byStatus: { new: number; incomplete: number; to_process: number; processed: number };
  byType: { depannage: number; installation: number; devis: number; autre: number; nonRenseigne: number };
  byDelay: { urgent: number; h48: number; semaine: number; flexible: number; nonRenseigne: number };
  avgScore: number | null;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
}

interface ChartBucket { label: string; count: number }

interface StatsResponse {
  success: boolean;
  data?: { total: StatsResult; month: StatsResult; chartData: { byWeek: ChartBucket[]; byDay: ChartBucket[] } };
  error?: string;
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

function BreakdownRow({ label, count, total, color = "var(--ap-primary)" }: { label: string; count: number; total: number; color?: string }) {
  const width = pct(count, total);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "0.5px solid #F8FAFC" }}>
      <span style={{ fontSize: 12, color: "#64748B", width: 140, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: "#F1F5F9", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ width: `${width}%`, height: "100%", background: color, borderRadius: 10, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", width: 55, textAlign: "right" }}>
        {count} <span style={{ fontWeight: 400, color: "#9CA3AF" }}>({width}%)</span>
      </span>
    </div>
  );
}

function BarChart({ buckets }: { buckets: ChartBucket[] }) {
  if (buckets.length === 0) {
    return <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: "#94A3B8" }}>Aucune donnée.</div>;
  }
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const BAR_MAX_H = 100;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: BAR_MAX_H + 20 }}>
        {buckets.map((bucket, i) => {
          const barH = Math.max(Math.round((bucket.count / maxCount) * BAR_MAX_H), bucket.count > 0 ? 4 : 0);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
              {bucket.count > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "#374151", marginBottom: 2 }}>{bucket.count}</span>
              )}
              <div style={{ width: "100%", background: "var(--ap-primary)", borderRadius: "3px 3px 0 0", height: barH, opacity: 0.85 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 4, borderTop: "1.5px solid #E2E8F0", paddingTop: 4 }}>
        {buckets.map((bucket, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {bucket.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card padding={20} style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--ap-primary)", borderRadius: "14px 14px 0 0" }} />
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

export default function StatsPage() {
  const { skin } = useDashboard();
  void skin;

  const [data, setData] = useState<{ total: StatsResult; month: StatsResult; chartData: { byWeek: ChartBucket[]; byDay: ChartBucket[] } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"month" | "total">("month");

  useEffect(() => {
    fetch("/api/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((json: StatsResponse) => {
        if (!json.success) { setError(json.error || "Erreur inconnue"); return; }
        setData(json.data ?? null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Card padding={32}><LoadingSpinner text="Chargement des statistiques…" /></Card>;
  if (error || !data) {
    return <div style={{ padding: 16, borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13 }}>Erreur : {error ?? "Impossible de charger."}</div>;
  }

  const stats = view === "month" ? data.month : data.total;
  const chartBuckets = view === "month" ? data.chartData.byDay : data.chartData.byWeek;
  const traitementPct = stats.total > 0 ? Math.round((stats.byStatus.processed / stats.total) * 100) : 0;

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0 }}>Statistiques</h1>
            <div style={{ width: 32, height: 2, background: "var(--ap-primary)", borderRadius: 2, marginTop: 6 }} />
          </div>
          <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 10, padding: 3, gap: 3 }}>
            <Button variant={view === "month" ? "dark" : "ghost"} size="sm" onClick={() => setView("month")}>Ce mois-ci</Button>
            <Button variant={view === "total" ? "dark" : "ghost"} size="sm" onClick={() => setView("total")}>Tout</Button>
          </div>
        </div>
      </div>

      {stats.total === 0 ? (
        <Card padding={48} style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Aucune donnée</h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>{view === "month" ? "Aucun lead reçu ce mois-ci." : "Aucun lead enregistré."}</p>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            <KpiCard label="Leads reçus" value={stats.total} />
            <KpiCard label="Score moyen" value={stats.avgScore ?? "—"} sub="sur 100" />
            <KpiCard label="Taux de traitement" value={`${traitementPct}%`} sub={`${stats.byStatus.processed} traité${stats.byStatus.processed > 1 ? "s" : ""}`} />
            <KpiCard label="Haute priorité" value={stats.highPriority} sub={`${pct(stats.highPriority, stats.total)}% du total`} />
          </div>

          {/* Breakdowns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <Card padding={20}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>Par type de demande</div>
              <BreakdownRow label="Dépannage" count={stats.byType.depannage} total={stats.total} color="#DC2626" />
              <BreakdownRow label="Installation" count={stats.byType.installation} total={stats.total} />
              <BreakdownRow label="Devis" count={stats.byType.devis} total={stats.total} color="#16A34A" />
              <BreakdownRow label="Autre" count={stats.byType.autre} total={stats.total} />
              <BreakdownRow label="Non renseigné" count={stats.byType.nonRenseigne} total={stats.total} color="#D1D5DB" />
            </Card>
            <Card padding={20}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>Par délai souhaité</div>
              <BreakdownRow label="Urgent (aujourd'hui)" count={stats.byDelay.urgent} total={stats.total} color="#DC2626" />
              <BreakdownRow label="Sous 48h" count={stats.byDelay.h48} total={stats.total} color="#D97706" />
              <BreakdownRow label="Cette semaine" count={stats.byDelay.semaine} total={stats.total} />
              <BreakdownRow label="Pas pressé" count={stats.byDelay.flexible} total={stats.total} />
              <BreakdownRow label="Non renseigné" count={stats.byDelay.nonRenseigne} total={stats.total} color="#D1D5DB" />
            </Card>
          </div>

          {/* Chart */}
          <Card padding={20}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Évolution des leads</span>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>{view === "month" ? "Par jour — ce mois-ci" : "Par semaine — tout"}</span>
            </div>
            <BarChart buckets={chartBuckets} />
          </Card>
        </>
      )}
    </div>
  );
}
