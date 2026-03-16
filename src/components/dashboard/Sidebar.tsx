"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <aside
      className="atys-sidebar"
      style={{ fontFamily: FONT }}
    >
      {/* Brand */}
      <div
        className="atys-sidebar-brand"
      >
        <Link
          href="/dashboard"
          style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
        >
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
        className="atys-sidebar-nav"
        style={{ fontFamily: FONT }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = isNavActive(item.href, pathname);
          const showBadge = item.href === "/dashboard" && pendingLeads > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`atys-sidebar-link ${isActive ? "atys-sidebar-link--active" : ""}`}
            >
              <item.icon
                size={16}
                strokeWidth={1.75}
                style={{ opacity: isActive ? 1 : 0.85, flexShrink: 0 }}
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
              className={`atys-sidebar-link ${pathname.startsWith("/admin") ? "atys-sidebar-link--active" : ""}`}
            >
              <Shield
                size={16}
                strokeWidth={1.75}
                style={{ opacity: pathname.startsWith("/admin") ? 1 : 0.85 }}
              />
              Administration
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="atys-sidebar-footer" style={{ fontFamily: FONT }}>
        {accountName && (
          <p className="atys-sidebar-account">
            {accountName}
          </p>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="atys-sidebar-logout"
          style={{ fontFamily: FONT }}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
