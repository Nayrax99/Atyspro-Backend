import type { ReactNode } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileShell } from "@/components/mobile/MobileShell";

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <MobileShell>
      <div className="flex h-full w-full max-w-[390px] flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_40px_80px_rgba(15,23,42,0.15)]">
        <MobileHeader />
        <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-[88px] pt-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </MobileShell>
  );
}
