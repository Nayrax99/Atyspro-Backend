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
      <div className="space-y-4">
        <div className="h-8 w-32 rounded bg-slate-200" />
        <div className="h-48 rounded-[18px] bg-slate-200" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-4">
        <Link
          href="/mobile/leads"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour
        </Link>
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error || "Lead non trouvé"}</span>
        </div>
      </div>
    );
  }

  const score = lead.priority_score ?? 0;

  return (
    <div className="space-y-4">
      <Link
        href="/mobile/leads"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600"
      >
        <ChevronLeft className="h-4 w-4" />
        Retour
      </Link>

      <section className="rounded-[18px] bg-white p-4 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-800">
              {lead.full_name || "Client inconnu"}
            </p>
            <button
              type="button"
              onClick={handleCall}
              className="mt-1 text-sm font-medium text-blue-600"
            >
              {lead.client_phone || "—"}
            </button>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getScoreBadgeClass(
              lead.priority_score
            )}`}
          >
            Score {lead.priority_score ?? "—"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Type
            </p>
            <p className="font-medium text-slate-700">{formatType(lead)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Délai
            </p>
            <p className="font-medium text-slate-700">{formatDelay(lead)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Statut
            </p>
            <p className="font-medium text-slate-700">
              {LEAD_STATUS_LABELS[lead.status]}
            </p>
          </div>
          {lead.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">{lead.address}</p>
            </div>
          )}
        </div>
      </section>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleCall}
          disabled={!lead.client_phone}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-md disabled:opacity-50"
        >
          <PhoneCall className="h-5 w-5" />
          Appeler
        </button>
        <button
          type="button"
          onClick={handleUpdateStatus}
          disabled={saving || lead.status === "complete"}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-4 font-medium text-slate-700 shadow-sm disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Marquer comme traité"}
        </button>
      </div>
    </div>
  );
}
