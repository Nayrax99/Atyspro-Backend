"use client";

import Link from "next/link";
import { Clock, MapPin, Phone, Zap } from "lucide-react";
import type { Lead } from "@/types/lead";
import { LEAD_STATUS_LABELS, formatDelay, formatType } from "@/types/lead";

interface LeadCardProps {
  lead: Lead;
}

function statusBadgeClass(status: Lead["status"]): string {
  if (status === "complete") return "badge badge-complete";
  if (status === "incomplete") return "badge badge-incomplete";
  if (status === "needs_review") return "badge badge-urgent";
  return "badge badge-new";
}

function scoreTextGradient(score: number | null): string {
  if (score == null || score === 0) return "text-slate-400";
  if (score <= 39) return "text-red-500";
  if (score <= 69) return "text-amber-500";
  if (score <= 89) return "text-emerald-600";
  return "text-emerald-700";
}

function scoreBarGradient(score: number | null): string {
  if (score == null || score === 0) return "bg-slate-200";
  if (score <= 39) return "bg-gradient-to-r from-red-400 to-red-500";
  if (score <= 69) return "bg-gradient-to-r from-amber-400 to-amber-500";
  return "bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700";
}

function formatValueEstimate(value: Lead["value_estimate"]): string {
  switch (value) {
    case "low":
      return "Basse";
    case "medium":
      return "Moyenne";
    case "high":
      return "Haute";
    default:
      return "—";
  }
}

function isNewLead(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created < 24 * 60 * 60 * 1000;
}

function isShortDelay(delayCode: number | null): boolean {
  return delayCode === 1 || delayCode === 2;
}

/**
 * LeadCard premium - Design AtysPro niveau Uber/Airbnb/Revolut
 * Barre gradient gauche au hover, score shimmer, meta items avec fond gradient
 */
export function LeadCard({ lead }: LeadCardProps) {
  const score = lead.priority_score ?? 0;
  const width = Math.max(0, Math.min(100, score));
  const serviceType = formatType(lead);
  const delayText = formatDelay(lead);

  return (
    <Link
      href={`/mobile/leads/${lead.id}`}
      className="lead-card card card-hover relative block"
    >
      <div className="space-y-4">
        {/* Ligne 1: Badge status + NOUVEAU (position absolute top-right) */}
        <div className="flex items-center justify-between gap-2">
          <span className={statusBadgeClass(lead.status)}>
            {LEAD_STATUS_LABELS[lead.status]}
          </span>
          <div className="flex items-center gap-2">
            {lead.relance_count != null && lead.relance_count > 0 && (
              <span className="relances-text">
                {lead.relance_count} relance
                {lead.relance_count > 1 ? "s" : ""}
              </span>
            )}
            {isNewLead(lead.created_at) && (
              <span
                className="absolute right-6 top-6 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase"
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "white",
                  animation:
                    "badge-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
                }}
              >
                Nouveau
              </span>
            )}
          </div>
        </div>

        {/* Nom + Téléphone */}
        <div>
          <p
            className={`text-[22px] font-extrabold leading-tight tracking-[-0.5px] ${
              lead.full_name ? "text-slate-900" : "italic text-slate-400"
            }`}
          >
            {lead.full_name || "Client inconnu"}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[15px] font-semibold tracking-wide text-slate-500">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            {lead.client_phone || "—"}
          </div>
        </div>

        {/* Meta grid: Type + Délai - fond gradient, icône cercle bleu→violet */}
        <div className="grid grid-cols-2 gap-3">
          <div className="meta-item flex items-center gap-3">
            <div
              className="meta-item-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              }}
            >
              <Zap className="h-4 w-4 text-white" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Type
              </p>
              <p className="text-sm font-bold text-slate-700">
                {serviceType !== "Non renseigné" ? serviceType : "—"}
              </p>
            </div>
          </div>
          <div className="meta-item flex items-center gap-3">
            <div
              className="meta-item-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              }}
            >
              <Clock className="h-4 w-4 text-white" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Délai
              </p>
              <p
                className={`text-sm font-bold ${
                  delayText === "Non renseigné"
                    ? "text-slate-400"
                    : isShortDelay(lead.delay_code)
                      ? "text-amber-600"
                      : "text-slate-700"
                }`}
              >
                {delayText !== "Non renseigné"
                  ? delayText.replace(" (urgent)", "")
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* SCORE SECTION - gradient background + barre shimmer */}
        <div className="score-section">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Score priorité
            </span>
            <span
              className={`text-lg font-extrabold ${scoreTextGradient(
                lead.priority_score
              )}`}
              style={{
                background:
                  lead.priority_score != null && lead.priority_score > 0
                    ? "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #fbbf24 100%)"
                    : undefined,
                WebkitBackgroundClip:
                  lead.priority_score != null && lead.priority_score > 0
                    ? "text"
                    : undefined,
                WebkitTextFillColor:
                  lead.priority_score != null && lead.priority_score > 0
                    ? "transparent"
                    : undefined,
                backgroundClip:
                  lead.priority_score != null && lead.priority_score > 0
                    ? "text"
                    : undefined,
              }}
            >
              {lead.priority_score != null ? lead.priority_score : "—"}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`score-bar-shimmer h-full rounded-full ${scoreBarGradient(
                lead.priority_score
              )}`}
              style={{
                width: `${width}%`,
                boxShadow:
                  width > 0
                    ? "0 0 12px rgba(37, 99, 235, 0.4)"
                    : undefined,
              }}
            />
          </div>
        </div>

        {/* Valeur estimée */}
        {lead.value_estimate && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">💰</span>
            <span className="font-semibold text-slate-600">
              Valeur : {formatValueEstimate(lead.value_estimate)}
            </span>
          </div>
        )}

        {/* Adresse */}
        {lead.address && (
          <div className="flex items-start gap-2 rounded-xl bg-slate-50/80 px-4 py-3">
            <MapPin
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
              aria-hidden
            />
            <p className="line-clamp-2 text-xs font-semibold leading-snug text-slate-500">
              {lead.address}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
