import type { ReactNode } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-[#e9edf3] py-8">
      <div className="flex w-full max-w-[390px] flex-col overflow-hidden rounded-[32px] bg-[#f5f6f8] shadow-[0_30px_60px_rgba(0,0,0,0.12)]">
        <MobileHeader />
        <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-24 pt-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
