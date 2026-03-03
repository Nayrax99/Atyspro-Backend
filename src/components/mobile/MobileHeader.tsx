"use client";

import { Zap, Bell } from "lucide-react";

/**
 * Header - iOS-native style
 * Flat blue, minimal, elegant
 */
export function MobileHeader() {
  return (
    <header
      className="relative z-10 shrink-0 flex items-center justify-between px-5 py-3"
      style={{
        background: "#007AFF",
        borderRadius: "0 0 20px 20px",
        boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex flex-1 items-center justify-center gap-1.5">
        <h1 className="text-[17px] font-semibold text-white">
          AtysPro
        </h1>
        <Zap className="h-4 w-4 text-amber-200" strokeWidth={2} aria-hidden />
      </div>
      <button
        type="button"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.5} />
        <span
          className="absolute right-0 top-1 h-2 w-2 rounded-full bg-red-500"
          aria-hidden
        />
      </button>
    </header>
  );
}
