"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  MapPin,
  PhoneCall,
} from "lucide-react";
import type { Lead, LeadDetailResponse } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";

const API_BASE = "";

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
    // TODO: intégration Twilio
    console.log(`Appel vers ${lead.client_phone}`);
  };

  const handleMarkDone = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Utilise status \"complete\" pour rester compatible avec l'API actuelle
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
      <div className="flex flex-1 flex-col px-4">
        <div className="mt-4 h-6 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex flex-1 flex-col pb-4">
        <header className="card sticky top-0 z-10 flex items-center gap-2 backdrop-blur">
          <Link
            href="/mobile/leads"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">
            Demande client
          </h1>
        </header>
        <div className="mt-8 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{error || "Lead non trouvé"}</span>
        </div>
      </div>
    );
  }

  const statusBadgeClass =
    lead.status === "complete"
      ? "badge badge-complete"
      : lead.status === "incomplete"
        ? "badge badge-incomplete"
        : "badge badge-urgent";

  return (
    <div className="flex flex-1 flex-col gap-3 pb-4">
      <header className="card sticky top-0 z-10 flex items-center gap-2 backdrop-blur">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">
          Demande client
        </h1>
      </header>

      <section className="card">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="detail-value mb-0 text-lg font-semibold">
              {lead.full_name || "Client inconnu"}
            </p>
            <button
              type="button"
              onClick={handleCall}
              className="detail-value mb-0 text-sm font-medium text-blue-600"
            >
              {lead.client_phone || "Numéro inconnu"}
            </button>
          </div>
          <span className={statusBadgeClass}>
            {LEAD_STATUS_LABELS[lead.status]}
          </span>
        </div>
        {lead.address && (
          <div className="mt-2 flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-slate-500" />
            <span className="line-clamp-2 detail-value mb-0 text-xs">
              {lead.address}
            </span>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="detail-label mb-2">DEMANDE</h2>
        <div>
          <p className="detail-label">Type</p>
          <p className="detail-value">{formatType(lead)}</p>
        </div>
        <div>
          <p className="detail-label">Délai</p>
          <p className="detail-value">{formatDelay(lead)}</p>
        </div>
        <div>
          <p className="detail-label">Description</p>
          <p className="detail-value whitespace-pre-wrap">
            {lead.description || lead.raw_message || "Aucun message"}
          </p>
        </div>
      </section>

      <section className="card">
        <h2 className="detail-label mb-2">SCORING</h2>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="detail-label">Score de priorité</p>
            <p className="detail-value mb-0 text-2xl font-semibold">
              {lead.priority_score ?? "—"}
            </p>
          </div>
          <div className="w-24">
            <div className="h-1.5 w-full rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-emerald-500"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, lead.priority_score ?? 0),
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
        <div>
          <p className="detail-label">Valeur estimée</p>
          <div className="detail-value mb-0 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-700">
            {lead.value_estimate === "high"
              ? "Élevée"
              : lead.value_estimate === "medium"
                ? "Moyenne"
                : lead.value_estimate === "low"
                  ? "Faible"
                  : "Non estimée"}
          </div>
        </div>
        <div>
          <p className="detail-label">Relances</p>
          <div className="detail-value mb-0">
            {lead.relance_count && lead.relance_count > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-sm font-medium text-orange-600">
                <AlertCircle className="h-3 w-3" />
                {lead.relance_count} relance
                {lead.relance_count > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-slate-500">Aucune</span>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <button
          type="button"
          onClick={handleCall}
          className="call-btn flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={!lead.client_phone}
        >
          <PhoneCall className="h-5 w-5" />
          Rappeler maintenant
        </button>

        <button
          type="button"
          onClick={handleMarkDone}
          className="secondary-btn flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Enregistrement…" : "Marquer comme traité"}
        </button>
      </section>
    </div>
  );
}

