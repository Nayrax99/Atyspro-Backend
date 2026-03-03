import type { ReactNode } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

/**
 * Layout mobile - Premium device preview sur desktop
 * Full width sur mobile réel (< 500px)
 */
export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 py-8 max-[500px]:block max-[500px]:py-0">
      <div className="flex h-[min(90vh,720px)] w-full max-w-[420px] flex-col overflow-hidden rounded-xl bg-white shadow-sm max-[500px]:h-screen max-[500px]:max-w-none max-[500px]:rounded-none max-[500px]:shadow-none">
        <MobileHeader />
        <main className="mobile-scroll-area min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 px-5 pb-6 pt-6 max-[500px]:px-4">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
