"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface AccountWithLeads {
  id: string;
  name: string | null;
  email: string | null;
  city: string | null;
  specialty: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
  lead_count: number;
  pro_phone: string | null;
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
  data?: { accounts: AccountWithLeads[]; stats: GlobalStats };
  error?: string;
}

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

const TH: React.CSSProperties = { padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94A3B8", textAlign: "left", background: "#F8FAFC", borderBottom: "0.5px solid #E5E7EB", whiteSpace: "nowrap" };
const TD: React.CSSProperties = { padding: "12px 16px", fontSize: 13, color: "#374151", borderBottom: "0.5px solid #F1F5F9", verticalAlign: "middle" };

function AccountRow({ account }: { account: AccountWithLeads }) {
  const [hovered, setHovered] = useState(false);
  return (
    <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background: hovered ? "#F8FAFC" : "#fff", transition: "background 0.1s" }}>
      <td style={{ ...TD, fontWeight: 600, color: "#0F172A" }}>{account.name ?? <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>—</span>}</td>
      <td style={{ ...TD, color: "#64748B" }}>{account.email ?? "—"}</td>
      <td style={TD}>{account.city ?? <span style={{ color: "#9CA3AF" }}>—</span>}</td>
      <td style={TD}>{account.specialty ?? <span style={{ color: "#9CA3AF" }}>—</span>}</td>
      <td style={{ ...TD, color: "#64748B", fontFamily: "monospace", fontSize: 12 }}>{account.pro_phone ?? <span style={{ color: "#9CA3AF" }}>—</span>}</td>
      <td style={{ ...TD, fontWeight: 700, textAlign: "center" }}>{account.lead_count}</td>
      <td style={TD}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: account.onboarding_completed ? "#059669" : "#94A3B8" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: account.onboarding_completed ? "#10B981" : "#CBD5E1", flexShrink: 0 }} />
          {account.onboarding_completed ? "Terminé" : "En attente"}
        </span>
      </td>
      <td style={{ ...TD, color: "#94A3B8" }}>
        {new Date(account.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
      </td>
    </tr>
  );
}

const PAGE_SIZE = 20;

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
        if (!json.success || !json.data) { setError(json.error ?? "Erreur admin."); return; }
        setAccounts(json.data.accounts);
        setStats(json.data.stats);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(accounts.length / PAGE_SIZE));
  const paged = accounts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0 }}>Administration</h1>
        <div style={{ width: 32, height: 2, background: "var(--ap-primary)", borderRadius: 2, marginTop: 6, marginBottom: 6 }} />
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Vue d&apos;ensemble de la plateforme</p>
      </div>

      {loading ? (
        <Card padding={32}><LoadingSpinner text="Chargement…" /></Card>
      ) : error ? (
        <div style={{ padding: 16, borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13 }}>Erreur : {error}</div>
      ) : (
        <>
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              <KpiCard label="Artisans inscrits" value={stats.totalAccounts} sub={`${stats.onboardedAccounts} onboardés`} />
              <KpiCard label="Leads totaux" value={stats.totalLeads} sub={`${stats.completeLeads} traités`} />
              <KpiCard label="Taux de traitement" value={`${stats.completionRate}%`} />
              <KpiCard label="Appels traités" value={stats.totalCalls} />
            </div>
          )}

          <Card padding="none">
            <div style={{ padding: "14px 20px", borderBottom: "0.5px solid #E5E7EB" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Artisans inscrits ({accounts.length})</span>
            </div>

            {accounts.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>Aucun artisan inscrit.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={TH}>Entreprise</th>
                      <th style={TH}>Email</th>
                      <th style={TH}>Ville</th>
                      <th style={TH}>Spécialité</th>
                      <th style={TH}>N° Pro</th>
                      <th style={{ ...TH, textAlign: "center" }}>Leads</th>
                      <th style={TH}>Onboarding</th>
                      <th style={TH}>Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((account) => (
                      <AccountRow key={account.id} account={account} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {accounts.length > PAGE_SIZE && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "0.5px solid #E5E7EB", flexWrap: "wrap", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>{accounts.length} artisan{accounts.length > 1 ? "s" : ""} · page {page}/{totalPages}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
                  <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Suivant</Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
