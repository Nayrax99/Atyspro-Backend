/**
 * Leads domain service - business logic for leads
 * Utilise un client Supabase authentifié (JWT) pour le RLS.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead } from "@/types/lead";
import type { ListLeadsParams, ListLeadsResult, LeadUpdatePayload } from "./leads.types";

export async function listLeads(
  client: SupabaseClient,
  params: ListLeadsParams
): Promise<ListLeadsResult> {
  const { account_id, page, limit } = params;
  const offset = (page - 1) * limit;

  const { data: leads, error, count } = await client
    .from("leads")
    .select("*", { count: "exact" })
    .eq("account_id", account_id)
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

export async function getLeadById(
  client: SupabaseClient,
  id: string,
  account_id: string
): Promise<Lead | null> {
  const { data: lead, error } = await client
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("account_id", account_id)
    .maybeSingle();

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  return lead as Lead | null;
}

export async function updateLeadById(
  client: SupabaseClient,
  id: string,
  account_id: string,
  updates: LeadUpdatePayload
): Promise<Lead | null> {
  const { data: updatedLead, error } = await client
    .from("leads")
    .update(updates)
    .eq("id", id)
    .eq("account_id", account_id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`);
  }

  return updatedLead as Lead | null;
}
