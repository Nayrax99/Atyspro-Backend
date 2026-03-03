"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function MobileSettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-2 px-1 text-[13px] font-normal text-[#8e8e93] uppercase tracking-[0.02em]">
          Compte
        </h2>
        <div className="overflow-hidden rounded-[12px] bg-white">
          <Link
            href="#"
            className="flex min-h-[44px] items-center justify-between border-b px-4"
            style={{ borderColor: "var(--mobile-separator)" }}
          >
            <span className="text-[17px] font-normal text-[#1c1c1e]">Mon profil</span>
            <ChevronRight className="h-5 w-5 text-[#c7c7cc]" strokeWidth={1.5} />
          </Link>
          <div
            className="flex min-h-[44px] items-center justify-between px-4"
          >
            <span className="text-[17px] font-normal text-[#1c1c1e]">Mon numéro pro</span>
            <span className="text-[17px] font-normal text-[#007AFF]">+33 6 12 34 56 78</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-normal text-[#8e8e93] uppercase tracking-[0.02em]">
          Notifications
        </h2>
        <div className="overflow-hidden rounded-[12px] bg-white">
          <div
            className="flex min-h-[44px] items-center justify-between border-b px-4"
            style={{ borderColor: "var(--mobile-separator)" }}
          >
            <span className="text-[17px] font-normal text-[#1c1c1e]">Notifications push</span>
            <button
              type="button"
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`relative h-7 w-[51px] shrink-0 rounded-full transition-colors ${
                pushEnabled ? "bg-[#34c759]" : "bg-[#e5e5ea]"
              }`}
              role="switch"
              aria-checked={pushEnabled}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                  pushEnabled ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
          <Link
            href="#"
            className="flex min-h-[44px] items-center justify-between px-4"
          >
            <span className="text-[17px] font-normal text-[#1c1c1e]">Seuil de score minimum</span>
            <span className="flex items-center gap-1 text-[17px] font-normal text-[#8e8e93]">
              50
              <ChevronRight className="h-5 w-5 text-[#c7c7cc]" strokeWidth={1.5} />
            </span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 px-1 text-[13px] font-normal text-[#8e8e93] uppercase tracking-[0.02em]">
          Application
        </h2>
        <div className="overflow-hidden rounded-[12px] bg-white">
          <div
            className="flex min-h-[44px] items-center justify-between border-b px-4"
            style={{ borderColor: "var(--mobile-separator)" }}
          >
            <span className="text-[17px] font-normal text-[#1c1c1e]">Version</span>
            <span className="text-[17px] font-normal text-[#8e8e93]">1.0.0</span>
          </div>
          <Link
            href="#"
            className="flex min-h-[44px] items-center justify-between px-4"
          >
            <span className="text-[17px] font-normal text-[#1c1c1e]">
              Conditions d&apos;utilisation
            </span>
            <ChevronRight className="h-5 w-5 text-[#c7c7cc]" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      <div className="pt-4">
        <button
          type="button"
          className="w-full py-4 text-[17px] font-normal text-[#ff3b30]"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
