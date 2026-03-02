/**
 * Domain types for leads module
 */

import type { Lead } from "@/types/lead";

export interface ListLeadsParams {
  page: number;
  limit: number;
}

export interface ListLeadsResult {
  leads: Lead[];
  count: number;
  totalPages: number;
}

export type LeadUpdatePayload = Partial<{
  status: string;
  contact_name: string;
  phone: string;
  address: string;
  request_text: string;
  urgency: number;
  job_type: string;
  score: number;
}>;
