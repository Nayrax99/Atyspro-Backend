"use client";

import { useState, type FormEvent } from "react";

type AuthMode = "login" | "signup";

const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: "#0f172a",
  letterSpacing: "0.01em",
  marginBottom: "6px",
};
const INPUT_BASE: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  padding: "13px 16px",
  fontSize: "15px",
  outline: "none",
  backgroundColor: "white",
  color: "#0f172a",
  boxSizing: "border-box",
  appearance: "none" as const,
  transition: "border-color 0.2s ease",
  fontFamily: FONT,
};
const CARD_STYLE: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: "14px",
  padding: "32px",
  boxShadow: "0 8px 30px rgba(15,23,42,0.10)",
  border: "1px solid #e2e8f0",
};
const FIELD_GROUP: React.CSSProperties = { marginBottom: "24px" };

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [btnHover, setBtnHover] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) { setError("Merci d'indiquer une adresse email."); return; }
    if (mode === "signup" && !businessName.trim()) { setError("Merci d'indiquer le nom de votre entreprise."); return; }
    if (!password.trim()) { setError("Merci d'indiquer un mot de passe."); return; }
    if (mode === "signup") {
      if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
      if (password !== passwordConfirm) { setError("Les mots de passe ne correspondent pas."); return; }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
          let message = "Impossible de vous connecter. Vérifiez vos identifiants.";
          try {
            const data = (await response.json()) as { message?: string; error?: string };
            if (typeof data.message === "string" && data.message.trim()) message = data.message;
            else if (typeof data.error === "string" && data.error.trim()) message = data.error;
          } catch { /* On garde le message générique */ }
          setError(message);
          return;
        }
        window.location.href = "/dashboard";
        return;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, business_name: businessName }),
      });
      if (!response.ok) {
        let message = "Impossible de créer le compte, veuillez réessayer.";
        try {
          const data = (await response.json()) as { message?: string; error?: string };
          if (typeof data.message === "string" && data.message.trim()) message = data.message;
          else if (typeof data.error === "string" && data.error.trim()) message = data.error;
        } catch { /* On garde le message générique */ }
        setError(message);
        return;
      }
      // Auto-login after signup
      try {
        const loginResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (loginResponse.ok) {
          window.location.href = "/onboarding";
          return;
        }
      } catch { /* ignore — fallback below */ }
      // Fallback: manual login
      setSuccessMessage("Compte créé ! Vous pouvez maintenant vous connecter.");
      setMode("login");
      setPassword("");
      setPasswordConfirm("");
    } catch {
      setError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setError(null);
    setSuccessMessage(null);
  };

  const isSignup = mode === "signup";

  const handleForgotPassword = async () => {
    setError(null);
    setSuccessMessage(null);
    if (!email.trim()) { setError("Merci d'indiquer votre adresse email pour recevoir le lien de réinitialisation."); return; }
    setForgotLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        let message = "Impossible d'envoyer l'email de réinitialisation. Veuillez réessayer.";
        try {
          const data = (await response.json()) as { message?: string; error?: string };
          if (typeof data.message === "string" && data.message.trim()) message = data.message;
          else if (typeof data.error === "string" && data.error.trim()) message = data.error;
        } catch { /* On garde le message générique */ }
        setError(message);
        return;
      }
      setSuccessMessage("Un email de réinitialisation a été envoyé. Consultez votre boîte de réception.");
    } catch {
      setError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
      {/* Hover styles pour inputs — inline styles ne peuvent pas gérer :hover */}
      <style>{`
        .atys-input:hover { border-color: #94a3b8 !important; }
        .atys-input:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .atys-link {
          transition: color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
        }
        .atys-link:hover {
          opacity: 0.9;
        }
      `}</style>

      <main style={{ width: "100%", maxWidth: "440px", fontFamily: FONT }}>
        {/* Logo en haut du panneau droit */}
        <div style={{ marginBottom: "32px" }}>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", fontFamily: FONT }}>
            AtysPro
          </span>
        </div>

        {/* Titre et sous-titre au-dessus de la card */}
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a", marginBottom: "6px", letterSpacing: "-0.02em" }}>
            {isSignup ? "Créer un compte" : "Connexion à AtysPro"}
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            {isSignup
              ? "Commencez gratuitement — sans carte bancaire."
              : "Connectez-vous à votre espace AtysPro."}
          </p>
        </div>

        {/* Card form */}
        <div style={CARD_STYLE}>
          <form onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <div style={FIELD_GROUP}>
                <label htmlFor="business-name" style={LABEL_STYLE}>
                  Nom de votre entreprise
                </label>
                <input
                  id="business-name"
                  name="business_name"
                  type="text"
                  autoComplete="organization"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  style={INPUT_BASE}
                  className="atys-input"
                  placeholder="Ex : Plomberie Martin"
                />
              </div>
            )}

            <div style={FIELD_GROUP}>
              <label htmlFor="email" style={LABEL_STYLE}>
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={INPUT_BASE}
                className="atys-input"
                placeholder="vous@exemple.com"
              />
            </div>

            <div style={FIELD_GROUP}>
              <label htmlFor="password" style={LABEL_STYLE}>
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={INPUT_BASE}
                className="atys-input"
                placeholder={isSignup ? "Minimum 6 caractères" : "Votre mot de passe"}
              />
            </div>

            {isSignup && (
              <div style={FIELD_GROUP}>
                <label htmlFor="password-confirm" style={LABEL_STYLE}>
                  Confirmer le mot de passe
                </label>
                <input
                  id="password-confirm"
                  name="password_confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  style={INPUT_BASE}
                  className="atys-input"
                  placeholder="Répétez le mot de passe"
                />
              </div>
            )}

            {error && (
              <div
                style={{
                  borderRadius: "8px",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "#fecaca",
                  backgroundColor: "#fef2f2",
                  padding: "12px 16px",
                  fontSize: "14px",
                  color: "#dc2626",
                  marginBottom: "20px",
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  borderRadius: "8px",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "#a7f3d0",
                  backgroundColor: "#ecfdf5",
                  padding: "12px 16px",
                  fontSize: "14px",
                  color: "#059669",
                  marginBottom: "20px",
                }}
                role="status"
              >
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-label={isSignup ? "Créer mon compte" : "Se connecter"}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: "100%",
                height: "50px",
                backgroundColor: loading ? "#93c5fd" : btnHover ? "#1d4ed8" : "#2563eb",
                color: "white",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "16px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: "8px",
                transition: "background-color 0.2s ease",
                fontFamily: FONT,
              }}
            >
              {loading
                ? "Envoi en cours..."
                : isSignup
                ? "Créer mon compte gratuitement"
                : "Se connecter"}
            </button>
          </form>

          {!isSignup && (
            <div style={{ marginTop: "12px", textAlign: "right" }}>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: FONT,
                  textDecoration: "underline",
                }}
                className="atys-link"
              >
                {forgotLoading ? "Envoi du lien..." : "Mot de passe oublié ?"}
              </button>
            </div>
          )}
        </div>

        <p style={{ marginTop: "24px", textAlign: "center", fontSize: "13px", color: "#64748b", fontFamily: FONT }}>
          {isSignup ? (
            <>
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={toggleMode}
                style={{
                  fontWeight: "600",
                  color: "#2563eb",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  paddingBottom: "1px",
                  fontFamily: FONT,
                  textDecoration: "none",
                }}
                className="atys-link"
              >
                Se connecter
              </button>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={toggleMode}
                style={{
                  fontWeight: "600",
                  color: "#2563eb",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  paddingBottom: "1px",
                  fontFamily: FONT,
                  textDecoration: "none",
                }}
                className="atys-link"
              >
                Créer un compte
              </button>
            </>
          )}
        </p>
      </main>
    </>
  );
}
