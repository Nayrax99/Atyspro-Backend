import type { ReactNode } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

/**
 * Layout mobile - Premium device preview sur desktop
 * Full width sur mobile réel (< 500px)
 */
export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--mobile-bg)] py-8 max-[500px]:block max-[500px]:py-0">
      <div className="flex h-[min(90vh,720px)] w-full max-w-[420px] flex-col overflow-hidden rounded-[36px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] max-[500px]:h-screen max-[500px]:max-w-none max-[500px]:rounded-none max-[500px]:shadow-none">
        <MobileHeader />
        <main className="mobile-scroll-area min-h-0 flex-1 overflow-auto bg-[#f2f2f7] px-4 pb-6 pt-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
