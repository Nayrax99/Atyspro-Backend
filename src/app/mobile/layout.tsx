import type { ReactNode } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

/**
 * Layout mobile - Interface web interne légère
 * max-width 420px, fond neutre clair, header et nav partagés
 */
export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto min-h-screen max-w-[420px] bg-slate-50 shadow-sm">
        <MobileHeader />
        <main className="px-4 pb-24 pt-4">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
