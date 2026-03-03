/**
 * Clients Supabase
 * - supabase : anon key, rétrocompatibilité temporaire
 * - supabaseAdmin : service_role, bypass RLS (webhooks, admin)
 * - createSupabaseClient(token) : anon + JWT user pour RLS
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Client anon (rétrocompatibilité) - soumis au RLS */
export const supabase = createClient(url, anonKey);

/** Client service_role - bypass RLS, pour webhooks Twilio et opérations admin */
export const supabaseAdmin =
  serviceRoleKey != null && serviceRoleKey !== ""
    ? createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : (null as SupabaseClient | null);

/**
 * Crée un client Supabase avec le JWT utilisateur.
 * Utilisé par les endpoints API authentifiés - soumis au RLS.
 */
export function createSupabaseClient(token: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
}
