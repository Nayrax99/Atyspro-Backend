import type { ReactNode } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

/**
 * Layout mobile - Premium device preview sur desktop
 * Full width sur mobile réel (< 500px)
 */
export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col overflow-x-hidden bg-[#f1f3f6]">
      <MobileHeader />
      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-24 pt-6">
        <div className="mt-4">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
