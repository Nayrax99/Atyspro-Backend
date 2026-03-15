"use client";

import { useEffect, useState } from "react";

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
      <span className="stats-breakdown-count">{count}</span>
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
      <div className="dashboard-card">
        <div className="dashboard-loading">Chargement des statistiques…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-error">
        Erreur : {error ?? "Impossible de charger les statistiques."}
      </div>
    );
  }

  const stats = view === "month" ? data.month : data.total;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header + toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <h1 className="dashboard-page-title" style={{ marginBottom: 0 }}>
          Statistiques
        </h1>
        <div className="period-toggle">
          <button
            type="button"
            className={`period-toggle-btn${view === "month" ? " period-toggle-btn--active" : ""}`}
            onClick={() => setView("month")}
          >
            Ce mois-ci
          </button>
          <button
            type="button"
            className={`period-toggle-btn${view === "total" ? " period-toggle-btn--active" : ""}`}
            onClick={() => setView("total")}
          >
            Tout
          </button>
        </div>
      </div>

      {stats.total === 0 ? (
        <div className="dashboard-card">
          <div className="page-empty-state">
            <h2>Aucune donnée</h2>
            <p>
              {view === "month"
                ? "Aucun lead reçu ce mois-ci."
                : "Aucun lead enregistré pour l'instant."}
            </p>
          </div>
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
            <div className="dashboard-card">
              <div className="dashboard-card-header">Par type de demande</div>
              <div style={{ padding: "0.75rem 1.25rem" }}>
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

            <div className="dashboard-card">
              <div className="dashboard-card-header">Par délai</div>
              <div style={{ padding: "0.75rem 1.25rem" }}>
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
