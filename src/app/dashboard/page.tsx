"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Lead, LeadsResponse, LeadStatus } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";
import { formatPhone } from "@/lib/utils";
import { ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Search, ChevronDown } from "lucide-react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import Badge from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import ScoreCircle from "@/components/ui/ScoreCircle";
import MetierBadge from "@/components/ui/MetierBadge";
import { useDashboard } from "@/contexts/DashboardContext";
import { SKINS } from "@/theme";

const FONT = "var(--font-sans, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";
const API_BASE = "";

type SortField = "priority_score" | "created_at";
type SortDir = "asc" | "desc";
type StatusFilterValue = "active" | LeadStatus | "";

const STATUS_FILTER_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: "active",    label: "Actifs" },
  { value: "",          label: "Tous" },
  { value: "nouveau",   label: "Nouveau" },
  { value: "incomplet", label: "Incomplet" },
  { value: "a_traiter", label: "À traiter" },
  { value: "traite",    label: "Traité" },
];

const STATUS_TO_BADGE: Record<LeadStatus, BadgeVariant> = {
  nouveau:   "nouveau",
  incomplet: "incomplet",
  a_traiter: "a-traiter",
  traite:    "traite",
};

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField | null; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown size={11} style={{ opacity: 0.35 }} />;
  return sortDir === "asc"
    ? <ArrowUp size={11} style={{ color: "var(--ap-primary)" }} />
    : <ArrowDown size={11} style={{ color: "var(--ap-primary)" }} />;
}

interface StatsData {
  total: { total: number };
  month: {
    total: number;
    byStatus: { nouveau: number; a_traiter: number; incomplet: number; traite: number };
    avgScore: number | null;
    urgent: number;
  };
}

export default function DashboardPage() {
  const { skin } = useDashboard();
  const [data, setData] = useState<LeadsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("active");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchLeads = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter) params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());

    fetch(`${API_BASE}/api/leads?${params.toString()}`)
      .then((r) => r.json())
      .then((json: LeadsResponse & { error?: string }) => {
        if (cancelled) return;
        if (!json.success) { setError(json.error ?? "Erreur inconnue"); setData(null); return; }
        setData(json as LeadsResponse);
      })
      .catch((err: Error) => { if (!cancelled) { setError(err.message); setData(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, statusFilter, search]);

  useEffect(() => { const cancel = fetchLeads(); return cancel; }, [fetchLeads]);

  useEffect(() => {
    fetch("/api/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((json: { success: boolean; data?: StatsData }) => {
        if (json.success && json.data) setStatsData(json.data);
      })
      .catch(() => {});
  }, []);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  const leads = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;
  const sortedLeads = useMemo(() => {
    if (!sortField) return leads;
    return [...leads].sort((a, b) => {
      if (sortField === "priority_score") {
        return sortDir === "asc"
          ? (a.priority_score ?? -1) - (b.priority_score ?? -1)
          : (b.priority_score ?? -1) - (a.priority_score ?? -1);
      }
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortDir === "asc" ? aDate - bDate : bDate - aDate;
    });
  }, [leads, sortField, sortDir]);

  // Contextual banner data
  const pendingCount = (statsData?.month.byStatus.a_traiter ?? 0) + (statsData?.month.byStatus.nouveau ?? 0);
  const urgentCount = statsData?.month.urgent ?? 0;
  const skinConfig = SKINS[skin];

  const thHeader: React.CSSProperties = {
    padding: "9px 14px",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9CA3AF",
    background: "#F3F4F6",
    borderBottom: "0.5px solid #E5E7EB",
    whiteSpace: "nowrap",
  };

  const tdCell: React.CSSProperties = {
    padding: "13px 14px",
    borderBottom: "0.5px solid #E5E7EB",
    fontSize: 13,
    color: "#0F172A",
    verticalAlign: "middle",
  };

  return (
    <div style={{ fontFamily: FONT, width: "100%" }}>
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em", margin: 0 }}>
              Leads
            </h1>
            {/* Accent bar */}
            <div style={{ width: 40, height: 2, background: "var(--ap-primary)", borderRadius: 2, marginTop: 6 }} />
          </div>
          {/* Skin badge — droite */}
          {skin !== "core" && <MetierBadge metier={skin} />}
        </div>

        {/* Contextual banner */}
        {statsData && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}>
            <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 400 }}>
              {skinConfig.wording.pageSub}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {pendingCount > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ap-primary)",
                    background: "var(--ap-primary-light)",
                    border: "0.5px solid var(--ap-primary-border)",
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  {pendingCount} en attente
                </span>
              )}
              {urgentCount > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#DC2626",
                    background: "#FEF2F2",
                    border: "0.5px solid #FECACA",
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}
                >
                  {urgentCount} urgent{urgentCount > 1 ? "s" : ""} aujourd&apos;hui
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          border: "0.5px solid #E5E7EB",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
          animation: "ap-slide-up 0.4s ease 100ms both",
          width: "100%",
        }}
      >
        {/* Filter bar */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "0.5px solid #E5E7EB",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Search
              size={14}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }}
            />
            <input
              type="search"
              placeholder="Rechercher (nom, téléphone, adresse…)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 32px",
                border: "0.5px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: FONT,
                color: "#0F172A",
                outline: "none",
                background: "#F3F4F6",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--ap-primary)";
                e.target.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.12)";
                e.target.style.background = "#fff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.boxShadow = "none";
                e.target.style.background = "#F3F4F6";
              }}
            />
          </div>
          {/* Status filter with chevron */}
          <div style={{ position: "relative" }}>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilterValue); setPage(1); }}
              style={{
                padding: "7px 32px 7px 10px",
                border: "0.5px solid #D1D5DB",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: FONT,
                color: "#374151",
                background: "#fff",
                outline: "none",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown
              size={13}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#6B7280", pointerEvents: "none" }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", width: "100%" }}>
          {loading && !data ? (
            <LoadingSpinner text="Chargement des leads…" />
          ) : error ? (
            <div style={{ padding: "32px 24px", color: "#DC2626", fontSize: 13, fontFamily: FONT }}>
              Erreur : {error}
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: "64px 24px", textAlign: "center", fontFamily: FONT }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Aucun lead</h2>
              <p style={{ fontSize: 13, color: "#6B7280" }}>
                {statusFilter || search
                  ? "Aucun résultat pour ces critères."
                  : "Les leads issus de l'assistant vocal apparaîtront ici."}
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thHeader}>Contact</th>
                  <th style={thHeader}>Téléphone</th>
                  <th style={thHeader}>{skinConfig.wording.typeLabel}</th>
                  <th style={thHeader}>Statut</th>
                  <th
                    style={{ ...thHeader, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("priority_score")}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Score <SortIcon field="priority_score" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                  <th style={thHeader}>Relances</th>
                  <th
                    style={{ ...thHeader, cursor: "pointer", userSelect: "none" }}
                    onClick={() => handleSort("created_at")}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Date <SortIcon field="created_at" sortField={sortField} sortDir={sortDir} />
                    </span>
                  </th>
                  <th style={{ ...thHeader, width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead: Lead, idx) => {
                  const isHovered = hoveredRow === lead.id;
                  return (
                    <tr
                      key={lead.id}
                      style={{
                        background: isHovered ? "#F8FAFE" : "#fff",
                        transition: "background 0.12s ease",
                        animation: `ap-row-in 350ms ease ${300 + idx * 60}ms both`,
                      }}
                      onMouseEnter={() => setHoveredRow(lead.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td style={{ ...tdCell, fontWeight: 500 }}>
                        {lead.full_name || (
                          <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Inconnu</span>
                        )}
                      </td>
                      <td style={{ ...tdCell, color: "#6B7280" }}>
                        {formatPhone(lead.client_phone)}
                      </td>
                      <td style={tdCell}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>
                          {formatType(lead)}
                        </span>
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                          {formatDelay(lead)}
                        </div>
                      </td>
                      <td style={tdCell}>
                        <Badge variant={STATUS_TO_BADGE[lead.status]}>
                          {LEAD_STATUS_LABELS[lead.status]}
                        </Badge>
                      </td>
                      <td style={{ ...tdCell, textAlign: "center" }}>
                        <ScoreCircle score={lead.priority_score} size="md" />
                      </td>
                      <td style={{ ...tdCell, textAlign: "center" }}>
                        {lead.relance_count != null && lead.relance_count > 0 ? (
                          <Badge variant="relance">
                            {lead.relance_count} relance{lead.relance_count > 1 ? "s" : ""}
                          </Badge>
                        ) : (
                          <span style={{ color: "#D1D5DB" }}>0</span>
                        )}
                      </td>
                      <td style={{ ...tdCell, color: "#6B7280", fontSize: 12 }}>
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td style={{ ...tdCell, textAlign: "center" }}>
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: "0.5px solid #E5E7EB",
                            color: "#9CA3AF",
                            textDecoration: "none",
                            transition: "all 0.15s",
                            transform: isHovered ? "translateX(3px)" : "none",
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLAnchorElement;
                            el.style.background = "var(--ap-primary-light)";
                            el.style.color = "var(--ap-primary)";
                            el.style.borderColor = "var(--ap-primary-border)";
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLAnchorElement;
                            el.style.background = "transparent";
                            el.style.color = "#9CA3AF";
                            el.style.borderColor = "#E5E7EB";
                          }}
                        >
                          <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
              borderTop: "0.5px solid #E5E7EB",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: "#6B7280", fontFamily: FONT }}>
              {pagination.total} lead{pagination.total > 1 ? "s" : ""} · page {pagination.page} / {pagination.totalPages}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <PaginationBtn
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </PaginationBtn>
              <PaginationBtn
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </PaginationBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PaginationBtn({
  children, disabled, onClick,
}: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        border: "0.5px solid #E5E7EB",
        background: hovered && !disabled ? "#F0F2F7" : "#fff",
        fontSize: 12,
        fontWeight: 500,
        color: "#374151",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontFamily: "var(--font-sans)",
        transition: "background 0.12s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}
