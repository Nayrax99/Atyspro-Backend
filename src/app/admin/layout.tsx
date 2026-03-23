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
  account?: {
    name: string | null;
    onboarding_completed?: boolean;
    is_admin?: boolean;
    pending_leads?: number;
  };
  error?: string;
}

export default function AdminLayout({ children }: Readonly<AdminLayoutProps>) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [pendingLeads, setPendingLeads] = useState(0);

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

        // Guard: redirect non-admins to dashboard
        if (!data.account?.is_admin) {
          setStatus("authenticated");
          router.replace("/dashboard");
          return;
        }

        setAccountName(data.account?.name ?? null);
        setPendingLeads(data.account?.pending_leads ?? 0);
        setStatus("authenticated");
      } catch {
        if (!isMounted) return;
        setStatus("unauthenticated");
        router.replace("/auth");
      }
    };

    void checkAuth();
    return () => { isMounted = false; };
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
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
        <p style={{ fontSize: "14px", color: "#64748b", fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: "#f8fafc" }}>
      <Sidebar
        accountName={accountName}
        onLogout={handleLogout}
        isAdmin={true}
        pendingLeads={pendingLeads}
      />
      <main style={{ marginLeft: "220px", height: "100dvh", overflowY: "auto", backgroundColor: "#f8fafc", padding: "2rem 2.5rem", fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}>
        {children}
      </main>
    </div>
  );
}
