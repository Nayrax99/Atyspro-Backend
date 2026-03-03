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
    <div className="flex flex-1 flex-col gap-8">
      <section
        className="rounded-[20px] px-5 py-5"
        style={{
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <p
          className={`text-center font-mono text-xl tracking-[0.2em] ${
            number ? "text-slate-800 font-semibold" : "text-slate-400 font-medium"
          }`}
        >
          {number || "Composez un numéro"}
        </p>
      </section>

      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium text-slate-500">Effacer</span>
        <button
          type="button"
          onClick={handleBackspace}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 active:scale-95"
          aria-label="Effacer"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>

      <section className="mx-auto w-full max-w-[300px] flex-1">
        <PhoneKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </section>

      <button
        type="button"
        onClick={handleCall}
        disabled={!number}
        className="flex w-full items-center justify-center gap-2.5 rounded-[20px] px-6 py-4 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
          boxShadow: number ? "0 8px 24px rgba(37, 99, 235, 0.35)" : "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <PhoneCall className="h-5 w-5" strokeWidth={2} />
        Appeler
      </button>
    </div>
  );
}
