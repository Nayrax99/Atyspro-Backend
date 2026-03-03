"use client";

import { Zap, Bell } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="relative z-10 flex h-[64px] shrink-0 items-center justify-between rounded-b-[28px] bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] px-5">
      <div className="flex flex-1 items-center justify-center gap-1.5">
        <h1 className="text-[17px] font-semibold tracking-[0.01em] text-white">
          AtysPro
        </h1>
        <Zap className="h-4 w-4 text-amber-200" strokeWidth={2} aria-hidden />
      </div>
      <button
        type="button"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-white opacity-90" strokeWidth={1.5} />
        <span
          className="absolute top-[14px] right-[18px] h-[8px] w-[8px] rounded-full bg-red-500 ring-2 ring-white"
          aria-hidden
        />
      </button>
    </header>
  );
}
