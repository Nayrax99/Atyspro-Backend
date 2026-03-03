"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ChevronLeft, MapPin, PhoneCall } from "lucide-react";
import type { Lead, LeadDetailResponse } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";

const API_BASE = "";

function getScoreBadgeClass(score: number | null): string {
  if (score == null) return "bg-slate-200 text-slate-600";
  if (score >= 80) return "bg-blue-600 text-white";
  if (score >= 50) return "bg-amber-500 text-white";
  return "bg-slate-300 text-slate-600";
}

export default function MobileLeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/leads/${id}`)
      .then((res) => res.json())
      .then((json: LeadDetailResponse & { error?: string }) => {
        if (cancelled) return;
        if (!json.success) {
          setError(json.error || "Lead non trouvé");
          setLead(null);
          return;
        }
        setLead(json.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Erreur réseau");
          setLead(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCall = () => {
    if (!lead?.client_phone) return;
    console.log(`Appel vers ${lead.client_phone}`);
  };

  const handleUpdateStatus = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "complete" }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: Lead;
        error?: string;
      };
      if (json.success && json.data) {
        setLead(json.data);
        router.push("/mobile/leads");
      } else {
        console.error("Erreur PATCH lead:", json.error);
      }
    } catch (e) {
      console.error("Erreur réseau PATCH lead:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !lead) {
    return (
      <div className="space-y-5">
        <div className="h-6 w-24 rounded-lg bg-slate-100" />
        <div className="h-64 rounded-[20px] bg-slate-100" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-5">
        <Link
          href="/mobile/leads"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Link>
        <div className="flex items-center gap-3 rounded-[20px] border border-red-100 bg-red-50/80 px-5 py-4 text-sm font-medium text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || "Lead non trouvé"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/mobile/leads"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour
      </Link>

      <section
        className="rounded-[20px] bg-white p-6"
        style={{
          boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-800">
              {lead.full_name || "Client inconnu"}
            </h1>
            <button
              type="button"
              onClick={handleCall}
              className="mt-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              {lead.client_phone || "—"}
            </button>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${getScoreBadgeClass(
              lead.priority_score
            )}`}
          >
            Score {lead.priority_score ?? "—"}
          </span>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Type
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-700">{formatType(lead)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Délai
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-700">{formatDelay(lead)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Statut
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-700">
              {LEAD_STATUS_LABELS[lead.status]}
            </p>
          </div>
          {lead.address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                {lead.address}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={handleCall}
          disabled={!lead.client_phone}
          className="flex w-full items-center justify-center gap-2.5 rounded-[20px] px-6 py-4 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)",
            boxShadow: lead.client_phone
              ? "0 8px 24px rgba(37, 99, 235, 0.35)"
              : "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <PhoneCall className="h-5 w-5" strokeWidth={2} />
          Appeler
        </button>
        <button
          type="button"
          onClick={handleUpdateStatus}
          disabled={saving || lead.status === "complete"}
          className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-slate-200 bg-white px-6 py-4 font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Marquer comme traité"}
        </button>
      </div>
    </div>
  );
}
