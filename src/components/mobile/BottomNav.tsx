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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[480px]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 8px)" }}
    >
      <div className="flex items-center justify-between px-2 pt-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 transition-colors duration-200 ${
                isActive ? "nav-tab-active text-indigo-600" : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center">
                <tab.Icon
                  className={`h-6 w-6 ${isActive ? "stroke-[2] text-indigo-600" : "stroke-[1.5] text-slate-400"}`}
                  aria-hidden
                />
              </span>
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="mt-0.5 h-1 w-1 rounded-full bg-indigo-600" aria-hidden />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
