"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Lead, LeadsResponse, LeadStatus } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";
import { formatPhone } from "@/lib/utils";
import { ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

const API_BASE = "";

type SortField = "priority_score" | "created_at";
type SortDir = "asc" | "desc";

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
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const limit = 20;

  // Debounce de la recherche (400ms)
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
    <div>
      <h1 className="dashboard-page-title">Leads</h1>

      <div className="dashboard-card">
        <div className="dashboard-card-header">Liste des leads</div>

        {/* Barre de filtres */}
        <div className="leads-filter-bar">
          <input
            type="search"
            className="leads-search-input"
            placeholder="Rechercher (nom, téléphone, adresse...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            className="leads-filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as LeadStatus | "");
              setPage(1);
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="complete">Complets</option>
            <option value="incomplete">Incomplets</option>
            <option value="needs_review">À vérifier</option>
          </select>
        </div>

        <div className="leads-table-wrap">
          {loading && !data ? (
            <LoadingSpinner text="Chargement des leads…" />
          ) : error ? (
            <div className="dashboard-error">
              Erreur : {error}. Vérifiez que l&apos;API et Supabase sont
              accessibles.
            </div>
          ) : leads.length === 0 ? (
            <div className="dashboard-empty">
              <h2>Aucun lead</h2>
              <p>
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
                    <SortIcon
                      field="priority_score"
                      sortField={sortField}
                      sortDir={sortDir}
                    />
                  </th>
                  <th>Relances</th>
                  <th
                    className="th-sortable"
                    onClick={() => handleSort("created_at")}
                  >
                    Date{" "}
                    <SortIcon
                      field="created_at"
                      sortField={sortField}
                      sortDir={sortDir}
                    />
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead: Lead) => (
                  <tr key={lead.id}>
                    <td>
                      {lead.full_name || (
                        <span
                          className="lead-cell-empty"
                          style={{ fontStyle: "italic" }}
                        >
                          Inconnu
                        </span>
                      )}
                    </td>
                    <td>{formatPhone(lead.client_phone)}</td>
                    <td>
                      <span className="lead-job-type">{formatType(lead)}</span>
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
                        className={`score-cell ${getScoreClass(lead.priority_score)}`}
                      >
                        {lead.priority_score != null
                          ? lead.priority_score
                          : "—"}
                      </span>
                    </td>
                    <td>
                      {lead.relance_count != null && lead.relance_count > 0 ? (
                        <span className="badge badge--warning">
                          {lead.relance_count} relance
                          {lead.relance_count > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span>0</span>
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
                            }
                          )
                        : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/leads/${lead.id}`}
                        className="lead-table-action"
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
    </div>
  );
}
