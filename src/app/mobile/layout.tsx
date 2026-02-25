import type { ReactNode } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 lg:my-8 lg:rounded-3xl lg:border lg:border-slate-200 lg:overflow-hidden lg:shadow-2xl">
      <main className="page-container flex flex-col">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

