"use client";

import { useState, type FormEvent } from "react";

type AuthMode = "login" | "signup";

// Texte de confirmation affiché après un envoi réussi
const SUCCESS_MESSAGE =
  "Un lien de connexion a été envoyé à votre adresse email. Vérifiez votre boîte de réception (et vos spams).";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
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

    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body =
        mode === "login"
          ? { email }
          : {
              email,
              business_name: businessName,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // On essaie de récupérer un message "humain", sinon message générique
        let message = "Impossible d’envoyer le lien, veuillez réessayer.";
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

      setSuccessMessage(SUCCESS_MESSAGE);
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="vous@exemple.com"
            />
          </div>

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
            aria-label={isSignup ? "Créer mon compte" : "Recevoir le lien de connexion"}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading
              ? "Envoi en cours..."
              : isSignup
              ? "Créer mon compte"
              : "Recevoir le lien de connexion"}
          </button>
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

