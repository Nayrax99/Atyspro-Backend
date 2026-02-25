"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
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
    <div className="flex flex-1 flex-col gap-3 pb-4">
      <header className="page-header sticky top-0 z-10 pb-4 pt-0 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            À rappeler
          </h1>
          <span className="count-badge ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
            {leadsToCall.length}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Leads issus des appels manqués et SMS de qualification.
        </p>
      </header>

      <section className="flex shrink-0 gap-2 overflow-x-auto scrollbar-hide pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`filter-btn flex items-center gap-1.5 ${
            filter === "all" ? "filter-active" : "filter-inactive"
          }`}
        >
          Tous
          <span className="font-mono text-[11px] opacity-90">{countAll}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("urgent")}
          className={`filter-btn flex items-center gap-1.5 ${
            filter === "urgent" ? "filter-urgent-active" : "filter-inactive"
          }`}
        >
          Urgent
          <span className="font-mono text-[11px] opacity-90">{countUrgent}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("complete")}
          className={`filter-btn flex items-center gap-1.5 ${
            filter === "complete" ? "filter-active" : "filter-inactive"
          }`}
        >
          Complete
          <span className="font-mono text-[11px] opacity-90">{countComplete}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter("review")}
          className={`filter-btn flex items-center gap-1.5 ${
            filter === "review" ? "filter-active" : "filter-inactive"
          }`}
        >
          À vérifier
          <span className="font-mono text-[11px] opacity-90">{countReview}</span>
        </button>
      </section>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-32 animate-pulse" />
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
        <section className="space-y-4 pb-4">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </section>
      )}
    </div>
  );
}

