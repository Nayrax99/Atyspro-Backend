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
      <section className="rounded-2xl bg-slate-100 px-4 py-4">
        <p className="text-center font-mono text-lg tracking-wide text-slate-500">
          {number || "Composez un numéro"}
        </p>
      </section>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">Effacer</span>
        <button
          type="button"
          onClick={handleBackspace}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
          aria-label="Effacer"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>

      <section className="mx-auto w-full max-w-[280px] flex-1">
        <PhoneKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </section>

      <button
        type="button"
        onClick={handleCall}
        disabled={!number}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-md disabled:opacity-50"
      >
        <PhoneCall className="h-5 w-5" />
        Appeler
      </button>
    </div>
  );
}
