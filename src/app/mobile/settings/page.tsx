"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function MobileSettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Compte
        </h2>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <Link
            href="#"
            className="flex min-h-[48px] items-center justify-between border-b border-slate-100 px-4"
          >
            <span className="text-sm font-medium text-slate-800">Mon profil</span>
            <ChevronRight className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
          </Link>
          <div className="flex min-h-[48px] items-center justify-between px-4">
            <span className="text-sm font-medium text-slate-800">Mon numéro pro</span>
            <span className="text-sm font-medium text-blue-600">+33 6 12 34 56 78</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Notifications
        </h2>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex min-h-[48px] items-center justify-between border-b border-slate-100 px-4">
            <span className="text-sm font-medium text-slate-800">Notifications push</span>
            <button
              type="button"
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                pushEnabled ? "bg-emerald-500" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={pushEnabled}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  pushEnabled ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </div>
          <Link
            href="#"
            className="flex min-h-[48px] items-center justify-between px-4"
          >
            <span className="text-sm font-medium text-slate-800">Seuil de score minimum</span>
            <span className="flex items-center gap-1 text-sm text-slate-500">
              50
              <ChevronRight className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
            </span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Application
        </h2>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex min-h-[48px] items-center justify-between border-b border-slate-100 px-4">
            <span className="text-sm font-medium text-slate-800">Version</span>
            <span className="text-sm text-slate-500">1.0.0</span>
          </div>
          <Link
            href="#"
            className="flex min-h-[48px] items-center justify-between px-4"
          >
            <span className="text-sm font-medium text-slate-800">
              Conditions d&apos;utilisation
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      <div className="pt-4">
        <button
          type="button"
          className="w-full py-3 text-sm font-medium text-red-600"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
