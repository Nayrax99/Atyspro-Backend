"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/dashboard/LoadingSpinner";

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

export default function AdminPage() {
  const [accounts, setAccounts] = useState<AccountWithLeads[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="dashboard-page-title">Administration</h1>

      {loading ? (
        <div className="dashboard-card">
          <LoadingSpinner text="Chargement des données admin…" />
        </div>
      ) : error ? (
        <div className="dashboard-error">Erreur : {error}</div>
      ) : (
        <>
          {/* KPIs globaux */}
          {stats && (
            <div className="admin-kpi-grid">
              <div className="stat-card stat-card--blue">
                <div className="stat-card-label">Artisans inscrits</div>
                <div className="stat-card-value">{stats.totalAccounts}</div>
                <div className="stat-card-sub">
                  {stats.onboardedAccounts} onboardés
                </div>
              </div>
              <div className="stat-card stat-card--blue">
                <div className="stat-card-label">Leads totaux</div>
                <div className="stat-card-value">{stats.totalLeads}</div>
              </div>
              <div className="stat-card stat-card--green">
                <div className="stat-card-label">Taux de complétion</div>
                <div className="stat-card-value">{stats.completionRate}%</div>
                <div className="stat-card-sub">
                  {stats.completeLeads} complets
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">Appels traités</div>
                <div className="stat-card-value">{stats.totalCalls}</div>
              </div>
            </div>
          )}

          {/* Tableau artisans */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              Artisans inscrits ({accounts.length})
            </div>
            <div className="leads-table-wrap">
              {accounts.length === 0 ? (
                <div className="page-empty-state">
                  <h2>Aucun artisan inscrit</h2>
                  <p>Les comptes apparaîtront ici après la première inscription.</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Entreprise</th>
                      <th>Email</th>
                      <th>Ville</th>
                      <th>Spécialité</th>
                      <th>Leads</th>
                      <th>Onboarding</th>
                      <th>Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr key={account.id}>
                        <td>{account.name ?? <span style={{ color: "#9ca3af" }}>—</span>}</td>
                        <td>{account.email ?? "—"}</td>
                        <td>{account.city ?? <span style={{ color: "#9ca3af" }}>—</span>}</td>
                        <td>
                          {account.specialty ?? (
                            <span style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            {account.lead_count}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`admin-onboarding-dot admin-onboarding-dot--${account.onboarding_completed ? "ok" : "nok"}`}
                            title={
                              account.onboarding_completed
                                ? "Onboarding terminé"
                                : "Non complété"
                            }
                          />
                        </td>
                        <td>
                          {new Date(account.created_at).toLocaleDateString(
                            "fr-FR",
                            { day: "2-digit", month: "short", year: "numeric" }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
