"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { formatPhone } from "@/lib/utils";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";

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
  kpis?: {
    total: number;
    qualified: number;
    avgDurationSec: number | null;
  };
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

function formatAvgDuration(sec: number | null): string {
  if (sec === null) return "—";
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return min > 0 ? `${min}m ${s.toString().padStart(2, "0")}s` : `${s}s`;
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

// Business-level filter options (mapped from raw Twilio statuses on the frontend)
type BusinessFilter = "" | "termine" | "qualifie" | "non_qualifie";

const FILTER_OPTIONS: { value: BusinessFilter; label: string }[] = [
  { value: "",             label: "Tous les statuts" },
  { value: "termine",      label: "Terminé" },
  { value: "qualifie",     label: "Qualifié" },
  { value: "non_qualifie", label: "Non qualifié" },
];

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [kpis, setKpis] = useState<CallsResponse["kpis"] | null>(null);
  const [pagination, setPagination] = useState<CallsResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BusinessFilter>("");
  const limit = 15;

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
        setKpis(json.kpis ?? null);
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

  const filteredCalls = useMemo(() => {
    if (!statusFilter) return calls;

    if (statusFilter === "termine") {
      // Artisan answered: completed with a positive duration
      return calls.filter((c) => {
        if (c.status !== "completed") return false;
        const dur = c.started_at && c.ended_at
          ? Math.floor((new Date(c.ended_at).getTime() - new Date(c.started_at).getTime()) / 1000)
          : 0;
        return dur > 0;
      });
    }

    if (statusFilter === "qualifie") {
      // Missed call but assistant created a lead (lead != null ≈ qualification happened)
      return calls.filter((c) => c.status === "completed" && c.lead != null);
    }

    // non_qualifie: everything else (no-answer, busy, failed, canceled, ringing, or completed without lead)
    return calls.filter((c) => {
      if (c.status === "completed" && c.lead != null) return false;
      if (c.status === "completed") {
        const dur = c.started_at && c.ended_at
          ? Math.floor((new Date(c.ended_at).getTime() - new Date(c.started_at).getTime()) / 1000)
          : 0;
        if (dur > 0) return false;
      }
      return true;
    });
  }, [calls, statusFilter]);

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: 0, fontFamily: FONT }}>Appels</h1>
        <div style={{ width: "40px", height: "3px", backgroundColor: "#2563eb", borderRadius: "2px", marginTop: "8px", marginBottom: "8px" }} />
        <p style={{ fontSize: "15px", color: "#64748b", fontWeight: 400, margin: 0, fontFamily: FONT }}>
          Historique des appels reçus sur votre numéro pro
        </p>
      </div>

      {/* KPI cards */}
      {kpis && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", padding: "12px 20px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase" as const, fontFamily: FONT }}>Appels total</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>{kpis.total}</div>
          </div>
          <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #bbf7d0", padding: "12px 20px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#10b981", textTransform: "uppercase" as const, fontFamily: FONT }}>Qualifiés</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#065f46", letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>{kpis.qualified}</div>
            <div style={{ fontSize: "12px", color: "#10b981", marginTop: "2px", fontFamily: FONT }}>
              {kpis.total > 0 ? Math.round((kpis.qualified / kpis.total) * 100) : 0}% des appels
            </div>
          </div>
          <div style={{ backgroundColor: "#eff6ff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #bfdbfe", padding: "12px 20px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#3b82f6", textTransform: "uppercase" as const, fontFamily: FONT }}>Durée moyenne</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e40af", letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>{formatAvgDuration(kpis.avgDurationSec)}</div>
            <div style={{ fontSize: "12px", color: "#60a5fa", marginTop: "2px", fontFamily: FONT }}>appels terminés</div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151", fontFamily: FONT }}>Journal des appels</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BusinessFilter)}
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px", fontFamily: FONT, color: "#374151", backgroundColor: "white", cursor: "pointer", outline: "none" }}
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <LoadingSpinner text="Chargement des appels…" />
          ) : error ? (
            <div style={{ padding: "32px 24px", color: "#dc2626", fontSize: "14px", fontFamily: FONT }}>Erreur : {error}</div>
          ) : filteredCalls.length === 0 ? (
            <div style={{ padding: "64px 24px", textAlign: "center", fontFamily: FONT }}>
              {statusFilter ? (
                <>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>Aucun appel</h2>
                  <p style={{ fontSize: "14px", color: "#64748b" }}>Aucun appel avec ce statut.</p>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>Aucun appel enregistré</h2>
                  <p style={{ fontSize: "14px", color: "#64748b" }}>
                    Les appels entrants traités par l&apos;assistant vocal AtysPro apparaîtront ici avec leur durée et statut.
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontFamily: FONT }}>
              {pagination.total} appel{pagination.total > 1 ? "s" : ""} • page{" "}
              {pagination.page} / {pagination.totalPages}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "13px", fontWeight: 500, color: pagination.hasPrev ? "#374151" : "#94a3b8", cursor: pagination.hasPrev ? "pointer" : "not-allowed", fontFamily: FONT }}
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "13px", fontWeight: 500, color: pagination.hasNext ? "#374151" : "#94a3b8", cursor: pagination.hasNext ? "pointer" : "not-allowed", fontFamily: FONT }}
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
