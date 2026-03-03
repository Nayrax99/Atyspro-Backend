import type { ReactNode } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-[#f2f5f9] pb-10 pt-10">
      <div className="flex w-full max-w-[390px] flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_40px_80px_rgba(15,23,42,0.15)]">
        <MobileHeader />
        <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-[88px] pt-8">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
