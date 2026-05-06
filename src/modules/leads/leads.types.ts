/**
 * Domain types for leads module
 */

import type { Lead } from "@/types/lead";

export interface ListLeadsParams {
  account_id: string;
  page: number;
  limit: number;
  status?: string;
  statuses?: string[]; // multiple statuses filter (uses IN query)
  search?: string;
}

export interface ListLeadsResult {
  leads: Lead[];
  count: number;
  totalPages: number;
}

export type LeadUpdatePayload = Partial<{
  status: string;
  address: string;
}>;
