"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

type AuthMode = "login" | "signup";

const INPUT: React.CSSProperties = {
  width: "100%",
  border: "1px solid #E2E8F0",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  background: "#fff",
  color: "#0F172A",
  boxSizing: "border-box",
  fontFamily: "var(--font-sans, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)",
  transition: "border-color 0.2s",
};

const FIELD: React.CSSProperties = { marginBottom: 18 };

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#94A3B8",
  marginBottom: 6,
};

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [btnHover, setBtnHover] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) { setError("Merci d'indiquer une adresse email."); return; }
    if (isSignup && !businessName.trim()) { setError("Merci d'indiquer le nom de votre entreprise."); return; }
    if (!password.trim()) { setError("Merci d'indiquer un mot de passe."); return; }
    if (isSignup) {
      if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
      if (password !== passwordConfirm) { setError("Les mots de passe ne correspondent pas."); return; }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
        if (!res.ok) {
          let msg = "Identifiants incorrects.";
          try { const d = (await res.json()) as { message?: string; error?: string }; msg = d.message ?? d.error ?? msg; } catch { /* noop */ }
          setError(msg); return;
        }
        window.location.href = "/dashboard";
        return;
      }
      const res = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, business_name: businessName }) });
      if (!res.ok) {
        let msg = "Impossible de créer le compte.";
        try { const d = (await res.json()) as { message?: string; error?: string }; msg = d.message ?? d.error ?? msg; } catch { /* noop */ }
        setError(msg); return;
      }
      try {
        const loginRes = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
        if (loginRes.ok) { window.location.href = "/onboarding"; return; }
      } catch { /* noop */ }
      setSuccess("Compte créé ! Vous pouvez maintenant vous connecter.");
      setMode("login");
      setPassword("");
      setPasswordConfirm("");
    } catch {
      setError("Une erreur est survenue. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError(null);
    setSuccess(null);
    if (!email.trim()) { setError("Indiquez votre email pour recevoir le lien."); return; }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (!res.ok) {
        let msg = "Impossible d'envoyer l'email.";
        try { const d = (await res.json()) as { message?: string; error?: string }; msg = d.message ?? d.error ?? msg; } catch { /* noop */ }
        setError(msg); return;
      }
      setSuccess("Email envoyé. Consultez votre boîte de réception.");
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setForgotLoading(false);
    }
  };

  const toggle = () => { setMode((m) => m === "login" ? "signup" : "login"); setError(null); setSuccess(null); };

  return (
    <>
      <style>{`
        .ap-auth-input:hover { border-color: #94A3B8 !important; }
        .ap-auth-input:focus { border-color: var(--ap-primary, #6366F1) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
      `}</style>

      <main style={{ width: "100%", maxWidth: 420, fontFamily: "var(--font-sans, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)" }}>
        {/* Eyebrow pill */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: "#F1F5F9", border: "0.5px solid #E2E8F0", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748B" }}>
            {isSignup ? "Inscription gratuite" : "Connexion sécurisée"}
          </span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0, marginBottom: 8 }}>
            {isSignup ? "Créer un compte" : "Connexion à AtysPro"}
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
            {isSignup ? "Commencez gratuitement — sans carte bancaire." : "Connectez-vous à votre espace AtysPro."}
          </p>
        </div>

        {/* Form card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px rgba(15,23,42,0.08)", border: "0.5px solid #E5E7EB" }}>
          <form onSubmit={(e) => { void handleSubmit(e); }} noValidate>
            {isSignup && (
              <div style={FIELD}>
                <label style={LABEL}>Nom de l&apos;entreprise</label>
                <input id="business-name" type="text" autoComplete="organization" value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={INPUT} className="ap-auth-input" placeholder="Ex : Plomberie Martin" />
              </div>
            )}
            <div style={FIELD}>
              <label style={LABEL}>Adresse email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={INPUT} className="ap-auth-input" placeholder="vous@exemple.com" />
            </div>
            <div style={FIELD}>
              <label style={LABEL}>Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input id="password" type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...INPUT, paddingRight: 42 }} className="ap-auth-input" placeholder={isSignup ? "Minimum 6 caractères" : "Votre mot de passe"} />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {isSignup && (
              <div style={FIELD}>
                <label style={LABEL}>Confirmer le mot de passe</label>
                <div style={{ position: "relative" }}>
                  <input id="password-confirm" type={showPasswordConfirm ? "text" : "password"} autoComplete="new-password" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} style={{ ...INPUT, paddingRight: 42 }} className="ap-auth-input" placeholder="Répétez le mot de passe" />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      color: "#94A3B8",
                      display: "flex",
                      alignItems: "center",
                    }}
                    aria-label={showPasswordConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div role="alert" style={{ padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", border: "0.5px solid #FECACA", color: "#DC2626", fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}
            {success && (
              <div role="status" style={{ padding: "10px 14px", borderRadius: 8, background: "#F0FDF4", border: "0.5px solid #BBF7D0", color: "#059669", fontSize: 13, marginBottom: 16 }}>{success}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
              style={{
                width: "100%",
                height: 46,
                background: loading ? "var(--ap-primary)" : btnHover ? "var(--ap-primary-hover, var(--ap-primary))" : "var(--ap-primary)",
                color: "#fff",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
                opacity: loading ? 0.7 : 1,
                transition: "opacity 0.2s, transform 0.1s",
                transform: btnHover && !loading ? "translateY(-1px)" : "none",
                fontFamily: "inherit",
                letterSpacing: "-0.01em",
              }}
            >
              {loading ? "Envoi…" : isSignup ? "Créer mon compte gratuitement" : "Se connecter"}
            </button>
          </form>

          {!isSignup && (
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <button type="button" onClick={() => { void handleForgot(); }} disabled={forgotLoading} style={{ fontSize: 12, color: "#94A3B8", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
                {forgotLoading ? "Envoi…" : "Mot de passe oublié ?"}
              </button>
            </div>
          )}
        </div>

        {/* Toggle mode */}
        <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#64748B" }}>
          {isSignup ? "Déjà un compte ? " : "Pas encore de compte ? "}
          <button type="button" onClick={toggle} style={{ fontWeight: 700, color: "var(--ap-primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
            {isSignup ? "Se connecter" : "Créer un compte"}
          </button>
        </p>
      </main>
    </>
  );
}
