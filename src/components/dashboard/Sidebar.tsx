"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, BarChart3, Phone, Bell, Settings, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  accountName: string | null;
  onLogout: () => void;
}

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Leads", icon: Users },
  { href: "/dashboard/stats", label: "Statistiques", icon: BarChart3 },
  { href: "/dashboard/calls", label: "Appels IA", icon: Phone },
  { href: "/dashboard/notifs", label: "Notifications", icon: Bell },
  { href: "/dashboard/account", label: "Compte", icon: Settings },
];

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    // Actif sur /dashboard et /dashboard/leads/[id]
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/leads");
  }
  return pathname.startsWith(href);
}

export default function Sidebar({ accountName, onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="dashboard-sidebar">
      <div className="dashboard-sidebar-brand">
        <Link href="/dashboard">AtysPro</Link>
      </div>

      <nav className="dashboard-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dashboard-sidebar-link${isActive ? " dashboard-sidebar-link--active" : ""}`}
            >
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}

        <div className="dashboard-sidebar-divider" />

        <Link
          href="/admin"
          className={`dashboard-sidebar-link${pathname.startsWith("/admin") ? " dashboard-sidebar-link--active" : ""}`}
        >
          <Shield size={16} strokeWidth={1.75} />
          Administration
        </Link>
      </nav>

      <div className="dashboard-sidebar-footer">
        {accountName && (
          <p className="dashboard-sidebar-account">{accountName}</p>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="dashboard-sidebar-logout"
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
