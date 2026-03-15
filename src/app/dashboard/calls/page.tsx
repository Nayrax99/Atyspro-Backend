"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/utils";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

interface Call {
  id: string;
  account_id: string;
  twilio_call_sid: string;
  direction: string | null;
  from_number: string | null;
  to_number: string | null;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  lead: { id: string; full_name: string | null } | null;
}

interface CallsResponse {
  success: boolean;
  data?: Call[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}

function formatDuration(started: string | null, ended: string | null): string {
  if (!started || !ended) return "—";
  const diff = Math.floor(
    (new Date(ended).getTime() - new Date(started).getTime()) / 1000
  );
  if (diff <= 0) return "—";
  const min = Math.floor(diff / 60);
  const sec = diff % 60;
  return min > 0 ? `${min}m ${sec.toString().padStart(2, "0")}s` : `${sec}s`;
}

function callStatusClass(status: string | null): string {
  switch (status) {
    case "completed":
      return "badge badge--call-completed";
    case "no-answer":
      return "badge badge--call-no-answer";
    case "busy":
      return "badge badge--call-busy";
    case "failed":
    case "canceled":
      return "badge badge--call-failed";
    default:
      return "badge badge--call-no-answer";
  }
}

function callStatusLabel(status: string | null): string {
  switch (status) {
    case "completed":   return "Terminé";
    case "no-answer":   return "Sans réponse";
    case "busy":        return "Occupé";
    case "failed":      return "Échoué";
    case "canceled":    return "Annulé";
    case "ringing":     return "Sonnerie";
    case "in-progress":
    case "initiated":   return "En cours";
    default:            return status ?? "—";
  }
}

function directionClass(dir: string | null): string {
  return dir === "outbound"
    ? "badge badge--call-outbound"
    : "badge badge--call-inbound";
}

function directionLabel(dir: string | null): string {
  return dir === "outbound" ? "Sortant" : "Entrant";
}

const STATUS_OPTIONS = [
  { value: "",            label: "Tous les statuts" },
  { value: "completed",   label: "Terminé" },
  { value: "no-answer",   label: "Sans réponse" },
  { value: "busy",        label: "Occupé" },
  { value: "ringing",     label: "Sonnerie" },
  { value: "in-progress", label: "En cours" },
  { value: "failed",      label: "Échoué" },
  { value: "canceled",    label: "Annulé" },
];

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [pagination, setPagination] = useState<CallsResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 20;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/calls?page=${page}&limit=${limit}`, { credentials: "include" })
      .then((r) => r.json())
      .then((json: CallsResponse) => {
        if (cancelled) return;
        if (!json.success) {
          setError(json.error ?? "Erreur inconnue");
          return;
        }
        setCalls(json.data ?? []);
        setPagination(json.pagination ?? null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page]);

  const filteredCalls = useMemo(
    () =>
      statusFilter
        ? calls.filter((c) => c.status === statusFilter)
        : calls,
    [calls, statusFilter]
  );

  return (
    <div>
      <h1 className="dashboard-page-title">Appels</h1>

      <div className="dashboard-card">
        <div className="dashboard-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <span>Journal des appels</span>
          <select
            className="leads-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="leads-table-wrap">
          {loading ? (
            <LoadingSpinner text="Chargement des appels…" />
          ) : error ? (
            <div className="dashboard-error">Erreur : {error}</div>
          ) : filteredCalls.length === 0 ? (
            <div className="page-empty-state">
              {statusFilter ? (
                <>
                  <h2>Aucun appel</h2>
                  <p>Aucun appel avec ce statut.</p>
                </>
              ) : (
                <>
                  <h2>Aucun appel enregistré</h2>
                  <p>
                    Les appels entrants traités par l&apos;assistant vocal AtysPro
                    apparaîtront ici avec leur durée et statut.
                  </p>
                </>
              )}
            </div>
          ) : (
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>De</th>
                  <th>Vers</th>
                  <th>Direction</th>
                  <th>Durée</th>
                  <th>Statut</th>
                  <th>Lead</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map((call) => (
                  <tr key={call.id}>
                    <td>
                      {call.started_at
                        ? new Date(call.started_at).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td>{formatPhone(call.from_number)}</td>
                    <td>{formatPhone(call.to_number)}</td>
                    <td>
                      <span className={directionClass(call.direction)}>
                        {directionLabel(call.direction)}
                      </span>
                    </td>
                    <td>{formatDuration(call.started_at, call.ended_at)}</td>
                    <td>
                      <span className={callStatusClass(call.status)}>
                        {callStatusLabel(call.status)}
                      </span>
                    </td>
                    <td>
                      {call.lead ? (
                        <Link
                          href={`/dashboard/leads/${call.lead.id}`}
                          style={{ color: "#2563eb", fontWeight: 500, fontSize: "0.875rem" }}
                        >
                          {call.lead.full_name || (
                            <em style={{ color: "#9ca3af" }}>Inconnu</em>
                          )}
                        </Link>
                      ) : (
                        <span className="lead-cell-empty">—</span>
                      )}
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
              {pagination.total} appel{pagination.total > 1 ? "s" : ""} • page{" "}
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
    </div>
  );
}
