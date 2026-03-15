"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import "../dashboard/dashboard.css";

interface AdminLayoutProps {
  children: ReactNode;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface MeResponse {
  success: boolean;
  account?: { name: string | null; onboarding_completed?: boolean };
  error?: string;
}

export default function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [accountName, setAccountName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401 || !response.ok) {
          if (!isMounted) return;
          setStatus("unauthenticated");
          router.replace("/auth");
          return;
        }

        const data = (await response.json()) as MeResponse;
        if (!isMounted) return;

        setAccountName(data.account?.name ?? null);
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
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
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
    <div className="dashboard-shell">
      <Sidebar accountName={accountName} onLogout={handleLogout} />
      <main className="dashboard-content">{children}</main>
    </div>
  );
}
