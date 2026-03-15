"use client";

import { useState, type FormEvent } from "react";

type AuthMode = "login" | "signup";

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation minimale côté client
    if (!email.trim()) {
      setError("Merci d’indiquer une adresse email.");
      return;
    }
    if (mode === "signup" && !businessName.trim()) {
      setError("Merci d’indiquer le nom de votre entreprise.");
      return;
    }

    if (!password.trim()) {
      setError("Merci d’indiquer un mot de passe.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
        return;
      }

      if (password !== passwordConfirm) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          let message = "Impossible de vous connecter. Vérifiez vos identifiants.";
          try {
            const data = (await response.json()) as { message?: string; error?: string };
            if (typeof data.message === "string" && data.message.trim().length > 0) {
              message = data.message;
            } else if (typeof data.error === "string" && data.error.trim().length > 0) {
              message = data.error;
            }
          } catch {
            // On garde le message générique
          }
          setError(message);
          return;
        }

        // Redirection plein navigateur pour que le cookie soit pris en compte
        window.location.href = "/dashboard";
        return;
      }

      // Mode signup
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          business_name: businessName,
        }),
      });

      if (!response.ok) {
        let message = "Impossible de créer le compte, veuillez réessayer.";
        try {
          const data = (await response.json()) as { message?: string; error?: string };
          if (typeof data.message === "string" && data.message.trim().length > 0) {
            message = data.message;
          } else if (typeof data.error === "string" && data.error.trim().length > 0) {
            message = data.error;
          }
        } catch {
          // On garde le message générique
        }
        setError(message);
        return;
      }

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

    if (!email.trim()) {
      setError(
        "Merci d’indiquer votre adresse email pour recevoir le lien de réinitialisation."
      );
      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let message =
          "Impossible d’envoyer l’email de réinitialisation. Veuillez réessayer.";
        try {
          const data = (await response.json()) as { message?: string; error?: string };
          if (typeof data.message === "string" && data.message.trim().length > 0) {
            message = data.message;
          } else if (typeof data.error === "string" && data.error.trim().length > 0) {
            message = data.error;
          }
        } catch {
          // On garde le message générique
        }
        setError(message);
        return;
      }

      setSuccessMessage(
        "Un email de réinitialisation a été envoyé. Consultez votre boîte de réception."
      );
    } catch {
      setError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main className="w-full max-w-md">
      <section className="bg-white shadow-lg rounded-2xl px-8 py-10">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold text-blue-600">⚡ AtysPro</div>
          <p className="mt-2 text-sm text-slate-500">Votre assistant de leads intelligent</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {isSignup && (
            <div className="space-y-1.5">
              <label
                htmlFor="business-name"
                className="block text-sm font-medium text-slate-700"
              >
                Nom de votre entreprise
              </label>
              <input
                id="business-name"
                name="business_name"
                type="text"
                autoComplete="organization"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Ex : Plomberie Martin"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Adresse email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder={isSignup ? "••••••••" : "Votre mot de passe"}
            />
          </div>

          {isSignup && (
            <div className="space-y-1.5">
                <label
                  htmlFor="password-confirm"
                  className="block text-sm font-medium text-slate-700"
                >
                  Confirmer le mot de passe
                </label>
                <input
                  id="password-confirm"
                  name="password_confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Répétez le mot de passe"
                />
              </div>
          )}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="text-sm text-emerald-600" role="status">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            aria-label={isSignup ? "Créer mon compte" : "Se connecter"}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading
              ? "Envoi en cours..."
              : isSignup
              ? "Créer mon compte"
              : "Se connecter"}
          </button>

          {!isSignup && (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="mt-2 text-xs text-right text-slate-500 hover:text-blue-600 underline underline-offset-2"
            >
              {forgotLoading ? "Envoi du lien..." : "Mot de passe oublié ?"}
            </button>
          )}
        </form>

        <div className="mt-6 text-center text-sm">
          {isSignup ? (
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700"
            >
              Déjà un compte ? Se connecter
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700"
            >
              Pas encore de compte ? Créer un compte
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

