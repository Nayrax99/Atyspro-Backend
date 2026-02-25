"use client";

import { LogOut } from "lucide-react";

export default function MobileSettingsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 pb-4">
      <header className="page-header sticky top-0 z-10 pb-4 pt-0 backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Paramètres
        </h1>
      </header>

      <section className="space-y-4">
        <div className="settings-card">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            MON COMPTE
          </h2>
          <div className="space-y-1 text-sm text-slate-800">
            <p>Artisan AtysPro</p>
            <p className="text-slate-500">demo@atyspro.app</p>
            <p className="text-slate-500">+33 6 00 00 00 00</p>
          </div>
        </div>

        <div className="settings-card">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            NOTIFICATIONS
          </h2>
          <div className="flex items-center justify-between text-sm text-slate-800">
            <span>Notifications push</span>
            <span className="toggle-off">OFF</span>
          </div>
        </div>

        <div className="settings-card">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            À PROPOS
          </h2>
          <p className="text-sm text-slate-800">AtysPro - Version V1</p>
        </div>
      </section>

      <section className="mt-auto">
        <button
          type="button"
          className="logout-btn flex items-center justify-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </section>
    </div>
  );
}

