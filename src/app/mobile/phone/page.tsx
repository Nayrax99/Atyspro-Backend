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
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-xl bg-slate-100 px-5 py-5 shadow-sm">
        <p
          className={`text-center font-mono text-xl tracking-wide ${
            number ? "text-slate-800 font-medium" : "text-slate-400"
          }`}
        >
          {number || "Composez un numéro"}
        </p>
      </section>

      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-slate-500">Effacer</span>
        <button
          type="button"
          onClick={handleBackspace}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm"
          aria-label="Effacer"
        >
          <Delete className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>

      <section className="mx-auto w-full max-w-[260px] flex-1">
        <PhoneKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </section>

      <button
        type="button"
        onClick={handleCall}
        disabled={!number}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-sm disabled:opacity-40"
      >
        <PhoneCall className="h-5 w-5" strokeWidth={2} />
        Appeler
      </button>
    </div>
  );
}
