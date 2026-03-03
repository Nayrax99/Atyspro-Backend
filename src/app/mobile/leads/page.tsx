"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import type { Lead, LeadsResponse } from "@/types/lead";
import { LeadCard } from "@/components/mobile/LeadCard";

const API_BASE = "";

export default function MobileLeadsPage() {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-[18px] bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">Aucun lead</p>
        <p className="mt-1 text-sm text-slate-500">Les leads apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {data.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </section>
  );
}
