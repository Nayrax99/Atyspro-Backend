"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

const FONT = "'Plus Jakarta Sans', -apple-system, sans-serif";

interface AccountWithLeads {
  id: string;
  name: string | null;
  email: string | null;
  city: string | null;
  specialty: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
  lead_count: number;
}

interface GlobalStats {
  totalAccounts: number;
  onboardedAccounts: number;
  totalLeads: number;
  completeLeads: number;
  completionRate: number;
  totalCalls: number;
}

interface OverviewResponse {
  success: boolean;
  data?: {
    accounts: AccountWithLeads[];
    stats: GlobalStats;
  };
  error?: string;
}

const TH: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 700,
  color: "#64748b",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
  fontFamily: FONT,
  backgroundColor: "#f8fafc",
};

function AccountRow({ account }: { account: AccountWithLeads }) {
  const [hovered, setHovered] = useState(false);
  const TD: React.CSSProperties = {
    padding: "12px 12px",
    borderBottom: "1px solid #f1f5f9",
    fontFamily: FONT,
    fontSize: "13px",
    color: "#374151",
    verticalAlign: "middle",
  };
  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: hovered ? "#f8fafc" : "white", transition: "background-color 0.1s" }}
    >
      <td style={{ ...TD, fontWeight: 500, color: "#0f172a" }}>
        {account.name ?? <span style={{ color: "#9ca3af", fontStyle: "italic" }}>—</span>}
      </td>
      <td style={{ ...TD, color: "#64748b" }}>{account.email ?? "—"}</td>
      <td style={TD}>{account.city ?? <span style={{ color: "#9ca3af" }}>—</span>}</td>
      <td style={TD}>{account.specialty ?? <span style={{ color: "#9ca3af" }}>—</span>}</td>
      <td style={{ ...TD, fontWeight: 600, color: "#0f172a" }}>{account.lead_count}</td>
      <td style={TD}>
        <span
          title={account.onboarding_completed ? "Onboarding terminé" : "Non complété"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 500,
            color: account.onboarding_completed ? "#059669" : "#94a3b8",
            fontFamily: FONT,
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: account.onboarding_completed ? "#10b981" : "#cbd5e1",
              flexShrink: 0,
            }}
          />
          {account.onboarding_completed ? "Terminé" : "En attente"}
        </span>
      </td>
      <td style={{ ...TD, color: "#64748b" }}>
        {new Date(account.created_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>
    </tr>
  );
}

const ADMIN_PAGE_SIZE = 20;

export default function AdminPage() {
  const [accounts, setAccounts] = useState<AccountWithLeads[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/admin/overview", { credentials: "include" })
      .then((r) => r.json())
      .then((json: OverviewResponse) => {
        if (!json.success || !json.data) {
          setError(json.error ?? "Impossible de charger les données admin.");
          return;
        }
        setAccounts(json.data.accounts);
        setStats(json.data.stats);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(accounts.length / ADMIN_PAGE_SIZE));
  const pagedAccounts = accounts.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);

  const traitementPct = stats?.completionRate ?? 0;
  const traitementColor = traitementPct >= 70 ? "#10b981" : traitementPct >= 40 ? "#f59e0b" : "#ef4444";
  const traitementBg = traitementPct >= 70 ? "#f0fdf4" : traitementPct >= 40 ? "#fffbeb" : "#fef2f2";
  const traitementBorder = traitementPct >= 70 ? "#bbf7d0" : traitementPct >= 40 ? "#fde68a" : "#fecaca";

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: 0, fontFamily: FONT }}>
          Administration
        </h1>
        <div style={{ width: "40px", height: "3px", backgroundColor: "#2563eb", borderRadius: "2px", marginTop: "8px", marginBottom: "8px" }} />
        <p style={{ fontSize: "15px", color: "#64748b", fontWeight: 400, margin: 0, fontFamily: FONT }}>
          Vue d&apos;ensemble de la plateforme
        </p>
      </div>

      {loading ? (
        <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", padding: "32px" }}>
          <LoadingSpinner text="Chargement des données admin…" />
        </div>
      ) : error ? (
        <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "14px", fontFamily: FONT }}>
          Erreur : {error}
        </div>
      ) : (
        <>
          {/* KPI grid — 4 cards */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {/* Artisans inscrits */}
              <div style={{ backgroundColor: "#eff6ff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #bfdbfe", padding: "16px 20px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#3b82f6", textTransform: "uppercase", fontFamily: FONT }}>Artisans inscrits</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e40af", letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>{stats.totalAccounts}</div>
                <div style={{ fontSize: "12px", color: "#60a5fa", marginTop: "2px", fontFamily: FONT }}>{stats.onboardedAccounts} onboardés</div>
              </div>

              {/* Leads totaux */}
              <div style={{ backgroundColor: "#eff6ff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #bfdbfe", padding: "16px 20px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#3b82f6", textTransform: "uppercase", fontFamily: FONT }}>Leads totaux</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e40af", letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>{stats.totalLeads}</div>
              </div>

              {/* Taux de traitement */}
              <div style={{ backgroundColor: traitementBg, borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: `1px solid ${traitementBorder}`, padding: "16px 20px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: traitementColor, textTransform: "uppercase", fontFamily: FONT }}>Taux de traitement</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: traitementColor, letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>{traitementPct}%</div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", fontFamily: FONT }}>{stats.completeLeads} traités</div>
              </div>

              {/* Appels traités */}
              <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", padding: "16px 20px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#64748b", textTransform: "uppercase", fontFamily: FONT }}>Appels traités</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", marginTop: "8px", fontFamily: FONT }}>{stats.totalCalls}</div>
              </div>
            </div>
          )}

          {/* Table artisans */}
          <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", fontSize: "14px", fontWeight: 600, color: "#374151", fontFamily: FONT }}>
              Artisans inscrits ({accounts.length})
            </div>


            {accounts.length === 0 ? (
              <div style={{ padding: "64px 24px", textAlign: "center", fontFamily: FONT }}>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#0f172a", marginBottom: "8px" }}>Aucun artisan inscrit</h2>
                <p style={{ fontSize: "14px", color: "#64748b" }}>Les comptes apparaîtront ici après la première inscription.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT }}>
                  <thead>
                    <tr>
                      <th style={TH}>Entreprise</th>
                      <th style={TH}>Email</th>
                      <th style={TH}>Ville</th>
                      <th style={TH}>Spécialité</th>
                      <th style={{ ...TH, textAlign: "center" }}>Leads</th>
                      <th style={TH}>Onboarding</th>
                      <th style={TH}>Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAccounts.map((account) => (
                      <AccountRow key={account.id} account={account} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {accounts.length > ADMIN_PAGE_SIZE && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: "12px" }}>
                <span style={{ fontSize: "13px", color: "#64748b", fontFamily: FONT }}>
                  {accounts.length} artisan{accounts.length > 1 ? "s" : ""} • page {page} / {totalPages}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "13px", fontWeight: 500, color: page > 1 ? "#374151" : "#94a3b8", cursor: page > 1 ? "pointer" : "not-allowed", fontFamily: FONT }}
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "13px", fontWeight: 500, color: page < totalPages ? "#374151" : "#94a3b8", cursor: page < totalPages ? "pointer" : "not-allowed", fontFamily: FONT }}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
