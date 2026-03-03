"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function MobileSettingsPage() {
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Compte
        </h2>
        <div className="rounded-[18px] bg-white shadow-md">
          <Link
            href="#"
            className="flex items-center justify-between border-b border-slate-100 px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-800">Mon profil</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-slate-800">
              Mon numéro pro
            </span>
            <span className="text-sm font-medium text-blue-600">
              +33 6 12 34 56 78
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Notifications
        </h2>
        <div className="rounded-[18px] bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-medium text-slate-800">
              Notifications push
            </span>
            <button
              type="button"
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                pushEnabled ? "bg-blue-600" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={pushEnabled}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${
                  pushEnabled ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
          <Link
            href="#"
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-800">
              Seuil de score minimum
            </span>
            <span className="flex items-center gap-1 text-sm text-slate-600">
              50
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </span>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Application
        </h2>
        <div className="rounded-[18px] bg-white shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-medium text-slate-800">Version</span>
            <span className="text-sm text-slate-600">1.0.0</span>
          </div>
          <Link
            href="#"
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm font-medium text-slate-800">
              Conditions d&apos;utilisation
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </section>

      <button
        type="button"
        className="w-full rounded-xl border border-transparent bg-transparent py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Se déconnecter
      </button>
    </div>
  );
}
