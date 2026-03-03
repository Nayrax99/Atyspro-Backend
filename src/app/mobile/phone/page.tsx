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
      <section className="mt-4 rounded-[20px] bg-[#eef2f7] py-5 text-center shadow-inner">
        <p
          className={`text-[15px] tracking-[0.25em] ${
            number ? "text-slate-800" : "text-slate-600"
          }`}
        >
          {number || "Composez un numéro"}
        </p>
      </section>

      <div className="mt-8 flex items-center justify-between">
        <span className="text-[14px] text-slate-600">Effacer</span>
        <button
          type="button"
          onClick={handleBackspace}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-[20px] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.12)]"
          aria-label="Effacer"
        >
          <Delete className="h-5 w-5 text-slate-500" strokeWidth={1.8} />
        </button>
      </div>

      <section className="mx-auto mt-8 w-full max-w-[300px] flex-1">
        <PhoneKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </section>

      <button
        type="button"
        onClick={handleCall}
        disabled={!number}
        className="mt-10 flex w-full items-center justify-center gap-2 rounded-[22px] bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] py-[14px] text-[16px] font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.45)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
      >
        <PhoneCall className="h-5 w-5" strokeWidth={2} />
        Appeler
      </button>
    </div>
  );
}
