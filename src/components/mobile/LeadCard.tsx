"use client";

import Link from "next/link";
import type { Lead } from "@/types/lead";
import { formatType, formatRelativeTime } from "@/types/lead";

interface LeadCardProps {
  lead: Lead;
}

function getScoreClass(score: number | null): string {
  if (score == null) return "bg-slate-100 text-slate-600";
  if (score >= 85) return "bg-blue-100 text-blue-600";
  if (score >= 70) return "bg-amber-100 text-amber-600";
  return "bg-slate-100 text-slate-600";
}

function getTagLabel(lead: Lead): string {
  const type = formatType(lead);
  const isUrgent = lead.delay_code === 1;
  if (type === "Non renseigné" && !isUrgent) return "";
  return isUrgent ? `${type} urgent` : type;
}

export function LeadCard({ lead }: LeadCardProps) {
  const tagLabel = getTagLabel(lead);

  return (
    <Link
      href={`/mobile/leads/${lead.id}`}
      className="block rounded-[24px] border border-[#f1f3f6] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <p className="min-w-0 flex-1 truncate text-[17px] font-semibold text-slate-900">
            {lead.full_name || "Client inconnu"}
          </p>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium ${getScoreClass(
              lead.priority_score
            )}`}
          >
            Score {lead.priority_score ?? "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="min-w-0 flex-1 truncate text-[14px] text-slate-500">
            {lead.client_phone || "—"}
          </p>
          <span className="shrink-0 text-[12px] text-slate-400">
            {formatRelativeTime(lead.created_at)}
          </span>
        </div>
        {tagLabel && (
          <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-[12px] text-slate-600">
            {tagLabel}
          </span>
        )}
      </div>
    </Link>
  );
}
