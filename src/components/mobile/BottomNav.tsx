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
    <nav
      className="shrink-0 border-t bg-white px-2 py-2"
      style={{
        borderColor: "var(--mobile-separator)",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 ${
                isActive ? "text-[#007AFF]" : "text-[#8e8e93]"
              }`}
            >
              <tab.Icon className="h-6 w-6" strokeWidth={isActive ? 2.2 : 1.6} aria-hidden />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
