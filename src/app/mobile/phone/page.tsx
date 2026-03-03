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
    <div className="flex flex-1 flex-col gap-10">
      <section
        className="rounded-[12px] px-6 py-6"
        style={{ background: "rgba(118,118,128,0.12)" }}
      >
        <p
          className={`text-center font-mono text-[28px] font-medium tracking-[0.15em] leading-relaxed ${
            number ? "text-[#1c1c1e]" : "text-[#8e8e93]"
          }`}
        >
          {number || "Composez un numéro"}
        </p>
      </section>

      <div className="flex items-center justify-between">
        <span className="text-[15px] font-medium text-[#8e8e93]">Effacer</span>
        <button
          type="button"
          onClick={handleBackspace}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#8e8e93] active:opacity-70"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
          aria-label="Effacer"
        >
          <Delete className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>

      <section className="mx-auto w-full max-w-[280px] flex-1">
        <PhoneKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </section>

      <button
        type="button"
        onClick={handleCall}
        disabled={!number}
        className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#007AFF] px-6 py-4 text-[17px] font-semibold text-white active:opacity-80 disabled:opacity-40 disabled:active:opacity-40"
      >
        <PhoneCall className="h-5 w-5" strokeWidth={2} />
        Appeler
      </button>
    </div>
  );
}
