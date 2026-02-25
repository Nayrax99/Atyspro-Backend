"use client";

import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
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

function scoreTextClass(score: number | null): string {
  if (score == null) return "text-slate-300";
  if (score === 0) return "text-slate-300";
  if (score <= 39) return "text-red-500";
  if (score <= 69) return "text-amber-500";
  if (score <= 89) return "text-emerald-500";
  return "text-emerald-600";
}

function scoreBarColor(score: number | null): string {
  if (score == null) return "bg-slate-200";
  if (score <= 39) return "bg-red-500";
  if (score <= 69) return "bg-amber-500";
  return "bg-emerald-500";
}

function isNewLead(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created < 24 * 60 * 60 * 1000;
}

function isShortDelay(delayCode: number | null): boolean {
  return delayCode === 1 || delayCode === 2;
}

export function LeadCard({ lead }: LeadCardProps) {
  const score = lead.priority_score ?? 0;
  const width = Math.max(0, Math.min(100, score));
  const serviceType = formatType(lead);
  const delayText = formatDelay(lead);

  return (
    <Link
      href={`/mobile/leads/${lead.id}`}
      className="lead-card card card-hover block"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className={statusBadgeClass(lead.status)}>
            {LEAD_STATUS_LABELS[lead.status]}
          </span>
          <div className="flex items-center gap-2">
            {lead.relance_count != null && lead.relance_count > 0 && (
              <span className="relances-text">
                {lead.relance_count} relance{lead.relance_count > 1 ? "s" : ""}
              </span>
            )}
            {isNewLead(lead.created_at) && (
              <span className="badge badge-new">
                Nouveau
              </span>
            )}
          </div>
        </div>

        <div>
          <p
            className={`text-base font-semibold ${
              lead.full_name ? "text-slate-900" : "italic text-slate-400"
            }`}
          >
            {lead.full_name || "Client inconnu"}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm font-mono tracking-wide text-slate-500">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            {lead.client_phone || "—"}
          </div>
          <div className="mt-1">
            {serviceType !== "Non renseigné" ? (
              <span className="inline-block rounded-md bg-slate-50 px-2 py-0.5 text-sm font-medium text-slate-700">
                {serviceType}
              </span>
            ) : (
              <span className="italic text-slate-300">Non renseigné</span>
            )}
          </div>
        </div>

        <div className="score-section flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span
              className={`text-sm ${
                delayText === "Non renseigné"
                  ? "text-slate-300"
                  : isShortDelay(lead.delay_code)
                    ? "font-medium text-amber-600"
                    : "text-slate-500"
              }`}
            >
              {delayText}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              SCORE
            </span>
            <span className={`text-lg font-bold ${scoreTextClass(lead.priority_score)}`}>
              {lead.priority_score != null ? lead.priority_score : "—"}
            </span>
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${scoreBarColor(lead.priority_score)}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        </div>

        {lead.address && (
          <div className="flex items-start gap-1.5 border-t border-slate-50 pt-3">
            <MapPin
              className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
              aria-hidden
            />
            <p className="line-clamp-2 text-xs leading-snug text-slate-400">
              {lead.address}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
