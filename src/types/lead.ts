/**
 * Types pour les leads AtysPro
 * Alignés sur le schéma Supabase (table leads).
 */

export type LeadStatus = "complete" | "incomplete" | "needs_review";

export type LeadValueEstimate = "low" | "medium" | "high" | null;

export interface Lead {
  id: string;
  account_id: string;
  status: LeadStatus;
  client_phone: string | null;
  full_name: string | null;
  type_code: number | null; // 1-4
  delay_code: number | null; // 1-4
  priority_score: number | null; // 0-100
  value_estimate: LeadValueEstimate;
  address: string | null;
  description: string | null;
  raw_message: string | null;
  relance_count: number | null;
  created_at: string;
  updated_at?: string;
}

export interface LeadsResponse {
  success: boolean;
  data: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface LeadDetailResponse {
  success: boolean;
  data: Lead;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  complete: "Complet",
  incomplete: "Incomplet",
  needs_review: "À vérifier",
};

export function formatType(lead: Pick<Lead, "type_code">): string {
  switch (lead.type_code) {
    case 1:
      return "Dépannage";
    case 2:
      return "Installation";
    case 3:
      return "Devis";
    case 4:
      return "Autre";
    default:
      return "Non renseigné";
  }
}

export function formatDelay(lead: Pick<Lead, "delay_code">): string {
  switch (lead.delay_code) {
    case 1:
      return "Aujourd'hui (urgent)";
    case 2:
      return "48h";
    case 3:
      return "Cette semaine";
    case 4:
      return "Pas pressé";
    default:
      return "Non renseigné";
  }
}

export function formatRelativeTime(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin}min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffD < 7) return `il y a ${diffD}j`;
  return new Date(createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
