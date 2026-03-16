"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Users, BarChart3, Phone, Settings, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";

interface SidebarProps {
  accountName: string | null;
  onLogout: () => void;
  isAdmin?: boolean;
  pendingLeads?: number;
}

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Leads", icon: Users },
  { href: "/dashboard/stats", label: "Statistiques", icon: BarChart3 },
  { href: "/dashboard/calls", label: "Appels", icon: Phone },
  { href: "/dashboard/account", label: "Compte", icon: Settings },
];

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/leads");
  }
  return pathname.startsWith(href);
}

export default function Sidebar({
  accountName,
  onLogout,
  isAdmin = false,
  pendingLeads = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [logoutHovered, setLogoutHovered] = useState(false);

  return (
    <aside
      style={{
        width: "220px",
        background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
        color: "#fff",
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
          padding: "24px 20px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Link
          href="/dashboard"
          style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
        >
          <span
            style={{
              display: "flex",
              width: "32px",
              height: "32px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              backgroundColor: "rgba(255,255,255,0.12)",
              fontSize: "16px",
            }}
          >
            ⚡
          </span>
          <span
            style={{
              fontSize: "17px",
              fontWeight: "700",
              color: "white",
              letterSpacing: "-0.02em",
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
          padding: "12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = isNavActive(item.href, pathname);
          const isHovered = hoveredItem === item.href && !isActive;
          const showBadge = item.href === "/dashboard" && pendingLeads > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: isActive ? "#60a5fa" : "rgba(255,255,255,0.65)",
                textDecoration: "none",
                backgroundColor: isActive
                  ? "rgba(59,130,246,0.15)"
                  : isHovered
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
                borderLeft: `3px solid ${isActive ? "#3b82f6" : "transparent"}`,
                transition: "background-color 0.15s ease, color 0.15s ease",
                fontFamily: FONT,
              }}
            >
              <item.icon
                size={16}
                strokeWidth={1.75}
                style={{ opacity: isActive ? 1 : 0.7, flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>{item.label}</span>
              {showBadge && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "20px",
                    height: "20px",
                    padding: "0 5px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    borderRadius: "50%",
                    fontSize: "11px",
                    fontWeight: "700",
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {pendingLeads > 99 ? "99+" : pendingLeads}
                </span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div
              style={{
                height: "1px",
                backgroundColor: "rgba(255,255,255,0.1)",
                margin: "8px 4px",
              }}
            />
            <Link
              href="/admin"
              onMouseEnter={() => setHoveredItem("/admin")}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "500",
                color: pathname.startsWith("/admin") ? "#60a5fa" : "rgba(255,255,255,0.65)",
                textDecoration: "none",
                backgroundColor: pathname.startsWith("/admin")
                  ? "rgba(59,130,246,0.15)"
                  : hoveredItem === "/admin"
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
                borderLeft: `3px solid ${pathname.startsWith("/admin") ? "#3b82f6" : "transparent"}`,
                fontFamily: FONT,
              }}
            >
              <Shield
                size={16}
                strokeWidth={1.75}
                style={{ opacity: pathname.startsWith("/admin") ? 1 : 0.7 }}
              />
              Administration
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div
        style={{
          marginTop: "auto",
          padding: "16px 20px",
          paddingTop: "16px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          fontFamily: FONT,
        }}
      >
        {accountName && (
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.4)",
              marginBottom: "8px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: "500",
            }}
          >
            {accountName}
          </p>
        )}
        <button
          type="button"
          onClick={onLogout}
          onMouseEnter={() => setLogoutHovered(true)}
          onMouseLeave={() => setLogoutHovered(false)}
          style={{
            fontSize: "13px",
            color: logoutHovered ? "#ef4444" : "rgba(255,255,255,0.4)",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: "0",
            fontFamily: FONT,
            fontWeight: "500",
            transition: "color 0.15s ease",
          }}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
