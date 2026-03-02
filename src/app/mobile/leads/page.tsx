"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Zap } from "lucide-react";
import type { Lead, LeadsResponse } from "@/types/lead";
import { LeadCard } from "@/components/mobile/LeadCard";

type FilterKey = "all" | "urgent" | "complete" | "review";

const API_BASE = "";

export default function MobileLeadsPage() {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/leads?page=1&limit=50`)
      .then((res) => res.json())
      .then((json: LeadsResponse & { error?: string }) => {
        if (cancelled) return;
        if (!json.success) {
          setError(json.error || "Erreur inconnue");
          setData([]);
          return;
        }
        setData(json.data || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Erreur réseau");
          setData([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const leadsToCall = useMemo(
    () => data.filter((l) => l.status !== "complete"),
    [data],
  );

  const filteredLeads = useMemo(() => {
    switch (filter) {
      case "urgent":
        return leadsToCall.filter(
          (l) => l.delay_code === 1 || (l.priority_score ?? 0) >= 70,
        );
      case "complete":
        return data.filter((l) => l.status === "complete");
      case "review":
        return data.filter((l) => l.status === "needs_review");
      default:
        return data;
    }
  }, [data, leadsToCall, filter]);

  const countAll = data.length;
  const countUrgent = leadsToCall.filter(
    (l) => l.delay_code === 1 || (l.priority_score ?? 0) >= 70,
  ).length;
  const countComplete = data.filter((l) => l.status === "complete").length;
  const countReview = data.filter((l) => l.status === "needs_review").length;

  return (
    <div className="flex flex-1 flex-col pb-4">
      {/* HEADER premium - gradient bleu→violet + stats glassmorphism - full width */}
      <header
        className="relative -mx-6 -mt-6 mb-0 overflow-hidden px-6 pb-6 pt-14"
        style={{
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
        }}
      >
        {/* Effet radial gradient décoratif */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(251,191,36,0.5) 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
          }}
        />

        {/* Logo + Titre */}
        <div className="relative flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              boxShadow: "0 4px 16px rgba(251,191,36,0.5)",
            }}
          >
            <Zap className="h-6 w-6 text-white" aria-hidden />
          </div>
          <div>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.5px] text-white">
              À rappeler
            </h1>
            <p className="mt-0.5 text-sm font-medium text-white/80">
              Leads issus des appels manqués et SMS
            </p>
          </div>
        </div>

        {/* Stats row - 3 cards glassmorphism */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              Tous
            </p>
            <p className="mt-0.5 text-xl font-extrabold text-white">
              {countAll}
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              Urgent
            </p>
            <p className="mt-0.5 text-xl font-extrabold text-white">
              {countUrgent}
            </p>
          </div>
          <div
            className="rounded-2xl px-4 py-3"
            style={{
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              À faire
            </p>
            <p className="mt-0.5 text-xl font-extrabold text-white">
              {leadsToCall.length}
            </p>
          </div>
        </div>
      </header>

      {/* Filtres - Pills avec effet morphing */}
      <section className="flex shrink-0 gap-3 overflow-x-auto px-0 py-4 scrollbar-hide">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`filter-btn flex items-center gap-2 ${
            filter === "all" ? "filter-active" : "filter-inactive"
          }`}
        >
          Tous
          <span className="font-mono text-[11px] font-bold opacity-90">
            {countAll}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("urgent")}
          className={`filter-btn flex items-center gap-2 ${
            filter === "urgent" ? "filter-urgent-active" : "filter-inactive"
          }`}
        >
          Urgent
          <span className="font-mono text-[11px] font-bold opacity-90">
            {countUrgent}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("complete")}
          className={`filter-btn flex items-center gap-2 ${
            filter === "complete" ? "filter-active" : "filter-inactive"
          }`}
        >
          Complete
          <span className="font-mono text-[11px] font-bold opacity-90">
            {countComplete}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("review")}
          className={`filter-btn flex items-center gap-2 ${
            filter === "review" ? "filter-active" : "filter-inactive"
          }`}
        >
          À vérifier
          <span className="font-mono text-[11px] font-bold opacity-90">
            {countReview}
          </span>
        </button>
      </section>

      {loading && (
        <div className="space-y-4 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-3xl bg-slate-100/80"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Erreur : {error}</span>
        </div>
      )}

      {!loading && !error && filteredLeads.length === 0 && (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
            <AlertCircle className="h-7 w-7" />
          </div>
          <p className="text-sm font-medium text-slate-900">Aucune demande en attente</p>
          <p className="max-w-xs text-sm text-slate-500">
            Les appels manqués et les demandes qualifiées apparaîtront ici.
          </p>
        </div>
      )}

      {!loading && !error && filteredLeads.length > 0 && (
        <section className="space-y-5 pb-4 pt-2">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </section>
      )}
    </div>
  );
}

