"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";

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

interface StatsResponse {
  success: boolean;
  data?: { total: StatsResult; month: StatsResult };
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

export default function StatsPage() {
  const [data, setData] = useState<{
    total: StatsResult;
    month: StatsResult;
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

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header + toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em", margin: 0, fontFamily: FONT }}>
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
          {/* KPIs principaux */}
          <div className="stats-grid">
            <div className="stat-card stat-card--blue">
              <div className="stat-card-label">Leads reçus</div>
              <div className="stat-card-value">{stats.total}</div>
            </div>
            <div className="stat-card stat-card--blue">
              <div className="stat-card-label">Score moyen</div>
              <div className="stat-card-value">
                {stats.avgScore != null ? stats.avgScore : "—"}
              </div>
              <div className="stat-card-sub">sur 100</div>
            </div>
            <div className="stat-card stat-card--amber">
              <div className="stat-card-label">Haute priorité</div>
              <div className="stat-card-value">{stats.highPriority}</div>
              <div className="stat-card-sub">
                {pct(stats.highPriority, stats.total)}% du total
              </div>
            </div>
            <div className="stat-card stat-card--green">
              <div className="stat-card-label">Complets</div>
              <div className="stat-card-value">{stats.byStatus.complete}</div>
              <div className="stat-card-sub">
                {pct(stats.byStatus.complete, stats.total)}% du total
              </div>
            </div>
            <div className="stat-card stat-card--amber">
              <div className="stat-card-label">Incomplets</div>
              <div className="stat-card-value">{stats.byStatus.incomplete}</div>
            </div>
            <div className="stat-card stat-card--red">
              <div className="stat-card-label">À vérifier</div>
              <div className="stat-card-value">
                {stats.byStatus.needs_review}
              </div>
            </div>
          </div>

          {/* Breakdowns */}
          <div className="stats-breakdown-grid">
            <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", fontSize: "14px", fontWeight: 600, color: "#374151", fontFamily: FONT }}>Par type de demande</div>
              <div style={{ padding: "12px 24px" }}>
                <BreakdownRow
                  label="Dépannage"
                  count={stats.byType.depannage}
                  total={stats.total}
                  colorClass="stats-progress-fill--red"
                />
                <BreakdownRow
                  label="Installation"
                  count={stats.byType.installation}
                  total={stats.total}
                />
                <BreakdownRow
                  label="Devis"
                  count={stats.byType.devis}
                  total={stats.total}
                  colorClass="stats-progress-fill--green"
                />
                <BreakdownRow
                  label="Autre"
                  count={stats.byType.autre}
                  total={stats.total}
                  colorClass="stats-progress-fill--slate"
                />
                <BreakdownRow
                  label="Non renseigné"
                  count={stats.byType.nonRenseigne}
                  total={stats.total}
                  colorClass="stats-progress-fill--slate"
                />
              </div>
            </div>

            <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", fontSize: "14px", fontWeight: 600, color: "#374151", fontFamily: FONT }}>Par délai</div>
              <div style={{ padding: "12px 24px" }}>
                <BreakdownRow
                  label="Urgent (aujourd'hui)"
                  count={stats.byDelay.urgent}
                  total={stats.total}
                  colorClass="stats-progress-fill--red"
                />
                <BreakdownRow
                  label="Sous 48h"
                  count={stats.byDelay.h48}
                  total={stats.total}
                  colorClass="stats-progress-fill--amber"
                />
                <BreakdownRow
                  label="Cette semaine"
                  count={stats.byDelay.semaine}
                  total={stats.total}
                />
                <BreakdownRow
                  label="Pas pressé"
                  count={stats.byDelay.flexible}
                  total={stats.total}
                  colorClass="stats-progress-fill--green"
                />
                <BreakdownRow
                  label="Non renseigné"
                  count={stats.byDelay.nonRenseigne}
                  total={stats.total}
                  colorClass="stats-progress-fill--slate"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
