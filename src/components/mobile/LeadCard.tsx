"use client";

import Link from "next/link";
import type { Lead } from "@/types/lead";
import { formatType, formatRelativeTime } from "@/types/lead";

interface LeadCardProps {
  lead: Lead;
}

function getScoreClass(score: number | null): string {
  if (score == null) return "bg-[#e5e5ea] text-[#8e8e93]";
  if (score >= 80) return "bg-[#007AFF] text-white";
  if (score >= 50) return "bg-[#ff9500] text-white";
  return "bg-[#e5e5ea] text-[#6e6e73]";
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
      className="block rounded-[16px] bg-white p-5 active:opacity-95"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold text-[#1c1c1e] leading-tight">
            {lead.full_name || "Client inconnu"}
          </p>
          <p className="mt-0.5 text-[15px] font-normal text-[#8e8e93]">
            {lead.client_phone || "—"}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            {tagLabel ? (
              <span className="rounded-md bg-[#f2f2f7] px-2 py-0.5 text-[13px] font-medium text-[#6e6e73]">
                {tagLabel}
              </span>
            ) : (
              <span />
            )}
            <span className="text-[13px] font-normal text-[#8e8e93]">
              {formatRelativeTime(lead.created_at)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-start">
          <span
            className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${getScoreClass(
              lead.priority_score
            )}`}
          >
            {lead.priority_score ?? "—"}
          </span>
        </div>
      </div>
    </Link>
  );
}
