"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, BarChart3, Phone, Settings, Shield, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import MetierBadge from "@/components/ui/MetierBadge";

const FONT = "var(--font-sans, 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif)";

interface SidebarProps {
  accountName: string | null;
  accountEmail?: string | null;
  metier?: string | null;
  onLogout: () => void;
  isAdmin?: boolean;
  pendingLeads?: number;
}

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard",       label: "Leads",         icon: Users },
  { href: "/dashboard/stats", label: "Statistiques",  icon: BarChart3 },
  { href: "/dashboard/calls", label: "Appels",        icon: Phone },
  { href: "/dashboard/account", label: "Compte",      icon: Settings },
];

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/leads");
  }
  return pathname.startsWith(href);
}

export default function Sidebar({
  accountName,
  accountEmail,
  metier,
  onLogout,
  isAdmin = false,
  pendingLeads = 0,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        background: "#0D1B38",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        overflowY: "auto",
        zIndex: 50,
        fontFamily: FONT,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "22px 18px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/dashboard"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
        >
          {/* Logo icon — hexagone */}
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--ap-primary)",
              borderRadius: 9,
              boxShadow: "0 0 0 4px rgba(26,86,219,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z"
                fill="rgba(255,255,255,0.15)"
                stroke="white"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="12" r="3" fill="white" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-0.03em",
            }}
          >
            AtysPro
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = isNavActive(item.href, pathname);
          const showBadge = item.href === "/dashboard" && pendingLeads > 0;

          return (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isActive}
              badge={showBadge ? (pendingLeads > 99 ? "99+" : String(pendingLeads)) : undefined}
            />
          );
        })}

        {isAdmin && (
          <>
            <div
              style={{
                height: 1,
                background: "rgba(255,255,255,0.06)",
                margin: "8px 4px",
              }}
            />
            <NavLink
              href="/admin"
              label="Administration"
              icon={Shield}
              isActive={pathname.startsWith("/admin")}
            />
          </>
        )}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "14px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* User block */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 10,
          }}
        >
          {accountName && (
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#C8D8F0",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {accountName}
            </p>
          )}
          {accountEmail && (
            <p
              style={{
                fontSize: 11,
                color: "#2D4060",
                margin: "2px 0 0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {accountEmail}
            </p>
          )}
          {metier && metier !== "core" && metier !== "" && (
            <MetierBadge metier={metier} style={{ marginTop: 8 }} />
          )}
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "8px 10px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "#3D5A80",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: FONT,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#3D5A80"; }}
        >
          <LogOut size={14} strokeWidth={1.75} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}

/* ─── NavLink subcomponent ─────────────────────────────────────── */

interface NavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: string;
}

function NavLink({ href, label, icon: Icon, isActive, badge }: NavLinkProps) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 11px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        textDecoration: "none",
        color: isActive ? "#FFFFFF" : "#3D5A80",
        background: isActive
          ? "linear-gradient(135deg, var(--ap-primary)dd, var(--ap-primary)99)"
          : "transparent",
        boxShadow: isActive ? "0 2px 8px var(--ap-primary, #1A56DB)55" : "none",
        transition: "background 0.15s, color 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.color = "#7A9CC0";
          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.color = "#3D5A80";
          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
        }
      }}
    >
      <Icon size={15} strokeWidth={isActive ? 2 : 1.75} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span
          style={{
            background: "#DC2626",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 20,
            minWidth: 20,
            textAlign: "center",
            animation: "ap-pulse-badge 2s ease-in-out infinite",
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
