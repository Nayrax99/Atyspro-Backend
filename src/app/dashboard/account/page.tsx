"use client";

import { useEffect, useState, type FormEvent } from "react";

type Tab = "profil" | "parametres" | "abonnement";

interface AccountData {
  id: string;
  name: string | null;
  email: string | null;
  owner_phone: string | null;
  city: string | null;
  specialty: string | null;
}

interface AccountResponse {
  success: boolean;
  data?: AccountData;
  error?: string;
}

export default function AccountPage() {
  const [tab, setTab] = useState<Tab>("profil");
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Champs du formulaire profil
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Auto-efface le message de confirmation après 3s
  useEffect(() => {
    if (!saveMsg) return;
    const t = setTimeout(() => setSaveMsg(null), 3000);
    return () => clearTimeout(t);
  }, [saveMsg]);

  useEffect(() => {
    fetch("/api/account", { credentials: "include" })
      .then((r) => r.json())
      .then((json: AccountResponse) => {
        if (!json.success || !json.data) {
          setError(json.error ?? "Impossible de charger le compte.");
          return;
        }
        setAccount(json.data);
        setName(json.data.name ?? "");
        setCity(json.data.city ?? "");
        setSpecialty(json.data.specialty ?? "");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfil = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, city, specialty }),
      });
      const json = (await res.json()) as AccountResponse;

      if (!json.success) {
        setSaveMsg({ type: "err", text: json.error ?? "Erreur lors de la sauvegarde." });
        return;
      }

      if (json.data) setAccount(json.data);
      setSaveMsg({ type: "ok", text: "Profil mis à jour." });
    } catch {
      setSaveMsg({ type: "err", text: "Erreur réseau. Réessayez." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="dashboard-page-title">Compte</h1>
        <div className="dashboard-card">
          <div className="dashboard-loading">Chargement…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="dashboard-page-title">Compte</h1>
        <div className="dashboard-error">Erreur : {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="dashboard-page-title">Compte</h1>

      <div className="dashboard-card">
        {/* Onglets */}
        <div style={{ padding: "0 1.25rem" }}>
        <div className="account-tabs">
          {(["profil", "parametres", "abonnement"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`account-tab${tab === t ? " account-tab--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "profil" && "Profil"}
              {t === "parametres" && "Paramètres"}
              {t === "abonnement" && "Abonnement"}
            </button>
          ))}
        </div>
        </div>

        <div style={{ padding: "1.5rem 1.25rem" }}>
          {/* ── Onglet Profil ── */}
          {tab === "profil" && (
            <form onSubmit={handleSaveProfil}>
              <div className="account-form-group">
                <label className="account-form-label">Adresse email</label>
                <input
                  type="email"
                  className="account-form-input"
                  value={account?.email ?? "—"}
                  disabled
                />
              </div>

              <div className="account-form-group">
                <label className="account-form-label">Nom de l&apos;entreprise</label>
                <input
                  type="text"
                  className="account-form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Électricité Dupont"
                />
              </div>

              <div className="account-form-group">
                <label className="account-form-label">Téléphone propriétaire</label>
                <input
                  type="tel"
                  className="account-form-input"
                  value={account?.owner_phone ?? ""}
                  disabled
                />
                <p style={{ fontSize: "0.775rem", color: "#9ca3af", marginTop: "0.3rem" }}>
                  Modifiable depuis l&apos;onboarding.
                </p>
              </div>

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
              >
                <div className="account-form-group">
                  <label className="account-form-label">Ville</label>
                  <input
                    type="text"
                    className="account-form-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex : Lyon"
                  />
                </div>
                <div className="account-form-group">
                  <label className="account-form-label">Spécialité</label>
                  <input
                    type="text"
                    className="account-form-input"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex : Électricien"
                  />
                </div>
              </div>

              {saveMsg && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    marginBottom: "1rem",
                    color: saveMsg.type === "ok" ? "#059669" : "#b91c1c",
                  }}
                >
                  {saveMsg.text}
                </p>
              )}

              <button type="submit" className="account-save-btn" disabled={saving}>
                {saving ? "Sauvegarde…" : "Enregistrer"}
              </button>
            </form>
          )}

          {/* ── Onglet Paramètres ── */}
          {tab === "parametres" && (
            <div>
              <div className="account-form-group">
                <label className="account-form-label">Numéro Twilio assigné</label>
                <input
                  type="text"
                  className="account-form-input"
                  value="Non assigné"
                  disabled
                />
                <p style={{ fontSize: "0.775rem", color: "#9ca3af", marginTop: "0.3rem" }}>
                  Le numéro professionnel est attribué par l&apos;équipe AtysPro lors
                  de l&apos;activation.
                </p>
              </div>

              <div className="account-form-group">
                <label className="account-form-label">ID du compte</label>
                <input
                  type="text"
                  className="account-form-input"
                  value={account?.id ?? "—"}
                  disabled
                />
              </div>
            </div>
          )}

          {/* ── Onglet Abonnement ── */}
          {tab === "abonnement" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <span className="account-plan-badge">Bêta gratuite</span>
                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Accès complet pendant la phase bêta
                </span>
              </div>

              <div className="dashboard-card-header" style={{ padding: 0, marginBottom: "1rem" }}>
                Fonctionnalités incluses
              </div>

              <div>
                {[
                  "Capture automatique des appels manqués",
                  "Qualification SMS automatique des clients",
                  "Scoring de priorité (0-100)",
                  "Dashboard leads en temps réel",
                  "Application mobile iOS & Android",
                  "Jusqu'à 2 relances de correction",
                ].map((feature) => (
                  <div key={feature} className="account-plan-feature">
                    <span className="account-plan-feature-check">&#10003;</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <p
                style={{
                  marginTop: "1.5rem",
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                  lineHeight: 1.6,
                }}
              >
                Le pricing définitif sera communiqué avant la sortie officielle.
                En tant que bêta testeur, vous bénéficierez d&apos;une offre
                préférentielle.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
