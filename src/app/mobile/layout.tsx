import type { ReactNode } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

const commitHash = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "local";

/**
 * Layout mobile - DEBUG: Visual proof + commit hash
 * If black background is NOT visible on /mobile routes, this layout is not active.
 */
export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "black",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 4,
          right: 8,
          zIndex: 9999,
          fontSize: 10,
          fontFamily: "monospace",
          opacity: 0.8,
        }}
      >
        LAYOUT ACTIVE | {commitHash.slice(0, 7)}
      </div>
      MOBILE LAYOUT ACTIVE
      <div className="mx-auto flex min-h-screen max-w-md flex-col overflow-x-hidden bg-[#f1f3f6]">
        <MobileHeader />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-24 pt-6">
          <div className="mt-4">{children}</div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
