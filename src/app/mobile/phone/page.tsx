"use client";

import { useState } from "react";
import { PhoneCall } from "lucide-react";
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
    // TODO: intégration Twilio
    console.log(`Appel vers ${number}`);
  };

  return (
    <div className="flex flex-1 flex-col gap-6 pb-4">
      <header className="page-header sticky top-0 z-10 pb-2 pt-0 text-center backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Téléphone Pro
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Composez un numéro pour rappeler un client.
        </p>
      </header>

      <section className="number-display">
        <div className="min-h-[3rem] font-mono">
          {number || <span className="text-slate-400">Aucun numéro</span>}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[280px] flex-1">
        <PhoneKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </section>

      <section>
        <button
          type="button"
          onClick={handleCall}
          className="call-btn flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={!number}
        >
          <PhoneCall className="h-6 w-6" />
          Appeler
        </button>
      </section>
    </div>
  );
}

