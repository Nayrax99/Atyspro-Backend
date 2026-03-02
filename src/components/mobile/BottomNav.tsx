"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, Phone, Settings } from "lucide-react";

type TabKey = "phone" | "leads" | "settings";

const tabs: { key: TabKey; href: string; label: string; Icon: typeof Phone }[] = [
  { key: "phone", href: "/mobile/phone", label: "Téléphone", Icon: Phone },
  { key: "leads", href: "/mobile/leads", label: "Leads", Icon: List },
  { key: "settings", href: "/mobile/settings", label: "Paramètres", Icon: Settings },
];

/**
 * BottomNav premium - Glassmorphism, icône actif gradient + translateY
 * Barre indicateur top au-dessus de l'icône active
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 12px)",
        paddingTop: "12px",
      }}
    >
      <div className="flex items-end justify-between px-4">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isActive
                  ? "text-[#2563eb]"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {/* Barre indicateur top - visible uniquement quand actif */}
              {isActive && (
                <div
                  className="mb-1 h-1 w-8 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)",
                }}
                aria-hidden
                role="presentation"
              />
              )}
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isActive
                    ? "translate-y-[-4px]"
                    : "translate-y-0"
                }`}
                style={
                  isActive
                    ? {
                        background:
                          "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                        boxShadow: "0 8px 24px rgba(37, 99, 235, 0.4)",
                      }
                    : undefined
                }
              >
                <tab.Icon
                  className={`h-5 w-5 ${
                    isActive
                      ? "stroke-[2.5] text-white"
                      : "stroke-[1.5]"
                  }`}
                  aria-hidden
                />
              </span>
              <span
                className={`text-[10px] font-bold ${
                  isActive ? "text-[#2563eb]" : "text-slate-500"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
