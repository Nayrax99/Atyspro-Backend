"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Lead, LeadsResponse, LeadStatus } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";
import { formatPhone } from "@/lib/utils";
import { ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import Card from "@/components/ui/Card";

const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";
const API_BASE = "";

type SortField = "priority_score" | "created_at";
type SortDir = "asc" | "desc";
type StatusFilterValue = "active" | LeadStatus | "";

const STATUS_FILTER_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: "active",      label: "Actifs" },
  { value: "",            label: "Tous" },
  { value: "new",         label: "Nouveau" },
  { value: "incomplete",  label: "Incomplet" },
  { value: "to_process",  label: "À traiter" },
  { value: "processed",   label: "Traité" },
];

const STATUS_BADGE_CLASSES: Record<LeadStatus, string> = {
  new: "badge badge--neutral",
  incomplete: "badge badge--danger",
  to_process: "badge badge--warning",
  processed: "badge badge--success",
};

function getScoreClass(score: number | null): string {
  if (score == null) return "score-cell--low";
  if (score >= 70) return "score-cell--high";
  if (score >= 40) return "score-cell--medium";
  return "score-cell--critical";
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField | null;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ArrowUpDown size={12} className="th-sort-icon" />;
  return sortDir === "asc" ? (
    <ArrowUp size={12} className="th-sort-icon th-sort-icon--active" />
  ) : (
    <ArrowDown size={12} className="th-sort-icon th-sort-icon--active" />
  );
}

interface HeaderStats {
  total: number;
  processed: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headerStats, setHeaderStats] = useState<HeaderStats | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("active");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hoveredChevronId, setHoveredChevronId] = useState<string | null>(null);
  const limit = 15;

  // Debounce search (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchLeads = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (statusFilter) params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());

    fetch(`${API_BASE}/api/leads?${params.toString()}`)
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
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || "Erreur réseau");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, statusFilter, search]);

  useEffect(() => {
    const cancel = fetchLeads();
    return cancel;
  }, [fetchLeads]);

  // Fetch light stats for header summary (silent — does not affect leads logic)
  useEffect(() => {
    fetch("/api/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((json: { success: boolean; data?: { total: { total: number }; month: { byStatus: { processed: number } } } }) => {
        if (json.success && json.data) {
          setHeaderStats({ total: json.data.total.total, processed: json.data.month.byStatus.processed });
        }
      })
      .catch(() => {});
  }, []);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const leads = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;

  const sortedLeads = useMemo(() => {
    if (!sortField) return leads;
    return [...leads].sort((a, b) => {
      if (sortField === "priority_score") {
        const aVal = a.priority_score ?? -1;
        const bVal = b.priority_score ?? -1;
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortDir === "asc" ? aDate - bDate : bDate - aDate;
    });
  }, [leads, sortField, sortDir]);

  return (
    <div style={{ fontFamily: FONT }}>
      <style>{`.atys-pagination-btn:hover:not(:disabled){background-color:#f8fafc!important}`}</style>
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: 0, fontFamily: FONT }}>Leads</h1>
          {headerStats && (
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500, fontFamily: FONT }}>
              {headerStats.total} lead{headerStats.total !== 1 ? "s" : ""} · {headerStats.processed} traité{headerStats.processed !== 1 ? "s" : ""} ce mois
            </span>
          )}
        </div>
        <div style={{ width: "40px", height: "3px", backgroundColor: "#2563eb", borderRadius: "2px", marginTop: "8px", marginBottom: "8px" }} />
        <p style={{ fontSize: "15px", color: "#64748b", fontWeight: 400, margin: 0, fontFamily: FONT }}>
          Vos prospects qualifiés par l&apos;assistant vocal
        </p>
      </div>

      <Card padding="none">
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", fontSize: "14px", fontWeight: 600, color: "#374151", fontFamily: FONT }}>Liste des leads</div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: "12px", padding: "16px 24px", borderBottom: "1px solid #f1f5f9", flexWrap: "wrap" }}>
          <input
            type="search"
            placeholder="Rechercher (nom, téléphone, adresse...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ flex: "1 1 240px", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", fontFamily: FONT, color: "#0f172a", outline: "none", backgroundColor: "white" }}
            className="atys-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilterValue);
              setPage(1);
            }}
            style={{ padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", fontFamily: FONT, color: "#374151", backgroundColor: "white", outline: "none", cursor: "pointer" }}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading && !data ? (
            <LoadingSpinner text="Chargement des leads…" />
          ) : error ? (
            <div style={{ padding: "32px 24px", color: "#dc2626", fontSize: "14px", fontFamily: FONT }}>
              Erreur : {error}. Vérifiez que l&apos;API et Supabase sont accessibles.
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: "64px 24px", textAlign: "center", fontFamily: FONT }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>Aucun lead</h2>
              <p style={{ fontSize: "14px", color: "#64748b" }}>
                {statusFilter || search
                  ? "Aucun résultat pour ces critères."
                  : "Les leads issus de l'assistant vocal apparaîtront ici."}
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
                  <th
                    className="th-sortable"
                    onClick={() => handleSort("priority_score")}
                  >
                    Score{" "}
                    <SortIcon field="priority_score" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th>Relances</th>
                  <th
                    className="th-sortable"
                    onClick={() => handleSort("created_at")}
                  >
                    Date{" "}
                    <SortIcon field="created_at" sortField={sortField} sortDir={sortDir} />
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead: Lead) => (
                  <tr key={lead.id}>
                    <td>
                      {lead.full_name || (
                        <span className="lead-cell-empty" style={{ fontStyle: "italic" }}>
                          Inconnu
                        </span>
                      )}
                    </td>
                    <td>{formatPhone(lead.client_phone)}</td>
                    <td>
                      <span className="lead-job-type">{formatType(lead)}</span>
                      <div className="lead-request-preview">{formatDelay(lead)}</div>
                    </td>
                    <td>
                      <span className={STATUS_BADGE_CLASSES[lead.status]}>
                        {LEAD_STATUS_LABELS[lead.status]}
                      </span>
                    </td>
                    <td>
                      <span className={`score-cell ${getScoreClass(lead.priority_score)}`}>
                        {lead.priority_score != null ? lead.priority_score : "—"}
                      </span>
                    </td>
                    <td>
                      {lead.relance_count != null && lead.relance_count > 0 ? (
                        <span className="badge badge--warning">
                          {lead.relance_count} relance{lead.relance_count > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-500">0</span>
                      )}
                    </td>
                    <td>
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        onMouseEnter={() => setHoveredChevronId(lead.id)}
                        onMouseLeave={() => setHoveredChevronId(null)}
                        className="lead-table-action"
                        style={{ width: "32px", height: "32px" }}
                      >
                        <ChevronRight size={15} />
                      </Link>
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
              {pagination.total} lead{pagination.total > 1 ? "s" : ""} • page{" "}
              {pagination.page} / {pagination.totalPages}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "13px", fontWeight: 500, color: "#334155", cursor: pagination.hasPrev ? "pointer" : "not-allowed", opacity: pagination.hasPrev ? 1 : 0.4, fontFamily: FONT }}
                className="atys-pagination-btn"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "13px", fontWeight: 500, color: "#334155", cursor: pagination.hasNext ? "pointer" : "not-allowed", opacity: pagination.hasNext ? 1 : 0.4, fontFamily: FONT }}
                className="atys-pagination-btn"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
