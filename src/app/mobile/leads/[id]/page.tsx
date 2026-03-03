"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ChevronLeft, MapPin, PhoneCall } from "lucide-react";
import type { Lead, LeadDetailResponse } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";

const API_BASE = "";

function getScoreClass(score: number | null): string {
  if (score == null) return "bg-[#e5e5ea] text-[#8e8e93]";
  if (score >= 80) return "bg-[#007AFF] text-white";
  if (score >= 50) return "bg-[#ff9500] text-white";
  return "bg-[#e5e5ea] text-[#6e6e73]";
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
      <div className="space-y-6">
        <div className="h-6 w-20 rounded bg-[#e5e5ea]" />
        <div className="h-72 rounded-[16px] bg-white" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }} />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-6">
        <Link
          href="/mobile/leads"
          className="inline-flex items-center gap-1 text-[17px] font-normal text-[#007AFF]"
        >
          <ChevronLeft className="h-5 w-5" />
          Retour
        </Link>
        <div className="flex items-center gap-3 rounded-[12px] bg-[#ffebee] px-5 py-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-[#ff3b30]" />
          <span className="text-[15px] font-medium text-[#c62828]">{error || "Lead non trouvé"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/mobile/leads"
        className="inline-flex items-center gap-1 text-[17px] font-normal text-[#007AFF]"
      >
        <ChevronLeft className="h-5 w-5" />
        Retour
      </Link>

      <section
        className="rounded-[16px] bg-white p-6"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-semibold text-[#1c1c1e] leading-tight">
              {lead.full_name || "Client inconnu"}
            </h1>
            <button
              type="button"
              onClick={handleCall}
              className="mt-0.5 text-[15px] font-normal text-[#007AFF]"
            >
              {lead.client_phone || "—"}
            </button>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold ${getScoreClass(
              lead.priority_score
            )}`}
          >
            {lead.priority_score ?? "—"}
          </span>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <p className="text-[13px] font-normal text-[#8e8e93]">Type</p>
            <p className="mt-0.5 text-[17px] font-normal text-[#1c1c1e]">{formatType(lead)}</p>
          </div>
          <div>
            <p className="text-[13px] font-normal text-[#8e8e93]">Délai</p>
            <p className="mt-0.5 text-[17px] font-normal text-[#1c1c1e]">{formatDelay(lead)}</p>
          </div>
          <div>
            <p className="text-[13px] font-normal text-[#8e8e93]">Statut</p>
            <p className="mt-0.5 text-[17px] font-normal text-[#1c1c1e]">
              {LEAD_STATUS_LABELS[lead.status]}
            </p>
          </div>
          {lead.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8e8e93]" />
              <p className="text-[15px] font-normal leading-relaxed text-[#1c1c1e]">
                {lead.address}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleCall}
          disabled={!lead.client_phone}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#007AFF] px-6 py-4 text-[17px] font-semibold text-white active:opacity-80 disabled:opacity-40"
        >
          <PhoneCall className="h-5 w-5" strokeWidth={2} />
          Appeler
        </button>
        <button
          type="button"
          onClick={handleUpdateStatus}
          disabled={saving || lead.status === "complete"}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#e5e5ea] px-6 py-4 text-[17px] font-semibold text-[#1c1c1e] active:opacity-80 disabled:opacity-40"
        >
          {saving ? "Enregistrement…" : "Marquer comme traité"}
        </button>
      </div>
    </div>
  );
}
