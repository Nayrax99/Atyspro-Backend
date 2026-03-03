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
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 rounded-[16px] bg-white" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-[12px] bg-[#ffebee] px-5 py-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-[#ff3b30]" />
        <span className="text-[15px] font-medium text-[#c62828]">{error}</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e5e5ea]">
          <AlertCircle className="h-7 w-7 text-[#8e8e93]" />
        </div>
        <p className="mt-6 text-[17px] font-semibold text-[#1c1c1e]">Aucun lead</p>
        <p className="mt-2 max-w-[260px] text-[15px] font-normal text-[#8e8e93] leading-snug">
          Les leads apparaîtront ici lorsqu&apos;ils seront disponibles.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {data.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </section>
  );
}
