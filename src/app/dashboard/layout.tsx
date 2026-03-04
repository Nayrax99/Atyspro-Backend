 "use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./dashboard.css";

interface DashboardLayoutProps {
  children: ReactNode;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface MeResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
  };
  account?: {
    id: string;
    name: string | null;
    onboarding_completed?: boolean;
    owner_phone?: string | null;
    city?: string | null;
  };
  error?: string;
}

export default function DashboardLayout({
  children,
}: Readonly<DashboardLayoutProps>) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Vérification de l'authentification côté client + redirection onboarding
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          if (!isMounted) return;
          setStatus("unauthenticated");
          router.replace("/auth");
          return;
        }

        if (!response.ok) {
          if (!isMounted) return;
          setStatus("unauthenticated");
          router.replace("/auth");
          return;
        }

        const data = (await response.json()) as MeResponse;

        if (!isMounted) return;

        const onboardingCompleted =
          data.account?.onboarding_completed === true;

        if (!onboardingCompleted) {
          setStatus("authenticated");
          router.replace("/onboarding");
          return;
        }

        setStatus("authenticated");
      } catch {
        if (!isMounted) return;
        setStatus("unauthenticated");
        router.replace("/auth");
      }
    };

    void checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      // On renvoie toujours vers /auth même si l'API renvoie une erreur
      router.replace("/auth");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600">
            ⚡ AtysPro
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Déconnexion"
            className="text-sm text-slate-400 hover:text-red-500 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main className="flex-1 bg-slate-50">
        <div className="max-w-4xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

