"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { formatPhone } from "@/lib/utils";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useDashboard } from "@/contexts/DashboardContext";

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
  kpis?: { total: number; qualified: number; avgDurationSec: number | null };
  pagination?: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
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
  const diff = Math.floor((new Date(ended).getTime() - new Date(started).getTime()) / 1000);
  if (diff <= 0) return "—";
  const min = Math.floor(diff / 60);
  const sec = diff % 60;
  return min > 0 ? `${min}m ${sec.toString().padStart(2, "0")}s` : `${sec}s`;
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

function CallStatusBadge({ status }: { status: string | null }) {
  const styles: Record<string, { bg: string; color: string }> = {
    completed:      { bg: "#DCFCE7", color: "#15803D" },
    "no-answer":    { bg: "#F1F5F9", color: "#64748B" },
    busy:           { bg: "#FFFBEB", color: "#D97706" },
    failed:         { bg: "#FEF2F2", color: "#DC2626" },
    canceled:       { bg: "#FEF2F2", color: "#DC2626" },
    ringing:        { bg: "#EFF6FF", color: "#2563EB" },
    "in-progress":  { bg: "#EFF6FF", color: "#2563EB" },
    initiated:      { bg: "#EFF6FF", color: "#2563EB" },
  };
  const s = styles[status ?? ""] ?? { bg: "#F1F5F9", color: "#64748B" };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: s.bg, color: s.color, letterSpacing: "0.02em" }}>
      {callStatusLabel(status)}
    </span>
  );
}

type DirectionFilter = "" | "inbound" | "outbound";
type QualificationFilter = "" | "qualifie" | "non_qualifie";

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card padding={20} style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "var(--ap-primary)", borderRadius: "14px 14px 0 0" }} />
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#94A3B8", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 6 }}>{sub}</div>}
    </Card>
  );
}

export default function CallsPage() {
  const { skin } = useDashboard();
  void skin;

  const [calls, setCalls] = useState<Call[]>([]);
  const [kpis, setKpis] = useState<CallsResponse["kpis"] | null>(null);
  const [pagination, setPagination] = useState<CallsResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("");
  const [qualificationFilter, setQualificationFilter] = useState<QualificationFilter>("");
  const limit = 15;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/calls?page=${page}&limit=${limit}`, { credentials: "include" })
      .then((r) => r.json())
      .then((json: CallsResponse) => {
        if (cancelled) return;
        if (!json.success) { setError(json.error ?? "Erreur inconnue"); return; }
        setCalls(json.data ?? []);
        setKpis(json.kpis ?? null);
        setPagination(json.pagination ?? null);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page]);

  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      if (directionFilter === "inbound" && c.direction !== "inbound") return false;
      if (directionFilter === "outbound" && c.direction !== "outbound") return false;
      if (qualificationFilter === "qualifie" && c.lead == null) return false;
      if (qualificationFilter === "non_qualifie" && c.lead != null) return false;
      return true;
    });
  }, [calls, directionFilter, qualificationFilter]);

  const TH: React.CSSProperties = { padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94A3B8", textAlign: "left", background: "#F8FAFC", borderBottom: "0.5px solid #E5E7EB", whiteSpace: "nowrap" };
  const TD: React.CSSProperties = { padding: "12px 16px", fontSize: 13, color: "#374151", borderBottom: "0.5px solid #F1F5F9", whiteSpace: "nowrap" };

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0 }}>Appels</h1>
        <div style={{ width: 32, height: 2, background: "var(--ap-primary)", borderRadius: 2, marginTop: 6, marginBottom: 6 }} />
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Historique des appels reçus sur votre numéro pro</p>
      </div>

      {/* KPIs */}
      {kpis && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          <KpiCard label="Appels total" value={kpis.total} />
          <KpiCard
            label="Qualifiés"
            value={kpis.qualified}
            sub={kpis.total > 0 ? `${Math.round((kpis.qualified / kpis.total) * 100)}% des appels` : undefined}
          />
          <KpiCard label="Durée moyenne" value={formatAvgDuration(kpis.avgDurationSec)} sub="appels terminés" />
        </div>
      )}

      {/* Table card */}
      <Card padding="none">
        {/* Toolbar */}
        <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Journal des appels</span>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value as DirectionFilter)}
                style={{ height: 34, padding: "0 32px 0 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-sans)", color: "#374151", background: "#fff", appearance: "none", cursor: "pointer", outline: "none" }}
              >
                <option value="">Tous</option>
                <option value="inbound">Entrant</option>
                <option value="outbound">Sortant</option>
              </select>
              <ChevronDown size={13} color="#94A3B8" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <div style={{ position: "relative" }}>
              <select
                value={qualificationFilter}
                onChange={(e) => setQualificationFilter(e.target.value as QualificationFilter)}
                style={{ height: 34, padding: "0 32px 0 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-sans)", color: "#374151", background: "#fff", appearance: "none", cursor: "pointer", outline: "none" }}
              >
                <option value="">Tous</option>
                <option value="qualifie">Qualifié</option>
                <option value="non_qualifie">Non qualifié</option>
              </select>
              <ChevronDown size={13} color="#94A3B8" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <LoadingSpinner text="Chargement des appels…" />
          ) : error ? (
            <div style={{ padding: "32px 24px", color: "#DC2626", fontSize: 13 }}>Erreur : {error}</div>
          ) : filteredCalls.length === 0 ? (
            <div style={{ padding: "64px 24px", textAlign: "center" }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Aucun appel{(directionFilter || qualificationFilter) ? " avec ces filtres" : ""}</h2>
              {!directionFilter && !qualificationFilter && <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Les appels traités par l&apos;assistant vocal apparaîtront ici.</p>}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={TH}>Date</th>
                  <th style={TH}>De</th>
                  <th style={TH}>Vers</th>
                  <th style={TH}>Direction</th>
                  <th style={TH}>Durée</th>
                  <th style={TH}>Statut</th>
                  <th style={TH}>Lead</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalls.map((call) => (
                  <tr key={call.id}>
                    <td style={TD}>
                      {call.started_at
                        ? new Date(call.started_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td style={TD}>{formatPhone(call.from_number)}</td>
                    <td style={TD}>{formatPhone(call.to_number)}</td>
                    <td style={TD}>
                      {call.direction === "outbound" ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: "#F3F4F6", color: "#6B7280", border: "1px solid #D1D5DB" }}>
                          Sortant
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20, background: "var(--ap-primary-light, #EFF6FF)", color: "var(--ap-primary)", border: "1px solid var(--ap-primary-border, #BFDBFE)" }}>
                          Entrant
                        </span>
                      )}
                    </td>
                    <td style={TD}>{formatDuration(call.started_at, call.ended_at)}</td>
                    <td style={TD}><CallStatusBadge status={call.status} /></td>
                    <td style={TD}>
                      {call.lead ? (
                        <Link href={`/dashboard/leads/${call.lead.id}`} style={{ color: "var(--ap-primary)", fontWeight: 600, fontSize: 12, textDecoration: "none" }}>
                          {call.lead.full_name || <em style={{ color: "#9CA3AF", fontStyle: "italic" }}>Inconnu</em>}
                        </Link>
                      ) : (
                        <span style={{ color: "#D1D5DB" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.total > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "0.5px solid #E5E7EB", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>
              {pagination.total} appel{pagination.total > 1 ? "s" : ""} · page {pagination.page}/{pagination.totalPages}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
              <Button variant="ghost" size="sm" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}>Suivant</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
