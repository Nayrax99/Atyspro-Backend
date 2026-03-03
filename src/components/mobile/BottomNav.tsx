"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, Phone, Settings } from "lucide-react";

type TabKey = "phone" | "leads" | "settings";

const tabs: { key: TabKey; href: string; label: string; Icon: typeof Phone }[] = [
  { key: "phone", href: "/mobile/phone", label: "Clavier", Icon: Phone },
  { key: "leads", href: "/mobile/leads", label: "Leads", Icon: List },
  { key: "settings", href: "/mobile/settings", label: "Paramètres", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-[72px] shrink-0 items-center justify-around border-t border-[#eef2f7] bg-white px-2 shadow-[0_-6px_20px_rgba(15,23,42,0.06)]">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`flex flex-col items-center justify-center ${
              isActive ? "text-[#2563eb]" : "text-slate-400"
            }`}
          >
            <tab.Icon
              className="h-6 w-6"
              strokeWidth={isActive ? 2.2 : 1.6}
              aria-hidden
            />
            <span className="mt-1 text-[12px]">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
