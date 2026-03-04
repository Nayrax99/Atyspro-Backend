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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-red-600">Lien invalide</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-gray-600">Connexion en cours...</p>
    </div>
  );
}
