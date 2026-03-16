"use client";

import { useEffect, useState, type FormEvent } from "react";

type Tab = "profil" | "parametres" | "abonnement";

const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: FONT,
  color: "#0f172a",
  backgroundColor: "white",
  outline: "none",
  boxSizing: "border-box",
};

const INPUT_DISABLED: React.CSSProperties = {
  ...INPUT_STYLE,
  backgroundColor: "#f8fafc",
  color: "#94a3b8",
  cursor: "not-allowed",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#374151",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: "6px",
  fontFamily: FONT,
};

const FIELD_STYLE: React.CSSProperties = { marginBottom: "20px" };

const HELPER_STYLE: React.CSSProperties = {
  fontSize: "12px",
  color: "#94a3b8",
  marginTop: "4px",
  fontFamily: FONT,
};

interface AccountData {
  id: string;
  name: string | null;
  email: string | null;
  owner_phone: string | null;
  city: string | null;
  specialty: string | null;
  pro_phone: string | null;
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

  // Profile form fields
  const [email, setEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Confirmation modal for sensitive field changes
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  // Auto-clear save message after 3s
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
        setEmail(json.data.email ?? "");
        setOwnerPhone(json.data.owner_phone ?? "");
        setName(json.data.name ?? "");
        setCity(json.data.city ?? "");
        const raw = json.data.specialty ?? "";
        setSpecialty(raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "");
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const doSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    setShowConfirm(false);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, city, specialty, email, owner_phone: ownerPhone }),
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

  const handleSaveProfil = (e: FormEvent) => {
    e.preventDefault();

    // Detect sensitive field changes
    const emailChanged = email !== (account?.email ?? "");
    const phoneChanged = ownerPhone !== (account?.owner_phone ?? "");

    if (emailChanged || phoneChanged) {
      const changedFields: string[] = [];
      if (emailChanged) changedFields.push("email");
      if (phoneChanged) changedFields.push("numéro de téléphone");
      const fieldText = changedFields.join(" et votre ");
      setConfirmMessage(
        `Vous êtes sur le point de modifier votre ${fieldText}. Cette action peut affecter votre connexion et vos notifications.`
      );
      setShowConfirm(true);
      return;
    }

    void doSave();
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "profil", label: "Profil" },
    { key: "parametres", label: "Paramètres" },
    { key: "abonnement", label: "Abonnement" },
  ];

  const pageHeader = (
    <div style={{ marginBottom: "32px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: 0, fontFamily: FONT }}>Compte</h1>
      <div style={{ width: "40px", height: "3px", backgroundColor: "#2563eb", borderRadius: "2px", marginTop: "8px", marginBottom: "8px" }} />
      <p style={{ fontSize: "15px", color: "#64748b", fontWeight: 400, margin: 0, fontFamily: FONT }}>
        Gérez votre profil et vos préférences
      </p>
    </div>
  );

  if (loading) {
    return (
      <div style={{ maxWidth: "640px", fontFamily: FONT }}>
        {pageHeader}
        <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", padding: "32px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>Chargement…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "640px", fontFamily: FONT }}>
        {pageHeader}
        <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "14px" }}>Erreur : {error}</div>
      </div>
    );
  }

  return (
    <>
      {/* Confirmation modal overlay */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.4)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div style={{ backgroundColor: "white", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", padding: "32px", maxWidth: "440px", width: "100%", fontFamily: FONT }}>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
              Confirmer la modification
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.6, marginBottom: "24px" }}>
              {confirmMessage}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", fontSize: "14px", fontWeight: 600, color: "#374151", cursor: "pointer", fontFamily: FONT }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => void doSave()}
                style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#2563eb", fontSize: "14px", fontWeight: 600, color: "white", cursor: "pointer", fontFamily: FONT }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: "640px", fontFamily: FONT }}>
        {pageHeader}

        <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 24px" }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{
                  padding: "14px 4px",
                  marginRight: "24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: FONT,
                  color: tab === t.key ? "#2563eb" : "#64748b",
                  background: "none",
                  border: "none",
                  borderBottom: tab === t.key ? "2px solid #2563eb" : "2px solid transparent",
                  cursor: "pointer",
                  marginBottom: "-1px",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "28px 24px" }}>
            {/* ── Profil tab ── */}
            {tab === "profil" && (
              <form onSubmit={handleSaveProfil}>
                <div style={FIELD_STYLE}>
                  <label style={LABEL_STYLE}>Adresse email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    style={INPUT_STYLE}
                    className="atys-input"
                  />
                </div>

                <div style={FIELD_STYLE}>
                  <label style={LABEL_STYLE}>Nom de l&apos;entreprise</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex : Électricité Dupont"
                    style={INPUT_STYLE}
                    className="atys-input"
                  />
                </div>

                <div style={FIELD_STYLE}>
                  <label style={LABEL_STYLE}>Téléphone</label>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+33 6 00 00 00 00"
                    style={INPUT_STYLE}
                    className="atys-input"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={FIELD_STYLE}>
                    <label style={LABEL_STYLE}>Ville</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex : Lyon"
                      style={INPUT_STYLE}
                      className="atys-input"
                    />
                    <p style={HELPER_STYLE}>Permet d&apos;estimer la distance avec vos prospects</p>
                  </div>
                  <div style={FIELD_STYLE}>
                    <label style={LABEL_STYLE}>Métier</label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Ex : Électricien"
                      style={INPUT_STYLE}
                      className="atys-input"
                    />
                  </div>
                </div>

                {saveMsg && (
                  <p style={{ fontSize: "14px", marginBottom: "16px", fontFamily: FONT, color: saveMsg.type === "ok" ? "#059669" : "#dc2626" }}>
                    {saveMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "12px 24px", borderRadius: "8px", backgroundColor: saving ? "#93c5fd" : "#2563eb", color: "white", border: "none", fontSize: "14px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontFamily: FONT }}
                >
                  {saving ? "Sauvegarde…" : "Enregistrer"}
                </button>
              </form>
            )}

            {/* ── Paramètres tab ── */}
            {tab === "parametres" && (
              <div>
                <div style={FIELD_STYLE}>
                  <label style={LABEL_STYLE}>Numéro professionnel</label>
                  <input
                    type="text"
                    value={account?.pro_phone ?? ""}
                    disabled
                    placeholder="En attente d'activation"
                    style={{
                      ...INPUT_DISABLED,
                      fontStyle: account?.pro_phone ? "normal" : "italic",
                    }}
                    className="atys-input"
                  />
                  <p style={HELPER_STYLE}>
                    Numéro dédié à votre activité. Vos clients appellent ce numéro et l&apos;assistant vocal prend le relais si vous ne répondez pas.
                  </p>
                </div>

                <div style={{ ...FIELD_STYLE, marginBottom: "32px" }}>
                  <label style={{ ...LABEL_STYLE, color: "#94a3b8" }}>Identifiant technique</label>
                  <input
                    type="text"
                    value={account?.id ?? "—"}
                    disabled
                    style={{ ...INPUT_DISABLED, fontFamily: "monospace", fontSize: "12px", color: "#94a3b8" }}
                    className="atys-input"
                  />
                </div>

                {/* Assistant vocal section */}
                <div style={{ borderLeft: "3px solid #2563eb", backgroundColor: "#f8fafc", borderRadius: "0 8px 8px 0", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", fontFamily: FONT }}>
                      Personnalisation de l&apos;assistant vocal
                    </span>
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", fontSize: "11px", fontWeight: 600, color: "#64748b", fontFamily: FONT }}>
                      Bientôt disponible
                    </span>
                  </div>
                  <div style={FIELD_STYLE}>
                    <label style={LABEL_STYLE}>Message d&apos;accueil</label>
                    <textarea
                      disabled
                      placeholder="Ex : Bonjour, vous êtes chez Dupont Électricité. Je ne suis pas disponible pour le moment, mais mon assistant va prendre votre demande."
                      rows={4}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontFamily: FONT,
                        color: "#94a3b8",
                        backgroundColor: "white",
                        outline: "none",
                        boxSizing: "border-box",
                        resize: "vertical",
                        cursor: "not-allowed",
                        lineHeight: 1.5,
                      }}
                    />
                    <p style={HELPER_STYLE}>Ce message sera lu avant que l&apos;assistant vocal prenne le relais.</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Abonnement tab ── */}
            {tab === "abonnement" && (
              <div>
                {/* Current beta */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                  <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: "20px", backgroundColor: "rgba(37,99,235,0.1)", color: "#2563eb", fontSize: "13px", fontWeight: 700, fontFamily: FONT }}>
                    Bêta gratuite
                  </span>
                  <span style={{ fontSize: "14px", color: "#64748b", fontFamily: FONT }}>
                    Accès complet pendant la phase bêta
                  </span>
                </div>

                <p style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px", fontFamily: FONT }}>
                  Fonctionnalités incluses
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
                  {[
                    "Capture automatique des appels manqués",
                    "Qualification vocale automatique des clients",
                    "Scoring de priorité (0-100)",
                    "Dashboard leads en temps réel",
                    "Application mobile iOS & Android",
                    "Jusqu'à 2 relances de correction",
                  ].map((feature) => (
                    <div key={feature} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#374151", fontFamily: FONT }}>
                      <span style={{ display: "flex", width: "20px", height: "20px", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "rgba(5,150,105,0.1)", color: "#059669", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <p style={{ marginBottom: "32px", fontSize: "12px", color: "#94a3b8", lineHeight: 1.6, fontFamily: FONT }}>
                  Le pricing définitif sera communiqué avant la sortie officielle.
                  En tant que bêta testeur, vous bénéficierez d&apos;une offre préférentielle.
                </p>

                {/* Plans à venir */}
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", fontFamily: FONT, margin: 0 }}>Plans à venir</p>
                    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "20px", backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0", fontSize: "11px", fontWeight: 600, color: "#64748b", fontFamily: FONT }}>
                      Tarifs communiqués à la sortie officielle
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "16px" }}>
                    {/* Essentiel */}
                    <div style={{ flex: 1, minWidth: 0, border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", backgroundColor: "white" }}>
                      <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", fontFamily: FONT, marginBottom: "4px" }}>Essentiel</p>
                      <p style={{ fontSize: "12px", color: "#64748b", fontFamily: FONT, marginBottom: "16px" }}>Pour démarrer</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {[
                          "Capture des appels manqués",
                          "Assistant vocal standard",
                          "Scoring de priorité",
                          "Dashboard leads",
                          "1 métier / secteur",
                        ].map((f) => (
                          <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#374151", fontFamily: FONT }}>
                            <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0 }}>✓</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Premium */}
                    <div style={{ flex: 1, minWidth: 0, border: "1px solid #e2e8f0", borderTop: "3px solid #2563eb", borderRadius: "12px", padding: "16px", backgroundColor: "white" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", fontFamily: FONT, margin: 0 }}>Premium</p>
                        <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "20px", backgroundColor: "rgba(37,99,235,0.1)", color: "#2563eb", fontSize: "10px", fontWeight: 700, fontFamily: FONT }}>Populaire</span>
                      </div>
                      <p style={{ fontSize: "12px", color: "#64748b", fontFamily: FONT, marginBottom: "16px" }}>Pour développer votre activité</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {[
                          "Tout Essentiel inclus",
                          "CRM intégré",
                          "Multi-métier",
                          "Personnalisation IA",
                          "Statistiques avancées",
                          "Support prioritaire",
                        ].map((f) => (
                          <div key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#374151", fontFamily: FONT }}>
                            <span style={{ color: "#2563eb", fontWeight: 700, flexShrink: 0 }}>✓</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
