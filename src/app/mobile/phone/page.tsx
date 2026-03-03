"use client";

import { useState } from "react";
import { PhoneCall, Delete } from "lucide-react";
import { PhoneKeypad } from "@/components/mobile/PhoneKeypad";

export default function PhonePage() {
  const [number, setNumber] = useState("");

  const handleDigit = (digit: string) => {
    setNumber((prev) => (prev + digit).slice(0, 20));
  };

  const handleBackspace = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!number) return;
    console.log(`Appel vers ${number}`);
  };

  return (
    <div className="flex flex-1 flex-col">
      <section className="rounded-[20px] bg-[#e5e7eb] py-4 text-center">
        <p className={`text-[14px] tracking-[0.2em] ${number ? "text-slate-800" : "text-slate-600"}`}>
          {number || "Composez un numéro"}
        </p>
      </section>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-[14px] text-slate-600">Effacer</span>
        <button
          type="button"
          onClick={handleBackspace}
          className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-white shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
          aria-label="Effacer"
        >
          <Delete className="h-5 w-5 text-slate-500" strokeWidth={1.8} />
        </button>
      </div>

      <section className="mx-auto mt-6 w-full max-w-[280px] flex-1">
        <PhoneKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </section>

      <button
        type="button"
        onClick={handleCall}
        disabled={!number}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-[20px] bg-gradient-to-r from-[#3b82f6] to-[#2563eb] py-3 text-[16px] font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.4)] disabled:opacity-40"
      >
        <PhoneCall className="h-5 w-5" strokeWidth={2} />
        Appeler
      </button>
    </div>
  );
}
