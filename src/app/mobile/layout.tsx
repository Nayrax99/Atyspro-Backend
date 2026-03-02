import type { ReactNode } from "react";
import { BottomNav } from "@/components/mobile/BottomNav";

/**
 * Layout mobile premium - Background gradient app + container iPhone-like
 * Design: AtysPro Électricien - Uber/Airbnb/Revolut niveau
 */
export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    /* Background gradient global (135deg #667eea → #764ba2) */
    <div
      className="min-h-screen lg:py-8 lg:px-4"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {/* Container mobile glassmorphism - border-radius 48px iPhone-like */}
      <div className="relative mx-auto min-h-[calc(100vh-4rem)] max-w-[480px] overflow-hidden lg:rounded-[48px] lg:shadow-2xl">
        <main className="page-container flex flex-col">
          {children}
        </main>
        {/* BottomNav fixed pour mobile, contenu dans le viewport */}
        <BottomNav />
      </div>
    </div>
  );
}

