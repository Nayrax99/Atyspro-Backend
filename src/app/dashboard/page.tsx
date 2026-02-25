"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lead, LeadsResponse } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";

const API_BASE = "";

function getScoreClass(score: number | null): string {
  if (score == null) return "score-cell--low";
  if (score >= 70) return "score-cell--high";
  if (score >= 40) return "score-cell--medium";
  return "score-cell--low";
}

export default function DashboardPage() {
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/leads?page=${page}&limit=${limit}`)
      .then((res) => res.json())
      .then((json: LeadsResponse & { error?: string }) => {
        if (cancelled) return;
        if (!json.success) {
          setError(json.error || "Erreur inconnue");
          setData(null);
          return;
        }
        setData(json as LeadsResponse);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Erreur réseau");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  if (loading && !data) {
    return (
      <div className="dashboard-card">
        <div className="dashboard-loading">Chargement des leads…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        Erreur : {error}. Vérifiez que l’API et Supabase sont accessibles.
      </div>
    );
  }

  const leads = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <>
      <h1 className="dashboard-page-title">Leads</h1>

      <div className="dashboard-card">
        <div className="dashboard-card-header">Liste des leads</div>
        <div className="leads-table-wrap">
          {leads.length === 0 ? (
            <div className="dashboard-empty">
              <h2>Aucun lead</h2>
              <p>
                Les leads issus des SMS Twilio apparaîtront ici. Vous pouvez
                utiliser le seed DEV pour des données de test.
              </p>
            </div>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Téléphone</th>
                  <th>Type / Délai</th>
                  <th>Statut</th>
                  <th>Score</th>
                  <th>Relances</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead: Lead) => (
                  <tr key={lead.id}>
                    <td>
                      {lead.full_name || (
                        <span className="lead-cell-empty">—</span>
                      )}
                    </td>
                    <td>{lead.client_phone || "—"}</td>
                    <td>
                      <span className="lead-job-type">
                        {formatType(lead)}
                      </span>
                      <div className="lead-request-preview">
                        {formatDelay(lead)}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge badge--${lead.status}`}
                        title={lead.status}
                      >
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`score-cell ${getScoreClass(
                          lead.priority_score,
                        )}`}
                      >
                        {lead.priority_score != null
                          ? lead.priority_score
                          : "—"}
                      </span>
                    </td>
                    <td>
                      {lead.relance_count && lead.relance_count > 0 ? (
                        <span className="badge badge--warning">
                          {lead.relance_count} relance
                          {lead.relance_count > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="lead-cell-empty">—</span>
                      )}
                    </td>
                    <td>
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString(
                            "fr-FR",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )
                        : "—"}
                    </td>
                    <td>
                      <Link href={`/dashboard/leads/${lead.id}`}>Voir</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pagination && pagination.total > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              {pagination.total} lead{pagination.total > 1 ? "s" : ""} • page{" "}
              {pagination.page} / {pagination.totalPages}
            </span>
            <div className="pagination-buttons">
              <button
                type="button"
                className="pagination-btn"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </button>
              <button
                type="button"
                className="pagination-btn"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
