"use client";

import { useEffect, useState } from "react";

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (accessToken) {
      window.location.href = `/api/auth/callback?access_token=${encodeURIComponent(accessToken)}`;
    } else {
      setStatus("error");
    }
  }, []);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 text-center shadow-sm ring-1 ring-slate-200/80">
          <div className="mb-4 flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
              ✕
            </span>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Lien invalide</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ce lien de confirmation est expiré ou incorrect.
          </p>
          <a
            href="/auth"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 text-center shadow-sm ring-1 ring-slate-200/80">
        <div className="mb-4 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl">
            ⚡
          </span>
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Connexion en cours…</h1>
        <p className="mt-2 text-sm text-slate-500">
          Vous allez être redirigé vers votre tableau de bord.
        </p>
        <div className="mt-6 flex justify-center">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"
            aria-label="Chargement"
          />
        </div>
      </div>
    </div>
  );
}
