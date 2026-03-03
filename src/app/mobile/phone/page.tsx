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
      <section className="rounded-2xl bg-slate-200 py-3 text-center">
        <p className={`tracking-widest ${number ? "text-slate-800" : "text-slate-500"}`}>
          {number || "Composez un numéro"}
        </p>
      </section>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-slate-600">Effacer</span>
        <button
          type="button"
          onClick={handleBackspace}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm"
          aria-label="Effacer"
        >
          <Delete className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>

      <section className="mx-auto mt-6 w-full max-w-[280px] flex-1">
        <PhoneKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </section>

      <button
        type="button"
        onClick={handleCall}
        disabled={!number}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 font-semibold text-white shadow-md disabled:opacity-40"
      >
        <PhoneCall className="h-5 w-5" strokeWidth={2} />
        Appeler
      </button>
    </div>
  );
}
