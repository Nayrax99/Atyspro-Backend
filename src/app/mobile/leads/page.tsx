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
      <div className="mt-6 space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-28 rounded-[24px] border border-[#f1f3f6] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-[24px] bg-red-50 px-5 py-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
        <span className="text-[14px] font-medium text-red-700">{error}</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <AlertCircle className="h-7 w-7 text-slate-500" />
        </div>
        <p className="mt-6 text-[17px] font-semibold text-slate-900">Aucun lead</p>
        <p className="mt-2 max-w-[260px] text-[14px] text-slate-500">
          Les leads apparaîtront ici lorsqu&apos;ils seront disponibles.
        </p>
      </div>
    );
  }

  return (
    <section className="mt-6 space-y-6">
      {data.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </section>
  );
}
