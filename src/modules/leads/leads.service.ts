/**
 * Leads domain service - business logic for leads
 */

import { supabase } from "@/lib/supabase";
import type { Lead } from "@/types/lead";
import type { ListLeadsParams, ListLeadsResult, LeadUpdatePayload } from "./leads.types";

export async function listLeads(
  params: ListLeadsParams
): Promise<ListLeadsResult> {
  const { page, limit } = params;
  const offset = (page - 1) * limit;

  const { data: leads, error, count } = await supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / limit) : 0;

  return {
    leads: (leads || []) as Lead[],
    count: count || 0,
    totalPages,
  };
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  return lead as Lead | null;
}

export async function updateLeadById(
  id: string,
  updates: LeadUpdatePayload
): Promise<Lead | null> {
  const { data: updatedLead, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  return updatedLead as Lead | null;
}
