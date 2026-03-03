"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function MobileSettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
          Compte
        </h2>
        <div
          className="overflow-hidden rounded-[20px] bg-white"
          style={{
            boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
          }}
        >
          <Link
            href="#"
            className="flex items-center justify-between border-b border-slate-100 px-5 py-4 transition-colors hover:bg-slate-50/80"
          >
            <span className="text-sm font-semibold text-slate-800">Mon profil</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-semibold text-slate-800">
              Mon numéro pro
            </span>
            <span className="text-sm font-semibold text-blue-600">
              +33 6 12 34 56 78
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
          Notifications
        </h2>
        <div
          className="overflow-hidden rounded-[20px] bg-white"
          style={{
            boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <span className="text-sm font-semibold text-slate-800">
              Notifications push
            </span>
            <button
              type="button"
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
                pushEnabled ? "bg-blue-600" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={pushEnabled}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  pushEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
          <Link
            href="#"
            className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/80"
          >
            <span className="text-sm font-semibold text-slate-800">
              Seuil de score minimum
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-slate-500">
              50
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
          Application
        </h2>
        <div
          className="overflow-hidden rounded-[20px] bg-white"
          style={{
            boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
          }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <span className="text-sm font-semibold text-slate-800">Version</span>
            <span className="text-sm font-medium text-slate-500">1.0.0</span>
          </div>
          <Link
            href="#"
            className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/80"
          >
            <span className="text-sm font-semibold text-slate-800">
              Conditions d&apos;utilisation
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </section>

      <div className="pt-4">
        <button
          type="button"
          className="w-full rounded-[20px] border border-transparent bg-transparent py-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 active:scale-[0.99]"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
