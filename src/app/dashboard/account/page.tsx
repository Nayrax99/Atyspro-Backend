"use client";

import { useEffect, useState, type FormEvent } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useDashboard } from "@/contexts/DashboardContext";
import { applySkin, METIER_TO_SKIN } from "@/theme";

type Tab = "profil" | "parametres" | "abonnement";

const INPUT: React.CSSProperties = {
  width: "100%",
  height: 40,
  padding: "0 14px",
  border: "1px solid #E2E8F0",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "var(--font-sans)",
  color: "#0F172A",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const INPUT_DISABLED: React.CSSProperties = {
  ...INPUT,
  background: "#F8FAFC",
  color: "#94A3B8",
  cursor: "not-allowed",
};

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#94A3B8",
  marginBottom: 6,
};

const FIELD: React.CSSProperties = { marginBottom: 18 };
const HELPER: React.CSSProperties = { fontSize: 11, color: "#94A3B8", marginTop: 4 };

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

const SPECIALTY_OPTIONS = [
  { value: "", label: "Choisir un métier" },
  { value: "electricien", label: "Électricien" },
  { value: "plombier", label: "Plombier" },
  { value: "serrurier", label: "Serrurier" },
  { value: "immo", label: "Agent immobilier" },
  { value: "autre", label: "Autre" },
];

export default function AccountPage() {
  const { skin } = useDashboard();
  void skin;

  const [tab, setTab] = useState<Tab>("profil");
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  useEffect(() => {
    if (!saveMsg) return;
    const t = setTimeout(() => setSaveMsg(null), 3000);
    return () => clearTimeout(t);
  }, [saveMsg]);

  useEffect(() => {
    fetch("/api/account", { credentials: "include" })
      .then((r) => r.json())
      .then((json: AccountResponse) => {
        if (!json.success || !json.data) { setError(json.error ?? "Impossible de charger."); return; }
        const d = json.data;
        setAccount(d);
        setEmail(d.email ?? "");
        setOwnerPhone(d.owner_phone ?? "");
        setName(d.name ?? "");
        setCity(d.city ?? "");
        setSpecialty(d.specialty ?? "");
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
      if (!json.success) { setSaveMsg({ type: "err", text: json.error ?? "Erreur." }); return; }
      if (json.data) setAccount(json.data);
      // Apply skin change immediately
      if (specialty) {
        const newSkin = METIER_TO_SKIN[specialty] ?? "core";
        applySkin(newSkin);
      }
      setSaveMsg({ type: "ok", text: "Profil mis à jour." });
    } catch {
      setSaveMsg({ type: "err", text: "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const emailChanged = email !== (account?.email ?? "");
    const phoneChanged = ownerPhone !== (account?.owner_phone ?? "");
    if (emailChanged || phoneChanged) {
      const fields: string[] = [];
      if (emailChanged) fields.push("email");
      if (phoneChanged) fields.push("numéro de téléphone");
      setConfirmMessage(`Vous êtes sur le point de modifier votre ${fields.join(" et ")}. Cette action peut affecter votre connexion.`);
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

  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0 }}>Compte</h1>
        <Card padding={32} style={{ marginTop: 24 }}>
          <p style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", margin: 0 }}>Chargement…</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0 }}>Compte</h1>
        <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13 }}>Erreur : {error}</div>
      </div>
    );
  }

  return (
    <>
      {/* Confirm modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", padding: 32, maxWidth: 440, width: "100%", fontFamily: "var(--font-sans)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 10 }}>Confirmer la modification</h3>
            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginBottom: 24 }}>{confirmMessage}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>Annuler</Button>
              <Button variant="primary" onClick={() => void doSave()}>Confirmer</Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ fontFamily: "var(--font-sans)", maxWidth: 760 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0 }}>Compte</h1>
          <div style={{ width: 32, height: 2, background: "var(--ap-primary)", borderRadius: 2, marginTop: 6 }} />
        </div>

        <Card padding="none">
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "0.5px solid #E5E7EB", padding: "0 24px" }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{
                  padding: "14px 4px",
                  marginRight: 24,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  color: tab === t.key ? "var(--ap-primary)" : "#94A3B8",
                  background: "none",
                  border: "none",
                  borderBottom: tab === t.key ? "2px solid var(--ap-primary)" : "2px solid transparent",
                  cursor: "pointer",
                  marginBottom: -1,
                  transition: "color 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "24px" }}>
            {/* Profil tab */}
            {tab === "profil" && (
              <form onSubmit={handleSave}>
                <div style={FIELD}>
                  <label style={LABEL}>Adresse email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" style={INPUT} />
                </div>
                <div style={FIELD}>
                  <label style={LABEL}>Nom de l&apos;entreprise</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Électricité Dupont" style={INPUT} />
                </div>
                <div style={FIELD}>
                  <label style={LABEL}>Téléphone</label>
                  <input type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+33 6 00 00 00 00" style={INPUT} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={FIELD}>
                    <label style={LABEL}>Ville</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Lyon" style={INPUT} />
                    <p style={HELPER}>Estime la distance avec vos prospects</p>
                  </div>
                  <div style={FIELD}>
                    <label style={LABEL}>Métier</label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        style={{ ...INPUT, appearance: "none", paddingRight: 32 }}
                      >
                        {SPECIALTY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 12, color: "#94A3B8" }}>▼</span>
                    </div>
                    <p style={HELPER}>Personnalise les thèmes et libellés</p>
                  </div>
                </div>

                {saveMsg && (
                  <p style={{ fontSize: 13, marginBottom: 14, color: saveMsg.type === "ok" ? "#059669" : "#DC2626" }}>{saveMsg.text}</p>
                )}
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Sauvegarde…" : "Enregistrer"}
                </Button>
              </form>
            )}

            {/* Paramètres tab */}
            {tab === "parametres" && (
              <div>
                <div style={FIELD}>
                  <label style={LABEL}>Numéro professionnel</label>
                  <input type="text" value={account?.pro_phone ?? ""} disabled placeholder="En attente d'activation" style={{ ...INPUT_DISABLED, fontStyle: account?.pro_phone ? "normal" : "italic" }} />
                  <p style={HELPER}>Vos clients appellent ce numéro — l&apos;assistant vocal prend le relais si vous ne répondez pas.</p>
                </div>
                <div style={{ ...FIELD, marginBottom: 28 }}>
                  <label style={{ ...LABEL, color: "#CBD5E1" }}>Identifiant technique</label>
                  <input type="text" value={account?.id ? `#${account.id.slice(0, 8)}` : "—"} disabled style={{ ...INPUT_DISABLED, fontFamily: "monospace", fontSize: 11 }} />
                </div>
                <div style={{ borderLeft: "3px solid var(--ap-primary)", background: "#F8FAFC", borderRadius: "0 10px 10px 0", padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Personnalisation de l&apos;assistant vocal</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#F1F5F9", border: "0.5px solid #E2E8F0", color: "#94A3B8" }}>Bientôt</span>
                  </div>
                  <div style={FIELD}>
                    <label style={LABEL}>Message d&apos;accueil</label>
                    <textarea
                      disabled
                      placeholder="Ex : Bonjour, vous êtes chez Dupont Électricité…"
                      rows={4}
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, fontFamily: "var(--font-sans)", color: "#94A3B8", background: "#fff", outline: "none", boxSizing: "border-box", resize: "vertical", cursor: "not-allowed", lineHeight: 1.5 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Abonnement tab */}
            {tab === "abonnement" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>Plans disponibles</p>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#F1F5F9", border: "0.5px solid #E2E8F0", color: "#94A3B8" }}>Tarifs à la sortie</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, alignItems: "start" }}>
                  {/* Bêta */}
                  <div style={{ border: "0.5px solid var(--ap-primary-border, #BFDBFE)", borderTop: "3px solid var(--ap-primary)", borderRadius: 12, padding: 24, background: "var(--ap-primary-light, #EFF6FF)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Bêta gratuite</p>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "var(--ap-primary)", color: "#fff" }}>Actif</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Accès complet pendant la phase bêta</p>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8", marginBottom: 12 }}>Inclus</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                      {[
                        "Capture automatique des appels manqués",
                        "Qualification vocale des clients",
                        "Scoring de priorité (0-100)",
                        "Dashboard leads en temps réel",
                        "Application mobile iOS & Android",
                        "Relances automatiques des leads",
                      ].map((f) => (
                        <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#374151" }}>
                          <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(5,150,105,0.1)", color: "#059669", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>✓</span>
                          {f}
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.6, margin: 0 }}>Offre préférentielle réservée aux bêta testeurs.</p>
                  </div>

                  {/* Essentiel */}
                  <div style={{ border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 24, background: "#FAFAFA" }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>Essentiel</p>
                    <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Pour démarrer</p>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8", marginBottom: 12 }}>Inclus</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        "Capture des appels manqués",
                        "Assistant vocal standard",
                        "Scoring de priorité",
                        "Dashboard leads",
                        "Historique des appels",
                        "Notifications push",
                        "1 métier / secteur",
                      ].map((f) => (
                        <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#374151" }}>
                          <span style={{ color: "#059669", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Premium */}
                  <div style={{ border: "0.5px solid var(--ap-primary)", borderTop: "3px solid var(--ap-primary)", borderRadius: 12, padding: 24, background: "#FAFEFF" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Premium</p>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "var(--ap-primary-light, #EFF6FF)", color: "var(--ap-primary)" }}>Populaire</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Pour développer</p>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8", marginBottom: 12 }}>Inclus</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {["Tout Essentiel", "CRM intégré", "Multi-métier (plusieurs secteurs)", "Personnalisation IA", "Stats avancées", "Support prioritaire"].map((f) => (
                        <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#374151" }}>
                          <span style={{ color: "var(--ap-primary)", fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                        </div>
                      ))}
                      {[
                        { label: "Agenda", badge: "Bientôt" },
                        { label: "Devis", badge: "Bientôt" },
                      ].map(({ label, badge }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9CA3AF" }}>
                          <span style={{ color: "#D1D5DB", fontWeight: 700, flexShrink: 0 }}>✓</span>
                          <span>{label}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 20, background: "#F3F4F6", color: "#9CA3AF", border: "0.5px solid #E5E7EB" }}>{badge}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
