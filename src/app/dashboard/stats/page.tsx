"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";

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

interface StatsResponse {
  success: boolean;
  data?: {
    total: StatsResult;
    month: StatsResult;
    chartData: { byWeek: ChartBucket[]; byDay: ChartBucket[] };
  };
  error?: string;
}

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

function BreakdownRow({
  label,
  count,
  total,
  colorClass = "",
}: {
  label: string;
  count: number;
  total: number;
  colorClass?: string;
}) {
  const width = pct(count, total);
  return (
    <div className="stats-breakdown-row">
      <span className="stats-breakdown-label">{label}</span>
      <div className="stats-progress-bar">
        <div
          className={`stats-progress-fill ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="stats-breakdown-count">
        {count}
        {total > 0 && (
          <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: "0.25rem" }}>
            ({width}%)
          </span>
        )}
      </span>
    </div>
  );
}

function BarChart({ buckets }: { buckets: ChartBucket[] }) {
  if (buckets.length === 0) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center", fontSize: "13px", color: "#94a3b8", fontFamily: FONT }}>
        Aucune donnée pour cette période.
      </div>
    );
  }
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const BAR_MAX_H = 100;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: `${BAR_MAX_H + 24}px`, maxHeight: "200px", overflow: "hidden" }}>
        {buckets.map((bucket, i) => {
          const barH = Math.max(Math.round((bucket.count / maxCount) * BAR_MAX_H), bucket.count > 0 ? 4 : 0);
          return (
            <div
              key={i}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}
            >
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#374151", marginBottom: "3px", fontFamily: FONT }}>
                {bucket.count}
              </span>
              <div
                style={{
                  width: "100%",
                  backgroundColor: "#2563eb",
                  borderRadius: "3px 3px 0 0",
                  height: `${barH}px`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "6px", borderTop: "2px solid #e2e8f0", paddingTop: "6px" }}>
        {buckets.map((bucket, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: "10px",
              color: "#94a3b8",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: FONT,
            }}
          >
            {bucket.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [data, setData] = useState<{
    total: StatsResult;
    month: StatsResult;
    chartData: { byWeek: ChartBucket[]; byDay: ChartBucket[] };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"month" | "total">("month");

  useEffect(() => {
    fetch("/api/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((json: StatsResponse) => {
        if (!json.success) {
          setError(json.error || "Erreur inconnue");
          return;
        }
        setData(json.data ?? null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", padding: "32px" }}>
        <LoadingSpinner text="Chargement des statistiques…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "14px", fontFamily: FONT }}>
        Erreur : {error ?? "Impossible de charger les statistiques."}
      </div>
    );
  }

  const stats = view === "month" ? data.month : data.total;
  const chartBuckets = view === "month" ? data.chartData.byDay : data.chartData.byWeek;

  const aTraiterCount = stats.byStatus.new + stats.byStatus.to_process;
  const traitementPct = stats.total > 0 ? Math.round((stats.byStatus.processed / stats.total) * 100) : 0;
  const traitementColor = traitementPct >= 70 ? "#10b981" : traitementPct >= 40 ? "#f59e0b" : "#ef4444";
  const traitementBg = traitementPct >= 70 ? "#f0fdf4" : traitementPct >= 40 ? "#fffbeb" : "#fef2f2";
  const traitementBorder = traitementPct >= 70 ? "#bbf7d0" : traitementPct >= 40 ? "#fde68a" : "#fecaca";

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header + toggle */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: 0, fontFamily: FONT }}>
            Statistiques
          </h1>
          <div style={{ display: "flex", backgroundColor: "#f1f5f9", borderRadius: "8px", padding: "4px", gap: "4px" }}>
            <button
              type="button"
              onClick={() => setView("month")}
              style={{ padding: "6px 14px", borderRadius: "6px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT, backgroundColor: view === "month" ? "white" : "transparent", color: view === "month" ? "#0f172a" : "#64748b", boxShadow: view === "month" ? "0 1px 2px rgba(0,0,0,0.08)" : "none" }}
            >
              Ce mois-ci
            </button>
            <button
              type="button"
              onClick={() => setView("total")}
              style={{ padding: "6px 14px", borderRadius: "6px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: FONT, backgroundColor: view === "total" ? "white" : "transparent", color: view === "total" ? "#0f172a" : "#64748b", boxShadow: view === "total" ? "0 1px 2px rgba(0,0,0,0.08)" : "none" }}
            >
              Tout
            </button>
          </div>
        </div>
        <div style={{ width: "40px", height: "3px", backgroundColor: "#2563eb", borderRadius: "2px", marginTop: "8px", marginBottom: "8px" }} />
        <p style={{ fontSize: "15px", color: "#64748b", fontWeight: 400, margin: 0, fontFamily: FONT }}>
          Suivez la performance de votre activité
        </p>
      </div>

      {stats.total === 0 ? (
        <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", padding: "64px 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>Aucune donnée</h2>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            {view === "month"
              ? "Aucun lead reçu ce mois-ci."
              : "Aucun lead enregistré pour l'instant."}
          </p>
        </div>
      ) : (
        <>
          {/* KPIs — ligne du haut : 4 cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "12px" }}>
            {/* Leads reçus */}
            <div style={{ backgroundColor: "#eff6ff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #bfdbfe", padding: "12px 20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#3b82f6", textTransform: "uppercase", fontFamily: FONT }}>Leads reçus</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e40af", letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>{stats.total}</div>
            </div>

            {/* Score moyen */}
            <div style={{ backgroundColor: "#eff6ff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #bfdbfe", padding: "12px 20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#3b82f6", textTransform: "uppercase", fontFamily: FONT }}>Score moyen</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e40af", letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>
                {stats.avgScore != null ? stats.avgScore : "—"}
              </div>
              <div style={{ fontSize: "12px", color: "#60a5fa", marginTop: "2px", fontFamily: FONT }}>sur 100</div>
            </div>

            {/* Taux de traitement */}
            <div style={{ backgroundColor: traitementBg, borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: `1px solid ${traitementBorder}`, padding: "12px 20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: traitementColor, textTransform: "uppercase", fontFamily: FONT }}>Taux de traitement</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: traitementColor, letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>{traitementPct}%</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", fontFamily: FONT }}>
                {stats.byStatus.processed} sur {stats.total} lead{stats.total > 1 ? "s" : ""} traité{stats.byStatus.processed > 1 ? "s" : ""}
              </div>
            </div>

            {/* Haute priorité */}
            <div style={{ backgroundColor: "#fffbeb", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #fde68a", padding: "12px 20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#d97706", textTransform: "uppercase", fontFamily: FONT }}>Haute priorité</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#92400e", letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>{stats.highPriority}</div>
              <div style={{ fontSize: "12px", color: "#d97706", marginTop: "2px", fontFamily: FONT }}>
                {pct(stats.highPriority, stats.total)}% du total
              </div>
            </div>
          </div>

          {/* KPIs — ligne du bas : 3 cards plus petites */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
            {/* Traités */}
            <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #bbf7d0", padding: "12px 20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#10b981", textTransform: "uppercase", fontFamily: FONT }}>Traités</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#065f46", letterSpacing: "-0.02em", marginTop: "6px", fontFamily: FONT }}>{stats.byStatus.processed}</div>
              <div style={{ fontSize: "12px", color: "#10b981", marginTop: "2px", fontFamily: FONT }}>{pct(stats.byStatus.processed, stats.total)}% du total</div>
            </div>

            {/* À traiter */}
            <div style={{ backgroundColor: "#fffbeb", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #fde68a", padding: "12px 20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#d97706", textTransform: "uppercase", fontFamily: FONT }}>À traiter</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#92400e", letterSpacing: "-0.02em", marginTop: "6px", fontFamily: FONT }}>{aTraiterCount}</div>
              <div style={{ fontSize: "12px", color: "#d97706", marginTop: "2px", fontFamily: FONT }}>{pct(aTraiterCount, stats.total)}% du total</div>
            </div>

            {/* Incomplets */}
            <div style={{ backgroundColor: "#fef2f2", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #fecaca", padding: "12px 20px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#ef4444", textTransform: "uppercase", fontFamily: FONT }}>Incomplets</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#991b1b", letterSpacing: "-0.02em", marginTop: "6px", fontFamily: FONT }}>{stats.byStatus.incomplete}</div>
              <div style={{ fontSize: "12px", color: "#ef4444", marginTop: "2px", fontFamily: FONT }}>{pct(stats.byStatus.incomplete, stats.total)}% du total</div>
            </div>
          </div>

          {/* Breakdowns */}
          <div className="stats-breakdown-grid">
            <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: "14px", fontWeight: 600, color: "#374151", fontFamily: FONT }}>Par type de demande</div>
              <div style={{ padding: "8px 16px" }}>
                <BreakdownRow label="Dépannage" count={stats.byType.depannage} total={stats.total} colorClass="stats-progress-fill--red" />
                <BreakdownRow label="Installation" count={stats.byType.installation} total={stats.total} />
                <BreakdownRow label="Devis" count={stats.byType.devis} total={stats.total} colorClass="stats-progress-fill--green" />
                <BreakdownRow label="Autre" count={stats.byType.autre} total={stats.total} colorClass="stats-progress-fill--slate" />
                <BreakdownRow label="Non renseigné" count={stats.byType.nonRenseigne} total={stats.total} colorClass="stats-progress-fill--slate" />
              </div>
            </div>

            <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontSize: "14px", fontWeight: 600, color: "#374151", fontFamily: FONT }}>Par délai</div>
              <div style={{ padding: "8px 16px" }}>
                <BreakdownRow label="Urgent (aujourd'hui)" count={stats.byDelay.urgent} total={stats.total} colorClass="stats-progress-fill--red" />
                <BreakdownRow label="Sous 48h" count={stats.byDelay.h48} total={stats.total} colorClass="stats-progress-fill--amber" />
                <BreakdownRow label="Cette semaine" count={stats.byDelay.semaine} total={stats.total} />
                <BreakdownRow label="Pas pressé" count={stats.byDelay.flexible} total={stats.total} colorClass="stats-progress-fill--green" />
                <BreakdownRow label="Non renseigné" count={stats.byDelay.nonRenseigne} total={stats.total} colorClass="stats-progress-fill--slate" />
              </div>
            </div>
          </div>

          {/* Graphique évolution des leads */}
          <div style={{ marginTop: "16px", width: "100%", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151", fontFamily: FONT }}>Évolution des leads</span>
              <span style={{ fontSize: "12px", color: "#94a3b8", fontFamily: FONT }}>
                {view === "month" ? "Par jour — ce mois-ci" : "Par semaine — tout"}
              </span>
            </div>
            <div style={{ padding: "12px 20px" }}>
              <BarChart buckets={chartBuckets} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
