"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Skin } from "@/theme";

interface DashboardContextValue {
  accountName: string | null;
  accountEmail: string | null;
  skin: Skin;
  pendingLeads: number;
  isAdmin: boolean;
  onLogout: () => void;
}

const DashboardContext = createContext<DashboardContextValue>({
  accountName: null,
  accountEmail: null,
  skin: "core",
  pendingLeads: 0,
  isAdmin: false,
  onLogout: () => {},
});

export function DashboardProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DashboardContextValue;
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
