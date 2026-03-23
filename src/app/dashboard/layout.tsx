"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import RestoreSkin from "@/components/dashboard/RestoreSkin";
import { DashboardProvider } from "@/contexts/DashboardContext";
import { applySkin, METIER_TO_SKIN } from "@/theme";
import type { Skin } from "@/theme";
import "./dashboard.css";

interface DashboardLayoutProps {
  children: ReactNode;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface MeResponse {
  success: boolean;
  user?: { id: string; email: string };
  account?: {
    id: string;
    name: string | null;
    onboarding_completed?: boolean;
    owner_phone?: string | null;
    city?: string | null;
    is_admin?: boolean;
    pending_leads?: number;
  };
  error?: string;
}

interface AccountResponse {
  success: boolean;
  data?: { specialty?: string | null };
}

export default function DashboardLayout({ children }: Readonly<DashboardLayoutProps>) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [skin, setSkin] = useState<Skin>("core");
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingLeads, setPendingLeads] = useState(0);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.replace("/auth");
    }
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        let [meRes, accountRes] = await Promise.all([
          fetch("/api/auth/me", { method: "GET", credentials: "include" }),
          fetch("/api/account", { credentials: "include" }),
        ]);

        // Tenter un refresh si token expiré
        if (meRes.status === 401) {
          const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
          if (refreshRes.ok) {
            [meRes, accountRes] = await Promise.all([
              fetch("/api/auth/me", { method: "GET", credentials: "include" }),
              fetch("/api/account", { credentials: "include" }),
            ]);
          }
        }

        if (meRes.status === 401 || !meRes.ok) {
          if (!isMounted) return;
          setStatus("unauthenticated");
          router.replace("/auth");
          return;
        }

        const me = (await meRes.json()) as MeResponse;
        if (!isMounted) return;

        if (!me.account?.onboarding_completed) {
          setStatus("authenticated");
          router.replace("/onboarding");
          return;
        }

        // Resolve skin from specialty
        let resolvedSkin: Skin = "core";
        if (accountRes.ok) {
          const accountData = (await accountRes.json()) as AccountResponse;
          const specialty = accountData.data?.specialty ?? null;
          if (specialty) {
            resolvedSkin = METIER_TO_SKIN[specialty] ?? "core";
            applySkin(resolvedSkin);
          }
        }

        setAccountName(me.account?.name ?? null);
        setAccountEmail(me.user?.email ?? null);
        setSkin(resolvedSkin);
        setIsAdmin(me.account?.is_admin ?? false);
        setPendingLeads(me.account?.pending_leads ?? 0);
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

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ap-bg)" }}>
        <p style={{ fontSize: 13, color: "#6B7280", fontFamily: "var(--font-sans)" }}>Chargement…</p>
      </div>
    );
  }

  return (
    <DashboardProvider
      value={{ accountName, accountEmail, skin, pendingLeads, isAdmin, onLogout: handleLogout }}
    >
      <div style={{ minHeight: "100dvh", background: "var(--ap-bg)" }}>
        <RestoreSkin />
        <Sidebar
          accountName={accountName}
          accountEmail={accountEmail}
          metier={skin !== "core" ? skin : undefined}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          pendingLeads={pendingLeads}
        />
        <main
          style={{
            marginLeft: 220,
            minHeight: "100dvh",
            background: "var(--ap-bg)",
            padding: "28px 32px",
            fontFamily: "var(--font-sans)",
          }}
        >
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}
