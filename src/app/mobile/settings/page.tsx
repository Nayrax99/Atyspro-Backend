"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function MobileSettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="mb-4 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Compte
        </h2>
        <div className="overflow-hidden rounded-[24px] border border-[#f1f3f6] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
          <Link
            href="#"
            className="flex min-h-[56px] items-center justify-between border-b border-[#f1f3f6] px-5 transition-colors hover:bg-slate-50"
          >
            <span className="text-[15px] font-medium text-slate-800">Mon profil</span>
            <ChevronRight className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
          </Link>
          <div className="flex min-h-[56px] items-center justify-between px-5 transition-colors hover:bg-slate-50">
            <span className="text-[15px] font-medium text-slate-800">Mon numéro pro</span>
            <span className="text-[15px] font-medium text-[#2563eb]">+33 6 12 34 56 78</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Notifications
        </h2>
        <div className="overflow-hidden rounded-[24px] border border-[#f1f3f6] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
          <div className="flex min-h-[56px] items-center justify-between border-b border-[#f1f3f6] px-5 transition-colors hover:bg-slate-50">
            <span className="text-[15px] font-medium text-slate-800">Notifications push</span>
            <button
              type="button"
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                pushEnabled ? "bg-emerald-500" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={pushEnabled}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-transform ${
                  pushEnabled ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
          <Link
            href="#"
            className="flex min-h-[56px] items-center justify-between px-5 transition-colors hover:bg-slate-50"
          >
            <span className="text-[15px] font-medium text-slate-800">Seuil de score minimum</span>
            <span className="flex items-center gap-1 text-[15px] text-slate-500">
              50
              <ChevronRight className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
            </span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Application
        </h2>
        <div className="overflow-hidden rounded-[24px] border border-[#f1f3f6] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
          <div className="flex min-h-[56px] items-center justify-between border-b border-[#f1f3f6] px-5 transition-colors hover:bg-slate-50">
            <span className="text-[15px] font-medium text-slate-800">Version</span>
            <span className="text-[15px] text-slate-500">1.0.0</span>
          </div>
          <Link
            href="#"
            className="flex min-h-[56px] items-center justify-between px-5 transition-colors hover:bg-slate-50"
          >
            <span className="text-[15px] font-medium text-slate-800">
              Conditions d&apos;utilisation
            </span>
            <ChevronRight className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      <div className="pt-4">
        <button
          type="button"
          className="w-full py-4 text-[15px] font-medium text-red-600"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
