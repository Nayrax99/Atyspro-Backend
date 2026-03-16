"use client";

import { useState, type FormEvent } from "react";

type OnboardingStep = 1 | 2 | 3;
type SpecialtyOption = "electricien" | "plombier" | "serrurier" | "autre";

const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  letterSpacing: "0.01em",
  textTransform: "uppercase",
  marginBottom: "6px",
};
const INPUT_BASE: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "15px",
  outline: "none",
  backgroundColor: "white",
  color: "#0f172a",
  boxSizing: "border-box",
  appearance: "none" as const,
  transition: "border-color 0.2s ease",
  fontFamily: FONT,
};
const FIELD_GROUP: React.CSSProperties = { marginBottom: "24px" };
const CARD_STYLE: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "20px",
  padding: "40px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  border: "1px solid #e2e8f0",
};
const BTN_BASE: React.CSSProperties = {
  width: "100%",
  height: "48px",
  backgroundColor: "#2563eb",
  color: "white",
  borderRadius: "12px",
  fontWeight: "600",
  fontSize: "16px",
  border: "none",
  cursor: "pointer",
  marginTop: "24px",
  transition: "background-color 0.2s ease",
  fontFamily: FONT,
};

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState<SpecialtyOption>("electricien");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [btnHover, setBtnHover] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const goToNextStep = () => {
    setStep((current) => (current < 3 ? ((current + 1) as OnboardingStep) : current));
  };

  const goToPrevStep = () => {
    setError(null);
    setStep((current) => (current > 1 ? ((current - 1) as OnboardingStep) : current));
  };

  const handleSubmitStep1 = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!ownerPhone.trim()) { setError("Merci d'indiquer votre numéro mobile."); return; }
    if (!city.trim()) { setError("Merci d'indiquer votre ville."); return; }
    goToNextStep();
  };

  const handleFinishOnboarding = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ owner_phone: ownerPhone, city, specialty }),
      });
      if (!response.ok) {
        let message = "Impossible de terminer l'onboarding. Veuillez réessayer.";
        try {
          const data = (await response.json()) as { error?: string; message?: string };
          if (typeof data.message === "string" && data.message.trim()) message = data.message;
          else if (typeof data.error === "string" && data.error.trim()) message = data.error;
        } catch { /* On garde le message générique */ }
        setError(message);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const STEP_LABELS = ["Vos infos", "Votre numéro", "Comment ça marche"];

  const HOW_IT_WORKS = [
    {
      emoji: "📞",
      title: "Un client vous appelle",
      text: "Quand un client appelle votre numéro pro, vous êtes notifié. Si vous ne répondez pas, notre assistant vocal prend l'appel et qualifie le besoin du client.",
    },
    {
      emoji: "📱",
      title: "Le client échange avec l'assistant",
      text: "Le client explique son besoin à notre assistant vocal. La demande est analysée et qualifiée automatiquement.",
    },
    {
      emoji: "⚡",
      title: "Vous recevez un lead qualifié",
      text: "Le lead apparaît dans votre dashboard avec un score de priorité. Vous rappelez le client quand vous êtes disponible.",
    },
  ];

  return (
    <>
      <style>{`
        .atys-input:hover { border-color: #94a3b8 !important; }
        .atys-input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          padding: "2.5rem 1rem",
          fontFamily: FONT,
        }}
      >
        <div style={{ width: "100%", maxWidth: "520px" }}>
          {/* Header */}
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
              <span
                style={{
                  display: "flex",
                  width: "40px",
                  height: "40px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  backgroundColor: "#2563eb",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "white",
                }}
              >
                ⚡
              </span>
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.01em" }}>
              Bienvenue sur AtysPro
            </h1>
            <p style={{ marginTop: "6px", fontSize: "14px", color: "#64748b" }}>
              Configuration en {STEP_LABELS.length} étapes — moins de 2 minutes.
            </p>
          </div>

          {/* Stepper */}
          <div
            style={{ display: "flex", alignItems: "flex-start", marginBottom: "32px" }}
            aria-label="Progression de l'onboarding"
          >
            {([1, 2, 3] as OnboardingStep[]).map((value) => {
              const active = step === value;
              const completed = step > value;
              return (
                <div key={value} style={{ display: "flex", flex: 1, alignItems: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        display: "flex",
                        width: "40px",
                        height: "40px",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        border: `2px solid ${active || completed ? "#2563eb" : "#e2e8f0"}`,
                        backgroundColor: active || completed ? "#2563eb" : "white",
                        color: active || completed ? "white" : "#94a3b8",
                        fontSize: "13px",
                        fontWeight: "700",
                        transition: "all 0.2s ease",
                      }}
                      aria-current={active ? "step" : undefined}
                      aria-label={`Étape ${value}`}
                    >
                      {completed ? "✓" : value}
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: active || completed ? "#2563eb" : "#94a3b8",
                      }}
                    >
                      {STEP_LABELS[value - 1]}
                    </span>
                  </div>
                  {value < 3 && (
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        backgroundColor: completed ? "#2563eb" : "#e2e8f0",
                        margin: "0 12px",
                        marginBottom: "20px",
                        transition: "background-color 0.2s ease",
                      }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step card */}
          <div style={CARD_STYLE}>

            {/* ── Étape 1 : Informations ── */}
            {step === 1 && (
              <div>
                <header style={{ marginBottom: "28px" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.01em" }}>
                    Vos informations
                  </h2>
                  <p style={{ marginTop: "6px", fontSize: "14px", color: "#64748b" }}>
                    Quelques détails pour personnaliser AtysPro à votre activité.
                  </p>
                </header>

                <form onSubmit={handleSubmitStep1} noValidate>
                  <div style={FIELD_GROUP}>
                    <label htmlFor="owner-phone" style={LABEL_STYLE}>
                      Votre numéro mobile
                    </label>
                    <input
                      id="owner-phone"
                      name="owner_phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      style={INPUT_BASE}
                      className="atys-input"
                      placeholder="06 12 34 56 78"
                      aria-describedby="owner-phone-help"
                    />
                    <p id="owner-phone-help" style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                      Utilisé pour vous notifier des nouveaux leads.
                    </p>
                  </div>

                  <div style={FIELD_GROUP}>
                    <label htmlFor="city" style={LABEL_STYLE}>
                      Votre ville
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={INPUT_BASE}
                      className="atys-input"
                      placeholder="Paris, Lyon, Marseille…"
                    />
                  </div>

                  <div style={FIELD_GROUP}>
                    <label htmlFor="specialty" style={LABEL_STYLE}>
                      Spécialité
                    </label>
                    <select
                      id="specialty"
                      name="specialty"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value as SpecialtyOption)}
                      style={INPUT_BASE}
                      className="atys-input"
                      aria-label="Sélectionnez votre spécialité"
                    >
                      <option value="electricien">Électricien</option>
                      <option value="plombier">Plombier</option>
                      <option value="serrurier">Serrurier</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  {error && (
                    <div
                      style={{
                        borderRadius: "8px",
                        border: "1px solid #fecaca",
                        backgroundColor: "#fef2f2",
                        padding: "12px 16px",
                        fontSize: "14px",
                        color: "#dc2626",
                        marginBottom: "16px",
                      }}
                      role="alert"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    onMouseEnter={() => setBtnHover(true)}
                    onMouseLeave={() => setBtnHover(false)}
                    style={{ ...BTN_BASE, backgroundColor: btnHover ? "#1d4ed8" : "#2563eb" }}
                  >
                    Continuer
                  </button>
                </form>
              </div>
            )}

            {/* ── Étape 2 : Numéro professionnel ── */}
            {step === 2 && (
              <div>
                <header style={{ marginBottom: "24px" }}>
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#64748b",
                      padding: "0",
                      marginBottom: "12px",
                      fontFamily: FONT,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#334155")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                  >
                    ← Retour
                  </button>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.01em" }}>
                    Votre numéro professionnel
                  </h2>
                  <p style={{ marginTop: "6px", fontSize: "14px", color: "#64748b" }}>
                    AtysPro vous attribue un numéro dédié pour centraliser vos appels clients.
                  </p>
                </header>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Info card avec border-left et fond bleu */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      borderRadius: "12px",
                      border: "1px solid #bfdbfe",
                      borderLeft: "3px solid #2563eb",
                      backgroundColor: "#eff6ff",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: "40px",
                        height: "40px",
                        flexShrink: 0,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "8px",
                        backgroundColor: "#dbeafe",
                        fontSize: "20px",
                      }}
                      aria-hidden="true"
                    >
                      📞
                    </div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                        Attribution automatique à l&apos;activation
                      </p>
                      <p style={{ marginTop: "4px", fontSize: "13px", color: "#64748b", lineHeight: "1.55" }}>
                        Dès que votre compte est activé, votre numéro AtysPro est
                        provisionné et relié à votre dashboard. Tous vos appels clients
                        passeront par ce numéro.
                      </p>
                    </div>
                  </div>

                  <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6" }}>
                    Ce numéro recevra vos appels clients. Notre assistant vocal qualifiera
                    automatiquement vos appels manqués pour ne perdre aucun lead.
                  </p>
                </div>

                {error && (
                  <div
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #fecaca",
                      backgroundColor: "#fef2f2",
                      padding: "12px 16px",
                      fontSize: "14px",
                      color: "#dc2626",
                      marginTop: "16px",
                    }}
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={goToNextStep}
                  onMouseEnter={() => setBtnHover(true)}
                  onMouseLeave={() => setBtnHover(false)}
                  style={{ ...BTN_BASE, backgroundColor: btnHover ? "#1d4ed8" : "#2563eb" }}
                >
                  Continuer
                </button>
              </div>
            )}

            {/* ── Étape 3 : Comment ça marche ── */}
            {step === 3 && (
              <div>
                <header style={{ marginBottom: "24px" }}>
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#64748b",
                      padding: "0",
                      marginBottom: "12px",
                      fontFamily: FONT,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#334155")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
                  >
                    ← Retour
                  </button>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.01em" }}>
                    Comment ça marche ?
                  </h2>
                  <p style={{ marginTop: "6px", fontSize: "14px", color: "#64748b" }}>
                    En trois étapes simples, vos appels deviennent des leads qualifiés.
                  </p>
                </header>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {HOW_IT_WORKS.map((item, i) => (
                    <article
                      key={item.title}
                      onMouseEnter={() => setHoveredCard(i)}
                      onMouseLeave={() => setHoveredCard(null)}
                      style={{
                        display: "flex",
                        gap: "16px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        backgroundColor: "#f8fafc",
                        padding: "16px",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        transform: hoveredCard === i ? "translateY(-2px)" : "translateY(0)",
                        boxShadow: hoveredCard === i
                          ? "0 6px 20px rgba(0,0,0,0.08)"
                          : "0 1px 2px rgba(0,0,0,0.04)",
                        cursor: "default",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          width: "36px",
                          height: "36px",
                          flexShrink: 0,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "8px",
                          backgroundColor: "white",
                          fontSize: "18px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          border: "1px solid #e2e8f0",
                        }}
                        aria-hidden="true"
                      >
                        {item.emoji}
                      </div>
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>
                          {item.title}
                        </h3>
                        <p style={{ marginTop: "4px", fontSize: "13px", color: "#64748b", lineHeight: "1.55" }}>
                          {item.text}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                {error && (
                  <div
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #fecaca",
                      backgroundColor: "#fef2f2",
                      padding: "12px 16px",
                      fontSize: "14px",
                      color: "#dc2626",
                      marginTop: "16px",
                    }}
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleFinishOnboarding}
                  disabled={loading}
                  onMouseEnter={() => !loading && setBtnHover(true)}
                  onMouseLeave={() => setBtnHover(false)}
                  style={{
                    ...BTN_BASE,
                    backgroundColor: loading ? "#93c5fd" : btnHover ? "#1d4ed8" : "#2563eb",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  aria-label="Commencer à utiliser AtysPro"
                >
                  {loading ? "Finalisation en cours…" : "Commencer à utiliser AtysPro"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
