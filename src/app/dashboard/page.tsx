"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Lead, LeadsResponse, LeadStatus } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";
import { formatPhone } from "@/lib/utils";
import { ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

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

function getStatusBadgeStyle(status: LeadStatus): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "12px",
    fontWeight: 600,
    display: "inline-block",
    whiteSpace: "nowrap",
    fontFamily: FONT,
  };
  switch (status) {
    case "new":        return { ...base, backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" };
    case "incomplete": return { ...base, backgroundColor: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" };
    case "to_process": return { ...base, backgroundColor: "#fefce8", color: "#ca8a04", border: "1px solid #fef08a" };
    case "processed":  return { ...base, backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" };
  }
}

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

export default function DashboardPage() {
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("active");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hoveredChevronId, setHoveredChevronId] = useState<string | null>(null);
  const limit = 20;

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
      <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a", marginBottom: "24px", letterSpacing: "-0.01em", fontFamily: FONT }}>Leads</h1>

      <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
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
                      <span style={getStatusBadgeStyle(lead.status)}>
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
                        <span>0</span>
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
                        style={{
                          display: "flex",
                          width: "32px",
                          height: "32px",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          border: "1px solid #e2e8f0",
                          backgroundColor: hoveredChevronId === lead.id ? "#f1f5f9" : "transparent",
                          transition: "background-color 0.2s",
                          textDecoration: "none",
                          color: "#64748b",
                        }}
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
